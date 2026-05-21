# Step 5 — UX Brief: ManaCanvas

## 1. Feature Overview

**What:** ManaCanvas is a visual-first MTG artwork discovery platform — a dark, immersive gallery experience for browsing, filtering, and viewing Magic: The Gathering art at high resolution without the card frame.

**Why:** 30+ years of MTG art exists with no dedicated visual browsing platform.

**Visual direction:** Style A — Dark Gallery. Art is the hero. UI disappears. Museum-like immersion.

**MVP scope:**
- Art feed grid (Scryfall API, `art_crop` images)
- Filters: artist + creature type (combinable)
- Lightbox detail view: frame toggle (card vs. art-only), pinch/scroll zoom
- Infinite scroll pagination
- Metadata on hover (card name, artist)

## 2. User Flows

### Flow 1: Browse Art Feed
1. User opens ManaCanvas
2. Grid loads with art_crop images on dark background
3. User scrolls — more art loads (infinite scroll)
4. Hovering a card reveals name + artist overlay

### Flow 2: Filter by Artist
1. User clicks "All Artists" dropdown
2. Types or selects an artist name (autocomplete)
3. Grid reflows to show only that artist's work
4. User can clear filter or add creature type filter on top

### Flow 3: Filter by Creature Type
1. User clicks "All Creatures" dropdown
2. Selects a creature type (e.g., Dragon)
3. Grid shows only cards with that creature type
4. Works in combination with artist filter

### Flow 4: View Art Detail (Lightbox)
1. User clicks an artwork in the grid
2. Lightbox opens: dark background, art centered, metadata below
3. User toggles "Show Frame" to switch between `art_crop` and `normal`
4. User pinch-zooms (mobile) or scroll-zooms (desktop)
5. Clicks X or background to close, returns to grid at same scroll position

## 3. Key Screens & States

| # | Screen | States |
|---|--------|--------|
| 1 | **Art Feed (Grid)** | Default, loaded, loading more, filtered, empty result |
| 2 | **Lightbox (Detail)** | Art-only (default), with-frame, zoomed in, zoomed out |
| 3 | **Filter Dropdowns** | Closed, open, applied, cleared |

## 4. Interactions & Transitions

| Interaction | Behaviour |
|-------------|-----------|
| Page load | Shimmer placeholders → images fade in |
| Scroll to bottom | Next page loads, appended with fade-in |
| Hover card | Overlay fades in (200ms) with name + artist |
| Click card | Lightbox opens — background dims, art scales in |
| Frame toggle | Crossfade between images (300ms) |
| Zoom | Pinch/scroll wheel — smooth, bounded, snap-back |
| Close lightbox | Click X or background — art scales out |
| Filter select | Grid fades out (150ms), new results fade in (200ms) |

## 5. Edge Cases

| Case | Handling |
|------|----------|
| No results for filter combo | Centered message: "No artwork found" |
| Image fails to load | Dark placeholder with card name text |
| Card has no `art_crop` | Use `normal` image, disable frame toggle |
| Zoom at max resolution | Stop zoom at native resolution, subtle bounce |
| Mobile: scroll while zoomed | Lock page scroll when lightbox open |

## 6. Out of Scope (MVP)

- ❌ AI-powered "find similar" artwork
- ❌ Artist profile pages
- ❌ User accounts / collections / galleries
- ❌ Community features
- ❌ Monetization
- ❌ Visualization dashboards
- ❌ Download / export artwork
- ❌ Mood/color/style filters
- ❌ Mobile app / PWA
