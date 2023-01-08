export interface PartReference {
  id: number;
  name: string;
}
export interface InventoryEntryPMod {
  id: number;
  locationName: string;
  count: number | null;
  locationId: number | null;
  parameterValuesDescription: string;

  part: PartReference | null;
  path: PartReference[];
}
