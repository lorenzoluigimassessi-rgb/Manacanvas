# MVP 4, 5, 6 — Plan: ManaCanvas

---

## Copy System

| Element | Copy | Location |
|---------|------|----------|
| Feed random button | ↺ Discover | Header Row 1 |
| Lightbox random button | ↺ Discover | Lightbox chrome |
| Sort default | Surprise Me ⇅ | Sort dropdown |
| Sort option label | Surprise Me | Sort dropdown list |

---

## MVP 4 — Discovery & Navigation

Focus: make the feed more engaging and browsable on every visit.

### Ticket 4.1 — Random default sort
- Change default sort from "Oldest First" to random (`order=random` Scryfall param)
- Every page load shows a different feed — variable reward mechanic
- Sort control remains available for users who want a specific order

### Ticket 4.2 — Expanded sort options
Replace the current 2-option sort toggle with a proper sort dropdown.

| Label | Scryfall param | Notes |
|-------|---------------|-------|
| Surprise Me (default) | `order=random` | New default |
| Latest Art | `order=released&dir=desc` | Newest first |
| Origins | `order=released&dir=asc` | Oldest first |
| Fan Favourites | `order=edhrec` | EDHREC community rank |
| By Artist | `order=artist` | Groups art by artist |
| By Rarity | `order=rarity` | Mythics tend to have more dramatic art |
| By Colour | `order=color` | Visual colour grouping |
| A → Z | `order=name` | Alphabetical |

### Ticket 4.3 — Keyboard navigation in lightbox
- ← → arrow keys to navigate prev/next card in the current grid
- Escape to close (already works)
- R for random (already works)
- Visual hint in the zoom hint bar: "← → to browse"
- Preload adjacent card images for smooth navigation

---

## MVP 5 — Editorial & Discovery

Focus: surface content users wouldn't find on their own.

### Ticket 5.1 — Art of the Day
- A single hero artwork on the welcome screen, changes daily
- Seeded by date — everyone sees the same card each day
- Creates a daily return reason
- Clicking it opens the lightbox directly

### Ticket 5.2 — More like this
- In the lightbox, below the toggle/random button, show 4–6 related cards
- Relation logic (in order of preference):
  1. Same artist
  2. Same set
  3. Same creature type
- Clicking a related card opens it in the lightbox (replaces current)
- Keeps users in the detail view longer, drives deeper discovery

---

## MVP 6 — Profile & Social

Focus: give users a reason to invest in the product and share it.

### Ticket 6.1 — Favourites / Collections
- Heart button on each card in the grid and in the lightbox
- Saved to localStorage (no account needed for MVP 6)
- "My Collection" view accessible from the header
- Cards persist across sessions

### Ticket 6.2 — Share artwork
- Share button in the lightbox
- Copies a direct URL to that card's art page
- On mobile: uses native Web Share API if available
- Drives organic growth — shareable links bring new users

---

## Deferred / Future

- Artist spotlight (bio header when filtering by artist) — MVP 6+
- Hidden Gems filter (cards with few printings) — MVP 5+
- Colour mood browsing as prominent UI — revisit after MVP 3.1 backend
- Account system / cloud sync for collections — post MVP 6
- AI chat search — MVP 3.3 (separate track, needs infrastructure decisions)
