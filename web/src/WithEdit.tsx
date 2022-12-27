import { toast } from "react-toastify";
import { BindingFunction, useBinding } from "./useBinding";
import { post } from "./useData";
import WithData from "./WithData";

export type EditRenderFunction<T> = (args: {
  bind: BindingFunction<T>;
  value: T;
}) => JSX.Element | null;

export function RenderEdit<T>(props: {
  url: string;
  value: T;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  render: EditRenderFunction<T>;
  onPreSave?: (value: T) => void;
}) {
  const bind = useBinding(props.value, {
    update: () => {
      if (props.onPreSave !== undefined) props.onPreSave(props.value);
      post(props.url)
        .body(props.value)
        .success(() => {
          toast.success("Saved");
          if (props.onSuccess !== undefined) props.onSuccess();
        })
        .error(props.onError ?? "Error during save")
        .send();
    },
  });
  return props.render({
    value: props.value,
    bind,
  });
}

export function WithEdit<T>(props: {
  url: string;
  onSuccess?: () => void;
  render: EditRenderFunction<T>;
  onPreSave?: (value: T) => void;
}) {
  return (
    <WithData<T>
      url={props.url}
      render={(value, trigger) => (
        <RenderEdit
          value={value}
          {...props}
          onSuccess={() => {
            trigger();
            if (props.onSuccess !== undefined) props.onSuccess();
          }}
        />
      )}
    />
  );
}
