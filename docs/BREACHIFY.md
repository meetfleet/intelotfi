# Breachify case study

Recovered from Claude’s saved SPEC, chapter briefs and console brief on 14 October 2026. The existing screenshots, covers, UI kit and chapter shell are retained.

## Pages

- `/breachify/`: project overview, chapter cards, interactive console and design scope.
- `/blog/outside-in.html`: domain investigations and device evidence; three demos, including explainable risk assessment.
- `/blog/beyond-the-password.html`: sessions, Android identifiers and HTTP logs; four demos, including the evidence pipeline.
- `/blog/machinery.html`: companies, exports, administration and file access; four demos.

The homepage links to the case study. Its Breachify description and link labels are updated in English, French and Arabic. The case study itself is English, consistent with the chapter brief and existing long-form chapters.

## Code

`breachify/ui.*` contains the existing product UI kit. `records.js` supplies shared fictional device data and the evidence viewer. `console.*` implements the project-page miniature. `demos.*` implements nine product demonstrations; `ai.*` adds the risk assessment and evidence pipeline demonstrations. `page.css` styles the project overview; `blog/bf.*` supplies annotations, screen flows, the dashboard scroller and demo mounting.

There is no production build step or runtime dependency. All demonstrations run locally without fetching data or storing it. Searches accept reserved `.example` / `.test` domains and three explicitly fictional Android packages. Exports contain fictional sample records; notifications and file keys are simulations.

The case study distinguishes design intent from implemented product capabilities. Session lifetime labels say “unexpired”, because a future cookie expiry does not prove server acceptance. The design’s file “passkeys” are download-access keys, not passwordless login credentials.

`ai.*` adds the proposed intelligence architecture: a transparent priority model, uncertainty intervals, a hypothesised attack path, an evidence-cited analyst brief and an inspectable sample data pipeline. The assessment is deterministic and does not call an AI model or claim trained-model performance.

## Verification

Run `npm ci`, then `npm test`. Tests use Playwright and start/stop their own local server. Install the browser with `npx playwright install chromium`, or set `BROWSER_EXECUTABLE` to an installed Chromium-based browser. On this Mac the test automatically uses Brave if installed.

Coverage includes sample-search boundaries, all console tabs, nested evidence, resolution and Undo, pagination persistence, CSV contents, all eleven demos, timer cancellation, one-time reveal masking, clipboard actions, keyboard navigation, reduced motion, internal links, resource failures, and viewport widths of 320, 390, 768 and 1440 pixels. Screenshots are written to ignored `test-results/`.

For manual preview: `python3 -m http.server 8765 --bind 127.0.0.1`, then open `http://127.0.0.1:8765/breachify/`.

The site is still deployed as static files from the repository root. Netlify publishes the repository root from `main`; push once after verification, following the established project workflow.
