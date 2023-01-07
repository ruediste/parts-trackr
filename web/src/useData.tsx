import { ReactElement, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import useDeepCompareEffect from "use-deep-compare-effect";

export type QueryStringObj = {
  [key: string]: string | null | undefined | number;
};

/** convert the object to a query string, prefixed with an ampersand (&) if non-empty */
const toQueryString = (obj: QueryStringObj) => {
  let entries = Object.entries(obj);
  if (entries.length === 0) return "";

  let params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value == null) continue;
    if (typeof value === "number") params.append(key, "" + value);
    else params.append(key, value);
  }
  return "?" + params.toString();
};

export const baseUrl = "/";

export class Request {
  constructor(public url: string) {}

  _body?: any;
  body(value: any) {
    this._body = value;
    return this;
  }

  _bodyRaw?: any;
  bodyRaw(value: any) {
    this._bodyRaw = value;
    return this;
  }

  _method: string = "GET";
  method(value: "GET" | "POST" | "DELETE") {
    this._method = value;
    return this;
  }

  _query?: { [key: string]: string };
  query(value: { [key: string]: string }) {
    this._query = value;
    return this;
  }

  _success?: ((data: any) => any) | string;
  success(value: ((data: any) => any) | string) {
    this._success = value;
    return this;
  }

  _error?: ((error: any) => any) | string;
  error(value: ((error: any) => any) | string) {
    this._error = value;
    return this;
  }

  private handleSuccess(data: any) {
    if (typeof this._success === "string") toast.success(this._success);
    else if (this._success !== undefined) this._success(data);
  }

  private handleError(error: any) {
    if (this._error === undefined) toast.error(error.toString());
    else if (typeof this._error === "string")
      toast.error(this._error + ": " + error.toString());
    else this._error(error);
  }

  private buildUrl() {
    return (
      baseUrl +
      this.url +
      (this._query === undefined ? "" : toQueryString(this._query))
    );
  }

  upload(onProgress: (args: { loaded: number; total: number }) => void) {
    const xhr = new XMLHttpRequest();
    xhr.onload = (e) => this.handleSuccess(xhr.response);
    xhr.upload.onerror = (e) => this.handleError(e.type);
    xhr.onerror = (e) => this.handleError(e.type);
    xhr.upload.onprogress = (e) => onProgress(e);
    xhr.open("POST", this.buildUrl(), true);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.send(this._bodyRaw);
  }

  send() {
    const init: RequestInit = { method: this._method };
    if (this._body !== undefined) {
      init.body = JSON.stringify(this._body);
      init.headers = { "Content-Type": "application/json" };
    }
    if (this._bodyRaw !== undefined) {
      init.body = this._bodyRaw;
      init.headers = { "Content-Type": "application/octet-stream" };
    }

    let tmp = fetch(this.buildUrl(), init).then((r) => {
      if (!r.ok) {
        throw Error(r.status + ": " + r.statusText);
      }
      if (this._success === undefined || typeof this._success === "string")
        return null;
      if (r.headers.get("Content-Type") === "application/json") return r.json();
      return null;
    });
    if (this._success !== undefined)
      tmp = tmp.then((data) => this.handleSuccess(data));
    tmp.catch((error) => this.handleError(error));
  }
}

export function req(url: string) {
  return new Request(url);
}
export function post(url: string) {
  return new Request(url).method("POST");
}

export abstract class Observable {
  abstract subscribe(callback: () => void): void;
  abstract unsubscribe(callback: () => void): void;
}

class ObservalbeImpl implements Observable {
  private callbacks: Set<() => void> = new Set();
  subscribe(callback: () => void): void {
    this.callbacks.add(callback);
  }
  unsubscribe(callback: () => void): void {
    this.callbacks.delete(callback);
  }
  trigger = () => this.callbacks.forEach((x) => x());
}

export function useObservable(): [Observable, () => void] {
  const observable = useRef(new ObservalbeImpl()).current;
  return [observable, observable.trigger];
}

export interface UseDataArgs<T> {
  url: string;
  queryParams?: QueryStringObj;
  refresh?: Observable;
  refreshMs?: number;
  initialData?: T;
}

export type Data<T> = { trigger: () => void; placeholder?: ReactElement } & (
  | { state: "loading"; placeholder: ReactElement }
  | { state: "success"; value: T }
  | { state: "error"; error: string; placeholder: ReactElement }
);

class DataLoader<T> {
  closed = false;

  timeout?: NodeJS.Timeout;

  constructor(
    public args: Omit<UseDataArgs<T>, "refresh">,
    public setData: (data: Data<T>) => void
  ) {}

  public setLoadedData(data: T) {
    this.setData({
      state: "success",
      value: data,
      trigger: this.performLoad,
    });
    if (this.args.refreshMs !== undefined)
      this.timeout = setTimeout(this.performLoad, this.args.refreshMs);
  }

  performLoad = () => {
    if (this.closed) return;
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    fetch(
      baseUrl + this.args.url + toQueryString(this.args.queryParams ?? {}),
      {}
    )
      .then((r) => {
        if (!r.ok) throw Error(r.statusText);
        if (r.status === 204) {
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (this.closed) return;
        this.setLoadedData(d as T);
      })
      .catch((error) => {
        console.log("catch", error);
        if (this.closed) return;
        this.setData({
          state: "error",
          error: error.toString(),
          trigger: this.performLoad,
          placeholder: (
            <div className="alert alert-danger" role="alert">
              Error loading data: {error.toString()}
            </div>
          ),
        });
        if (this.args.refreshMs !== undefined)
          this.timeout = setTimeout(this.performLoad, this.args.refreshMs);
      });
  };

  close() {
    this.closed = true;
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }
}

export default function useData<T>(args: UseDataArgs<T>): Data<T> {
  let dataLoaderRef = useRef<DataLoader<T>>();
  const [data, setData] = useState<Data<T>>({
    state: "loading",
    trigger: () => dataLoaderRef.current?.performLoad(),
    placeholder: (
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    ),
  });

  const { refresh, ...others } = args;

  useEffect(() => {
    if (refresh !== undefined) {
      const performLoad = () => dataLoaderRef.current?.performLoad();
      refresh.subscribe(performLoad);
      return () => refresh.unsubscribe(performLoad);
    }
  }, [refresh]);

  const isInitial = useRef(true);
  useDeepCompareEffect(() => {
    const dataLoader = new DataLoader<T>(others, setData);
    if (isInitial.current && others.initialData !== undefined)
      dataLoader.setLoadedData(others.initialData);
    else dataLoader.performLoad();
    dataLoaderRef.current = dataLoader;
    isInitial.current = false;
    return () => dataLoader.close();
  }, [others]);
  return data;
}
