/* =====================================================================
   animations.js — Scroll reveal · Hero typewriter · Card tilt ·
   Scroll buddy (invader pixel néon qui suit le scroll)
   ===================================================================== */
(function () {
  'use strict';

  /* ── 0. Menu mobile (toujours actif, même en reduced-motion) ───────── */
  const menuBtn  = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.innerHTML = open ? '&#10005;' : '&#9776;';
    });
    // referme le menu quand on clique un lien
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '&#9776;';
      })
    );
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── 0bis. Konami code (↑↑↓↓←→←→BA) ────────────────────────────────── */
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kIdx = 0;
  window.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[kIdx]) {
      kIdx++;
      if (kIdx === KONAMI.length) { kIdx = 0; konami(); }
    } else {
      kIdx = key === KONAMI[0] ? 1 : 0;
    }
  });

  function konami() {
    if (document.body.classList.contains('konami')) return;
    document.body.classList.add('konami');
    const toast = document.createElement('div');
    toast.className = 'konami-toast';
    toast.textContent = '★ CHEAT MODE ACTIVATED ★ +1UP';
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.classList.remove('konami');
      toast.remove();
    }, 6000);
  }

  /* ── 1. Scroll reveal (stagger) ─────────────────────────────────── */
  const revealTargets = document.querySelectorAll(
    '.card-link, .featured-card, #about > div, #contact > div, .view-github, #skills li'
  );

  revealTargets.forEach((el, i) => {
    el.removeAttribute('style'); // certains <li> ont opacity/transform inline
    el.classList.add('reveal');
    el.style.transitionDelay = ((i % 4) * 90) + 'ms';
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealTargets.forEach(el => io.observe(el));

  /* ── 1bis. Effet "décodage" — glyphes aléatoires qui se résolvent ── */
  const GLYPHS = '█▓▒░<>/\\|=+*#%@01';

  function decode(el, dur) {
    if (!el || el.dataset.decoding) return;
    el.dataset.decoding = '1';
    const orig  = el.textContent;
    const n     = orig.length;
    const start = performance.now();
    (function frame() {
      const p      = Math.min((performance.now() - start) / (dur || 900), 1);
      const reveal = Math.floor(p * n);
      let out = orig.slice(0, reveal);
      for (let i = reveal; i < n; i++) {
        const ch = orig[i];
        out += (ch === ' ' || ch === ' ') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else { el.textContent = orig; delete el.dataset.decoding; }
    })();
  }

  // titres de section : décodage à l'entrée dans le viewport
  const decodeTargets = document.querySelectorAll('#projects-heading, #skills h2, #contact h2');
  const dio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { decode(e.target, 900); dio.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  decodeTargets.forEach(el => dio.observe(el));

  // tag du hero : petit "boot" au chargement
  const heroTag = document.getElementById('hero-tag');
  if (heroTag) setTimeout(() => decode(heroTag, 700), 250);

  /* ── 1ter. Balayage CRT — ligne lumineuse qui parcourt l'écran ───── */
  const sweep = document.createElement('div');
  sweep.id = 'crt-sweep';
  sweep.className = 'fx-layer';
  document.body.appendChild(sweep);

  /* ── 2. Hero typewriter ─────────────────────────────────────────── */
  const heroLead = document.getElementById('hero-lead');

  function typeHero() {
    if (!heroLead) return;
    const full = heroLead.textContent;
    heroLead.textContent = '';
    let i = 0;
    (function step() {
      if (i <= full.length) {
        heroLead.textContent = full.slice(0, i++);
        setTimeout(step, 55);
      }
    })();
  }
  typeHero();

  // re-jouer l'effet quand on change de langue (le i18n remplace le texte)
  const langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.addEventListener('click', () => setTimeout(typeHero, 60));

  /* ── 3. Tilt 3D des cartes ──────────────────────────────────────── */
  document.querySelectorAll('.arcade-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5;
      const py = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform =
        'perspective(900px) rotateX(' + (-py * 7) + 'deg) rotateY(' + (px * 9) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ── 3bis. Tir au clic — explosion de pixels + score ────────────── */
  let credits = 0;
  let hudCredits = null; // rempli par le HUD plus bas (desktop)

  // gerbe de pixels néon en (x, y)
  function spawnBlast(x, y) {
    for (let i = 0; i < 10; i++) {
      const s   = document.createElement('div');
      const ang = (i / 10) * Math.PI * 2 + Math.random() * 0.6;
      const d   = 26 + Math.random() * 34;
      s.className = 'blast-px fx-layer';
      s.style.left = x + 'px';
      s.style.top  = y + 'px';
      s.style.setProperty('--dx', Math.cos(ang) * d + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * d + 'px');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 520);
    }
  }

  // texte flottant qui monte et s'efface
  function spawnPop(x, y, text) {
    const pop = document.createElement('div');
    pop.className = 'blast-pop fx-layer';
    pop.textContent = text;
    pop.style.left = x + 'px';
    pop.style.top  = y + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 700);
  }

  document.addEventListener('click', e => {
    if (e.target.closest('a, button, input, textarea, .menu-btn')) return;
    spawnBlast(e.clientX, e.clientY);
    spawnPop(e.clientX, e.clientY, '+25');
    credits += 25;
    if (hudCredits) hudCredits.textContent = 'CREDITS ' + String(credits).padStart(6, '0');
  });

  /* ── 4. Scroll buddy — invader néon + HUD arcade ────────────────── */
  if (window.innerWidth < 768) return;

  const hud = document.createElement('div');
  hud.id = 'arcade-hud';
  hud.className = 'fx-layer';
  hud.innerHTML =
    '<span id="hud-zone">ZONE 00 // INSERT COIN</span>' +
    '<span id="hud-score">SCORE 000000</span>' +
    '<span id="hud-credits">CREDITS 000000</span>' +
    '<span id="hud-hi">HI 999999</span>';
  document.body.appendChild(hud);
  const hudZone  = hud.querySelector('#hud-zone');
  const hudScore = hud.querySelector('#hud-score');
  hudCredits     = hud.querySelector('#hud-credits');
  const ZONES = ['ABOUT.EXE', 'PROJECTS.EXE', 'SKILLS.SYS', 'CONTACT.LOG'];
  let flipTimer = null;

  const buddy = document.createElement('div');
  buddy.id = 'scroll-buddy';
  buddy.innerHTML =
    '<svg viewBox="0 0 11 8" width="44" height="32" aria-hidden="true">' +
      // invader 11×8 classique, dessiné en rects "pixels"
      '<g fill="#3DFFA2">' +
        '<rect x="2" y="0" width="1" height="1"/><rect x="8" y="0" width="1" height="1"/>' +
        '<rect x="3" y="1" width="1" height="1"/><rect x="7" y="1" width="1" height="1"/>' +
        '<rect x="2" y="2" width="7" height="1"/>' +
        '<rect x="1" y="3" width="2" height="1"/><rect x="4" y="3" width="3" height="1"/><rect x="8" y="3" width="2" height="1"/>' +
        '<rect x="0" y="4" width="11" height="1"/>' +
        '<rect x="0" y="5" width="1" height="1"/><rect x="2" y="5" width="7" height="1"/><rect x="10" y="5" width="1" height="1"/>' +
        '<rect x="0" y="6" width="1" height="1"/><rect x="2" y="6" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/>' +
        '<rect x="3" y="7" width="2" height="1"/><rect x="6" y="7" width="2" height="1"/>' +
      '</g>' +
    '</svg>' +
    '<div class="buddy-flame"></div>';
  document.body.appendChild(buddy);

  let buddyY = 80;          // position courante (lerp)
  let lastY  = 80;
  let flameTimer = null;
  let lastSection = -1;
  let sectionTrackerBooted = false;

  /* fuite : l'invader est insaisissable — il esquive le curseur */
  let mouseX = -9999, mouseY = -9999, mouseSeen = false;
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY; mouseSeen = true;
  });
  let fleeX = 0, fleeY = 0;   // décalage de fuite (par rapport à la croisière)
  let fvx = 0, fvy = 0;       // vélocité de fuite
  let jumpLock = 0;           // anti-spam du saut hyperespace

  // acculé -> saut hyperespace : blast + "MISSED!" et réapparition ailleurs
  function hyperjump(cx, cy) {
    const nowT = performance.now();
    if (nowT - jumpLock < 900) return;
    jumpLock = nowT;
    spawnBlast(cx, cy);
    spawnPop(cx, cy, 'MISSED!');
    const anchorX = window.innerWidth - 66; // right:22 + largeur 44
    const targetX = mouseX < window.innerWidth / 2
      ? anchorX - 30 - Math.random() * 60   // curseur à gauche -> il reste à droite
      : 80 + Math.random() * 120;           // curseur à droite -> il file à gauche
    fleeX = targetX - anchorX;
    fleeY = 70 + Math.random() * (window.innerHeight - 240) - buddyY;
    fvx = fvy = 0;
    buddy.classList.add('buddy-warp');
    setTimeout(() => buddy.classList.remove('buddy-warp'), 400);
  }

  const sections = ['about', 'projects', 'skills', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  // tir laser : trait néon qui part de l'invader vers la gauche
  function fireLaser() {
    const laser = document.createElement('div');
    laser.className = 'buddy-laser';
    buddy.appendChild(laser);
    buddy.classList.add('buddy-firing');
    setTimeout(() => { laser.remove(); buddy.classList.remove('buddy-firing'); }, 480);
  }

  function buddyTick() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    const targetY = 80 + progress * (window.innerHeight - 180);

    buddyY += (targetY - buddyY) * 0.06; // inertie

    // flottement permanent (idle bob) + oscillation latérale légère
    const now = performance.now();
    const bob  = Math.sin(now / 620) * 4;
    const sway = Math.sin(now / 940) * 3;

    // ── Fuite : répulsion quand le curseur approche ──
    const rct  = buddy.getBoundingClientRect();
    const cx   = rct.left + rct.width / 2;
    const cy   = rct.top + rct.height / 2;
    const ddx  = cx - mouseX;
    const ddy  = cy - mouseY;
    const dist = Math.hypot(ddx, ddy);
    const FLEE_R = 150;
    let fleeing = false;
    if (mouseSeen && dist < FLEE_R) {
      fleeing = true;
      const f = (1 - dist / FLEE_R) * 3.2;      // plus près = plus paniqué
      fvx += (ddx / (dist || 1)) * f;
      fvy += (ddy / (dist || 1)) * f;
      if (dist < 38) hyperjump(cx, cy);          // presque attrapé !
    }
    fvx += -fleeX * 0.015;  fvy += -fleeY * 0.015;   // ressort vers la croisière
    fvx *= 0.90;            fvy *= 0.90;             // friction
    fleeX += fvx;           fleeY += fvy;

    // bornes : rester visible dans l'écran
    const anchorX = window.innerWidth - 66;
    fleeX = Math.max(14 - anchorX, Math.min(fleeX, 14));
    const topY = buddyY + bob + fleeY;
    if (topY < 58) fleeY = 58 - buddyY - bob;
    if (topY > window.innerHeight - 92) fleeY = window.innerHeight - 92 - buddyY - bob;

    const moving = Math.abs(buddyY - lastY);
    buddy.style.transform =
      'translate(' + (sway + fleeX) + 'px,' + (buddyY + bob + fleeY) + 'px) scaleY(' + (buddyY < lastY - 0.2 ? -1 : 1) + ')';

    // flamme visible quand ça bouge ou que ça panique
    if (moving > 0.4 || fleeing) {
      buddy.classList.add('buddy-moving');
      clearTimeout(flameTimer);
      flameTimer = setTimeout(() => buddy.classList.remove('buddy-moving'), 200);
    }

    // HUD : score arcade lié à la profondeur de scroll
    hudScore.textContent = 'SCORE ' + String(Math.round(progress * 999999)).padStart(6, '0');

    // tir laser + glitch CRT + changement de zone HUD à chaque section
    const mid = window.scrollY + window.innerHeight / 2;
    let current = -1;
    sections.forEach((s, i) => { if (s.offsetTop < mid) current = i; });
    if (current !== lastSection) {
      hudZone.textContent = current < 0
        ? 'ZONE 00 // INSERT COIN'
        : 'ZONE 0' + (current + 1) + ' // ' + ZONES[current];
      if (sectionTrackerBooted) {           // pas d'effets au chargement initial
        fireLaser();
        decode(hudZone, 420);               // la zone se "décode"
        document.body.classList.add('zone-flip');
        clearTimeout(flipTimer);
        flipTimer = setTimeout(() => document.body.classList.remove('zone-flip'), 340);
      }
      lastSection = current;
      sectionTrackerBooted = true;
    }

    lastY = buddyY;
    requestAnimationFrame(buddyTick);
  }
  buddyTick();
})();
