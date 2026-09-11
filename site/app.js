/*
 * The Stars Aligned — stardust sky and synchronized ceremony.
 * Ported from the Claude Design file "The Stars Aligned.dc.html".
 */
(() => {
  'use strict';

  /* Tunables ------------------------------------------------------------- */

  // How much stardust fills the sky (0.5–2).
  const DUST_DENSITY = 1;

  // Seconds. Begin schedules the start on the next multiple of this window on
  // the wall clock, so every phone tapped within the same window starts together.
  const SYNC_WINDOW = 12;

  /* Ceremony script --------------------------------------------------------
   *   d    seconds the scene holds
   *   t    line
   *   s    optional subline
   *   ttl  title styling
   *   b    what the stardust does (see targetFor and drawExtras)
   *   p    behavior params
   * The last scene holds until the guest exits.
   */
  const CEREMONY = [
    { d: 8, t: '“I am going to try to say more with less.”', b: 'still' },
    { d: 9, t: 'Marriage is about love, and our commitment to one another.', b: 'drift' },
    { d: 11, t: 'Love is something neither of us had the best of luck with.', s: 'You taught me a lot about love.', b: 'clusters' },
    { d: 13, t: 'Love is random.', s: 'It is stardust finding a home after a lifetime of searching.', b: 'scatterHome' },
    { d: 13, t: 'Love is unconditional.', s: 'It is given and received without conditions.', b: 'waves' },
    { d: 13, t: 'Love is always growing.', s: 'It is never stagnant, and it always finds a way to grow.', b: 'grow' },
    { d: 13, t: 'Love is equal.', s: 'As long as we both foster our love, it will never skew.', b: 'equal' },
    { d: 14, t: 'Love is scary.', s: 'And exciting. It makes you see the world how it should be seen, even if for the first time.', b: 'dimBloom' },
    { d: 7, t: 'I vow to never let our love skew.', b: 'rings', p: { ph: 0 } },
    { d: 7, t: 'I promise to never introduce conditions to our love.', b: 'rings', p: { ph: 1 } },
    { d: 8, t: 'I promise to continue to foster our love, and never let it fall stagnant.', b: 'rings', p: { ph: 2 } },
    { d: 12, t: 'Will you allow me to fall deeper in love with you every day?', b: 'interlock' },
    { d: 12, t: 'The stars aligned.', ttl: true, b: 'finale' },
    { d: 9999, t: 'Nathan & Tina Marie', s: 'September 20, 2026', ttl: true, b: 'afterglow' },
  ];

  const RUN_KEY = 'sa_run';
  const TAU = Math.PI * 2;

  /* DOM + state ------------------------------------------------------------ */

  const sky = document.querySelector('.sky');
  const canvas = sky.querySelector('.sky__canvas');
  const g = canvas.getContext('2d');
  const lineEls = Array.from(sky.querySelectorAll('.line'), el => ({
    el,
    text: el.querySelector('.line__text'),
    sub: el.querySelector('.line__sub'),
  }));
  const landingEl = document.getElementById('landing');
  const primerEl = document.getElementById('primer');
  const countdownEl = document.getElementById('countdown');
  const countNumEl = countdownEl.querySelector('.countdown__num');
  const exitEl = document.getElementById('exit');

  const blankSlots = () => [
    { text: '', sub: '', ttl: false },
    { text: '', sub: '', ttl: false },
  ];

  // mode: landing → primer → countdown → ceremony
  const state = { mode: 'landing', landingUi: false, active: 0, countdown: 0, slots: blankSlots() };

  function setState(patch) {
    Object.assign(state, patch);
    render();
  }

  function setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }

  function render() {
    const { mode } = state;
    landingEl.hidden = mode !== 'landing';
    primerEl.hidden = mode !== 'primer';
    countdownEl.hidden = mode !== 'countdown';
    exitEl.hidden = mode !== 'ceremony' && mode !== 'countdown';
    landingEl.classList.toggle('is-revealed', state.landingUi);
    setText(countNumEl, state.countdown > 0 ? String(state.countdown) : '✦');
    state.slots.forEach((slot, i) => {
      const line = lineEls[i];
      setText(line.text, slot.text);
      setText(line.sub, slot.sub);
      line.sub.hidden = !slot.sub;
      line.el.classList.toggle('is-title', slot.ttl);
      line.el.classList.toggle('is-active', state.active === i && !!slot.text);
    });
  }

  /* Scene clock ------------------------------------------------------------ */

  let behavior = 'drift';
  let bT0 = Date.now();
  let sceneIdx = -1;
  let sceneP = {};
  let sceneU = 0;
  let runEl = 0;
  let runStart = 0;
  let mount0 = Date.now();

  const activeTotal = scenes => scenes.slice(0, -1).reduce((sum, sc) => sum + sc.d, 0);

  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function setBehavior(name) {
    if (behavior === name) return;
    behavior = name;
    bT0 = Date.now();
  }

  function applyScene(scene) {
    sceneP = scene.p || {};
    setBehavior(scene.b);
    showLine(scene);
  }

  // Write the line into the hidden slot and swap, so the two crossfade.
  function showLine(scene) {
    const a = 1 - state.active;
    const slots = state.slots.slice();
    slots[a] = { text: scene.t || '', sub: scene.s || '', ttl: !!scene.ttl };
    setState({ active: a, slots });
  }

  function tick() {
    const now = Date.now();
    if (state.mode === 'landing') {
      setBehavior('letters');
      if (!state.landingUi && now - mount0 > 2400) setState({ landingUi: true });
    } else if (state.mode === 'primer') {
      setBehavior('still');
    } else if (state.mode === 'countdown') {
      const rem = runStart - now;
      const c = Math.max(0, Math.ceil(rem / 1000));
      if (c !== state.countdown) setState({ countdown: c });
      setBehavior('gather');
      if (rem <= 0) {
        sceneIdx = -1;
        setState({ mode: 'ceremony' });
      }
    } else if (state.mode === 'ceremony') {
      const el = (now - runStart) / 1000;
      let idx = 0;
      let acc = 0;
      while (idx < CEREMONY.length - 1 && el >= acc + CEREMONY[idx].d) {
        acc += CEREMONY[idx].d;
        idx++;
      }
      if (idx !== sceneIdx) {
        sceneIdx = idx;
        applyScene(CEREMONY[idx]);
      }
      sceneU = Math.min(1, Math.max(0, (el - acc) / CEREMONY[idx].d));
      runEl = el;
    }
    drawFrame(now);
    requestAnimationFrame(tick);
  }

  /* Run persistence: a reload mid-ceremony rejoins in sync ---------------- */

  function persistRun(start) {
    try { localStorage.setItem(RUN_KEY, JSON.stringify({ mode: 'ceremony', start })); } catch {}
  }

  function clearRun() {
    try { localStorage.removeItem(RUN_KEY); } catch {}
  }

  function restoreRun() {
    let run = null;
    try { run = JSON.parse(localStorage.getItem(RUN_KEY)); } catch {}
    if (!run || !run.start || run.mode !== 'ceremony') {
      clearRun();
      return;
    }
    const now = Date.now();
    if (now < run.start) {
      if (run.start - now < 90000) {
        runStart = run.start;
        setState({ mode: 'countdown', countdown: 99 });
        wake();
        return;
      }
      clearRun();
      return;
    }
    if (now < run.start + (activeTotal(CEREMONY) + 120) * 1000) {
      runStart = run.start;
      setState({ mode: 'ceremony' });
      wake();
      return;
    }
    clearRun();
  }

  /* Screen wake lock ------------------------------------------------------- */

  let wakeLock = null;
  const wantsWake = () => state.mode === 'countdown' || state.mode === 'ceremony';

  function wake() {
    try {
      navigator.wakeLock?.request('screen').then(lock => {
        releaseWake();
        wakeLock = lock;
        if (!wantsWake()) releaseWake();
      }).catch(() => {});
    } catch {}
  }

  function releaseWake() {
    if (!wakeLock) return;
    try { wakeLock.release(); } catch {}
    wakeLock = null;
  }

  // The browser drops the lock whenever the page is hidden; take it back on return.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wantsWake()) wake();
  });

  /* Actions ---------------------------------------------------------------- */

  function openCeremony() {
    setState({ mode: 'primer' });
  }

  function beginCeremony() {
    const w = Math.max(4, SYNC_WINDOW) * 1000;
    runStart = Math.ceil((Date.now() + 2000) / w) * w;
    sceneIdx = -1;
    persistRun(runStart);
    setState({ mode: 'countdown', countdown: 99 });
    wake();
  }

  function exitRun() {
    clearRun();
    releaseWake();
    sceneIdx = -1;
    mount0 = Date.now();
    setState({ mode: 'landing', landingUi: true, slots: blankSlots() });
  }

  const actions = { open: openCeremony, begin: beginCeremony, exit: exitRun };

  sky.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (btn) actions[btn.dataset.action]();
  });

  /* Sky -------------------------------------------------------------------- */

  let W = 0;
  let H = 0;
  let letters = null;
  let ps = [];

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    letters = buildLetters();
  }

  // "N T" constellation for the landing screen.
  function buildLetters() {
    const tw = Math.min(W * 0.66, 330), lw = tw * 0.34, gap = tw * 0.32;
    const x0 = (W - tw) / 2, y0 = H * 0.13, lh = lw * 1.25;
    const N = [[0, 1], [0, 0.5], [0, 0], [0.35, 0.35], [0.7, 0.7], [1, 1], [1, 0.5], [1, 0]];
    const T = [[0, 0], [0.5, 0], [1, 0], [0.5, 0.5], [0.5, 1]];
    const pts = [];
    N.forEach(q => pts.push({ x: x0 + q[0] * lw, y: y0 + q[1] * lh }));
    T.forEach(q => pts.push({ x: x0 + lw + gap + q[0] * lw, y: y0 + q[1] * lh }));
    const segs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [8, 9], [9, 10], [9, 11], [11, 12]];
    return { pts, segs, star: { x: x0 + lw + gap / 2, y: y0 + lh * 0.45 } };
  }

  function initParticles() {
    const n = Math.max(220, Math.min(650, Math.round(W * H / 2600 * DUST_DENSITY)));
    const cols = ['#f5efe3', '#d9c6f5', '#b493d9', '#a7c9af'];
    ps = [];
    for (let i = 0; i < n; i++) {
      const cr = Math.random();
      ps.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0,
        vy: 0,
        s: 0.5 + Math.random() * 1.4,
        c: cols[cr < 0.5 ? 0 : cr < 0.78 ? 1 : cr < 0.92 ? 2 : 3],
        tw: Math.random() * TAU,
        r1: Math.random(),
        r2: Math.random(),
        ox: (Math.random() - 0.5) * 2,
        oy: (Math.random() - 0.5) * 2,
      });
    }
  }

  // Ambient current for particles without a target.
  function flow(p, now) {
    const s = 0.0035, t = now * 0.00006;
    const a = Math.sin(p.x * s * 1.7 + t * 2.3 + p.tw * 0.3) + Math.cos(p.y * s * 1.3 - t * 1.9);
    const ang = a * 2.1;
    return [Math.cos(ang), Math.sin(ang)];
  }

  function drawFrame(now) {
    g.clearRect(0, 0, W, H);
    const b = behavior, bt = (now - bT0) / 1000, u = sceneU || 0;
    const da = now / 90000;
    const dx = Math.cos(da) * 0.05, dy = Math.sin(da) * 0.02 + 0.008;
    const dm = b === 'still' ? 0.3 : b === 'afterglow' ? 0.55 : 1;
    let aMod = 1;
    if (b === 'dimBloom') aMod = u < 0.45 ? 0.45 : Math.min(1, 0.45 + (u - 0.45) * 2.2);
    const pph = (now % 8000) / 8000 * TAU;

    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const tgt = targetFor(p, i, b, bt, u);
      if (tgt) {
        const k = (tgt[2] || 0.045) * (0.65 + p.r2 * 0.7);
        p.vx = (p.vx + (tgt[0] - p.x) * k * 0.32) * 0.86;
        p.vy = (p.vy + (tgt[1] - p.y) * k * 0.32) * 0.86;
      } else {
        const f = flow(p, now);
        p.vx = (p.vx + (dx + f[0] * 0.011) * (0.4 + p.s * 0.5) * dm) * 0.965;
        p.vy = (p.vy + (dy + f[1] * 0.011) * (0.4 + p.s * 0.5) * dm) * 0.965;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (!tgt) {
        if (p.x < -8) p.x += W + 16;
        if (p.x > W + 8) p.x -= W + 16;
        if (p.y < -8) p.y += H + 16;
        if (p.y > H + 8) p.y -= H + 16;
      }
      const twk = 0.55 + 0.45 * Math.sin(now / 900 * (0.6 + p.s * 0.3) + p.tw * 7);
      const pls = 0.7 + 0.3 * Math.sin(pph - p.x / W * 2.5);
      const a = Math.min(1, 0.9 * twk * pls * aMod);
      g.globalAlpha = a;
      g.fillStyle = p.c;
      g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill();
      if (p.s > 1.45) {
        g.globalAlpha = a * 0.16;
        g.beginPath(); g.arc(p.x, p.y, p.s * 3.4, 0, TAU); g.fill();
      }
    }
    g.globalAlpha = 1;
    drawExtras(b, bt, u, now);
  }

  // Where particle i wants to be for the current behavior, as [x, y, pull];
  // null lets it drift on the ambient current.
  function targetFor(p, i, b, bt, u) {
    const m = Math.min(W, H), cx = W / 2, cy = H / 2;
    const wob = 1 + 0.08 * Math.sin(bt * 0.7 + p.tw * 3);
    switch (b) {
      case 'letters': {
        const L = letters;
        if (!L) return null;
        const nP = L.pts.length;
        if (i >= nP * 2) return null;
        const pi = (i / 2) | 0, start = (pi % 7) * 0.14;
        const lc = Math.min(1, Math.max(0, (bt - start) / 1.6));
        if (lc <= 0) return null;
        const pt = L.pts[pi];
        return [pt.x + p.ox * 3, pt.y + p.oy * 3, 0.02 + 0.06 * lc];
      }
      case 'gather': {
        const vx = p.x - cx, vy = p.y - cy;
        const ca = Math.cos(0.02), sa = Math.sin(0.02);
        return [cx + (vx * ca - vy * sa) * 0.985, cy + (vx * sa + vy * ca) * 0.985, 0.3];
      }
      case 'clusters': {
        const c1x = W * 0.26, c1y = H * 0.32, c2x = W * 0.74, c2y = H * 0.32, R = m * 0.11 * wob;
        if (p.r1 >= 0.6) return null;
        const cX = p.r1 < 0.3 ? c1x : c2x, cY = p.r1 < 0.3 ? c1y : c2y;
        const ang = bt * (0.18 + p.r2 * 0.14) + p.tw;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        return [cX + (p.ox * ca - p.oy * sa) * R, cY + (p.ox * sa + p.oy * ca) * R, 0.04];
      }
      case 'scatterHome': {
        if (p.r1 < 0.05 && bt > 6.5) return [cx + p.ox * m * 0.012, H * 0.34 + p.oy * m * 0.012, 0.05];
        const cell = Math.floor(bt / 1.4) * 31 + i * 13;
        return [hash(cell) * W, hash(cell + 1) * H, 0.014];
      }
      case 'waves': {
        const th = p.tw * 7;
        const r = ((bt * 0.07 + p.r1) % 1) * m * 0.6 + 6;
        return [cx + Math.cos(th) * r * wob, cy + Math.sin(th) * r * 0.8 * wob, 0.12];
      }
      case 'grow': {
        const gp = Math.min(1, bt / 9);
        if (p.r1 > gp) return null;
        const s = p.r1, y = H * 0.86 - s * H * 0.62;
        const x = cx + Math.sin(s * 7.5) * m * (0.04 + 0.13 * s) + p.ox * m * 0.02 * wob;
        return [x, y + p.oy * m * 0.02 * wob, 0.055];
      }
      case 'equal': {
        if (p.r1 >= 0.8) return null;
        const ph = bt * 0.55, R = m * 0.17;
        const sgn = p.r1 < 0.4 ? 1 : -1;
        const cX = cx + Math.cos(ph) * R * sgn, cY = cy + Math.sin(ph) * R * 0.45 * sgn;
        const ang = bt * (0.35 + p.r2 * 0.3) + p.tw;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const R2 = m * 0.055 * wob;
        return [cX + (p.ox * ca - p.oy * sa) * R2, cY + (p.ox * sa + p.oy * ca) * R2, 0.06];
      }
      case 'dimBloom': {
        if (u < 0.45) {
          if (p.r1 > 0.8) return null;
          const jit = Math.sin(bt * 17 + p.tw * 9) * 1.6;
          return [cx + p.ox * m * 0.09 + jit, cy + p.oy * m * 0.09 + jit, 0.05];
        }
        const r = (u - 0.45) / 0.55, th = p.tw * 7;
        const rr = r * m * 0.55 * (0.35 + p.r1);
        return [cx + Math.cos(th) * rr, cy + Math.sin(th) * rr * 0.85, 0.04];
      }
      case 'rings':
      case 'interlock': {
        if (p.r1 >= 0.88) return null;
        const R = m * 0.15 * (1 + 0.05 * Math.sin(runEl * 0.8 + p.tw * 5)), ry = cy * 0.9;
        let gap = Math.min(W * 0.5, m * 0.5);
        if (b === 'interlock') {
          const e = u * u * (3 - 2 * u);
          gap += (m * 0.15 * 1.1 - gap) * e;
        }
        const side = p.r1 < 0.44 ? 0 : 1, dir = side === 0 ? 1 : -1;
        const cX = side === 0 ? cx - gap / 2 : cx + gap / 2;
        const th = p.tw * 7 + runEl * (0.5 + p.r2 * 0.35) * dir;
        return [cX + Math.cos(th) * R, ry + Math.sin(th) * R, 0.08];
      }
      case 'finale': {
        if (p.r1 >= 0.9) return null;
        const R0 = m * 0.15, gap0 = R0 * 1.1, ry = cy * 0.9;
        let R, gap;
        if (u < 0.4) {
          const e = u / 0.4;
          R = R0 * (1 - e * 0.93);
          gap = gap0 * (1 - e * 0.25);
        } else if (u < 0.75) {
          R = R0 * 0.07;
          gap = gap0 * 0.75 * (1 - (u - 0.4) / 0.35);
        } else {
          R = R0 * 0.04;
          gap = 0;
        }
        const side = p.r1 < 0.45 ? 0 : 1, dir = side === 0 ? 1 : -1;
        const cX = side === 0 ? cx - gap / 2 : cx + gap / 2;
        const th = p.tw * 7 + runEl * (0.6 + u * 2.5 + p.r2 * 0.3) * dir;
        return [cX + Math.cos(th) * R, ry + Math.sin(th) * R, 0.1];
      }
      case 'afterglow': {
        if (p.r1 < 0.05) return [cx + p.ox * m * 0.012, H * 0.3 + p.oy * m * 0.012, 0.05];
        return null;
      }
      default:
        return null;
    }
  }

  function glow(x, y, r, col, a) {
    if (a <= 0 || r <= 0) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = Math.min(1, a);
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.globalAlpha = 1;
  }

  function starGlow(x, y, m, a) {
    glow(x, y, m * 0.018, 'rgba(255,255,255,0.95)', a);
    glow(x, y, m * 0.06, 'rgba(233,222,252,0.8)', a * 0.7);
    glow(x, y, m * 0.14, 'rgba(205,180,240,0.55)', a * 0.35);
  }

  // Lines, rings and glows drawn over the particles.
  function drawExtras(b, bt, u, now) {
    const m = Math.min(W, H), cx = W / 2, cy = H / 2;
    const LAV = 'rgba(205,180,240,0.85)', IVY = 'rgba(245,239,227,0.9)';
    if (b === 'letters') {
      const L = letters;
      const la = Math.min(1, Math.max(0, (bt - 1.8) / 1.6));
      if (la > 0) {
        g.globalAlpha = la * 0.35;
        g.strokeStyle = '#d6c4f0';
        g.lineWidth = 1;
        g.beginPath();
        for (const [from, to] of L.segs) {
          g.moveTo(L.pts[from].x, L.pts[from].y);
          g.lineTo(L.pts[to].x, L.pts[to].y);
        }
        g.stroke();
        g.globalAlpha = la * 0.8;
        g.fillStyle = '#f0eadb';
        for (const pt of L.pts) {
          g.beginPath(); g.arc(pt.x, pt.y, 1.8, 0, TAU); g.fill();
        }
        g.globalAlpha = 1;
        const sa = 0.5 + 0.25 * Math.sin(now / 650);
        starGlow(L.star.x, L.star.y, m, la * sa);
      }
    } else if (b === 'clusters') {
      glow(W * 0.26, H * 0.32, m * 0.06, LAV, 0.15);
      glow(W * 0.74, H * 0.32, m * 0.06, LAV, 0.15);
    } else if (b === 'scatterHome') {
      if (bt > 6.5) {
        const a = Math.min(1, (bt - 6.5) / 1.5);
        starGlow(cx, H * 0.34, m, a * 0.7);
      }
    } else if (b === 'waves') {
      g.strokeStyle = '#cdb4f0';
      for (let j = 0; j < 3; j++) {
        const rad = (bt * 0.07 + j / 3) % 1;
        g.globalAlpha = (1 - rad) * 0.08;
        g.beginPath(); g.arc(cx, cy, rad * m * 0.6 + 6, 0, TAU); g.stroke();
      }
      g.globalAlpha = 1;
    } else if (b === 'equal') {
      const ph = bt * 0.55, R = m * 0.17;
      const x1 = cx + Math.cos(ph) * R, y1 = cy + Math.sin(ph) * R * 0.45;
      const x2 = cx - Math.cos(ph) * R, y2 = cy - Math.sin(ph) * R * 0.45;
      g.globalAlpha = 0.07;
      g.strokeStyle = '#cdb4f0';
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.globalAlpha = 1;
      glow(x1, y1, m * 0.045, IVY, 0.3);
      glow(x2, y2, m * 0.045, LAV, 0.3);
    } else if (b === 'rings' || b === 'interlock') {
      const ph = sceneP.ph || 0;
      const R = m * 0.15, ry = cy * 0.9;
      let gap = Math.min(W * 0.5, m * 0.5);
      if (b === 'interlock') {
        const e = u * u * (3 - 2 * u);
        gap += (R * 1.1 - gap) * e;
      }
      g.strokeStyle = '#cdb4f0';
      g.lineWidth = 1;
      g.globalAlpha = b === 'interlock' ? 0.14 : 0.05 + ph * 0.03;
      g.beginPath(); g.arc(cx - gap / 2, ry, R, 0, TAU); g.stroke();
      g.beginPath(); g.arc(cx + gap / 2, ry, R, 0, TAU); g.stroke();
      g.globalAlpha = 1;
      if (b === 'interlock' && u > 0.5) glow(cx, ry, m * 0.08, IVY, (u - 0.5) * 0.6);
    } else if (b === 'finale') {
      const ry = cy * 0.9;
      if (u > 0.65) {
        const fa = (u - 0.65) / 0.35;
        glow(cx, ry, m * 0.3 * fa, 'rgba(233,222,252,0.9)', 0.55 * fa);
        starGlow(cx, ry, m, fa);
      }
    } else if (b === 'afterglow') {
      const a = 0.55 + 0.18 * Math.sin(now / 900);
      starGlow(cx, H * 0.3, m, a);
    } else if (b === 'gather') {
      glow(cx, cy, m * 0.05, LAV, 0.2);
    }
  }

  /* Boot ------------------------------------------------------------------- */

  window.addEventListener('resize', resize);
  resize();
  initParticles();
  restoreRun();
  render();
  requestAnimationFrame(tick);
})();
