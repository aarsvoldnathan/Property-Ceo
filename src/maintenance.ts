import { MaintenanceLog, MaintenanceTask, Property } from './types';

const DAY = 86_400_000;

/** A task is "due soon" within this many days. */
export const DUE_SOON_DAYS = 14;

export type Status = 'overdue' | 'dueSoon' | 'ok';

export type DueInfo = {
  task: MaintenanceTask;
  property: Property;
  status: Status;
  detail: string;
  /** Days until due (negative = overdue). Infinity when no schedule is set. */
  daysRemaining: number;
};

const statusRank: Record<Status, number> = { overdue: 0, dueSoon: 1, ok: 2 };

export function computeDue(task: MaintenanceTask, property: Property, now: Date): DueInfo {
  if (!task.intervalDays) {
    return { task, property, status: 'ok', detail: 'No schedule set', daysRemaining: Infinity };
  }
  const dueMs = new Date(task.lastDoneDate).getTime() + task.intervalDays * DAY;
  const remaining = Math.ceil((dueMs - now.getTime()) / DAY);
  const status: Status = remaining < 0 ? 'overdue' : remaining <= DUE_SOON_DAYS ? 'dueSoon' : 'ok';
  const abs = Math.abs(remaining);
  const detail = remaining < 0 ? `Overdue by ${abs} d` : `Due in ${abs} d`;
  return { task, property, status, detail, daysRemaining: remaining };
}

/** Tasks for the given properties, optionally filtered by status, most urgent first. */
export function getDueList(
  properties: Property[],
  tasks: MaintenanceTask[],
  now: Date,
  includeOk = false,
): DueInfo[] {
  const byId = new Map(properties.map((p) => [p.id, p]));
  return tasks
    .map((t) => {
      const property = byId.get(t.propertyId);
      return property ? computeDue(t, property, now) : null;
    })
    .filter((d): d is DueInfo => d !== null && (includeOk || d.status !== 'ok'))
    .sort(
      (a, b) =>
        statusRank[a.status] - statusRank[b.status] || a.daysRemaining - b.daysRemaining,
    );
}

export function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
}

/** Services completed within the last `days` days, newest first. */
export function getRecentLogs(logs: MaintenanceLog[], now: Date, days = 30): MaintenanceLog[] {
  return logs
    .filter((l) => daysSince(l.performedAt, now) <= days)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}
