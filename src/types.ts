export type PropertyKind = 'home' | 'rental' | 'other';

export const KIND_LABELS: Record<PropertyKind, string> = {
  home: 'My home',
  rental: 'Rental',
  other: 'Other',
};

export type Property = {
  id: string;
  name: string;
  address: string | null;
  kind: PropertyKind;
  tenantName: string | null;
  tenantContact: string | null;
  monthlyRent: number | null;
  notes: string | null;
};

/** A recurring maintenance item, e.g. "Replace furnace filter every 90 days". */
export type MaintenanceTask = {
  id: string;
  propertyId: string;
  name: string;
  intervalDays: number | null;
  /** ISO timestamp of when this was last done. */
  lastDoneDate: string;
  notes: string | null;
};

/** One completed service entry (the history). */
export type MaintenanceLog = {
  id: string;
  propertyId: string;
  taskId: string | null;
  taskName: string;
  performedBy: string | null;
  /** ISO timestamp. */
  performedAt: string;
  cost: number | null;
  notes: string | null;
};
