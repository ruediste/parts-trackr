import { toast } from "react-toastify";
import { BindingFunction, useBinding } from "./useBinding";
import { post } from "./useData";
import WithData from "./WithData";

export type EditRenderFunction<T> = (args: {
  bind: BindingFunction<T>;
  value: T;
}) => JSX.Element | null;

function RenderEdit<T>(props: {
  url: string;
  value: T;
  onSuccess?: () => void;
  render: EditRenderFunction<T>;
}) {
  const bind = useBinding(props.value, {
    update: () => {
      post(props.url)
        .body(props.value)
        .success(() => {
          toast.success("Saved");
          if (props.onSuccess !== undefined) props.onSuccess();
        })
        .error("Error during save")
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
