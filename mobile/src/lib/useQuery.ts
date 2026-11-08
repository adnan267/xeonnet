import { useCallback, useEffect, useRef, useState } from "react";
import { api, OfflineError, readCache, saveCache } from "./api";

export type Query<T> = {
  data: T | null; error: string; loading: boolean; refreshing: boolean;
  /** true when the data shown came from the phone (no connection) */
  offline: boolean; savedAt: number | null;
  refresh: () => Promise<void>; setData: (d: T) => void;
};

/**
 * Loads a GET endpoint. Shows the last saved copy straight away, then refreshes from the server.
 * With no connection the saved copy stays on screen and `offline` is true.
 */
export function useQuery<T>(path: string | null, deps: unknown[] = []): Query<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!path);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const fresh = await api<T>(path);
      if (!alive.current) return;
      setDataState(fresh); setError(""); setOffline(false); setSavedAt(Date.now());
      saveCache(path, fresh);
    } catch (e) {
      if (!alive.current) return;
      if (e instanceof OfflineError) {
        const c = await readCache<T>(path);
        if (c) { setDataState(c.data); setSavedAt(c.savedAt); setOffline(true); setError(""); }
        else setError(e.message);
      } else setError((e as Error).message);
    } finally {
      if (alive.current) { setLoading(false); setRefreshing(false); }
    }
  }, [path]);

  // a new path (e.g. another filter): start over, showing the saved copy first
  const [shownPath, setShownPath] = useState(path);
  if (path !== shownPath) {
    setShownPath(path); setLoading(!!path); setError(""); setOffline(false);
  }

  useEffect(() => {
    let cancelled = false;
    if (path) {
      readCache<T>(path).then((c) => { if (c && !cancelled) { setDataState(c.data); setSavedAt(c.savedAt); setLoading(false); } });
      // load() only sets state after the network call returns
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  return {
    data, error, loading, refreshing, offline, savedAt,
    refresh: async () => { setRefreshing(true); await load(); },
    setData: (d: T) => { setDataState(d); if (path) saveCache(path, d); },
  };
}
