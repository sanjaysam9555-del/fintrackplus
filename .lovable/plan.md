

## Fix: PDF Report Unreadable in Dark/OLED Mode

**Problem**: The PDF report is rendered inside an `<iframe>` with `srcDoc`. The iframe inherits no explicit background — in dark/OLED mode the iframe's body background defaults to the browser's dark canvas, making the light-gray alternating rows (`#f9fafb`) and dark text (`#1f2937`) appear as dark-on-dark.

**Root cause**: The PDF HTML template hardcodes text color (`#1f2937`) but never sets `background: white` on the `<body>` or `<html>` element. Browsers in dark mode may apply a dark default background to iframes.

**Fix** (single file change):

**`src/components/settings/ReportsSection.tsx`** — In the PDF HTML template's `<style>` block, add explicit white backgrounds:

- `html, body` → add `background: #ffffff;`  
- This ensures the report always renders with a light background regardless of the app's theme, since it's a printable financial document.

That's it — one line addition. The text color (`#1f2937`), alternating row color (`#f9fafb`), meta background (`#f9fafb`), and stat boxes are all light-theme colors already. They just need the base background anchored to white.

