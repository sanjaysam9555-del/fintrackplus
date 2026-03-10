

# Fix Mobile Keyboard Auto-Opening in Dropdown Selectors

## Problem
When Category, Vendor, or Project dropdowns are tapped on mobile, the search input inside each `PopoverContent` has `autoFocus`, which immediately triggers the mobile keyboard. This is disruptive — users just want to browse and pick from the list. The keyboard should only appear when the user explicitly taps the search input.

## Changes

### 1. Remove `autoFocus` from search inputs (both forms)

**`src/components/AddTransactionSheet.tsx`** — Remove `autoFocus` from 3 search inputs:
- Category search (line 401)
- Vendor search (line 596)
- Project search (line 813)

**`src/components/EditTransactionSheet.tsx`** — Remove `autoFocus` from 3 search inputs:
- Category search (line 285)
- Vendor search (line 415)
- Project search (line 547)

### 2. Improve PopoverContent mobile layout

Update all 6 `PopoverContent` instances to use mobile-friendly sizing:
- Add responsive width: `w-[calc(100vw-2rem)] sm:w-72` so the dropdown fills the screen on mobile
- Increase `max-h` of the scrollable list area from `max-h-52` to `max-h-[40vh]` so the list adapts when the keyboard IS open (user taps search voluntarily)
- Ensure the popover positions well by adding `sideOffset={8}`

This is a straightforward fix — 6 `autoFocus` removals and minor responsive width/height tweaks across 2 files.

| File | Change |
|------|--------|
| `src/components/AddTransactionSheet.tsx` | Remove 3x `autoFocus`, responsive popover sizing |
| `src/components/EditTransactionSheet.tsx` | Remove 3x `autoFocus`, responsive popover sizing |

