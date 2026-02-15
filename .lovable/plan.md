
# Fix: Replace Lovable Favicon with FinTrack+ Brand Icon

## Problem
The `public/favicon.ico` file is the default Lovable logo (heart icon). The `index.html` references this file, so the browser tab shows the Lovable brand instead of FinTrack+.

## Solution

### `index.html`
Update the favicon `<link>` tag to use the existing FinTrack+ app icon (`app-icon-192.png`) instead of the default `favicon.ico`:

```html
<!-- Before -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" />

<!-- After -->
<link rel="icon" type="image/png" sizes="192x192" href="/app-icon-192.png" />
```

This reuses the existing branded icon already in the project -- no new files needed. The `.ico` file can remain but will no longer be referenced.

### Files Changed

| File | Change |
|------|--------|
| `index.html` | Update favicon link to point to `/app-icon-192.png` |
