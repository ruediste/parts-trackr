import { isValidInputTimeValue } from "@testing-library/user-event/dist/utils";
import { Dispatch, SetStateAction, useState, useEffect, useRef } from "react";
import { updateLanguageServiceSourceFile } from "typescript";

export class ObjectBinder<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  loadFrom(value: T) {
    this.subscriptions.forEach((sub) => {
      sub.update(value[sub.name]);
    });
  }

  storeTo(value: T) {
    this.subscriptions.forEach((sub) => {
      value[sub.name] = sub.get();
    });
  }

  read(): T {
    const result = {} as any;
    this.storeTo(result);
    return result;
  }

  private subscriptions: Set<{
    name: keyof T;
    update: (newValue: any) => void;
    get: () => any;
  }> = new Set();

  bind<Name extends keyof T>(name: Name): { binding: ValueBinding<T[Name]> } {
    return {
      binding: {
        initial: () => this.value[name],
        subscribe: (update, get) => {
          const entry = { update, get, name };
          this.subscriptions.add(entry);
          return () => this.subscriptions.delete(entry);
        },
      },
    };
  }
}

type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? T[K] : never;
}[keyof T];

export interface ValueBinding<T> {
  initial(): T;
  subscribe(update: (newValue: T) => void, get: () => T): () => void;
}

export function useBinder<T>(initial: T) {
  return useRef(new ObjectBinder(initial));
}

export function useBindingArray<T>(binding: ValueBinding<T[]>) {
  const createBindings: (array: T[]) => ValueBinding<T>[] = (array) =>
    array.map((item) => ({
      initial: () => item,
      subscribe: (update, get) => {
        return () => {};
      },
    }));
  const [arrayBindings, setArrayBindings] = useState(
    createBindings(binding.initial())
  );
  const arrayBindingsRef = useRef(arrayBindings);
  arrayBindingsRef.current = arrayBindings;
  useEffect(() => {
    return binding.subscribe(
      (array) => setArrayBindings(createBindings(array)),
      () => arrayBindingsRef.current.map((x) => x)
    );
  }, [binding]);
  const update = (func: (array: T[]) => void) => {
    setValue((value) => {
      const newValue = [...value];
      func(newValue);
      return newValue;
    });
  };
  return [
    value,
    {
      push: (item: T) => setValue((value) => [...value, item]),
      delete: (item: T) =>
        update((x) => {
          const index = x.indexOf(item);
          if (index > -1) x.splice(index, 1);
        }),
      update,
    },
  ];
}

export default function useBinding<T>(
  binding: ValueBinding<T>
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(binding.initial());
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    return binding.subscribe(setValue, () => valueRef.current);
  }, [binding]);
  return [value, setValue];
}
