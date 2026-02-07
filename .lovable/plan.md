
## What I’m seeing from your screenshot
In the Project detail drawer on mobile, the content area is:
1) getting clipped on the right (cards and transaction rows look “cut”), and  
2) not reliably scrollable to reach all entries (so it feels like entries are “missing”).

This strongly points to a **mobile drawer + nested scroll container issue** (Vaul Drawer + Radix ScrollArea + `overflow-hidden`), which can behave differently on iOS/Android compared to desktop.

---

## Goal
Make the Project detail drawer on mobile:
- fully scrollable (so all transactions are reachable),
- not clipped on the right (no horizontal cut-off),
- consistent with other drawers that already behave well on mobile (e.g., PartnerDetailSheet).

---

## Changes I will implement

### 1) Replace Radix `ScrollArea` with a native scroll container for this drawer (mobile-safe)
**File:** `src/components/ProjectDetailSheet.tsx`

- Remove the `ScrollArea` import and replace:
  ```tsx
  <ScrollArea className="flex-1 overflow-auto w-full"> ... </ScrollArea>
  ```
  with a native div scroller:
  - `className="flex-1 min-h-0 overflow-y-auto w-full"`
  - `data-vaul-no-drag` to prevent the drawer’s drag gesture from stealing scroll
  - `style={{ WebkitOverflowScrolling: "touch" }}` for smooth iOS scrolling
- Move padding onto the scroller (or keep a single inner wrapper), but avoid multiple nested “width/overflow” wrappers that can cause clipping.

Why: This matches the working pattern in `PartnerDetailSheet.tsx` (which uses a plain `div` with `overflow-y-auto`) and is the most reliable approach on mobile Safari.

---

### 2) Remove/adjust the horizontal clipping that’s cutting off the right side
**File:** `src/components/ProjectDetailSheet.tsx`

- Remove or narrow down the use of `overflow-x-hidden` / `overflow-hidden` that can clip the card edges on mobile.
- Add `min-w-0` where needed to guarantee children shrink instead of overflowing (especially inside flex rows and grid items). Concretely:
  - Ensure the main scroll content wrapper uses `min-w-0 w-full`.
  - Add `min-w-0` to the left-side container inside the Vendor rows (so long vendor names don’t force overflow).
  - Keep `truncate` where appropriate, but ensure the *container* can shrink.

Outcome: content stays within the drawer width instead of being clipped by a parent overflow rule.

---

### 3) Fix the empty-state check (minor correctness fix)
Right now the “No transactions yet for this project” section checks `transactions.length` (the prop), but the sheet now uses `projectTransactions` (from the store) to render.
**File:** `src/components/ProjectDetailSheet.tsx`

- Change the empty-state condition to use `projectTransactions.length === 0` (or `sortedTransactions.length === 0`) so it’s consistent with what’s actually displayed.

---

### 4) Fallback (only if needed): disable background scaling for this drawer on mobile
If iOS still shows strange clipping/positioning after the scroll fix, I’ll apply:
```tsx
<Drawer shouldScaleBackground={false} ...>
```
**File:** `src/components/ProjectDetailSheet.tsx`

Why: Vaul’s background scaling can introduce transformed ancestors that sometimes interact poorly with fixed-position overlays on iOS.

---

## How we’ll verify the fix (mobile-first checklist)
1) Open Projects → open a project detail drawer with many transactions.
2) Confirm:
   - You can scroll all the way down to the last expense/income entry.
   - No cards/rows are cut off on the right edge.
   - Vendor Payments expand and the nested list is scrollable.
3) Test swipe-to-delete on a TransactionItem inside the drawer (ensure it still works).
4) Edit a transaction from within the drawer and close the edit sheet—confirm the parent project drawer stays open (no accidental close).

---

## Files involved
- `src/components/ProjectDetailSheet.tsx` (main fix)
- (No backend/database changes needed)

---

## Expected result
- On mobile, the project detail view becomes reliably scrollable, and the “missing entries” issue disappears because you can actually reach all entries.
- The right-side clipping is removed, so cards and transaction rows render fully within the drawer.
