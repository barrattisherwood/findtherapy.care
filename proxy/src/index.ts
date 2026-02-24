import 'dotenv/config';
import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT ?? 3001;

const ARCLINK_URL = process.env.ARCLINK_URL ?? 'https://api.arclink.dev';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? 'https://findtherapy.care')
  .split(',')
  .map(o => o.trim());

const SITE_CONTACT_TENANT_ID = process.env.SITE_CONTACT_TENANT_ID;
const SITE_CONTACT_API_KEY = process.env.SITE_CONTACT_API_KEY;

const PROVIDER_CONTACT_TENANT_ID = process.env.PROVIDER_CONTACT_TENANT_ID;
const PROVIDER_CONTACT_API_KEY = process.env.PROVIDER_CONTACT_API_KEY;

app.use(express.json());

function corsHeaders(res: Response, origin: string): void {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function forwardToArclink(
  req: Request,
  res: Response,
  tenantId: string | undefined,
  apiKey: string | undefined,
): Promise<void> {
  const origin = req.headers.origin ?? '';

  if (!ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'Invalid origin' });
    return;
  }

  if (!tenantId || !apiKey) {
    console.error('Tenant ID or API key not configured');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  corsHeaders(res, origin);

  let arclinkRes: globalThis.Response;
  try {
    arclinkRes = await fetch(`${ARCLINK_URL}/submit/${tenantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'origin': ALLOWED_ORIGINS[0],
      },
      body: JSON.stringify(req.body),
    });
  } catch (err) {
    console.error('Failed to reach arclink:', err);
    res.status(502).json({ error: 'Failed to reach arclink' });
    return;
  }

  const data = await arclinkRes.json();
  res.status(arclinkRes.status).json(data);
}

// ── Site contact form ────────────────────────────────────────────────────────
app.options('/contact', (req, res) => {
  corsHeaders(res, req.headers.origin ?? ALLOWED_ORIGINS[0]);
  res.sendStatus(204);
});

app.post('/contact', (req: Request, res: Response): Promise<void> => {
  return forwardToArclink(req, res, SITE_CONTACT_TENANT_ID, SITE_CONTACT_API_KEY);
});

// ── Provider contact form ────────────────────────────────────────────────────
app.options('/provider-contact', (req, res) => {
  corsHeaders(res, req.headers.origin ?? ALLOWED_ORIGINS[0]);
  res.sendStatus(204);
});

app.post('/provider-contact', (req: Request, res: Response): Promise<void> => {
  return forwardToArclink(req, res, PROVIDER_CONTACT_TENANT_ID, PROVIDER_CONTACT_API_KEY);
});

app.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`);
});
