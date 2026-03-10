

# Fix Toast Close Button Visibility in Dark/OLED Mode

## Problem
The Sonner toast close button (X icon) renders as white on a white circular background in dark/OLED mode, making it invisible. In light mode it's fine (black on white).

## Cause
Sonner's `closeButton` inherits default styling where both the button background and the icon color end up being the same in dark mode. The toast itself uses `bg-background` and `text-foreground`, but the close button's internal SVG icon doesn't pick up `text-foreground`.

## Fix — `src/components/ui/sonner.tsx`

Add a `closeButton` class name to the `toastOptions.classNames` object that forces the close button to use proper contrast colors:

```typescript
closeButton: "group-[.toast]:text-foreground group-[.toast]:bg-muted group-[.toast]:border-border group-[.toast]:hover:bg-accent",
```

This ensures:
- The X icon uses `text-foreground` (light text in dark mode, dark text in light mode)
- The circular background uses `bg-muted` (subtle contrast against the toast background)
- Border matches the theme

Single file change: `src/components/ui/sonner.tsx`

