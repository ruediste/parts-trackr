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
  | "HERZ";

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

export interface Location {
  id: number;
  name: string;
  parameterDefinitions: LocationParameterDefinition[];
}
