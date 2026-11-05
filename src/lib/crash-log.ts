import { storage, useStorage } from '@/lib/storage';

/**
 * Keeps the last JavaScript error on the phone so it can be read after a
 * crash (Settings → Demo tools) without a paid crash-reporting service.
 */
export type CrashRecord = { message: string; stack: string | null; at: number; fatal: boolean; where: string };

const KEY = 'gtg.lastError';

export function recordError(error: unknown, where: string, fatal = false) {
  const e = error instanceof Error ? error : new Error(String(error));
  try {
    storage.set<CrashRecord>(KEY, {
      message: e.message || String(error),
      stack: e.stack ? e.stack.split('\n').slice(0, 12).join('\n') : null,
      at: Date.now(),
      fatal,
      where,
    });
  } catch {
    // Never let logging an error cause another one.
  }
}

export function useLastError() {
  return useStorage<CrashRecord | null>(KEY, null);
}

export function crashReport(r: CrashRecord) {
  return `GoTourGo error (${r.fatal ? 'crash' : 'error'}, ${r.where}) at ${new Date(r.at).toISOString()}\n${r.message}\n${r.stack ?? ''}`;
}

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsLike = { getGlobalHandler(): GlobalHandler; setGlobalHandler(h: GlobalHandler): void };

let installed = false;

/** Records uncaught errors (including fatal ones) before React Native's own handler runs. */
export function installGlobalErrorHandler() {
  const utils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (installed || !utils) return;
  installed = true;
  const previous = utils.getGlobalHandler();
  utils.setGlobalHandler((error, isFatal) => {
    recordError(error, 'global', Boolean(isFatal));
    previous(error, isFatal);
  });
}
