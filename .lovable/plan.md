

# Improve Onboarding Flow: Better Transaction Guidance and Setup Suggestion

## Problem
1. The "Track Your Transactions" step (step 2) only says "Tap the + button" but doesn't explain that the same form lets you toggle between Income and Expense, which is confusing for first-time users.
2. There's no step suggesting the user set up Projects, Vendors, and Categories first before logging transactions -- this is a key first step for getting the most out of the app.

## Changes

### `src/components/OnboardingFlow.tsx`

**1. Rewrite the "Track Your Transactions" step (step 2) description and add a visual mini-mockup**

Update the description to clearly explain:
- Tap the + button at the bottom dock
- Use the toggle at the top of the form to switch between Expense and Income
- Add a small inline visual showing the Expense/Income toggle (two styled pill buttons inside the onboarding card) so users know what to look for

**2. Add a new "Set Up First" step after the welcome step (new step 2, pushing others down)**

This step will:
- Use a `Settings` (or `SlidersHorizontal`) icon
- Title: "Set Up Your Workspace"
- Description: "Before you start tracking, head to Settings to add your Projects, Vendors, and Categories. This helps you organize entries from day one."
- Include three mini icon-label rows (Project, Vendor, Category) inside the card to visually reinforce what to set up

### Updated step order:
1. Welcome
2. **Set Up Your Workspace** (NEW)
3. Track Your Transactions (improved description + toggle visual)
4. View AI Insights
5. Organize with Projects
6. Stay Notified
7. Choose Your Look (theme)
8. Install the App

### Visual additions inside the card (no new files needed):

**"Set Up Your Workspace" step** -- a small list of 3 items:
- FolderKanban icon + "Add Projects (e.g., Wedding, Renovation)"
- Store icon + "Add Vendors (e.g., suppliers, freelancers)"
- Grid3X3 icon + "Add Categories (e.g., Travel, Catering)"

**"Track Your Transactions" step** -- a mini toggle mockup:
- Two rounded pill buttons labeled "Expense" (red) and "Income" (green) rendered inline to show the user what the toggle looks like in the actual form

### Technical approach:
- Add a `SetupSuggestion` inline component rendered conditionally when `currentStep` matches the setup step index
- Add a `TransactionTogglePreview` inline component rendered conditionally when `currentStep` matches the transaction step index
- Update `baseSteps` array to include the new step and updated description
- Adjust `isThemeStep` index calculation (it's already dynamic via `baseSteps.length`)
- Import `Store`, `Grid3X3`, `SlidersHorizontal` icons from lucide-react

