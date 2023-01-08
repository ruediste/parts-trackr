import { ReactElement, useEffect, useState } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { Binding, useForceUpdate } from "./useBinding";
import { Observable } from "./useData";

export function Select<T>({
  updateOnChange = false,
  ...props
}: {
  label?: string;
  options: { value: T; label: string }[];
  binding: Binding<T>;
  reloadValue?: Observable;
  updateOnChange?: boolean;
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
      reloadValue.subscribe(cb);
      return () => reloadValue.unsubscribe(cb);
    }
  }, [props.reloadValue, props.binding]);
  return (
    <Form.Group className="mb-3">
      {props.label === undefined ? null : (
        <Form.Label>{props.label}</Form.Label>
      )}
      <Form.Select
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (updateOnChange) props.binding.set(e.target.value as T);
        }}
        onBlur={(e) => {
          if (updateOnChange) return;
          props.binding.set(value as T);
        }}
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
  reloadValue?: Observable;
  noMarginBottom?: boolean;
}

export interface InputPropsString extends InputPropsBase {
  type?: "text";
  binding: Binding<string>;
}

export interface InputPropsTextArea extends InputPropsBase {
  type: "textarea";
  binding: Binding<string>;
  rows?: number;
}

export interface InputPropsNumber extends InputPropsBase {
  type: "number";
  binding: Binding<number | null>;
}
export interface InputPropsBoolean extends InputPropsBase {
  type: "boolean";
  binding: Binding<boolean>;
}

export default function Input(
  props:
    | InputPropsString
    | InputPropsNumber
    | InputPropsTextArea
    | InputPropsBoolean
) {
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
      reloadValue.subscribe(cb);
      return () => reloadValue.unsubscribe(cb);
    }
  }, [props.reloadValue, props.binding]);
  return (
    <Form.Group className={props.noMarginBottom === true ? undefined : "mb-3"}>
      <InputGroup>
        {props.type === "boolean" ? (
          <Form.Check
            type="checkbox"
            label={props.label}
            checked={props.binding.get()}
            onChange={(e) => props.binding.set(e.target.checked)}
          />
        ) : (
          <>
            {props.label === undefined ? null : (
              <Form.Label>{props.label}</Form.Label>
            )}
            <Form.Control
              type={props.type}
              placeholder={props.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              as={props.type === "textarea" ? "textarea" : undefined}
              rows={props.type === "textarea" ? props.rows : undefined}
              onBlur={() => {
                if (
                  props.type === undefined ||
                  props.type === "text" ||
                  props.type === "textarea"
                )
                  return props.binding.set(value).then(update);
                else if (props.type === "number") {
                  let parsed: number | null = parseFloat(value);
                  if (isNaN(parsed)) parsed = null;
                  return props.binding.set(parsed).then(update);
                }
              }}
            />
          </>
        )}
        {props.afterElement}
      </InputGroup>
    </Form.Group>
  );
}
