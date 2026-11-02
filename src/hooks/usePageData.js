import { useState, useEffect, useRef, useCallback } from 'react';

export function usePageData(fetcher, deps = [], options = {}) {
  const { minDisplayTime = 300 } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const abortControllerRef = useRef(null);

  const execute = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      const result = await fetcherRef.current(controller.signal);
      if (controller.signal.aborted) return;

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      if (!controller.signal.aborted) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (controller.signal.aborted || err?.name === 'AbortError') return;

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  }, [minDisplayTime]);

  useEffect(() => {
    execute();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: execute };
}

export default usePageData;
