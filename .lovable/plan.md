

## Fix Sidebar and Content Height Mismatch on Tablet

### Problem
The sidebar uses `h-screen` (CSS `height: 100vh`) while the main content area uses `h-dvh` (CSS `height: 100dvh`). On tablets — especially iOS with dynamic toolbars — `100vh` and `100dvh` resolve to different pixel values, causing the two panels to have mismatched heights.

### Fix
Align both to use `h-dvh` consistently.

### Files to modify

| File | Change |
|---|---|
| `src/components/DesktopSidebar.tsx` | Change `h-screen` → `h-dvh` on the `<motion.aside>` element |

Single line change — `className` on line 66.

