# Product
<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Individuals, digital subscribers, freelancers, and households managing recurring payments (streaming services, cloud subscriptions, software licenses, memberships, utilities) who need to prevent surprise renewals, visualize true monthly and annual commitments, and optimize spending across billing cycles.

## Product Purpose
SubTrack empowers users to effortlessly track, analyze, and manage all recurring subscriptions and bills in one fluid, private, and high-performance mobile-first application. Success means zero forgotten renewals, clear budget awareness, and instant control over recurring finances.

## Positioning
An ultra-fast, privacy-centric PWA subscription tracker that works completely offline with zero forced accounts, immediate calendar synchronization (.ics & Google Calendar), JSON backup portability, and native-feeling touch ergonomics specifically crafted for iOS Safari and mobile viewports.

## Operating Context
Used primarily on mobile devices (iOS Safari, Android Chrome, and installed PWA home-screen app) as well as desktop browsers. Typical interactions include quick 10-second checks on upcoming renewals, adding new subscriptions, checking monthly totals, and setting reminder alerts before renewal charges hit.

## Capabilities and Constraints
- **Tracking & Calculation:** Real-time calculation of monthly, annual, and weekly recurring burn rates; category-based expenditure breakdowns.
- **Renewal Alarms & Reminders:** Configurable advance notification alerts (1 day, 2 days, 3 days, 1 week before renewal) and in-app banners.
- **Calendar & Cloud Sync:** Direct export to iCal/Google Calendar events for renewal tracking in personal agendas.
- **Data Sovereignty:** Offline-first local storage with complete JSON backup, export, and restore capabilities.
- **Service Directory:** Pre-loaded catalog of popular services (Netflix, Spotify, GitHub, iCloud, ChatGPT, etc.) with custom icon, color, and cycle presets.
- **Platform Ergonomics:** Safe area handling (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`), Apple HIG 44px minimum tap targets, active touch feedback, and smooth 120Hz scrolling on iOS WebKit.

## Brand Commitments
- Deep dark slate/zinc foundation (`#09090b`, `#18181b`, `#27272a`) with crisp contrast and polished Light mode counterpart.
- Emerald highlight accent (`#10b981`) denoting financial clarity and health.
- Clear typography utilizing system-ui / Inter font stack with legible numeric hierarchy.

## Evidence on Hand
- Complete catalog presets in `src/data/presets.ts`.
- Calendar generation in `src/utils/calendarExport.ts`.
- Backup/restore schema and validation in `src/utils/backupService.ts`.
- PWA manifest, service worker registration, and icons in `public/` and `src/utils/usePWAInstall.ts`.

## Product Principles
1. **Zero Friction & Instant Utility:** Starts instantly without login gates or onboarding roadblocks; data is stored securely and directly in the browser.
2. **Glanceable Financial Awareness:** Present monthly commitments and renewal timelines with unambiguous clarity in under 3 seconds.
3. **Tactile & Responsive Native Feel:** Fluid micro-interactions, zero tap lag, resilient safe area insets, and Apple HIG compliance.
4. **Complete Data Sovereignty:** User data is never trapped; one-click export and import safeguards user independence.

## Accessibility & Inclusion
- High contrast ratios (WCAG AA compliant) for text and interactive indicators across Dark and Light themes.
- Minimum 44x44px touch targets on all interactive controls.
- Semantic HTML tags, ARIA dialog roles, accessible focus outlines, and full screen reader label coverage.
