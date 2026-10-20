import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';
import { MaintenanceLog, MaintenanceTask, Property, PropertyKind } from './types';

type Data = { properties: Property[]; tasks: MaintenanceTask[]; logs: MaintenanceLog[] };

export type NewProperty = {
  name: string;
  address?: string;
  kind: PropertyKind;
  tenantName?: string;
  tenantContact?: string;
  monthlyRent?: number;
  notes?: string;
};

type StoreValue = Data & {
  ready: boolean;
  refresh: () => Promise<void>;
  /** Each action returns an error message, or null on success. */
  addProperty: (p: NewProperty) => Promise<string | null>;
  deleteProperty: (id: string) => Promise<string | null>;
  addTask: (propertyId: string, name: string, intervalDays: number | null) => Promise<string | null>;
  deleteTask: (id: string) => Promise<string | null>;
  logService: (
    task: MaintenanceTask,
    details: { performedBy?: string; cost?: number; notes?: string },
  ) => Promise<string | null>;
};

const StoreContext = createContext<StoreValue | null>(null);

const empty: Data = { properties: [], tasks: [], logs: [] };

/* eslint-disable @typescript-eslint/no-explicit-any */
const toProperty = (r: any): Property => ({
  id: r.id,
  name: r.name,
  address: r.address,
  kind: r.kind,
  tenantName: r.tenant_name,
  tenantContact: r.tenant_contact,
  monthlyRent: r.monthly_rent === null ? null : Number(r.monthly_rent),
  notes: r.notes,
});
const toTask = (r: any): MaintenanceTask => ({
  id: r.id,
  propertyId: r.property_id,
  name: r.name,
  intervalDays: r.interval_days,
  lastDoneDate: r.last_done_date,
  notes: r.notes,
});
const toLog = (r: any): MaintenanceLog => ({
  id: r.id,
  propertyId: r.property_id,
  taskId: r.task_id,
  taskName: r.task_name,
  performedBy: r.performed_by,
  performedAt: r.performed_at,
  cost: r.cost === null ? null : Number(r.cost),
  notes: r.notes,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [data, setData] = useState<Data>(empty);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setData(empty);
      setReady(true);
      return;
    }
    const [p, t, l] = await Promise.all([
      supabase.from('properties').select('*').order('name'),
      supabase.from('maintenance_tasks').select('*').order('name'),
      supabase.from('maintenance_logs').select('*').order('performed_at', { ascending: false }),
    ]);
    if (!p.error && !t.error && !l.error) {
      setData({
        properties: (p.data ?? []).map(toProperty),
        tasks: (t.data ?? []).map(toTask),
        logs: (l.data ?? []).map(toLog),
      });
    }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    setReady(false);
    refresh();
  }, [refresh]);

  const run = useCallback(
    async (action: PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await action;
      if (error) return error.message;
      await refresh();
      return null;
    },
    [refresh],
  );

  const addProperty = useCallback(
    (p: NewProperty) =>
      run(
        supabase.from('properties').insert({
          name: p.name,
          address: p.address || null,
          kind: p.kind,
          tenant_name: p.tenantName || null,
          tenant_contact: p.tenantContact || null,
          monthly_rent: p.monthlyRent ?? null,
          notes: p.notes || null,
        }),
      ),
    [run],
  );

  const deleteProperty = useCallback(
    (id: string) => run(supabase.from('properties').delete().eq('id', id)),
    [run],
  );

  const addTask = useCallback(
    (propertyId: string, name: string, intervalDays: number | null) =>
      run(
        supabase
          .from('maintenance_tasks')
          .insert({ property_id: propertyId, name, interval_days: intervalDays }),
      ),
    [run],
  );

  const deleteTask = useCallback(
    (id: string) => run(supabase.from('maintenance_tasks').delete().eq('id', id)),
    [run],
  );

  const logService = useCallback(
    async (
      task: MaintenanceTask,
      details: { performedBy?: string; cost?: number; notes?: string },
    ) => {
      const now = new Date().toISOString();
      const ins = await supabase.from('maintenance_logs').insert({
        property_id: task.propertyId,
        task_id: task.id,
        task_name: task.name,
        performed_by: details.performedBy || null,
        performed_at: now,
        cost: details.cost ?? null,
        notes: details.notes || null,
      });
      if (ins.error) return ins.error.message;
      return run(
        supabase.from('maintenance_tasks').update({ last_done_date: now }).eq('id', task.id),
      );
    },
    [run],
  );

  const value = useMemo(
    () => ({
      ...data,
      ready,
      refresh,
      addProperty,
      deleteProperty,
      addTask,
      deleteTask,
      logService,
    }),
    [data, ready, refresh, addProperty, deleteProperty, addTask, deleteTask, logService],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
