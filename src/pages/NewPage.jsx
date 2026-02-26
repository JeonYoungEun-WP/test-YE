import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOdoo } from '../hooks/useOdoo'

const STAGE_LABELS = {
  won: '성공',
  lost: '실패',
}

const PAGE_SIZE = 20

export default function NewPage() {
  const [page, setPage] = useState(0)

  const { data: leads, total, loading, error } = useOdoo({
    model: 'crm.lead',
    domain: [],
    fields: [
      'name',
      'partner_name',
      'email_from',
      'phone',
      'expected_revenue',
      'stage_id',
      'create_date',
      'user_id',
    ],
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    order: 'create_date desc',
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
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
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">리드명</th>
                    <th className="px-4 py-3 text-left font-medium">고객</th>
                    <th className="px-4 py-3 text-left font-medium">이메일</th>
                    <th className="px-4 py-3 text-left font-medium">전화</th>
                    <th className="px-4 py-3 text-right font-medium">예상 매출</th>
                    <th className="px-4 py-3 text-left font-medium">단계</th>
                    <th className="px-4 py-3 text-left font-medium">담당자</th>
                    <th className="px-4 py-3 text-left font-medium">생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                        리드 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{lead.name || '-'}</td>
                        <td className="px-4 py-3">{lead.partner_name || '-'}</td>
                        <td className="px-4 py-3">{lead.email_from || '-'}</td>
                        <td className="px-4 py-3">{lead.phone || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {lead.expected_revenue
                            ? Number(lead.expected_revenue).toLocaleString('ko-KR') + '원'
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {lead.stage_id
                            ? (Array.isArray(lead.stage_id) ? lead.stage_id[1] : lead.stage_id)
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {lead.user_id
                            ? (Array.isArray(lead.user_id) ? lead.user_id[1] : lead.user_id)
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
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
