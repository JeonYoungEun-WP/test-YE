export interface GA4Data {
  totalVisitors: number;
  totalPageViews: number;
  dailyTrend: { date: string; visitors: number; pageViews: number }[];
  sessionSources?: { source: string; sessions: number }[];
  channelGroups?: { channel: string; sessions: number }[];
}

const GA4_API_URL = import.meta.env.VITE_GA4_API_URL || '/api/ga4report';

function periodToDateRange(
  period: string,
  customStart?: string,
  customEnd?: string,
): { startDate: string; endDate: string } | null {
  if (period === 'custom') {
    if (!customStart || !customEnd) return null;
    return { startDate: customStart, endDate: customEnd };
  }
  if (period === 'all') {
    return { startDate: '2020-01-01', endDate: 'today' };
  }
  const days = parseInt(period);
  if (isNaN(days)) return null;
  return { startDate: `${days - 1}daysAgo`, endDate: 'today' };
}

export async function fetchGA4Data(
  period: string,
  customStart?: string,
  customEnd?: string,
): Promise<GA4Data | null> {
  const range = periodToDateRange(period, customStart, customEnd);
  if (!range) return null;
  const params = new URLSearchParams({ startDate: range.startDate, endDate: range.endDate });
  const res = await fetch(`${GA4_API_URL}?${params}`);
  if (!res.ok) throw new Error(`GA4 fetch failed: ${res.status}`);
  return res.json();
}
