# Step 7 — Prototype Plan: ManaCanvas

## 1. Screen Map

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   [Welcome Page]                                │
│        │                                        │
│        │ (CTA click)                            │
│        ▼                                        │
│   [Screen 1: Art Feed Grid]                     │
│        │              │                         │
│        │ (click card) │ (click filter)          │
│        ▼              ▼                         │
│   [Screen 2:     [Filter Dropdown]              │
│    Lightbox]          │                         │
│        │              │ (select option)         │
│        │ (toggle)     ▼                         │
│        ▼         (Grid reloads filtered)        │
│   [Frame swap]                                  │
│        │                                        │
│        │ (zoom)                                 │
│        ▼                                        │
│   [Zoomed state with pan]                       │
│        │                                        │
│        │ (close / logo click)                   │
│        ▼                                        │
│   (Returns to Feed / Welcome)                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 2. User Journey (Primary Path)

| Step | Action | Screen | What happens |
|------|--------|--------|--------------|
| 1 | Land on ManaCanvas | Welcome | Random art bg, title, CTA |
| 2 | Click "Start Browsing" | Feed | Shimmer → grid fades in |
| 3 | Scroll down | Feed | More art loads (infinite scroll) |
| 4 | Hover a card | Feed | Overlay fades in: name + artist |
| 5 | Type in search | Feed | Suggestions with contextual tags |
| 6 | Select artist filter | Feed | Grid reflows, chip appears |
| 7 | Add creature type | Feed | Grid narrows (combined filter) |
| 8 | Click artwork | Lightbox | Art centered on black |
| 9 | Toggle "With Frame" | Lightbox | Crossfade to full card |
| 10 | Scroll zoom | Lightbox | Art zooms, drag to pan |
| 11 | Close lightbox | Feed | Returns at same scroll position |
| 12 | Click logo | Welcome | Returns to welcome with new art |

## 3. Transitions

| From | To | Transition | Duration |
|------|----|-----------|----------|
| Welcome → Feed | Page swap | Instant (display toggle) | — |
| Page load → Grid | Initial | Shimmer → fade in | 300ms |
| Scroll → More items | Append | Cards fade in | 200ms |
| Hover → Overlay | Reveal | Opacity 0→1 | 200ms |
| Click card → Lightbox | Open | Backdrop fade + art scale | 250ms |
| Lightbox → Close | Dismiss | Scale down + fade out | 200ms |
| Art Only ↔ Frame | Toggle | Crossfade | 300ms |
| Filter → Grid reload | Reflow | Fade out/in | 350ms |

## 4. Build Phases (Step 8)

| Phase | What gets built |
|-------|----------------|
| 1 | Scaffold, base CSS (Dark Gallery), API module |
| 2 | Art grid feed + infinite scroll |
| 3 | Filter dropdowns (artist + creature type + set + year) |
| 4 | Lightbox + frame toggle + zoom |
| 5 | Welcome page + responsive + polish |

## 5. Tech Stack

- HTML/CSS/JS — no framework
- Scryfall API — live data
- CSS Grid — responsive layout
- CSS transforms — zoom/pan
- Intersection Observer — infinite scroll
- Google Fonts — Cinzel + Josefin Sans

## 6. API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/cards/search?q=...` | Feed + filtered results |
| `/cards/autocomplete?q=...` | Search suggestions |
| `/cards/random?q=...` | Welcome page background |
| `/catalog/creature-types` | Type filter options |
| `/catalog/artist-names` | Artist autocomplete |
| `/sets` | Set filter options |

## 7. File Structure

```
manacanvas/mvp/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── welcome.js      ← Welcome page + random art bg
    ├── api.js          ← Scryfall API calls
    ├── grid.js         ← Feed rendering + infinite scroll
    ├── filters.js      ← Dropdowns + search + view control
    └── lightbox.js     ← Detail view + zoom + frame toggle
```
