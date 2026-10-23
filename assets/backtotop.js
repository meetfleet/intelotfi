/* Shared "back to top" control — one button, bottom-right, on every page.
   Self-contained: injects its own markup + styles so it works regardless of
   which page stylesheet is loaded. Respects reduced-motion and RTL. */
(function () {
  "use strict";
  if (document.getElementById("to-top")) return;

  var css = [
    "#to-top{",
    "position:fixed;z-index:120;inset-block-end:clamp(18px,3vw,32px);inset-inline-end:clamp(18px,3vw,32px);",
    "width:46px;height:46px;display:grid;place-items:center;border:0;border-radius:50%;cursor:pointer;",
    "color:#fff;background:#1d2142;box-shadow:0 6px 24px rgba(0,0,0,.28);",
    "opacity:0;visibility:hidden;transform:translateY(10px);",
    "transition:opacity .4s ease,transform .4s cubic-bezier(.16,1,.3,1),visibility .4s,background .2s;",
    "-webkit-tap-highlight-color:transparent;}",
    "#to-top.is-on{opacity:1;visibility:visible;transform:none;}",
    "#to-top:hover{background:#2a2f5c;}",
    "#to-top:focus-visible{outline:2px solid #fff;outline-offset:3px;}",
    "#to-top svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}",
    "@media (prefers-reduced-motion:reduce){#to-top{transition:opacity .2s;transform:none;}}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.id = "to-top";
  btn.type = "button";
  btn.setAttribute("aria-label", "Back to top");
  btn.title = "Back to top";
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  (document.body || document.documentElement).appendChild(btn);

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    var h = document.querySelector("a[href],button,[tabindex]");
    if (h && h.focus) { try { h.focus({ preventScroll: true }); } catch (e) {} }
  });

  var ticking = false;
  function update() {
    ticking = false;
    btn.classList.toggle("is-on", window.pageYOffset > 400);
  }
  addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
