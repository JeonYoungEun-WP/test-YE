const ODOO_DB = import.meta.env.VITE_ODOO_DB
const ODOO_USERNAME = import.meta.env.VITE_ODOO_USERNAME
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY

let uidCache: number | null = null

async function jsonRpc(service: string, method: string, args: unknown[]) {
  const res = await fetch('/api/odoo/jsonrpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: Date.now(),
    }),
  })
  const data = await res.json()
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || 'Odoo RPC error')
  }
  return data.result
}

export async function authenticate(): Promise<number> {
  if (uidCache) return uidCache
  const uid = await jsonRpc('common', 'authenticate', [
    ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {},
  ])
  if (!uid) throw new Error('Odoo 인증 실패: 자격 증명을 확인해주세요.')
  uidCache = uid
  return uid
}

export async function execute(model: string, method: string, ...args: unknown[]) {
  const uid = await authenticate()
  return jsonRpc('object', 'execute', [
    ODOO_DB, uid, ODOO_API_KEY, model, method, ...args,
  ])
}

export async function searchRead(
  model: string,
  domain: unknown[] = [],
  fields: string[] = [],
  options: { limit?: number; offset?: number; order?: string } = {},
) {
  const uid = await authenticate()
  return jsonRpc('object', 'execute_kw', [
    ODOO_DB, uid, ODOO_API_KEY, model, 'search_read',
    [domain],
    { fields, ...options },
  ])
}

export async function searchCount(model: string, domain: unknown[] = []) {
  const uid = await authenticate()
  return jsonRpc('object', 'execute_kw', [
    ODOO_DB, uid, ODOO_API_KEY, model, 'search_count',
    [domain],
  ])
}
