# Molofu4 — Executable Product Spec (Phase 1)

## Overview

Molofu4 is a rebuild of molofu3 with a real Supabase backend. This spec defines the executable requirements for Phase 1: a fully persistent, offline-capable, GPS-aware family coordination app for HK working families.

**In-scope for Phase 1:** Real backend + week view + GPS + offline + co-parent role + bug fixes
**Out of scope for Phase 1:** Push notifications, RLS policies, WhatsApp-style channel, Typhoon integration

---

## Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **State:** Zustand (in-memory) + Supabase (persistence) + IndexedDB (offline cache)
- **Styling:** CSS (existing molofu4 theme)
- **Deployment:** Vercel (frontend) + Supabase (managed backend)

### Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
These MUST be loaded via `import.meta.env` — never hardcoded in source.

### Data Model

```typescript
// User (Supabase Auth + profiles table)
interface User {
  id: string;           // Supabase auth UID
  name: string;
  role: 'commander' | 'helper' | 'observer';
  family_id: string;
}

// Task (Supabase tasks table)
interface Task {
  id: string;           // UUID, primary key
  family_id: string;     // FK to families
  title: string;
  description: string;
  assignee_id: string;   // FK to users
  due_date: string;      // ISO date
  due_time: string;      // HH:MM
  location: string;
  contact: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_help';
  created_by: string;    // FK to users
  created_at: string;
  completed_at: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
}

// TaskNote (Supabase task_notes table)
interface TaskNote {
  id: string;
  task_id: string;      // FK to tasks
  author_id: string;    // FK to users
  content: string;
  created_at: string;
}

// Family (Supabase families table)
interface Family {
  id: string;
  name: string;
  invite_code: string;   // 6-char code for joining
}
```

### Supabase Tables
- `families(id, name, invite_code)`
- `users(id, family_id, name, role)` — profile rows linked to Supabase auth UID
- `tasks(id, family_id, title, description, assignee_id, due_date, due_time, location, contact, status, created_by, created_at, completed_at, gps_lat, gps_lng)`
- `task_notes(id, task_id, author_id, content, created_at)`

### RLS Policies (Phase 1 — basic, Phase 2 expands)
- `tasks`: Users can only read/write tasks where `family_id` matches their `family_id`
- `task_notes`: Users can only read notes on tasks their family can access
- `users`: Users can only see other members of their own family

---

## Feature Specifications

### F1: Real Supabase Backend

**Description:** Replace all mock data with real Supabase reads/writes. Every user action persists to PostgreSQL.

**Requirements:**
- Supabase client initialized with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` via lazy initialization (not module scope)
- All mock data removed from `src/mocks/`
- Zustand store hydrated from Supabase on app load
- Optimistic updates for task creation/deletion/completion
- Supabase realtime subscriptions for cross-device sync

**Acceptance Criteria:**
- [ ] Task created → appears in Supabase `tasks` table
- [ ] Page refresh → all tasks still present
- [ ] Task completed → `completed_at` updated in Supabase
- [ ] New task note → persisted in `task_notes` table
- [ ] Multiple devices → changes sync via Supabase realtime

**Maps to Pain:** Pain 1 (zero persistence), Pain 2 (credential exposure)

---

### F2: Week View + Date Navigation

**Description:** Commander dashboard shows a 7-day week strip. Navigation between weeks works. Each day shows task count and summary.

**Requirements:**
- Week strip at top of CommanderDashboard: 7 days (Sun–Sat), current day highlighted
- "‹ Prev Week" and "Next Week ›" navigation buttons
- Week state managed in Zustand, initialized to current Sunday
- Tapping a day filters the task list to that day
- Day tasks sorted by time within the selected day
- Conflict badge (orange triangle) on days with scheduling conflicts (2 tasks same assignee, same 30-min window)

**Acceptance Criteria:**
- [ ] Week strip renders 7 days centered on current week
- [ ] Prev/Next Week buttons navigate correctly
- [ ] Tapping a day filters the task list
- [ ] Tasks for future days visible in week view
- [ ] No crash when navigating beyond current week

**Maps to Pain:** Pain 4 (week nav broken in molofu3)

---

### F3: GPS Location Tracking

**Description:** Tasks with locations include GPS coordinates. Commander can see helper's location on task detail. Helper can open location in Apple Maps / Google Maps.

**Requirements:**
- On task creation with location, browser Geolocation API called to get current position
- GPS coordinates stored in `tasks.gps_lat` + `tasks.gps_lng`
- Task detail screen shows map thumbnail (static map image via OpenStreetMap/Nominatim)
- "Open in Maps" button → opens native maps app with coordinates
- If geolocation denied/fails → gracefully degrade to free-text location only (no error shown to user)

**Acceptance Criteria:**
- [ ] Task with location → GPS coordinates captured and stored
- [ ] Task detail → shows location text + map thumbnail
- [ ] "Open in Maps" → opens correct coordinates in native maps
- [ ] GPS denied → task still creates successfully, no error

**Maps to Pain:** Pain 3 (GPS blind spot)

---

### F4: Offline Mode (IndexedDB)

**Description:** Helper can view cached tasks without network. Background sync when connection returns.

**Requirements:**
- On task load from Supabase, full task list written to IndexedDB via `idb` library
- On app open (if offline detected), hydrate Zustand from IndexedDB instead of Supabase
- On task completion (offline), write to IndexedDB with `sync_pending: true` flag
- On network reconnect, sync pending changes to Supabase
- Offline indicator in UI when `navigator.onLine === false`
- Conflict resolution: Supabase wins (last-write-wins for MVP)

**Acceptance Criteria:**
- [ ] App open offline → tasks load from IndexedDB cache
- [ ] Task completed offline → marked `sync_pending: true`
- [ ] Network returns → pending tasks synced to Supabase
- [ ] Offline banner shown in UI when offline
- [ ] No data loss on offline→online transition

**Maps to Pain:** Pain 6 (offline mode absent)

---

### F5: Co-Parent Role (Active Observer)

**Description:** David (Observer) can do more than read. He can reassign tasks, add notes, flag conflicts, and send messages to Sarah.

**Requirements:**
- Observer role upgraded from read-only to "co-parent" with:
  - **Can add notes** to any task (like commander)
  - **Can mark task as "needs_help"** (escalation signal to commander)
  - **Can reassign task** to another family member (changes `assignee_id`)
  - **Can send a message** to commander (in-app message, persisted in `messages` table)
- Observer dashboard shows these action buttons on each task
- Commander receives observer message as a notification in-app (no push for MVP)

**Acceptance Criteria:**
- [ ] Observer can add a note to any task
- [ ] Observer can escalate task to "needs_help"
- [ ] Observer can reassign a task to another family member
- [ ] Observer can send a message to commander
- [ ] Commander receives and sees observer's message in-app

**Maps to Pain:** Pain 5 (no co-parent role)

---

### F6: Fix Note Authorship Bug

**Description:** Fix `TaskDetail.tsx` — currently only helper can add notes. Commander and observer must also be able to add notes.

**Requirements:**
- Remove `isHelper` gate on note input in TaskDetail
- All roles (commander, helper, observer) can add notes to any task
- Note author shown with name + role badge

**Acceptance Criteria:**
- [ ] Commander can add note to any task
- [ ] Observer can add note to any task
- [ ] Note displays author name + role badge

**Maps to Pain:** Pain 9 (notes gatekeeper bug)

---

### F7: In-App Notifications (Basic)

**Description:** Simple in-app notification center. No push infrastructure for MVP. Notifications stored in Supabase `notifications` table.

**Requirements:**
- Bell icon in header shows unread count badge
- Notification types: task_assigned, task_completed, task_needs_help, message_received
- Notification panel slides in from top
- Mark as read on tap
- Persisted in Supabase `notifications` table with `user_id` recipient

**Acceptance Criteria:**
- [ ] Task assigned → notification appears in recipient's notification list
- [ ] Notification bell shows unread count
- [ ] Notification panel shows all notifications for current user
- [ ] Notifications persist across sessions

**Maps to Pain:** Pain 7 (notification chaos — Phase 1 in-app only)

---

### F8: Conflict Detection

**Description:** System automatically detects scheduling conflicts — two tasks for the same assignee within 30 minutes of each other.

**Requirements:**
- On week view render, scan all tasks in visible week
- Conflict if: same `assignee_id`, overlapping 30-min window (`abs(time1 - time2) < 30min`)
- Conflict badge (orange ⚠️) shown on day in week strip
- Conflict modal shown when commander taps a conflicted day
- Modal shows: conflicting tasks, times, suggested resolution (reassign to other family member)

**Acceptance Criteria:**
- [ ] Week view shows ⚠️ badge on days with conflicts
- [ ] Tapping conflicted day opens modal with both tasks
- [ ] Suggestion shown: "Reassign to [other family member]?"

**Maps to Pain:** Pain 4 (week navigation + conflict detection)

---

## Role-Based Access Control

| Feature | Commander | Helper | Observer |
|---------|-----------|--------|----------|
| View all family tasks | ✅ | ✅ own | ✅ own |
| Create task | ✅ | ❌ | ❌ |
| Complete task | ✅ any | ✅ own | ❌ |
| Add note | ✅ | ✅ | ✅ |
| Reassign task | ✅ | ❌ | ✅ (co-parent) |
| Mark needs_help | ✅ any | ✅ own | ✅ own |
| Send message to commander | ❌ | ❌ | ✅ |
| GPS location visible | ✅ | ✅ own | ✅ own |
| Offline mode | ❌ | ✅ priority | ❌ |
| Week view | ✅ | ✅ | ✅ |
| Conflict detection | ✅ | ❌ | ❌ |

---

## Anti-Pattern Checklist (PM Must Flag)

- [x] **Platform mismatch:** Web app is correct — mobile PWA is Phase 2
- [x] **Dependency gap:** Supabase project must exist before coding starts — blocker for Phase 1
- [x] **Assumption risk:** "GPS will always be available" — mitigated with graceful fallback
- [x] **Wedge too wide:** Phase 1 excludes push notifications and full RLS — MVP focused on persistence + week view + GPS + offline + co-parent
- [x] **Mock data:** Must be fully removed before Phase 4 — not acceptable in any form in Phase 1 output

---

## Scenario Matrix (≥3 per core feature)

### Feature 1: Real Backend Persistence

| # | Persona | Context | Network | Success Criteria |
|---|---------|---------|---------|------------------|
| 1 | Sarah | Creates task in meeting | Online | Task persists after page refresh |
| 2 | Maria | Completes task at school gate | Offline → Online | Task completed offline, synced on reconnect |
| 3 | Sarah | Checks week view Sunday | Online | Week view loads from Supabase, not cache |
| 4 | David | Sends message to Sarah | Online | Message appears in Sarah's notification list |

### Feature 2: Week View + Navigation

| # | Persona | Context | Action | Success Criteria |
|---|---------|---------|--------|------------------|
| 1 | Sarah | Sunday night planning | Navigate to next week | Future tasks visible |
| 2 | Sarah | Checking today during meeting | Tap today in week strip | Today's tasks shown immediately |
| 3 | Maria | Morning 7am, reviewing today | Scroll week strip | Today is pre-selected on open |
| 4 | Sarah | Spotting a conflict | See ⚠️ badge on Wednesday | Conflict modal shows on tap |

### Feature 3: GPS Location

| # | Persona | Context | Action | Success Criteria |
|---|---------|---------|--------|------------------|
| 1 | Sarah | Creating pickup task | Auto-capture GPS | Coordinates stored in task |
| 2 | Maria | At pickup location | Tap "Open in Maps" | Native maps opens correct gate |
| 3 | Sarah | Checking if Maria left | Look at task detail | Map thumbnail shows Maria's last known location |
| 4 | Sarah | GPS denied | Create task anyway | Task creates, no error, text location saved |

### Feature 4: Offline Mode

| # | Persona | Context | Network | Success Criteria |
|---|---------|---------|---------|------------------|
| 1 | Maria | At wet market | Offline | Cached tasks visible |
| 2 | Maria | Completes task offline | Offline | Task marked pending sync |
| 3 | Maria | Leaves wet market | Online | Pending sync completes, Supabase updated |
| 4 | Sarah | At office | Online | All tasks current, no offline artifacts |

### Feature 5: Co-Parent Role

| # | Persona | Context | Action | Success Criteria |
|---|---------|---------|--------|------------------|
| 1 | David | On laptop, Singapore | Reassigns Tim's swimming to himself | Sarah sees reassignment in task history |
| 2 | David | Sees conflict in week view | Adds note "I can take this one" | Note visible to Sarah on task |
| 3 | David | Wants to alert Sarah | Sends message | Notification appears in Sarah's panel |
| 4 | Sarah | Receives David's message | Reads and responds | Message thread visible |

---

## Verification Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| VC-001 | Task creation ≤30 seconds, ≤4 taps | Manual stopwatch test |
| VC-002 | Page refresh → tasks persist | Browser refresh, verify all tasks present |
| VC-003 | GPS captured on task with location | Create task, verify coords in Supabase |
| VC-004 | Week strip shows 7 days | Visual inspection |
| VC-005 | Week navigation prev/next works | Click both buttons, verify day change |
| VC-006 | Conflict badge shows on overlapping tasks | Create 2 tasks same assignee, 15 min apart, verify ⚠️ |
| VC-007 | Offline → tasks visible from IndexedDB | Disable network, open app, verify tasks |
| VC-008 | Offline → online sync completes | Complete task offline, enable network, verify Supabase |
| VC-009 | Observer can reassign task | Login as David, reassign task, verify in Supabase |
| VC-010 | Observer can send message to commander | Login as David, send message, verify Sarah sees it |
| VC-011 | Commander can add note to any task | Login as Sarah, add note, verify persisted |
| VC-012 | Notification bell shows unread count | Create task for Sarah, verify badge count |
| VC-013 | No Supabase credentials in source | `grep -r "supabase" src/` returns env vars only |
| VC-014 | Open in Maps → correct app opens | Tap button, verify Maps app opens |
| VC-015 | GPS denied → task still creates | Deny geolocation, create task, verify success |

---

## Phase 1 Completion Checklist

- [ ] `docs/design.md` exists and covers all 10 pain points
- [ ] `docs/product-spec.md` exists and is executable
- [ ] Pain point coverage ≥ 80% (9 of 11 gaps mapped to features)
- [ ] Blocking requirements documented (Supabase project, env vars, IndexedDB, GPS)
- [ ] Success metrics defined (7 measurable)
- [ ] Scenario matrix ≥ 3 scenarios per feature
- [ ] Phase 1b gate passed (this document)
- [ ] State.json updated to phase "1c"
