# ManaCanvas Wave 3 — Confirmed Architecture
## Status: In Progress — building in mvp-staging
## Last updated: current session

### Build Progress
| Step | Status | Notes |
|------|--------|-------|
| 1. Header | ✅ Done | Search, Discover, desktop switcher, mobile top bar |
| 2. Gallery tab | ⚠️ Partial | Lens + sub-pills + feed done. View/Sort not wired. Daily Picks 24h seed done. |
| 3. Search | 🔄 Next | Basic search works. Chips hide/show + results redirect to Gallery pending. |
| 4. Collections tab | ❌ Not started | |
| 5. Advanced tab | ❌ Not started | Placeholder only |
| 6. Full flow review | ❌ Not started | |

### Recent decisions (this session)
- "Our Picks" renamed to "Daily Picks" — feed rotates every 24h via day-seeded page offset
- MC logo click → resets filters + returns to Daily Picks (no longer goes to welcome page)
- Welcome page matches prod: Draw a Card (primary) + Browse the Gallery (secondary)
- Discover = Draw a Card mode (same as prod surprise mode)

---
## Navigation

### Four modes
| Tab | Icon | What it is |
|-----|------|------------|
| Gallery | 🖼 | Curated feed with lens chips + sub-pills |
| Collections | 🗂 | Folder browser — Artists, Sets, Creatures, Card Type |
| Advanced | 🔍 | Form-first filter search → results open in Gallery |
| Discover | ✦ | Random card lightbox — special visual treatment |

### Desktop header
```
[ MANACANVAS ]  [ search 🔍 ]                    [ ✦ Discover ]
[ Gallery | Collections | Advanced ]  ← centered switch row 2
```

### Mobile
```
Top bar:  [ MANACANVAS ]  [ 🔍 ]  [ ✦ Discover ]

Bottom nav:
[ 🖼 Gallery ] [ 🗂 Collections ] [ 🔍 Advanced ] [ ✦ Discover ]
```

---

## Search — Finalized

- Persistent search icon (🔍) in top bar on ALL tabs, mobile + desktop
- Like YouTube — icon always visible, tap to expand/overlay
- Always global — searches all cards regardless of current tab
- Results always redirect to Gallery tab
- When search active → Gallery lens chips disappear, replaced by results
- Clear (X) → chips reappear, Gallery returns to last active lens
- Advanced Search → Show Results → opens Gallery with filters applied
  (Advanced is just a powerful way to configure Gallery)

---

## Gallery Tab — Lens System

### Default: Newest first

### Lens chips (single select, hidden when search active)
[ Newest ] [ Time Machine ] [ Creature Type ] [ Art Style ] [ Mana Color ]

### Sub-pills per lens

**Newest**
All · Only previews · Last set · Last block
Single select · Dynamic

**Time Machine** (MTG eras — research confirmed)
- The Beginning (1993–1994)
- The Dark Age (1995–1997)
- The Invasion Era (1998–2003)
- The Modern Age (2003–2008)
- The Renaissance (2008–2014)
- The New Era (2014–2018)
- The Modern Era (2018–2022)
- The Multiverse Era (2022–present)
Single select

**Creature Type**
Dragon · Angel · Demon · Elf · Human · Merfolk · Zombie · + See more
Multi-select · See more → searchable modal

**Art Style**
Classic · Dark & Gritty · Painterly · Ethereal · Epic · Sketch · Modern
Multi-select

**Mana Color**
W · U · B · R · G · Multi · Colorless · + Other combinations
Multi-select · Other → Wave 4

### In-feed dividers
Show section headers when lens = groupable content (By Artist, By Set, By Era)
Hide when lens = random/shuffled

### View + Sort
View toggle: Grid / List (top-right)
Sort: Newest / Oldest / A→Z / Z→A

---

## Collections Tab

### Level 1 — Category index (folders with previews)
- Artists
- Sets
- Creatures
- Card Type

### Search in Collections
- Filters folder names only (client-side, no API call)
- Does NOT search within folders yet (Wave 4)

### Level 2 — Inside a category
- Back button → returns to index
- Filtered feed
- Refine button → sheet/panel

---

## Advanced Tab
- All filters visible upfront (form-first, like Scryfall but visual)
- Artist, Set, Year range, Color, Creature type, Card type, Art style
- Show Results → opens Gallery with filters applied
- Reset all

---

## Discover
- Tap → opens random card lightbox immediately
- Swipe to discover more
- Draw Again button
- Close → returns to origin tab
- Special visual: accent color (gold/amber), subtle pulse animation

---

## Visual Rebrand (separate task)
- Inspiration: Cosmos design system
- Research: typography, spacing, component style before implementing
- Apply to mvp-staging first

---

## Build Order (staging — one step at a time, approve each before next)
1. Header — search icon + Discover button, desktop switch + mobile bottom nav
2. Gallery tab — lens chips + sub-pills + feed + view/sort
3. Search — icon expands to overlay/bar, results in Gallery, chips hide/show
4. Collections tab — folder browser, client-side search
5. Advanced tab — form UI → results in Gallery
6. Full flow review — all navigation, back buttons, search from any tab

## Out of Scope (Wave 3)
- Bookmarking / saving
- User accounts
- Mana color combinations beyond mono+multi+colorless
- Custom era ranges
- Trending sort
- Search within Collections folders
- Cosmos rebrand (separate track)
