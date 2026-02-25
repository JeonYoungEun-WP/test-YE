import { useEffect, useState } from 'react';
import { fetchGA4Data, type GA4Data } from '@/lib/ga4';

interface UseGA4DataResult {
  data: GA4Data | null;
  loading: boolean;
  error: string | null;
}

export function useGA4Data(
  period: string,
  customStart?: string,
  customEnd?: string,
): UseGA4DataResult {
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchGA4Data(period, customStart, customEnd)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period, customStart, customEnd]);

  return { data, loading, error };
}
