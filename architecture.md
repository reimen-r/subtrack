# System Architecture & Technical Design: SubTrack (iOS 27 & iPhone Duo Edition)

## 1. System Overview

**SubTrack** is built as an offline-first, client-authoritative Single Page Application (SPA) and Progressive Web App (PWA) designed to the next-generation **iOS 27** and **iPhone Duo** Apple Human Interface Guidelines. It is architected for zero latency, complete client privacy, multi-pose dual-screen adaptability (Arrangement View), Dynamic Island Live Activities, and native Liquid Glass 2.0 materials. All application logic, scheduling, audio synthesis, brand resolution, and financial calculations execute entirely in the user's browser runtime.

```
+-----------------------------------------------------------------------------------+
|                                 BROWSER RUNTIME                                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                           PRESENTATION LAYER (React 19)                     |  |
|  |                                                                             |  |
|  |  [DashboardScreen]         [AnalyticsNotificationScreen]   [BackupSyncScreen] |  |
|  |         |                                |                        |         |  |
|  |  [SwipeableSubCard]             [DiagnosticsSuite]          [JSONImportExp] |  |
|  |    ├── ServiceLogo (Brands)     [InteractiveInbox]          [CalendarSync]  |  |
|  |    ├── Swipe-Right: Pay         [SpendBreakdownCharts]      [DemoDataLoader]|  |
|  |    └── Swipe-Left: Edit                                                     |  |
|  |  [AddEditSubModal]                                          [GooglePlayModal] |
|  |  [SubDetailScreen]                                          [PrivacyModal]   |  |
|  |         \                                /                        /         |  |
|  |          +------------------------------+------------------------+          |  |
|  |                                         |                                   |  |
|  |                           [InAppNotificationBanner]                         |  |
|  |                           [BottomNavBar (iOS Dock)]                         |  |
|  +-----------------------------------------+-----------------------------------+  |
|                                            |                                      |
|  +-----------------------------------------v-----------------------------------+  |
|  |                            DOMAIN SERVICES & UTILITIES                      |  |
|  |                                                                             |  |
|  |  [subscriptionUtils]      [categoryDetection]      [calendarExport]          |  |
|  |  - Burn rate calculation  - Keyword classifier     - RFC-5545 .ics generator |  |
|  |  - Cycle normalization    - 40+ Brand definitions  - Google Calendar URL     |  |
|  |                                                                             |  |
|  |  [notificationService]                           [backupService]            |  |
|  |  - Web Audio API (Dual-tone Oscillator F6->A6)   - JSON Schema verification |  |
|  |  - Vibration API tactile handler                 - Merge / Replace pipeline |  |
|  |  - System Notification API dispatcher            - Snapshot management      |  |
|  |  - Automated Renewal Scanner Loop                                           |  |
|  +-----------------------------------------+-----------------------------------+  |
|                                            |                                      |
|  +-----------------------------------------v-----------------------------------+  |
|  |                            LOCAL PERSISTENCE LAYER                          |  |
|  |                                                                             |  |
|  |  localStorage Keys:                                                         |  |
|  |  * subtrack_subscriptions_v2_clean (Subscriptions[])                         |  |
|  |  * subtrack_settings_v2            (NotificationSettings)                   |  |
|  |  * subtrack_notifs_v2_clean        (NotificationItem[])                     |  |
|  |  * subtrack_notified_cycles        (Cycle Deduplication Set)                 |  |
|  |  * subtrack_theme_preference       ('dark' | 'light')                       |  |
|  +-----------------------------------------------------------------------------+  |
|                                            |                                      |
|  +-----------------------------------------v-----------------------------------+  |
|  |                           SERVICE WORKER & PWA LAYER                        |  |
|  |                                                                             |  |
|  |  [public/sw.js]                                                             |  |
|  |  - Precache Core App Shell (HTML, Manifest, Icons)                           |  |
|  |  - Stale-While-Revalidate Static Caching                                    |  |
|  |  - Background Push Notification Handler                                     |  |
|  |  - `notificationclick` Focus & Window Navigation Listener                   |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Technology Stack & Dependencies

| Layer | Technology | Purpose & Rationale |
|---|---|---|
| **Framework** | **React 19** (`react`, `react-dom`) | Concurrent rendering, modern hooks, and component lifecycle management. |
| **Language** | **TypeScript 5.8** | Full compile-time type safety across domain models and browser APIs. |
| **Build Tooling** | **Vite 6** | Instant ESM bundling and production asset hashing. |
| **Styling** | **Tailwind CSS v4** (`@tailwindcss/vite`) | Utility-first CSS variables for Apple Liquid Glass translucency and specular borders. |
| **Animation & Gestures**| **Motion** (`motion/react`) | Spring physics animations, horizontal card swipe gestures, and sheet drag handles. |
| **Brand Icon Engine** | **React Icons** (`react-icons`) + **Lucide** | Vector brand logos for 40+ global services (Netflix, Spotify, ChatGPT, Apple, Prime, etc.) bundled offline. |
| **Micro-Interactions** | **Canvas Confetti** (`canvas-confetti`) | Haptic celebration particles when marking payments as completed. |
| **QR Code Engine** | **QRCode** (`qrcode`) | Offline QR matrix generation for backup transfer and rapid mobile pairing. |
| **Audio Engine** | **Native Web Audio API** | 0 KB dual-tone synthesized harmonic chimes (F6 -> A6) with zero audio file dependencies. |
| **PWA & Offline** | **Service Worker + localStorage** | 100% offline functionality with client persistence and background push handling. |

---

## 3. Component Hierarchy & Flow

```
App.tsx (Root Controller)
├── OfflineIndicator (Floating translucent status pill when offline)
├── InAppNotificationBanner (Apple Dynamic Island spring capsule)
├── Top Header
│   ├── Typography Brand Title ("SubTrack") + Current Localized Date
│   └── Actions (Theme Toggle, Desktop Device Frame Toggle, Quick JSON Export)
│
├── Main View Switcher
│   ├── [activeTab === 'home'] -> DashboardScreen
│   │   ├── Metric Hero Cards (Monthly Burn Rate, Active Count, Next Renewal Countdown)
│   │   ├── Instant Search Bar & Category Filter Chips
│   │   └── Subscription List Cards
│   │       └── SwipeableSubscriptionCard
│   │           ├── ServiceLogo (Dynamic Brand Vector & Color Squircle)
│   │           ├── Swipe-Right Track: "Marcar Pagado" (Haptics + Chime + Confetti)
│   │           ├── Swipe-Left Track: "Editar" (Direct Modal Sheet trigger)
│   │           └── Card Tap -> opens SubscriptionDetailScreen
│   │
│   ├── [activeTab === 'analytics'] -> AnalyticsNotificationScreen
│   │   ├── Sub-Tab 1: Gastos (Monthly burn breakdown, Category percentage bars)
│   │   ├── Sub-Tab 2: Calendario (Interactive month grid with renewal date pills)
│   │   └── Sub-Tab 3: Avisos & Notificaciones (Verification & Diagnostics Center)
│   │       ├── Real-time Diagnostics (Permission, Web Audio, Vibration, SW)
│   │       ├── Test Suite (Immediate All-in-One, 5s Background Simulation, Scan)
│   │       ├── Notification Preferences (Advance days, Digest time, Chime toggle)
│   │       └── Interactive Alerts Inbox (Read/Unread, Jump to sub, Delete)
│   │
│   └── [activeTab === 'backup'] -> BackupSyncScreen
│       ├── Backup Package Exporter (.json file generation)
│       ├── Backup Restorer (Replace vs Merge modes)
│       ├── Sample Demo Data Loader & Clean Slate Reset
│       ├── PWA Installation Helper & Standalone status
│       └── Google Play & Privacy Policy Launchpad Modals
│
├── BottomNavBar (iOS 3-Tab Glass Dock with notification badge & safe-area insets)
├── Floating Action Button (+) (Ergonomic bottom-right squircle)
├── AddEditSubscriptionModal (Creation & Modification Sheet with Apple Grabber)
└── SubscriptionDetailScreen (Full-page Modal Sheet with Billing History & Cancel URL)
```

---

## 4. Domain Data Models

Located in `src/types.ts`:

### 4.1 Subscription
```typescript
export interface Subscription {
  id: string;
  name: string;
  description?: string;
  cost: number;
  currency: CurrencyCode; // 'USD' | 'EUR' | 'GBP' | 'MXN' | etc.
  frequency: BillingFrequency; // 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'biannual'
  firstBillingDate: string; // YYYY-MM-DD
  nextBillingDate: string;  // YYYY-MM-DD
  category: SubscriptionCategory; // 'Entertainment' | 'Productivity' | 'Cloud' | ...
  color: string;
  iconName?: string;
  domain?: string;
  logoUrl?: string;
  websiteUrl?: string;
  cancelUrl?: string;
  paymentMethod?: string;
  enableNotifications: boolean;
  reminderTiming: ReminderTiming;
  status: SubscriptionStatus; // 'active' | 'paused' | 'cancelled'
  billingHistory: BillingHistoryRecord[];
  priceHistory?: PriceChangeRecord[];
  splitPlan?: SplitPlanConfig;
  createdAt: string;
  notes?: string;
}
```

### 4.2 Notification Settings & Alerts
```typescript
export interface NotificationSettings {
  pushEnabled: boolean;
  emailDigest: boolean;
  advanceDays: number; // 0, 1, 3, 7 days before
  reminderTime: string; // HH:mm (e.g. '09:00')
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  upcomingRenewalsAlert: boolean;
  monthlySummaryAlert: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  subscriptionId: string;
  date: string;
  read: boolean;
  type: 'upcoming' | 'paid' | 'price_change' | 'trial_end';
}
```

---

## 5. Notification Subsystem Architecture

SubTrack incorporates a 4-tier notification pipeline designed to operate seamlessly across mobile, desktop, and standalone PWA modes:

```
[Trigger Source]
   - Scheduled Background Renewal Scanner
   - Immediate Test Action in Diagnostics Center
   - 5-Second Background Simulation Timer
   - Subscription Added / Paid / Cycle Advanced
          |
          v
[Notification Dispatcher] (triggerInAppBanner / handleTriggerTestNotification)
   |
   +---> Layer 1: In-App Banner
   |     Motion Spring animation, Apple Dynamic Island glass capsule.
   |
   +---> Layer 2: Web Audio Synthesis
   |     AudioContext -> Oscillator (F6 1396.9Hz -> A6 1760Hz ramp) -> Gain Node.
   |     Auto-resumes suspended contexts on user touch. Zero audio file network latency.
   |
   +---> Layer 3: Tactile Vibration
   |     navigator.vibrate([70, 40, 110]) tactile haptic cadence on mobile devices.
   |
   +---> Layer 4: System Push Notification
         Check Notification.permission
           ├── Granted -> Dispatch via SW (reg.showNotification) or new Notification()
           ├── Default -> Request permission interactively
           └── Denied  -> Display diagnostic guidance in verification UI
```

### 5.1 Deduplication Engine
To prevent repeated notification spam, SubTrack maintains a deduplication registry in `localStorage` under `subtrack_notified_cycles`. A unique composite key `${sub.id}_${sub.nextBillingDate}` is registered whenever an alert fires, guaranteeing each renewal triggers exactly once per billing period.

---

## 6. Dynamic Brand Icon Engine (`ServiceLogo.tsx`)

Visual recognition is crucial for scanning long subscription lists:
1. **Catalog Matching:** Checks normalized subscription name and website domain against a dictionary of 40+ premier services (Netflix, Spotify, ChatGPT, YouTube, Apple, Amazon, Disney+, GitHub, Discord, Notion, Adobe, Figma, etc.).
2. **Bundled SVGs:** Renders high-fidelity vector icons via `react-icons` (Simple Icons) and `lucide-react`.
3. **Brand Accent Squircles:** Applies official brand background colors (e.g., `#E50914` for Netflix, `#1DB954` for Spotify, `#10A37F` for ChatGPT).
4. **Resilient Fallback:** Unknown subscriptions receive category-themed Lucide icons with custom user-selected colors.

---

## 7. Progressive Web App (PWA) & Service Worker

### 7.1 Service Worker Strategy (`public/sw.js`)
- **Precaching:** Core application shell (`/`, `/index.html`, `/manifest.json`, icon assets) are cached during the `install` phase.
- **Cache Invalidation:** Versioned cache names (`subtrack-pwa-v3`) purge legacy assets upon `activate`.
- **Stale-While-Revalidate for Static Assets:** Scripts and stylesheets load instantaneously from cache while updating silently in the background.
- **Push Notification Clicks:** Listens to `notificationclick` events, closes the system banner, and focuses the open tab or opens `/`.

---

## 8. Security & Data Protection Invariants

1. **Client-Side Sandbox:** No backend database or server-side user data stores exist. All calculations occur strictly in browser memory.
2. **Zero Plaintext Cloud Leakage:** Export files are downloaded directly to the client's local disk via Blob URLs (`window.URL.createObjectURL`).
3. **No External Fonts or Trackers:** All fonts are mapped to system-native font stacks (`-apple-system`, `system-ui`). No Google Fonts or external CDN trackers are loaded.
4. **Resilient Error Boundaries:** Corrupted storage data is intercepted and gracefully reset without white-screen crashes.
