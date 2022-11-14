import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { BindingFunction, useBinding } from "./useBinding";
import { post } from "./useData";
import WithData from "./WithData";

function RenderEdit<T>(props: {
  url: string;
  value: T;
  render: (args: {
    bind: BindingFunction<T>;
    save: (onSuccess?: () => void) => void;
    value: T;
  }) => JSX.Element | null;
}) {
  const bind = useBinding(props.value);
  return props.render({
    value: props.value,
    bind,
    save: (onSuccess) => {
      post(props.url)
        .body(props.value)
        .success(() => {
          toast.success("Saved");
          if (onSuccess !== undefined) onSuccess();
        })
        .error("Error during save")
        .send();
    },
  });
}

export function WithEdit<T>(props: {
  url: string;
  add?: boolean;
  addValue?: T;
  render: (args: {
    bind: BindingFunction<T>;
    save: (onSuccess?: () => void) => void;
    value: T;
  }) => JSX.Element | null;
}) {
  if (props.add === true) {
    return <RenderEdit value={props.addValue ?? ({} as any)} {...props} />;
  }
  return (
    <WithData<T>
      url={props.url}
      render={(value) => <RenderEdit value={value} {...props} />}
    />
  );
}
