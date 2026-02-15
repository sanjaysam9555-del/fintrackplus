

# Fix: Social Share Preview Image on WhatsApp

## Problem
Two issues preventing proper WhatsApp link previews:

1. **Wrong domain in meta tags**: All `og:url`, `og:image`, `twitter:image`, and `canonical` URLs point to `https://bright-balance-beam.lovable.app/` instead of `https://fintrackplus.com/`. WhatsApp crawlers may reject or ignore cross-domain OG images.

2. **No proper OG image**: The current OG image is `app-icon-512.png` (512x512), which is a small square icon. Social platforms like WhatsApp, Facebook, and Twitter expect a **1200x630** landscape image for rich previews.

## Solution

### Step 1: Create a proper OG image (1200x630)
- Create a dedicated `og-image.png` (1200x630px) in the `public/` folder
- This will be a simple branded card with the FinTrack+ logo, tagline, and brand colors — generated as an HTML-to-image or designed with canvas
- If creating a full image is too complex, we can use the existing `app-icon-512.png` but it won't look great

### Step 2: Update `index.html` meta tags
Update all absolute URLs to use `fintrackplus.com`:

```
canonical:      https://fintrackplus.com/
og:url:         https://fintrackplus.com/
og:image:       https://fintrackplus.com/og-image.png
twitter:image:  https://fintrackplus.com/og-image.png
```

### Step 3: Add `og:image` dimension hints
Add width/height meta tags so crawlers know the image size without downloading it:

```html
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
```

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Update canonical, og:url, og:image, twitter:image to `fintrackplus.com` domain; add og:image dimension tags |
| `public/og-image.png` | New 1200x630 OG preview image (branded card with app name + tagline) |

## Note
After publishing, WhatsApp caches link previews aggressively. You may need to wait or use a tool like [Meta's Sharing Debugger](https://developers.facebook.com/tools/debug/) to force a re-scrape.

