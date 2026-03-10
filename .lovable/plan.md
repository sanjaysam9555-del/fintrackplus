

## Fix: Mobile Dropdown Keyboard & Zoom Issues

### Problems identified
1. **Auto-focus on search inputs**: The `<Input>` elements inside Category, Vendor, and Project popover dropdowns don't have `autoFocus` explicitly, but on mobile browsers, the first focusable input inside a newly-opened popover gets auto-focused by Radix, triggering the keyboard immediately.
2. **Zoom on focus**: The viewport meta tag lacks `maximum-scale=1` — iOS Safari auto-zooms into inputs with `font-size < 16px` (current search inputs use `text-sm` = 14px).
3. **Layout overlap**: When the keyboard does open (after tapping search), the popover content doesn't adapt its max-height, causing overlap with the keyboard.

### Changes

**1. Prevent auto-focus on search inputs inside popovers (mobile only)**
Files: `src/components/AddTransactionSheet.tsx`, `src/components/EditTransactionSheet.tsx`

- Add `autoFocus={false}` and `readOnly` initially on mobile to all search `<Input>` elements inside Category, Vendor, and Project popovers.
- Better approach: wrap each search input so it only becomes focusable on explicit tap. Use a click handler to manually `.focus()` instead of letting Radix auto-focus it.
- Simplest fix: add `onOpenAutoFocus={(e) => e.preventDefault()}` to each `<PopoverContent>` on mobile — this is the Radix-native way to prevent auto-focus.

**2. Prevent zoom on input focus (iOS)**
File: `index.html`

- Change viewport meta to: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`

**3. Adjust popover layout when keyboard is open**
Files: `src/components/AddTransactionSheet.tsx`, `src/components/EditTransactionSheet.tsx`

- Use the `visualViewport` API to detect when the keyboard is open and dynamically reduce the dropdown's `max-height` so items remain visible and scrollable above the keyboard.
- Simpler approach: reduce `max-h-[40vh]` on the item list to a smaller value that accounts for keyboard, or use CSS `max-height: calc(var(--visual-vh, 40vh))` with a small hook that sets `--visual-vh` based on `window.visualViewport.height`.

### Implementation summary
| File | Change |
|------|--------|
| `index.html` | Add `maximum-scale=1.0, user-scalable=no` to viewport |
| `src/components/AddTransactionSheet.tsx` | Add `onOpenAutoFocus={e => e.preventDefault()}` to Category/Vendor/Project `PopoverContent`; reduce dropdown max-height for keyboard |
| `src/components/EditTransactionSheet.tsx` | Same popover auto-focus prevention and max-height adjustments |

