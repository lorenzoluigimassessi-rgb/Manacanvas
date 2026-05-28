# ManaCanvas MVP 5 — "Draw" Mode
## Product Brief for UX Agent Workflow

---

## Product Context

**ManaCanvas** is a dark, premium gallery browser for Magic: The Gathering card art. Built in vanilla JS, no frameworks. Live at `https://lorenzoluigimassessi-rgb.github.io/Manacanvas/mvp/`.

The current product is a single-mode experience: a filterable, searchable art grid with infinite scroll, a lightbox for individual cards, and a "Surprise Me" button that opens one random card. Filters include artist, set, creature type, card type, mana colour, art style, and year range. All multi-select. State persists via localStorage.

The visual identity is dark gallery aesthetic — `#0c0c0f` background, Josefin Sans + Cinzel fonts, minimal chrome, art-first.

---

## The Problem

The current experience is **Browse-only**. It rewards users who know what they want (filter by artist, search a card name) but offers little magic for users who just want to be surprised and delighted. The existing "Surprise Me" button is a single action — one random card in the lightbox — not a real discovery experience. It feels like a feature, not a mode.

There is a missed opportunity: MTG art is one of the most visually rich, emotionally varied bodies of illustration in gaming. The product should have a mode that lets users experience that richness through pure discovery — no filters, no decisions, just one beautiful piece of art at a time.

---

## The Opportunity

Add a second mode — **Draw** — that is a parallel, complementary experience to Browse. Not a replacement. Not an overlay. A distinct mode with its own entry point, its own visual language, and its own interaction pattern.

The name "Draw" is intentional: it references the MTG mechanic (drawing a card), the act of illustration, and the feeling of pulling something from a deck — surprise with anticipation.

---

## Two Modes, One Product

| | Browse | Draw |
|---|---|---|
| **Intent** | I know what I want | Show me something |
| **Interaction** | Grid → filter → lightbox | One card at a time → swipe |
| **Entry** | Welcome page "Browse" CTA | Welcome page "Draw a card" CTA |
| **Persistent access** | Always (it's the main feed) | Header next to search (desktop) · Floating pill (mobile) |
| **Visual language** | Dark grid, neutral chrome | Full-screen, mana-colour gradients |

---

## Feature Specification

### 1. Welcome Page Redesign

**Current state:** Single CTA "Enter the Gallery" + curated picks grid.

**New state:** Two-path entry, clean hierarchy.

- Primary CTA: `Browse the Gallery` — solid button, same as today
- Secondary CTA: `✦ Draw a card` — typographic treatment, subtle glow or spark animation, positioned below Browse with an "or" separator
- No search bar on welcome (search requires intent; welcome serves users without it)
- Remove the curated picks grid — it adds noise before the user has context
- Keep the MANACANVAS title + subtitle + background art

**Hierarchy principle:** Browse is the safe, expected path. Draw is the seductive invitation. The word "or" frames them as alternatives, not competitors.

---

### 2. Draw Mode — Full Screen Experience

**Entry points:**
- Welcome page "Draw a card" CTA
- Floating Draw button on the Browse feed (desktop: header next to search, mobile: floating bottom pill)

**Default visual: art crop**
The art crop (`image_uris.art_crop` from Scryfall) fills the screen edge-to-edge. No card frame, no text, no mana cost — pure illustration. This is the primary Draw experience.

A subtle toggle (bottom center, unobtrusive) allows switching to the full card frame view (`image_uris.normal`) for users who want to see the complete card. The toggle state persists across all cards for the duration of the session — if you switch to Card frame, every subsequent card shows the frame until you toggle back. Resets to art crop on re-entry.

**Core interaction:**
- Full-screen single card view — art crop fills the screen
- Swipe left → next new card
- Swipe right → previous card (within session history, capped at 20)
- Tap/click the art → expand to detail overlay (not the full Browse lightbox)
- Swipe down or press Escape → exit Draw mode, return to Browse feed
- Session history resets on re-entry — always starts fresh across sessions

**Mobile interactions:**
- Swipe left → next new card
- Swipe right → previous card in session history
- Swipe down → exit Draw mode
- Tap → open detail overlay
- Visible X button → exit Draw mode

**Desktop interactions:**

| Input | Action |
|---|---|
| `→` or `↓` | Next card |
| `←` or `↑` | Previous card |
| `Escape` | Exit Draw mode |
| Hover arrow `›` right edge | Next card |
| Hover arrow `‹` left edge | Previous card |
| Two-finger trackpad swipe | Next / previous |
| Scroll wheel | Next card |
| Click card | Open detail overlay |

Hover arrows invisible at rest, appear on mouse movement, disappear after 2s of inactivity.

**Session history:**
- Capped at 20 cards
- Swipe right navigates back through history
- Swipe left from oldest history card fetches a new card
- History cleared on re-entry — always fresh across sessions

**Visual language — mana colour gradients:**
Use the card's colour identity to drive a background gradient. Sourced from the card's `colors` array in the Scryfall API response — no client-side image processing needed.

| Colour identity | Gradient treatment |
|---|---|
| White (W) | Warm ivory → soft gold |
| Blue (U) | Deep navy → midnight teal |
| Black (B) | Near-black → deep violet |
| Red (R) | Dark ember → burnt orange |
| Green (G) | Deep forest → dark moss |
| Multicolour | Shifting gold → bronze |
| Colourless | Slate → cool grey |
| Lands / other | Earthy brown → dark stone |

The gradient sits behind the card art as a full-screen background, giving each card its own atmosphere.

**Card detail overlay (tap from Draw mode):**
- Card name, artist, set, year, mana symbols
- "Browse by this artist / set" shortcut — exits Draw, opens Browse filtered accordingly
- Close → returns to Draw mode on the same card

**Transition animation:**
- Swipe left: outgoing card slides left and fades, incoming slides in from the right
- Swipe right: outgoing card slides right and fades, incoming slides in from the left
- Card follows the finger in real time on mobile — snaps back if threshold (~30% screen width) not met
- Incoming card peeks from the edge during drag to signal another card is always waiting
- Transition duration ~280ms
- On desktop: triggered instantly on input, no drag simulation

---

### 3. Browse Feed — Lightbox Update

Remove the "Surprise Me / Draw" button from the lightbox. It belongs to Draw mode now.

Add prev/next navigation to the lightbox:
- Desktop: left/right arrow buttons on the sides, or keyboard arrow keys
- Mobile: swipe left/right on the art to move to prev/next card in the current feed

---

### 4. Floating Draw Access on Feed

**Desktop:**
- Position: header row 1, right of the search bar, replacing the current "Surprise Me" button
- Visual: pill shape, subtle gradient border referencing the mana palette, `✦ Draw` label
- Behaviour: enters Draw mode as a full-screen overlay. Exiting returns to the feed at the same scroll position.

**Mobile:**
- Position: floating pill, bottom center, above safe area
- Always visible on the feed view
- Scroll-aware: slides down slightly when scrolling down, slides back up when scrolling stops or reverses
- Single action: `✦ Draw`
- Shuffle button stays in the header — it is a Browse action, not a mode switch

---

### 5. Naming & Icon

**Name:** Draw

**Recommended icon:** ✦ spark / four-pointed star — references the MTG planeswalker spark, abstract, works at small sizes, reinforces magical discovery without being a character mascot.

**Avoid:** wizard character, dice (already used for old Surprise Me), generic shuffle arrows.

---

## What Does Not Change

- The Browse experience — filters, chips, search, lightbox (minus the Draw button), infinite scroll, sort
- Visual identity — dark palette, Josefin Sans + Cinzel, card grid aesthetic
- localStorage persistence of filter state
- Scryfall API integration

---

## Success Metrics

- Users who enter via Draw mode complete at least 5 card swipes per session
- Draw mode has a clear, low-friction exit back to Browse
- No user confusion between the two modes — complementary, not competing
- Welcome page conversion to either mode improves over single-path baseline
- Mobile floating pill does not obscure content or feel intrusive

---

## Open Questions for UX Agent

1. Should Draw mode remember the last card seen across sessions, or always start fresh? — *Always fresh on re-entry. Within a session, history stack of up to 20 cards is kept.*
2. Should filtering be possible within Draw mode? — *No. Browse concern only.*
3. How many cards to pre-fetch for seamless swiping? — *Batch of 10, fetch next batch when 3 remain.*
4. Should the detail overlay support favouriting? — *Out of scope, MVP 6.*
5. Mobile exit gesture — swipe down, X button, or both? — *Both.*

---

## Workflow Instructions

Skip Step 2 (Tech Spec Review) — stack is unchanged (vanilla JS, Scryfall API, no frameworks). Feasibility confirmed.

**Run: Step 1 → Step 3 → Step 6 → Step 8**
