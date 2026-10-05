/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Reçoit le formulaire, le valide, puis l'envoie par email via l'API Resend
 * (https://resend.com, offre gratuite suffisante pour un site vitrine).
 *
 * Variables d'environnement à définir dans Cloudflare Pages
 * (Settings → Environment variables) :
 *   RESEND_API_KEY   clé API Resend
 *   CONTACT_TO       adresse qui reçoit les demandes (ex. hello@glow.be)
 *   CONTACT_FROM     expéditeur validé chez Resend (ex. "Site GLOW <site@glow.be>")
 *
 * Répond en JSON quand la requête vient du JavaScript du site,
 * ou redirige vers /merci/ pour un envoi classique (sans JS).
 */
const TYPES = { site: 'Site web', photo: 'Photo', video: 'Vidéo', autre: 'Autre' };
const MAX = { name: 120, company: 160, email: 200, phone: 40, message: 5000 };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const escape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const fail = (error, status = 400) => (wantsJson ? json({ ok: false, error }, status) : new Response(error, { status }));

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail('Requête invalide');
  }

  const get = (k) => String(form.get(k) ?? '').trim().slice(0, MAX[k] ?? 200);
  const data = {
    type: TYPES[get('type')] ?? 'Autre',
    name: get('name'),
    company: get('company'),
    email: get('email'),
    phone: get('phone'),
    message: get('message'),
  };

  // Piège anti-spam : un robot remplit le champ caché → on fait semblant d'accepter
  if (get('website')) return wantsJson ? json({ ok: true }) : Response.redirect(new URL('/merci/', request.url), 303);

  if (!data.name || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    return fail('Champs obligatoires manquants ou invalides');
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('Variables RESEND_API_KEY / CONTACT_TO / CONTACT_FROM manquantes');
    return fail('Configuration du formulaire incomplète', 500);
  }

  const rows = [
    ['Type de demande', data.type],
    ['Nom', data.name],
    ['Entreprise', data.company || '—'],
    ['Email', data.email],
    ['Téléphone', data.phone || '—'],
  ];
  const html = `
    <h2 style="font-family:Arial,sans-serif">Nouvelle demande — ${escape(data.type)}</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0">${escape(v)}</td></tr>`).join('')}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap;margin-top:16px">${escape(data.message)}</p>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: data.email,
      subject: `[GLOW] ${data.type} — ${data.name}${data.company ? ` (${data.company})` : ''}`,
      html,
      text: `${rows.map(([k, v]) => `${k} : ${v}`).join('\n')}\n\n${data.message}`,
    }),
  });

  if (!res.ok) {
    console.error('Resend', res.status, await res.text());
    return fail("L'envoi a échoué", 502);
  }

  return wantsJson ? json({ ok: true }) : Response.redirect(new URL('/merci/', request.url), 303);
}
