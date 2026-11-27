# Breachify product overview

Recovered from Claude’s saved SPEC, chapter briefs and console brief on 14 October 2026. The existing screenshots, covers, UI kit and chapter shell are retained.

## Pages

- `/breach-intelligence/`: project overview, chapter cards, interactive console and design scope.
- `/breach-intelligence/investigation.html`: domain investigations and device evidence; three demos, including explainable risk assessment.
- `/breach-intelligence/session-evidence.html`: sessions, Android identifiers and HTTP logs; four demos, including the evidence pipeline.
- `/breach-intelligence/operations.html`: companies, exports, administration and file access; four demos.

### Original pages (kept, unlinked)

The pre-move pages stay live at `/breachify/` and `/blog/breachify-outside-in.html`, `/blog/breachify-beyond-password.html`, `/blog/breachify-machinery.html` so old links and search results still work. Nothing on the site links to them; they link only among themselves. They load CSS, JS and images from `/breach-intelligence/` and `assets/breach-intelligence/`, so there is one copy of the code. The old chapters keep `data-series="breachify"` for the look and add `data-nav="breachify-blog"`, which `blog.js` uses to point their chapter navigation at the old URLs. The oldest slugs (`/blog/outside-in.html`, `/blog/beyond-the-password.html`, `/blog/machinery.html`) are small HTML redirect pages (canonical + instant refresh, keeping `#anchors`) pointing at the old chapters, because GitHub Pages cannot send server redirects. Content edits to a chapter need making in both copies.

The homepage links to the product overview. Its Breachify description and link labels are updated in English, French and Arabic. The product overview itself is English, consistent with the chapter brief and existing long-form chapters.

## Code

`breach-intelligence/ui.*` contains the existing product UI kit. `records.js` supplies shared fictional device data and the evidence viewer. `console.*` implements the project-page miniature. `demos.*` implements nine product demonstrations; `ai.*` adds the risk assessment and evidence pipeline demonstrations. `page.css` styles the project overview; `blog/bf.*` supplies annotations, screen flows, the dashboard scroller and demo mounting.

There is no production build step or runtime dependency. All demonstrations run locally without fetching data or storing it. Searches accept reserved `.example` / `.test` domains and three explicitly fictional Android packages. Exports contain fictional sample records; notifications and file keys are simulations.

The product overview distinguishes design intent from implemented product capabilities. Session lifetime labels say “unexpired”, because a future cookie expiry does not prove server acceptance. The design’s file “passkeys” are download-access keys, not passwordless login credentials.

`ai.*` adds the proposed intelligence architecture: a transparent priority model, uncertainty intervals, a hypothesised attack path, an evidence-cited analyst brief and an inspectable sample data pipeline. The assessment is deterministic and does not call an AI model or claim trained-model performance.

## Verification

Run `npm ci`, then `npm test`. Tests use Playwright and start/stop their own local server. Install the browser with `npx playwright install chromium`, or set `BROWSER_EXECUTABLE` to an installed Chromium-based browser. On this Mac the test automatically uses Brave if installed.

Coverage includes sample-search boundaries, all console tabs, nested evidence, resolution and Undo, pagination persistence, CSV contents, all eleven demos, timer cancellation, one-time reveal masking, clipboard actions, keyboard navigation, reduced motion, internal links, resource failures, and viewport widths of 320, 390, 768 and 1440 pixels. Screenshots are written to ignored `test-results/`.

For manual preview: `python3 -m http.server 8765 --bind 127.0.0.1`, then open `http://127.0.0.1:8765/breach-intelligence/`.

intelotfi.com is served by GitHub Pages from the repository root on `main` (CNAME, `.nojekyll`); `netlify.toml` redirects and headers are not applied there. Push once after verification, following the established project workflow.
