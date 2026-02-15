

# Fix: Project Detail Sheet Crashes When Editing a Transaction

## The Bug

In `ProjectDetailSheet.tsx` (line 166), the Drawer's `open` prop is set to `isOpen && !isChildEditing`. When a user taps Edit on a transaction inside the project detail sheet:

1. `isChildEditing` becomes `true`
2. The Drawer's `open` becomes `false`
3. This triggers `onOpenChange(false)`, which calls `onClose()`
4. The project detail sheet unmounts permanently
5. When the edit sheet closes, there's nothing to return to -- the app falls back to the Projects tab with the bottom dock hidden and everything unclickable

## The Fix

**File: `src/components/ProjectDetailSheet.tsx`**

Change the Drawer to stay open (but visually hidden) while a child edit sheet is active, instead of closing it. This follows the existing pattern used elsewhere in the app (per the codebase convention of using a `hidden` class on parent views for nested sheets).

```text
Line 166 - Before:
  <Drawer open={isOpen && !isChildEditing} onOpenChange={...}>

After:
  <Drawer open={isOpen} onOpenChange={(open) => {
    if (!open && !isChildEditing) onClose();
  }}>
```

And add a `hidden` class to the `DrawerContent` when the child edit sheet is open so it disappears visually but stays mounted in the DOM:

```text
Line 167 - Before:
  <DrawerContent className="max-h-[85vh]">

After:
  <DrawerContent className={cn("max-h-[85vh]", isChildEditing && "hidden")}>
```

This is a two-line fix. The Drawer stays mounted, the edit sheet opens on top, and when it closes the project detail sheet reappears exactly where the user left off.

