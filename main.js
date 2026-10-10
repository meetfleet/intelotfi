const body = document.body;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Reduced motion softens the effects instead of removing them.
const AMP = reduceMotion ? 0.35 : 1;
const finePointer = matchMedia("(pointer: fine)").matches;
const isMobile = () => matchMedia("(max-width: 768px)").matches;

/* ---------- Springs ---------- */

// Damped harmonic oscillator. Interrupting a spring mid-flight keeps its
// velocity, which is what makes the motion feel physical rather than tweened.
class Spring {
  constructor(value = 0, stiffness = 170, damping = 26) {
    this.x = value;
    this.target = value;
    this.v = 0;
    this.k = stiffness;
    this.c = damping;
  }
  step(dt) {
    const a = -this.k * (this.x - this.target) - this.c * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
  }
}

const springs = [];
const spring = (...args) => {
  const s = new Spring(...args);
  springs.push(s);
  return s;
};

/* ---------- Stagger indices ---------- */

const setIndex = (els) => els.forEach((el, i) => el.style.setProperty("--i", i));
setIndex(document.querySelectorAll(".manifesto .line > span"));
setIndex(document.querySelectorAll(".menu a"));

/* ---------- Elements ---------- */

const hero = document.querySelector(".hero");
const heroImg = hero.querySelector(".hero__bg img");
const canvas = hero.querySelector(".hero__gl");
const rolesEl = document.querySelector(".roles");
const manifesto = document.querySelector(".manifesto");
const burger = document.querySelector(".burger");
const burgerLines = burger.querySelector(".burger__lines");
const logo = document.querySelector(".logo");
const menu = document.getElementById("menu");

if (isMobile() && heroImg.dataset.mobileSrc) heroImg.src = heroImg.dataset.mobileSrc;

/* ---------- Pointer ---------- */

const pointer = { x: innerWidth / 2, y: innerHeight / 2, moved: false };

addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.moved = true;
}, { passive: true });

/* ---------- Parallax (soft, slightly underdamped) ---------- */

const par = { x: spring(0, 38, 10), y: spring(0, 38, 10) };

/* ---------- WebGL hero ---------- */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;      // canvas size (px)
uniform vec2 uImg;      // image size (px)
uniform vec2 uFocus;    // object-position equivalent
uniform float uReveal;
uniform float uTime;
uniform float uAmp;     // overall motion strength
uniform float uFlip;    // 1 = mirrored for right-to-left languages
varying vec2 vUv;

vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return uv * s + (1.0 - s) * uFocus;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // intro dolly; the image never follows the pointer
  float zoom = mix(1.035 + 0.125 * uAmp, 1.035, uReveal);
  vec2 uv = (vUv - 0.5) / zoom + 0.5;

  vec2 tuv = cover(uv);
  if (uFlip > 0.5) tuv.x = 1.0 - tuv.x;
  vec3 col = texture2D(uTex, tuv).rgb;

  // slow breathing on the moon's highlights
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += col * smoothstep(0.55, 1.0, lum) * 0.035 * sin(uTime * 0.5);

  // exposure ramp for the intro
  col *= smoothstep(0.0, 1.0, uReveal);

  // fine animated film grain
  float n = hash(vUv * uRes + fract(uTime) * 917.0);
  col += (n - 0.5) * 0.045;

  gl_FragColor = vec4(col, 1.0);
}`;

function createGL() {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heroImg);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const u = {};
  for (const name of ["uTex", "uRes", "uImg", "uFocus", "uReveal", "uTime", "uAmp", "uFlip"]) {
    u[name] = gl.getUniformLocation(prog, name);
  }
  gl.uniform1i(u.uTex, 0);
  gl.uniform1f(u.uAmp, AMP);
  gl.uniform2f(u.uImg, heroImg.naturalWidth, heroImg.naturalHeight);

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(u.uRes, w, h);
    gl.uniform2f(u.uFocus, isMobile() ? 0.7 : 0.62, 0.5);
  };
  resize();
  addEventListener("resize", resize);

  return {
    draw(s) {
      gl.uniform1f(u.uReveal, s.reveal);
      gl.uniform1f(u.uTime, s.time);
      gl.uniform1f(u.uFlip, i18n.dir === "rtl" ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

let glView = null;
let heroVisible = true;
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

/* ---------- Roles: per-item springs ---------- */

const roles = [...document.querySelectorAll(".role")].map((el) => ({
  el,
  x: spring(0, 160, 15),
  y: spring(0, 160, 15),
  o: spring(1, 90, 19),
  d: spring(0, 180, 16),
}));
let hoveredRole = -1;

roles.forEach((r, i) => {
  r.el.addEventListener("pointerenter", () => { hoveredRole = i; });
  r.el.addEventListener("pointerleave", () => { if (hoveredRole === i) hoveredRole = -1; });
});

function updateRoleTargets() {
  roles.forEach((r, i) => {
    const active = i === hoveredRole;
    r.o.target = hoveredRole === -1 ? 1 : active ? 1 : 0.26;
    r.d.target = active ? 1 : 0;
    if (active) {
      // magnetic pull toward the pointer, measured from the un-transformed box
      const b = r.el.getBoundingClientRect();
      const cx = b.left + b.width / 2 - r.x.x;
      const cy = b.top + b.height / 2 - r.y.x;
      // shift toward the page centre: left in LTR, right in RTL
      const inward = i18n.dir === "rtl" ? 1 : -1;
      r.x.target = inward * 18 + (pointer.x - cx) * 0.06;
      r.y.target = Math.max(-8, Math.min(8, (pointer.y - cy) * 0.35));
    } else {
      r.x.target = 0;
      r.y.target = 0;
    }
  });
}

/* ---------- Roles cycle: two at a time, looping ---------- */

const roleItems = [...rolesEl.children];
const pairs = [];
for (let i = 0; i < roleItems.length; i += 2) pairs.push(roleItems.slice(i, i + 2));
pairs.forEach((pair) => pair.forEach((li, j) => li.style.setProperty("--pair-i", j)));

const HOLD = 3400;    // time a pair stays on screen
const EXIT = 1300;    // exit transition + stagger
let pairIndex = -1;
let cycleTimer = 0;

function showPair(next) {
  const prev = pairs[pairIndex];
  if (prev) {
    prev.forEach((li) => { li.classList.remove("is-in"); li.classList.add("is-out"); });
    // once it has left, drop it back under the mask without animating
    setTimeout(() => prev.forEach((li) => li.classList.remove("is-out")), EXIT);
  }
  pairIndex = next;
  pairs[pairIndex].forEach((li) => li.classList.add("is-in"));
}

function scheduleCycle(delay = HOLD) {
  clearTimeout(cycleTimer);
  cycleTimer = setTimeout(() => {
    const paused = hoveredRole !== -1 || body.classList.contains("menu-open") || document.hidden;
    if (paused) return scheduleCycle(600);
    showPair((pairIndex + 1) % pairs.length);
    scheduleCycle();
  }, delay);
}

/* ---------- Magnetic logo + burger ---------- */

const magnets = [
  { el: burger, inner: burgerLines, radius: 110, pull: 0.4 },
  { el: logo, inner: null, radius: 120, pull: 0.22 },
  ...[...document.querySelectorAll("[data-magnet]")].map((el) => ({
    el,
    inner: el.querySelector("[data-magnet-inner]"),
    radius: Number(el.dataset.magnetRadius) || 90,
    pull: Number(el.dataset.magnetPull) || 0.25,
  })),
].map((m) => ({ ...m, x: spring(0, 150, 13), y: spring(0, 150, 13) }));

function updateMagnets() {
  if (!finePointer) return;
  for (const m of magnets) {
    const b = m.el.getBoundingClientRect();
    if (b.bottom < -200 || b.top > innerHeight + 200) { m.x.target = m.y.target = 0; continue; }
    const cx = b.left + b.width / 2 - m.x.x;
    const cy = b.top + b.height / 2 - m.y.x;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const near = Math.hypot(dx, dy) < m.radius;
    m.x.target = near ? dx * m.pull : 0;
    m.y.target = near ? dy * m.pull : 0;
  }
}

/* ---------- Spring cursor ---------- */

const cursor = { el: document.querySelector(".cursor") };
if (finePointer) {
  body.classList.add("has-cursor");
  cursor.dot = cursor.el.querySelector(".cursor__dot");
  cursor.ring = cursor.el.querySelector(".cursor__ring");
  cursor.dx = spring(pointer.x, 900, 60);
  cursor.dy = spring(pointer.y, 900, 60);
  cursor.rx = spring(pointer.x, 170, 19);
  cursor.ry = spring(pointer.y, 170, 19);
  cursor.scale = spring(1, 220, 18);
  cursor.alpha = spring(0, 120, 22);
  cursor.press = false;

  addEventListener("pointerdown", () => { cursor.press = true; });
  addEventListener("pointerup", () => { cursor.press = false; });
  document.documentElement.addEventListener("pointerleave", () => { pointer.moved = false; });
}

function updateCursorTargets() {
  if (!cursor.dx) return;
  cursor.dx.target = cursor.rx.target = pointer.x;
  cursor.dy.target = cursor.ry.target = pointer.y;
  const hit = document.elementFromPoint(pointer.x, pointer.y);
  const interactive = hit && hit.closest("a, button, .role");
  cursor.scale.target = cursor.press ? 0.6 : interactive ? 1.9 : 1;
  cursor.alpha.target = pointer.moved ? 1 : 0;
}

/* ---------- About: word split, reveals, counters, card tilt ---------- */

function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.innerHTML = text
    .split(/\s+/)
    .map((w, i) => `<span class="word" aria-hidden="true"><span style="--w:${i}">${w.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`)}</span></span>`)
    .join(" ");
}

const splitEls = [...document.querySelectorAll("[data-split]")];
splitEls.forEach(splitWords);
i18n.onChange(() => splitEls.forEach(splitWords));

const stats = [...document.querySelectorAll(".stat")];
stats.forEach((el, i) => el.style.setProperty("--i", i));
document.querySelectorAll(".post").forEach((el, i) => el.style.setProperty("--i", i));
[".result", ".index__row", ".channels > li", ".essay"].forEach((sel) => setIndex(document.querySelectorAll(sel)));

const fmtCount = (el, n) => {
  const pad = Number(el.dataset.pad || 0);
  const dec = Number(el.dataset.decimals || 0);
  return n.toFixed(dec).padStart(pad + (dec ? dec + 1 : 0), "0");
};

function countUp(el) {
  const to = Number(el.dataset.count);
  if (reduceMotion) { el.textContent = fmtCount(el, to); return; }
  const start = performance.now();
  const duration = 1800 + to * 12;
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = fmtCount(el, t >= 1 ? to : to * (1 - Math.pow(2, -10 * t)));
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = fmtCount(el, 0);
  requestAnimationFrame(tick);
}

const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target;
    el.classList.add("is-visible");
    revealObserver.unobserve(el);
    const counter = el.querySelector("[data-count]");
    if (counter) setTimeout(() => countUp(counter), 250 + Number(el.style.getPropertyValue("--i") || 0) * 120);
  }
}, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));
// counters start at zero so the count-up never flashes the final number first
document.querySelectorAll("[data-count]").forEach((el) => { el.textContent = fmtCount(el, 0); });

/* ---------- Inventions: pointer-following light on the dark cards ---------- */

if (finePointer) {
  document.querySelectorAll("[data-spotlight]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const b = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${((e.clientX - b.left) / b.width) * 100}%`);
      card.style.setProperty("--my", `${((e.clientY - b.top) / b.height) * 100}%`);
    });
  });
}

/* ---------- Footer ---------- */

document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });

document.querySelector("[data-totop]")?.addEventListener("click", (e) => {
  e.preventDefault();
  scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

/* ---------- Spectrum line: the three work photos compressed into one strip ---------- */

const spectrum = document.querySelector(".spectrum");
const postImgs = [...document.querySelectorAll(".post__img")];
const sampled = new Map();

// average colour of each column of a small downscaled copy of the image
function sampleColumns(img, cols = 32, rows = 24) {
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows); // throws if the image is cross-origin
  const out = [];
  for (let x = 0; x < cols; x++) {
    let r = 0, g = 0, b = 0;
    for (let y = 0; y < rows; y++) {
      const i = (y * cols + x) * 4;
      r += data[i]; g += data[i + 1]; b += data[i + 2];
    }
    r /= rows; g /= rows; b /= rows;
    // lift the mids a little so the line reads against black
    const l = (r + g + b) / 3;
    const k = 1.25;
    out.push(`rgb(${Math.min(255, l + (r - l) * k + 10) | 0}, ${Math.min(255, l + (g - l) * k + 10) | 0}, ${Math.min(255, l + (b - l) * k + 10) | 0})`);
  }
  return out;
}

function buildSpectrum() {
  if (!spectrum || sampled.size === 0) return;
  const order = i18n.dir === "rtl" ? [...postImgs].reverse() : postImgs;
  const stops = order.flatMap((img) => sampled.get(img) || []);
  if (stops.length) spectrum.style.setProperty("--spectrum", `linear-gradient(to right, ${stops.join(", ")})`);
}

postImgs.forEach((img) => {
  const onReady = () => {
    try {
      sampled.set(img, sampleColumns(img));
      buildSpectrum();
    } catch {
      /* file:// or tainted canvas: keep the fallback gradient from the CSS */
    }
  };
  if (img.complete && img.naturalWidth) onReady();
  else img.addEventListener("load", onReady, { once: true });
});

i18n.onChange(buildSpectrum);

/* ---------- Main loop ---------- */

const reveal = { value: 0, start: 0, duration: reduceMotion ? 1200 : 2800 };
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
let last = performance.now();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;

  // targets
  par.x.target = (pointer.x / innerWidth) * 2 - 1;
  par.y.target = (pointer.y / innerHeight) * 2 - 1;

  updateRoleTargets();
  updateMagnets();
  updateCursorTargets();

  // integrate with fixed sub-steps for stability
  const steps = Math.ceil(dt / (1 / 240));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) for (const s of springs) s.step(h);

  // apply
  const px = par.x.x * AMP, py = par.y.x * AMP;
  rolesEl.style.transform = `translate3d(${px * 8}px, ${py * 5}px, 0)`;
  manifesto.style.transform = `translate3d(${px * 5}px, ${py * 3}px, 0)`;

  for (const r of roles) {
    r.el.style.transform = `translate3d(${r.x.x.toFixed(2)}px, ${r.y.x.toFixed(2)}px, 0)`;
    r.el.style.opacity = r.o.x.toFixed(3);
    r.el.style.setProperty("--dash", Math.max(0, r.d.x).toFixed(3));
  }

  for (const m of magnets) {
    m.el.style.transform = `translate3d(${m.x.x.toFixed(2)}px, ${m.y.x.toFixed(2)}px, 0)`;
    if (m.inner) m.inner.style.transform = `translate3d(${(m.x.x * 0.35).toFixed(2)}px, ${(m.y.x * 0.35).toFixed(2)}px, 0)`;
  }

  if (cursor.dx) {
    const s = cursor.scale.x;
    cursor.dot.style.transform = `translate3d(${cursor.dx.x}px, ${cursor.dy.x}px, 0)`;
    cursor.ring.style.transform = `translate3d(${cursor.rx.x}px, ${cursor.ry.x}px, 0) scale(${s})`;
    cursor.el.style.opacity = Math.max(0, Math.min(1, cursor.alpha.x)).toFixed(3);
  }

  if (reveal.start) reveal.value = expoOut((now - reveal.start) / reveal.duration);

  if (glView && heroVisible && !document.hidden) {
    glView.draw({
      reveal: reveal.value,
      time: now / 1000,
    });
  }

  requestAnimationFrame(frame);
}

/* ---------- Intro ---------- */

const imgReady = heroImg.complete && heroImg.naturalWidth
  ? Promise.resolve()
  : new Promise((r) => {
      heroImg.addEventListener("load", r, { once: true });
      heroImg.addEventListener("error", r, { once: true });
    });
const timeout = new Promise((r) => setTimeout(r, 2000));

Promise.race([Promise.all([imgReady, document.fonts.ready]), timeout]).then(() => {
  if (heroImg.naturalWidth) {
    try {
      glView = createGL();
      if (glView) body.classList.add("has-gl");
    } catch (err) {
      console.warn("WebGL hero disabled:", err);
      glView = null;
    }
  }

  requestAnimationFrame(() => {
    body.classList.remove("is-loading");
    setTimeout(() => { showPair(0); scheduleCycle(); }, reduceMotion ? 200 : 1200);
    reveal.start = performance.now();
  });

  requestAnimationFrame(frame);
});

/* ---------- Menu ---------- */

function setMenu(open) {
  if (open) {
    const b = burger.getBoundingClientRect();
    menu.style.setProperty("--ox", `${b.left + b.width / 2}px`);
    menu.style.setProperty("--oy", `${b.top + b.height / 2}px`);
  }
  body.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", i18n.t(open ? "nav.close" : "nav.open"));
  menu.setAttribute("aria-hidden", String(!open));
  menu.inert = !open;
}

burger.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
burger.setAttribute("aria-label", i18n.t("nav.open"));
i18n.onChange(() => setMenu(body.classList.contains("menu-open")));
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
