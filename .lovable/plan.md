
# Replace OG Image

## What
Replace the current generated `public/og-image.png` with the uploaded branded image (blue background with FinTrack+ logo).

## Change
| File | Action |
|------|--------|
| `public/og-image.png` | Overwrite with the uploaded `FinTrack_1.png` image |

No other changes needed -- the `index.html` meta tags already point to `/og-image.png` with the correct domain and dimensions.

## After Publishing
WhatsApp and other platforms cache previews aggressively. After publishing, use [Meta's Sharing Debugger](https://developers.facebook.com/tools/debug/) to force a re-scrape of `https://fintrackplus.com/`.
