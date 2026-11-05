import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

/**
 * On-device copy of Pakistan's places and landmarks, so search, the map and
 * proximity alerts work without a connection. Filled by features/data/sync.ts.
 * Separate from the kv-store database used for small settings.
 */
const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT);
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  name_norm TEXT NOT NULL,
  name_ur TEXT,
  kind TEXT NOT NULL,
  district TEXT,
  province TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS places_name_norm ON places (name_norm);
CREATE TABLE IF NOT EXISTS destinations (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  name_norm TEXT NOT NULL,
  name_ur TEXT,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_m INTEGER NOT NULL,
  short_description TEXT NOT NULL,
  image_url TEXT,
  is_landmark INTEGER NOT NULL,
  popularity INTEGER NOT NULL,
  featured INTEGER NOT NULL,
  source TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS destinations_name_norm ON destinations (name_norm);
`;

let db: SQLiteDatabase | null = null;

export function localDb(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync('gotourgo-data.db');
    db.execSync(SCHEMA);
  }
  return db;
}

export function getMeta(key: string): string | null {
  const row = localDb().getFirstSync<{ value: string | null }>('SELECT value FROM meta WHERE key = ?', key);
  return row?.value ?? null;
}

export function setMeta(key: string, value: string) {
  localDb().runSync('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
}
