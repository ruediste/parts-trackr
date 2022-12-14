import useData, { UseDataArgs } from "./useData";

export default function WithData<T>(
  props: UseDataArgs<T> & {
    render: (value: T, refresh: () => void) => JSX.Element | null;
  }
) {
  const { render, ...otherProps } = props;
  const data = useData<T>(otherProps);

  if (data.placeholder !== undefined) {
    return data.placeholder;
  }
  if (data.state === "success") {
    return render(data.value, data.trigger);
  }
  throw Error("unsupported state");
}
