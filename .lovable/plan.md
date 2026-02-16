

# Add "Featured In" and Testimonials Sections

## 1. New File: `src/components/landing/FeaturedInSection.tsx`

A horizontal logo strip showing "As Featured In" with platform names: **WedMeGood**, **WeddingWire**, **Social Samosa**. Since we don't have actual logos, we'll use styled text-based brand pills with a subtle grayscale/muted aesthetic (common pattern for "featured in" strips). Each name will be displayed in a distinct font weight inside a row, separated by dots or pipes, with a fade-in animation.

- Section header: Small uppercase "AS FEATURED IN" label
- Brand names rendered as large, semi-bold, spaced-out text in `text-muted-foreground` style -- clean and editorial
- Subtle fade-in animation on scroll

## 2. New File: `src/components/landing/TestimonialsSection.tsx`

Three testimonial cards in a responsive grid (1 column mobile, 3 columns desktop):

| Name | Role | Company Type | Quote Theme |
|------|------|-------------|-------------|
| Gaurav Bhatia | Founder | Entertainment & SFX Co. | Tracking expenses across multiple event setups |
| Abhinav Sharma | Lead Planner | Wedding Planning | Managing vendor payments and partner splits |
| Gauri Arora | Co-founder | Production House | GST exports and financial visibility |

Each card will feature:
- 5-star rating row
- Quote text in italics
- Name, role, and company in a footer area
- Avatar fallback with initials (using existing Avatar component)
- Card styling matching existing landing aesthetic: `bg-card/80 backdrop-blur-sm border ring-1 ring-primary/10` with the blue glow shadow
- Staggered entrance animations

## 3. Update: `src/pages/Landing.tsx`

- Import both new components
- Place **FeaturedInSection** right after **SocialProofSection** (stats + featured in = strong trust block)
- Place **TestimonialsSection** after FeaturedInSection, before PersonaSection
- Add SectionDividers between them

### Updated section order (around the change area):
```
SocialProofSection
SectionDivider
FeaturedInSection      <-- NEW
SectionDivider
TestimonialsSection    <-- NEW
SectionDivider
PersonaSection
```

