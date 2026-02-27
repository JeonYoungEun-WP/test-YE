import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLeads, useMonthlyLeadCounts } from '../hooks/useLeads'

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

const COLUMNS = [
  { key: 'name', label: '리드명', align: 'left' },
  { key: 'partner_name', label: '고객', align: 'left' },
  { key: 'email_from', label: '이메일', align: 'left' },
  { key: 'expected_revenue', label: '예상 매출', align: 'right' },
  { key: 'stage_id', label: '단계', align: 'left' },
  { key: 'user_id', label: '담당자', align: 'left' },
  { key: F.industry, label: '업종', align: 'left' },
  { key: F.product, label: '관심상품', align: 'left' },
  { key: F.platform, label: '플랫폼', align: 'left' },
  { key: F.source, label: '유입경로', align: 'left' },
  { key: F.medium, label: '전달매체', align: 'left' },
  { key: F.campaign, label: '캠페인', align: 'left' },
  { key: F.landing, label: '랜딩', align: 'left' },
  { key: F.keyword, label: '키워드', align: 'left' },
  { key: 'create_date', label: '생성일', align: 'left' },
]

function SortArrow({ field, sortField, sortDir }) {
  if (field !== sortField) return <span className="ml-1 text-muted-foreground/40">&#8597;</span>
  return <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
}

export default function NewPage() {
  const [page, setPage] = useState(0)
  const [sortField, setSortField] = useState('create_date')
  const [sortDir, setSortDir] = useState('desc')
  const monthly = useMonthlyLeadCounts()

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(0)
  }

  const { data: leads, total, loading, error, source } = useLeads({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    sortField,
    sortDir,
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
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="text-sm text-muted-foreground">
                총 {total.toLocaleString()}건
                <span className="ml-1 text-xs opacity-60">({source === 'supabase' ? 'DB' : 'Odoo'})</span>
              </span>
            )}
            <button
              onClick={() => {
                fetch('/api/sync-leads').then(r => r.json()).then(r => {
                  alert(`동기화 완료: ${r.synced}건 (${r.mode})`)
                  window.location.reload()
                }).catch(() => alert('동기화 실패'))
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/50"
            >
              동기화
            </button>
          </div>
        </div>

        {!monthly.loading && (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-1 py-2 font-medium text-left min-w-[50px]">날짜</th>
                  {Array.from({ length: monthly.daysInMonth }, (_, i) => {
                    const dow = new Date(monthly.year, monthly.month, i + 1).getDay()
                    const color = dow === 0 ? 'text-destructive' : dow === 6 ? 'text-blue-500' : ''
                    return (
                      <th key={i} className={`px-1 py-2 font-medium min-w-[32px] ${color}`}>
                        {monthly.month + 1}/{i + 1}
                      </th>
                    )
                  })}
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
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={`px-2 py-2 font-medium cursor-pointer select-none hover:bg-muted/80 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        <SortArrow field={col.key} sortField={sortField} sortDir={sortDir} />
                      </th>
                    ))}
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
                        {COLUMNS.map((col) => {
                          const v = lead[col.key]
                          // 특수 렌더링
                          if (col.key === 'expected_revenue') {
                            return (
                              <td key={col.key} className="px-2 py-2 text-right">
                                {v ? Number(v).toLocaleString('ko-KR') + '원' : '-'}
                              </td>
                            )
                          }
                          if (col.key === F.source) {
                            return (
                              <td key={col.key} className={`px-2 py-2 ${v === 'organic' ? 'font-bold text-destructive' : ''}`}>
                                {val(v)}
                              </td>
                            )
                          }
                          if (col.key === F.landing) {
                            return (
                              <td key={col.key} className="px-2 py-2">
                                {v && v !== false && String(v).toLowerCase() !== 'none' ? (
                                  <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{v}</a>
                                ) : '-'}
                              </td>
                            )
                          }
                          if (col.key === 'create_date') {
                            return (
                              <td key={col.key} className="px-2 py-2 text-muted-foreground">
                                {v ? new Date(v).toLocaleDateString('ko-KR') : '-'}
                              </td>
                            )
                          }
                          if (col.key === 'name') {
                            return <td key={col.key} className="px-2 py-2 font-medium">{val(v)}</td>
                          }
                          return <td key={col.key} className="px-2 py-2">{val(v)}</td>
                        })}
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
