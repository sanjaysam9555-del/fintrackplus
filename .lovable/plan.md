

# Replace 10 Feature Images with Cropped Versions

## Overview
Replace the current full-phone screenshots with properly cropped, focused images that clearly show each feature.

## Image Mapping

| Uploaded File | Target Path | Replaces | Used For |
|---|---|---|---|
| `AI_Insights.png` | `src/assets/landing/real/ai-insights-cropped.png` | `ai-summary.png` | Smart Insights (AI) -- remaining features card |
| `Attach_Reciept.png` | `src/assets/landing/real/receipt-cropped.png` | `expense-form.png` | Receipt Capture -- remaining features card |
| `Cash_vs_Online_1.png` | `src/assets/landing/real/cash-online-cropped.png` | `home-tab.png` | Cash vs Online Split -- remaining features card |
| `Cash_vs_Online_2.png` | `src/assets/landing/real/cash-online-form.png` | (new, not currently used) | Could be added as second image or kept for future |
| `CleanShot...@2x.png` | `src/assets/landing/real/dark-mode-cropped.png` | `ai-summary-2.png` | Dark Mode + OLED -- secondary features card |
| `Dark_Mode_OLED_Mode.png` | `src/assets/landing/real/global-search-cropped.png` | `home-tab.png` | Global Search -- secondary features card |
| `Indian_Financial_Year.png` | `src/assets/landing/real/fy-cropped.png` | `income-tab.png` | Indian Financial Year -- secondary features card |
| `Part_Payment_Tracking.png` | `src/assets/landing/real/part-payment-cropped.png` | `project-sub-tab.png` | Part Payment Tracking -- showcase feature (PhoneMockup) |
| `Reccuring_Expense.png` | `src/assets/landing/real/recurring-cropped.png` | `expense-tab.png` | Recurring Transactions -- secondary features card |
| `Duplicate_Detection.png` | `src/assets/landing/real/duplicate-cropped.png` | `home-tab.png` | Duplicate Detection -- secondary features card |

## Changes to `FeaturesGrid.tsx`

1. Add 10 new imports for the cropped images
2. Update the `remainingFeatures` array:
   - Cash vs Online Split: use `cash-online-cropped.png` instead of `home-tab.png`
   - Receipt Capture: use `receipt-cropped.png` instead of `expense-form.png`
   - Smart Insights (AI): use `ai-insights-cropped.png` instead of `ai-summary.png`
3. Update the `secondaryFeatures` array:
   - Indian Financial Year: use `fy-cropped.png`
   - Recurring Transactions: use `recurring-cropped.png`
   - Duplicate Detection: use `duplicate-cropped.png`
   - Global Search: use `global-search-cropped.png`
   - Dark Mode + OLED: use `dark-mode-cropped.png`
4. Update the `showcaseFeatures` array:
   - Part Payment Tracking: use `part-payment-cropped.png` in its PhoneMockup screens
5. Since the new images are already cropped to show relevant content, reset `objectPosition` to `center` for all replaced images (the manual crop offsets are no longer needed)

## Note on `Cash_vs_Online_2.png`
This shows the Cash/Online payment method selector in a form. It can be added as a second screen in the Cash vs Online feature card if desired, or kept unused. The plan will copy it but not reference it unless you want a mini-carousel there.

## Files Changed

| File | Change |
|---|---|
| `src/assets/landing/real/` | 10 new cropped PNG files |
| `src/components/landing/FeaturesGrid.tsx` | Update imports and feature data to use new cropped images |

