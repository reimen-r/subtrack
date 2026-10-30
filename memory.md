# Project Memory & Evolution Log: SubTrack

This document records the chronological history, design decisions, architectural pivots, user directives, and accumulated context for the **SubTrack** project.

---

## 1. Project Inception & Core Vision

- **Objective:** Build an ultra-fast, privacy-first mobile web application and PWA for tracking recurring subscriptions, monitoring monthly spend ("burn rate"), and alerting users before upcoming renewal dates.
- **Fundamental Invariants:**
  1. **Zero-Knowledge Privacy:** No user data transmitted to remote servers; 100% offline-first architecture via `localStorage`.
  2. **Zero Registration Barrier:** No login, OAuth, or passwords needed to start tracking subscriptions.
  3. **High Polish:** Feel indistinguishable from a premier native iOS app built with Swift and SwiftUI.

---

## 2. Chronological Milestones & Evolution

### Phase 1: Foundation & Core Feature Suite
- Implemented core domain models in `src/types.ts`: `Subscription`, `BillingFrequency`, `BillingHistoryRecord`, `NotificationSettings`.
- Developed utility suite in `src/utils/`:
  - `subscriptionUtils.ts`: Monthly burn rate calculations, currency formatting, renewal countdowns, cycle advance math.
  - `categoryDetection.ts`: Heuristic classifier for Entertainment, Productivity, Cloud, Utilities, Fitness, etc.
  - `calendarExport.ts`: RFC-5545 `.ics` file generator and Google Calendar URL builder.
  - `backupService.ts`: JSON export/import with defensive validation and merge/replace algorithms.
  - `notificationService.ts`: Web Audio API oscillator synthesis (F6 -> A6 dual-tone chime), `navigator.vibrate`, and Service Worker push notifications.
- Created multi-screen tab architecture:
  - **Dashboard:** Metrics summary, search, category chips, subscription cards.
  - **Analytics & Notifications:** Expense breakdown, calendar renewal matrix, diagnostics testing center, notification history inbox.
  - **Backup & Sync:** Local JSON download/upload, demo data loader, Google Play & Privacy modals.

---

### Phase 2: Apple HIG & iOS 18 "Liquid Glass" Overhaul
- **User Directive:** "iOS 18 Liquid Glass con microinteracciones fluidas, buscador instantaneo y filtros rapidos por categoria, gestos swipe en tarjetas, tarjetas expandibles y hojas inferiores".
- Adopted principles from Apple Human Interface Guidelines:
  - **Strict 44pt Touch Targets:** Enforced `min-h-[44px]` and `min-w-[44px]` across all buttons, selectors, tabs, and dismiss controls.
  - **Thumb-Zone Optimization:** Bottom floating dock navigation bar with glassmorphic backdrop (`backdrop-blur-2xl bg-zinc-900/80 border-white/10`).
  - **Floating Action Button (FAB):** Ergonomic squircle `+` in bottom-right corner for single-handed thumb creation of subscriptions.
  - **Dynamic Island Notification Capsule:** `InAppNotificationBanner.tsx` with smooth spring transitions via `motion/react`.
  - **Standard Sheet Grabbers:** Added Apple-style pill grabbers (`w-10 h-1.5 rounded-full bg-zinc-600/90`) on all bottom sheets and modals.
  - **Safe Area Insets:** Incorporated `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to accommodate iPhone Home Bar and Dynamic Island cutouts.

---

### Phase 3: Interactive Swipe Gestures & Ergonomics
- Introduced `SwipeableSubscriptionCard.tsx`:
  - Replaced static card with a touch-friendly swipe gesture container powered by `motion/react`.
  - **Swipe Right (Emerald Green Zone):** Triggers immediate "Marcar Pagado" (Mark as Paid) action with haptic vibration, Web Audio chime, and celebratory confetti.
  - **Swipe Left (Indigo Zone):** Opens the Edit sheet instantly.
  - Tap card body opens full `SubscriptionDetailScreen` with cycle history and direct cancellation URL links.

---

### Phase 4: Dynamic Brand Icon Engine
- **User Directive:** "Integrate a library like 'lucide-react' to display dynamic brand icons for popular subscriptions (Netflix, Spotify, etc.) in the dashboard list for better visual recognition."
- Created `ServiceLogo.tsx` powered by `@react-icons/all-files` / `react-icons` (Simple Icons vector set) and `lucide-react`:
  - Indexed 40+ premier global services: Netflix, Spotify, ChatGPT / OpenAI, YouTube / YouTube Music, Apple Music, iCloud, Amazon Prime, Disney+, Max (HBO), GitHub, Notion, Dropbox, Adobe, Figma, Discord, Microsoft 365, Slack, PlayStation Plus, Xbox Game Pass, Nintendo Switch Online, Duolingo, Canva, Audible, Hulu, etc.
  - Automated Brand Color Accents: Squircles rendered with official brand palette colors (e.g., Netflix Red `#E50914`, Spotify Green `#1DB954`, Discord Blurple `#5865F2`).
  - Smart Heuristic Fallbacks: If a brand is not in the indexed catalog, smoothly falls back to category-themed Lucide icons with customized accent colors.

---

### Phase 5: Header De-cluttering & Focus Mode
- **User Directive:** Selected CSS elements via Focus Mode to eliminate redundant header buttons (`#btn-pwa-install-header` and secondary demo buttons).
- **Refinement:**
  - Removed clutter from the top header in `src/App.tsx`.
  - Header now features a clean, high-elegance typographic presentation: "SubTrack", current localized date, dark/light theme switch, desktop frame toggle, and direct quick export.
  - PWA installation guidance moved into the designated Settings & Backup screen where full install steps and instructions are contextualized.

---

### Phase 6: Documentation Suite Standardization
- **User Directive:** "crea estos archivos security.md, rules.md, memory.md, architecture.md y crea el readme".
- Standardized the core engineering documentation:
  - `security.md`: Zero-knowledge privacy architecture, threat model, safe deserialization, device API permissions.
  - `rules.md`: Strict engineering, HIG, typography, and styling invariants.
  - `memory.md`: Chronological log of decisions, features, and context.
  - `architecture.md`: Updated comprehensive technical architecture and data flow diagrams.
  - `README.md`: Root project guide, feature matrix, quickstart, and developer workflows.

---

### Phase 7: Apple Design Skill Audit & System Enhancement (`dickwu/apple-design-skill`)
- **User Directive:** "npx skills add dickwu/apple-design-skill instala esta skill y usala para mejorar la app"
- **Skill Repository Integration:** Installed `dickwu/apple-design-skill` containing 123 reference guidelines from developer.apple.com under `/.skills/apple-design/`.
- **System Audit & Remediation via 5 HIG Lenses:**
  1. **Accessibility (`accessibility.md` & `liquid-glass.md` item 5):**
     - Added `@media (prefers-reduced-transparency: reduce)` fallback for all Liquid Glass components (`.ios-glass-bar`, `.ios-dock`, `.ios-glass-header`).
     - Added `@media (prefers-contrast: more)` for high-contrast accessibility.
     - Enforced strict 44pt touch targets (`min-h-[44px]`) on all segmented controls (Mensual/Anual, Gastos/Calendario/Avisos, Guardar Copia/Restaurar).
     - Added explicit ARIA roles, `tabIndex={0}`, and keyboard event listeners (`Enter`/`Space`) to `SwipeableSubscriptionCard`.
  2. **Platform Conventions (`sheets.md` & `tab-bars.md`):**
     - Aligned `AddEditSubscriptionModal` top navigation bar with standard iOS sheet ergonomics: "Cancelar" on the leading edge, "Guardar" / "Añadir" prominent button on the trailing edge, plus drag-to-dismiss gesture.
     - Replaced back icon in `SubscriptionDetailScreen` with canonical iOS `ChevronLeft` navigation styling.
     - Streamlined dock labels in `BottomNavBar` to single-word terminology: `Suscripciones`, `Analítica`, `Ajustes`.
  3. **Visual Design & Craft (`liquid-glass.md` & `branding.md`):**
     - Enforced Liquid Glass layer discipline: removed redundant heavy `backdrop-blur` from content-layer cards, reserving translucent Liquid Glass strictly for floating functional chrome (Dock & Header).
     - Unified dock active tab indicators to the signature emerald brand color (`#10b981`), removing competing multi-colored dock pills.
     - Preserved tabular figure alignment across all monetary and countdown elements.

---

## 3. Key Design Decisions & Technical Trade-offs

| Decision | Alternative Considered | Rationale |
|---|---|---|
| **Local-First (`localStorage`)** | Remote Cloud DB (Firebase/Supabase) | Eliminates user onboarding friction (no signup required), guarantees zero latency, protects financial privacy, and works 100% offline. |
| **Web Audio Synthesis** | Static `.mp3` / `.wav` audio files | MP3s add network weight, can fail offline or throw CORS errors, and cannot be dynamically frequency-ramped. Dual oscillator synthesis is instantaneous and 0 KB download. |
| **Bundled SVG Brand Icons** | Remote Logo CDNs (Clearbit/Brandfetch) | Remote logo APIs expose user subscription domains to third parties, fail offline, and create broken image links. Bundled vectors load instantly with 100% offline reliability. |
| **Client-Generated `.ics` Files** | Server-side CalDAV sync | Direct RFC-5545 `.ics` blob creation enables instant 1-tap imports into Apple Calendar, Google Calendar, and Outlook with zero server dependencies. |
| **Tailwind CSS v4 + Motion** | Heavy UI Component Libraries | Custom Apple Liquid Glass styling requires fine specular borders, translucency, and exact spring physics (`damping: 24, stiffness: 260`) tailored specifically to iOS 18. |

---

## 4. Persistent Storage Keys

| Key | Type | Description |
|---|---|---|
| `subtrack_subscriptions_v2_clean` | `Subscription[]` | Active list of user subscriptions. |
| `subtrack_settings_v2` | `NotificationSettings` | Advance alert days, digest time, sound/vibrate toggles. |
| `subtrack_notifs_v2_clean` | `NotificationItem[]` | Logged alert inbox items with read/unread status. |
| `subtrack_notified_cycles` | `string[]` | Array of `${sub.id}_${sub.nextBillingDate}` keys preventing duplicate notifications. |
| `subtrack_theme_preference` | `'dark' \| 'light'` | Appearance theme selection. |

---

## 5. Future Roadmap & Consideration Queue

- **i18n Localization Engine:** Expansion to multi-language switching (Spanish, English, Portuguese, French, German).
- **Split Bill Contact Sharing:** Direct Web Share API integration to generate WhatsApp / SMS payment reminders for shared family accounts.
- **Export to CSV / Excel:** Addition of tabular spreadsheet export alongside `.json` snapshots.
- **Biometric App Lock:** Optional WebAuthn / FaceID / TouchID lock screen on app resume.
