# More Filters Modal — Spec

## Overview
A centered modal on desktop that houses the 3 advanced filters: Card Type, Mana Type, Year Range. Triggered by a "More ▾" button at the end of the filter row. Mobile unaffected — these filters remain in the flat sheet.

## Filter row (after change)
```
[ All Artists ] [ All Sets ] [ Art Style ] [ Creature Type ] [ More ▾ ]
```
Hidden from row: Card Type, Mana Type, Year Range

## Modal layout
```
┌─────────────────────────────────────────┐
│  More Filters                    Clear  │
│  ───────────────────────────────────── │
│                                         │
│  CARD TYPE                              │
│  [ Artifact ] [ Creature ] [ Instant ]  │
│  [ Sorcery  ] [ Land     ] [ Enchant ]  │
│                                         │
│  MANA TYPE                              │
│  [⚪ White] [🔵 Blue] [⚫ Black]        │
│  [🔴 Red ] [🟢 Green] [🌈 Multi]       │
│                                         │
│  YEAR RANGE                             │
│  From ──●────────────── 1993            │
│  To   ────────────●──── 2025            │
│                                         │
│         [ Show Results ]                │
└─────────────────────────────────────────┘
```

## Behaviour
- Opens: click "More ▾" button
- Closes: "Show Results" button, backdrop click, Escape key
- Apply: on close via "Show Results" only — no instant apply inside modal
- Clear: resets only Card Type, Mana Type, Year Range — does NOT affect other filters
- Badge: "More (2) ▾" when any of the 3 filters are active

## Files to change
| File | Change |
|------|--------|
| `filters.js` | Remove Card Type, Mana Type, Year Range from main row. Add "More ▾" button. Add modal open/close/apply/clear logic |
| `index.html` | Add modal HTML container |
| `style.css` | Modal overlay, centered panel, pill styles, Show Results button |

## Mobile
No change — Card Type, Mana Type, Year Range remain in the flat sheet as-is.
