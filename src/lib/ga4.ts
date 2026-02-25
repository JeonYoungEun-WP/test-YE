export interface GA4Data {
  totalVisitors: number;
  dailyTrend: { date: string; visitors: number }[];
}

const GA4_API_URL = import.meta.env.VITE_GA4_API_URL || '/api/ga4report';

function periodToDateRange(
  period: string,
  customStart?: string,
  customEnd?: string,
): { startDate: string; endDate: string } {
  if (period === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }
  if (period === 'all') {
    return { startDate: '2020-01-01', endDate: 'today' };
  }
  const days = parseInt(period);
  return { startDate: `${days}daysAgo`, endDate: 'today' };
}

export async function fetchGA4Data(
  period: string,
  customStart?: string,
  customEnd?: string,
): Promise<GA4Data> {
  const { startDate, endDate } = periodToDateRange(period, customStart, customEnd);
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`${GA4_API_URL}?${params}`);
  if (!res.ok) throw new Error(`GA4 fetch failed: ${res.status}`);
  return res.json();
}
