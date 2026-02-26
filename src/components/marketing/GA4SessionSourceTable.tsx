import { useEffect, useState } from 'react';
import { fetchGA4Data } from '@/lib/ga4';
import { formatNumber } from '@/lib/format';

interface SourceRow {
  source: string;
  sessions: number;
}

function calcChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function formatDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function GA4SessionSourceTable() {
  const [lastWeekSources, setLastWeekSources] = useState<SourceRow[]>([]);
  const [prevWeekSources, setPrevWeekSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const today = new Date();

  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay());
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);

  const prevSunday = new Date(lastMonday);
  prevSunday.setDate(lastMonday.getDate() - 1);
  const prevMonday = new Date(prevSunday);
  prevMonday.setDate(prevSunday.getDate() - 6);

  const lastMondayStr = formatDateStr(lastMonday);
  const lastSundayStr = formatDateStr(lastSunday);
  const prevMondayStr = formatDateStr(prevMonday);
  const prevSundayStr = formatDateStr(prevSunday);

  const lastWeekLabel = `${formatDisplayDate(lastMonday)}~${formatDisplayDate(lastSunday)}`;
  const prevWeekLabel = `${formatDisplayDate(prevMonday)}~${formatDisplayDate(prevSunday)}`;

  useEffect(() => {
    Promise.all([
      fetchGA4Data('custom', lastMondayStr, lastSundayStr),
      fetchGA4Data('custom', prevMondayStr, prevSundayStr),
    ])
      .then(([lw, pw]) => {
        setLastWeekSources(lw?.sessionSources ?? []);
        setPrevWeekSources(pw?.sessionSources ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [lastMondayStr, lastSundayStr, prevMondayStr, prevSundayStr]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <p className="text-sm font-semibold mb-3">세션 소스 TOP 10</p>
        <p className="text-sm text-muted-foreground animate-pulse">로딩 중···</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <p className="text-sm font-semibold mb-3">세션 소스 TOP 10</p>
        <p className="text-sm text-destructive">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const prevMap = new Map(prevWeekSources.map((s) => [s.source, s.sessions]));

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <p className="text-sm font-semibold mb-3">세션 소스 TOP 10</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">#</th>
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">세션 소스</th>
              <th className="text-right py-2 px-4 font-medium text-muted-foreground">지난 주<br /><span className="text-[10px] font-normal">({lastWeekLabel})</span></th>
              <th className="text-right py-2 px-4 font-medium text-muted-foreground">지지난 주<br /><span className="text-[10px] font-normal">({prevWeekLabel})</span></th>
              <th className="text-right py-2 pl-4 font-medium text-muted-foreground">등락률</th>
            </tr>
          </thead>
          <tbody>
            {lastWeekSources.map((row, i) => {
              const prevSessions = prevMap.get(row.source) ?? 0;
              const change = calcChange(row.sessions, prevSessions);
              const isUp = change !== null && change > 0;
              const isDown = change !== null && change < 0;

              return (
                <tr key={row.source} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
                  <td className="py-2.5 pr-4 font-medium">{row.source || '(direct)'}</td>
                  <td className="py-2.5 px-4 text-right font-semibold">{formatNumber(row.sessions)}</td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground">{formatNumber(prevSessions)}</td>
                  <td className={`py-2.5 pl-4 text-right font-medium ${isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {change !== null ? (
                      <>{isUp ? '▲' : isDown ? '▼' : '-'}{Math.abs(change).toFixed(1)}%</>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
