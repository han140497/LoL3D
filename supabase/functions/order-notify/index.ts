// LoL3D order notification emails (via Resend)
// Deploy: Supabase Dashboard → Edge Functions → Deploy new function →
//         name it "order-notify" and paste this file.
// Secrets: RESEND_API_KEY  (resend.com → API Keys)
//          EMAIL_FROM      (optional, e.g. "LoL3D <orders@lol3d.in>";
//                           defaults to Resend's onboarding sender, which
//                           can only email the Resend account owner)
//
// Actions (POST):
//   { order_id, kind: "confirmation" } — order-placed email; anyone may
//       trigger it, but it sends only once per order (idempotent) and
//       only to the email stored on the order.
//   { order_id, kind: "status" }       — status-update email; caller must
//       be an admin (checked via their JWT).
//   { order_id, kind: "payment_reported" } — from customer; updates status and emails admin.
//   { order_id, kind: "payment_confirmed" } — from admin; emails customer receipt.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const STATUS_COPY: Record<string, { subject: string; line: string }> = {
  placed: { subject: 'Order received', line: "We've received your order and will confirm payment shortly." },
  paid: { subject: 'Payment received', line: 'Payment confirmed — your order is in the print queue.' },
  printing: { subject: 'Your prints are on the printer!', line: 'Your order is being printed layer by layer right now.' },
  shipped: { subject: 'Your order has shipped 📦', line: "It's on the way! Expect delivery updates by SMS from the courier." },
  delivered: { subject: 'Delivered — enjoy!', line: 'Your order was delivered. We hope you love it — tag @LoL___3D if you share it!' },
  cancelled: { subject: 'Your order was cancelled', line: 'This order has been cancelled. If that seems wrong, just reply to this email.' },
};

function orderEmailHtml(order: Record<string, unknown>, heading: string, line: string): string {
  const items = (order.items as { name: string; material: string; qty: number; unitPrice: number }[])
    .map((i) => `<tr><td style="padding:6px 0;">${i.name} (${i.material}) × ${i.qty}</td><td align="right">${inr(i.unitPrice * i.qty)}</td></tr>`)
    .join('');
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
    <h2 style="color:#ea580c;margin-bottom:4px;">LoL3D</h2>
    <h3 style="margin:16px 0 8px;">${heading}</h3>
    <p style="color:#475569;">Hi ${String(order.customer_name).split(' ')[0]}, ${line}</p>
    <p style="color:#94a3b8;font-size:13px;">Order #${String(order.id).slice(0, 8)}</p>
    <table width="100%" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:12px 0;font-size:14px;">
      ${items}
      <tr><td style="padding:6px 0;color:#475569;">Shipping</td><td align="right">${Number(order.shipping_cost) === 0 ? 'FREE' : inr(order.shipping_cost as number)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:bold;">Total</td><td align="right" style="font-weight:bold;">${inr(order.total as number)}</td></tr>
    </table>
    <p style="font-size:14px;color:#475569;">Delivery to: ${order.address_line1}, ${order.city}, ${order.state} ${order.pincode}</p>
    <p style="font-size:14px;"><a href="https://lol3d.in/account" style="color:#ea580c;">Track your order →</a></p>
    <p style="font-size:12px;color:#94a3b8;">Questions? Reply to this email or DM @LoL___3D on Instagram.</p>
  </div>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { sent: false, reason: 'email_not_configured' };
  const from = Deno.env.get('EMAIL_FROM') ?? 'LoL3D <onboarding@resend.dev>';
  const bcc = Deno.env.get('EMAIL_BCC_ADMIN');
  const body: Record<string, unknown> = { from, to, subject, html };
  if (bcc) body.bcc = bcc;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
    const { order_id, kind } = await req.json();
    if (!order_id || !['confirmation', 'status', 'payment_reported', 'payment_confirmed'].includes(kind)) return json({ error: 'Bad request' }, 400);

    const { data: order, error } = await admin.from('orders').select('*').eq('id', order_id).maybeSingle();
    if (error || !order) return json({ error: 'Order not found' }, 404);
    if (!order.email) return json({ ok: true, emailed: false, reason: 'no_email_on_order' });

    if (kind === 'confirmation') {
      if (order.metadata?.confirmation_sent) return json({ ok: true, emailed: false, reason: 'already_sent' });
      const copy = order.status === 'paid' ? STATUS_COPY.paid : STATUS_COPY.placed;
      const result = await sendEmail(order.email, `${copy.subject} — LoL3D order #${order.id.slice(0, 8)}`,
        orderEmailHtml(order, 'Thanks for your order! 🎉', copy.line));
      if (result.sent) {
        await admin.from('orders').update({ metadata: { ...order.metadata, confirmation_sent: true } }).eq('id', order.id);
      }
      return json({ ok: true, emailed: result.sent, reason: result.reason });
    }

    if (kind === 'payment_reported') {
      const token = req.headers.get('Authorization')?.replace('Bearer ', '');
      const { data: userData } = await admin.auth.getUser(token ?? '');
      // Only the order owner can report payment
      if (!userData.user || userData.user.id !== order.user_id) return json({ error: 'Unauthorized' }, 403);
      
      await admin.from('orders').update({ payment_status: 'reported' }).eq('id', order.id);

      // Email the admin
      const { data: adminProfiles } = await admin.from('profiles').select('id').eq('is_admin', true).limit(1);
      if (adminProfiles?.length) {
        const { data: adminUser } = await admin.auth.admin.getUserById(adminProfiles[0].id);
        const adminEmail = adminUser?.user?.email;
        if (adminEmail) {
          const subject = `Payment reported for order #${order.id.slice(0, 8)}`;
          const html = `<div style="font-family:sans-serif;color:#333;">
            <h2>Payment Reported</h2>
            <p>Customer <strong>${order.customer_name}</strong> has reported paying ${inr(order.total as number)} for order #${order.id.slice(0, 8)}.</p>
            <p>Check your UPI app / bank statement to verify.</p>
            <p><a href="https://lol3d.in/admin/orders" style="display:inline-block;padding:10px 20px;background:#ea580c;color:#fff;text-decoration:none;border-radius:5px;">Verify in Dashboard</a></p>
          </div>`;
          await sendEmail(adminEmail, subject, html);
        }
      }
      return json({ ok: true });
    }

    // kind === 'status' or 'payment_confirmed' — admin only
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: userData } = await admin.auth.getUser(token ?? '');
    if (!userData.user) return json({ error: 'Sign in required' }, 401);
    const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', userData.user.id).maybeSingle();
    if (!profile?.is_admin) return json({ error: 'Admins only' }, 403);

    if (kind === 'payment_confirmed') {
      const subject = `Payment received — LoL3D order #${order.id.slice(0, 8)}`;
      const html = orderEmailHtml(order, 'Payment Confirmed! 🎉', 'We have received your payment. Your order is now moving to the print queue.');
      const result = await sendEmail(order.email, subject, html);
      return json({ ok: true, emailed: result.sent, reason: result.reason });
    }

    const copy = STATUS_COPY[order.status] ?? STATUS_COPY.placed;
    const result = await sendEmail(order.email, `${copy.subject} — LoL3D order #${order.id.slice(0, 8)}`,
      orderEmailHtml(order, copy.subject, copy.line));
    return json({ ok: true, emailed: result.sent, reason: result.reason });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 400);
  }
});
