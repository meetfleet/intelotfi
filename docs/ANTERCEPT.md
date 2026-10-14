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
  blog shell + bf.* annotation machinery, violet accent):
  - `blog/the-lure.html` — Chapter I · the phishing craft: templates, the AI
    template studio, the campaign outcome model, awareness framing.
  - `blog/the-catch.html` — Chapter II · what a click yields: cookies,
    credentials, sessions, and the evidence design (shown as design).
  - `blog/the-map.html` — Chapter III · geolocation, IPs, phone extraction and
    the infrastructure (servers, domains) that runs a campaign.

## Code (antercept/)

- `page.css` — project overview styling (dark/violet).
- `ui.css` / `ui.js` — the product UI kit miniature (sidebar, cards, tables).
- `records.js` — fictional sample data: targets, campaigns, templates, events.
- `console.css` / `console.js` — the interactive operator console miniature.
- `labs.css` / `labs.js` — the two AI labs: phishing-template studio (explains
  why a lure works) and the campaign outcome predictor (transparent model).

No build step, no runtime dependency, no network calls. Deterministic, local.

## Home + i18n

`index.html` antercept row changes from "coming soon / visit site" to a real
"Read the case study" link to `/antercept/`, in EN/FR/AR. Cover image unchanged
(the Final-set red mark tile) unless replaced.

## Verification

Static only (per project rule: no local server, user checks live site). Run
`node --check` on each JS file; validate HTML by inspection; confirm no real
operational code exists. Commit per edit, push once at the end.
