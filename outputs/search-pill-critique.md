# UX Critique: Search Pill — Single Search + Clearable (Cosmos Pattern)

## What's working
- Single search at a time keeps the mental model dead simple — one input, one result, one state
- The Cosmos pattern (pill inside input with ✕) is well-established — users already know how to interact with it
- No stacking, no multi-select complexity — just search, see results, clear when done
- Keeping search results visible inside the search bar maintains context without stealing screen real estate
- Combined text + tag pill gives both "what I searched" and "what category it matched" in one glance

## Design Decisions

| Decision | Resolution |
|----------|-----------|
| Multiple searches | No — single search at a time |
| Pill location | Inside the search bar (Cosmos pattern) |
| Clear mechanism | ✕ button on the pill |
| Lenses on search | Hide when pill is active, restore on clear |
| State on clear | Restore previous lens state (not reset to "All") |
| Search bar visual change | Subtle background shift when pill is active (e.g. `#1a1a1f` → `#222228` or thin accent border) |

## Spec

### Pill anatomy
```
[ "Seb McKinnon" · Artist  ✕ ]
```
- Search text (primary) — truncate at ~12 chars on mobile
- Tag (secondary) — muted color / smaller weight
- ✕ clear button — 44×44px touch target minimum

### State transitions
1. **User searches** → pill appears in search bar, lenses animate out, search bar gets subtle background shift
2. **User taps ✕** → pill clears, search bar returns to neutral, lenses restore to previous state
3. **Pill dissolves to editable text** on tap (for editing the query)

### Mobile considerations
- Max pill width with truncation to preserve input space
- ✕ hit area 44×44px even if visual icon is smaller
- Test at 320px width

## Open question
Resolved — the search bar gets a subtle visual change (background tint or accent border) when a pill is active. The pill + bar shift together signal "search mode" clearly.
