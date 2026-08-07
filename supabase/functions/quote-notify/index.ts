// LoL3D custom-quote notification emails (via Resend)
// Deploy: Supabase Dashboard → Edge Functions → Deploy new function →
//         name it "quote-notify" and paste this file.
// Secrets: RESEND_API_KEY  (resend.com → API Keys)
//          EMAIL_FROM      (optional, e.g. "LoL3D <orders@lol3d.in>";
//                           defaults to Resend's onboarding sender, which
//                           can only email the Resend account owner)
//
// The "contact" field on a quote request is free text (phone, email, or
// Instagram handle) — we only attempt an email when it looks like one.
// Otherwise this returns emailed:false and the admin panel shows a
// copy-pasteable message so the request can be answered by phone/DM.
//
// Actions (POST):
//   { request_id, kind: "confirmation" } — sent right after a customer
//       submits a quote request; anyone may trigger it, but it sends only
//       once per request (idempotent) and only if contact looks like an email.
//   { request_id, kind: "status" }       — sent when the admin advances a
//       request to quoted/accepted/declined; caller must be an admin.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

function statusCopy(status: string, metadata: Record<string, unknown>): { subject: string; line: string } {
  const price = metadata?.quoted_price;
  const note = typeof metadata?.admin_message === 'string' ? metadata.admin_message : '';
  switch (status) {
    case 'quoted':
      return {
        subject: 'Your custom print quote is ready',
        line: `Here's your quote: ${price ? inr(Number(price)) : 'see below'}.${note ? ` ${note}` : ''} Reply to confirm and we'll get printing.`,
      };
    case 'accepted':
      return { subject: 'Quote confirmed — into the print queue!', line: `Confirmed at ${price ? inr(Number(price)) : 'the quoted price'} — we're getting started.${note ? ` ${note}` : ''}` };
    case 'declined':
      return { subject: 'About your custom print request', line: note || "Unfortunately we can't take this one on right now. Feel free to reach out with any questions." };
    default:
      return { subject: 'Update on your custom print request', line: note || 'There is an update on your request.' };
  }
}

function quoteEmailHtml(request: Record<string, unknown>, heading: string, line: string): string {
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
    <h2 style="color:#ea580c;margin-bottom:4px;">LoL3D</h2>
    <h3 style="margin:16px 0 8px;">${heading}</h3>
    <p style="color:#475569;">Hi ${String(request.name).split(' ')[0]}, ${line}</p>
    <p style="color:#94a3b8;font-size:13px;">Request #${String(request.id).slice(0, 8)}</p>
    <table width="100%" style="border-top:1px solid #e2e8f0;margin:12px 0;padding-top:12px;font-size:14px;">
      <tr><td style="padding:6px 0;color:#475569;">Your idea</td></tr>
      <tr><td style="padding:6px 0;">${String(request.idea ?? '').slice(0, 400)}</td></tr>
    </table>
    <p style="font-size:14px;"><a href="https://lol3d.in/quote" style="color:#ea580c;">Have another idea? Submit here →</a></p>
    <p style="font-size:12px;color:#94a3b8;">Questions? Reply to this email or DM @LoL___3D on Instagram.</p>
  </div>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { sent: false, reason: 'email_not_configured' };
  const from = Deno.env.get('EMAIL_FROM') ?? 'LoL3D <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { sent: false, reason: err?.message ?? `resend_http_${res.status}` };
  }
  return { sent: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { request_id, kind } = await req.json();
    if (!request_id || !['confirmation', 'status'].includes(kind)) return json({ error: 'Bad request' }, 400);

    const { data: request, error } = await admin.from('quote_requests').select('*').eq('id', request_id).maybeSingle();
    if (error || !request) return json({ error: 'Request not found' }, 404);
    if (!isEmail(String(request.contact ?? ''))) return json({ ok: true, emailed: false, reason: 'contact_not_email' });

    if (kind === 'confirmation') {
      if (request.metadata?.confirmation_sent) return json({ ok: true, emailed: false, reason: 'already_sent' });
      const result = await sendEmail(
        request.contact,
        `Request received — LoL3D custom quote #${request.id.slice(0, 8)}`,
        quoteEmailHtml(request, 'Thanks — we got your idea! 🎉', "we'll get back to you within a day with a price and timeline."),
      );
      if (result.sent) {
        await admin.from('quote_requests').update({ metadata: { ...request.metadata, confirmation_sent: true } }).eq('id', request.id);
      }
      return json({ ok: true, emailed: result.sent, reason: result.reason });
    }

    // kind === 'status' — admin only
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: userData } = await admin.auth.getUser(token ?? '');
    if (!userData.user) return json({ error: 'Sign in required' }, 401);
    const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', userData.user.id).maybeSingle();
    if (!profile?.is_admin) return json({ error: 'Admins only' }, 403);

    const copy = statusCopy(request.status, request.metadata ?? {});
    const result = await sendEmail(
      request.contact,
      `${copy.subject} — LoL3D #${request.id.slice(0, 8)}`,
      quoteEmailHtml(request, copy.subject, copy.line),
    );
    return json({ ok: true, emailed: result.sent, reason: result.reason });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 400);
  }
});
