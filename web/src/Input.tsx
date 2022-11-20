import { ReactElement, useEffect, useState } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { Binding, useForceUpdate } from "./useBinding";
import { RefreshTrigger } from "./useData";

export function Select<T>(props: {
  label?: string;
  options: { value: T; label: string }[];
  binding: Binding<T>;
  reloadValue?: RefreshTrigger;
}) {
  const [value, setValue] = useState("");
  const bindingValue = props.binding.get();
  useEffect(() => {
    setValue(bindingValue + "");
  }, [bindingValue]);
  useEffect(() => {
    if (props.reloadValue !== undefined) {
      const cb = () => setValue(props.binding.get() + "");
      const reloadValue = props.reloadValue;
      reloadValue.add(cb);
      return () => reloadValue.remove(cb);
    }
  }, [props.reloadValue, props.binding]);
  return (
    <Form.Group className="mb-3">
      {props.label === undefined ? null : (
        <Form.Label>{props.label}</Form.Label>
      )}
      <Form.Select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => props.binding.set(value as T)}
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
  reloadValue?: RefreshTrigger;
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
  const [value, setValue] = useState("");
  const bindingValue = props.binding.get();
  useEffect(() => {
    setValue("" + (bindingValue ?? ""));
  }, [bindingValue]);
  useEffect(() => {
    if (props.reloadValue !== undefined) {
      const cb = () => setValue(props.binding.get() + "");
      const reloadValue = props.reloadValue;
      reloadValue.add(cb);
      return () => reloadValue.remove(cb);
    }
  }, [props.reloadValue, props.binding]);
  return (
    <InputGroup className="mb-3">
      {props.label === undefined ? null : (
        <Form.Label>{props.label}</Form.Label>
      )}
      <Form.Control
        type={props.type}
        placeholder={props.placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (props.type === undefined || props.type === "text")
            return props.binding.set(value).then(update);
          else if (props.type === "number")
            return props.binding.set(parseFloat(value)).then(update);
        }}
      />
      {props.afterElement}
    </InputGroup>
  );
}
