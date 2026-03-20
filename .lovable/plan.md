

## iPad Home-Screen App: Fix Sidebar/Main Top Mismatch

### What I found
The earlier fix standardized column height with `h-dvh`, but the remaining mismatch is now coming from **top safe-area handling**, not just height.

- The **right section** uses the shared `safe-top` utility on headers (`Dashboard`, `Settings`, etc.).
- The **left desktop sidebar** does **not** use the same top inset.
- In iPad standalone/home-screen mode, `safe-top` becomes much larger, so the right side gets pushed down while the sidebar stays higher.

That is why it still looks misaligned on iPad when opened from the home screen.

### Plan
1. **Centralize the top inset value**
   - Update `src/index.css` so the top safe-area spacing is driven by one shared value/utility for standalone mode.
   - Keep the current standalone behavior, but make it reusable so both columns rely on the exact same inset logic.

2. **Apply the same top inset to the desktop sidebar**
   - Update `src/components/DesktopSidebar.tsx` so the sidebar’s top profile/header area uses the same safe-area offset as the right content.
   - This will align the visible start of both columns in iPad standalone mode.

3. **Harden the desktop/tablet split layout**
   - Update `src/pages/Index.tsx` so the outer split layout consistently uses dynamic viewport sizing on both sides, avoiding mixed viewport calculations in installed-PWA mode.

4. **Regression-check the main desktop/tablet screens**
   - Ensure the fix still looks correct on:
     - Dashboard
     - Settings
     - Team
     - other right-side pages that already use `safe-top`

### Files to modify
| File | Change |
|---|---|
| `src/index.css` | Share/normalize top safe-area spacing for standalone mode |
| `src/components/DesktopSidebar.tsx` | Apply matching top inset to sidebar top section |
| `src/pages/Index.tsx` | Tighten the split-layout viewport sizing so both panes stay in sync |

### Expected result
On iPad when the app is launched from the home screen:
- the **left sidebar top content**
- and the **right page header/content start**

will line up properly instead of appearing offset.

