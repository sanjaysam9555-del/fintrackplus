

# Fix: Header Hidden Behind iOS Status Bar

## Problem
On iOS (PWA / home screen), the Dashboard header ("Good Evening, Saffron Events") is stuck behind the system status bar (time, battery, etc.). This happens because `env(safe-area-inset-top)` returns `0` with the current configuration, so the `safe-top` class only applies `1.5rem` (24px) — not enough for iPhones with the Dynamic Island.

## Root Cause
The `<meta name="apple-mobile-web-app-status-bar-style">` is set to `"default"`, which renders content *below* a solid status bar — meaning `env(safe-area-inset-top)` returns `0`. The fallback padding of `1.5rem` is too small.

## Solution
Change the status bar style to `"black-translucent"`. This extends the web content behind the translucent status bar, causing `env(safe-area-inset-top)` to return the correct inset value (~47-59px depending on device). The existing `safe-top` utility already handles this with `max(1.5rem, env(safe-area-inset-top))`.

## Changes

### 1. `index.html` (line 54)
Change:
```html
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```
To:
```html
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

### 2. `src/index.css` — Update `safe-top` fallback
Increase the fallback from `1.5rem` to `3.25rem` (52px) for cases where `env()` still isn't supported or returns 0 (e.g., some older Android WebViews):

```css
.safe-top {
  padding-top: max(3.25rem, env(safe-area-inset-top));
}
```

This is a two-line change. After applying it, re-adding the PWA to the home screen may be required for the meta tag change to take effect.
