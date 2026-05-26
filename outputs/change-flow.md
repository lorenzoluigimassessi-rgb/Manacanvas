# ManaCanvas — Agentic Change Flow

## How to use
- Prefix with `change:` → runs full 3-step flow (intake, expansion, prompt translation, review before build)
- Prefix with `quick:` → skips to build immediately, no expansion

---

## Step 1 — Intake & Expansion

When the user describes a change, expand it into:

### Primary action
What exactly changes — component, state, behaviour.

### UX ripple effects
What else must change as a consequence. Think:
- What other components are affected?
- What state needs to reset, persist, or update?
- What does the user see before, during, and after?
- What happens to related UI elements?

### Edge cases
- What if the user is mid-interaction when this fires?
- What if the relevant data isn't loaded yet?
- What if the user is on a different tab/mode?
- What if the action is triggered from multiple entry points?

### Platform considerations
- Does this behave differently on mobile vs desktop?
- Are there touch vs mouse differences?
- Safe area, keyboard, scroll position implications?

### Out of scope
Explicitly list what is NOT changing, to prevent scope creep.

---

## Step 2 — Prompt Translation

Translate the approved spec into a precise, self-contained build prompt.

Rules for the prompt:
- Written as if instructing with zero prior context
- References exact file paths and function names
- Lists every file that needs to change
- States the expected behaviour after the change, not just what to do
- Includes verification criteria — how to confirm it worked

---

## Step 3 — Build & Verify

Execute the prompt. Before pushing, explicitly verify each point from the spec:
- ✅ Primary action implemented
- ✅ Each ripple effect addressed
- ✅ Edge cases handled
- ✅ Platform differences covered

Only push when all points are checked.

---

## Example

**User input:**
`change: clearing the search X button should restore the previous lens`

**Step 1 output:**

Primary action: clicking the search clear button resets `activeSearch` to null and hides the search bar value.

Ripple effects:
- Lens row reappears (currently hidden in search mode)
- Sub-pill row reappears with the previously active lens's sub-pills
- The previously active lens button regains its `active` class
- The previously active sub-pill regains its `active` class
- The grid reloads with the lens query, not a search query
- The search suggestions dropdown closes

Edge cases:
- If no lens was previously active (first session), default to Daily Picks
- If the user selected a sub-pill before searching, that sub-pill should be restored
- If the user is on mobile, the mobile search bar also clears

Platform: same behaviour on mobile and desktop. Mobile search bar mirrors desktop.

Out of scope: does not affect filter chips, active filters, or sort order.

**Step 2 output:**
[self-contained build prompt referencing exact files and functions]

**Step 3:** build → verify each point → push.
