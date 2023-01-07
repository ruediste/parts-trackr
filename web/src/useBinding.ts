import { Dispatch, SetStateAction, useCallback, useState } from "react";

export function useForceUpdate() {
  const [, setValue] = useState({});
  return () => setValue({});
}

export interface Binding<V> {
  property?: string | number | symbol;
  get: () => V;
  set: (value: V) => Promise<void>;
}

export type BindingFunction<T> = <P extends keyof T>(
  property: P
) => { binding: Binding<T[P]> };

export function useStateAndBind<S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>, { binding: Binding<S> }];

export function useStateAndBind<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>,
  { binding: Binding<S | undefined> }
];

export function useStateAndBind<S>(
  initialState?: S | (() => S)
): [S, Dispatch<SetStateAction<S>>, { binding: Binding<S | undefined> }] {
  const [value, setValue] = useState(initialState);
  return [
    value as any,
    setValue as any,
    {
      binding: {
        get: () => value,
        set: async (v) => setValue(v as any),
      },
    },
  ];
}

export function useBinding<T>(
  value: T,
  args?: { update?: () => void }
): BindingFunction<T> {
  if (value === null || value === undefined)
    throw new Error("The supplied value is null");
  const update = args?.update;
  return useCallback(
    (property) => ({
      binding: {
        property,
        get: () => value[property],
        set: (v) => {
          value[property] = v as any;
          if (update !== undefined) update();
          return Promise.resolve();
        },
      },
    }),
    [value, update]
  );
}
