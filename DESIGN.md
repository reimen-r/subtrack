---
name: SubTrack
description: Sleek, high-performance financial subscription manager engineered for tactile clarity and native iOS ergonomics.
colors:
  primary: "#10b981"
  primary-hover: "#059669"
  accent-glow: "rgba(16, 185, 129, 0.2)"
  dark-bg: "#09090b"
  dark-surface: "#18181b"
  dark-surface-elevated: "#27272a"
  dark-border: "#27272a"
  dark-text: "#f4f4f5"
  dark-text-muted: "#a1a1aa"
  light-bg: "#f8fafc"
  light-surface: "#ffffff"
  light-surface-elevated: "#f1f5f9"
  light-border: "#e2e8f0"
  light-text: "#0f172a"
  light-text-muted: "#64748b"
  danger: "#ef4444"
  warning: "#f59e0b"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-surface:
    backgroundColor: "{colors.dark-surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System

## Overview
SubTrack is built on a design philosophy called **"The Tactile Vault"**: an ultra-responsive, privacy-centric financial dashboard that feels as solid and snappy as a native iOS utility. The aesthetic balances deep zinc tones with luminous emerald indicators, giving the user immediate reassurance and total visual control over recurring obligations.

### Aesthetic Principles
1. **Precision Glancability:** Every metric (monthly burn, days until charge, total active count) is readable within milliseconds.
2. **Tactile Haptic Feel:** Every button, tab, and card reacts immediately to touch with active scaling (`active:scale-95`) and minimum 44px hit-targets.
3. **Adaptive Environmental Awareness:** Native consideration for dynamic iOS viewports, safe area insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`), and seamless transition between Dark and Light modes.

## Colors
- **Primary / Emerald Accent:** `#10b981` (primary button, success indicators, recurring active badges), `#059669` (pressed/hover).
- **Foundation Dark:** `#09090b` (canvas background), `#18181b` (card surfaces), `#27272a` (borders and elevated chips).
- **Foundation Light:** `#f8fafc` (canvas background), `#ffffff` (card surfaces), `#e2e8f0` (borders and separator lines).
- **Typography Scale:** `#ffffff` and `#f4f4f5` for high-contrast dark headings; `#a1a1aa` / `#71717a` for secondary metadata and timestamps.
- **Semantic Feedback:** `#ef4444` (due today / renewal cancellation warnings), `#f59e0b` (due within 3 days).

## Typography
SubTrack utilizes the Apple San Francisco (`SF Pro Display` / `SF Pro Text`) and system font hierarchy with tight letter tracking for numerical clarity.
- **Display (`clamp(1.75rem, 5vw, 2.5rem)`, weight 700):** Prominent monthly commitments and total spend hero figures.
- **Headline (`1.25rem`, weight 600):** Section titles, modal headers, service names.
- **Body (`0.9375rem`, weight 400):** Subscription descriptions, setting options, category tags.
- **Label / Micro (`0.75rem`, weight 500/600):** Countdown tags ("Due in 2 days"), cycle indicators, currency labels. Tabular nums are enforced for currency figures.

## Layout
- **Mobile-First Responsive Grid:** Optimized for single-hand mobile usage with bottom thumb-zone priority.
- **Safe Area Insets:** Strict enforcement of CSS environment variables:
  - Header: `padding-top: max(16px, env(safe-area-inset-top))`.
  - Bottom Navigation Bar: `padding-bottom: max(12px, env(safe-area-inset-bottom))`.
  - Screen containers: `min-height: 100dvh` (preventing iOS Safari viewport jumping during URL bar collapse).
- **Spacing Rhythm:** Based on an 8px baseline grid (8px, 16px, 24px, 32px) maintaining consistent horizontal gutters.

## Elevation & Depth
- **Tonal Layering:** The primary depth model is luminance and border hierarchy rather than heavy artificial drop shadows.
- **Frosted Glass:** Floating bottom navigation and top sticky headers use `backdrop-blur-xl bg-zinc-950/80` with a 1px boundary stroke (`rgba(255,255,255,0.08)` in Dark mode, `rgba(0,0,0,0.06)` in Light mode).
- **Interactive Depth:** Cards lift subtly on hover (`hover:border-zinc-700/80`), modals enter with spring transitions and high-radius backdrops.

## Shapes
- **Squircles & Continuous Curves:** Deep corners (`rounded-2xl` 16px and `rounded-3xl` 24px) reflecting iOS standard radii.
- **Status Pills:** Continuous `rounded-full` pills for badges, filter categories, and payment cycles.

## Components
- **Floating Bottom Nav Dock:** Compact pill floating above the bottom safe area with active tab illumination and haptic spring feel.
- **Subscription Card:** High-information-density card featuring service logo, billing cadence badge, next renewal countdown, and quick-action menu.
- **Action Buttons:** Large 48px height, vibrant emerald background, white text, smooth rounded corners, active scale compression on tap.
- **Modal Sheets:** Slide-up bottom sheets on mobile devices with rounded top corners (`rounded-t-3xl`), auto-focus, and safe keyboard dismissal.

## Do's and Don'ts
### Do's
- Always respect `env(safe-area-inset-*)` on all full-screen views and fixed/sticky elements.
- Maintain minimum 44px x 44px tap targets for every touch control.
- Use `tabular-nums` for all currency amounts and countdown timers to prevent layout jitter.
- Provide immediate active feedback (`active:scale-95`) on every touchable surface.

### Don'ts
- Never use fixed 100vh on mobile; always use `100dvh` or dynamic viewport sizing.
- Never place critical action buttons flush against the bottom edge without safe area padding.
- Never use generic low-contrast gray text on dark cards; maintain WCAG AA contrast.
- Never allow modal dialogs to be obscured by the virtual keyboard.
