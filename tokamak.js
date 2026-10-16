/* ---------- Hero background: digital tokamak (Three.js) ----------
   A camera flies around the inside of a pulsing grid torus while plasma
   trails stream past. The canvas is shown at half opacity (styles.css) so
   the hero text stays readable on top of it. */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const canvas = document.querySelector(".hero__tokamak");
if (canvas) {
  try {
    start(canvas);
  } catch (err) {
    console.warn("Tokamak hero disabled:", err);
  }
}

function start(canvas) {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CFG = {
    cameraSpeed: 0.3,
    gridX: 600,
    gridY: 300,
    // monochrome: one neutral grey, the shading comes from pulse and per-trail brightness
    shellColor: "#8a8a8a",
    pulseSpeed: 4.89,
    gridGap: 0.23,
    gridOpacity: 1.0,
    plasmaColor: "#ffffff",
    bloomStrength: 0.5,
    lineThickness: 0.005,
    trailCount: 80,
    speedMult: 1.0,
    lengthMult: 0.47,
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(90, 1, 0.01, 100);
  const tokamak = new THREE.Group();
  scene.add(tokamak);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), CFG.bloomStrength, 0.6, 0.1);
  composer.addPass(bloom);

  const VERT = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  // 1. grid shell: a torus of square cells, each pulsing on its own phase
  const shell = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uGridSize;
      uniform vec3 uColor;
      uniform float uPulseSpeed;
      uniform float uGap;
      uniform float uOpacity;
      varying vec2 vUv;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec2 gridUV = vUv * uGridSize;
        vec2 cellID = floor(gridUV);
        vec2 cellUV = fract(gridUV);
        float square = step(uGap, cellUV.x) * step(uGap, cellUV.y) *
                       step(cellUV.x, 1.0 - uGap) * step(cellUV.y, 1.0 - uGap);
        float pulse = 0.5 + 0.5 * sin(uTime * uPulseSpeed + random(cellID) * 6.28);
        gl_FragColor = vec4(uColor, square * (0.05 + 0.95 * pulse) * uOpacity);
      }`,
    uniforms: {
      uTime: { value: 0 },
      uGridSize: { value: new THREE.Vector2(CFG.gridX, CFG.gridY) },
      uColor: { value: new THREE.Color(CFG.shellColor) },
      uPulseSpeed: { value: CFG.pulseSpeed },
      uGap: { value: CFG.gridGap },
      uOpacity: { value: CFG.gridOpacity },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  tokamak.add(new THREE.Mesh(new THREE.TorusGeometry(10, 3.0, 60, 200), shell));

  // 2. plasma trails: thin rings at random radii, each with a fading streak
  const TRAIL_FRAG = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uSpeed;
    uniform float uSpeedMult;
    uniform float uLength;
    uniform float uLengthMult;
    uniform float uOffset;
    varying vec2 vUv;

    void main() {
      float progress = fract(vUv.x * 2.0 - uTime * uSpeed * uSpeedMult + uOffset);
      float len = clamp(uLength * uLengthMult, 0.01, 0.99);
      float alpha = pow(smoothstep(1.0 - len, 1.0, progress), 3.0);
      gl_FragColor = vec4(uColor, alpha);
    }`;

  const trails = [];
  for (let i = 0; i < CFG.trailCount; i++) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: TRAIL_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(CFG.plasmaColor).multiplyScalar(0.3 + Math.random() * 0.7) },
        uSpeed: { value: 0.1 + Math.random() * 0.3 },
        uSpeedMult: { value: CFG.speedMult },
        uLength: { value: 0.1 + Math.random() * 0.2 },
        uLengthMult: { value: CFG.lengthMult },
        uOffset: { value: Math.random() * 100 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7.5 + Math.random() * 5, CFG.lineThickness, 6, 120), mat);
    ring.rotation.x = (Math.random() - 0.5) * 0.1;
    ring.position.z = (Math.random() - 0.5) * 0.5;
    tokamak.add(ring);
    trails.push(mat);
  }

  /* ---------- Camera flight + render ---------- */

  const R = 10;
  let time = 0;
  let angle = 0;

  function render() {
    camera.position.set(Math.cos(angle) * R, Math.sin(angle) * R, 0.5);
    camera.lookAt(Math.cos(angle + 0.1) * R, Math.sin(angle + 0.1) * R, 0);
    shell.uniforms.uTime.value = time;
    for (const m of trails) m.uniforms.uTime.value = time;
    composer.render();
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    if (!running) render();
  }

  // only animate while the hero is on screen and the tab is visible
  let running = false;
  let visible = true;
  let last = 0;

  function tick(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    time += dt;
    angle += CFG.cameraSpeed * dt;
    render();
    requestAnimationFrame(tick);
  }

  function sync() {
    const go = visible && !document.hidden && !reduceMotion;
    if (go && !running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    } else if (!go) {
      running = false;
    }
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener("visibilitychange", sync);

  resize();
  render();
  sync();
  // fade in once the first frame is on the canvas
  requestAnimationFrame(() => canvas.classList.add("is-on"));
}
