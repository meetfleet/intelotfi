const body = document.body;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
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
setIndex(document.querySelectorAll(".roles li"));
setIndex(document.querySelectorAll(".manifesto .line > span"));
setIndex(document.querySelectorAll(".menu a"));

/* ---------- Elements ---------- */

const hero = document.querySelector(".hero");
const heroImg = hero.querySelector(".hero__bg img");
const heroBg = hero.querySelector(".hero__bg");
const canvas = hero.querySelector(".hero__gl");
const rolesEl = document.querySelector(".roles");
const manifesto = document.querySelector(".manifesto");
const burger = document.querySelector(".burger");
const burgerLines = burger.querySelector(".burger__lines");
const logo = document.querySelector(".logo");
const menu = document.getElementById("menu");

if (isMobile() && heroImg.dataset.mobileSrc) heroImg.src = heroImg.dataset.mobileSrc;

/* ---------- Pointer ---------- */

const pointer = { x: innerWidth / 2, y: innerHeight / 2, inHero: false, moved: false };

addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.moved = true;
  const r = hero.getBoundingClientRect();
  pointer.inHero = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
}, { passive: true });

document.documentElement.addEventListener("pointerleave", () => { pointer.inHero = false; });

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
uniform vec2 uMouse;    // spring-smoothed pointer, uv space
uniform vec2 uVel;      // pointer spring velocity, uv/s
uniform vec2 uShift;    // parallax, -1..1
uniform float uHover;
uniform float uReveal;
uniform float uTime;
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
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);

  // intro dolly + parallax
  float zoom = mix(1.16, 1.035, uReveal);
  vec2 uv = (vUv - 0.5) / zoom + 0.5 - uShift * vec2(0.010, -0.008);

  // liquid drag around the pointer, driven by spring velocity
  vec2 d = (vUv - uMouse) * aspect;
  float dist = length(d);
  float fall = smoothstep(0.42, 0.0, dist) * uHover;
  vec2 vel = uVel;
  float speed = length(vel);
  if (speed > 2.5) vel *= 2.5 / speed;
  uv -= vel * fall * 0.022;

  // gentle lens swell under the pointer
  uv -= (d / aspect) * fall * fall * 0.035;

  vec2 tuv = cover(uv);
  float ca = min(speed, 2.5) * fall * 0.0035 + 0.0004;
  vec2 dir = speed > 0.001 ? vel / speed : vec2(1.0, 0.0);
  vec3 col;
  col.r = texture2D(uTex, tuv + dir * ca).r;
  col.g = texture2D(uTex, tuv).g;
  col.b = texture2D(uTex, tuv - dir * ca).b;

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
  for (const name of ["uTex", "uRes", "uImg", "uFocus", "uMouse", "uVel", "uShift", "uHover", "uReveal", "uTime"]) {
    u[name] = gl.getUniformLocation(prog, name);
  }
  gl.uniform1i(u.uTex, 0);
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
      gl.uniform2f(u.uMouse, s.mx, s.my);
      gl.uniform2f(u.uVel, s.vx, s.vy);
      gl.uniform2f(u.uShift, s.px, s.py);
      gl.uniform1f(u.uHover, s.hover);
      gl.uniform1f(u.uReveal, s.reveal);
      gl.uniform1f(u.uTime, s.time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

// pointer in hero-uv space, deliberately loose so it trails and settles
const gm = { x: spring(0.5, 55, 13), y: spring(0.5, 55, 13), hover: spring(0, 40, 13) };
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
      r.x.target = -18 + (pointer.x - cx) * 0.06;
      r.y.target = Math.max(-8, Math.min(8, (pointer.y - cy) * 0.35));
    } else {
      r.x.target = 0;
      r.y.target = 0;
    }
  });
}

/* ---------- Magnetic logo + burger ---------- */

const magnets = [
  { el: burger, inner: burgerLines, radius: 110, pull: 0.4 },
  { el: logo, inner: null, radius: 120, pull: 0.22 },
].map((m) => ({ ...m, x: spring(0, 150, 13), y: spring(0, 150, 13) }));

function updateMagnets() {
  for (const m of magnets) {
    const b = m.el.getBoundingClientRect();
    const cx = b.left + b.width / 2 - m.x.x;
    const cy = b.top + b.height / 2 - m.y.y;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const near = Math.hypot(dx, dy) < m.radius;
    m.x.target = near ? dx * m.pull : 0;
    m.y.target = near ? dy * m.pull : 0;
  }
}

/* ---------- Spring cursor ---------- */

const cursor = { el: document.querySelector(".cursor") };
if (finePointer && !reduceMotion) {
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

/* ---------- Main loop ---------- */

const reveal = { value: 0, start: 0, duration: 2800 };
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
let last = performance.now();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;

  // targets
  par.x.target = (pointer.x / innerWidth) * 2 - 1;
  par.y.target = (pointer.y / innerHeight) * 2 - 1;

  const hr = hero.getBoundingClientRect();
  gm.x.target = (pointer.x - hr.left) / hr.width;
  gm.y.target = 1 - (pointer.y - hr.top) / hr.height;
  gm.hover.target = pointer.inHero ? 1 : 0;

  updateRoleTargets();
  updateMagnets();
  updateCursorTargets();

  // integrate with fixed sub-steps for stability
  const steps = Math.ceil(dt / (1 / 240));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) for (const s of springs) s.step(h);

  // apply
  rolesEl.style.transform = `translate3d(${par.x.x * 8}px, ${par.y.x * 5}px, 0)`;
  manifesto.style.transform = `translate3d(${par.x.x * 5}px, ${par.y.x * 3}px, 0)`;
  if (!glView) heroBg.style.transform = `translate3d(${par.x.x * -12}px, ${par.y.x * -8}px, 0)`;

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
      mx: gm.x.x, my: gm.y.x,
      vx: gm.x.v, vy: gm.y.v,
      px: par.x.x, py: par.y.x,
      hover: Math.max(0, gm.hover.x),
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
const timeout = new Promise((r) => setTimeout(r, 3000));

Promise.race([Promise.all([imgReady, document.fonts.ready]), timeout]).then(() => {
  if (!reduceMotion && heroImg.naturalWidth) {
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
    reveal.start = performance.now();
    if (reduceMotion) reveal.value = 1;
  });

  if (!reduceMotion) requestAnimationFrame(frame);
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
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.setAttribute("aria-hidden", String(!open));
  menu.inert = !open;
}

burger.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
