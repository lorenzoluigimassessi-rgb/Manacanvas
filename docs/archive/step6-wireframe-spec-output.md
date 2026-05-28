# Step 6 — Wireframe Specification: ManaCanvas

## Screen 1: Art Feed (Grid)

**Purpose:** Browse MTG artwork visually, filter by artist/creature type, select art to view in detail.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ ROW 1: MANACANVAS    [🔍 Search...]                 │
├─────────────────────────────────────────────────────┤
│ ROW 2: [Artists▾][Creatures▾][Sets▾][Year▾] [Sort⇅][View▾] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │   ART   │  │   ART   │  │   ART   │           │
│  └─────────┘  └─────────┘  └─────────┘           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │   ART   │  │   ART   │  │   ART   │           │
│  └─────────┘  └─────────┘  └─────────┘           │
│              ◌ loading more...                      │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Logo (clickable → welcome page)
- Search bar with autocomplete suggestions (contextual tags: Artist, Creature, Set, Card)
- Filter buttons: Artist (autocomplete), Creature Type, Set (searchable), Year Range (dual slider)
- Sort toggle: Oldest/Newest First
- View dropdown: Small/Medium/Large grid
- Active filter chips with ✕ clear
- Art grid (CSS Grid, auto-fill)
- Art cards with hover overlay (name + artist)
- Shimmer loading placeholders
- Infinite scroll trigger
- Scroll-to-top button

**States:** Default, filtered, empty result, loading more, image error fallback

## Screen 2: Lightbox (Art Detail)

**Purpose:** View single artwork at high resolution, toggle frame, zoom.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████████ │
│                      [✕]                            │
│          ┌─────────────────────────┐               │
│          │        ARTWORK          │               │
│          │       (zoomable)        │               │
│          └─────────────────────────┘               │
│          Card Name                                  │
│          Artist · Set · Year                        │
│          [Art Only ◉] [With Frame ○]               │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Black backdrop (95% opacity, click to close)
- Close button (✕, top-right)
- Zoomable art image (pinch/scroll zoom, drag to pan)
- Card name + metadata
- Frame toggle (segmented control)
- Zoom hint (fades after 3s)

**States:** Art-only (default), with frame, zoomed, image loading, no art_crop available

## Screen 3: Welcome Page

**Purpose:** First impression, set the mood, single CTA to enter.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Random MTG art background + radial gradient overlay]│
│                                                     │
│              MANACANVAS                             │
│   DISCOVER 30 YEARS OF MAGIC: THE GATHERING ARTWORK │
│              [Start Browsing →]                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Random art background (from Scryfall random endpoint)
- Radial gradient overlay for readability
- Cinzel title (5.5rem, cinematic)
- Uppercase subtitle (letter-spaced)
- Solid white CTA button

## Visual Design Tokens

| Token | Value |
|-------|-------|
| Background | #0c0c0f |
| Surface | #1a1a22 |
| Border | #2a2a35 |
| Text primary | #f0f0f0 |
| Text secondary | #8a8a9a |
| Overlay gradient | linear-gradient(transparent, rgba(0,0,0,0.88)) |
| Card shadow (hover) | 0 12px 40px rgba(0,0,0,0.6) |
| Border radius | 6px |
| Lightbox backdrop | rgba(0,0,0,0.95) |
| Transitions | 150ms (fast), 200ms (normal), 300ms (slow) |
| Title font | Cinzel (600 weight) |
| Body font | Josefin Sans (300–500 weight) |

## Responsive Behaviour

| Breakpoint | Adaptation |
|------------|------------|
| Desktop (>1024px) | 3–4 column grid, hover overlays, scroll zoom |
| Tablet (768–1024px) | 2–3 columns, overlays always visible |
| Mobile (<600px) | 2 columns, pinch zoom, filters wrap |
