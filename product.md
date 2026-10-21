# Product Specification: SubTrack

<!-- SubTrack Product Specification — Privacy-First Apple HIG Subscription Manager -->

## 1. Product Overview & Vision
**SubTrack** is a high-precision, privacy-first subscription and recurring expense management Progressive Web App (PWA) designed to eliminate forgotten renewals, unexpected card charges, and subscription sprawl.

Built according to Apple Human Interface Guidelines (HIG) with a tactile "Liquid Glass" design system, SubTrack delivers an instant, offline-first experience that requires:
- **No account creation or login walls**
- **No linking of bank accounts or credentials**
- **Zero third-party tracking or telemetry**
- **100% offline data sovereignty and portable backup export**

Success is defined as: *the user gains complete, glanceable clarity on monthly recurring financial commitments in under 3 seconds and never suffers a surprise renewal charge again.*

---

## 2. Value Proposition & Key Differentiators

| Traditional Subscription Apps | SubTrack |
| :--- | :--- |
| Require bank integration (Plaid/Yodlee) exposing financial credentials | **Zero bank links required**; 100% client-side privacy |
| Require monthly subscription fees ($4.99–$9.99/mo) to track subscriptions | **100% free & open tool** with zero paywalls |
| Lock data in proprietary cloud databases | **Full data sovereignty**; 1-click JSON backup/restore & .ics calendar export |
| Slow multi-step onboarding with email verification | **Instant launch**: functional on first load with zero friction |
| Generic multi-framework web feel | **Apple HIG native mobile ergonomics**: 44pt touch targets, Dynamic Island banners, synthesized audio chimes, and haptic feedback |

---

## 3. Target Personas & Primary Use Cases

### 3.1 The Digital Professional & Freelancer
- **Context:** Manages 10+ software, AI, and cloud subscriptions (ChatGPT Plus, Claude Pro, GitHub Copilot, Figma, Google Workspace, AWS, Adobe Creative Cloud).
- **Core Need:** Needs to calculate monthly operational burn rate, anticipate annual renewal spikes, and separate business expenses from personal entertainment.
- **SubTrack Solution:** Accurate monthly cost normalization across arbitrary cycles (Monthly, Yearly, Quarterly, Biannual, Weekly), category spend charts, and tax-ready data export.

### 3.2 The Household & Family Organizer
- **Context:** Juggles family streaming plans (Netflix 4K, Spotify Family, Disney+, Apple One, YouTube Premium) and shared household utility services.
- **Core Need:** Track who pays what in split plans, avoid sudden annual renewals hitting the family debit card, and synchronize payment dates into personal calendars.
- **SubTrack Solution:** Split plan cost sharing configuration, automated renewal alerts with configurable advance days (1, 3, or 7 days before), and 1-click Google Calendar / Apple Calendar sync.

### 3.3 The Digital Minimalist & Privacy Enthusiast
- **Context:** Actively audits recurring expenses to trim financial waste; strictly avoids cloud databases and financial aggregators that sell consumer purchase habits.
- **Core Need:** Complete offline functionality, zero telemetry, and the ability to test and inspect the notification system directly.
- **SubTrack Solution:** Authoritative browser storage, real-time notification diagnostic center, and offline PWA capability with home-screen installation.

---

## 4. Feature Architecture & Core Modules

```
SubTrack Feature Architecture
├── 1. Subscription Vault (Dashboard)
│   ├── Total Monthly & Annual Burn Rate Hero
│   ├── Quick Metric Chips (Active count, Next due countdown)
│   ├── Subscription Cards with Live Next-Charge Status
│   ├── Category Filter & Quick Actions
│   └── 1-Tap "Mark as Paid" with Cycle Advancement & Confetti
│
├── 2. Smart Creation & Preset Directory
│   ├── Catalog of 30+ Verified Services (Netflix, Spotify, Apple, OpenAI...)
│   ├── Automatic Category Detection (Productivity, Entertainment, Cloud...)
│   ├── Custom Billing Cycles (Monthly, Yearly, Quarterly, Biannual, Weekly)
│   ├── Split Plans & Cost Sharing Calculator
│   └── Historical Payment Log & Direct Cancellation Links
│
├── 3. Analytics & Expense Intelligence
│   ├── Category Distribution Breakdown
│   ├── Normalized Monthly Equivalence
│   ├── Interactive Visual Billing Calendar
│   └── Spend Trajectory & Annual Commitment Projections
│
├── 4. Proactive Renewal Defense & Diagnostics
│   ├── Multi-Channel Dispatcher (In-App, Web Audio, Haptics, System Push)
│   ├── Apple-Inspired Synthetic Dual-Tone Chime (Web Audio API)
│   ├── Automated Background Renewal Scanner with Cycle Deduplication
│   ├── Live System Diagnostic Center (OS Push, AudioContext, Vibration, SW)
│   ├── 5-Second Delayed Background Simulation Test
│   └── Interactive Notification Inbox with Unread Badges
│
├── 5. Calendar & Cloud Portability (Backup & Sync)
│   ├── 1-Click .ics iCal File Export (Apple Calendar, Outlook)
│   ├── Direct Google Calendar Event Generation
│   ├── JSON Full Package Backup & Snapshot Export
│   └── Defensive JSON Import with Replace or Safe Merge Modes
│
└── 6. Native Ergonomics & Liquid Glass PWA
    ├── Apple HIG 44pt Touch Targets & Thumb-Zone Dock Navigation
    ├── Ergonomic Bottom-Right Floating Action Button (FAB)
    ├── Dynamic Island Floating Banners with Gesture Dismiss
    ├── Dark / Light Mode with Automatic System Sync
    └── Offline PWA Service Worker Shell with Zero-Latency Response
```

---

## 5. Proactive Renewal Defense System

A cornerstone feature of SubTrack is its multi-channel notification and verification system:

1. **System Push Notifications:** Triggered via the Web Notification API and Service Worker (`sw.js`). When clicked, the service worker immediately focuses or opens the SubTrack window.
2. **Apple-Inspired Synthetic Audio Chime:** Uses the browser's Web Audio API to synthesize a clean, harmonic dual-tone chime (F6 1396 Hz → A6 1760 Hz) on an exponential volume decay ramp. Operates 100% offline with zero external audio assets. Includes automatic `audioContext.resume()` handling for browser autoplay policies.
3. **Tactile Haptic Vibration:** Fires tailored vibration patterns (`[120, 80, 120]`) on supported mobile devices to provide tactile alert feedback.
4. **Dynamic Island In-App Banner:** A floating capsule banner positioned at the top of the viewport featuring subtle backdrop blur, specular borders, and spring animations.
5. **Automated Renewal Evaluation Loop:** Evaluates active subscriptions against user-configured lead times (`advanceDays`: 0, 1, 3, or 7 days) and creates deduplicated inbox alerts keyed by `sub_id + billing_cycle`.
6. **Built-in Verification & Diagnostic Center:** Allows the user to inspect real-time system permission statuses (`granted`, `denied`, `default`), test individual alert channels (sound only, haptic only, full push), run a 5-second background countdown test, and manually trigger an immediate scan.

---

## 6. Apple HIG Compliance & Design Philosophy

SubTrack is designed according to the Apple Human Interface Guidelines:
- **Liquid Glass Aesthetic:** Uses deep neutral foundations (`#09090b` / `#18181b`) paired with `backdrop-blur-2xl`, translucent white/zinc borders (`border-white/10`), and an emerald financial accent (`#10b981`).
- **44pt Touch Targets:** All tap areas (tabs, buttons, close targets, selectors) maintain a minimum footprint of 44×44 pt to prevent mis-taps on mobile devices.
- **Thumb-Zone Optimization:** The bottom floating dock hosts core screen navigation, while the primary creation button (FAB) is anchored in the bottom-right corner for effortless single-hand right-thumb access.
- **Safe Area Insets:** Fully respects `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to prevent interference from the iPhone notch, Dynamic Island, or home indicator bar.
- **Interactive Fluidity:** High-refresh micro-interactions with spring physics (`active:scale-95`), responsive press feedback, and celebratory confetti animations upon bill completion.

---

## 7. Data Storage, Security & Privacy Model

- **Authoritative Storage:** Browser `localStorage` with versioned, isolated keys.
- **Defensive Data Handling:** All imports, reads, and migrations are wrapped in schema validation with automatic sanitization and non-destructive fallbacks.
- **Zero Cloud Transmission:** Financial numbers, subscription names, payment dates, and payment history never leave the client device.
- **Portable JSON Architecture:** Every backup exports a standardized JSON schema containing version tags, export timestamps, subscription arrays, notification configurations, and notification item histories.

---

## 8. Success Metrics & Quality Standards

- **Time-to-Value:** A user can launch the app and add their first subscription in under 15 seconds.
- **Glanceability:** Total monthly spend and upcoming renewal dates are readable in under 3 seconds.
- **Reliability:** 100% offline operability with zero network fetch dependencies for core tracking, audio chimes, and backup operations.
- **Accessibility:** Meets WCAG AA contrast standards across both Dark and Light themes with full keyboard and screen reader accessibility.
