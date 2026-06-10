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

  /* ── 4. Scroll buddy — invader néon ─────────────────────────────── */
  if (window.innerWidth < 768) return;

  const buddy = document.createElement('div');
  buddy.id = 'scroll-buddy';
  buddy.innerHTML =
    '<svg viewBox="0 0 11 8" width="44" height="32" aria-hidden="true">' +
      // invader 11×8 classique, dessiné en rects "pixels"
      '<g fill="#39FF14">' +
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

    const moving = Math.abs(buddyY - lastY);
    buddy.style.transform =
      'translate(' + sway + 'px,' + (buddyY + bob) + 'px) scaleY(' + (buddyY < lastY - 0.2 ? -1 : 1) + ')';

    // flamme visible uniquement quand ça bouge
    if (moving > 0.4) {
      buddy.classList.add('buddy-moving');
      clearTimeout(flameTimer);
      flameTimer = setTimeout(() => buddy.classList.remove('buddy-moving'), 200);
    }

    // tir laser quand on entre dans une nouvelle section
    const mid = window.scrollY + window.innerHeight / 2;
    let current = -1;
    sections.forEach((s, i) => { if (s.offsetTop < mid) current = i; });
    if (current !== lastSection) {
      if (sectionTrackerBooted) fireLaser(); // pas de tir au chargement initial
      lastSection = current;
      sectionTrackerBooted = true;
    }

    lastY = buddyY;
    requestAnimationFrame(buddyTick);
  }
  buddyTick();
})();
