# Molofu3 v3.7.2 Implementation Plan

## Task Breakdown (Bite-Sized, 2-5 min each)

### T1: Project Setup — package.json, vite.config.ts, tsconfig.json, index.html
**Files:** package.json, vite.config.ts, tsconfig.json, index.html
**Details:** React 18 (stable), Vite, TypeScript, react-router-dom v6 (stable), zustand. Vite config with build output to dist/. TS config for strict mode, React JSX. Index.html with app root div.

### T2: Types — TypeScript interfaces for User, Task, Message, Escalation
**Files:** src/types.ts
**Details:** All 4 interfaces with exact fields. Task status enum, task_type enum, priority enum. GeoPoint type for GPS.

### T3: Theme — Design tokens (colors, spacing, typography)
**Files:** src/theme.ts
**Details:** Color palette (primary blue #1E40AF, green #10B981, red #EF4444, amber #F59E0B). Spacing tokens (xs=4, sm=8, md=16, lg=24, xl=32). Typography scale. Status color map. Touch target 44px minimum.

### T4: Store — Zustand store with auth, tasks, messages, escalations, settings, onboarding slices
**Files:** src/store.ts
**Details:** Single create call with multiple slices. localStorage persistence via manual sync. Auth slice: currentUser, login, logout. Tasks slice: tasks array, CRUD operations. Messages slice: messages array, addMessage. Escalations slice: escalations array, trigger/resolve. Settings slice: notification prefs. Onboarding slice: completion state.

### T5: Mock Data — Multi-day sample data with dynamic dates
**Files:** src/mocks/data.ts
**Details:** Use Python datetime.now() for today's date. Tasks dated today (6) + tomorrow (2). 3 users (Sarah/commander, Maria/helper, David/observer). Messages linked to tasks. Escalations for overdue tasks.

### T6: Utils — Time helpers, SLA calculations
**Files:** src/utils/time.ts
**Details:** formatDate, formatTime, timeAgo, isOverdue, calculateSLA, getDaysDiff. Use native Date methods.

### T7: Services — Escalation service with SLA polling
**Files:** src/services/escalation.ts
**Details:** Polls every 30 seconds. Checks tasks against due_date - sla_minutes. Creates escalation records. Returns active escalations array.

### T8: Services — Notification service with browser API
**Files:** src/services/notification.ts
**Details:** requestPermission, showNotification, scheduleReminder. Browser Notification API integration.

### T9: Components — ProtectedRoute (role-based access guard)
**Files:** src/components/ProtectedRoute.tsx
**Details:** Checks auth from store. Redirects to /auth if not logged in. Blocks Commander screens for Helper/Observer. Blocks Helper screens for Observer.

### T10: Components — NavBar (role-based navigation)
**Files:** src/components/NavBar.tsx
**Details:** Commander: 5 items (Dashboard, Tasks, Messages, Schedule, Settings). Helper: 2 items (My Tasks, Messages). Observer: 2 items (Status, Feed). Active state styling. Bottom fixed position.

### T11: Components — TaskCard (reusable with status colors)
**Files:** src/components/TaskCard.tsx
**Details:** Props: task, onPress. Shows title, status badge (color-coded), assignee, due time. Border radius 12px, shadow. Left border 4px color-coded by status. Status colors: pending=amber, accepted=blue, in_progress=blue, arrived=green, done=green.

### T12: Components — MessageBubble (sent/received styling)
**Files:** src/components/MessageBubble.tsx
**Details:** Props: message, isSent. Sent: primary color bg, white text, right-aligned. Received: white bg, dark text, left-aligned. Border radius 16px. Timestamp below. Read receipts (✓✓).

### T13: Components — EscalationBanner (red alert)
**Files:** src/components/EscalationBanner.tsx
**Details:** Props: escalation. Red background #EF4444, white text, warning icon. Height 48px. Tap to view details (navigate to task). Only shows for critical escalations.

### T14: Components — CreateTaskForm (modal with 7 task types)
**Files:** src/components/CreateTaskForm.tsx
**Details:** Modal overlay. Fields: Title (text), Assignee (dropdown from helpers), Due (date+time picker), Priority (auto/manual), Type (dropdown: pickup/dropoff/homework/errand/tuition/meal/shopping). Submit creates task. Cancel closes. Auto-priority based on task type.

### T15: Components — StatusStepper (conditional per task type)
**Files:** src/components/StatusStepper.tsx
**Details:** Props: task. pickup/dropoff: pending → accepted → in_progress → arrived → done. homework/errand/tuition/meal/shopping: pending → accepted → in_progress → done (skip arrived). Shows current step highlighted.

### T16: Screens — AuthScreen (login/signup with role selector)
**Files:** src/screens/AuthScreen.tsx
**Details:** Email, Password, Role selector (Commander/Helper/Observer). Login validates credentials against mock users. Sign up creates new user. Password min 3 chars, empty rejection. On success → redirect to onboarding or dashboard.

### T17: Screens — Onboarding (5-step wizard)
**Files:** src/screens/Onboarding.tsx
**Details:** Step 1: Welcome + Commander name. Step 2: Helper name + phone. Step 3: Children names. Step 4: Default locations. Step 5: Notification prefs. Progress indicator. Next/Back buttons. Complete → set onboarding complete → redirect to dashboard.

### T18: Screens — CommanderDashboard (full dashboard)
**Files:** src/screens/CommanderDashboard.tsx
**Details:** Header "Good morning, [name]". Stats row (3 cards: Tasks Today, Escalations, Helper Status). Escalation banner (conditional). Today's tasks list (TaskCards). Floating "+" button (opens CreateTaskForm). GPS preview (small map card).

### T19: Screens — HelperDashboard (simplified, big buttons)
**Files:** src/screens/HelperDashboard.tsx
**Details:** Greeting. Next task big card (56px+ buttons: Accept/Start/Done). Assigned tasks list (TaskCards). No calendar, no settings, no GPS. Bottom nav: My Tasks, Messages.

### T20: Screens — ObserverDashboard (read-only)
**Files:** src/screens/ObserverDashboard.tsx
**Details:** Header "Family Status". Summary cards (kids locations, helper status, upcoming events). Timeline of completed tasks. No action buttons. Bottom nav: Status, Feed.

### T21: Screens — TaskDetail (full info + status stepper + messaging)
**Files:** src/screens/TaskDetail.tsx
**Details:** Task title, description, assignee, due time, location. StatusStepper component. Action buttons (persona-dependent: Commander=edit/delete, Helper=accept/start/done, Observer=none). In-task messaging section (MessageBubbles + input).

### T22: Screens — MessageFeed (task-filtered conversations)
**Files:** src/screens/MessageFeed.tsx
**Details:** List of conversations grouped by task. Each conversation shows latest message preview. Tap to open TaskDetail with messaging. Read receipts (check marks).

### T23: Screens — ScheduleView (weekly calendar)
**Files:** src/screens/ScheduleView.tsx
**Details:** Weekly grid, 7 columns (Mon-Sun). Header with day names. Color-coded event blocks (school=blue, tuition=purple, activity=green, personal=amber). Tap event → view details. Tasks from store shown as events.

### T24: Screens — SettingsScreen (notification toggles, escalation config)
**Files:** src/screens/SettingsScreen.tsx
**Details:** Notification toggles (push, email, sound). Escalation thresholds (SLA minutes per task type). Profile info (name, email, role). Logout button.

### T25: App — Router + layout shell + ProtectedRoute integration
**Files:** src/App.tsx
**Details:** BrowserRouter wrapper (React Router v6). Routes for all 9 screens. ProtectedRoute guards. Layout shell with NavBar (role-based). Auth check redirects.

### T26: Main — Entry point with store initialization
**Files:** src/main.tsx
**Details:** ReactDOM render. StrictMode. Store initialization with mock data if empty. Notification permission request on first use.

### T27: Server — CommonJS static file server with SPA fallback
**Files:** server.cjs
**Details:** http.createServer. Serve static files from dist/. SPA fallback: all non-asset routes return index.html. Port from env or 3000. MIME types for JS, CSS, HTML.

### T28: Build Verification — vite build, bundle check
**Files:** (none — verification step)
**Details:** Run npx vite build. Check dist/ has index.html + assets/. Bundle > 200KB. All routes accessible. Runtime syntax validation.

## Execution Order
1. T1 (setup) → T2 (types) → T3 (theme) — infrastructure first
2. T4 (store) → T5 (mock data) → T6 (utils) → T7 (escalation) → T8 (notification) — data layer
3. T9 (ProtectedRoute) → T10 (NavBar) → T11 (TaskCard) → T12 (MessageBubble) → T13 (EscalationBanner) → T14 (CreateTaskForm) → T15 (StatusStepper) — shared components
4. T16 (Auth) → T17 (Onboarding) → T18 (CommanderDashboard) → T19 (HelperDashboard) → T20 (ObserverDashboard) → T21 (TaskDetail) → T22 (MessageFeed) → T23 (ScheduleView) → T24 (Settings) — screens
5. T25 (App router) → T26 (main entry) — wiring
6. T27 (server) → T28 (build verify) — deployment
