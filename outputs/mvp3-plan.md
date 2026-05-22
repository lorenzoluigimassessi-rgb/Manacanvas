# MVP 3 — Plan & Backlog: ManaCanvas

## What we're building

4 features focused on advanced search and visual discovery.

---

## Feature Overview

| # | Ticket | Description | Complexity |
|---|--------|-------------|------------|
| 3.1 | Colour picker filter | HSB colour picker (Cosmos-style) to filter by dominant artwork colour — client-side canvas extraction | Medium-High |
| 3.2 | Art style filter | Mood/palette tags (Dark, Vibrant, Painterly, Sketch, etc.) — curated client-side classification | Medium |
| 3.3 | AI chat search | Natural language input → describe what you want to see → semantic search results | High |

---

## Ticket 3.1 — Colour Picker Filter (Client-side)

**Approach: Option A — client-side dominant colour extraction**

- Add a colour picker button to the filter row
- Dropdown opens a full HSB picker:
  - Hue slider (full spectrum, bottom)
  - Saturation/brightness canvas (above)
  - Selected hex value displayed
  - "+" button to add a second colour (multi-colour search)
  - Search/Apply button
- On apply: sample each loaded `art_crop` image via HTML Canvas → extract dominant colour → compare to selected colour using HSL proximity (delta-E or simple Euclidean distance in HSL space)
- Cards that don't match are hidden, matching cards stay visible
- Works on currently loaded cards only (client-side limitation — full catalogue search deferred to MVP 4 with backend)
- Clear chip removes colour filter and restores full grid

**Technical notes:**
- Canvas `getImageData()` on a downsampled version of each image (e.g. 50x50px) for performance
- Cluster pixels into dominant colours using a simple median-cut or k-means approach
- CORS: Scryfall `art_crop` images are served with CORS headers — canvas sampling should work
- Tolerance slider or fixed tolerance (e.g. ±30° hue, ±20% saturation) to widen/narrow matches

**Files touched:** `filters.js`, `grid.js`, `api.js` (no changes), `style.css`

---

## Ticket 3.2 — Art Style Filter

**Curated client-side tag classification**

- Add "Art Style" button to filter row
- Dropdown shows style tags: Dark, Vibrant, Painterly, Sketch, Ethereal, Dramatic, Minimalist
- Tags are mapped to Scryfall query combinations (e.g. Dark → dark colour palette cards, specific sets known for that style)
- Alternative: use dominant colour extraction from 3.1 to infer style (dark = low brightness, vibrant = high saturation)
- Single-select for MVP 3

**Files touched:** `filters.js`, `grid.js`, `style.css`

---

## Ticket 3.3 — AI Chat Search

**Natural language → image search**

- Add a chat/prompt input (expandable from search bar or separate panel)
- User types: "misty forest with a lone figure" or "dramatic red dragon in flight"
- Input is sent to an AI service to extract visual descriptors → mapped to Scryfall query params + colour filter
- MVP 3 scope: use client-side keyword extraction + existing Scryfall full-text search as a first pass
- Full semantic image search (embeddings + vector DB) deferred to MVP 4 with AWS backend

**Files touched:** `filters.js`, `grid.js`, new `chat.js`

---

## Deferred to MVP 4 (Backend upgrade)

- Full catalogue colour search (Amazon Rekognition or custom Lambda)
- True semantic image search (embeddings + vector search)
- Colour search across unloaded cards

---

## MVP 4 — UX & Visual Refresh (Parked)

- Full flow audit (welcome → browse → detail → filter → back)
- Visual polish pass: spacing, animation, typography hierarchy
- Accessibility review (keyboard nav, contrast, focus states)
- Performance audit (image loading, API call batching)
- Best done after MVP 3 so the full feature set is stable
