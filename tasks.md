# Tasks & Roadmap: SubTrack

## Phase 1: Core Foundation & Tracking Engine (Completed)
- [x] **Project Scaffolding:** React 19 + TypeScript + Vite 6 + Tailwind CSS setup.
- [x] **Data Models & Types:** Defined `Subscription`, `BillingFrequency`, `Category`, `NotificationSettings`, `BillingHistoryRecord`, and `SplitPlanConfig` in `src/types.ts`.
- [x] **Catalog Presets Directory:** Seeded pre-configured popular services (Netflix, Spotify, Apple One, GitHub, ChatGPT, YouTube, Prime) with verified branding colors, icons, and billing cycles in `src/data/presets.ts`.
- [x] **Subscription Dashboard:** Hero summary metrics (Monthly spend, Active subscriptions count, Next payment countdown).
- [x] **Subscription Detail Modal:** Detailed inspection view displaying next billing date, cycle cost, payment history, and cancellation links.
- [x] **Add/Edit Subscription Flow:** Form with preset selector, custom frequency support, payment method tags, and currency configuration.
- [x] **Quick Mark as Paid:** Action to quickly log payment and advance the `nextBillingDate` to the following cycle with celebratory confetti feedback.

---

## Phase 2: Apple HIG Redesign & Native Mobile Ergonomics (Completed)
- [x] **Apple Design Skill Integration:** Loaded and audited against Apple Human Interface Guidelines (`dickwu/apple-design-skill`).
- [x] **Bottom Navigation Dock:** Clean 3-tab iOS glass dock (Suscripciones, Analíticas, Copia Nube) with 11pt typography and WCAG AA contrast.
- [x] **Floating Action Button (FAB):** Ergonomic squircle FAB positioned outside the dock in the bottom-right corner for single-hand right-thumb accessibility.
- [x] **Liquid Glass Aesthetic:** Implemented backdrop-blur layers, fine specular borders, and high-contrast dark/light mode palette.
- [x] **iOS Sheet Grabbers:** Added native 40px grabber indicators on all modal sheets (`AddEditSubscriptionModal`, `SubscriptionDetailScreen`, `GooglePlayCenterModal`, `PrivacyPolicyModal`).
- [x] **Safe Area Insets:** Integrated `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` protection across all viewports and phone frame toggles.

---

## Phase 3: Intelligent Categorization & Automation (Completed)
- [x] **Automated Category Detection:** Keyword detection engine in `src/utils/categoryDetection.ts` for instant classification (Entertainment, Productivity, Cloud, Software, Health & Fitness, Utilities).
- [x] **First-Class Cloud Category:** Added Cloud storage and infrastructure as a dedicated category with custom color schemes and icons.
- [x] **Dynamic Categorization in Addition Flow:** Real-time suggestion and auto-selection of categories when typing custom subscription names or selecting presets.

---

## Phase 4: Notification Architecture & Verification Suite (Completed)
- [x] **Multi-Channel Notification Dispatcher:** Unified dispatcher supporting In-App banners, Web Audio chimes, haptics, and system push.
- [x] **Apple-Inspired Synthetic Audio Chime:** Dual-tone oscillator chime (F6 1396Hz → A6 1760Hz) built using Web Audio API with zero external MP3 dependencies.
- [x] **Automatic Audio Context Resumption:** Automatic `ctx.resume()` handling for browsers enforcing audio autoplay policies.
- [x] **Tactile Haptic Engine:** Device vibration feedback with verified pattern execution via Vibration API.
- [x] **PWA Service Worker Push:** Native OS push notification integration with `notificationclick` handler in `public/sw.js` to refocus app window.
- [x] **Notification Diagnostics Center:** Live real-time status indicators for OS permission, Web Audio API, Vibration API, and Service Worker.
- [x] **Delayed Background Simulation Test:** 5-second countdown timer allowing users to test notifications while app is minimized or phone is locked.
- [x] **Automated Renewal Scanning Engine:** Background scan checking `nextBillingDate` against `advanceDays` with deduplication via `subtrack_notified_cycles`.
- [x] **Interactive Notification Inbox:** List with unread badge counter, click-to-read, jump-to-subscription action, and individual deletion.

---

## Phase 5: Data Portability, Calendar Sync & PWA (Completed)
- [x] **Local JSON Backup & Restore:** Full package generation with metadata and snapshots, offering replace or non-destructive merge modes.
- [x] **Calendar Sync:** `.ics` iCal file generator and Google Calendar URL builder for subscription renewal alerts.
- [x] **Installable PWA Setup:** Manifest file, Apple touch icons, maskable icons, and in-app install prompt button.
- [x] **Offline Detection:** Real-time network listener displaying non-blocking offline pill.
- [x] **Dark / Light Theme Persistence:** Persistent theme switcher with system preference detection and meta theme-color sync.

---

## Phase 6: Polish & Current Enhancements (Completed)
- [x] **Documentation Suite:** Created `prd.md`, `rules.md`, `tasks.md`, `architecture.md`, and `product.md`.
- [x] **iOS 18 Liquid Glass & Apple Design Skill Engine:** Integrated Apple Design Skill (`dickwu/apple-design-skill`) 5-lens audit (Accessibility 44pt touch targets, Platform conventions, Visual craft & Liquid Glass translucency, Microinteraction spring physics & haptics, Clear content/copy).
- [x] **Gesture-Driven Subscription Cards:** Swipe gestures with directional reveal (deslizar izq. para marcar pagado con hápticos/confetti, deslizar der. para editar con rebote elástico), acordeón desplegable en tarjeta con cálculo diario/mensual/anualizado y hojas inferiores de vista rápida adaptables a modo claro y oscuro.
- [x] **Instant Search & Dynamic Filter Bar:** Buscador en tiempo real con contador de coincidencias, chips de categoría con conteo dinámico en vivo y botón para limpiar filtros en estado vacío.
- [x] **Dynamic Vector Brand Icons System:** Integrated authentic vector logos (`react-icons` + `lucide-react`) for 40+ top services (Netflix, Spotify, ChatGPT/OpenAI, YouTube, Apple, Amazon Prime, Disney+, HBO/Max, Hulu, GitHub, Notion, Discord, Slack, Figma, etc.) with iOS 18 glass squircle badges, specular inner highlights, and category fallbacks.

---

## Phase 7: Future Roadmap & Backlog
- [ ] **Family / Shared Plan QR Sync:** Generate offline QR code containing encrypted subscription configuration to beam subscriptions to family members instantly.
- [ ] **Web Push Subscription Sync (Optional Serverless Worker):** Optional Web Push API endpoint for users who want server-pushed alerts without opening the browser.
- [ ] **Cancellation Assistant:** Direct cancellation step-by-step guides and template emails for demanding services without direct cancel buttons.
- [ ] **Subscription Price Increase Tracker:** Notification alert when recorded renewal cost increases compared to historical records.
