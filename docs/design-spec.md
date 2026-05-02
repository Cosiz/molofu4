# Molofu4 — Design Specification (Phase 2a)

**Date:** 2026-05-02
**Phase:** 2a — UX Design
**Product:** Molofu4 ("管理負擔 4" — Manage the Burden, Gen 4)
**Target:** Hong Kong working families with domestic helpers

---

## 1. Design Principles

1. **Calm over comprehensive** — One place, no chasing, no group chats. Reduce cognitive load.
2. **Frictionless handoff** — Commander creates a task in ≤30 seconds, one-handed, in a meeting.
3. **GPS adds trust, not surveillance** — Shared context for coordination, not surveillance.
4. **Offline-first for Maria** — Works at wet market, MTR tunnels, rural tuition venues.
5. **Icons > text for helpers** — Maria has limited English; visual language first.
6. **Week view non-negotiable** — HK families book tuition weeks ahead; Sunday planning must work.
7. **Typhoon days handled gracefully** — Surface disruptions clearly, resolve in ≤60 seconds.

---

## 2. Design Tokens

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#1E40AF` | Deep blue — trust, calm, command authority |
| Secondary | `#10B981` | Green — success, done, peace of mind |
| Alert | `#EF4444` | Red — critical, overdue, typhoon signal |
| Warning | `#F59E0B` | Amber — approaching deadline, conflict warning |
| Background | `#F8FAFC` | Light gray — clean, uncluttered |
| Surface | `#FFFFFF` | Cards, modals — clear separation |
| Text Primary | `#1F2937` | Dark gray — readable |
| Text Secondary | `#6B7280` | Medium gray — supporting info |
| GPS Active | `#3B82F6` | Blue — location tracking active |
| Offline Banner | `#64748B` | Slate — offline mode indicator |

### Status Color System

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| pending | `#F59E0B` amber | ⏳ | Needs attention |
| in_progress | `#3B82F6` blue | 🚶 | En route / doing |
| needs_help | `#EF4444` red | 🆘 | Blocked, needs commander |
| completed | `#10B981` green | ✅ | Done |
| conflict | `#F59E0B` amber | ⚠️ | Scheduling overlap |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page Title | System | 24px | 700 bold |
| Section Header | System | 18px | 600 semibold |
| Card Title | System | 16px | 600 semibold |
| Body | System | 14px | 400 regular |
| Label / Badge | System | 12px | 600 semibold |
| Button | System | 16px | 700 bold |
| Helper UI (larger) | System | 18px | 700 bold |

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Tight element spacing |
| `space-sm` | 8px | Default element spacing |
| `space-md` | 16px | Section spacing |
| `space-lg` | 24px | Card spacing |
| `space-xl` | 32px | Page margins |
| Touch Target | 44px min | All interactive elements |

---

## 3. Screen Layouts

### 3.1 Commander Dashboard (`/commander`)

**Primary user:** Sarah Chen — marketing director, Kowloon Tong, one-handed phone use in meetings

**Layout (top to bottom):**

```
┌─────────────────────────────────────┐
│ HEADER: "Good morning, Sarah" + date │
│ [🔔 Notification Bell + badge]      │
├─────────────────────────────────────┤
│ WEEK STRIP: [Sun][Mon][Tue][Wed]... │
│ [‹ Prev Week]    Today    [Next Week ›]│
├─────────────────────────────────────┤
│ STAT CARDS (3):                     │
│ [✅ Done: 3] [🚶 In Progress: 2]    │
│ [🆘 Needs Help: 1]                  │
├─────────────────────────────────────┤
│ ⚠️ CONFLICT BANNER (if conflicts)   │
├─────────────────────────────────────┤
│ TASK LIST (scrollable):             │
│ ┌─────────────────────────────────┐ │
│ │ TaskCard (pending)               │ │
│ │ TaskCard (in_progress)          │ │
│ │ TaskCard (needs_help) 🆘        │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [＋] FAB (56px, bottom-right)      │
├─────────────────────────────────────┤
│ BOTTOM NAV: Dashboard|Tasks|Messages│
│            |Schedule|Settings       │
└─────────────────────────────────────┘
```

**Offline indicator:** Slate banner above bottom nav — "📴 Offline — changes will sync when connected"

### 3.2 Helper Dashboard (`/helper`)

**Primary user:** Maria Santos — domestic helper, budget Android, limited English, bright sunlight

**Layout (top to bottom):**

```
┌─────────────────────────────────────┐
│ HEADER: "Hi Maria" + date           │
│ [Your Tasks Today]                  │
├─────────────────────────────────────┤
│ CURRENT TASK (big card):            │
│ ┌─────────────────────────────────┐ │
│ │ 🎹 Take Lily to piano lesson    │ │
│ │ 3:00 PM · St. Mary's School   │ │
│ │ [📍 Show on Map]                │ │
│ │ ──────────────────────────────  │ │
│ │ [  ✅ DONE  ] (56px tall)      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ TASKS LIST:                         │
│ ┌─────────────────────────────────┐ │
│ │ ⏳ Tim's homework help · 5pm   │ │
│ │ 🚶 Buy groceries · 6pm         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📴 OFFLINE BANNER (if offline)      │
├─────────────────────────────────────┤
│ BOTTOM NAV: My Tasks | Messages     │
└─────────────────────────────────────┘
```

**Design notes:**
- Touch targets ≥ 56px for DONE button (Maria's wet hands, big fingers)
- Icons paired with English labels
- No free-text input required for primary actions
- Status badges: icon-only with color (⏳ 🚶 ✅ 🆘)

### 3.3 Observer Dashboard (`/observer`)

**Primary user:** David Chen — finance director, Singapore timezone, laptop browser

**Layout (top to bottom):**

```
┌─────────────────────────────────────┐
│ HEADER: "Family Status"             │
│ Sat, May 2, 2026                   │
├─────────────────────────────────────┤
│ FAMILY SUMMARY CARDS:               │
│ ┌──────────┐ ┌──────────┐          │
│ │ 👶 Kids  │ │ 🧹 Maria │          │
│ │ All home │ │ 3 tasks  │          │
│ │ ✅ 2     │ │ done     │          │
│ └──────────┘ └──────────┘          │
├─────────────────────────────────────┤
│ MESSAGE SARAH:                      │
│ ┌─────────────────────────────────┐ │
│ │ [Type message...        ] [➤] │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ TODAY'S OVERVIEW:                    │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Lily piano — done            │ │
│ │ 🚶 Maria to groceries — done    │ │
│ │ ⏳ Tim homework — in progress   │ │
│ │ 🆘 Lily pickup — needs help    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ BOTTOM NAV: Status | Feed           │
└─────────────────────────────────────┘
```

**Design notes:**
- David can reassign tasks and send messages (upgraded from molofu3 read-only)
- No FAB (cannot create tasks)
- Summary cards provide 30-second situational awareness

---

## 4. Component Inventory

> Every component maps to a documented pain point and/or a gap from molofu3.

| # | Component | Pain Point Addressed | Purpose | States | Interactions | Accessibility |
|---|-----------|---------------------|---------|--------|-------------|---------------|
| 1 | `WeekStrip` | Pain-4: Week nav broken, no week view | 7-day horizontal strip for navigating Sun–Sat weeks | default, day-selected, today, conflict-day, disabled | tap day → filter list, tap prev/next → shift week | ARIA: `role="tablist"`, day buttons `role="tab"` with date labels |
| 2 | `StatCard` | Pain-1: No persistence feedback | Summary counts (done/in-progress/needs-help) at a glance | default, loading, empty, alert (red border if needs_help > 0) | tap → filter task list by that status | Screen reader announces count + label |
| 3 | `TaskCard` | Pain-1: No persistence; Pain-4: broken nav | Task summary with status, assignee, time, location | pending, in_progress, needs_help, completed, conflict | tap → open TaskDetail modal | Status conveyed by color left-border + icon + text; all three channels |
| 4 | `CreateTaskModal` | Pain-1: Zero persistence; Pain-5: co-parent can't assign | Quick task creation — ≤4 fields, ≤30 sec | default, loading, validating, error, success | fill → submit; tap outside → dismiss | Form labels all linked; submit button labelled |
| 5 | `TaskDetailModal` | Pain-9: Commander can't add notes; Pain-5: co-parent help | Full task view with notes thread and action buttons | default, loading, error, note-submitting | tap to open/close; add note; reassign; mark needs_help; complete | Notes thread: author name + role badge per note |
| 6 | `NoteThread` | Pain-9: Notes gatekeeper bug; Pain-10: message channel broken | Persistent note/messages on each task, visible to all roles | empty, has-notes, submitting | scroll notes; tap composer → expand; submit | Each note: author, role badge, timestamp, content |
| 7 | `NoteComposer` | Pain-9: Only helper could add notes | Text input for adding notes — available to commander + helper + observer | default, focused, submitting, disabled | type → submit; role determines visibility | `aria-label="Add a note"`, role badge shown on submitted notes |
| 8 | `GPSBanner` | Pain-3: GPS blind spot | Shows when location tracking is active for a task | hidden, requesting, active, denied | tap → open task detail with map | Screen reader announces "Location tracking active" |
| 9 | `MapThumbnail` | Pain-3: No "Open in Maps" | Static map image (OSM) + "Open in Maps" button on task detail | default, loading, error (no map), no-gps | tap "Open in Maps" → native maps app opens | Button labelled; thumbnail has null alt text (decorative) |
| 10 | `OpenInMapsButton` | Pain-3: No GPS; GAP-005: no "Open in Maps" | Deep-link to native Apple Maps / Google Maps | default, loading, unsupported (fallback to address text) | tap → open maps with lat/lng | Labelled "📍 Open in Maps" |
| 11 | `OfflineBanner` | Pain-6: Offline mode absent | Full-width slate banner when `navigator.onLine === false` | visible, hidden | non-interactive (info only) | `role="status"`, `aria-live="polite"` |
| 12 | `OfflineIndicator` | Pain-6: Offline mode absent | Badge in header when offline | online (hidden), offline (visible) | non-interactive | `aria-label="Offline mode active"` |
| 13 | `ConflictBadge` | Pain-4: No conflict detection; F8: Typhoon day | Orange ⚠️ badge on week strip days with scheduling conflicts | hidden, visible | tap day → open ConflictModal | `aria-label="Scheduling conflict on [day]"` |
| 14 | `ConflictModal` | Pain-4: No week view; F8: Typhoon days | Shows overlapping tasks and resolution suggestion | default, loading | tap → dismiss; tap "Reassign" → open reassign | Lists conflicting tasks with times; suggested assignee shown |
| 15 | `NotificationBell` | Pain-7: Notification chaos | Bell icon with unread count badge in header | unread (0), unread (N>0), all-read | tap → open NotificationPanel | Badge: `aria-label="[N] unread notifications"` |
| 16 | `NotificationPanel` | Pain-7: No in-app notifications | Slide-down panel listing all notifications | empty, has-items, loading | tap item → mark read + navigate; scroll | `role="log"`, each item `role="article"` |
| 17 | `NotificationItem` | Pain-7: Notification chaos | Single notification row — icon + message + timestamp | unread (bold), read (normal), loading | tap → mark as read + navigate to relevant task | `aria-readonly="true"` |
| 18 | `ObserverMessagePanel` | Pain-10: David's message channel broken | Text input + send button for David to message Sarah | default, typing, sending, sent, error | type → send → confirmation | Input labelled; send button labelled "Send to Sarah" |
| 19 | `ReassignDropdown` | Pain-5: No co-parent role | Dropdown to reassign task to another family member | closed, open, selected | tap → open; select member → confirm | `aria-label="Reassign to"`, options are member names |
| 20 | `RoleBadge` | Pain-9: Notes authorship; Pain-5: co-parent | Small pill badge showing user role next to name | commander, helper, observer | non-interactive | Text label + color uniquely identifies role |
| 21 | `FAB` (Floating Action Button) | Pain-1: Zero persistence | 56px bottom-right button to create new task (commander only) | default, pressed, disabled (non-commander roles) | tap → open CreateTaskModal | `aria-label="Create new task"`, large touch target |
| 22 | `BottomNav` | Navigation consistency | 5 items (commander) or 2 items (helper/observer) | default, item-active, item-inactive | tap → navigate | `role="navigation"`, each item labelled |
| 23 | `StatusStepper` | Pain-1: Task state unclear | Visual stepper showing task status progression | pending→in_progress→completed | tap status button to advance (where permitted) | Status conveyed by color + icon + text |
| 24 | `NeedsHelpIndicator` | Pain-5: Co-parent can't escalate | Red 🆘 badge + banner on tasks marked needs_help | hidden, visible | non-interactive (signal only) | `aria-label="This task needs help"` |
| 25 | `DatePicker` | Pain-4: GAP-006 no date picker | Date selection for task due date in create/edit forms | closed, open | tap → open; select date → confirm | Calendar is keyboard navigable |
| 26 | `FamilySummaryCard` | Pain-5: No co-parent visibility | Cards showing family member status (observer dashboard) | default, loading, empty | non-interactive | Screen reader reads out member + status + count |
| 27 | `TaskQuickComplete` | Pain-1: Fast task completion | Large button outside task card for one-tap completion (helper only) | default, pressed, success | tap → mark complete + visual confirmation | `aria-label="Mark task as done"` |

---

## 5. Gap → Component Mapping

Every molofu3 gap from `state.json`'s `known_gaps_from_molofu3` and pain points from `design.md` maps to at least one component:

| Gap / Pain | Component(s) | Status |
|------------|-------------|--------|
| GAP-001: No week view | `WeekStrip`, `DatePicker` | Designed |
| GAP-002: Single-day only | `WeekStrip` (7-day strip, prev/next week) | Designed |
| GAP-003: Mock data (zero persistence) | `TaskCard`, `CreateTaskModal`, `NoteThread` — all backed by Supabase | Designed |
| GAP-004: No GPS auto-detect | `GPSBanner`, `MapThumbnail` | Designed |
| GAP-005: No "Open in Maps" | `OpenInMapsButton` | Designed |
| GAP-006: No date picker | `DatePicker` | Designed |
| GAP-007: No task detail view | `TaskDetailModal` | Designed |
| GAP-008: No offline mode | `OfflineBanner`, `OfflineIndicator`, `TaskQuickComplete` | Designed |
| GAP-009: No push notifications | `NotificationBell`, `NotificationPanel`, `NotificationItem` | Designed |
| GAP-010: No RLS policies | Supabase RLS (backend — not a UI component) | Backend concern |
| GAP-COPARENT: No co-parent role | `ReassignDropdown`, `ObserverMessagePanel`, `NoteComposer` (observer can use) | Designed |
| BUG-001: Notes gatekeeper | `NoteComposer`, `NoteThread` — all roles can add | Designed |
| BUG-002: Message channel broken | `ObserverMessagePanel`, `NotificationPanel` | Designed |
| BUG-003: Week nav broken | `WeekStrip` — prev/next week buttons fully wired | Designed |
| Pain-1: Zero persistence | All Supabase-backed components above | Designed |
| Pain-2: Exposed credentials | Env vars via `import.meta.env` (not a UI component) | Backend concern |
| Pain-3: GPS blind spot | `GPSBanner`, `MapThumbnail`, `OpenInMapsButton` | Designed |
| Pain-4: Week nav broken | `WeekStrip`, `ConflictBadge`, `ConflictModal` | Designed |
| Pain-5: No co-parent role | `ReassignDropdown`, `ObserverMessagePanel` | Designed |
| Pain-6: Offline mode absent | `OfflineBanner`, `OfflineIndicator` | Designed |
| Pain-7: Notification chaos | `NotificationBell`, `NotificationPanel` | Designed |
| Pain-8: No RLS | Supabase RLS (backend) | Backend concern |
| Pain-9: Notes gatekeeper | `NoteComposer` (roles unlocked) | Designed |
| Pain-10: Message channel broken | `ObserverMessagePanel`, `NotificationItem` | Designed |

**Gap coverage: 17/19 gaps have UI components. GAP-010 and Pain-8 are backend-only. GAP-CRED/Pain-2 is env-var only. All UI-addressable gaps have components.**

---

## 6. Key Feature UI Details

### 6.1 Week View — 7-Day Strip with Swipe Navigation

The `WeekStrip` component is the primary navigation for the Commander dashboard:

```
[‹]  [Sun 26] [Mon 27] [Tue 28] [Wed 29] [Thu 30] [Fri 1] [Sat 2]  [›]
              ↑ bold   ↑ amber  ↑ ⚠️      ↑ today (highlighted)
```

- **Current day:** Deep blue background, white text, rounded pill
- **Selected day:** Blue border, blue text
- **Conflict day:** Orange ⚠️ badge overlaid on corner
- **Navigation:** `‹ Prev Week` / `Next Week ›` buttons shift strip by 7 days
- **Swipe:** Touch swipe left/right also navigates weeks
- **State:** Managed in Zustand — `currentWeekSunday` + `selectedDay`
- **Accessibility:** `role="tablist"` with `role="tab"` per day, arrow key navigation

### 6.2 GPS UI

**On task creation with location:**
1. Browser Geolocation API called via `navigator.geolocation.getCurrentPosition()`
2. If granted → coords stored in `task.gps_lat` + `task.gps_lng`
3. If denied → silently degrade to text-only location (no error shown to user)

**On task detail:**
```
┌─────────────────────────────────┐
│ 📍 St. Mary's Primary School   │
│    Gate 3, Kowloon Tong        │
│ ┌───────────────────────────┐   │
│ │  [Static OSM Map Thumbnail] │  │
│ └───────────────────────────┘   │
│ [📍 Open in Maps]               │
└─────────────────────────────────┘
```

- Map thumbnail: 200×120px static image via OpenStreetMap tile server
- "Open in Maps" → constructs `https://maps.apple.com/?ll=LAT,LNG` or Google Maps equivalent
- GPS denial: location text shown, map section hidden, no error banner

### 6.3 Offline Indicator

**Two-tier offline UI:**

1. **Offline Banner** (full-width, slate `#64748B`):
   ```
   📴 Offline — your changes will sync when connected
   ```
   - Shown at top of content area when `navigator.onLine === false`
   - `role="status"`, `aria-live="polite"` — does not interrupt

2. **Offline Badge** (in header):
   - Small dot or "Offline" pill next to notification bell
   - Indicates persistent offline state

3. **Sync pending indicator:**
   - Tasks completed offline show a ⏳ sync badge until confirmed by Supabase
   - On reconnect: background sync runs, banner briefly shows "Syncing..." then hides

### 6.4 Notification Panel

Slide-down panel triggered by tapping notification bell:

```
┌─────────────────────────────────────┐
│ Notifications              [Mark all read] │
├─────────────────────────────────────┤
│ 🔔 Sarah assigned "Pick up Tim" to you │
│    2 min ago                         │
│ ─────────────────────────────────── │
│ ✅ Maria completed "Buy groceries"  │
│    10 min ago                        │
│ ─────────────────────────────────── │
│ 🆘 David flagged "Lily pickup" needs help │
│    30 min ago                        │
└─────────────────────────────────────┘
```

- Types: `task_assigned`, `task_completed`, `task_needs_help`, `message_received`
- Bell badge shows unread count (red dot with number)
- Tap item → mark read + navigate to task detail
- Stored in Supabase `notifications` table

### 6.5 Co-Parent Role UI (Observer → Co-Parent upgrade)

David (Observer) can now:
- **Add notes** to any task → `NoteComposer` visible on his TaskDetail
- **Reassign task** → `ReassignDropdown` button on each task card
- **Flag needs_help** → 🆘 button on each task
- **Send message to Sarah** → `ObserverMessagePanel` on his dashboard

**Permission toggles (Commander controls in Settings):**
```
┌─────────────────────────────────────┐
│ David's Permissions                 │
├─────────────────────────────────────┤
│ Can add notes        [-toggle ON]   │
│ Can reassign tasks   [toggle ON]   │
│ Can flag needs_help [toggle ON]   │
│ Can message Sarah    [toggle ON]   │
└─────────────────────────────────────┘
```

### 6.6 Anti-Frustration Design — Typhoon Day Handling

When a Typhoon 8/9/10 signal is hoisted (detected via Hong Kong Observatory API or manual commander flag):

**Typhoon Banner (red, top of dashboard):**
```
┌─────────────────────────────────────┐
│ 🌀 TYPHOON SIGNAL 8 — School closed │
│ All pickups cancelled. Tap for details │
└─────────────────────────────────────┘
```

- Full-width red banner, cannot be missed
- Tap → opens Typhoon Detail Modal showing:
  - Which activities/schools are affected
  - Which tasks are auto-cancelled
  - Quick "Mark all affected as cancelled" button
- Commander can set "Typhoon mode" manually if signal not yet in API
- Conflicts for the day are auto-suppressed (cancelled tasks don't conflict)

**Conflict Detection (normal days):**
- System scans week for overlapping tasks (same assignee, within 30 min)
- `⚠️` badge on day in week strip
- Tapping opens `ConflictModal` with:
  - Both conflicting tasks listed with times
  - Suggested action: "Reassign to [other family member]?"
  - One-tap reassign button

---

## 7. Design Dimension Self-Review

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual hierarchy | 8/10 | Primary actions (FAB, DONE) are 56px+. Status conveyed by color+icon+text simultaneously. |
| Consistency | 9/10 | Same spacing tokens, color tokens, typography scale across all screens. Component library unified. |
| Accessibility | 8/10 | Touch targets ≥44px, WCAG AA contrast, ARIA labels on all interactive elements, keyboard navigation for date picker. |
| Responsiveness | 8/10 | Mobile-first design; desktop Observer view is enhanced but not required. Min-width: 320px. |
| Emotional resonance | 9/10 | Design tone is calm and reassuring. Green=peace, red=urgent, amber=warning — mirrors HK family emotional states. |
| Clarity | 8/10 | Task actions are ≤3 taps. Week view eliminates Sunday 90-min planning. GPS removes 30-min daily WhatsApp checks. |
| Performance perception | 8/10 | Skeleton loaders on async content. Optimistic updates on task completion. Offline-first means zero loading when disconnected. |

**Minimum ≥7/10: PASS on all dimensions.**

---

## 8. Accessibility Compliance

- [x] All touch targets ≥44px (Helper DONE button ≥56px)
- [x] Color is never the only signal — icon + color + text always together
- [x] Contrast ratios: all text ≥4.5:1 on backgrounds
- [x] Screen reader labels on all interactive elements
- [x] Keyboard navigation for week strip (arrow keys), date picker, modals
- [x] ARIA roles: `tablist`/`tab` for week strip, `dialog` for modals, `log` for notifications
- [x] `aria-live="polite"` for offline banner and sync status
- [x] Role badges on all note authors (Commander/Helper/Observer)

---

## 9. Phase 2a Gate Checklist

- [x] All 10 pain points from design.md have ≥1 UI component
- [x] All molofu3 gaps (GAP-001 through GAP-010, GAP-CRED, GAP-COPARENT, BUG-001/002/003) mapped to components
- [x] Component Inventory table present with all required columns
- [x] All design dimensions ≥7/10
- [x] Accessibility requirements documented
- [x] Week view, GPS, offline, notifications, co-parent, conflict detection all covered
- [x] Typhoon day anti-frustration design included

---

## 10. Deferrals (with reasons)

| Component | Reason | Phase |
|-----------|--------|-------|
| Push notification infrastructure | Requires server-side push service worker setup | Phase 2+ |
| Full RLS policy system (per-row) | Supabase RLS is backend-only; Phase 1 uses family-level RLS only | Phase 2+ |
| Typhoon calendar API integration | Requires Hong Kong Observatory API key + server-side polling | Phase 2+ |
| WhatsApp-style message thread | F5 observer messaging is in MVP; full thread UI is Phase 2+ | Phase 2+ |
