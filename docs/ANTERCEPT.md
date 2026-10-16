# Antercept case study

Built 14 October 2026, after Breachify. The most ambitious of the three project
pages. Framed as a **product page**, not a design case study: Antercept is an
**AI-driven platform that builds, manages and runs** security-awareness /
red-team operations. The page speaks as the product — what its AI does, how it
composes templates, predicts outcomes, and runs campaigns.

Interactive demos on the page run on **fictional sample data, locally in the
browser**, with a short "sample data · runs locally" label (ordinary live-demo
honesty, not a portfolio disclaimer). Nothing operational is built: no real
interception, no sendable phishing, no real devices/people/brands.

## What Antercept is (from the Figma design)

Figma file `nYMfm5gRlztPrQPNS8wasW`. Two pages: an auth flow (`Log In`) and a
`Components` library that reveals the real product navigation. Antercept is a
red-team / security-awareness operations console. Its sidebar:

- **Dashboard**
- **PHISHING** — Phisher · Cookies · Credentials
- **GEOLOCATION** — Locater · IPs / Locations
- **PHONE EXTRACTION** — Extracter · Data / Backups
- **INFRASTRUCTURE** — Templates · Servers · Domain Names
- **SETTINGS** — User Management · Settings

Brand: interlocked-circles mark + lowercase `antercept` wordmark, white on
near-black (#070708-ish), accent violet (#7c4dff family). Create Case / Create
Operation primary buttons. Target-app icon set (WhatsApp, Teams, OneDrive,
Chrome, Firefox, Edge, Office apps, Spotify…) for template selection. Proxy
on/off, Mobile/Computer target tiles, SMS-provider API keys in settings.

## The ethics line (non-negotiable)

Framed around **authorized security-awareness testing** (legitimate phishing
simulation / red-team work). The page markets and demonstrates the product's AI
capabilities. We do **not** build anything operational:

- No real, sendable phishing output. The template studio composes awareness
  lures from **fictional brands** on reserved `.example` domains and explains the
  psychology, clearly labelled simulation.
- No working keylogger, cookie harvest, credential capture, phone extraction,
  geolocation or device control. These are **shown and described as design**,
  never made to function.
- No real people, real brands' credentials, or real targets. All records are
  made-up sample data generated locally in the browser.

Every demo carries a visible "fictional · runs locally · design demonstration"
note, as Breachify's do.

## Pages

- `/antercept/`: project overview, chapter cards, interactive console + AI labs,
  design scope. Owns its own CSS/JS (no dependency on the Breachify kit).
- Long-form chapters live in `blog/` with `data-series="antercept"` (reuses the
  blog shell + bf.* machinery, violet accent, registered in blog.js `SERIES` so
  the chapter switcher, dock and continue block auto-build). Each is a massive
  deep-dive (8–9 sections) with inline-SVG figures styled by
  `blog/antercept-chapters.css` (the `.acfig` classes):
  - `blog/the-lure.html` — Chapter I · the craft of the lure: six persuasion
    levers, the AI composition pipeline, clause assembly, difficulty, per-channel
    composition, and a transparent logistic click/report model.
  - `blog/the-catch.html` — Chapter II · the science of exposure: cookie anatomy,
    credential-as-evidence, the exposure timeline, the risk-score model, and
    correlation to one identity.
  - `blog/the-map.html` — Chapter III · running the operation: geolocation as a
    training heatmap, IP intelligence with stated limits, phone-data views (as
    design), the managed delivery chain, proxies, and the thirteen-module console.

## Screenshots and per-chapter simulators

Real frames were exported from Figma (`download_assets`, 2x PNG) and saved under
`assets/antercept/`: `screen-login.webp` (real login), `screen-template.webp`
(real sidebar + real template-builder panel composited), `screen-targets.webp`
(real sidebar + real Mobile/Desktop target tiles), `screen-credentials.webp`
(real sidebar + an evidence table drawn in the design system). The three chapter
covers are rebuilt from these real screens.

Each chapter embeds one real screenshot as an annotated, zoomable `.shot` figure
(dots + tooltips, driven by the ported spot logic in `blog/antercept-chapters.js`;
the zoom lightbox is blog.js's own), and one live simulator via `data-sim`:
- Ch I `the-lure.html` — screenshot: template builder; simulator: **lure composer**
  (toggle levers, the annotated email re-composes live).
- Ch II `the-catch.html` — screenshot: credentials evidence view; simulator:
  **exposure timeline** (step a target, watch the risk score climb then reset).
- Ch III `the-map.html` — screenshot: target selection; simulator: **campaign map**
  (run it, city bubbles grow by exposure, the hottest turns red).

`blog/antercept-chapters.js` (spots + the three simulators) and
`blog/antercept-chapters.css` (figures + `.acsim` styles) carry all of this; no
breachify dependency.

## Code (antercept/)

- `page.css` — project overview styling (dark/violet).
- `ui.css` / `ui.js` — the product UI kit miniature (sidebar, cards, tables).
- `records.js` — fictional sample data: targets, campaigns, templates, events.
- `console.css` / `console.js` — the one interactive simulator: the operator
  console miniature (campaign selector, live target table, run simulation,
  target drawer with evidence + risk, resolve). The two AI labs were removed; the
  template-studio and outcome-model ideas now live as prose + inline-SVG figures
  in Chapter I instead of a separate widget.

No build step, no runtime dependency, no network calls. Deterministic, local.

## Home + i18n

`index.html` antercept row changes from "coming soon / visit site" to a real
"Read the case study" link to `/antercept/`, in EN/FR/AR. Cover image unchanged
(the Final-set red mark tile) unless replaced.

## Verification

Static only (per project rule: no local server, user checks live site). Run
`node --check` on each JS file; validate HTML by inspection; confirm no real
operational code exists. Commit per edit, push once at the end.

## Target lab update · 15 October 2026

The overview now leads with `phone.js` / `phone.css`: a connected target journey
with an Android-inspired phone, SMS country picker, scenario preview and session
inspector. Morocco, Israel, United States, Germany, Ethiopia, UAE, Qatar and
France use their calling prefixes with masked, non-dialable sample numbers.
Country and scenario changes reset the exercise; reset cancels pending delivery.

Reserve → deliver → read → visit → sample interaction or report → resolve.
The inspector has Activity, Device and AI insight tabs. Location and documentation
IP addresses are preset fixtures, not geolocation. Infection status stays unknown
without endpoint evidence. The AI tab uses deterministic illustrative copy, not a
trained model. All actions stay in browser memory; no SMS or device APIs are used.

The prior cohort simulator remains under an expandable section. Regression checks
run with `npm run test:antercept`, including both phone paths, cancellation,
country filtering, keyboard tabs, responsive widths and absence of external calls.

## Guided overview · 16 October 2026

The page now shares intelotfi’s header/footer branding and editorial layout with
Breachify. `guide.css` adapts the phone into three progressive steps: choose a
message, try it, understand the result. Country selection remains available,
including Morocco and Israel; showing the message on the phone is one action.

The former reservation step, inspector tabs and secondary cohort console are no
longer presented on the overview. The result explains actions taken and a learning
point, with the event history available on demand. Blogs remain unchanged.
