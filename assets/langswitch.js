/* Shared glassy language switcher — one widget, every page.
   Relies on i18n.js (loaded before this): it owns the actual language state via
   its delegated [data-set-lang] click handler, localStorage, <html lang/dir>,
   and live re-translation. This file only draws the glass flag control and
   reflects the current language. No page refresh. */
(function () {
  "use strict";
  if (document.getElementById("langswitch")) return;

  /* Compact flag marks, drawn inline so there are no extra requests. */
  var FLAGS = {
    en:
      '<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="ls-uk"><rect width="60" height="30"/></clipPath>' +
      '<g clip-path="url(#ls-uk)"><rect width="60" height="30" fill="#012169"/>' +
      '<path d="M0 0l60 30M60 0L0 30" stroke="#fff" stroke-width="6"/>' +
      '<path d="M0 0l60 30M60 0L0 30" stroke="#C8102E" stroke-width="4" clip-path="url(#ls-uk)"/>' +
      '<path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/>' +
      '<path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>',
    fr:
      '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" x="0" fill="#0055A4"/>' +
      '<rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#EF4135"/></svg>',
    ar:
      '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#006C35"/>' +
      '<rect x="10" y="17" width="40" height="3" rx="1.5" fill="#fff"/>' +
      '<rect x="14" y="23" width="26" height="2.4" rx="1.2" fill="#fff"/>' +
      '<rect x="42" y="22" width="2.4" height="6" rx="1.2" fill="#fff"/></svg>'
  };
  var ORDER = ["en", "fr", "ar"];
  var NAMES = { en: "English", fr: "Français", ar: "العربية" };
  var LABEL = { en: "EN", fr: "FR", ar: "ع" };

  var css = [
    "#langswitch{position:fixed;z-index:130;inset-block-start:clamp(14px,2.2vw,22px);inset-inline-end:clamp(16px,3vw,30px);",
    "display:flex;gap:4px;padding:5px;border-radius:999px;",
    "background:rgba(20,20,28,.42);border:1px solid rgba(255,255,255,.18);",
    "box-shadow:0 8px 32px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.22);",
    "-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%);",
    "transition:background .3s,border-color .3s;}",
    "#langswitch:hover{background:rgba(20,20,28,.55);border-color:rgba(255,255,255,.28);}",
    "#langswitch button{position:relative;display:inline-flex;align-items:center;gap:6px;",
    "height:30px;padding:0 10px 0 7px;border:0;border-radius:999px;cursor:pointer;",
    "background:transparent;color:rgba(255,255,255,.72);font:inherit;font-size:12px;font-weight:600;letter-spacing:.02em;",
    "-webkit-tap-highlight-color:transparent;transition:color .25s,background .25s,transform .25s cubic-bezier(.16,1,.3,1);}",
    "#langswitch button .ls-flag{width:19px;height:13px;border-radius:3px;overflow:hidden;flex:none;",
    "box-shadow:0 0 0 1px rgba(255,255,255,.28),0 1px 3px rgba(0,0,0,.4);display:block;}",
    "#langswitch button .ls-flag svg{width:100%;height:100%;display:block;object-fit:cover;}",
    "#langswitch button .ls-lbl{opacity:.0;max-width:0;overflow:hidden;transition:opacity .25s,max-width .25s;}",
    "#langswitch button:hover{color:#fff;background:rgba(255,255,255,.08);transform:translateY(-1px);}",
    "#langswitch button[aria-pressed=\"true\"]{color:#fff;background:rgba(255,255,255,.16);}",
    "#langswitch button[aria-pressed=\"true\"] .ls-lbl{opacity:1;max-width:3em;}",
    "#langswitch button[aria-pressed=\"true\"] .ls-flag{box-shadow:0 0 0 1px rgba(255,255,255,.6),0 0 10px rgba(255,255,255,.25),0 1px 3px rgba(0,0,0,.4);}",
    "#langswitch button:focus-visible{outline:2px solid #fff;outline-offset:2px;}",
    "@media (max-width:560px){#langswitch{inset-block-start:auto;inset-block-end:clamp(18px,4vw,26px);inset-inline-start:clamp(16px,4vw,24px);inset-inline-end:auto;}}",
    "@media (prefers-reduced-motion:reduce){#langswitch button{transition:color .2s,background .2s;}}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var cur = (window.i18n && window.i18n.lang) ||
    (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  if (ORDER.indexOf(cur) === -1) cur = "en";

  var box = document.createElement("div");
  box.id = "langswitch";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Choose language");
  ORDER.forEach(function (code) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-set-lang", code);
    b.setAttribute("lang", code);
    b.setAttribute("aria-label", NAMES[code]);
    b.setAttribute("aria-pressed", String(code === cur));
    b.innerHTML =
      '<span class="ls-flag">' + FLAGS[code] + "</span>" +
      '<span class="ls-lbl">' + LABEL[code] + "</span>";
    box.appendChild(b);
  });
  (document.body || document.documentElement).appendChild(box);

  /* i18n.js handles the click (delegated) + sets aria-pressed on [data-set-lang].
     If i18n.js is somehow absent, fall back to a reload with ?lang=. */
  box.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-set-lang]");
    if (!btn) return;
    if (!window.i18n || typeof window.i18n.set !== "function") {
      var code = btn.getAttribute("data-set-lang");
      try { localStorage.setItem("intelotfi:lang", code); } catch (x) {}
      var u = new URL(location.href);
      u.searchParams.set("lang", code);
      location.href = u.toString();
    }
  });
})();
