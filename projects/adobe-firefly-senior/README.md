# Adobe Firefly — Senior narrative version

Senior-level rewrite of the Adobe Firefly case study, optimized for recruiters and
hiring managers: skimmable in 2–5 minutes, ownership-forward, and organised around
decisions and tradeoffs rather than a process inventory.

The original, longer process-led version remains untouched at `../adobe-firefly/`.

## What's different here
- **Exec summary on the first screen** — problem, what I owned, outcome with three metrics
- **Accountability box** — what I owned *and* what I didn't (model quality, existing Firefly
  features, roadmap, instrumentation)
- **Decisions & tradeoffs is the core section** — five decision cards, each with the decision,
  alternatives considered, why we chose it, and the cost accepted
- **Impact carries a "how to read these" note** — measured outcomes from the engagement,
  presented as directional evidence rather than an A/B claim
- **"What I'd do differently"** replaces the generic learnings section
- Process sections (how might we, design principles, research wall) are folded into the
  problem and decision sections instead of standing alone

## Structure
- `index.html` — case study page
- `css/` — theme styles (`global.css`, `firefly.css`); new senior components are prefixed
  `af-senior-` and appended at the end of `firefly.css`
- `js/firefly.js` — reveal-on-scroll, lazy `data-src` assets, sticky scroll story,
  interaction-gallery WebM playback
- `theme/` — design tokens (reference)
- `assets/` — project images (`.webp`); hero and interaction WebMs come from `../../assets/`

## Constraints kept
- Positioning is a contract product design contribution focused on post-generation editing
  and creative control (May 2025 — Present · Contract). No claim of employment at Adobe and
  no claim of authorship over existing Firefly features.
- Only the seven existing impact numbers are used; no new metrics invented.
- Visual language, containers, type scale and colors are reused from the existing case study.
