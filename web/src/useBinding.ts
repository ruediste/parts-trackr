import { useState, useCallback } from "react";

export function useForceUpdate() {
  const [value, setValue] = useState({});
  return () => setValue({});
}

export interface Binding<V> {
  property: string | number | symbol;
  get: () => V;
  set: (value: V) => Promise<void>;
}

export type BindingFunction<T> = <P extends keyof T>(
  property: P
) => { binding: Binding<T[P]> };

export function useBinding<T>(
  value: T,
  args?: { update?: () => void }
): BindingFunction<T> {
  return useCallback(
    (property) => ({
      binding: {
        property,
        get: () => value[property],
        set: (v) => {
          value[property] = v;
          if (args?.update !== undefined) args.update();
          return Promise.resolve();
        },
      },
    }),
    [value, args?.update]
  );
}
