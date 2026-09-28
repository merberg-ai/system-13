import type { RunSave } from "../core/types.js";
import { runIdFromSeed } from "../rng/rng.js";

const DB_NAME = "system13";
const STORE_NAME = "runs";
const CURRENT_KEY = "current";
const FALLBACK_CURRENT_KEY = "system13.current";
const FALLBACK_RUNS_KEY = "system13.runs.v2";

function runKey(runId: string): string {
  return `run:${runId}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("unable to open save database"));
  });
}

function loadFallbackRuns(): Record<string, RunSave> {
  try {
    const raw = localStorage.getItem(FALLBACK_RUNS_KEY);
    return raw ? JSON.parse(raw) as Record<string, RunSave> : {};
  } catch {
    return {};
  }
}

function saveFallbackRuns(runs: Record<string, RunSave>): void {
  localStorage.setItem(FALLBACK_RUNS_KEY, JSON.stringify(runs));
}

export class SaveStore {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await openDatabase();
    } catch {
      this.db = null;
    }
  }

  async load(): Promise<RunSave | null> {
    if (!this.db) {
      const raw = localStorage.getItem(FALLBACK_CURRENT_KEY);
      return raw ? JSON.parse(raw) as RunSave : null;
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(CURRENT_KEY);
      request.onsuccess = () => resolve((request.result as RunSave | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("unable to read save"));
    });
  }

  async loadRun(runId: string): Promise<RunSave | null> {
    if (!this.db) return loadFallbackRuns()[runId] ?? null;
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(runKey(runId));
      request.onsuccess = () => resolve((request.result as RunSave | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("unable to read run"));
    });
  }

  async listRuns(): Promise<RunSave[]> {
    if (!this.db) return Object.values(loadFallbackRuns());
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      const runs: RunSave[] = [];
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(runs);
          return;
        }
        if (typeof cursor.key === "string" && cursor.key.startsWith("run:")) runs.push(cursor.value as RunSave);
        cursor.continue();
      };
      request.onerror = () => reject(request.error ?? new Error("unable to list runs"));
    });
  }

  async save(save: RunSave): Promise<void> {
    const value = structuredClone(save);
    value.updatedAt = new Date().toISOString();
    const runId = runIdFromSeed(value.seed);

    if (!this.db) {
      localStorage.setItem(FALLBACK_CURRENT_KEY, JSON.stringify(value));
      const runs = loadFallbackRuns();
      runs[runId] = value;
      saveFallbackRuns(runs);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put(value, CURRENT_KEY);
      store.put(value, runKey(runId));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("unable to save run"));
    });
  }

  async setCurrent(save: RunSave): Promise<void> {
    const value = structuredClone(save);
    if (!this.db) {
      localStorage.setItem(FALLBACK_CURRENT_KEY, JSON.stringify(value));
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(value, CURRENT_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("unable to set current run"));
    });
  }

  async clear(): Promise<void> {
    localStorage.removeItem(FALLBACK_CURRENT_KEY);
    if (!this.db) return;
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(CURRENT_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("unable to delete current save"));
    });
  }
}
