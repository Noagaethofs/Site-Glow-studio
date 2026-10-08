/**
 * Formulaire de contact.
 * - Type de demande pré-rempli : data-preset sur le formulaire, paramètre
 *   d'URL ?type=photo, ou liens [data-preset-link] (« Vidéo » → type vidéo).
 * - Validation simple et accessible, envoi en fetch vers /api/contact.
 * - Sans JavaScript, le formulaire s'envoie normalement (POST classique).
 */
const MESSAGES = {
  required: 'Ce champ est nécessaire.',
  email: 'Cette adresse email ne semble pas valide.',
  sent: 'Merci, votre demande est bien partie. Nous revenons vers vous très vite.',
  error: "L'envoi n'a pas fonctionné. Réessayez ou écrivez-nous directement par email.",
};

const setType = (form, value) => {
  const input = form.querySelector(`input[name="type"][value="${value}"]`);
  if (input) input.checked = true;
};

function validate(form) {
  let firstInvalid = null;
  form.querySelectorAll('[required]').forEach((input) => {
    const field = input.closest('.field');
    field.querySelector('.field__error')?.remove();
    field.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');

    let error = '';
    if (!input.value.trim()) error = MESSAGES.required;
    else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) error = MESSAGES.email;

    if (error) {
      const msg = document.createElement('p');
      msg.className = 'field__error';
      msg.id = `${input.id}-error`;
      msg.textContent = error;
      field.appendChild(msg);
      field.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', msg.id);
      firstInvalid ??= input;
    }
  });
  firstInvalid?.focus();
  return !firstInvalid;
}

export function initForms() {
  const forms = document.querySelectorAll('[data-form]');
  const urlType = new URLSearchParams(location.search).get('type');

  forms.forEach((form) => {
    if (form.dataset.preset) setType(form, form.dataset.preset);
    if (urlType) setType(form, urlType);

    const status = form.querySelector('[data-form-status]');
    const label = form.querySelector('[data-form-label]');
    const labelText = label.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate(form)) return;

      form.classList.add('is-sending');
      label.textContent = 'Envoi…';
      status.textContent = '';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || res.statusText);
        form.classList.add('is-sent');
        status.textContent = MESSAGES.sent;
        form.reset();
      } catch (err) {
        console.error('[GLOW] Formulaire :', err);
        status.textContent = MESSAGES.error;
      } finally {
        form.classList.remove('is-sending');
        label.textContent = labelText;
      }
    });
  });

  // Liens qui pré-sélectionnent un type avant de descendre au formulaire
  document.querySelectorAll('[data-preset-link]').forEach((link) => {
    link.addEventListener('click', () => {
      forms.forEach((form) => setType(form, link.dataset.presetLink));
      // formulaire replié dans la carte de contact : on l'ouvre
      document.querySelectorAll('[data-cta-form]').forEach((d) => { d.open = true; });
    });
  });
}
