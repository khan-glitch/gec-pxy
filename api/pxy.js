export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  const SUPABASE_URL = 'https://zbdhvfexyjocxqmkobdo.supabase.co';
  const path = req.url.replace(/^\/api\/pxy/, '');
  const target = SUPABASE_URL + path;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        'apikey': req.headers['apikey'] || '',
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
        'Prefer': req.headers['prefer'] || ''
      },
      body: (req.method !== 'GET' && req.method !== 'HEAD' && req.body)
        ? JSON.stringify(req.body)
        : undefined
    });

    const buffer = await response.arrayBuffer();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
