
# Add "Learn About App Features" Section in Settings

## Overview
A new tappable card is added between the Profile section and the Data Management section in Settings. Tapping it opens a full-screen "App Features" page within the Settings flow, showcasing all app capabilities in an aesthetically pleasing, scrollable layout with icons, descriptions, and real screenshots.

## What the User Sees
- A new card between the profile and Data Management that says **"Learn App Features"** with a subtitle like "Discover what you can do" and a Sparkles icon
- Tapping it opens a dedicated in-app features guide page (not the landing page -- this is a streamlined, in-app version)
- The page groups features into sections (Core, Finance Tools, Smart Features, Customization) with icons, titles, short descriptions, and real app screenshots
- A back button returns to Settings

## Technical Changes

### 1. Add `features` to SettingsSection type
**File:** `src/components/SettingsPage.tsx`
- Extend the `SettingsSection` type to include `'features'`
- Add the tappable card between the Profile Card block and the Menu Sections block (a standalone styled card, not inside the Data Management group)
- Add a conditional render block for `activeSection === 'features'` that renders the new `AppFeaturesGuide` component

### 2. Create the App Features Guide component
**File:** `src/components/settings/AppFeaturesGuide.tsx` (new)
- A full-page scrollable component with a back button header
- Reuses the same real screenshot assets already in `src/assets/landing/real/`
- Feature sections organized into groups:
  - **Core Features**: Projects, Partners, Categories, Vendors, Labels
  - **Finance Tools**: Cash vs Online split, Part Payments, GST Tagging, Recurring Transactions, Reports
  - **Smart Features**: AI Insights, Global Search, Duplicate Detection, Undo Delete
  - **Customization**: Dark Mode / OLED, Receipt Capture, Financial Year
- Each feature rendered as a compact card with icon, title, one-line description, and an optional screenshot thumbnail (tappable to expand)
- Uses existing `motion` animations consistent with the rest of the app
- No phone mockups (those are for the landing page) -- uses clean card-based layout optimized for in-app viewing

### 3. Files Summary

| File | Action |
|------|--------|
| `src/components/SettingsPage.tsx` | Add `'features'` to section type, add card between profile and data management, add render block |
| `src/components/settings/AppFeaturesGuide.tsx` | New component -- full feature guide page |
