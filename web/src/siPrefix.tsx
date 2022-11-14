import { useEffect, useState } from "react";
import Input, { InputPropsBase } from "./Input";
import { Binding } from "./useBinding";
import { req } from "./useData";

export interface SiPrefix {
  symbol: string;
  character: string;
  multiplier: number;
}

let _siPrefixes: SiPrefix[] = [];

req("api/siPrefix")
  .success((data) => (_siPrefixes = data))
  .send();

export function siPrefixes(): SiPrefix[] | undefined {
  return undefined;
}

export function getSiPrefix(value: number) {
  if (value < 1000 && value >= 1) return undefined;
  for (const prefix of _siPrefixes) {
    if (value >= prefix.multiplier) return prefix;
  }
  return undefined;
}

export function getSiPrefixForChar(char: string) {
  return _siPrefixes.find((x) => x.character === char);
}

export function SiPrefixInput(
  props: InputPropsBase & { binding: Binding<number | undefined | null> }
) {
  const { binding: incomingBinding, ...others } = props;

  const [value, setValue] = useState("");
  const [revertValue, setRevertValue] = useState("");

  useEffect(() => {
    const value = incomingBinding.get();
    if (value === undefined || value === null) {
      setValue("");
      setRevertValue("");
      return;
    }
    const prefix = getSiPrefix(value);
    if (prefix === undefined) {
      setValue("" + value);
      setRevertValue("" + value);
    } else {
      const tmp = value / prefix.multiplier + prefix.character;
      setValue(tmp);
      setRevertValue(tmp);
    }
  }, [incomingBinding]);

  const binding: Binding<string> = {
    property: incomingBinding.property,
    get: () => value,
    set: (value) => {
      setValue(value);
      return Promise.resolve();
    },
  };

  return (
    <Input
      binding={binding}
      {...others}
      onBlur={() => {
        if (value === "") return incomingBinding.set(undefined);
        const lastChar = value.charAt(value.length - 1);
        if (lastChar >= "0" && lastChar <= "9") {
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) {
            incomingBinding.set(parsed);
            setRevertValue(value);
          } else setValue(revertValue);
          return;
        }
        const prefix = getSiPrefixForChar(lastChar);
        const parsed =
          parseFloat(value.substring(0, value.length - 1)) *
          (prefix?.multiplier ?? 1);
        if (!isNaN(parsed)) {
          incomingBinding.set(parsed);
          setRevertValue(value);
        } else setValue(revertValue);
      }}
    />
  );
}
