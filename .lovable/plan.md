

## Optimize Desktop Settings Layout for Better Visual Balance

### What I found
The current desktop layout is still visually uneven because it uses two long vertical stacks with very different content heights:

- **Left column**: Profile + Learn Features + large Data Management card
- **Right column**: smaller utility cards + footer buttons

That creates:
- mismatched column lengths
- awkward empty space
- an odd standalone footer area for **Install App** and **Sign Out**

Also, **Install App** is redundant on desktop/laptop, so it should not take visual space there.

### Plan

**`src/components/SettingsPage.tsx`**

1. **Rebuild the desktop layout into a more structured 2-column composition**
   - Keep **mobile unchanged**
   - For `md+`, replace the current “two uneven vertical stacks” with a cleaner desktop grid made of paired rows/cards so both sides feel balanced

2. **Use more intentional desktop grouping**
   - **Top row**: Profile card + Learn App Features
   - **Main settings row**: Data Management on one side, Team/Approvals + Backup on the other
   - **Utility rows**: Default Time Frame, Appearance, Sync, and Sign Out arranged as matched desktop cards instead of one long leftover stack

   This avoids comparing two giant columns of different heights and makes the page feel more symmetrical.

3. **Remove Install App on desktop**
   - Hide/remove the **Install App** section for `md+`
   - Keep it available on **mobile/tablet-as-app** only if needed there

4. **Reposition Sign Out so it feels intentional**
   - Remove it from the odd footer treatment
   - Place it inside the desktop grid as a proper utility/action card or matched row item, so it aligns with the rest of the settings layout

5. **Standardize spacing and card heights**
   - Use shared wrappers/classes for desktop cards
   - Apply consistent padding, gaps, and `h-full` where paired cards should align
   - Ensure the grid stretches cleanly to the right edge without irregular whitespace

6. **Keep role-based visibility intact**
   - Preserve existing permission logic for Team, Backup, Reports, etc.
   - Make sure the desktop layout still looks balanced even when some sections are hidden for different roles

### Expected result
On desktop/laptop:
- the settings page will feel **balanced and symmetrical**
- cards will look more intentionally arranged
- the right side will no longer have awkward leftover spacing
- **Install App** will be gone from desktop
- **Sign Out** will feel properly placed instead of floating oddly below the layout

### File to modify
| File | Change |
|---|---|
| `src/components/SettingsPage.tsx` | Recompose desktop-only settings layout into balanced paired rows/cards, remove desktop Install App section, reposition Sign Out |

### Technical note
I would likely extract small render helpers for repeated settings cards/menu cards inside `SettingsPage.tsx` so the desktop/mobile structure can change without duplicating all the card markup.

