

# Fix: Edit Form Blocked by Drawer Overlay (Portal Escape Issue)

## Root Cause

The current fix wraps the Drawer in a `<div className="pointer-events-none">`, but the Vaul Drawer uses a **React Portal** (`DrawerPortal`) internally, which renders both the overlay and content directly to `document.body` -- completely outside the wrapper div. This means `pointer-events-none` on the wrapper has zero effect on the overlay.

The `DrawerOverlay` (a full-screen `fixed inset-0 z-50` element) remains visible and interactive, capturing all touch/scroll events before they reach the `EditTransactionSheet` portal at `z-[80]`.

## The Fix (2 files)

### 1. `src/components/ui/drawer.tsx`

Add an optional `overlayClassName` prop to `DrawerContent` so consumers can style the overlay independently:

```text
Before:
  DrawerContent accepts: className, children, ...props

After:
  DrawerContent accepts: className, overlayClassName, children, ...props
```

The `overlayClassName` gets passed through to `<DrawerOverlay className={overlayClassName} />`.

### 2. `src/components/ProjectDetailSheet.tsx`

- Remove the wrapper `<div className={isChildEditing ? "pointer-events-none" : ""}>` (it does nothing for portaled content)
- Pass `overlayClassName` to `DrawerContent` to hide the overlay when editing:

```text
<DrawerContent 
  className={cn("max-h-[85vh]", isChildEditing && "hidden")}
  overlayClassName={isChildEditing ? "pointer-events-none opacity-0" : ""}
>
```

This ensures both the overlay and the content panel become invisible and non-interactive when a child edit sheet is open, allowing the `EditTransactionSheet` portal to receive all touch and scroll events.

