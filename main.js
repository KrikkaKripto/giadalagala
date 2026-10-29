// Small, dependency-free interactions. Everything degrades to a plain readable page without JS.
document.documentElement.classList.add("js");

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---- hero: crossed lasers meet under the pointer (or finger); near the name, the light
   pushes letters away (radiation pressure) and splits them into the spectrum (a prism) ---- */
const hero = $(".hero:not(.hero-q)"), name = $("[data-light]");
if (hero && !calm) {
  let chars = [];
  if (name) {
    name.setAttribute("aria-label", name.textContent);
    // words stay unbroken (inline-blocks would otherwise wrap anywhere); &nbsp; keeps "La Gala" together
    name.innerHTML = name.textContent.split(" ")
      .map(w => `<span class="w" aria-hidden="true">${[...w].map(c => c === "\u00a0" ? "&nbsp;"
        : `<span class="ch">${c}</span>`).join("")}</span>`)
      .join(" ");
    chars = $$(".ch", name);
  }
  // letter centres relative to the hero, measured at rest (not while displaced)
  let centres = [];
  const measure = () => {
    const h = hero.getBoundingClientRect();
    centres = chars.map(c => {
      const r = c.getBoundingClientRect(), dx = parseFloat(c.dataset.dx || 0), dy = parseFloat(c.dataset.dy || 0);
      return [r.left + r.width / 2 - h.left - dx, r.top + r.height / 2 - h.top - dy];
    });
  };
  addEventListener("resize", measure);
  document.fonts?.ready.then(measure);
  measure();

  const R = Math.max(140, innerWidth * 0.16); // reach of the light
  let px = 0, py = 0, raf = 0;
  const paint = () => {
    hero.style.setProperty("--x", px + "px");
    hero.style.setProperty("--y", py + "px");
    chars.forEach((c, i) => {
      const dx = centres[i][0] - px, dy = centres[i][1] - py, d = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 1 - d / R) ** 1.5;
      const push = f * 18;
      c.dataset.dx = (dx / d * push).toFixed(1);
      c.dataset.dy = (dy / d * push).toFixed(1);
      c.style.setProperty("--f", f.toFixed(3));
      c.style.setProperty("--ux", (dx / d).toFixed(3));
      c.style.setProperty("--uy", (dy / d).toFixed(3));
    });
    raf = 0;
  };
  const aim = e => {
    const r = hero.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    if (!raf) raf = requestAnimationFrame(paint);
  };
  hero.addEventListener("pointermove", aim);
  hero.addEventListener("pointerdown", aim);
  hero.addEventListener("pointerleave", () => chars.forEach(c => { c.style.setProperty("--f", 0); c.dataset.dx = c.dataset.dy = 0; }));
}

/* ---- quantum particles on a five-fold Penrose quasicrystal: one wave packet per trap; brightness = |Ψ|², colour = arg Ψ.
   The same code draws the top of the page and the three boxes in "About the front page"; data-q-mode picks the story:
   - "hero": arrive hot as a thermal mixture (no phase, pale) and cool; a coherent part grows and colour appears;
     once cold, the pointer kicks the particles (a width and a momentum: pure waves, energy ΔE)
   - "heat": arrive hot as a thermal mixture and cool, as in the hero; the pointer heats them back into a mixture
   - "kick": cold from the start; the pointer kicks, as in the hero
   - "release": the traps switch off, the waves spread freely and interfere, then the expansion runs backwards
     (they refocus); the pointer releases the particles near it
   The pointer acts mirrored five times about the centre. Heat or kicks spread to neighbouring particles and fade.
   The cooling and the settling are scripted, not simulated. ---- */
const coth = x => 1 / Math.tanh(x);
// a harmonic oscillator at temperature T (T = 1 ↔ k_BT ≈ 7.6 ħΩ): σ = σ₀√c, k = √(c−1)/2σ₀, ω = (Ω/2)c, c = coth(ħΩ/2k_BT);
// a kick that gives the same σ and k is a pure wave with extra energy ΔE (in units of ħΩ, with σ₀ = 0.11 a)
const rel = T => { const tt = 7.6 * T, c = tt > 1e-3 ? coth(1 / (2 * tt)) : 1; return { sg: 0.11 * Math.sqrt(c), k: Math.sqrt(c - 1) / (2 * 0.11), w: 0.6 * c, c }; };
const kickE = T => { const R = rel(T), st = R.sg / 0.11, kt = R.k * 0.11; return Math.max(0, (kt * kt + 1 / (st * st) + st * st) / 2 - 1); };
const EQ = {
  wave: `<span class="q-eq-main">Ψ(r,t) = Σ<sub>j</sub> e<sup>−|r−r<sub>j</sub>|²/2σ²</sup> e<sup>i(k·(r−r<sub>j</sub>) − ωt)</sup></span>`,
  kick: T => { const R = rel(T); return EQ.wave
    + `<span class="q-eq-rel">ΔE = ħΩ [ (σ/σ<sub>0</sub>)² + (σ<sub>0</sub>/σ)² + (kσ<sub>0</sub>)² ] / 2 − ħΩ</span>`
    + `<span class="q-eq-t">ΔE<sub>max</sub> = <b>${kickE(T).toFixed(1)}</b> ħΩ</span>`
    + `<span class="q-eq-vals">σ = <b>${R.sg.toFixed(2)}</b> a &nbsp; |k| = <b>${R.k.toFixed(1)}</b> / a &nbsp; <span class="q-eq-c">(σ<sub>0</sub> = 0.11 a)</span></span>`; },
  mix: T => { const R = rel(T), f = T < 0.35 ? 1 - (T / 0.35) ** 2 : 0;
    return `<span class="q-eq-main">n(r) = f |Ψ<sub>c</sub>(r)|² + (1−f) Σ<sub>j</sub> g<sub>T</sub>(r−r<sub>j</sub>)</span>`
    + `<span class="q-eq-rel">Ψ<sub>c</sub> = Σ<sub>j</sub> φ<sub>0</sub>(r−r<sub>j</sub>) e<sup>iθ<sub>j</sub></sup> &nbsp; σ<sub>T</sub> = σ<sub>0</sub>√coth(ħΩ / 2k<sub>B</sub>T) &nbsp; f = 1 − (T/T<sub>c</sub>)²</span>`
    + `<span class="q-eq-t">k<sub>B</sub>T = <b>${(7.6 * T).toFixed(1)}</b> ħΩ &nbsp; f = <b>${f.toFixed(2)}</b></span>`
    + `<span class="q-eq-vals">σ<sub>T</sub> = <b>${R.sg.toFixed(2)}</b> a &nbsp; <span class="q-eq-c">(k<sub>B</sub>T<sub>c</sub> = 2.7 ħΩ, σ<sub>0</sub> = 0.11 a)</span></span>`; },
  release: tau => `<span class="q-eq-main">ψ<sub>j</sub>(r,t) = e<sup>−|r−r<sub>j</sub>|² / 2σ<sub>0</sub>²(1+iτ)</sup> / (1+iτ) &nbsp; Ψ = Σ<sub>j</sub> ψ<sub>j</sub></span>`
    + `<span class="q-eq-rel">τ = ħt / mσ<sub>0</sub>² &nbsp; σ = σ<sub>0</sub>√(1+τ²)</span>`
    + `<span class="q-eq-t">τ = <b>${tau.toFixed(1)}</b></span>`
    + `<span class="q-eq-vals">σ = <b>${(0.11 * Math.sqrt(1 + tau * tau)).toFixed(2)}</b> a &nbsp; <span class="q-eq-c">(σ<sub>0</sub> = 0.11 a)</span></span>`
};
const NOTE = mixNow => `<span class="q-eq-note">${mixNow ? "pale = mixture (no phase) · colour = coherent part" : "brightness |Ψ|² · colour arg Ψ"}</span>`;
const qField = root => {
  const mode = root.dataset.qMode || "hero", HERO = root.classList.contains("hero-q");
  const cv = $(".q-field", root), ctx = cv.getContext("2d"), qEq = $(".q-eq", root);
  const qName = HERO && $("[data-q]", root), qRoles = HERO && $(".roles", root);
  let letters = [];
  if (qName) {   // letters in spans, words kept unbroken; the heading keeps its plain text for screen readers
    qName.setAttribute("aria-label", qName.textContent.replace(/ /g, " "));
    qName.innerHTML = qName.textContent.split(" ").map(w => `<span class="w" aria-hidden="true">${[...w].map(c => c === " " ? "&nbsp;" : `<span class="lt">${c}</span>`).join("")}</span>`).join(" ");
    letters = $$(".lt", qName);
  }
  const COOL = 5.5, finePtr = finePointer;
  const rings = finePtr ? Array.from({ length: 5 }, (_, j) => { const d = document.createElement("div"); d.className = "q-finger" + (j === 0 ? " main" : ""); d.setAttribute("aria-hidden", "true"); root.appendChild(d); return d; }) : [];
  let W = 0, H = 0, CX = 0, CY = 0, cell = 5, NX = 0, NY = 0, img, low = document.createElement("canvas"), lx = low.getContext("2d");
  let sites = [], buckets = [], BW = 0, BH = 0, B = 120, EDGE = 60, pairs = [];
  const build = () => {
    const r = cv.getBoundingClientRect(); W = r.width; H = r.height; CX = W / 2; CY = H / 2;
    if (!W || !H) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = W < 520 ? 3.5 : 5; NX = Math.ceil(W / cell); NY = Math.ceil(H / cell);
    low.width = NX; low.height = NY; img = lx.createImageData(NX, NY);
    stamp = new Uint32Array(NX * NY); drawn = false; prevRects = [];
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    EDGE = HERO ? Math.max(40, Math.min(66, W / 22)) : Math.max(30, Math.min(44, W / 9)); B = EDGE * 2;
    // vertices of a Penrose rhombus tiling by de Bruijn's pentagrid; equal offsets (adding up to 1) → five-fold about the centre
    const E = [0, 1, 2, 3, 4].map(j => [Math.cos(2 * Math.PI * j / 5 + Math.PI / 2), Math.sin(2 * Math.PI * j / 5 + Math.PI / 2)]), G = 0.2;   // 5 × 0.2 = 1: a true Penrose tiling, five-fold about the centre
    const seen = new Set(), span = Math.max(W, H) / EDGE / 2 + 3; sites = [];
    for (let v = -span; v <= span; v += 0.11) for (let u = -span; u <= span; u += 0.11) {
      let X = 0, Y = 0; for (const [ex, ey] of E) { const k = Math.ceil(u * ex + v * ey + G); X += k * ex; Y += k * ey; }
      const x = CX + X * EDGE, y = CY + Y * EDGE;
      if (x < -40 || y < -40 || x > W + 40 || y > H + 40) continue;
      const key = Math.round(x * 2) + "," + Math.round(y * 2); if (seen.has(key)) continue; seen.add(key);
      const rr = Math.hypot(x - CX, y - CY) || 1;
      sites.push({ x, y, r: rr, ux: (x - CX) / rr, uy: (y - CY) / rr, heat: 0, T: 0, tau: 0 });
    }
    // neighbours for heat conduction: sites closer than ~1.3 tile edges
    pairs = [];
    for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
      const a = sites[i], b = sites[j]; if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (1.3 * EDGE) ** 2) pairs.push(i, j); }
    // sites sorted into square buckets (an array, not a map: this lookup runs millions of times)
    BW = Math.ceil(W / B) + 2; BH = Math.ceil(H / B) + 2; buckets = Array.from({ length: BW * BH }, () => []);
    for (const s of sites) { const bx = Math.floor(s.x / B), by = Math.floor(s.y / B); if (bx >= 0 && by >= 0 && bx < BW && by < BH) buckets[by * BW + bx].push(s); }
  };
  let px = 0, py = 0, pOn = false, pv = 0, lastMove = 0;
  const aimQ = e => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    // the finger gives energy in proportion to how fast it moves (stirring), so holding still lets it settle
    if (pOn && lastMove) { const dtm = Math.max(8, now - lastMove); pv = pv * 0.5 + 0.5 * Math.min(3000, Math.hypot(x - px, y - py) / dtm * 1000); }
    px = x; py = y; pOn = true; lastMove = now;
  };
  root.addEventListener("pointermove", aimQ); root.addEventListener("pointerdown", aimQ);
  root.addEventListener("pointerleave", () => { pOn = false; lastMove = 0; pv = 0; });
  root.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") pOn = false; });
  const mirrors = () => { const dx = px - CX, dy = py - CY, out = [];
    for (let j = 0; j < 5; j++) { const a = 2 * Math.PI * j / 5, c = Math.cos(a), s = Math.sin(a); out.push([CX + dx * c - dy * s, CY + dx * s + dy * c]); } return out; };
  const paint = (d, re, im, Tm, o) => {
    const I = re * re + im * im; if (I < 1e-5) { d[o + 3] = 0; return; }
    const v = 1 - Math.exp(-I * (1.8 + 1.8 * (1 - Tm))), c = .5 + .5 * Math.cos(Math.atan2(im, re)), m = c * c * (3 - 2 * c) * Math.min(1, v * 1.3 + Tm * 0.4);
    d[o] = 150 + 105 * m; d[o + 1] = 90 + 124 * m; d[o + 2] = 255 - 195 * m; d[o + 3] = Math.min(1, v * (0.75 + 0.35 * (1 - Tm))) * 255;
  };
  // the mixture: coherent light in violet/yellow by phase, the incoherent part as a pale, colourless glow
  const paintMix = (d, re, im, Iin, o) => {
    const Ic = re * re + im * im, vc = 1 - Math.exp(-Ic * 3.6), vi = 1 - Math.exp(-Iin * 9);
    if (vc + vi < 0.004) { d[o + 3] = 0; return; }
    const c = .5 + .5 * Math.cos(Math.atan2(im, re)), m = c * c * (3 - 2 * c) * Math.min(1, vc * 1.3);
    const cr = 150 + 105 * m, cg = 90 + 124 * m, cb = 255 - 195 * m, w = vc / (vc + vi);
    d[o] = cr * w + 226 * (1 - w); d[o + 1] = cg * w + 218 * (1 - w); d[o + 2] = cb * w + 240 * (1 - w);
    d[o + 3] = Math.min(1, Math.max(vc * 1.1, vi * 0.8)) * 255;
  };
  let mixNow = false, relMode = mode === "release";
  // one cell of the field: the sum of the nearby wave packets (amplitudes add, so neighbours interfere; a mixture adds probabilities)
  const cellAt = (i, j, n) => {
    const X = (i + .5) * cell, Y = (j + .5) * cell, bx = Math.floor(X / B), by = Math.floor(Y / B);
    let re = 0, im = 0, Tm = 0, Iin = 0;
    for (let b2 = Math.max(0, by - 1); b2 <= by + 1 && b2 < BH; b2++) for (let b1 = Math.max(0, bx - 1); b1 <= bx + 1 && b1 < BW; b1++) {
      const list = buckets[b2 * BW + b1];
      for (let m = 0; m < list.length; m++) {
        const s = list[m], dx = X - s.x, dy = Y - s.y;
        if (dx > s.reach || dx < -s.reach || dy > s.reach || dy < -s.reach) continue;
        const r2 = dx * dx + dy * dy, q = r2 * s.inv2; if (q > 7) continue;
        if (relMode) {   // a freely expanding packet; all start with the same phase
          const g = s.ramp * Math.exp(-q), ph = s.rb * r2 + s.rph;
          re += g * Math.cos(ph); im += g * Math.sin(ph); continue;
        }
        if (mixNow) {
          const gc = Math.sqrt(s.f) * Math.exp(-r2 * s.inv2c);
          re += gc * Math.cos(s.ph0c); im += gc * Math.sin(s.ph0c);
          Iin += (1 - s.f) * s.dens * Math.exp(-2 * q); if (s.T > Tm) Tm = s.T; continue;
        }
        const g = Math.exp(-q), ph = s.kx * dx + s.ky * dy + s.ph0;
        re += g * Math.cos(ph); im += g * Math.sin(ph); if (s.T > Tm) Tm = s.T;
      }
    }
    if (mixNow) paintMix(img.data, re, im, Iin, n * 4); else paint(img.data, re, im, Tm, n * 4);
  };
  // per site, once per update: its width, momentum and phase (momentum radial + a turn, so it stays five-fold)
  const prepare = t => { for (const s of sites) {
    const s0 = EDGE * 0.11;
    if (relMode) {   // ψ = e^{−r²/2σ₀²(1+iτ)}/(1+iτ); true amplitude 1/√D, shown brighter (like a camera's auto-exposure)
      const D = 1 + s.tau * s.tau;
      s.inv2 = 1 / (2 * s0 * s0 * D); s.rb = s.tau / (2 * s0 * s0 * D); s.ramp = Math.pow(D, -0.15); s.rph = -Math.atan(s.tau); s.reach = s0 * Math.sqrt(D) * 3.75;
      continue;
    }
    const R0 = rel(s.T), sg = EDGE * R0.sg, kk = R0.k / EDGE / 1.166;   // 1.166 = length of the direction (1, 0.6)
    s.inv2 = 1 / (2 * sg * sg); s.reach = sg * 3.75;
    s.kx = kk * (s.ux - 0.6 * s.uy); s.ky = kk * (s.uy + 0.6 * s.ux);
    // a fixed radial phase for the colour rings − a time phase that runs faster when hot (the common 0.6·t is left out: a global phase is not observable)
    s.ph0 = 0.02 * s.r * Math.max(s.T, 0.4) * 60 / EDGE - t * (R0.w - 0.6);
    // the mixture: coherent fraction f = 1 − (T/Tc)² below Tc (k_BTc ≈ 2.7 ħΩ), a ground-state packet with a locked phase;
    // the rest is a thermal blob whose peak drops as it widens (probability is conserved)
    s.f = s.T < 0.35 ? 1 - (s.T / 0.35) ** 2 : 0; s.inv2c = 1 / (2 * s0 * s0); s.dens = (s0 / sg) ** 2; s.ph0c = 0.02 * s.r * 0.4 * 60 / EDGE;
  } };
  let drawn = false, lastFull = -1e9, prevRects = [], stamp = new Uint32Array(0), tick = 1, lettersDone = false, wasRel = false, lastEq = "", lastEqT = 0;
  let t0 = null, lastT = 0, visible = HERO;   // a box starts its story when it first comes into view
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(root);
  const frame = now => {
    const t = now / 1000, dt = lastT ? Math.min(0.1, t - lastT) : 0; lastT = t;
    if (t0 === null) t0 = t;
    const age = calm ? 99 : t - t0, x = Math.min(1, age / COOL), cooling = mode === "hero" || mode === "heat";
    const Tg = cooling ? Math.pow(1 - x, 2.2) : 0, cold = !cooling || calm || Tg < 0.03;
    // release: τ grows for 2.6 s from 0.3 s, then the expansion runs backwards for 2.6 s
    const relG = relMode && !calm ? (age < 0.3 ? 0 : age < 2.9 ? (age - 0.3) / 2.6 * 5 : age < 5.5 ? (5.5 - age) / 2.6 * 5 : 0) : 0;
    mixNow = (mode === "hero" && !cold) || mode === "heat";
    // in the hero the finger waits until the particles are cold
    const fingers = pOn && !calm && (mode !== "hero" || cold) ? mirrors() : [];
    rings.forEach((d, j) => { d.style.opacity = fingers.length ? (j === 0 ? 1 : .45) : 0; if (fingers.length) { d.style.left = fingers[j][0] + "px"; d.style.top = fingers[j][1] + "px"; } });
    for (const s of sites) {
      for (const [fx, fy] of fingers) { const d2 = (s.x - fx) ** 2 + (s.y - fy) ** 2; if (d2 < 8100) s.heat = Math.min(1, s.heat + dt * pv / 300 * (1 - Math.sqrt(d2) / 90)); }
    }
    // heat (or kick energy) flows to neighbouring particles, and the whole lattice loses it to its surroundings
    for (let n = 0; n < pairs.length; n += 2) { const a = sites[pairs[n]], b = sites[pairs[n + 1]], f = 3 * dt * (b.heat - a.heat); a.heat += f; b.heat -= f; }
    let Tsum = 0, Tmax = 0, tauMax = 0;
    for (const s of sites) {
      s.heat *= Math.exp(-dt / 6); if (s.heat < 0.01) s.heat = 0;
      if (relMode) { s.T = 0; s.tau = Math.max(relG, Math.min(5, s.heat * 12)); if (s.tau > tauMax) tauMax = s.tau; }
      else s.T = Math.max(Tg, s.heat);
      Tsum += s.T; if (s.T > Tmax) Tmax = s.T;
    }
    pv *= Math.exp(-dt / 0.12);                   // no movement, no stirring
    const Tmean = sites.length ? Tsum / sites.length : 0;
    // the field is only recomputed where something changes: everywhere while it cools or releases on arrival,
    // then only around warm, kicked or released particles, plus where they were last frame; when calm, nothing at all
    const full = Tg > 0.004 || !drawn || relG > 0 || wasRel;
    wasRel = relG > 0;
    if (W && !(drawn && now - lastFull < 33)) {   // at most ~30 field updates a second
      const rects = [];
      if (full) rects.push([0, 0, NX, NY]);
      else for (const s of sites) if (s.T > 0.004 || s.tau > 0) {
        const rad = Math.sqrt(14) * EDGE * Math.max(rel(s.T).sg, 0.11 * Math.sqrt(1 + s.tau * s.tau)) / cell + 1;
        const ci = s.x / cell, cj = s.y / cell;
        rects.push([Math.max(0, Math.floor(ci - rad)), Math.max(0, Math.floor(cj - rad)), Math.min(NX, Math.ceil(ci + rad)), Math.min(NY, Math.ceil(cj + rad))]);
      }
      const todo = rects.concat(prevRects);
      if (todo.length) {
        prepare(t);
        let x0 = NX, y0 = NY, x1 = 0, y1 = 0;
        for (const [a0, b0, a1, b1] of todo) for (let j = b0; j < b1; j++) for (let i = a0; i < a1; i++) {
          const n = j * NX + i; if (stamp[n] === tick) continue; stamp[n] = tick; cellAt(i, j, n);
        }
        for (const [a0, b0, a1, b1] of todo) { x0 = Math.min(x0, a0); y0 = Math.min(y0, b0); x1 = Math.max(x1, a1); y1 = Math.max(y1, b1); }
        tick++;
        lx.putImageData(img, 0, 0, x0, y0, x1 - x0, y1 - y0);
        ctx.clearRect(0, 0, W, H); ctx.drawImage(low, 0, 0, W, H);
        drawn = true; lastFull = now;
      }
      prevRects = rects;
    }
    // the name: letters arrive one by one as it cools, each rippling like a wave that settles
    if (qName && !lettersDone) {
      letters.forEach((el, k) => {
        const start = 0.9 + k * 0.28, a = calm ? 1 : Math.min(1, Math.max(0, (age - start) / 0.9));
        const wv = calm ? 0 : Math.max(0, 1 - (age - start) / 2.6) ** 2, w = (age - start) * 7 - k * 0.8;
        el.style.opacity = a.toFixed(3);
        el.style.transform = wv > 0.002 ? `translateY(${(wv * 18 * Math.sin(w)).toFixed(1)}px) skewX(${(wv * 8 * Math.sin(w + 1.2)).toFixed(2)}deg)` : "";
        el.style.filter = wv > 0.02 ? `blur(${(wv * 3).toFixed(2)}px)` : "";
      });
      if (age > 0.9 + letters.length * 0.28 + 1.2) qRoles.classList.add("on");
      if (age > 0.9 + letters.length * 0.28 + 3) lettersDone = true;
    }
    // the equations: the same quantities the picture is drawn with, at most ~8 updates a second
    if (qEq && (now - lastEqT > 120 || !lastEq)) {
      lastEqT = now;
      const r2d = v => Math.round(v * 100) / 100;
      const h = (relMode ? EQ.release(r2d(tauMax)) : mixNow ? EQ.mix(r2d(Tmean)) : EQ.kick(r2d(Tmax))) + NOTE(mixNow);
      if (h !== lastEq) { lastEq = h; qEq.innerHTML = h; qEq.classList.toggle("calm", relMode ? tauMax === 0 : (mode === "heat" ? Tmean : Tmax) < 0.005); }
    }
  };
  addEventListener("resize", () => { build(); if (calm) requestAnimationFrame(frame); });
  const replay = () => { t0 = null; lettersDone = false; lastEq = ""; for (const s of sites) s.heat = 0; drawn = false; if (qRoles) qRoles.classList.remove("on"); };
  root.addEventListener("q-replay", replay);
  const again = $(".q-again", root); if (again) again.addEventListener("click", replay);
  if (qEq) qEq.hidden = false;
  build();
  if (calm) { requestAnimationFrame(frame); if (qRoles) qRoles.classList.add("on"); }
  else { const loop = now => { if (visible) frame(now); else lastT = 0; requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
};
for (const el of $$(".hero-q, .q-box")) { const st = $(".q-stage", el); if (st) st.hidden = false; qField(st || el); }

/* ---- in-page links: scroll by script, so they also work inside embedded previews ---- */
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  const target = a && a.hash.length > 1 && document.getElementById(a.hash.slice(1));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
});

/* ---- overlay menu ---- */
const menu = $("#menu"), menuBtn = $(".bar-menu");
const setMenu = open => {
  menu.hidden = !open;
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.textContent = open ? "close" : "index";
  document.body.style.overflow = open ? "hidden" : "";
  if (open) $$("li", menu).forEach((li, i) => li.style.setProperty("--i", i));
};
const toggleMenu = e => {
  e.preventDefault(); e.stopPropagation(); // without JS this link just jumps to the section index
  const open = menu.hidden;
  setMenu(open);
  if (open) $("a", menu)?.focus();
};
menuBtn.addEventListener("click", toggleMenu);
menuBtn.addEventListener("keydown", e => { if (e.key === " ") toggleMenu(e); });
menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

/* ---- index: image preview follows the cursor (desktop only) ---- */
const peek = $(".peek");
if (peek && finePointer) {
  $$(".index a").forEach(a => {
    a.addEventListener("pointerenter", () => { peek.src = a.dataset.preview; peek.classList.add("on"); });
    a.addEventListener("pointerleave", () => peek.classList.remove("on"));
    a.addEventListener("pointermove", e => {
      peek.style.setProperty("--px", e.clientX + 24 + "px");
      peek.style.setProperty("--py", e.clientY - 120 + "px");
    });
  });
}

/* ---- reveal on scroll + "you are here" label in the top bar ---- */
const now = $(".bar-now"), nowText = $(".bar-now span");
$$(".facet-body > *, .lede, .index li").forEach(el => el.classList.add("reveal"));
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}, { rootMargin: "0px 0px -8% 0px" });
$$(".reveal, .facet, .spectrum").forEach(el => io.observe(el));

const where = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const label = e.target.dataset.label;
    now.classList.toggle("on", !!label);
    if (label) nowText.textContent = label;
  }
}, { rootMargin: "-45% 0px -50% 0px" });
$$("section").forEach(s => where.observe(s));

/* ---- log: the list is already in the HTML (built from [x] entries); JS only adds the filter ---- */
const list = $(".log-list");
if (list) {
  const filter = key => {
    let divider = null, shown = 0;
    for (const li of list.children) {
      if (li.classList.contains("yr")) {
        if (divider) divider.hidden = !shown;
        divider = li; shown = 0; continue;
      }
      li.hidden = key !== "all" && li.dataset.facet !== key;
      if (!li.hidden) shown++;
    }
    if (divider) divider.hidden = !shown;
  };
  $$(".chips button").forEach(b => b.addEventListener("click", () => {
    $$(".chips button").forEach(x => x.setAttribute("aria-pressed", x === b));
    filter(b.dataset.filter);
  }));
}

/* ---- gallery videos: without JS they have native controls and download only on play.
   With JS: silent autoplay while on screen, click / Enter / Space to pause or resume ---- */
$$("video[data-lazy]").forEach(v => {
  if (calm) return; // reduced motion: keep the native controls, never autoplay
  v.controls = false;
  v.tabIndex = 0;
  v.setAttribute("aria-label", v.getAttribute("aria-label") + " Press Enter to pause or play.");
  let userPaused = false;
  const fig = v.closest("figure");
  const toggle = () => {
    userPaused = !v.paused;
    userPaused ? v.pause() : v.play().catch(() => {});
    fig.classList.toggle("paused", userPaused);
  };
  v.addEventListener("click", toggle);
  v.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!userPaused) v.play().catch(() => {}); }
    else v.pause();
  }, { rootMargin: "200px 0px" }).observe(v);
});

/* ---- gallery strips: arrows + counter for mouse users (touch users swipe) ---- */
if (finePointer) $$(".gallery-wrap").forEach(wrap => {
  const strip = $(".gallery", wrap), figs = $$("figure", strip);
  if (figs.length < 2) return;
  const nav = document.createElement("div");
  nav.className = "strip-nav";
  nav.innerHTML = '<span class="count" aria-hidden="true"></span>' +
    '<button type="button" aria-label="Previous picture">←</button><button type="button" aria-label="Next picture">→</button>';
  wrap.prepend(nav);
  const [prev, next] = $$("button", nav), count = $(".count", nav);
  const current = () => { // first figure whose left edge is at or past the strip's scroll position
    const x = strip.scrollLeft + 4;
    const i = figs.findIndex(f => f.offsetLeft - strip.offsetLeft >= x - 4);
    return i < 0 ? figs.length - 1 : i;
  };
  const go = d => {
    const i = Math.min(figs.length - 1, Math.max(0, current() + d));
    strip.scrollTo({ left: figs[i].offsetLeft - strip.offsetLeft, behavior: calm ? "auto" : "smooth" });
  };
  const update = () => {
    const end = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
    prev.disabled = strip.scrollLeft <= 4;
    next.disabled = end;
    count.textContent = `${end ? figs.length : current() + 1} / ${figs.length}`;
    nav.hidden = strip.scrollWidth <= strip.clientWidth + 4; // everything fits: no arrows
  };
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  let raf = 0;
  strip.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); });
  addEventListener("resize", update);
  update();
});

/* ---- lightbox: the image itself is the button (captions may contain links) ---- */
const lb = $(".lightbox");
if (lb && lb.showModal) {
  const lbImg = $("img", lb), lbCap = $(".lb-cap", lb);
  $$(".gallery figure img").forEach(img => {
    const cap = $("figcaption", img.closest("figure"))?.textContent || "";
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Enlarge image: " + (cap || img.alt));
    const open = () => {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = cap;
      lb.showModal();
    };
    img.addEventListener("click", open);
    img.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  lb.addEventListener("click", e => { if (e.target !== lbImg) lb.close(); });
}
