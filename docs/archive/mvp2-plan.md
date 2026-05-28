# MVP 2 — Plan & Backlog: ManaCanvas

## What we're building

5 features, grouped into 4 implementation phases based on complexity and dependencies.

---

## Phase 1 — New Filters (Card Type + Colours)

These follow the exact same pattern as existing filters — lowest risk, highest value.

**Ticket 2.1 — Card Type filter**
- Add "All Types" button to filter row
- Fetch from `/catalog/card-types` (Scryfall endpoint)
- Single-select dropdown (same pattern as creature type)
- Scryfall query: `t:instant`, `t:sorcery`, `t:enchantment`, etc.
- Update `buildQuery()` in `api.js` to accept `cardType` param
- Update `updateChips()` and `clearCardType()`
- Note: rename existing "All Creatures" → "Creature Type" for clarity while we're here

**Ticket 2.2 — Colour filter**
- Add "All Colours" button to filter row
- No API fetch needed — colours are fixed: W, U, B, R, G + Colorless, Multicolor
- Render as a visual pill grid (mana symbols or coloured dots) instead of a list dropdown
- Single-select for MVP 2 (multi-select is more complex, defer to MVP 3)
- Scryfall query: `c:r`, `c:u`, etc. / `c:m` for multicolor / `c:c` for colorless
- Update `buildQuery()` to accept `colour` param

---

## Phase 2 — Multi-Select Sets

This requires refactoring the existing single-select set filter.

**Ticket 2.3 — Multi-select set filter**
- Change `activeSet` (string) → `activeSets` (array) in `grid.js`
- Dropdown items become checkboxes instead of click-to-close
- Show count badge on button when sets selected: "Sets (3) ▾"
- Scryfall query: `(s:dom OR s:neo OR s:bro)` — wrap in parens with OR
- Update `buildQuery()` to handle array
- Update chips: one chip per selected set with individual ✕, plus "Clear all sets" if >1
- Dropdown stays open until user clicks outside (already works via `stopPropagation`)

---

## Phase 3 — Random Card Button

**Ticket 2.4 — Random card button**
- Scryfall has `/cards/random` endpoint — trivial to call
- Button placement: inside the lightbox only (as requested — accessible once in detail view)
- Position: next to the close button (top-right area) or below the toggle buttons
- On click: fetch `/cards/random?q=has:illustration`, replace lightbox content with new card
- Reuse existing `openLightbox(card)` — just call it with the new card data
- Add a subtle shuffle icon (↺ or 🎲) so it's clear what it does
- Keep zoom/pan state reset on each new card (already happens in `openLightbox`)

---

## Phase 4 — Clickable Metadata Links in Lightbox

**Ticket 2.5 — Clickable bio info as filter triggers**
- In `lightbox.js`, wrap artist name, set name in `<button class="meta-link">` elements
- On artist click: call `selectArtist(card.artist)` → closes lightbox → grid filters by artist
- On set click: call `selectSet(card.set, card.set_name)` → closes lightbox → grid filters by set
- Visual treatment: subtle underline on hover, same text colour (no jarring colour change)
- These functions already exist in `filters.js` — no new logic needed, just wire up

---

## Backlog Summary

| # | Ticket | File(s) touched | Complexity |
|---|--------|-----------------|------------|
| 2.1 | Card Type filter | `api.js`, `filters.js`, `grid.js` | Low |
| 2.2 | Colour filter | `api.js`, `filters.js`, `grid.js`, `style.css` | Low-Med |
| 2.3 | Multi-select sets | `api.js`, `filters.js`, `grid.js` | Medium |
| 2.4 | Random card button | `lightbox.js` | Low |
| 2.5 | Clickable meta links | `lightbox.js`, `filters.js` | Low |

---

## MVP 3 — Parked: Advanced Search

- Art style filter (mood, palette, composition) — needs a tagging strategy, likely client-side classification or a curated mapping
- AI chat to describe what you want → semantic image search — needs an embedding model + vector search backend (this is the big one, requires infrastructure decisions)
- Worth a full UX research step before building

## MVP 4 — Parked: UX & Visual Refresh

- Full flow audit (welcome → browse → detail → filter → back)
- Visual polish pass: spacing, animation, typography hierarchy
- Accessibility review (keyboard nav, contrast, focus states)
- Performance audit (image loading, API call batching)
- Best done after MVP 3 so the full feature set is stable
