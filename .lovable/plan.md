

# Enhanced Onboarding + Install Guide in Settings

## Overview
Enhance the first-time user experience by adding an install instruction step at the end of the onboarding walkthrough, and add a "How to Install" button in Settings for returning users.

## Changes

### 1. `src/components/OnboardingFlow.tsx` -- Add install step as the final slide

Add a 6th step to the onboarding flow with a Download/Smartphone icon that explains how to install the app. This step will:
- Auto-detect the user's device (iOS/Android/Desktop) using the same detection logic from `Install.tsx`
- Show device-specific install instructions inline (e.g., "Tap Share > Add to Home Screen" for iOS)
- Change the final button text from "Get Started" on step 5 to step 6
- Step 5 (Notifications) becomes a regular middle step; Step 6 (Install) becomes the new final step with "Get Started"
- If the app is already installed (standalone mode), skip showing the install details and just say "You're all set!"

### 2. `src/components/SettingsPage.tsx` -- Add "How to Install" button

Add a new item in the Settings page between the Appearance section and the Sign Out button:
- Icon: Download
- Label: "Install App"
- Sublabel: "Add to home screen"
- Clicking it navigates to the existing `/install` page (or `/application/install` via `appPath`)
- If already installed, show sublabel as "Already installed" with a checkmark

This requires importing `useNavigate` and `appPath` into SettingsPage.

### 3. No changes to `Install.tsx`
The existing Install page remains as-is for direct access.

## Summary

| File | Change |
|------|--------|
| `OnboardingFlow.tsx` | Add 6th install step with device detection and inline instructions |
| `SettingsPage.tsx` | Add "Install App" menu item linking to the install page |

Total: 2 files modified.
