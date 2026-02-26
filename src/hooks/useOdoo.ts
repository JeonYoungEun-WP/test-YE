import { useState, useEffect } from 'react'
import { searchRead, searchCount } from '../lib/odoo'

interface UseOdooOptions {
  model: string
  domain?: unknown[]
  fields?: string[]
  limit?: number
  offset?: number
  order?: string
}

export function useOdoo<T = Record<string, unknown>>({
  model,
  domain = [],
  fields = [],
  limit = 20,
  offset = 0,
  order,
}: UseOdooOptions) {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      searchRead(model, domain, fields, { limit, offset, order }),
      searchCount(model, domain),
    ])
      .then(([records, count]) => {
        if (!cancelled) {
          setData(records as T[])
          setTotal(count as number)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [model, JSON.stringify(domain), JSON.stringify(fields), limit, offset, order])

  return { data, total, loading, error }
}
