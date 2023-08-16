import { useState } from "react";
import AsyncSelect from "react-select/async";
import { Binding } from "./useBinding";
import { req } from "./useData";

export type ParameterType = "NUMBER" | "VALUE" | "TEXT" | "CHOICE";
export type Unit =
  | "VOLT"
  | "AMPERE"
  | "WATT"
  | "METER"
  | "WATT_HOURS"
  | "AMPERE_HOURS"
  | "OHM"
  | "FARAD"
  | "HENRY"
  | "HERTZ"
  | "BYTE"
  | "GRAM"
  | "DEGREES"
  | "DEGREES_CELSIUS";

export interface ParameterDefinitionBase {
  id: number;
  name: string;
  type: ParameterType;
  unit?: Unit;
  values: string[];
}

export interface LocationParameterDefinition extends ParameterDefinitionBase {
  id: number;
}

export interface LocationPMod {
  id: number;
  name: string;
  addedByIncludeId: boolean;
}

export function SelectLocation({
  binding,
}: {
  binding: Binding<number | null>;
}) {
  const value = binding.get();
  const [locations, setLocations] = useState<LocationPMod[]>();
  return (
    <AsyncSelect<{
      value: number;
      label: string;
    }>
      defaultOptions
      loadOptions={(inputValue, callback) => {
        req(
          "api/location?name=" +
          encodeURIComponent(inputValue) +
          "&maxCount=10" +
          (value === null ? "" : "&includeId=" + value)
        )
          .success((data: LocationPMod[]) => {
            setLocations(data);
            callback(
              data
                .filter((x) => !x.addedByIncludeId)
                .map((x) => ({ value: x.id, label: x.name }))
            );
          })
          .send();
      }}
      value={
        value == null
          ? null
          : {
            value: value,
            label:
              locations === undefined
                ? ""
                : locations.find((x) => x.id === value)?.name ?? "",
          }
      }
      onChange={(option) => binding.set(option?.value ?? null)}
    />
  );
}
