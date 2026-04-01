

## Create FinTrack⁺ Brand Guidelines PDF

### What
Generate a professional, presentation-sized (16:9) brand guidelines PDF with 6 pages covering all visual identity elements.

### Pages
1. **Cover** — Dark background with FinTrack⁺ logotype, "Brand Identity Guidelines" subtitle, Saffron Events attribution
2. **Color Palette** — Primary blues (Denim Blue #1665B8, Glow #1A7AE6, Dark #114E91) + semantic colors (Success #22C55E, Expense #E53E3E, Warning #F59E0B) + background colors
3. **Typography** — Inter typeface specimen with weight scale (400–700) and type scale (10px–36px) with usage guidance
4. **Visual Language** — Border radius system (12–24px), shadow elevation layers, glassmorphism properties (blur, opacity, borders)
5. **Theme System** — Split-page light/dark comparison with all CSS token values + OLED black mode
6. **Iconography & Spacing** — Lucide React icon rules, spacing scale, container constraints, animation timings

### Technical approach
- Python script using **reportlab** for PDF generation
- Fonts: InstrumentSans (headers) + IBM Plex Mono (code/hex values) from canvas-design skill
- Page size: 13.333" × 7.5" (16:9 presentation format)
- Color swatches rendered as rounded rectangles with hex codes and usage labels
- Output to `/mnt/documents/FinTrack_Brand_Guidelines.pdf`
- QA via `pdftoppm` conversion and visual inspection of all 6 pages

### Files
| Output | Description |
|---|---|
| `/mnt/documents/FinTrack_Brand_Guidelines.pdf` | 6-page brand guidelines document |

