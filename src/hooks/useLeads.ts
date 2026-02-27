import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { searchRead, searchCount } from '../lib/odoo'

// Odoo 커스텀 필드 → Supabase 컬럼 매핑
const ODOO_TO_SB: Record<string, string> = {
  name: 'name',
  partner_name: 'partner_name',
  email_from: 'email_from',
  expected_revenue: 'expected_revenue',
  stage_id: 'stage_name',
  user_id: 'user_name',
  create_date: 'create_date',
  x_studio_selection_field_49m_1i3fcoqk9: 'industry',
  x_studio_selection_field_45h_1i3fd9s90: 'product',
  x_studio_selection_field_oo_1i57nj2og: 'platform',
  x_studio_selection_field_8p8_1i3up6bfn: 'source',
  x_studio_selection_field_5f4_1i3up2qg3: 'medium',
  'x_studio_': 'campaign',
  x_studio_char_field_1vr_1i3fco0k9: 'landing',
  x_studio_char_field_3ao_1i3fcoas5: 'keyword',
}

// Supabase 행을 Odoo 형식으로 변환 (기존 NewPage 렌더링과 호환)
function mapRow(row: Record<string, unknown>) {
  const result: Record<string, unknown> = { id: row.id }
  for (const [odooKey, sbCol] of Object.entries(ODOO_TO_SB)) {
    result[odooKey] = row[sbCol] ?? '-'
  }
  return result
}

interface UseLeadsOptions {
  limit?: number
  offset?: number
  sortField?: string
  sortDir?: 'asc' | 'desc'
}

export function useLeads({
  limit = 20,
  offset = 0,
  sortField = 'create_date',
  sortDir = 'desc',
}: UseLeadsOptions) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'supabase' | 'odoo'>('supabase')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const sbSortField = ODOO_TO_SB[sortField] || sortField

    const fetchSupabase = async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: rows, error: sbErr, count } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact' })
        .order(sbSortField, { ascending: sortDir === 'asc' })
        .range(offset, offset + limit - 1)

      if (sbErr) throw sbErr
      return { records: (rows || []).map(mapRow), total: count || 0 }
    }

    const fetchOdoo = async () => {
      const fields = Object.keys(ODOO_TO_SB)
      const [records, count] = await Promise.all([
        searchRead('crm.lead', [], fields, { limit, offset, order: `${sortField} ${sortDir}` }),
        searchCount('crm.lead', []),
      ])
      return { records, total: count as number }
    }

    fetchSupabase()
      .then(({ records, total }) => {
        if (cancelled) return
        setData(records)
        setTotal(total)
        setSource('supabase')
      })
      .catch(() =>
        fetchOdoo().then(({ records, total }) => {
          if (cancelled) return
          setData(records)
          setTotal(total)
          setSource('odoo')
        })
      )
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [limit, offset, sortField, sortDir])

  return { data, total, loading, error, source }
}

// 월별 리드 카운트 (Supabase 우선, Odoo 폴백)
export function useMonthlyLeadCounts() {
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endMonth = month + 2 > 12 ? 1 : month + 2
  const endYear = month + 2 > 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  useEffect(() => {
    let cancelled = false

    const fetchSupabase = async () => {
      if (!supabase) throw new Error('No supabase')
      const { data: rows, error: sbErr } = await supabase
        .from('crm_leads')
        .select('create_date')
        .gte('create_date', startDate)
        .lt('create_date', endDate)
        .limit(1000)

      if (sbErr) throw sbErr
      return rows || []
    }

    const fetchOdoo = async () => {
      return searchRead(
        'crm.lead',
        [['create_date', '>=', startDate], ['create_date', '<', endDate]],
        ['create_date'],
        { limit: 1000, order: 'create_date asc' },
      )
    }

    const process = (records: { create_date: string }[]) => {
      const map: Record<number, number> = {}
      records.forEach((r) => {
        const day = new Date(r.create_date).getDate()
        map[day] = (map[day] || 0) + 1
      })
      if (!cancelled) setCounts(map)
    }

    fetchSupabase()
      .then(process)
      .catch(() => fetchOdoo().then(process))
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [startDate, endDate])

  return { counts, daysInMonth, year, month, loading }
}
