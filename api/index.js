export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'apikey, authorization, content-type, prefer, x-upsert');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = 'https://zbdhvfexyjocxqmkobdo.supabase.co';
  const BUCKET = 'gec_bucket';
  const path = req.url.replace(/^\/api/, '') || '/';

  // ─── PHOTO BYTE UPLOAD ───
  if (path === '/photo-upload' && req.method === 'POST') {
    const { base64, filename } = req.body || {};
    if (!base64 || !filename) return res.status(400).json({ error: 'Missing base64 or filename' });
    try {
      const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
      const up = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(filename)}`,
        {
          method: 'POST',
          headers: {
            apikey: req.headers['apikey'] || '',
            Authorization: req.headers['authorization'] || '',
            'x-upsert': 'true'
          },
          body: buffer
        }
      );
      if (!up.ok) return res.status(500).json({ error: await up.text() });
           return res.status(200).json({
        success: true,
        url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/storage/v1/object/public/${BUCKET}/${encodeURIComponent(filename)}`
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ─── DB / REST PASS-THROUGH ───
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
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
