# Engineering & Design Rules: SubTrack

## 1. Architectural & Code Quality Rules

### 1.1 TypeScript Discipline
- **Strict Typing:** All components, hooks, utilities, and services must maintain explicit types or interfaces. No `any` or untyped casts (`as any`) unless wrapping browser-specific vendor APIs with verified runtime fallbacks.
- **Centralized Data Models:** All domain entities (`Subscription`, `BillingFrequency`, `Category`, `NotificationSettings`, `NotificationItem`, `ThemeMode`, `BackupPackage`) must reside in `src/types.ts`.
- **Pure Utility Logic:** Date calculations, currency formatting, frequency normalization, and category detections must reside in `src/utils/` as pure, unit-testable functions without side effects.
- **Defensive Null Checks:** Optional subscription fields (`notes`, `cancelUrl`, `splitPlan`, `billingHistory`) must always be accessed with optional chaining (`sub.notes?.trim()`) or nullish coalescing (`sub.notes ?? ''`).

### 1.2 State Management & Persistence
- **Offline-First & Local Sovereignty:** Browser `localStorage` is the authoritative persistence layer.
- **Strict Storage Keys:** Use documented, versioned storage keys:
  - `subtrack_subscriptions_v2_clean`: Active user subscriptions.
  - `subtrack_settings_v2`: User preferences and alert thresholds.
  - `subtrack_notifs_v2_clean`: Notification alert inbox items.
  - `subtrack_notified_cycles`: Deduplication registry for renewal cycles.
  - `subtrack_theme_preference`: Theme mode (`dark` | `light`).
- **Defensive Deserialization:** Always wrap `JSON.parse(localStorage.getItem(...))` in `try/catch` with verified fallback defaults. Never crash the app on corrupt local storage data.
- **Immutable State Updates:** Always update collections via pure array transformations (`map`, `filter`, `concat`) rather than direct in-place mutation.

---

## 2. Apple Human Interface Guidelines (HIG) Rules

### 2.1 Ergonomics & Touch Targets
- **44px Minimum Rule:** Every interactive element (buttons, tabs, selectors, dismiss icons) must have a touch target of at least 44×44 pt (`min-h-[44px]` / `min-w-[44px]`), even if the visual icon inside is smaller.
- **Thumb-Zone Optimization:** Primary navigation is anchored in the bottom floating dock. Critical action buttons (Floating Action Button `+`) must reside in the bottom-right zone within natural reach of single-handed mobile grip.
- **Micro-Interactions & Elasticity:** All buttons and interactive cards must provide instant tactile feedback using `active:scale-95` or `active:scale-[0.98]` with swift 150ms spring transitions.
- **Swipe Gestures:** Interactive subscription cards (`SwipeableSubscriptionCard`) support horizontal swipe gestures:
  - Swipe Right (green zone): Quick "Marcar Pagado" (Mark as Paid) action with haptic pulse and confetti.
  - Swipe Left (indigo zone): Instant Edit modal presentation.

### 2.2 Sheet Grabs & Modal Presentations
- **Standard Sheet Grabbers:** Every bottom sheet and modal must feature an Apple HIG grabber pill (`w-10 h-1.5 rounded-full bg-zinc-600/90 dark:bg-zinc-600/90 mx-auto mt-2.5`) on mobile viewports.
- **Liquid Glass & Translucency:** Floating bars and headers must use `backdrop-blur-2xl` with subtle translucent backgrounds (`bg-zinc-900/80` or `bg-white/80`) and fine specular borders (`border-white/10` or `border-zinc-200`).
- **Separation of Layers:** Never apply excessive blur directly behind fast-scrolling text content. Keep blur strictly on fixed chrome (nav bar, floating header, and modals).
- **Header Cleanliness:** The top application header must stay minimal and focused: clear typography ("SubTrack"), date subtitle, and essential controls (theme toggle, frame toggle, export). Do not clutter the header with redundant install buttons or secondary action pills.

### 2.3 Safe Area Inset Discipline
- Headers must incorporate `padding-top: max(16px, env(safe-area-inset-top))`.
- Bottom dock and floating action controls must incorporate `padding-bottom: max(12px, env(safe-area-inset-bottom))`.
- Avoid cutting off content behind the iPhone Home Bar or Dynamic Island.

### 2.4 iOS 27 & iPhone Duo Foldable Architecture Rules
- **Liquid Glass 2.0 Materials:** Use `.ios-27-glass` with 210% backdrop saturation boost, subtle top hairline specular reflection (`border-white/20`), and functional layer separation. Content cards remain crisp, solid, and legible.
- **iPhone Duo Arrangement View:** On dual-display foldable viewports, support side-by-side Arrangement Views with the primary list on the left display and contextual detail/live radar on the right display, respecting the center folding hinge.
- **Dynamic Island Live Activities:** Real-time renewal alerts and payment confirmations must format as pill capsules with pulsing status beacon and tactile interaction.
- **Single-Word Labels:** Navigation controls use concise single-word Apple labels (`Suscripciones`, `Analítica`, `Ajustes`).

---

## 3. Brand Iconography & Visual Recognition

### 3.1 Dynamic Service Logo Engine
- All subscription icons must resolve through `ServiceLogo.tsx`.
- **Brand Matching:** Matches subscription name or domain against an indexed catalog of 40+ popular global services (Netflix, Spotify, ChatGPT, YouTube, Apple Music, iCloud, Amazon Prime, Disney+, GitHub, HBO Max, etc.).
- **Bundled Assets:** Brand icons are rendered using client-bundled SVG components (`react-icons/si` and Lucide fallbacks). Never fetch external icon CDN URLs that fail offline.
- **Color Accents:** Brand background colors (e.g. Netflix Red `#E50914`, Spotify Green `#1DB954`, Discord Blurple `#5865F2`) are applied with subtle rounded-2xl squircles.

---

## 4. Styling & Tailwind CSS Rules

### 4.1 Design Token Consistency
- **Dark Canvas:** Base canvas is `#09090b` (`bg-slate-50 dark:bg-black` or `dark:bg-zinc-950`).
- **Card Surfaces:** Standard card surface is `#18181b` (`dark:bg-zinc-900/80` or `dark:bg-zinc-900/50`).
- **Primary Accent:** Emerald green `#10b981` (`emerald-500`) for financial clarity, active states, and positive indicators.
- **Borders & Dividers:** High-precision subtle borders using `border-zinc-200 dark:border-zinc-800` or `border-white/10`.
- **Zero Pill AI Clutter:** No generic multi-colored pill soup. Color is reserved for service branding, categories, and critical status indications.

### 4.2 Typography Rules
- Use Apple system font hierarchy (`system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto`).
- All currency numbers and numerical totals must enforce tabular figure alignment (`font-mono` or `tabular-nums`) to prevent jittering when figures update.
- Minimum legible navigation label size is 11px (`text-[11px]`).

---

## 5. Privacy & Offline Invariants

### 5.1 Strict Privacy Policy
- **No Third-Party Telemetry:** Absolutely zero analytics, telemetry beacons, tracking pixels, or remote loggers.
- **Zero Login Barrier:** The app must never require account registration, email verification, or phone numbers.
- **No Remote Financial Intermediaries:** Never connect banking APIs or sync plain financial records to unencrypted external clouds without explicit user action.

### 5.2 Offline Operation
- **Service Worker Protocol:** Precache all core visual assets, CSS, and scripts via `public/sw.js`.
- **Client-Side Synthesis:** Audio alerts and sound chimes must be synthesized client-side via Web Audio API oscillators—never load external sound MP3 files that fail when offline.
- **Offline Indicator:** When `navigator.onLine === false`, display a discreet, non-blocking offline pill indicator (`OfflineIndicator`).

---

## 6. Notification & Audio Synthesis Rules

### 6.1 Web Audio Synthesis Rules
- Always verify browser support for `AudioContext` and `webkitAudioContext`.
- If the audio context is in `'suspended'` state (due to browser autoplay policies), always attempt `ctx.resume()` on user touch before oscillator playback.
- Keep audio duration under 500ms with smooth exponential volume ramps to avoid speaker clicking.
- Dual harmonic chime: F6 (1396.91 Hz) ascending into A6 (1760 Hz).

### 6.2 Vibration Feedback Rules
- Always test for `'vibrate' in navigator` before executing `navigator.vibrate()`.
- Use concise haptic cadence patterns (`[70, 40, 110]` for alert, `[40, 20, 60]` for quick success).

### 6.3 System Notification Rules
- Check `Notification.permission` prior to dispatch.
- Prefer `navigator.serviceWorker.ready -> showNotification` on mobile/PWA browsers, falling back to `new Notification()` on desktop.
- Provide clear user instructions when browser permissions are in `'denied'` state.
- Deduplicate alerts with `${sub.id}_${sub.nextBillingDate}` keys in `subtrack_notified_cycles`.
