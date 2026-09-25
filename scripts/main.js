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

    /* ---------- Scroll progress bar ---------- */
    const progress = document.getElementById('scrollProgress');
    let progressQueued = false;
    function updateProgress() {
        progressQueued = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }
    window.addEventListener('scroll', () => {
        if (!progressQueued) {
            progressQueued = true;
            requestAnimationFrame(updateProgress);
        }
    }, { passive: true });
    updateProgress();

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Cursor glow (desktop only) ---------- */
    const glow = document.getElementById('cursorGlow');
    if (finePointer && !reduceMotion) {
        window.addEventListener('pointermove', (e) => {
            glow.style.setProperty('--cx', e.clientX + 'px');
            glow.style.setProperty('--cy', e.clientY + 'px');
            glow.classList.add('on');
        }, { passive: true });
        document.addEventListener('pointerleave', () => glow.classList.remove('on'));
    }

    /* ---------- Project showcases: 3D tilt + scroll parallax ---------- */
    const shows = Array.from(document.querySelectorAll('.show-media'));
    if (!reduceMotion) {
        if (finePointer) {
            shows.forEach((media) => {
                const frame = media.querySelector('.show-frame');
                media.addEventListener('pointermove', (e) => {
                    const r = frame.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width;
                    const y = (e.clientY - r.top) / r.height;
                    frame.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
                    frame.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
                    frame.style.setProperty('--mx', `${x * 100}%`);
                    frame.style.setProperty('--my', `${y * 100}%`);
                });
                media.addEventListener('pointerleave', () => {
                    frame.style.setProperty('--rx', '0deg');
                    frame.style.setProperty('--ry', '0deg');
                });
            });
        }

        let parallaxQueued = false;
        const parallax = () => {
            parallaxQueued = false;
            const vh = window.innerHeight;
            shows.forEach((media) => {
                const r = media.getBoundingClientRect();
                if (r.bottom < 0 || r.top > vh) return;
                // -1 when entering from below, +1 when leaving at the top
                const t = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
                media.querySelector('img').style.setProperty('--py', `${(t * 24).toFixed(1)}px`);
            });
        };
        window.addEventListener('scroll', () => {
            if (!parallaxQueued) {
                parallaxQueued = true;
                requestAnimationFrame(parallax);
            }
        }, { passive: true });
        parallax();
    }

    /* ---------- Hero neural network ---------- */
    const canvas = document.getElementById('neural');
    const ctx = canvas && canvas.getContext('2d');
    if (ctx) {
        const COLORS = ['167,139,250', '34,211,238', '129,140,248'];
        const LINK = 150;
        let w = 0;
        let h = 0;
        let nodes = [];
        let running = false;
        let visible = true;
        const mouse = { x: -9999, y: -9999 };

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const r = canvas.getBoundingClientRect();
            w = r.width;
            h = r.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.min(90, Math.round((w * h) / 15000));
            nodes = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                r: Math.random() * 1.6 + 0.8,
                c: COLORS[Math.floor(Math.random() * COLORS.length)],
            }));
        }

        function frame() {
            ctx.clearRect(0, 0, w, h);
            for (const n of nodes) {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
                // gentle pull towards the cursor
                const dx = mouse.x - n.x;
                const dy = mouse.y - n.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 200 * 200) {
                    n.x += dx * 0.004;
                    n.y += dy * 0.004;
                }
            }
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < LINK) {
                        ctx.strokeStyle = `rgba(${a.c},${(1 - d / LINK) * 0.35})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
                const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
                if (dm < 180) {
                    ctx.strokeStyle = `rgba(34,211,238,${(1 - dm / 180) * 0.5})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
                ctx.fillStyle = `rgba(${a.c},0.9)`;
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fill();
            }
            if (running) requestAnimationFrame(frame);
        }

        function setRunning(on) {
            if (on && !running) {
                running = true;
                requestAnimationFrame(frame);
            } else if (!on) {
                running = false;
            }
        }

        resize();
        if (reduceMotion) {
            frame(); // one static frame
        } else {
            setRunning(true);
            const hero = document.getElementById('top');
            hero.addEventListener('pointermove', (e) => {
                const r = canvas.getBoundingClientRect();
                mouse.x = e.clientX - r.left;
                mouse.y = e.clientY - r.top;
            });
            hero.addEventListener('pointerleave', () => {
                mouse.x = -9999;
                mouse.y = -9999;
            });
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(([entry]) => {
                    visible = entry.isIntersecting;
                    setRunning(visible && !document.hidden);
                }).observe(hero);
            }
            document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden));
        }
        // Only rebuild on width changes: mobile URL bars resize the height while scrolling
        let resizeTimer;
        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            if (window.innerWidth === lastWidth) return;
            lastWidth = window.innerWidth;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                resize();
                if (reduceMotion) frame();
            }, 200);
        });
    }
})();
