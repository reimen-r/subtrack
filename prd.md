# PRD: SubTrack — Subscription & Renewal Management PWA

## 1. Executive Summary & Product Vision
**SubTrack** is a high-performance, privacy-centric Progressive Web App (PWA) designed to give users total control over their recurring digital subscriptions, licenses, and periodic expenses. Built with Apple Human Interface Guidelines (HIG) aesthetics and a tactile "Liquid Glass" design system, SubTrack delivers an instant, offline-first experience that eliminates forgotten renewals, unexpected billing charges, and subscription fatigue—without requiring account registration, third-party tracking, or cloud lock-in.

---

## 2. Problem Statement & Target Audience

### 2.1 The Problem
- **Subscription Sprawl:** The average digital consumer manages 8–15 recurring subscriptions across streaming, productivity, cloud storage, utilities, and memberships.
- **Renewal Blindness:** Surprise renewals regularly charge cards without warning because renewal dates are scattered across disparate platforms.
- **Privacy Intrusion:** Existing subscription managers require connecting banking credentials (Plaid/Yodlee), storing sensitive financial credentials on remote servers, or paying monthly subscription fees to track subscriptions.
- **Cumbersome Onboarding:** Heavy SaaS solutions require user accounts, email confirmations, and complex setups before providing utility.

### 2.2 Target Personas
1. **The Digital Professional / Freelancer:** Manages numerous SaaS tools (GitHub, Figma, Google Workspace, Adobe, Claude/ChatGPT) and needs to track recurring monthly burn rates and plan tax deductions.
2. **The Household Financial Optimizer:** Manages streaming services, utilities, family plans, and shared iCloud/Spotify accounts; needs reminder alerts before annual/monthly renewals hit.
3. **The Privacy-Conscious User:** Refuses to link bank accounts or upload financial data to third-party cloud servers; demands local-first storage and complete export portability.

---

## 3. Product Principles
1. **Zero-Friction Utility:** Works immediately on load. No sign-up walls, no account creation, and zero onboarding roadblocks.
2. **Tactile Glancability:** Key metrics (monthly equivalent cost, days until next charge, category distributions) are understood within 3 seconds.
3. **Absolute Data Sovereignty:** Data belongs entirely to the user. Stored locally in the browser, exportable/importable via JSON and transferable at will.
4. **Native iOS & Mobile Ergonomics:** Complies strictly with Apple HIG touch standards, safe area insets (`env(safe-area-inset)`), responsive thumb-zone navigation, and 120Hz smooth animations.
5. **Robust Offline Reliability:** Full functionality without an active internet connection via service worker caching and client-side audio/data synthesis.

---

## 4. Key Functional Requirements & Capabilities

### 4.1 Subscription Management & Catalog
- **CRUD Operations:** Create, view, edit, pause, and delete recurring subscriptions.
- **Service Catalog Presets:** Pre-loaded directory with verified metadata (logos, brand colors, frequencies, pricing, and direct cancellation URLs) for Netflix, Spotify, iCloud, YouTube Premium, ChatGPT Plus, Prime Video, Adobe Creative Cloud, Disney+, GitHub, and more.
- **Custom Service Creation:** Ability to configure bespoke subscriptions with custom colors, category, payment methods, notes, and cycle frequency.
- **Flexible Billing Frequencies:** Support for Monthly, Yearly, Quarterly, Biannual, and Weekly cycles with automatic monthly cost normalization.
- **Split Plans & Cost Sharing:** Support for shared subscriptions (e.g., Family plans) with custom participant allocation and calculation of real user share.
- **Payment History & Tracking:** Record of individual payments with timestamps, amounts, and statuses (paid, pending, refunded) plus price change history tracking.

### 4.2 Automated Category Detection
- **Instant Keyword Classification:** Automatically detects service categories during creation (e.g., Entertainment, Productivity, Cloud, Software, Health & Fitness, Utilities, Other) based on keywords and domain names.

### 4.3 Analytics & Financial Intelligence
- **Total Burn Rate Overview:** Real-time monthly equivalent cost and projected annual spend.
- **Category Spend Distribution:** Visual distribution with proportional breakdown and color accents.
- **Interactive Renewal Calendar:** Visual monthly calendar showing specific payment dates, with days containing renewals highlighted and inspectable on tap.
- **Cost Normalization:** Converts yearly or quarterly billing into unified monthly equivalents for apples-to-apples comparisons.

### 4.4 Notifications & Verification Suite
- **Multi-Channel Notification Architecture:**
  - **In-App Dynamic Island Banners:** Top floating banner with Apple-style backdrop blur and micro-interactions.
  - **Synthetic Audio Chimes:** Instant dual-tone harmonic audio (F6 1396Hz → A6 1760Hz) generated via Web Audio API without external audio files.
  - **Haptic Vibration Feedback:** Native vibration patterns (`navigator.vibrate`) on supported mobile devices.
  - **System Push Notifications:** OS-level notifications via browser Notification API and Service Worker for desktop and PWA installations.
- **Automated Renewal Scanning:** Background evaluation of `nextBillingDate` against user-configured `advanceDays` (Same day, 1 day, 3 days, 1 week before).
- **Notification Verification Center:**
  - Real-time diagnostics for OS permissions, AudioContext, Vibration API, and Service Worker.
  - Interactive all-in-one test trigger.
  - 5-second background simulation test with countdown for locked-screen / minimized testing.
  - Alerts inbox with read/unread tracking, direct jump to subscription, and individual deletion.

### 4.5 Data Portability & Calendar Sync
- **Local JSON Backup & Restore:** Complete backup generation with metadata, snapshots, and merge/replace restoration options.
- **Calendar Export:** Direct `.ics` file generation and Google Calendar deep links to add renewal reminders directly into user calendars.
- **Sample Data & Reset:** Ability to populate rich demo data or reset to a clean blank slate instantly.

### 4.6 Progressive Web App (PWA)
- **Installability:** Web App Manifest with standalone display mode, high-resolution icons (192x192, 512x512, maskable), and install prompt.
- **Offline Cache:** Service Worker precaching critical assets with stale-while-revalidate and network-first strategies.
- **Offline Indicator:** Visual non-intrusive status pill when network is disconnected.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **First Contentful Paint (FCP):** < 0.8s on 4G mobile connections.
- **Time to Interactive (TTI):** < 1.2s.
- **Bundle Size:** Zero large heavy runtime libraries; lightweight asset footprint.
- **Interaction Responsiveness:** Instant UI response (< 50ms) to taps with immediate active feedback.

### 5.2 Accessibility & Usability (WCAG 2.1 AA)
- Minimum 44x44px touch target on all interactive controls.
- High contrast ratios (exceeding 4.5:1) in both Dark and Light themes.
- Comprehensive `aria-*` tags, modal focus trapping, and screen-reader announcements.
- Dynamic font scaling compatibility with system font preferences.

### 5.3 Security & Privacy
- **Zero Telemetry:** No user analytics trackers, Google Analytics, or third-party tracking scripts.
- **Zero External Financial Transmission:** All calculations occur strictly in browser memory and local storage.
- **Safe Sandboxing:** Strict HTTPS context and Content Security Policy compliant.

---

## 6. Success Metrics & KPIs
1. **Core Action Completion Time:** User can add an existing subscription in < 15 seconds.
2. **Renewal Awareness Rate:** Zero missed renewal alerts for tracked subscriptions.
3. **PWA Adoption:** Clean installation experience across iOS (Add to Home Screen) and Android (PWA prompt).
4. **Data Reliability:** 100% integrity across backup export/import cycles with zero data corruption.
