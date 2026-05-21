# Step 3 — UX Strategy Decision (Scope Document): ManaCanvas

## 1. Is UX Work Needed?

**Yes** — This is a visual-first discovery product. The entire value proposition depends on how art is presented, browsed, and experienced. The UX *is* the product.

## 2. Complexity Level

**Low-Medium**

- Small screen count (feed + detail view)
- But the visual interactions matter a lot (grid layout, image transitions, zoom, frame toggle)
- Filter UX needs to feel fast and non-intrusive
- Image-heavy = performance-sensitive

## 3. UX Approach

**Visual browsing experience** — inspired by image-first platforms (Pinterest, Unsplash, ArtStation):

- **Masonry/grid feed** — art-forward, minimal chrome
- **Filter bar** — lightweight, always accessible, combinable
- **Lightbox detail view** — click art → full view with frame toggle + zoom + metadata
- **Infinite scroll** — paginated via Scryfall API, loads as user scrolls
- **Art-first philosophy** — UI gets out of the way, artwork is the hero

## 4. Recommended Screens / States

| # | Screen | Purpose | States |
|---|--------|---------|--------|
| 1 | **Art Feed** | Browse grid of artwork | Default, filtered, loading more, empty result |
| 2 | **Art Detail / Lightbox** | View single artwork large | With frame, without frame, zoomed |
| 3 | **Filter Panel** | Select artist + creature type | Open, applied, cleared |

**Total: 2 screens + 1 overlay/panel component**

## 5. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Image grid feels slow | High | Lazy loading, placeholder shimmer |
| Scryfall rate limit hit | Medium | Debounce filter inputs (300ms) |
| `art_crop` missing for some cards | Medium | Fallback to `normal` image |
| Artist name filter requires exact match | Medium | Autocomplete dropdown |
| Zoom feels janky on mobile | Medium | Use established pinch-zoom approach |
