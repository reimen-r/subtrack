# Security & Privacy Policy: SubTrack

## 1. Executive Summary & Security Philosophy

**SubTrack** is designed around a **Zero-Knowledge, Client-Authoritative Architecture**. Unlike traditional subscription management platforms that ingest personal banking credentials or harvest user telemetry, SubTrack operates **100% locally** within the user's browser runtime.

- **Zero Cloud Storage:** No user subscription names, billing amounts, renewal dates, or personal notes are transmitted to, stored on, or processed by external application servers or databases.
- **Zero Third-Party Trackers:** No analytics scripts, advertising telemetry, browser fingerprinting, or tracking pixels are included in the bundle.
- **Client Sovereignty:** The user retains complete ownership, control, and physical possession of their financial records. All persistence resides strictly in browser-sandboxed `localStorage`.

---

## 2. Threat Modeling & Security Posture

### 2.1 Threat Vector Matrix

| Threat Vector | Risk Level | Mitigation in SubTrack |
|---|---|---|
| **Server-Side Data Breach** | **Zero Risk** | There is no backend database, cloud user registry, or server-side store of user financial records. |
| **Credential Harvesting** | **Zero Risk** | SubTrack never prompts for banking passwords, credit card numbers, CVVs, or OAuth banking tokens. |
| **Cross-Site Scripting (XSS)** | **Low** | React 19 automatic JSX string escaping; strict TypeScript types; no `dangerouslySetInnerHTML`; no `eval()` or dynamic script injection. |
| **Local Storage Tampering** | **Low** | Strict JSON schema parsing with defensive try/catch blocks; auto-fallback to safe initial states upon corruption. |
| **Malicious Backup Injection** | **Low** | Deep property validation and type coercion in `backupService.ts` before importing user-supplied `.json` files. |
| **Man-in-the-Middle (MitM)** | **Low** | Enforced HTTPS in production; PWA Service Worker caching strictly bound to secure origin. |
| **Denial of Service (DoS)** | **Low** | Pure client-side SPA; all calculations (burn rate, cycle math) operate synchronously in memory with $O(N)$ efficiency. |

---

## 3. Data Protection & Storage Architecture

### 3.1 Local Storage Isolation
All data is stored exclusively under domain-scoped browser `localStorage`. These keys are inaccessible to other domains or origins according to the browser's Same-Origin Policy (SOP):

- `subtrack_subscriptions_v2_clean`: Active user subscriptions.
- `subtrack_settings_v2`: User preferences, reminder thresholds, and chime settings.
- `subtrack_notifs_v2_clean`: In-app notification inbox history.
- `subtrack_notified_cycles`: Cycle deduplication registry preventing duplicate alerts.
- `subtrack_theme_preference`: Appearance preference (`'dark'` or `'light'`).

### 3.2 Defensive Deserialization
Any interaction with `localStorage` enforces strict schema validation:
```typescript
try {
  const raw = localStorage.getItem('subtrack_subscriptions_v2_clean');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Validate array items contain mandatory fields (id, name, cost)
      setSubscriptions(sanitizeSubscriptions(parsed));
    }
  }
} catch (err) {
  console.warn('Corrupt local storage detected; initialized with safe fallback.');
  setSubscriptions([]);
}
```

### 3.3 Safe Backup & Restore Pipeline
When importing `.json` backup files:
1. **File Type Verification:** Verifies MIME type is `application/json` or `.json` file extension.
2. **Payload Size Guard:** Rejects files exceeding 5MB to prevent memory exhaustion.
3. **Property Sanitization:** Every item is validated against the `Subscription` interface:
   - Numerical values (`cost`, `advanceDays`) are coerced using `Number(val)` and validated for `isFinite` and `> 0`.
   - String inputs (`name`, `category`, `notes`) are stripped of script tags and capped at safe maximum lengths.
   - Unrecognized properties are discarded to prevent prototype pollution.
4. **User-Controlled Merge or Replace:** The user is explicitly prompted to choose between merging with existing data or executing a clean replacement.

---

## 4. Device API Sandboxing & Permissions

SubTrack utilizes browser hardware APIs responsibly, following the principle of least privilege:

### 4.1 Push Notifications (`Notification` & `ServiceWorkerRegistration`)
- Explicit User Gesture: Permissions are only requested upon deliberate user interaction (tapping "Activar Notificaciones" in Settings/Analytics).
- Graceful Degradation: If permission is `denied` or unsupported, the app seamlessly falls back to in-app dynamic island capsules.
- Zero Remote Payload: System notifications are dispatched locally from the client or Service Worker (`showNotification`); no external push server handles the notification body.

### 4.2 Web Audio API (`AudioContext`)
- Browser Autoplay Compliance: The `AudioContext` is lazily initialized or resumed only on user gestures (tap/click), preventing console warnings and adhering to modern browser autoplay policies.
- Synthesized In-Memory: Chimes are synthesized via oscillator nodes (`frequency.setValueAtTime`). No external `.mp3` or `.wav` files are fetched over the network, eliminating CDN compromise vectors.

### 4.3 Tactile Vibration (`navigator.vibrate`)
- Checked for feature presence (`'vibrate' in navigator`) prior to invocation.
- Limited to brief tactile pulses (`[70, 40, 110]` ms) and respect device silent/do-not-disturb modes.

---

## 5. Network Traffic & External Integrations

### 5.1 Outbound Connections
In standard operation, SubTrack makes **zero outbound network requests** for application logic:
- **No Remote Telemetry:** No requests to Google Analytics, Mixpanel, Sentry, or Segment.
- **Embedded Icons:** Service brand icons are bundled directly within the client bundle (`react-icons` and `lucide-react`), preventing third-party icon CDN tracking or outages.
- **Calendar Exports:**
  - `.ics` (iCalendar): Generated entirely client-side using a `data:text/calendar;charset=utf-8` Blob and downloaded directly.
  - Google Calendar: Formatted as a direct client navigation link (`calendar.google.com/calendar/render?...`) without passing data through an intermediate server.

---

## 6. Privacy & Regulatory Compliance

### 6.1 GDPR (General Data Protection Regulation)
- **Article 17 (Right to Erasure):** Users can delete all stored subscriptions and local data with a single tap in the Backup screen ("Borrar Todo").
- **Article 20 (Right to Data Portability):** Users can export their complete database into a standardized, human-readable `.json` file at any time.
- **Data Minimization (Article 5):** No personal identifiable information (PII) such as real names, email addresses, IP addresses, or phone numbers is collected or stored.

### 6.2 CCPA / CPRA
- SubTrack does not sell, share, or monetize user data. No personal data ever enters commercial advertising pipelines.

### 6.3 Google Play & App Store Data Safety Guidelines
When packaged or installed as a PWA / TWA (Trusted Web Activity):
- **Data Collected:** None.
- **Data Shared:** None.
- **Security Practices:** Encrypted in transit (HTTPS required for PWA), zero cloud storage.

---

## 7. Vulnerability Reporting

If you discover a security vulnerability or unexpected privacy leak in SubTrack:
1. Open a confidential security advisory or reach out directly to the maintainers.
2. Please provide reproduction steps and details of the browser environment.
3. Fixes will be deployed promptly to the client distribution.
