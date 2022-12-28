import { ParameterDefinitionBase } from "./Location";

export interface PartTreeItem {
  id: number;
  hasChildren: boolean;
  name: string;
  cells: string[];
  inventorySum: number;
}

export interface PartTreeColumn {
  label: string;
  unit: string;
}

export interface SubTree {
  items: PartTreeItem[];
  columns: PartTreeColumn[];
}

export interface PartParameterDefinition extends ParameterDefinitionBase {}

export interface ParameterValuePMod {
  id: number | null;
  definition: ParameterDefinitionBase;
  value: string | null;
  inherited: boolean;
}

export default interface Part {
  id: number;
  parentId?: number;
  name: string;
  comment: string;
  parameterDefinitions: PartParameterDefinition[];
  parameterValues: ParameterValuePMod[];
  nameSetByParameterDefinition: boolean;
  childNameParameterDefinitionId: number | null;
}
