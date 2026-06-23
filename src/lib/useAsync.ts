import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ApiError } from "./api";

// Fetch-on-mount + refetch-on-focus + pull-to-refresh helper.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        setData(await run());
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not load data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [run],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Refetch when the screen regains focus (e.g. after creating something).
  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  return { data, loading, refreshing, error, refresh: () => load(true), reload: () => load() };
}
