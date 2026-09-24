(function () {
    'use strict';

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Language (EN in the HTML, FR from i18n.js) ---------- */
    const dict = window.I18N_FR || {};
    const i18nEls = Array.from(document.querySelectorAll('[data-i18n]'));
    const english = new Map(i18nEls.map((el) => [el, el.innerHTML]));
    const englishTitle = document.title;
    const langToggle = document.getElementById('langToggle');
    let lang = 'en';

    const t = (key, fallback) => (lang === 'fr' && dict[key]) || fallback;

    function applyLang(next) {
        lang = next;
        root.lang = next;
        i18nEls.forEach((el) => {
            const key = el.dataset.i18n;
            el.innerHTML = next === 'fr' && key in dict ? dict[key] : english.get(el);
        });
        document.title = next === 'fr' ? dict['meta.title'] || englishTitle : englishTitle;
        langToggle.textContent = next === 'fr' ? 'EN' : 'FR';
        langToggle.setAttribute('aria-label', next === 'fr' ? 'Switch to English' : 'Passer en français');
        try {
            localStorage.setItem('lang', next);
        } catch (e) {
            /* storage unavailable (private mode…) */
        }
    }

    langToggle.addEventListener('click', () => applyLang(lang === 'fr' ? 'en' : 'fr'));

    let savedLang = null;
    try {
        savedLang = localStorage.getItem('lang');
    } catch (e) {
        /* storage unavailable */
    }
    if (savedLang === 'fr') applyLang('fr');

    /* ---------- Header background once the page scrolls ---------- */
    const header = document.getElementById('siteHeader');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Mobile menu ---------- */
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');

    function setMenu(open) {
        navLinks.classList.toggle('open', open);
        header.classList.toggle('menu-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
    }

    menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    navLinks.addEventListener('click', (e) => {
        if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav')) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenu(false);
    });

    /* ---------- Reveal on scroll ---------- */
    const reveals = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        reveals.forEach((el) => el.classList.add('revealed'));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
        reveals.forEach((el) => revealObserver.observe(el));
    }

    /* ---------- Highlight the nav link of the section in view ---------- */
    if ('IntersectionObserver' in window) {
        const navAnchors = Array.from(navLinks.querySelectorAll('a[href^="#"]:not(.btn)'));
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const hash = '#' + entry.target.id;
                navAnchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === hash));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('main > section[id]').forEach((s) => sectionObserver.observe(s));
    }

    /* ---------- Cursor spotlight on cards ---------- */
    if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
        document.querySelectorAll('.spotlight').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', `${e.clientX - r.left}px`);
                el.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });
    }

    /* ---------- Copy email ---------- */
    const copyBtn = document.getElementById('copyEmail');
    const copyLabel = document.getElementById('copyEmailLabel');
    let copyTimer;

    function legacyCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (e) {
            ok = false;
        }
        ta.remove();
        return ok;
    }

    copyBtn.addEventListener('click', async () => {
        const email = copyBtn.dataset.email;
        let ok = true;
        try {
            await navigator.clipboard.writeText(email);
        } catch (e) {
            ok = legacyCopy(email);
        }
        if (!ok) {
            window.location.href = 'mailto:' + email;
            return;
        }
        copyBtn.classList.add('copied');
        copyLabel.textContent = t('contact.copied', 'Copied!');
        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyLabel.textContent = t('contact.copy', 'Copy');
        }, 2000);
    });
})();
