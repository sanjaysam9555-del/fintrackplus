## Add Meta Pixel Tracking

Install the Meta Pixel (ID: `913489805027360`) for `PageView` tracking across the site.

### Where it goes

Add the script to `index.html` so it loads on every page (landing, auth, app).

### Placement rules (per project directives)

- The `<script>` block goes inside `<head>` — safe, standard placement.
- The `<noscript><img/></noscript>` fallback **must NOT go in `<head>`** (HTML5 only allows metadata tags inside `<noscript>` in head). It must be placed at the **start of `<body>`**.

### Changes to `index.html`

1. Inside `<head>`, just before the closing `</head>` (after the existing `<script>` theme block stays where it is — that block is in `<body>` already, so this goes after the manifest link):

   ```html
   <!-- Meta Pixel Code -->
   <script>
   !function(f,b,e,v,n,t,s)
   {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
   n.callMethod.apply(n,arguments):n.queue.push(arguments)};
   if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
   n.queue=[];t=b.createElement(e);t.async=!0;
   t.src=v;s=b.getElementsByTagName(e)[0];
   s.parentNode.insertBefore(t,s)}(window, document,'script',
   'https://connect.facebook.net/en_US/fbevents.js');
   fbq('init', '913489805027360');
   fbq('track', 'PageView');
   </script>
   <!-- End Meta Pixel Code -->
   ```

2. At the start of `<body>` (right after the opening `<body>` tag, before the existing theme script):

   ```html
   <!-- Meta Pixel (noscript fallback) -->
   <noscript><img height="1" width="1" style="display:none"
   src="https://www.facebook.com/tr?id=913489805027360&ev=PageView&noscript=1"
   /></noscript>
   ```

### Notes

- Single-page app caveat: `fbq('track', 'PageView')` only fires on initial HTML load, not on client-side route changes. For now this matches the snippet you shared (PageView on load). If you later want PageView to fire on each in-app route change (e.g. `/`, `/billing`, `/application`), I can add a small React Router listener that calls `window.fbq?.('track', 'PageView')` on every location change.
- The pixel script is async and will not block render — no impact on the flicker fixes already in place.
- No CSP/headers changes needed; `connect.facebook.net` and `facebook.com/tr` are loaded directly by the browser.

### Files to edit

- `index.html` — add the two snippets in the locations above.

Do you also want me to wire up automatic SPA route-change PageView tracking, or keep it strictly to this snippet?
