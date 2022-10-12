import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { ObjectBinder, useBinder } from "./useBinding";
import { post } from "./useData";
import WithData from "./WithData";

function RenderEdit<T>(props: {
  url: string;
  value: T;
  render: (
    binder: ObjectBinder<T>,
    save: (onSuccess?: () => void) => void
  ) => JSX.Element | null;
}) {
  console.log("RenderEdit");
  const binder = useBinder(props.value);
  useEffect(() => {
    binder.current.loadFrom(props.value);
  }, [props.value]);
  return props.render(binder.current, (onSuccess) => {
    const updatedValue = binder.current.read();
    post(props.url)
      .body(updatedValue)
      .success(() => {
        toast.success("Saved");
        if (onSuccess !== undefined) onSuccess();
      })
      .error("Error during save")
      .send();
  });
}

export function WithEdit<T>(props: {
  url: string;
  add?: boolean;
  render: (
    binder: ObjectBinder<T>,
    save: (onSuccess?: () => void) => void
  ) => JSX.Element | null;
}) {
  if (props.add === true) {
    return <RenderEdit value={{} as any} {...props} />;
  }
  return (
    <WithData<T>
      url={props.url}
      render={(value) => <RenderEdit value={value} {...props} />}
    />
  );
}
