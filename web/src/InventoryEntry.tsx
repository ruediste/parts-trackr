export interface InventoryEntryPMod {
  id: number;
  partName: string;
  locationName: string;
  count: number;
  locationId: number | null;
  parameterValuesDescription: string;
}
