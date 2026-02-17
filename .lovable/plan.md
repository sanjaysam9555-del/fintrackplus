

# Add "Saffron Events" Branding + Logo

## Overview

Add the Saffron Events logo and "An App By Saffron Events" branding in two places, and enhance the existing splash screen branding.

## Changes

### 1. Copy the uploaded logo to the project

Copy `user-uploads://final_logo.png` to `src/assets/saffron-logo.png` for use in components.

### 2. `src/components/SettingsPage.tsx` -- Add branding below Sign Out

After the Sign Out button and before the existing "App Info" section, add:

```
An App By [Saffron Logo] Saffron Events
```

- The logo will be white in dark/OLED mode (using CSS `brightness(0) invert(1)` filter) and saffron-colored (natural) in light mode.
- Styled subtly: small text, muted foreground color, not intrusive but visible.

### 3. `src/components/SplashScreen.tsx` -- Enhance branding visibility

The current "An App By Saffron Events" text is too subtle (`text-muted-foreground/60`). Changes:
- Increase opacity from `/60` to full muted-foreground
- Add the Saffron Events logo (small, ~20px height) next to the text
- Make the text slightly larger (from `text-xs` to `text-sm`)
- Apply the same theme-aware color treatment to the logo (white for dark/OLED, saffron for light)

### 4. `src/components/DesktopSidebar.tsx` -- Add branding at bottom

After the Sign Out button at the bottom of the sidebar, add the same "An App By Saffron Events" with logo, matching the settings page styling.

## Theme-Aware Logo Coloring

The uploaded logo has a saffron/warm red color on a white background. To handle themes:
- **Light mode**: Show the logo as-is (natural saffron color)
- **Dark / OLED mode**: Apply CSS filter `brightness(0) invert(1)` to make it white

This avoids needing two separate logo files.

## Visual Hierarchy

The branding will be:
- Small and subtle -- never competing with primary content
- Positioned at the very bottom of scrollable areas (footer position)
- Using muted colors that blend with the UI but are clearly readable

