import { DownloadTask, File, Paths } from 'expo-file-system';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import { CHANNELS, configureNotifications, getNotificationPermission } from '@/features/notifications/local-notifications';
import { errorMessage } from '@/lib/errors';
import { tx } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { colors } from '@/lib/theme';

import { GLYPH_RANGES, glyphFile, OFFLINE_MAPS, offlineMap, type OfflineMapId } from './catalog';
import { fetchMapManifest, glyphsDirectory, localMapFile, MAP_RELEASE_BASE, type MapManifest } from './pakistan-map';

/**
 * Downloads offline map files from the "pakistan-map" release, one at a time.
 *
 * - Pause and resume at any point. A paused or interrupted download keeps its
 *   ".part" file; resuming asks the server for the rest (HTTP Range).
 * - If Android stops the app mid-download, the next launch picks it up from
 *   the bytes already on disk.
 * - Large files wait for Wi-Fi unless the traveller chose mobile data.
 * - A silent, ongoing notification shows progress while the app is in the
 *   background.
 */

export type DownloadStatus = 'idle' | 'queued' | 'waiting-wifi' | 'waiting-network' | 'downloading' | 'paused' | 'complete' | 'error';

export type DownloadItem = {
  id: OfflineMapId;
  status: DownloadStatus;
  /** Bytes on disk (complete file, or the partial file while downloading). */
  bytes: number;
  /** Expected size from the manifest. */
  total: number;
  allowMobile: boolean;
  /** A complete file is on the phone (also true while an update downloads). */
  installed: boolean;
  /** Manifest build time of the installed file, to offer updates. */
  installedBuiltAt: string | null;
  error: string | null;
};

type State = {
  items: Record<OfflineMapId, DownloadItem>;
  manifest: MapManifest | null;
  glyphsReady: boolean;
};

type Persisted = Partial<Record<OfflineMapId, Pick<DownloadItem, 'status' | 'total' | 'allowMobile' | 'installed' | 'installedBuiltAt'>>>;

const PERSIST_KEY = 'gtg.offline.downloads';
const MANIFEST_KEY = 'gtg.offline.manifest';
const NOTIFICATION_ID = 'gtg-offline-map-download';
/** Files above this wait for Wi-Fi unless mobile data is allowed. */
export const WIFI_ONLY_ABOVE_BYTES = 30 * 1_048_576;
/** Space to keep free on the phone after a download. */
const SPARE_BYTES = 300 * 1_048_576;

const emptyItem = (id: OfflineMapId): DownloadItem => ({
  id,
  status: 'idle',
  bytes: 0,
  total: 0,
  allowMobile: false,
  installed: false,
  installedBuiltAt: null,
  error: null,
});

let state: State = {
  items: Object.fromEntries(OFFLINE_MAPS.map((m) => [m.id, emptyItem(m.id)])) as State['items'],
  manifest: storage.get<MapManifest | null>(MANIFEST_KEY, null),
  glyphsReady: false,
};
const listeners = new Set<() => void>();
let active: { id: OfflineMapId; task: DownloadTask } | null = null;
let restored = false;
let pumping = false;
let lastNotified = { at: 0, percent: -1 };

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function update(id: OfflineMapId, patch: Partial<DownloadItem>, save = true) {
  set({ items: { ...state.items, [id]: { ...state.items[id], ...patch } } });
  if (save) persist();
}

function persist() {
  const out: Persisted = {};
  for (const item of Object.values(state.items)) {
    if (item.status === 'idle' && !item.installed) continue;
    out[item.id] = { status: item.status, total: item.total, allowMobile: item.allowMobile, installed: item.installed, installedBuiltAt: item.installedBuiltAt };
  }
  storage.set(PERSIST_KEY, out);
}

const finalFile = (id: OfflineMapId) => localMapFile(offlineMap(id).file);
const partFile = (id: OfflineMapId) => localMapFile(`${offlineMap(id).file}.part`);

function sizeOf(file: File) {
  try {
    return file.exists ? file.size : 0;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number) {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${Math.round(bytes / 1_048_576)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/* ---------------------------------------------------------------- notifications */

async function notify(id: OfflineMapId, kind: 'progress' | 'done' | 'paused' | 'error') {
  const item = state.items[id];
  const name = offlineMap(id).name;
  const percent = item.total ? Math.floor((item.bytes / item.total) * 100) : 0;
  if (kind === 'progress') {
    const now = Date.now();
    if (percent === lastNotified.percent || now - lastNotified.at < 3000) return;
    lastNotified = { at: now, percent };
  }
  try {
    if (!(await getNotificationPermission())) return;
    const content: Notifications.NotificationContentInput =
      kind === 'progress'
        ? {
            title: tx('Downloading {0}', { 0: name }),
            body: tx('{0}% · {1} of {2}', { 0: percent, 1: formatBytes(item.bytes), 2: formatBytes(item.total) }),
            sticky: true,
            autoDismiss: false,
          }
        : kind === 'done'
          ? { title: tx('Offline map ready'), body: tx('{0} now works without internet.', { 0: name }) }
          : kind === 'paused'
            ? { title: tx('Download paused'), body: tx('{0} · {1}% downloaded. Open GoTourGo to continue.', { 0: name, 1: percent }) }
            : { title: tx('Download stopped'), body: item.error ?? tx('Something went wrong. Open GoTourGo to try again.') };
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: { ...content, color: colors.primary, data: { type: 'offline-maps' } },
      trigger: Platform.OS === 'android' ? { channelId: CHANNELS.downloads } : null,
    });
  } catch {
    // Notifications are a convenience; the screen shows the same progress.
  }
}

function clearNotification() {
  Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
}

/* ---------------------------------------------------------------- manifest */

export async function refreshManifest(): Promise<MapManifest | null> {
  try {
    const manifest = await fetchMapManifest();
    storage.set(MANIFEST_KEY, manifest);
    const items = { ...state.items };
    for (const m of OFFLINE_MAPS) {
      const bytes = manifest.files[m.file]?.bytes;
      if (bytes && items[m.id].status !== 'complete') items[m.id] = { ...items[m.id], total: bytes };
    }
    set({ manifest, items });
    return manifest;
  } catch {
    return state.manifest;
  }
}

/** True when the published file is newer than the installed one. */
export function hasUpdate(id: OfflineMapId) {
  const item = state.items[id];
  const built = state.manifest?.builtAt;
  return item.installed && item.status === 'complete' && Boolean(built) && Boolean(item.installedBuiltAt) && built! > item.installedBuiltAt!;
}

/* ---------------------------------------------------------------- glyphs */

/** Label fonts for the offline style (about 1 MB), fetched once with the first map. */
async function ensureGlyphs() {
  const dir = glyphsDirectory();
  try {
    for (const range of GLYPH_RANGES) {
      const file = new File(dir, `${range}.pbf`);
      if (file.exists && file.size > 0) continue;
      await File.downloadFileAsync(`${MAP_RELEASE_BASE}/${glyphFile(range)}`, file, { idempotent: true });
    }
    set({ glyphsReady: true });
  } catch {
    // Labels are optional; the map still draws without them.
  }
}

function glyphsOnDisk() {
  const dir = glyphsDirectory();
  return GLYPH_RANGES.every((r) => {
    const f = new File(dir, `${r}.pbf`);
    return f.exists && f.size > 0;
  });
}

/* ---------------------------------------------------------------- checks */

export type DownloadCheck = { size: number; free: number; enoughSpace: boolean; onWifi: boolean; online: boolean };

export async function checkBeforeDownload(id: OfflineMapId): Promise<DownloadCheck> {
  const manifest = state.manifest ?? (await refreshManifest());
  const size = manifest?.files[offlineMap(id).file]?.bytes ?? state.items[id].total;
  const already = sizeOf(partFile(id));
  let free = Number.POSITIVE_INFINITY;
  try {
    free = Paths.availableDiskSpace;
  } catch {
    // Unknown free space: let the download try.
  }
  const net = await Network.getNetworkStateAsync().catch(() => null);
  return {
    size,
    free,
    enoughSpace: free - (size - already) > SPARE_BYTES,
    onWifi: net?.type === Network.NetworkStateType.WIFI || net?.type === Network.NetworkStateType.ETHERNET,
    online: net?.isConnected !== false && net?.isInternetReachable !== false,
  };
}

/* ---------------------------------------------------------------- queue */

async function networkAllows(id: OfflineMapId): Promise<'ok' | 'waiting-wifi' | 'waiting-network'> {
  const net = await Network.getNetworkStateAsync().catch(() => null);
  if (!net || net.isConnected === false || net.isInternetReachable === false) return 'waiting-network';
  const onWifi = net.type === Network.NetworkStateType.WIFI || net.type === Network.NetworkStateType.ETHERNET;
  const item = state.items[id];
  if (!onWifi && !item.allowMobile && item.total > WIFI_ONLY_ABOVE_BYTES) return 'waiting-wifi';
  return 'ok';
}

const WAITING: DownloadStatus[] = ['queued', 'waiting-wifi', 'waiting-network'];

async function pump() {
  if (active || pumping) return;
  pumping = true;
  try {
    for (const m of OFFLINE_MAPS) {
      const item = state.items[m.id];
      if (!WAITING.includes(item.status)) continue;
      const allowed = await networkAllows(m.id);
      if (allowed !== 'ok') {
        if (item.status !== allowed) update(m.id, { status: allowed });
        continue;
      }
      void run(m.id);
      return;
    }
  } finally {
    pumping = false;
  }
}

async function run(id: OfflineMapId) {
  const map = offlineMap(id);
  const url = `${MAP_RELEASE_BASE}/${map.file}`;
  const part = partFile(id);
  const offset = sizeOf(part);
  const onProgress = ({ bytesWritten }: { bytesWritten: number }) => {
    if (!active || active.id !== id) return;
    update(id, { bytes: bytesWritten }, false);
    void notify(id, 'progress');
  };
  // Android's resume data is the byte offset, so a partial file from an
  // earlier run (even one Android stopped) can be continued.
  const task =
    offset > 0 && Platform.OS === 'android'
      ? DownloadTask.fromSavable({ url, fileUri: part.uri, isDirectory: false, resumeData: String(offset) }, { onProgress })
      : File.createDownloadTask(url, part, { onProgress });
  active = { id, task };
  lastNotified = { at: 0, percent: -1 };
  update(id, { status: 'downloading', bytes: offset, error: null });
  void notify(id, 'progress');

  try {
    const file = offset > 0 && Platform.OS === 'android' ? await task.resumeAsync() : await task.downloadAsync();
    if (file === null) {
      // Paused by the traveller.
      update(id, { status: 'paused', bytes: sizeOf(part) });
      void notify(id, 'paused');
      return;
    }
    const got = sizeOf(part);
    const expected = state.manifest?.files[map.file]?.bytes ?? state.items[id].total;
    if (expected && got !== expected) {
      part.delete();
      throw new Error(tx('The download was incomplete ({0} of {1}). Please try again.', { 0: formatBytes(got), 1: formatBytes(expected) }));
    }
    const target = finalFile(id);
    if (target.exists) target.delete();
    part.move(target);
    update(id, { status: 'complete', installed: true, bytes: got, total: got, installedBuiltAt: state.manifest?.builtAt ?? new Date().toISOString(), error: null });
    void notify(id, 'done');
    if (!state.glyphsReady) await ensureGlyphs();
  } catch (e) {
    if (task.state === 'cancelled') return;
    const net = await Network.getNetworkStateAsync().catch(() => null);
    if (!net || net.isConnected === false || net.isInternetReachable === false) {
      // Lost the connection: continue automatically when it returns.
      update(id, { status: 'waiting-network', bytes: sizeOf(part) });
      void notify(id, 'paused');
    } else {
      update(id, { status: 'error', bytes: sizeOf(part), error: errorMessage(e) });
      void notify(id, 'error');
    }
  } finally {
    if (active?.id === id) active = null;
    try {
      task.release?.();
    } catch {
      // already released
    }
    void pump();
  }
}

/* ---------------------------------------------------------------- actions */

export const offlineDownloads = {
  /** Queues a download (or an update of an installed map). */
  async start(id: OfflineMapId, opts: { allowMobile: boolean }) {
    await configureNotifications();
    const manifest = state.manifest ?? (await refreshManifest());
    const total = manifest?.files[offlineMap(id).file]?.bytes ?? state.items[id].total;
    update(id, { status: 'queued', total, allowMobile: opts.allowMobile, error: null, bytes: sizeOf(partFile(id)) });
    void pump();
  },

  async pause(id: OfflineMapId) {
    if (active?.id === id) {
      await active.task.pauseAsync().catch(() => undefined);
      return; // run() records the paused state
    }
    if (WAITING.includes(state.items[id].status)) update(id, { status: 'paused' });
  },

  resume(id: OfflineMapId, opts?: { allowMobile?: boolean }) {
    update(id, { status: 'queued', error: null, ...(opts?.allowMobile ? { allowMobile: true } : {}) });
    void pump();
  },

  /** Stops a download and deletes the partial file. An installed older version stays. */
  cancel(id: OfflineMapId) {
    if (active?.id === id) {
      active.task.cancel();
      active = null;
    }
    const part = partFile(id);
    if (part.exists) part.delete();
    const installed = finalFile(id).exists;
    update(id, { status: installed ? 'complete' : 'idle', installed, bytes: installed ? sizeOf(finalFile(id)) : 0, error: null });
    clearNotification();
    void pump();
  },

  /** Deletes an installed map. */
  remove(id: OfflineMapId) {
    this.cancel(id);
    const file = finalFile(id);
    if (file.exists) file.delete();
    update(id, { ...emptyItem(id), total: state.items[id].total });
  },

  /** Restores state at app start and continues interrupted downloads. */
  restore() {
    if (restored) return;
    restored = true;
    const saved = storage.get<Persisted>(PERSIST_KEY, {});
    const items = { ...state.items };
    for (const m of OFFLINE_MAPS) {
      const s = saved[m.id];
      const final = sizeOf(finalFile(m.id));
      const part = sizeOf(partFile(m.id));
      if (!s) {
        items[m.id] = final ? { ...emptyItem(m.id), status: 'complete', installed: true, bytes: final, total: final } : emptyItem(m.id);
        continue;
      }
      // A download that was running when the app stopped is queued again.
      const status: DownloadStatus = s.status === 'downloading' ? 'queued' : s.status === 'complete' && !final ? 'idle' : s.status;
      items[m.id] = {
        ...emptyItem(m.id),
        ...s,
        installed: final > 0,
        status,
        bytes: status === 'complete' ? final : part,
        total: s.total || state.manifest?.files[m.file]?.bytes || 0,
      };
    }
    set({ items, glyphsReady: glyphsOnDisk() });
    persist();

    Network.addNetworkStateListener(() => void pump());
    AppState.addEventListener('change', (s) => {
      if (s === 'active') void pump();
    });
    void refreshManifest().then(() => {
      if (!state.glyphsReady && Object.values(state.items).some((i) => i.installed)) void ensureGlyphs();
    });
    void pump();
  },

  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useOfflineDownloads() {
  return useSyncExternalStore(offlineDownloads.subscribe, offlineDownloads.get);
}

/** Installed map files, for the map style. */
export function installedMaps(s: State = state): OfflineMapId[] {
  return OFFLINE_MAPS.filter((m) => s.items[m.id].installed).map((m) => m.id);
}
