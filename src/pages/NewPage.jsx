import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useOdoo } from '../hooks/useOdoo'
import { searchRead } from '../lib/odoo'

const PAGE_SIZE = 20

// Odoo 커스텀 필드명 매핑
const F = {
  industry: 'x_studio_selection_field_49m_1i3fcoqk9',
  product: 'x_studio_selection_field_45h_1i3fd9s90',
  platform: 'x_studio_selection_field_oo_1i57nj2og',
  source: 'x_studio_selection_field_8p8_1i3up6bfn',
  medium: 'x_studio_selection_field_5f4_1i3up2qg3',
  campaign: 'x_studio_',
  landing: 'x_studio_char_field_1vr_1i3fco0k9',
  keyword: 'x_studio_char_field_3ao_1i3fcoas5',
}

function val(v) {
  if (!v || v === false) return '-'
  if (Array.isArray(v)) return v[1] || '-'
  return v
}

function useMonthlyLeadCounts() {
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month + 2).padStart(2, '0')}-01`

  useEffect(() => {
    let cancelled = false
    searchRead('crm.lead', [['create_date', '>=', startDate], ['create_date', '<', endDate]], ['create_date'], { limit: 1000, order: 'create_date asc' })
      .then((records) => {
        if (cancelled) return
        const map = {}
        records.forEach((r) => {
          const day = new Date(r.create_date).getDate()
          map[day] = (map[day] || 0) + 1
        })
        setCounts(map)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [startDate, endDate])

  return { counts, daysInMonth, year, month, loading }
}

export default function NewPage() {
  const [page, setPage] = useState(0)
  const monthly = useMonthlyLeadCounts()

  const { data: leads, total, loading, error } = useOdoo({
    model: 'crm.lead',
    domain: [],
    fields: [
      'name',
      'partner_name',
      'email_from',
      'expected_revenue',
      'stage_id',
      'create_date',
      'user_id',
      F.industry,
      F.product,
      F.platform,
      F.source,
      F.medium,
      F.campaign,
      F.landing,
      F.keyword,
    ],
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    order: 'create_date desc',
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-primary hover:underline">
            &larr; GA 리포트로 돌아가기
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">CRM 리드 관리</h1>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              총 {total.toLocaleString()}건
            </span>
          )}
        </div>

        {!monthly.loading && (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-1 py-2 font-medium text-left min-w-[50px]">날짜</th>
                  {Array.from({ length: monthly.daysInMonth }, (_, i) => (
                    <th key={i} className="px-1 py-2 font-medium min-w-[32px]">
                      {monthly.month + 1}/{i + 1}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-bold bg-muted">합계</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-1 py-2 font-medium text-left">리드수</td>
                  {Array.from({ length: monthly.daysInMonth }, (_, i) => {
                    const count = monthly.counts[i + 1] || 0
                    return (
                      <td key={i} className={`px-1 py-2 ${count > 0 ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {count || '-'}
                      </td>
                    )
                  })}
                  <td className="px-2 py-2 font-bold bg-muted">
                    {Object.values(monthly.counts).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Odoo 연결 오류: {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-muted-foreground">데이터를 불러오는 중...</div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-2 py-2 text-left font-medium">리드명</th>
                    <th className="px-2 py-2 text-left font-medium">고객</th>
                    <th className="px-2 py-2 text-left font-medium">이메일</th>
                    <th className="px-2 py-2 text-right font-medium">예상 매출</th>
                    <th className="px-2 py-2 text-left font-medium">단계</th>
                    <th className="px-2 py-2 text-left font-medium">담당자</th>
                    <th className="px-2 py-2 text-left font-medium">업종</th>
                    <th className="px-2 py-2 text-left font-medium">관심상품</th>
                    <th className="px-2 py-2 text-left font-medium">플랫폼</th>
                    <th className="px-2 py-2 text-left font-medium">유입경로</th>
                    <th className="px-2 py-2 text-left font-medium">전달매체</th>
                    <th className="px-2 py-2 text-left font-medium">캠페인</th>
                    <th className="px-2 py-2 text-left font-medium">랜딩</th>
                    <th className="px-2 py-2 text-left font-medium">키워드</th>
                    <th className="px-2 py-2 text-left font-medium">생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="px-4 py-10 text-center text-muted-foreground">
                        리드 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-2 py-2 font-medium">{val(lead.name)}</td>
                        <td className="px-2 py-2">{val(lead.partner_name)}</td>
                        <td className="px-2 py-2">{val(lead.email_from)}</td>
                        <td className="px-2 py-2 text-right">
                          {lead.expected_revenue
                            ? Number(lead.expected_revenue).toLocaleString('ko-KR') + '원'
                            : '-'}
                        </td>
                        <td className="px-2 py-2">{val(lead.stage_id)}</td>
                        <td className="px-2 py-2">{val(lead.user_id)}</td>
                        <td className="px-2 py-2">{val(lead[F.industry])}</td>
                        <td className="px-2 py-2">{val(lead[F.product])}</td>
                        <td className="px-2 py-2">{val(lead[F.platform])}</td>
                        <td className={`px-2 py-2 ${lead[F.source] === 'organic' ? 'font-bold text-destructive' : ''}`}>{val(lead[F.source])}</td>
                        <td className="px-2 py-2">{val(lead[F.medium])}</td>
                        <td className="px-2 py-2">{val(lead[F.campaign])}</td>
                        <td className="px-2 py-2 max-w-[150px] truncate" title={val(lead[F.landing])}>
                          {val(lead[F.landing])}
                        </td>
                        <td className="px-2 py-2">{val(lead[F.keyword])}</td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {lead.create_date
                            ? new Date(lead.create_date).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/50 disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/50 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
