# UI/UX Evolution: SubTrack iOS 18 Liquid Glass & Gesture Engine

Plan integral para elevar la experiencia de usuario y diseño visual de SubTrack al estándar de diseño **iOS 18 Liquid Glass**, incorporando navegación táctil por gestos swipe, buscador instantáneo reactivo, filtros por categoría y tarjetas expandibles con hojas inferiores de inspección rápida.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones consolidadas en base a tus respuestas de la Fase 1:

- **Estilo visual confirmado:** **iOS 18 Liquid Glass** con microinteracciones fluidas, materiales translúcidos (`backdrop-blur-2xl`), reflejos especulares sutiles en bordes y tipografía con jerarquía SF Pro / Inter.
- **Mejoras de interacción confirmadas:**
  1. **Buscador instantáneo + Filtros rápidos por categoría:** Barra de búsqueda fluida en el encabezado del Dashboard con filtrado en tiempo real y selector de categorías táctil sin recargas.
  2. **Gestos Swipe en tarjetas:** Deslizar a la izquierda para registrar pago rápido (con chispas de confetti y vibración háptica suave) y deslizar a la derecha para edición/inspección rápida.
- **Estructura y densidad confirmadas:** **Tarjetas expandibles con hojas inferiores de vista rápida (Quick-View Sheets)**, permitiendo consultar detalles del ciclo y acciones secundarias sin perder el contexto de la lista principal.

---

## 1. Overview & Core Concept

### 1.1 Qué aporta esta mejora
SubTrack pasará de una interfaz de lista estática a un entorno interactivo y táctil de nivel de sistema operativo nativo. Los usuarios podrán buscar cualquier suscripción en milisegundos, filtrar por categorías de gasto (Entretenimiento, Productividad, Cloud, etc.), interactuar con gestos naturales de pulgar (swipe) para pagar o editar, y alternar entre una vista resumida y tarjetas expandibles de alta fidelidad.

### 1.2 Audiencia objetivo y contexto
- **Uso cotidiano en movilidad (iPhone Safari / Android Chrome / PWA instalada):** Diseñado específicamente para interacción con una sola mano (Thumb-Zone), evitando botones pequeños o navegación oculta.
- **Usuarios con 5 a 25 suscripciones:** Facilita la localización rápida de servicios mediante búsqueda difusa y filtros inmediatos, eliminando el scroll excesivo.

---

## 2. User Experience & Visual Design

```
┌───────────────────────────────────────────────────────────┐
│               SUBTRACK — VISTA DASHBOARD                  │
│                                                           │
│  [ Header iOS 18 ] ─── Avatar / Modo / Estado PWA         │
│  [ Hero Burn Rate ] ── $48.50/mes · Próx: Netflix (2d)    │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🔍 Buscar suscripciones...                     [✕]  │  │
│  └─────────────────────────────────────────────────────┘  │
│  ( Todos ) ( Entretenimiento ) ( Cloud ) ( Software ) ... │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  [Icon] Netflix 4K                $19.99/mes        │  │
│  │  ← Deslizar izq: Pagar       Deslizar der: Editar → │  │
│  │  [+] Expandir desglose rápido                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  [ Dock Inferior Liquid Glass ] ── [Suscripciones] [Analíticas] [Nube]
└───────────────────────────────────────────────────────────┘
```

### 2.1 Flujos de usuario clave

1. **Búsqueda Instantánea & Filtrado por Categoría:**
   - La barra de búsqueda se ancla sutilmente bajo el resumen financiero con un campo redondeado estilo iOS Search (`rounded-xl bg-zinc-900/60 dark:bg-zinc-900/60 border border-white/10`).
   - El filtrado evalúa nombre del servicio, categoría, método de pago y notas asociadas en tiempo real.
   - Barra de filtros segmentados con deslizamiento horizontal suave para filtrar con un toque entre *Todos*, *Streaming*, *Cloud*, *Software*, *Servicios*, etc.

2. **Gestos Swipe Táctiles en Tarjetas:**
   - **Swipe hacia la izquierda (Acción verde):** Revela el gatillo "Marcar Pagado" con icono de verificación y fondo esmeralda. Al sobrepasar el umbral de arrastre (75px), emite un pulso háptico (`navigator.vibrate(15)`) y ejecuta la acción de pago rápido con animación de confetti.
   - **Swipe hacia la derecha (Acción azul/indigo):** Revela el gatillo "Editar" con icono de lápiz. Permite abrir de inmediato el formulario modal de edición.
   - **Resiliencia táctil:** Los botones tradicionales de 44pt permanecen disponibles como alternativa accesible para usuarios de ratón o teclado.

3. **Tarjetas Expandibles & Hoja Inferior de Vista Rápida:**
   - Cada tarjeta cuenta con un chevron interactivo para expandir información complementaria sin abandonar el flujo (desglose por día/semana, último pago registrado, enlace directo de cancelación).
   - Tocar la cabecera de la tarjeta abre una **hoja inferior Apple HIG (Quick-View Sheet)** con grabber superior de 40px, historial de pagos y acciones de edición rápida.

### 2.2 Lenguaje Visual & Paleta iOS 18 Liquid Glass
- **Lienzo base:** `#09090b` (Dark Mode) y `#f8fafc` (Light Mode).
- **Superficies de cristal:** `backdrop-blur-2xl bg-zinc-900/70 dark:bg-zinc-900/70 border border-white/10 shadow-xl shadow-black/20`.
- **Acento cromático primario:** Esmeralda `#10b981` para salud financiera, pagos y confirmaciones; Indigo/Azul `#6366f1` para edición y configuración.
- **Tipografía:** Sistema SF Pro / Inter con alineación de números tabulares (`font-mono tabular-nums`) en todas las cifras monetarias para evitar saltos visuales al actualizarse.
- **Regla Zero-Pill:** Los metadatos estáticos (fechas, ciclos) se muestran con tipografía limpia y separadores tipográficos (`·`), reservando las cápsulas interactivas exclusivamente para filtros clicables.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Gestos Swipe híbridos con soporte táctil y puntero:**
  - *Enfoque:* Implementar gestos swipe usando eventos Pointer/Touch con resortes elásticos (`motion/react`), manteniendo botones estáticos visibles o en menú contextual para usuarios de escritorio.
  - *Por qué:* Garantiza la experiencia nativa de iPhone sin romper la usabilidad en navegadores desktop tradicionales.

- **Decisión 2: Filtrado cliente 100% síncrono:**
  - *Enfoque:* Realizar el filtrado de búsqueda y categorías directamente en memoria sobre el array de suscripciones.
  - *Por qué:* Cero latencia, funciona 100% sin conexión y respeta la soberanía de datos del usuario.

- **Decisión 3: Animaciones fluidas con respeto a `prefers-reduced-motion`:**
  - *Enfoque:* Transiciones de 150–200ms con curvas de resorte naturales (`spring`), desactivadas automáticamente si el usuario tiene activada la reducción de movimiento en el sistema.

---

## 4. Technical Architecture & Component Mapping

```
┌──────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE COMPONENTES               │
│                                                              │
│  [App.tsx]                                                   │
│    │                                                         │
│    ├── [InAppNotificationBanner] (Cápsula Dynamic Island)   │
│    │                                                         │
│    ├── [DashboardScreen]                                     │
│    │     │                                                   │
│    │     ├── [DashboardHero] (Burn rate mensual + métricas)  │
│    │     ├── [SubscriptionSearchBar] (Input reactivo + Clear)│
│    │     ├── [CategoryFilterBar] (Segmented filter tabs)     │
│    │     │                                                   │
│    │     └── [SubscriptionList]                              │
│    │           └── [SwipeableSubscriptionCard] (Item interactivo)
│    │                 ├── Swipe Action Left (Marcar pagado)   │
│    │                 ├── Swipe Action Right (Editar)         │
│    │                 ├── Inline Expandable Details           │
│    │                 └── Quick-View Bottom Sheet Trigger     │
│    │                                                         │
│    ├── [AddEditSubscriptionModal] (iOS Sheet con Grabber)    │
│    ├── [SubscriptionDetailScreen] (Quick-View modal)         │
│    └── [BottomNavBar] (Liquid Glass Dock inferior)          │
└──────────────────────────────────────────────────────────────┘
```

### 4.1 Mapeo de Componentes e Interacciones

1. **`SubscriptionSearchBar` & `CategoryFilterBar`:**
   - Estado: `searchQuery: string`, `selectedCategory: Category | 'ALL'`.
   - Efecto: Calcula lista memoizada `filteredSubscriptions` combinando consulta de texto y categoría activa.

2. **`SwipeableSubscriptionCard`:**
   - Gestos: `onDrag` con límites horizontales `[-100, 100]`.
   - Umbrales: Arrastre $\ge 75\text{px}$ a la izquierda activa `onMarkPaid(sub.id)`; arrastre $\ge 75\text{px}$ a la derecha activa `onEdit(sub)`.
   - Estado local: `isExpanded: boolean` para desplegar detalles secundarios en la misma fila sin salir del Dashboard.

3. **`QuickViewBottomSheet`:**
   - Integra grabber Apple HIG de 40px, botón de cierre de 44pt, historial reciente y acceso directo a cancelar suscripción o editarla.

---

## 5. Implementation Phases & Verification Checklist

- [x] **Paso 1:** Crear componente de búsqueda reactiva con entrada de texto accesible, botón de limpiar y contador dinámico.
- [x] **Paso 2:** Crear barra segmentada de categorías con conteo en vivo de elementos y objetivos táctiles de 44 pt.
- [x] **Paso 3:** Implementar `SwipeableSubscriptionCard` con física elástica de arrastre, feedback háptico y revelado de acciones (Pagar / Editar).
- [x] **Paso 4:** Integrar vista expandible inline en cada tarjeta con desglose diario/mensual/anual y vincular con la hoja inferior de inspección rápida.
- [x] **Paso 5:** Refinar los estilos Liquid Glass (gradientes sutiles, reflejos especulares, desenfoques de fondo optimizados para rendimiento GPU).
- [x] **Paso 6:** Validar compilación (`compile_applet`), pruebas de accesibilidad y verificación en Dark/Light mode.
