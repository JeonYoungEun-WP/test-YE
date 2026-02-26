import { useEffect, useState } from 'react';
import { Users, Eye } from 'lucide-react';
import { fetchGA4Data } from '@/lib/ga4';
import { formatNumber } from '@/lib/format';

interface YesterdayStats {
  visitors: number;
  pageViews: number;
}

export function GA4YesterdayBanner() {
  const [stats, setStats] = useState<YesterdayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  const displayDate = `${yesterday.getFullYear()}.${String(yesterday.getMonth() + 1).padStart(2, '0')}.${String(yesterday.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    fetchGA4Data('custom', dateStr, dateStr)
      .then((data) => {
        if (data) {
          setStats({
            visitors: data.totalVisitors,
            pageViews: data.totalPageViews,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [dateStr]);

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">어제 GA4 실시간 리포트</p>
            <p className="text-xs text-muted-foreground">{displayDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">방문자 수</p>
              <p className="text-xl font-bold text-foreground">
                {loading ? (
                  <span className="text-muted-foreground animate-pulse">···</span>
                ) : error ? (
                  <span className="text-sm text-destructive">오류</span>
                ) : (
                  formatNumber(stats?.visitors ?? 0)
                )}
              </p>
            </div>
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Eye className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">페이지뷰 (PVs)</p>
              <p className="text-xl font-bold text-foreground">
                {loading ? (
                  <span className="text-muted-foreground animate-pulse">···</span>
                ) : error ? (
                  <span className="text-sm text-destructive">오류</span>
                ) : (
                  formatNumber(stats?.pageViews ?? 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
