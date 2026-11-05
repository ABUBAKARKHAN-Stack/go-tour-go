import { useSyncExternalStore } from 'react';

import { squash } from '@/features/data/search-text';
import { getMeta, localDb, setMeta } from '@/lib/local-db';
import { supabase } from '@/lib/supabase';
import type { DestinationSummary, Place } from '@/lib/types';

/**
 * Keeps the phone's copy of places and landmarks in step with Supabase.
 * Each dataset has a version on the server (dataset_versions); when it differs
 * from the local one the whole dataset is downloaded again in pages and
 * swapped in within one transaction, so the local copy is never half-updated.
 */

const PAGE = 1000;
const INSERT_BATCH = 80;
const PLACE_COLUMNS = 'id,name,name_ur,kind,district,province,latitude,longitude,rank';
const DESTINATION_COLUMNS =
  'id,slug,name,name_ur,category,city,region,latitude,longitude,radius_m,short_description,image_url,is_landmark,popularity,featured,source';

type Dataset = 'places' | 'destinations';

export type SyncState = {
  status: 'idle' | 'syncing' | 'done' | 'error';
  dataset: Dataset | null;
  loaded: number;
  total: number;
  error: string | null;
  /** Increments whenever local data changes; queries reading SQLite key on it. */
  revision: number;
  counts: { places: number; destinations: number };
  lastSyncAt: number | null;
};

function localCount(table: Dataset) {
  return localDb().getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`)?.n ?? 0;
}

let state: SyncState = {
  status: 'idle',
  dataset: null,
  loaded: 0,
  total: 0,
  error: null,
  revision: 0,
  counts: { places: 0, destinations: 0 },
  lastSyncAt: null,
};
let initialised = false;
const listeners = new Set<() => void>();

function init() {
  if (initialised) return;
  initialised = true;
  try {
    const last = getMeta('lastSyncAt');
    state = {
      ...state,
      counts: { places: localCount('places'), destinations: localCount('destinations') },
      lastSyncAt: last ? Number(last) : null,
    };
  } catch {
    // The database opens lazily; a failure here surfaces on the first sync.
  }
}

function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const dataSyncStore = {
  get: () => {
    init();
    return state;
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export function useDataSync() {
  return useSyncExternalStore(dataSyncStore.subscribe, dataSyncStore.get);
}

async function fetchAll<T extends { id: string }>(table: Dataset, columns: string, total: number): Promise<T[]> {
  const rows: T[] = [];
  let last: string | null = null;
  for (;;) {
    let query = supabase.from(table).select(columns).order('id').limit(PAGE);
    if (table === 'destinations') query = query.eq('active', true);
    if (last) query = query.gt('id', last);
    const { data, error } = await query;
    if (error) throw error;
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    set({ loaded: rows.length, total: Math.max(total, rows.length) });
    if (page.length < PAGE) return rows;
    last = page[page.length - 1].id;
  }
}

async function replacePlaces(rows: Place[]) {
  const db = localDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync('DELETE FROM places');
    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const batch = rows.slice(i, i + INSERT_BATCH);
      const values = batch.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',');
      const params = batch.flatMap((p) => [
        p.id,
        p.name,
        squash(p.name),
        p.name_ur,
        p.kind,
        p.district,
        p.province,
        p.latitude,
        p.longitude,
        p.rank,
      ]);
      await tx.runAsync(
        `INSERT OR REPLACE INTO places (id,name,name_norm,name_ur,kind,district,province,latitude,longitude,rank) VALUES ${values}`,
        params,
      );
    }
  });
}

async function replaceDestinations(rows: DestinationSummary[]) {
  const db = localDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync('DELETE FROM destinations');
    for (let i = 0; i < rows.length; i += INSERT_BATCH / 2) {
      const batch = rows.slice(i, i + INSERT_BATCH / 2);
      const values = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
      const params = batch.flatMap((d) => [
        d.id,
        d.slug,
        d.name,
        squash(d.name),
        d.name_ur,
        d.category,
        d.city,
        d.region,
        d.latitude,
        d.longitude,
        d.radius_m,
        d.short_description,
        d.image_url,
        d.is_landmark ? 1 : 0,
        d.popularity,
        d.featured ? 1 : 0,
        d.source,
      ]);
      await tx.runAsync(
        `INSERT OR REPLACE INTO destinations (id,slug,name,name_norm,name_ur,category,city,region,latitude,longitude,radius_m,short_description,image_url,is_landmark,popularity,featured,source) VALUES ${values}`,
        params,
      );
    }
  });
}

let running: Promise<void> | null = null;

/**
 * Brings the local copy up to date. Safe to call often: it checks versions
 * first (one tiny request) and only downloads datasets that changed.
 */
export function syncLocalData(options: { force?: boolean } = {}): Promise<void> {
  if (running) return running;
  running = (async () => {
    init();
    set({ status: 'syncing', error: null, loaded: 0, total: 0, dataset: null });
    try {
      const { data: versions, error } = await supabase.from('dataset_versions').select('name,version,row_count');
      if (error) throw error;
      let changed = false;
      // Landmarks first: they drive the map and proximity alerts.
      for (const name of ['destinations', 'places'] as const) {
        const remote = versions?.find((v) => v.name === name);
        if (!remote) continue;
        const key = `version:${name}`;
        const upToDate = getMeta(key) === String(remote.version) && localCount(name) > 0;
        if (upToDate && !options.force) continue;
        set({ dataset: name, loaded: 0, total: remote.row_count });
        if (name === 'places') {
          const rows = await fetchAll<Place>('places', PLACE_COLUMNS, remote.row_count);
          if (rows.length === 0 && remote.row_count > 0) throw new Error('No places downloaded.');
          await replacePlaces(rows);
        } else {
          const rows = await fetchAll<DestinationSummary>('destinations', DESTINATION_COLUMNS, remote.row_count);
          if (rows.length === 0) throw new Error('No landmarks downloaded.');
          await replaceDestinations(rows);
        }
        setMeta(key, String(remote.version));
        changed = true;
      }
      const now = Date.now();
      setMeta('lastSyncAt', String(now));
      set({
        status: 'done',
        dataset: null,
        lastSyncAt: now,
        counts: { places: localCount('places'), destinations: localCount('destinations') },
        revision: changed ? state.revision + 1 : state.revision,
      });
    } catch (e) {
      set({ status: 'error', dataset: null, error: e instanceof Error ? e.message : String(e) });
    } finally {
      running = null;
    }
  })();
  return running;
}
