

# Fix: Brand Colors and Logo in Password Reset Email

## Problem
Two issues with the current email template:

1. **Wrong colors**: The email uses orange (`#f97316`) for the header gradient and button, but your app's primary brand color is **Denim Blue** (`hsl(214, 78%, 40%)` -- approximately `#1665B8`).
2. **Missing logo**: The logo URL points to a storage bucket file (`avatars/fintrack-logo.png`) that doesn't exist, so the image appears broken in the email.

## Fix

### 1. Update `supabase/functions/send-email/index.ts`

**Logo**: Replace the broken storage URL with the publicly accessible app icon from your published site:
```
https://bright-balance-beam.lovable.app/app-icon-192.png
```

**Colors**: Replace all orange references with Denim Blue brand colors:
- Header gradient: `#f97316` / `#ea580c` (orange) --> `#1665B8` / `#114E91` (denim blue)
- Button gradient: same change
- Footer link color: `#f97316` --> `#1665B8`

No other files need to change -- only the email HTML template inside the edge function.

### Technical Details

The color mapping:
- `#1665B8` -- primary denim blue (matches `hsl(214, 78%, 40%)`)
- `#114E91` -- darker shade for gradient depth
- These match the `--primary` CSS variable used throughout the app

After updating, the function will be redeployed so the next password reset email will arrive with the correct blue branding and a visible logo.
