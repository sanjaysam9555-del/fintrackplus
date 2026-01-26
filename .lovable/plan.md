
# Add Save Changes Button to Mobile Edit Transaction Form

## Overview

The Edit Transaction form already has a "Save Changes" button in the header next to the close button, but it's currently hidden on mobile screens (`hidden lg:flex`). We need to make it visible on all screen sizes.

---

## Current State

The header section at lines 139-154 has:
- Title "Edit Transaction" on the left
- A "Save Changes" button that's **hidden on mobile** (`hidden lg:flex`)
- An X close button on the right

---

## Implementation

### File: `src/components/EditTransactionSheet.tsx`

**Change**: Remove the `hidden lg:flex` class from the Save Changes button to make it visible on all screen sizes.

**Current code (line 146):**
```typescript
className="hidden lg:flex gradient-primary text-primary-foreground"
```

**Updated code:**
```typescript
className="gradient-primary text-primary-foreground"
```

---

## Visual Result

**Mobile Header (After):**
```
┌─────────────────────────────────────┐
│  Edit Transaction    [Save Changes] [X]
└─────────────────────────────────────┘
```

The button will be compact (`size="sm"`) so it fits well next to the close button without crowding the header on mobile.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/EditTransactionSheet.tsx` | Remove `hidden lg:flex` from Save Changes button (line 146) |

---

## Technical Notes

- The button already uses `size="sm"` which is appropriate for mobile
- The button styling (`gradient-primary text-primary-foreground`) matches the app's design system
- The button is already properly wired to `handleSubmit` and has disabled state logic
- This follows the project memory guideline for desktop form accessibility but extends it to mobile for convenience
