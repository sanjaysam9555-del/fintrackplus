

# Fix: Header Behind Status Bar in PWA Mode (iPhone)

## Problem
When opened as a home-screen app (PWA) on iPhones with a notch/Dynamic Island, the header content overlaps with the system status bar. The current `safe-top` utility applies a fixed fallback of `3.25rem` which isn't enough, and `env(safe-area-inset-top)` may still return `0` in some PWA contexts.

## Solution
Use the `display-mode: standalone` CSS media query to apply a larger fallback **only** when the app is running as an installed PWA. This ensures:
- In a normal browser: minimal/no extra top padding (no wasted space)
- In PWA/home-screen mode: enough padding to clear the notch/Dynamic Island

## Changes

### `src/index.css` -- Update `.safe-top` utility

```css
.safe-top {
  padding-top: max(1rem, env(safe-area-inset-top));
}

/* When running as an installed PWA / home screen app */
@media (display-mode: standalone) {
  .safe-top {
    padding-top: max(3.75rem, env(safe-area-inset-top));
  }
}
```

- **Browser mode**: Uses a smaller fallback (`1rem`) since the browser chrome already handles the status bar area.
- **PWA standalone mode**: Uses `3.75rem` (60px) as the fallback, enough to clear the Dynamic Island on modern iPhones, while `env(safe-area-inset-top)` takes over if the browser supports it.

This is a single-file, few-line change. No re-adding the PWA to the home screen should be required for the CSS change to take effect (only the meta tag change from the prior fix needed that).
