/* =========================================================
   Ashutosh Aman — Portfolio interactions (vanilla JS, no deps)
   ========================================================= */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  root.classList.add('js');

  /* ---------- Loader ---------- */
  const loader = $('.loader');
  const finishLoading = () => {
    loader && loader.classList.add('done');
    body.classList.add('loaded');
    startTyping();
  };
  if (document.readyState === 'complete') setTimeout(finishLoading, 350);
  else window.addEventListener('load', () => setTimeout(finishLoading, 350));
  // Safety net in case `load` is slow (e.g. fonts on a bad network)
  setTimeout(() => { if (!body.classList.contains('loaded')) finishLoading(); }, 2500);

  /* ---------- Year + local time ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const timeEl = $('#local-time');
  const tick = () => {
    if (!timeEl) return;
    timeEl.textContent = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    }).format(new Date());
  };
  tick(); setInterval(tick, 30_000);

  /* ---------- Header: scrolled state, hide on scroll down, progress bar ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('scrolled', y > 20);
    if (!body.classList.contains('menu-open')) {
      header.classList.toggle('hidden', y > lastY && y > 400);
    }
    lastY = y;
    updateTimeline();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav-links a[href^="#"]');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => navObserver.observe(s));

  /* ---------- Reveal on scroll (with sibling stagger) ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
      const i = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
      el.classList.add('in');
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Typed roles ---------- */
  function startTyping() {
    const el = $('.typed');
    if (!el || el.dataset.started) return;
    el.dataset.started = '1';
    const words = JSON.parse(el.dataset.words);
    if (reduceMotion) { el.textContent = words[0]; return; }
    let w = 0, c = 0, deleting = false;
    const step = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      el.textContent = word.slice(0, c);
      let delay = deleting ? 40 : 85;
      if (!deleting && c === word.length) { deleting = true; delay = 1800; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(step, delay);
    };
    step();
  }

  /* ---------- Terminal ---------- */
  const term = $('#terminal code');
  const termLines = [
    ['<span class="p">➜</span> <span class="k">whoami</span>', 'Ashutosh Aman — Full-Stack Developer &amp; Entrepreneur'],
    ['<span class="p">➜</span> <span class="k">cat</span> roles.txt', 'Co-Founder @ Elkara\nClass Representative @ NST Hyderabad\nEvent Lead @ Hacktoberfest 2026'],
    ['<span class="p">➜</span> <span class="k">ls</span> ~/ventures', '<span class="s">munkybunky/</span>  <span class="s">uninode/</span>  <span class="s">theia/</span>'],
    ['<span class="p">➜</span> <span class="k">echo</span> $LOCATION', 'Asansol, WB  ⇄  Hyderabad, TS'],
  ];
  let termStarted = false;
  const runTerminal = async () => {
    if (termStarted || !term) return;
    termStarted = true;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let html = '';
    for (const [cmd, out] of termLines) {
      // type the command character by character (strip tags for typing, then swap in coloured version)
      const plain = cmd.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
      if (!reduceMotion) {
        for (let i = 1; i <= plain.length; i++) {
          term.innerHTML = html + escapeHtml(plain.slice(0, i)) + '<span class="cur"></span>';
          await sleep(i < 2 ? 0 : 38);
        }
        await sleep(220);
      }
      html += cmd + '\n' + out + '\n\n';
      term.innerHTML = html + '<span class="p">➜</span> <span class="cur"></span>';
      if (!reduceMotion) await sleep(380);
    }
  };
  const escapeHtml = s => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  if (term) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { runTerminal(); obs.disconnect(); }
    }, { threshold: 0.4 }).observe(term);
  }

  /* ---------- Count up ---------- */
  $$('.count').forEach(el => {
    new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      const to = +el.dataset.to;
      if (reduceMotion) { el.textContent = to; return; }
      const start = performance.now(), dur = 1200;
      const frame = now => {
        const t = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }).observe(el);
  });

  /* ---------- Timeline fill ---------- */
  const timeline = $('.timeline');
  const fill = $('.timeline-fill');
  function updateTimeline() {
    if (!timeline || !fill) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
    fill.style.transform = `scaleY(${p})`;
  }
  onScroll();

  /* ---------- Copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    showToast('Email copied to clipboard ✓');
  }));

  /* ===== Pointer-only effects below (skipped on touch + reduced motion) ===== */
  if (!finePointer || reduceMotion) { initCanvas(); return; }
  body.classList.add('has-pointer');

  /* Cursor glow */
  const glow = $('.cursor-glow');
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function glowLoop() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx - 260}px, ${gy - 260}px)`;
    requestAnimationFrame(glowLoop);
  })();

  /* Spotlight cards: feed mouse position to CSS */
  $$('.spotlight').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* 3D tilt */
  $$('.tilt').forEach(card => {
    const max = 6;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transition = 'transform 0.12s ease-out, border-color 0.3s, box-shadow 0.4s, opacity 0.9s, translate 0.9s';
      card.style.transform = `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.4s, opacity 0.9s, translate 0.9s';
      card.style.transform = '';
    });
  });

  /* Magnetic buttons */
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* Orbit parallax */
  const orbit = $('.orbit-system');
  if (orbit) {
    window.addEventListener('pointermove', e => {
      const x = (e.clientX / innerWidth - 0.5) * 18;
      const y = (e.clientY / innerHeight - 0.5) * 18;
      orbit.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
  }

  initCanvas();

  /* ---------- Particle constellation background ---------- */
  function initCanvas() {
    const canvas = $('#bg-canvas');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, particles = [];
    const mouse = { x: -9999, y: -9999 };
    const LINK = 130;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      const count = Math.round(Math.min(90, (innerWidth * innerHeight) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25 * dpr, vy: (Math.random() - 0.5) * 0.25 * dpr,
        r: (Math.random() * 1.4 + 0.6) * dpr,
      }));
    };
    resize();
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
    window.addEventListener('pointermove', e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });
    window.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    let running = true;
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(draw);
    });

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const link = LINK * dpr;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // gentle push away from the cursor
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 140 * dpr && md > 0) { p.x += (mdx / md) * 0.8; p.y += (mdy / md) * 0.8; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(223, 232, 217, 0.55)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < link) {
            ctx.strokeStyle = `rgba(95, 140, 109, ${(1 - d / link) * 0.35})`;
            ctx.lineWidth = dpr * 0.8;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
})();
