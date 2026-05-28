# Step 8 — MVP Build (Incremental with Review Gates): ManaCanvas

## Build Phases Executed

### Phase 1 — Scaffold & Data ✅
- Project structure: `index.html`, `css/style.css`, `js/` modules
- Scryfall API module (`api.js`): search, pagination, catalogs
- Dark Gallery base CSS: design tokens, typography (Cinzel + Josefin Sans), colors (#0c0c0f bg)
- HTML shell with sticky two-row header

**Review gate passed:** Dark styled shell visible.

---

### Phase 2 — Art Grid Feed ✅
- Grid rendering from Scryfall live API (`art_crop` images)
- Shimmer loading placeholders (12 items)
- Infinite scroll via Intersection Observer
- Hover overlay with card name + artist (gradient fade)
- Scroll-to-top button
- Lazy loading images

**Review gate passed:** Grid loads art, infinite scroll works, hover overlays visible.

---

### Phase 3 — Filters ✅
- Artist filter: searchable autocomplete dropdown (from `/catalog/artist-names`)
- Creature type filter: scrollable list (from `/catalog/creature-types`)
- Set filter: searchable dropdown (from `/sets` endpoint)
- Year range filter: dual slider (1993–current year) with Apply button
- Sort toggle: Oldest First (default) / Newest First
- All filters combinable simultaneously
- Active filter chips with ✕ clear
- Search bar with contextual suggestions (Artist/Creature/Set/Card tags)
- View dropdown (Small/Medium/Large grid)

**Additional features added during review:**
- Set filter (not in original MVP scope)
- Year range slider
- Sort control
- Grid size control (S/M/L via dropdown)
- Search with autocomplete suggestions + contextual tags

**Review gate passed:** All filters working together, search suggestions functional.

---

### Phase 4 — Lightbox ✅
- Click card → full-screen lightbox (black 95% backdrop)
- Frame toggle: "Art Only" (art_crop) ↔ "With Frame" (normal) with crossfade
- Scroll wheel zoom (desktop): bounded 1x–5x
- Pinch zoom (mobile): two-finger gesture
- Drag to pan when zoomed
- Double-click/tap: toggle between fit-to-view and 2.5x
- Close: ✕ button, backdrop click, Escape key
- Metadata: card name, artist, set, year
- Zoom hint (fades after 3s)
- Disabled state for cards without art_crop
- Body scroll locked when lightbox open

**Review gate passed:** Lightbox, toggle, zoom all functional.

---

### Phase 5 — Polish & Welcome Page ✅
- Responsive breakpoints (desktop/tablet/mobile)
- Empty state handling ("No artwork found")
- Image error fallback (card name text placeholder)
- Welcome page (Option 1 — Hero + CTA):
  - Random MTG art background (changes each visit)
  - Radial gradient overlay for readability
  - Cinematic title (5.5rem Cinzel)
  - Uppercase subtitle (near-white)
  - Solid white CTA button
- Logo click → returns to welcome page
- Two-row header layout:
  - Row 1: Logo + Search bar
  - Row 2: Filters (left) + Sort & View (right)

**Review gate passed:** Full MVP complete.

---

## Final Feature Set

| Feature | Status |
|---------|--------|
| Welcome page with random art bg | ✅ |
| Art feed grid (Scryfall live API) | ✅ |
| Infinite scroll | ✅ |
| Hover metadata overlay | ✅ |
| Filter: Artist (autocomplete) | ✅ |
| Filter: Creature type | ✅ |
| Filter: Set (searchable) | ✅ |
| Filter: Year range (slider) | ✅ |
| Sort: Oldest/Newest | ✅ |
| Search with contextual suggestions | ✅ |
| Grid size control (S/M/L) | ✅ |
| Combined filters + chips | ✅ |
| Lightbox detail view | ✅ |
| Frame toggle (art-only ↔ full card) | ✅ |
| Zoom (scroll + pinch) + pan | ✅ |
| Responsive (desktop/tablet/mobile) | ✅ |
| Edge cases (empty, error, fallback) | ✅ |
| Dark Gallery visual style | ✅ |
| Cinzel + Josefin Sans typography | ✅ |
| Two-row header (search/filters separated) | ✅ |

---

## Design Decisions Made During Build

| Decision | Rationale |
|----------|-----------|
| Visual style: Dark Gallery | Art pops on dark bg, museum feel |
| Fonts: Cinzel + Josefin Sans | Fantasy gravitas + modern clarity |
| Background: #0c0c0f (near-black) | Rich without being pure black |
| Default sort: Oldest First | Start with MTG's origins, chronological discovery |
| Welcome page: Option 1 (Hero + CTA) | Simple, cinematic, sets the mood |
| Two-row header | Separates primary action (search) from secondary (filters) |
| Sort + View on right | "What data" (left) vs "how to display" (right) |
| Search suggestions with tags | Reduces friction, guides users to right filter type |
