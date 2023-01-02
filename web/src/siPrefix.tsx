import Input, { InputPropsBase } from "./Input";
import { Binding } from "./useBinding";
import { req, useRefreshTrigger } from "./useData";

export interface SiPrefix {
  symbol: string;
  character: string;
  multiplier: number;
  parseOnly: boolean;
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
    if (prefix.parseOnly) continue;
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
  const reloadValue = useRefreshTrigger();
  const binding: Binding<string> = {
    property: incomingBinding.property,
    get: () => {
      const value = incomingBinding.get();
      if (value === undefined || value === null) {
        return "";
      }
      const prefix = getSiPrefix(value);
      if (prefix === undefined) {
        return "" + value;
      } else {
        return value / prefix.multiplier + prefix.character;
      }
    },
    set: (value) => {
      if (value === "") return incomingBinding.set(undefined);

      if (!value.match(/^[+-]?\d*\.?\d*[a-zA-Z]?$/)) {
        reloadValue.trigger();
        return Promise.resolve();
      }
      const lastChar = value.charAt(value.length - 1);
      if (lastChar >= "0" && lastChar <= "9") {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          return incomingBinding.set(parsed);
        } else reloadValue.trigger();
        return Promise.resolve();
      }

      const prefix = getSiPrefixForChar(lastChar);
      const parsed =
        parseFloat(value.substring(0, value.length - 1)) *
        (prefix?.multiplier ?? 1);
      if (!isNaN(parsed)) {
        return incomingBinding.set(parsed);
      } else reloadValue.trigger();
      return Promise.resolve();
    },
  };

  return <Input binding={binding} reloadValue={reloadValue} {...others} />;
}
