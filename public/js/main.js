(function () {
  'use strict';

  const API = '/api';

  // ── Nav scroll ─────────────────────────────────────────
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── Matrix rain ────────────────────────────────────────
  (function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chars = '01アイウエカサタナハマヤラワ0110FF7E3A9B2C8D4';
    const fontSize = 13;
    let cols, drops, raf;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      ctx.fillStyle = 'rgba(0,0,0,0.055)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < cols; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5;
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
  })();

  // ── Terminal typewriter ────────────────────────────────
  const termEl = document.getElementById('terminal-text');
  if (termEl) {
    const phrases = ['acesso_liberado', 'carregando_cursos', 'sistema_online'];
    let pi = 0, ci = 0, del = false;
    function type() {
      const w = phrases[pi];
      if (!del) {
        termEl.textContent = w.slice(0, ++ci);
        if (ci === w.length) { del = true; setTimeout(type, 2000); return; }
      } else {
        termEl.textContent = w.slice(0, --ci);
        if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
      }
      setTimeout(type, del ? 50 : 90);
    }
    setTimeout(type, 800);
  }

  // ── Stats counter ──────────────────────────────────────
  function animateCount(el, target, suffix = '') {
    let start = 0;
    const dur = 1800;
    const step = 16;
    const inc = target / (dur / step);
    const interval = setInterval(() => {
      start = Math.min(start + inc, target);
      el.textContent = Math.floor(start) + suffix;
      if (start >= target) clearInterval(interval);
    }, step);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const count = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || (count === 100 ? '%' : '+');
      if (!isNaN(count)) animateCount(el, count, suffix);
      statsObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => statsObserver.observe(el));

  // ── Card scroll reveal ─────────────────────────────────
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.animationPlayState = 'running';
        cardObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  // ── Format price ───────────────────────────────────────
  function fmtPrice(v) {
    return parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  // ── Build card ─────────────────────────────────────────
  function buildCard(course, idx) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.style.cssText = `animation-delay:${idx * 0.09}s; animation-play-state:paused`;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-image-wrap';

    if (course.cover_image) {
      const img = document.createElement('img');
      img.src = course.cover_image;
      img.alt = course.name;
      img.loading = 'lazy';
      imgWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'card-image-placeholder';
      ph.innerHTML = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`;
      imgWrap.appendChild(ph);
    }

    const overlay = document.createElement('div');
    overlay.className = 'card-image-overlay';
    imgWrap.appendChild(overlay);

    const badge = document.createElement('div');
    badge.className = 'card-badge';
    badge.textContent = 'DISPONÍVEL';
    imgWrap.appendChild(badge);

    const body = document.createElement('div');
    body.className = 'card-body';

    const name = document.createElement('h3');
    name.className = 'card-name';
    name.textContent = course.name;

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = course.description || '';

    const pricing = document.createElement('div');
    pricing.className = 'card-pricing';

    if (course.old_price && parseFloat(course.old_price) > 0) {
      const old = document.createElement('div');
      old.className = 'card-old-price';
      old.textContent = `R$ ${fmtPrice(course.old_price)}`;
      pricing.appendChild(old);
    }

    const promo = document.createElement('div');
    promo.className = 'card-promo-price';
    promo.innerHTML = `<span class="currency">R$</span>${fmtPrice(course.promo_price)}`;
    pricing.appendChild(promo);

    const btn = document.createElement('a');
    btn.className = 'btn-buy';
    btn.href = course.checkout_link;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.85l.97-7.15H6"/></svg>Comprar Agora`;

    body.appendChild(name);
    body.appendChild(desc);
    body.appendChild(pricing);
    body.appendChild(btn);
    card.appendChild(imgWrap);
    card.appendChild(body);

    cardObserver.observe(card);
    return card;
  }

  // ── Load courses ───────────────────────────────────────
  async function loadCourses() {
    const grid = document.getElementById('courses-grid');
    const empty = document.getElementById('courses-empty');

    try {
      const res = await fetch(`${API}/public/courses`);
      if (!res.ok) throw new Error();
      const { courses } = await res.json();

      grid.innerHTML = '';

      if (!courses || courses.length === 0) {
        empty.classList.remove('hidden');
        return;
      }

      const statsEl = document.getElementById('stats-courses');
      if (statsEl) {
        statsEl.removeAttribute('data-count');
        statsEl.textContent = courses.length;
      }

      courses.forEach((c, i) => grid.appendChild(buildCard(c, i)));
    } catch {
      grid.innerHTML = `<div class="courses-loading"><span style="color:rgba(255,255,255,0.25)">[ERRO] Falha ao carregar cursos.</span></div>`;
    }
  }

  // ── Load config ────────────────────────────────────────
  async function loadConfig() {
    try {
      const res = await fetch(`${API}/public/config`);
      if (!res.ok) return;
      const { config } = await res.json();

      if (config.hero_title) {
        const el = document.getElementById('hero-title');
        if (el) {
          el.textContent = config.hero_title;
          el.dataset.text = config.hero_title;
        }
      }
      if (config.hero_subtitle) {
        const el = document.getElementById('hero-subtitle');
        if (el) el.textContent = config.hero_subtitle;
      }
      if (config.whatsapp_link) {
        const btn = document.getElementById('whatsapp-btn');
        if (btn) btn.href = config.whatsapp_link;
      }
    } catch { /* silent */ }
  }

  loadConfig();
  loadCourses();
})();
