import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { PartReference } from "./InventoryEntry";
import { ParameterDefinitionBase } from "./Location";

export interface PartListItem {
  id: number;
  hasChildren: boolean;
  name: string;
  cells: string[];
  inventorySum: number;
  children: PartList | null;
}

export interface PartListColumn {
  label: string;
  unit: string;
}

export interface PartList {
  items: PartListItem[];
  columns: PartListColumn[];
}

export interface PartParameterDefinition extends ParameterDefinitionBase {}

export interface ParameterValuePMod {
  id: number | null;
  definition: ParameterDefinitionBase;
  value: string | null;
  inherited: boolean;
}

export default interface PartPMod {
  id: number;
  parentId?: number;
  name: string;
  comment: string;
  parameterDefinitions: PartParameterDefinition[];
  parameterValues: ParameterValuePMod[];
  nameSetByParameterDefinition: boolean;
  childNameParameterDefinitionId: number | null;
  path: PartReference[];
}

export function LinkToPart({
  part,
  browse,
  sameWindow,
  children,
}: {
  part: PartReference;
  browse?: boolean;
  sameWindow?: boolean;
  children?: ReactNode;
}) {
  const to = `/parts/${browse === true ? "browse" : "tree"}/${part.id}`;
  const body = children === undefined ? part.name : children;
  if (sameWindow === true) {
    return <NavLink to={to}> {body}</NavLink>;
  }
  return (
    <a href={to} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  );
}
