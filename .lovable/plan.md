

# Fix: Social Share Preview Image + Favicon

## Problem
When you share the app link on WhatsApp (or any social platform), the preview image doesn't appear. This is because:
1. The `og:image` and `twitter:image` meta tags use **relative paths** (`/app-icon-512.png`) -- social media crawlers need full absolute URLs to fetch images
2. The favicon reference points to a PNG (`/app-icon-192.png`) while the actual favicon file is `favicon.ico`

## Solution

### 1. `index.html` -- Fix OG image to absolute URLs

Change the Open Graph and Twitter image meta tags from relative to absolute URLs:

```
Before: <meta property="og:image" content="/app-icon-512.png" />
After:  <meta property="og:image" content="https://bright-balance-beam.lovable.app/app-icon-512.png" />
```

Same for `twitter:image`.

### 2. `index.html` -- Fix favicon reference

Update the favicon link to use the actual `.ico` file that exists in the public folder, and add a PNG fallback:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="192x192" href="/app-icon-192.png" />
```

## Summary

One file changed (`index.html`), updating 3-4 meta tag values to use absolute URLs and fixing the favicon reference.

