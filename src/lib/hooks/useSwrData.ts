'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, ApiClientOptions } from '@/lib/api/api-client';

export interface UseSwrDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useSwrData<T>(
  url: string | null,
  options: ApiClientOptions & { pollIntervalMs?: number } = {}
): UseSwrDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  const fetchData = useCallback(
    async (force = false) => {
      if (!url) return;

      // If data already exists, mark as refreshing, NOT full loading (preserves old data)
      if (data) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await apiClient.get<T>(url, {
          ...options,
          forceRefresh: force,
        });

        if (isMountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [url, data, options]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    if (!options.pollIntervalMs || options.pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      fetchData(false);
    }, options.pollIntervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [url, options.pollIntervalMs]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return { data, isLoading, isRefreshing, error, refresh };
}
