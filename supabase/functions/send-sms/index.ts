import { corsHeaders } from '../_shared/cors.ts';

type SmsRequest = {
  kind: 'sale' | 'rc_status';
  phone: string;
  customerName: string;
  orderId: number | string;
  vehicleName?: string;
  amount?: number;
  rcStatus?: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await request.json() as SmsRequest;
    const apiKey = Deno.env.get('RENFLAIR_API_KEY');
    if (!apiKey) return json({ success: false, error: 'RENFLAIR_API_KEY is not configured' }, 500);
    if (!body.phone || !body.customerName || !body.orderId) return json({ success: false, error: 'phone, customerName and orderId are required' }, 400);

    const phone = body.phone.replace(/\D/g, '').slice(-10);
    const endpoint = body.kind === 'sale' ? 'V3.php' : 'V4.php';
    const url = new URL(`https://sms.renflair.in/${endpoint}`);
    const message = body.kind === 'sale'
      ? `Dear ${body.customerName}, your ${body.vehicleName || 'Hero MotoCorp vehicle'} sale is confirmed for Rs ${Number(body.amount || 0).toLocaleString('en-IN')}. Sale ID: #${body.orderId}. Thank you for choosing Hero MotoCorp.`
      : `Dear ${body.customerName}, your RC application is now ${body.rcStatus || 'updated'}. Sale ID: #${body.orderId}. Thank you for choosing Hero MotoCorp.`;
    url.searchParams.set('API', apiKey);
    url.searchParams.set('PHONE', phone);
    url.searchParams.set('OID', String(body.orderId));
    url.searchParams.set('MESSAGE', message);
    url.searchParams.set('MSG', message);
    if (body.kind === 'sale') url.searchParams.set('CNAME', body.customerName);

    const response = await fetch(url.toString());
    const responseText = await response.text();
    let providerResponse: unknown = responseText;
    try { providerResponse = JSON.parse(responseText); } catch { /* provider may return plain text */ }
    return json({ success: response.ok, providerResponse, kind: body.kind, status: body.rcStatus ?? null });
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : 'SMS request failed' }, 500);
  }
});
