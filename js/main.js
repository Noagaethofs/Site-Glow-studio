/* =========================================================
   J-Clean Auto — interactions & animations (vanilla JS)
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* ---------- Préchargeur ---------- */
  const finishLoading = () => {
    if (document.body.classList.contains("loaded")) return;
    document.body.classList.add("loaded");
    document.body.classList.remove("is-loading");
  };
  window.addEventListener("load", () => setTimeout(finishLoading, reduceMotion ? 0 : 900));
  setTimeout(finishLoading, 3500); // sécurité si une ressource traîne

  /* ---------- Année footer ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Découpe des titres en mots ---------- */
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(" ");
            const word = document.createElement("span");
            word.className = "word";
            const inner = document.createElement("span");
            inner.className = "word-inner";
            inner.style.setProperty("--i", i++);
            inner.textContent = part;
            word.append(inner);
            frag.append(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    el.setAttribute("aria-label", el.textContent.trim());
    walk(el);
  };
  $$("[data-split]").forEach(splitWords);
  // Le titre du hero est animé par la classe body.loaded
  const heroTitle = $(".hero-title");
  if (heroTitle) heroTitle.classList.add("is-visible");

  /* ---------- Révélations au scroll (avec décalage en cascade) ---------- */
  const revealEls = $$("[data-reveal], [data-split]:not(.hero-title)");
  // Décalage progressif pour les éléments frères
  const groups = new Map();
  $$("[data-reveal]").forEach((el) => {
    const parent = el.parentElement;
    const n = groups.get(parent) || 0;
    el.style.setProperty("--d", n * 110);
    groups.set(parent, n + 1);
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Compteurs animés ---------- */
  const animateCount = (el, to, duration = 1600) => {
    const from = parseInt(el.textContent, 10) || 0;
    if (reduceMotion) return (el.textContent = to);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = el.closest(".hero") ? 1500 : 200;
        setTimeout(() => animateCount(el, +el.dataset.count), delay);
        countIO.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- Header : masqué au scroll descendant, lien actif ---------- */
  const header = $("[data-header]");
  const progress = $(".scroll-progress span");
  const fab = $(".fab-whatsapp");
  const heroMedia = $("[data-parallax]");
  const processList = $("[data-process]");
  const processSteps = processList ? $$("li", processList) : [];
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle("is-scrolled", y > 40);
    const menuOpen = document.body.classList.contains("menu-open");
    header.classList.toggle("is-hidden", !menuOpen && y > lastY && y > 300);
    lastY = y;

    if (progress) progress.style.transform = `scaleX(${docH > 0 ? y / docH : 0})`;
    if (fab) fab.classList.toggle("is-visible", y > window.innerHeight * 0.6);

    // Parallax du hero
    if (heroMedia && !reduceMotion && y < window.innerHeight * 1.2) {
      heroMedia.style.transform = `translate3d(0, ${y * parseFloat(heroMedia.dataset.parallax)}px, 0)`;
    }

    // Ligne de progression de la méthode
    if (processList) {
      const r = processList.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh * 0.75 - r.top) / (r.height + vh * 0.25), 0), 1);
      processList.style.setProperty("--progress", p.toFixed(3));
      processSteps.forEach((li, i) => li.classList.toggle("is-active", p >= i / (processSteps.length - 1) - 0.02));
    }

    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Navigation : indicateur glissant + section active ---------- */
  const nav = $("[data-nav]");
  const navLinks = $$("a", nav);
  const indicator = $(".nav-indicator", nav);
  const moveIndicator = (link) => {
    if (!indicator || !link) {
      if (indicator) indicator.style.opacity = 0;
      return;
    }
    indicator.style.opacity = 1;
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  navLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => moveIndicator(link));
  });
  nav.addEventListener("mouseleave", () => moveIndicator($("a.active", nav)));

  const sectionIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${id}`));
        if (!nav.matches(":hover")) moveIndicator($("a.active", nav));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => sectionIO.observe(s));

  /* ---------- Menu mobile ---------- */
  const menuBtn = $("[data-menu-button]");
  const toggleMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };
  menuBtn.addEventListener("click", () => toggleMenu(!document.body.classList.contains("menu-open")));
  navLinks.forEach((l) => l.addEventListener("click", () => toggleMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && toggleMenu(false));

  /* ---------- Vidéo hero : fondu à la lecture ---------- */
  const video = $(".hero-video");
  if (video) {
    const markPlaying = () => video.classList.add("is-playing");
    video.addEventListener("playing", markPlaying);
    if (!video.paused) markPlaying();
    if (reduceMotion) video.pause();
  }

  /* ---------- Gouttes d'eau animées sur le hero ---------- */
  const canvas = $(".hero-drops");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, drops = [], running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 26000);
      drops = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + 0.6,
        vy: Math.random() * 0.35 + 0.08,
        a: Math.random() * 0.5 + 0.15,
      }));
    };
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      drops.forEach((d) => {
        d.y += d.vy;
        if (d.y > h + 10) { d.y = -10; d.x = Math.random() * w; }
        const g = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r * 2);
        g.addColorStop(0, `rgba(255,255,255,${d.a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 2, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    new IntersectionObserver(([e]) => {
      const wasRunning = running;
      running = e.isIntersecting;
      if (running && !wasRunning) draw();
    }).observe(canvas);
  }

  /* ---------- Curseur personnalisé ---------- */
  const cursor = $(".cursor");
  if (cursor && finePointer && !reduceMotion) {
    const dot = $(".cursor-dot", cursor);
    const ring = $(".cursor-ring", cursor);
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      cursor.classList.remove("is-hidden");
    });
    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$("a, button, .comparison, .gallery-grid figure").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Boutons magnétiques ---------- */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ---------- Cartes 3D + halo qui suit la souris ---------- */
  if (finePointer && !reduceMotion) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });
  }

  /* ---------- Onglets de tarifs ---------- */
  const tabsWrap = $(".pricing-tabs");
  if (tabsWrap) {
    const tabs = $$(".tab", tabsWrap);
    const prices = $$("[data-price]");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const pack = tab.dataset.pack;
        if (tabsWrap.dataset.active === pack) return;
        tabsWrap.dataset.active = pack;
        tabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle("active", on);
          t.setAttribute("aria-selected", String(on));
        });
        prices.forEach((p, i) => {
          p.classList.remove("price-flip");
          void p.offsetWidth; // relance l'animation
          p.style.animationDelay = `${i * 35}ms`;
          p.textContent = `${p.dataset[pack]}€`;
          p.classList.add("price-flip");
        });
      });
    });
    tabsWrap.dataset.active = "signature";
  }

  /* ---------- Comparateur avant / après ---------- */
  const compare = $("[data-compare]");
  if (compare) {
    const range = $("[data-compare-range]", compare);
    const setPos = (v) => compare.style.setProperty("--pos", `${v}%`);
    let userTouched = false;
    range.addEventListener("input", () => {
      userTouched = true;
      setPos(range.value);
    });
    setPos(range.value);

    // Petit balayage automatique pour montrer que c'est interactif
    if (!reduceMotion) {
      const sweepIO = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        sweepIO.disconnect();
        const keys = [50, 18, 82, 50];
        const start = performance.now() + 700;
        const seg = 900;
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const step = (now) => {
          if (userTouched) return;
          const t = Math.max(0, now - start);
          const k = Math.min(Math.floor(t / seg), keys.length - 2);
          const local = Math.min((t - k * seg) / seg, 1);
          const v = keys[k] + (keys[k + 1] - keys[k]) * ease(local);
          setPos(v);
          range.value = v;
          if (t < seg * (keys.length - 1)) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.5 });
      sweepIO.observe(compare);
    }
  }

  /* ---------- Lightbox de la galerie ---------- */
  const figures = $$(".gallery-grid figure");
  if (figures.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.innerHTML = '<button type="button" aria-label="Fermer">✕</button><img alt="" /><p></p>';
    document.body.append(lb);
    const lbImg = $("img", lb);
    const lbCap = $("p", lb);
    const close = () => lb.classList.remove("is-open");
    figures.forEach((fig) => {
      fig.tabIndex = 0;
      const open = () => {
        const img = $("img", fig);
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = $("figcaption", fig)?.textContent || "";
        lb.classList.add("is-open");
        $("button", lb).focus();
      };
      fig.addEventListener("click", open);
      fig.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
    });
    lb.addEventListener("click", (e) => e.target !== lbImg && close());
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
  }
})();
