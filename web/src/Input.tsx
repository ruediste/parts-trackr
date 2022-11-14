import { ReactElement } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { Binding, useForceUpdate } from "./useBinding";

export function Select<T>(props: {
  label?: string;
  options: { value: T; label: string }[];
  binding: Binding<T>;
}) {
  const update = useForceUpdate();
  return (
    <Form.Group className="mb-3">
      {props.label === undefined ? null : (
        <Form.Label>{props.label}</Form.Label>
      )}
      <Form.Select
        value={"" + props.binding.get()}
        onChange={(e) => props.binding.set(e.target.value as T).then(update)}
      >
        {props.options.map((opt, idx) => (
          <option key={idx} value={"" + opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}

export interface InputPropsBase {
  label?: string;
  placeholder?: string;
  afterElement?: ReactElement;
  onBlur?: () => void;
}

export interface InputPropsString extends InputPropsBase {
  type?: "text";
  binding: Binding<string>;
}

export interface InputPropsNumber extends InputPropsBase {
  type: "number";
  binding: Binding<number | undefined>;
}

export default function Input(props: InputPropsString | InputPropsNumber) {
  const update = useForceUpdate();
  return (
    <InputGroup className="mb-3">
      {props.label === undefined ? null : (
        <Form.Label>{props.label}</Form.Label>
      )}
      <Form.Control
        type={props.type}
        placeholder={props.placeholder}
        value={props.binding.get() ?? ""}
        onBlur={() => {
          if (props.onBlur !== undefined) props.onBlur();
        }}
        onChange={(e) => {
          if (props.type === undefined || props.type === "text")
            return props.binding.set(e.target.value).then(update);
          else if (props.type === "number")
            return props.binding.set(parseFloat(e.target.value)).then(update);
        }}
      />
      {props.afterElement}
    </InputGroup>
  );
}
