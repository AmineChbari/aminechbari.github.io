/* =====================================================================
   background3d.js — Neon Arcade / Synthwave 3D Background
   Thème : cyan #00f5ff · pink #ff2d95 · yellow #ffd166 · green #39ff14
   ===================================================================== */
(function () {
  'use strict';

  // ── Guards ──────────────────────────────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 500) return; // skip on small phones

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // ── Load Three.js from CDN then boot ────────────────────────────────
  const tag = document.createElement('script');
  tag.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
  tag.onload = boot;
  tag.onerror = function () { console.warn('[bg3d] Three.js CDN failed'); };
  document.head.appendChild(tag);

  // ── Main init ───────────────────────────────────────────────────────
  function boot() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    /* Scene & Camera */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 600);
    camera.position.set(0, 10, 55);
    camera.lookAt(0, 0, 0);

    /* ── Palette ───────────────────────────────────────────────────── */
    const CYAN   = new THREE.Color(0x00f5ff);
    const PINK   = new THREE.Color(0xff2d95);
    const YELLOW = new THREE.Color(0xffd166);
    const GREEN  = new THREE.Color(0x39ff14);
    // weighted toward cyan for that neon-blue dominant look
    const PALETTE = [CYAN, CYAN, CYAN, PINK, PINK, YELLOW, GREEN];

    /* ── 1. Particle cloud ─────────────────────────────────────────── */
    const N   = 800;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 240;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 110;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 130 - 15;

      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pgeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    const pmat = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.60,
      sizeAttenuation: true,
    });

    const particleCloud = new THREE.Points(pgeo, pmat);
    scene.add(particleCloud);

    /* ── 2. Wireframe cubes ────────────────────────────────────────── */
    const CUBE_COLORS = [CYAN, PINK, YELLOW, GREEN, CYAN, PINK, YELLOW, CYAN];
    const cubes = [];

    for (let i = 0; i < 16; i++) {
      const sz   = 2.5 + Math.random() * 6.5;
      const geo  = new THREE.BoxGeometry(sz, sz, sz);
      const edge = new THREE.EdgesGeometry(geo);
      const c    = CUBE_COLORS[i % CUBE_COLORS.length];
      const mat  = new THREE.LineBasicMaterial({
        color: c,
        transparent: true,
        opacity: 0.09 + Math.random() * 0.18,
      });
      const cube = new THREE.LineSegments(edge, mat);
      cube.position.set(
        (Math.random() - 0.5) * 190,
        (Math.random() - 0.5) * 85,
        (Math.random() - 0.5) * 90 - 10,
      );
      cube.userData.rs = {
        x: (Math.random() - 0.5) * 0.006,
        y: (Math.random() - 0.5) * 0.010,
        z: (Math.random() - 0.5) * 0.005,
      };
      scene.add(cube);
      cubes.push(cube);
    }

    /* ── 3. Synthwave floor grid ───────────────────────────────────── */
    // Two grids layered: one coarse (major lines), one fine (minor lines)
    function makeGrid(size, divs, color, opacity) {
      const g = new THREE.GridHelper(size, divs, color, color);
      g.material.transparent = true;
      g.material.opacity = opacity;
      g.position.y = -30;
      return g;
    }

    const gridMajor = makeGrid(320, 24, 0x00f5ff, 0.07);
    const gridMinor = makeGrid(320, 80, 0x00f5ff, 0.025);
    scene.add(gridMajor);
    scene.add(gridMinor);

    /* ── 4. Neon horizon lines (horizontal streaks) ────────────────── */
    const horizonLines = [];
    const hLineColors  = [CYAN, PINK, YELLOW];

    for (let i = 0; i < 6; i++) {
      const points = [
        new THREE.Vector3(-160, -25 + i * 0.9, -60 + i * 4),
        new THREE.Vector3( 160, -25 + i * 0.9, -60 + i * 4),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: hLineColors[i % hLineColors.length],
        transparent: true,
        opacity: 0.06 + i * 0.01,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      horizonLines.push(line);
    }

    /* ── 5. Floating diamond / octahedron shapes ───────────────────── */
    const diamonds = [];
    const dColors  = [CYAN, PINK, YELLOW, GREEN];

    for (let i = 0; i < 8; i++) {
      const sz   = 1.8 + Math.random() * 3.0;
      const geo  = new THREE.OctahedronGeometry(sz, 0);
      const edge = new THREE.EdgesGeometry(geo);
      const mat  = new THREE.LineBasicMaterial({
        color: dColors[i % dColors.length],
        transparent: true,
        opacity: 0.12 + Math.random() * 0.14,
      });
      const d = new THREE.LineSegments(edge, mat);
      d.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 70 - 5,
      );
      d.userData.rs = {
        x: (Math.random() - 0.5) * 0.008,
        y: (Math.random() - 0.5) * 0.012,
        z: (Math.random() - 0.5) * 0.006,
      };
      scene.add(d);
      diamonds.push(d);
    }

    /* ── Resize handler ─────────────────────────────────────────────── */
    window.addEventListener('resize', () => {
      const nW = window.innerWidth;
      const nH = window.innerHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    });

    /* ── Animation loop ─────────────────────────────────────────────── */
    let t = 0;

    function tick() {
      requestAnimationFrame(tick);
      t += 0.003;

      // Particle cloud: slow spin + gentle tilt
      particleCloud.rotation.y = t * 0.018;
      particleCloud.rotation.x = Math.sin(t * 0.014) * 0.025;

      // Cubes: individual rotation
      cubes.forEach(c => {
        c.rotation.x += c.userData.rs.x;
        c.rotation.y += c.userData.rs.y;
        c.rotation.z += c.userData.rs.z;
      });

      // Diamonds: individual rotation (slightly faster)
      diamonds.forEach(d => {
        d.rotation.x += d.userData.rs.x;
        d.rotation.y += d.userData.rs.y;
        d.rotation.z += d.userData.rs.z;
      });

      // Grid: scroll forward (synthwave road effect)
      const gridScroll = (t * 12) % 13.3; // 320/24 ≈ 13.3 per cell
      gridMajor.position.z = gridScroll;
      gridMinor.position.z = gridScroll;

      // Camera: subtle floating sway
      camera.position.x = Math.sin(t * 0.055) * 6;
      camera.position.y = 10  + Math.cos(t * 0.042) * 3.5;
      camera.lookAt(0, -4, 0);

      // Particle opacity pulse (very subtle)
      pmat.opacity = 0.55 + Math.sin(t * 0.6) * 0.06;

      renderer.render(scene, camera);
    }

    tick();
  }
})();
