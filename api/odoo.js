const ODOO_URL = process.env.ODOO_URL || 'https://works.wepick.kr';
const ODOO_DB = process.env.ODOO_DB || 'works';
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // Inject credentials into args if service is "common" (authenticate)
    if (body?.params?.service === 'common' && body?.params?.method === 'authenticate') {
      body.params.args = [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}];
    }

    // Inject credentials into args if service is "object"
    if (body?.params?.service === 'object') {
      const args = body.params.args || [];
      // args: [db, uid, password, model, method, ...rest]
      // Replace db and password with server-side values
      if (args.length >= 3) {
        args[0] = ODOO_DB;
        args[2] = ODOO_API_KEY;
      }
    }

    const response = await fetch(`${ODOO_URL}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
