# Flipkart AI Discovery — senior rewrite

This is the **senior rewrite** of the Flipkart AI product discovery case study, written to the
same bar as `../adobe-firefly-senior/`: explicit ownership boundaries, decisions framed with
alternatives and accepted costs, AI product rigor (how intent is modelled, where it fails, how it
was evaluated), and honest impact framing.

The original case study is untouched and still lives at **`../flipkart-ai-discovery/`**
(with its stylesheet at `../flipkart-ai-discovery.css`). Nothing in this folder modifies it.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The full case study — self-contained markup plus a small inline scroll-reveal script |
| `css/fk-senior.css` | Self-contained stylesheet. Flipkart theme tokens (gradient + dotted background, clay tiles, blue `#2874f0`, yellow `#f4c327`, amber `#f59e0b`) are duplicated here rather than imported, so the old case study's CSS can change independently |

## Assets

All imagery is reused from the shared `../../assets/` folder — no new photography or mockups:

- `flip-home.webp` — hero
- `research-insights.webp` — research section
- `compare-before-1.webp` / `compare-after-1.webp` — before / after
- `Discovery.gif` — solution section icon
- `flipkart-ai-discovery-senior-thumbnail.webp` — homepage card (1600×900, cropped from `flip-home.webp`)

## A note on the numbers

Every figure on the page is labelled as either a **research observation** (query analysis and
observed shopping sessions) or a **concept validation** outcome (moderated qualitative sessions).
There are no production A/B claims — no shipped conversion, click-through or return-rate movement —
because instrumentation and experiment design were not owned by this engagement. This is deliberate
and is stated on the page itself so it holds up under interview questioning.

## Linked from

- `/index.html` — featured project card `#project-flipkart-ai-discovery`
- `/know-me.html` — Flipkart case study link
