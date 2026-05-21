# Step 2 — Tech Spec Review (Feasibility Report): ManaCanvas

## Assumed Tech Spec

| Aspect | Detail |
|--------|--------|
| Data source | Scryfall API (free, RESTful, ~80K+ cards with art URLs) |
| Frontend | Web app (HTML/CSS/JS or React) |
| Images | Scryfall provides: `normal` (488px), `large` (672px), `art_crop` (no frame), `png` (full 745px) |
| Frame removal | Scryfall's `art_crop` image type already provides frameless art |
| Filters | Scryfall API supports `artist` and `type` query params natively |
| Zoom | Client-side zoom on high-res image |
| Hosting | Static site or simple SPA — no backend needed for MVP |
| Rate limits | Scryfall: 10 requests/second, bulk data available for download |

## 1. What Is Technically Possible

- ✅ Art feed/grid — Scryfall returns image URIs in multiple sizes
- ✅ Filter by artist — Scryfall search: `a:"Seb McKinnon"`
- ✅ Filter by creature type — Scryfall search: `t:dragon`
- ✅ Frame removal — Scryfall's `art_crop` URL gives just the artwork
- ✅ High-res view — `png` format gives 745×1040px
- ✅ Zoom — CSS/JS zoom on the high-res image
- ✅ No backend needed — Scryfall API is public, no auth required
- ✅ Bulk data option — Scryfall offers daily JSON dumps

## 2. UX Constraints

| Constraint | Impact on UX |
|------------|--------------|
| `art_crop` resolution is ~626×457px max | Zoom will hit a quality ceiling |
| Scryfall rate limit (10 req/s) | Need to debounce search/filter |
| No custom tagging | "Creature type" is card type, not visual creature |
| Artist names must be exact | Autocomplete/suggestions needed |
| Some cards have no `art_crop` | Need fallback to `normal` |
| Image loading performance | Grid needs lazy loading |

## 3. Dependencies

| Dependency | Status | Risk |
|------------|--------|------|
| Scryfall API availability | Public, stable | Low |
| `art_crop` coverage | Available for most modern cards | Low |
| Artist list | Extractable from Scryfall catalog | Low |
| Creature type list | Available via `/catalog/creature-types` | Low |

## 4. Resolved Questions

| Question | Answer |
|----------|--------|
| Bulk vs. live API | Live API (it's free) |
| Feed size | Paginated feed, load as you scroll |
| Combined filters | Yes, artist + creature type simultaneously |
| Card metadata | Show some metadata alongside art (card name, artist, set) |
| Zoom behaviour | Pinch zoom (mobile), scroll/click zoom (desktop) |
