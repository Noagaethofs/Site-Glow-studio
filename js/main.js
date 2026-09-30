/* =========================================================
   GLOW STUDIO — interactions & animations
   ========================================================= */
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Intro : le logo se dessine, puis s'efface ----------
const intro = document.getElementById('intro');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (intro && !reducedMotion) {
  document.body.classList.add('intro-on');
  const hideIntro = () => {
    intro.classList.add('done');
    document.body.classList.remove('intro-on');
  };
  window.addEventListener('load', () => setTimeout(hideIntro, 3000));
  setTimeout(hideIntro, 5000); // filet de sécurité si "load" tarde
}

// ---------- Header : fond flouté au scroll ----------
const header = document.getElementById('header');
const onScrollHeader = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScrollHeader, { passive: true });
onScrollHeader();

// ---------- Fond dérivant : parallaxe + teinte par section ----------
const scrollBg = document.getElementById('scrollBg');
const sbgTrack = document.getElementById('sbgTrack');
if (scrollBg && sbgTrack) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const drift = Math.min(window.scrollY * 0.12, 220);
      sbgTrack.style.transform = 'translateY(' + drift.toFixed(1) + 'px)';
      ticking = false;
    });
  }, { passive: true });

  const layers = scrollBg.querySelectorAll('.sbg-layer');
  const zones = ['hero', 'services', 'methode', 'offres'];
  const zoneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      layers.forEach((l) => l.classList.toggle('active', l.dataset.zone === entry.target.id));
    });
  }, { threshold: 0.35 });
  zones.forEach((id) => {
    const el = document.getElementById(id);
    if (el) zoneObserver.observe(el);
  });
}

// ---------- Menu mobile ----------
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const setMenu = (open) => {
  nav.classList.toggle('open', open);
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
};
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// ---------- Apparition au scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 3 * 0.08) + 's';
  io.observe(el);
});
// une fois apparu, on retire le délai pour que le survol réagisse instantanément
document.addEventListener('transitionend', (e) => {
  if (e.target.classList && e.target.classList.contains('in')) e.target.style.transitionDelay = '';
});

// ---------- Onglets des offres ----------
const tabs = document.querySelectorAll('.tab');
tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((x) => {
    x.classList.remove('active');
    x.setAttribute('aria-selected', 'false');
  });
  t.classList.add('active');
  t.setAttribute('aria-selected', 'true');
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
  const panel = document.getElementById('tab-' + t.dataset.tab);
  panel.classList.add('active');
  panel.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}));

// ---------- Fond réactif des services (couleur de la carte survolée) ----------
const servicesSec = document.getElementById('services');
if (servicesSec) {
  const hoverClasses = ['hover-web', 'hover-content', 'hover-visi', 'hover-ia'];
  servicesSec.querySelectorAll('.fcard').forEach((card) => {
    const cls = 'hover-' + card.dataset.zone;
    const on = () => {
      servicesSec.classList.remove(...hoverClasses);
      servicesSec.classList.add(cls);
    };
    const off = () => servicesSec.classList.remove(cls);
    card.addEventListener('mouseenter', on);
    card.addEventListener('mouseleave', off);
    card.addEventListener('focus', on);
    card.addEventListener('blur', off);
  });
}

/* =========================================================
   Chatbot FAQ — pour changer les réponses, modifiez FAQS
   ========================================================= */
(function () {
  const EMAIL = 'contact@glowstudio.be';

  const FAQS = [
    { keys: ['tarif', 'prix', 'coût', 'cout', 'combien', 'budget', 'devis'],
      answer: "Chaque projet est différent : on vous prépare un devis gratuit, clair et adapté à vos besoins réels. Écrivez-nous à " + EMAIL + " pour en parler." },
    { keys: ['délai', 'delai', 'combien de temps', 'durée', 'duree', 'rapide'],
      answer: "Les délais dépendent de l'ampleur du projet et des contenus à produire. Un planning précis vous est donné dès le premier échange." },
    { keys: ['service', 'propose', 'faites', 'offre', 'pack'],
      answer: "Notre cœur de métier, c'est la création de sites web. Autour : SEO local, Google Business, photo & vidéo, contenus réseaux, stratégie digitale, publicité et automatisations IA. Notre offre principale est le Pack Présence Digitale (site + SEO local + Google Business + shooting + stratégie)." },
    { keys: ['google', 'seo', 'référencement', 'referencement', 'trouvé', 'trouve', 'visibilité', 'visibilite'],
      answer: "Oui ! SEO local, pages ciblées, structure de contenu et optimisation de votre fiche Google Business pour être trouvé par les clients près de chez vous." },
    { keys: ['photo', 'vidéo', 'video', 'shooting', 'réseaux', 'reseaux', 'instagram', 'contenu'],
      answer: "On se déplace pour les shootings : portraits, équipe, produits, locaux, chantiers, avant/après et vidéo de présentation. On prépare aussi des contenus prêts à publier sur vos réseaux." },
    { keys: ['ia', 'intelligence', 'automatis', 'crm', 'workflow'],
      answer: "On met en place, progressivement et seulement quand c'est utile, des outils simples : rédaction assistée, réponses, organisation, CRM ou workflows. Objectif : vous faire gagner du temps." },
    { keys: ['mobile', 'téléphone portable', 'responsive', 'smartphone'],
      answer: "Tous nos sites sont pensés mobile-first : rapides et agréables sur smartphone, tablette et ordinateur." },
    { keys: ['maintenance', 'après', 'apres', 'suivi', 'mise à jour', 'mise a jour', 'bug'],
      answer: "Après la mise en ligne, on peut assurer le suivi : maintenance, mises à jour, rapports simples, ajustements SEO et nouveaux contenus." },
    { keys: ['étape', 'etape', 'déroul', 'deroul', 'process', 'méthode', 'methode', 'comment ça marche', 'comment ca marche'],
      answer: "On suit la Glow Method : Discover (audit & priorités), Capture (photo, vidéo, contenus), Build (le site), Automate (outils & workflows) et Shine (mise en ligne, suivi et optimisation)." },
    { keys: ['zone', 'région', 'region', 'belgique', 'où', 'localis', 'déplac', 'deplac'],
      answer: "Glow Studio est une agence digitale basée en Belgique. Pour le web, nous travaillons aussi à distance." },
    { keys: ['contact', 'joindre', 'écrire', 'ecrire', 'email', 'mail', 'appeler'],
      answer: "Écrivez-nous à " + EMAIL + " : on vous répond rapidement !" },
    { keys: ['bonjour', 'salut', 'hello', 'coucou', 'bonsoir'],
      answer: "Bonjour ! Je suis l'assistant Glow Studio. Posez-moi une question sur nos services, notre méthode ou un devis." },
    { keys: ['merci'],
      answer: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions." }
  ];

  const FALLBACK = "Je n'ai pas de réponse toute prête pour cette question, mais vous pouvez écrire directement à " + EMAIL + ", on vous répond rapidement.";
  const SUGGESTIONS = ['Quels services proposez-vous ?', 'Combien coûte un site ?', 'Et pour Google ?', 'Comment vous contacter ?'];

  // les mots courts ("ia", "où") doivent être des mots entiers pour éviter "social", "spécialisé"…
  const matches = (t, k) => k.length <= 3
    ? new RegExp('(^|[^\\p{L}])' + k + '($|[^\\p{L}])', 'u').test(t)
    : t.includes(k);
  const findAnswer = (text) => {
    const t = text.toLowerCase();
    const hit = FAQS.find((f) => f.keys.some((k) => matches(t, k)));
    return hit ? hit.answer : FALLBACK;
  };

  const toggle = document.createElement('button');
  toggle.className = 'glow-chat-toggle';
  toggle.setAttribute('aria-label', 'Ouvrir le chat');
  toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

  const panel = document.createElement('div');
  panel.className = 'glow-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Assistant Glow Studio');
  panel.innerHTML =
    '<div class="glow-chat-header"><span>Glow Studio · Assistant</span>' +
    '<button class="glow-chat-close" aria-label="Fermer">&times;</button></div>' +
    '<div class="glow-chat-body" aria-live="polite"></div>' +
    '<div class="glow-chat-suggestions"></div>' +
    '<form class="glow-chat-form"><input type="text" placeholder="Posez votre question…" autocomplete="off" maxlength="200" aria-label="Votre question">' +
    '<button type="submit">Envoyer</button></form>';

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  const body = panel.querySelector('.glow-chat-body');
  const suggestionsBox = panel.querySelector('.glow-chat-suggestions');
  const form = panel.querySelector('.glow-chat-form');
  const input = panel.querySelector('input');

  const addMsg = (text, from) => {
    const msg = document.createElement('div');
    msg.className = 'glow-chat-msg ' + from;
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  };
  const botReply = (text) => {
    const typing = document.createElement('div');
    typing.className = 'glow-chat-msg bot typing';
    typing.textContent = '···';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    setTimeout(() => { typing.remove(); addMsg(text, 'bot'); }, 500);
  };
  const ask = (q) => { addMsg(q, 'user'); botReply(findAnswer(q)); };

  SUGGESTIONS.forEach((s) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'glow-chat-chip';
    chip.textContent = s;
    chip.addEventListener('click', () => ask(s));
    suggestionsBox.appendChild(chip);
  });

  let greeted = false;
  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      if (!greeted) {
        greeted = true;
        botReply("Bonjour ! Je suis l'assistant Glow Studio. Posez-moi une question sur nos services, notre méthode ou un devis.");
      }
      input.focus();
    }
  });
  panel.querySelector('.glow-chat-close').addEventListener('click', () => panel.classList.remove('open'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    ask(val);
  });
})();
