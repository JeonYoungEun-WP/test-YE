import { useMemo, useRef, useState } from 'react';
import { ArrowDown, Users, MousePointerClick, UserPlus, Mail, PhoneCall, MessageSquare, FileText, Handshake, Monitor, BookOpen, Lightbulb, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/format';
import { useGA4Data } from '@/hooks/useGA4Data';
import { VisitorTrendChart } from './VisitorTrendChart';

interface FunnelStage {
  id: string;
  label: string;
  sublabel: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface LeadMagnetFunnelTabProps {
  deals: {
    id: string;
    stage: string;
    source?: string;
    amount?: number;
    created_at: string;
  }[];
}

const PERIOD_OPTIONS = [
  { value: '7d', label: '최근 7일' },
  { value: '14d', label: '최근 14일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: 'all', label: '전체 기간' },
  { value: 'custom', label: '날짜 선택' },
] as const;

type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value'];

function filterDealsByPeriod(
  deals: LeadMagnetFunnelTabProps['deals'],
  period: PeriodValue,
  customStart?: string,
  customEnd?: string,
) {
  if (period === 'all') return deals;
  if (period === 'custom') {
    if (!customStart || !customEnd) return deals;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return deals.filter(d => {
      const dt = new Date(d.created_at);
      return dt >= start && dt <= end;
    });
  }
  const days = parseInt(period);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);
  return deals.filter(d => new Date(d.created_at) >= cutoff);
}

export function LeadMagnetFunnelTab({ deals }: LeadMagnetFunnelTabProps) {
  const [period, setPeriod] = useState<PeriodValue>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const filteredDeals = useMemo(
    () => filterDealsByPeriod(deals, period, customStart, customEnd),
    [deals, period, customStart, customEnd],
  );

  const { data: ga4Data, loading: ga4Loading, error: ga4Error } = useGA4Data(period, customStart, customEnd);

  const { topStage, simTrack, ebookTrack, insightTrack } = useMemo(() => {
    const stageOrder = ['lead', 'meeting', 'quote', 'contract', 'supply', 'won'];
    const totalDeals = filteredDeals.filter(d => d.stage !== 'lost').length;

    const atOrPast = (minIndex: number) =>
      filteredDeals.filter(d => {
        if (d.stage === 'lost') return false;
        return stageOrder.indexOf(d.stage) >= minIndex;
      }).length;

    const siteVisitors = ga4Data?.totalVisitors ?? 0;

    // Split ratios for simulator vs ebook vs insight
    const simRatio = 0.45;
    const ebookRatio = 0.30;
    const insightRatio = 0.25;

    const simPageVisits = Math.round(siteVisitors * 0.22);
    const ebookPageVisits = Math.round(siteVisitors * 0.18);
    const insightPageVisits = Math.round(siteVisitors * 0.15);

    const signupsTotal = totalDeals > 0 ? totalDeals : 300;
    const simSignups = Math.round(signupsTotal * simRatio);
    const ebookSignups = Math.round(signupsTotal * ebookRatio);
    const insightSignups = Math.round(signupsTotal * insightRatio);

    const simNurtured = simSignups;
    const ebookNurtured = ebookSignups;
    const insightNurtured = insightSignups;

    const inquiriesTotal = atOrPast(1) > 0 ? atOrPast(1) : Math.round(signupsTotal * 0.3);
    const simInquiries = Math.round(inquiriesTotal * simRatio);
    const ebookInquiries = Math.round(inquiriesTotal * ebookRatio);
    const insightInquiries = Math.round(inquiriesTotal * insightRatio);

    const consultationsTotal = Math.round(inquiriesTotal * 0.95);
    const simConsultations = Math.round(consultationsTotal * simRatio);
    const ebookConsultations = Math.round(consultationsTotal * ebookRatio);
    const insightConsultations = Math.round(consultationsTotal * insightRatio);

    const quotesTotal = atOrPast(2) > 0 ? atOrPast(2) : Math.round(consultationsTotal * 0.6);
    const simQuotes = Math.round(quotesTotal * simRatio);
    const ebookQuotes = Math.round(quotesTotal * ebookRatio);
    const insightQuotes = Math.round(quotesTotal * insightRatio);

    const closedTotal = atOrPast(3) > 0 ? atOrPast(3) : Math.round(quotesTotal * 0.2);
    const simClosed = Math.round(closedTotal * simRatio);
    const ebookClosed = Math.round(closedTotal * ebookRatio);
    const insightClosed = Math.round(closedTotal * insightRatio);

    const top: FunnelStage = {
      id: 'visitors',
      label: '사이트 방문자 (GA4)',
      sublabel: '유입 & 탐색',
      count: siteVisitors,
      icon: <Users className="h-5 w-5" />,
      color: 'hsl(var(--primary))',
    };

    const buildTrack = (
      prefix: string,
      icon: React.ReactNode,
      pageLbl: string,
      pageSub: string,
      pageCount: number,
      signup: number,
      nurtured: number,
      inquiries: number,
      consultations: number,
      quotes: number,
      closed: number,
    ): FunnelStage[] => [
      { id: `${prefix}_page`, label: pageLbl, sublabel: pageSub, count: pageCount, icon, color: 'hsl(var(--primary))' },
      { id: `${prefix}_signup`, label: '회원가입 / DB 확보', sublabel: '리드 확보', count: signup, icon: <UserPlus className="h-5 w-5" />, color: 'hsl(var(--accent-foreground))' },
      { id: `${prefix}_nurture`, label: '이메일/문자 발송', sublabel: '리드 너처링', count: nurtured, icon: <Mail className="h-5 w-5" />, color: 'hsl(var(--accent-foreground))' },
      { id: `${prefix}_inquiry`, label: '구매 문의 접수', sublabel: '영업 기회', count: inquiries, icon: <PhoneCall className="h-5 w-5" />, color: '#F59E0B' },
      { id: `${prefix}_consult`, label: '상담 완료', sublabel: '응대', count: consultations, icon: <MessageSquare className="h-5 w-5" />, color: '#F59E0B' },
      { id: `${prefix}_quote`, label: '견적서 발송', sublabel: '제안', count: quotes, icon: <FileText className="h-5 w-5" />, color: '#F59E0B' },
      { id: `${prefix}_closed`, label: '최종 구매 / 계약', sublabel: '매출 실현', count: closed, icon: <Handshake className="h-5 w-5" />, color: '#F97316' },
    ];

    return {
      topStage: top,
      simTrack: buildTrack('sim', <Monitor className="h-5 w-5" />, '페이지도달 : 시뮬레이터', '시뮬레이터 랜딩', simPageVisits, simSignups, simNurtured, simInquiries, simConsultations, simQuotes, simClosed),
      ebookTrack: buildTrack('ebook', <BookOpen className="h-5 w-5" />, '페이지도달 : 전자북', '전자북 랜딩', ebookPageVisits, ebookSignups, ebookNurtured, ebookInquiries, ebookConsultations, ebookQuotes, ebookClosed),
      insightTrack: buildTrack('insight', <Lightbulb className="h-5 w-5" />, '페이지도달 : 인사이트', '인사이트 랜딩', insightPageVisits, insightSignups, insightNurtured, insightInquiries, insightConsultations, insightQuotes, insightClosed),
    };
  }, [filteredDeals, ga4Data]);

  const sections = [
    { title: '2. 리드 확보 (Lead Gen)', indices: [1] },
    { title: '2.5. 리드 너처링', indices: [2] },
    { title: '3. 영업 기회 (Sales Opportunity)', indices: [3, 4, 5] },
    { title: '4. 매출 실현 (Revenue)', indices: [6] },
  ];

  const calcRate = (from: number, to: number) => from > 0 ? (to / from) * 100 : 0;

  const simTotal = simTrack[simTrack.length - 1].count;
  const ebookTotal = ebookTrack[ebookTrack.length - 1].count;
  const insightTotal = insightTrack[insightTrack.length - 1].count;
  const grandTotal = simTotal + ebookTotal + insightTotal;
  const overallRate = topStage.count > 0 ? ((grandTotal / topStage.count) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">리드마그넷 퍼널</h2>
          <p className="text-sm text-muted-foreground mt-1">
            사이트 방문 → 페이지도달(시뮬레이터/전자북/인사이트) → 회원가입 → 너처링 → 문의 → 상담 → 견적 → 계약
          </p>
        </div>
        <div className="relative" ref={datePickerRef}>
          <select
            value={period}
            onChange={(e) => {
              const val = e.target.value as PeriodValue;
              setPeriod(val);
              if (val === 'custom') {
                setShowDatePicker(true);
              } else {
                setShowDatePicker(false);
              }
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value === 'custom' && customStart && customEnd && period === 'custom'
                  ? `${customStart} ~ ${customEnd}`
                  : opt.label}
              </option>
            ))}
          </select>

          {showDatePicker && period === 'custom' && (
            <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border bg-card shadow-lg p-4 min-w-[300px]">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">기간 선택</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">시작일</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">종료일</label>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                disabled={!customStart || !customEnd}
                className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                적용
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {(() => {
        const signupTotal = simTrack[1].count + ebookTrack[1].count + insightTrack[1].count;
        const leadTotal = simTrack[2].count + ebookTrack[2].count + insightTrack[2].count;
        const inquiryTotal = simTrack[3].count + ebookTrack[3].count + insightTrack[3].count;
        return (
          <div className="grid grid-cols-5 gap-3">
            <SummaryCard label="방문자 (GA4)" value={topStage.count} loading={ga4Loading} />
            <SummaryCard label="가입/이메일 확보" value={signupTotal} rate={calcRate(topStage.count, signupTotal)} />
            <SummaryCard label="리드 확보" value={leadTotal} rate={calcRate(signupTotal, leadTotal)} />
            <SummaryCard label="구매 문의" value={inquiryTotal} rate={calcRate(leadTotal, inquiryTotal)} />
            <SummaryCard label="최종 계약" value={grandTotal} rate={calcRate(inquiryTotal, grandTotal)} highlight />
          </div>
        );
      })()}

      {/* GA4 Data Status */}
      {ga4Error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          GA4 데이터 로드 실패: {ga4Error} — 추정값으로 표시 중
        </div>
      )}
      {!ga4Loading && !ga4Error && !ga4Data && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          날짜를 선택해주세요 — GA4 데이터 대기 중
        </div>
      )}

      {/* Visitor Trend Chart */}
      <VisitorTrendChart data={ga4Data?.dailyTrend ?? []} loading={ga4Loading} />

      {/* Funnel Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">퍼널 단계별 현황</CardTitle>
            <span className="text-sm text-muted-foreground">
              전체 전환율: <span className="font-bold text-primary">{overallRate}%</span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Top stage - full width */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                1. 유입 & 탐색 (Acquisition & Activation)
              </p>
              <StageBar stage={topStage} isLast={false} />
            </div>

            {/* Split arrow */}
            <div className="flex items-center justify-center gap-2 py-1">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">3개 트랙으로 분기</span>
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Two-column tracks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <TrackColumn
                title="시뮬레이터 트랙"
                trackColor="hsl(var(--primary))"
                track={simTrack}
                topCount={topStage.count}
                sections={sections}
                calcRate={calcRate}
              />
              <TrackColumn
                title="전자북 트랙"
                trackColor="hsl(var(--accent-foreground))"
                track={ebookTrack}
                topCount={topStage.count}
                sections={sections}
                calcRate={calcRate}
              />
              <TrackColumn
                title="인사이트 트랙"
                trackColor="#8B5CF6"
                track={insightTrack}
                topCount={topStage.count}
                sections={sections}
                calcRate={calcRate}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">단계별 전환율 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">트랙</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">구간</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">이전</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">다음</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">전환율</th>
                  <th className="text-right py-2 pl-4 font-medium text-muted-foreground">이탈률</th>
                </tr>
              </thead>
              <tbody>
                <ConversionRows label="시뮬레이터" topStage={topStage} track={simTrack} calcRate={calcRate} />
                <ConversionRows label="전자북" topStage={topStage} track={ebookTrack} calcRate={calcRate} />
                <ConversionRows label="인사이트" topStage={topStage} track={insightTrack} calcRate={calcRate} />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Sub-components ── */

function SummaryCard({ label, value, rate, highlight = false, loading = false }: { label: string; value: number; rate?: number; highlight?: boolean; loading?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${highlight ? 'bg-orange-500/10 border-orange-500/30' : 'bg-card'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg sm:text-2xl font-bold ${highlight ? 'text-orange-500' : 'text-foreground'}`}>
        {loading ? <span className="text-muted-foreground animate-pulse">···</span> : formatNumber(value)}
      </p>
      {rate !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">전환율 <span className="font-semibold text-primary">{rate.toFixed(1)}%</span></p>
      )}
    </div>
  );
}

function StageBar({ stage, isLast }: { stage: FunnelStage; isLast: boolean }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-lg px-4 py-3 transition-all w-full"
        style={{
          backgroundColor: isLast ? 'hsl(24, 95%, 53%)' : `color-mix(in srgb, ${stage.color} 15%, transparent)`,
          border: isLast ? '2px solid hsl(24, 95%, 53%)' : `1px solid color-mix(in srgb, ${stage.color} 30%, transparent)`,
        }}
      >
        <span className="shrink-0" style={{ color: isLast ? 'white' : stage.color }}>{stage.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isLast ? 'text-white' : 'text-foreground'}`}>{stage.label}</p>
          <p className={`text-xs ${isLast ? 'text-white/70' : 'text-muted-foreground'}`}>{stage.sublabel}</p>
        </div>
        <span className={`text-lg font-bold whitespace-nowrap ${isLast ? 'text-white' : 'text-foreground'}`}>
          {formatNumber(stage.count)}{stage.id.includes('inquiry') || stage.id.includes('consult') || stage.id.includes('quote') || stage.id.includes('closed') ? '건' : '명'}
        </span>
      </div>
    </div>
  );
}

function TrackColumn({
  title,
  trackColor,
  track,
  topCount,
  sections,
  calcRate,
}: {
  title: string;
  trackColor: string;
  track: FunnelStage[];
  topCount: number;
  sections: { title: string; indices: number[] }[];
  calcRate: (from: number, to: number) => number;
}) {
  return (
    <div className="rounded-xl border p-4 space-y-0">
      <p className="text-sm font-bold mb-3" style={{ color: trackColor }}>{title}</p>

      {/* Page reach stage */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        페이지 도달
      </p>
      <StageBar stage={track[0]} isLast={false} />
      <ConversionArrow rate={calcRate(topCount, track[0].count)} isMajor />

      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-3">
            {section.title}
          </p>
          {section.indices.map((idx) => {
            const stage = track[idx];
            const prevCount = idx === 1 ? track[0].count : track[idx - 1].count;
            const rate = calcRate(prevCount, stage.count);
            const isLast = idx === track.length - 1;

            return (
              <div key={stage.id}>
                {idx > 0 && section.indices[0] === idx && (
                  <ConversionArrow rate={rate} isMajor />
                )}
                {idx > 0 && section.indices[0] !== idx && (
                  <ConversionArrow rate={rate} isMajor={false} />
                )}
                <StageBar stage={stage} isLast={isLast} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ConversionArrow({ rate, isMajor }: { rate: number; isMajor: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <ArrowDown className={isMajor ? 'h-4 w-4 text-muted-foreground' : 'h-3 w-3 text-muted-foreground/60'} />
      <span className={isMajor ? 'text-xs font-medium text-muted-foreground' : 'text-[11px] text-muted-foreground/60'}>
        {isMajor ? `전환율 ${rate.toFixed(1)}%` : `${rate.toFixed(1)}%`}
      </span>
    </div>
  );
}

function ConversionRows({
  label,
  topStage,
  track,
  calcRate,
}: {
  label: string;
  topStage: FunnelStage;
  track: FunnelStage[];
  calcRate: (from: number, to: number) => number;
}) {
  return (
    <>
      {track.map((stage, idx) => {
        const from = idx === 0 ? topStage : track[idx - 1];
        const rate = calcRate(from.count, stage.count);
        const dropOff = 100 - rate;
        return (
          <tr key={stage.id} className="border-b last:border-0">
            {idx === 0 && (
              <td className="py-2.5 pr-4 font-medium text-muted-foreground" rowSpan={track.length}>
                {label}
              </td>
            )}
            <td className="py-2.5 pr-4 font-medium">{from.label} → {stage.label}</td>
            <td className="py-2.5 px-4 text-right">{formatNumber(from.count)}</td>
            <td className="py-2.5 px-4 text-right">{formatNumber(stage.count)}</td>
            <td className="py-2.5 px-4 text-right font-semibold text-primary">{rate.toFixed(1)}%</td>
            <td className={`py-2.5 pl-4 text-right font-medium ${dropOff > 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {dropOff.toFixed(1)}%
            </td>
          </tr>
        );
      })}
    </>
  );
}
