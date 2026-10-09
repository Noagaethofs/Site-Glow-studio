// Fonction d'envoi du formulaire (functions/api/contact.js), testée sans navigateur :
// l'appel à Resend est remplacé par un faux qui enregistre ce qui aurait été envoyé.
import { test, expect } from '@playwright/test';
import { onRequestPost } from '../functions/api/contact.js';

const SITE = 'https://glow.example';
const env = { RESEND_API_KEY: 'test', CONTACT_TO: 'hello@glow.example', CONTACT_FROM: 'site@glow.example' };

function call(fields, { headers = {}, resendOk = true } = {}) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.append(k, v);
  const request = new Request(`${SITE}/api/contact`, {
    method: 'POST',
    body,
    headers: { accept: 'application/json', origin: SITE, ...headers },
  });
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    sent.push(JSON.parse(init.body));
    return new Response(resendOk ? '{}' : 'erreur', { status: resendOk ? 200 : 500 });
  };
  return onRequestPost({ request, env })
    .then(async (res) => ({ status: res.status, data: await res.json().catch(() => null), sent }))
    .finally(() => {
      globalThis.fetch = realFetch;
    });
}

const valid = { type: 'site', name: 'Camille', email: 'camille@example.be', message: 'Bonjour,\nun site.' };

test.describe('formulaire : fonction d’envoi', () => {
  test('envoie une demande valide', async () => {
    const { status, data, sent } = await call(valid);
    expect(status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    expect(sent[0].reply_to).toBe(valid.email);
    expect(sent[0].subject).toBe('[GLOW] Site web — Camille');
  });

  test('refuse les champs obligatoires manquants', async () => {
    const { status, sent } = await call({ ...valid, email: 'pas-un-email' });
    expect(status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  test('refuse un envoi depuis un autre site', async () => {
    const { status, sent } = await call(valid, { headers: { origin: 'https://autre-site.example' } });
    expect(status).toBe(403);
    expect(sent).toHaveLength(0);
  });

  test('ignore en silence les robots (champ piège rempli)', async () => {
    const { status, sent } = await call({ ...valid, website: 'http://spam.example' });
    expect(status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  test('échappe le HTML et retire les retours à la ligne du sujet', async () => {
    const { sent } = await call({
      ...valid,
      name: 'Camille\r\nBcc: x@y.z',
      message: '<script>alert(1)</script>',
    });
    expect(sent[0].subject).not.toMatch(/[\r\n]/);
    expect(sent[0].html).not.toContain('<script>');
    expect(sent[0].html).toContain('&lt;script&gt;');
  });

  test('signale une erreur si Resend échoue', async () => {
    const { status, data } = await call(valid, { resendOk: false });
    expect(status).toBe(502);
    expect(data.ok).toBe(false);
  });
});
