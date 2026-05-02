# Molofu4 — Product Design (Phase 1)

## Product Vision

**Molofu4 = "管理負擔 4" (Manage the Burden, Gen 4)**

A calm command centre for Hong Kong families. One place where the commander assigns, the helper receives, and everyone knows what happens next — without group chats, without chasing, without the daily coordination overhead that burns out working parents.

**The single promise:** A family coordinator can hand off a task in under 30 seconds and trust it will be done — and a helper can see exactly what to do, where, and when, without calling anyone.

**Target:** Hong Kong dual-income families with domestic helpers. Kids in tuition/activities. Two WhatsApp groups minimum (family + helper). Commanders are busy professionals who cannot be the single point of failure.

**Critical change from molofu3:** Zero mock data. Real Supabase backend from day one. Env vars for credentials. Proper offline mode. Real GPS.

---

## Pain Points

Documented from brownfield gap analysis of molofu3, validated against HK family coordination reality.

### Pain 1: Zero Persistence (CRITICAL — Molofu3 showstopper)
**"Every time I refresh, all my tasks are gone."**
As Sarah, I lose all my tasks on every page refresh because molofu3 used mock in-memory data with zero Supabase integration. This makes the app unusable for any real family.
- **Gap IDs:** GAP-001 through GAP-007 (all caused by no backend)
- **Impact:** App is a demo, not a product. No family would trust it.
- **Maps to Feature:** Real Supabase backend (P0)

### Pain 2: Exposed Supabase Credentials (CRITICAL — Security)
**"My database API key is visible in the source code."**
As a developer, I found hardcoded Supabase URL and anon key in the molofu3 source. Any user who opens DevTools can extract and misuse the credentials.
- **Gap IDs:** GAP-CRED
- **Impact:** Catastrophic if deployed. Credentials must live in `.env`, never in source.
- **Maps to Feature:** Env-var credential management (P0)

### Pain 3: GPS Blind Spot (HIGH)
**"I can't see where Maria is or whether she picked up the kids."**
As Sarah, I have no GPS tracking. I don't know if Maria is en route, stuck in traffic, or just left. I end up calling her to check — which disrupts her during pickups.
- **Gap IDs:** GAP-004 (no GPS auto-detect), GAP-005 (no "Open in Maps")
- **Impact:** Sarah spends 30+ min/day chasing location status via WhatsApp/calls
- **Maps to Feature:** GPS location tracking + "Open in Maps" (P0)

### Pain 4: Week Navigation Broken (HIGH — Molofu3 bug)
**"I can only see today. I can't plan the week."**
As Sarah, I need to see the full week to spot conflicts (Lily's piano at 4pm conflicts with Tim's swimming at 4pm). Molofu3's week navigation is completely broken — `selectDay()` is not wired to the week strip buttons.
- **Gap IDs:** BUG-003 (week nav broken), GAP-001 (no week view), GAP-006 (no date picker)
- **Impact:** Sunday 90-minute planning session is manual and error-prone
- **Maps to Feature:** Week view + date picker + conflict detection (P0)

### Pain 5: No Co-Parent Role (HIGH)
**"David is in Singapore. He can see everything but can't do anything."**
As David, I want to help from Singapore. I see tasks but can only read — I can't reassign, add notes, or flag a conflict. I end up texting Sarah adding to her burden.
- **Gap IDs:** GAP-COPARENT
- **Impact:** David remains a passive observer, Sarah remains the sole bottleneck
- **Maps to Feature:** Co-parent role with split permissions (P0)

### Pain 6: Offline Mode Absent (HIGH)
**"Maria is at the wet market with no data. She can't see her tasks."**
As Maria, I go to the wet market where data coverage is poor. I open the app and see nothing — no cached tasks. I have to call Sarah to confirm what I already know.
- **Gap IDs:** GAP-008 (no offline mode)
- **Impact:** Maria misses tasks or calls Sarah unnecessarily, disrupting her meetings
- **Maps to Feature:** IndexedDB offline mode with background sync (P0)

### Pain 7: Notification Chaos (MEDIUM)
**"I have 200 WhatsApp messages. The important one about Tim's pickup is buried."**
As Sarah, I rely on WhatsApp for family coordination. Important messages get buried under group chat noise. I spend 2+ hours/day managing WhatsApp instead of working.
- **Gap IDs:** GAP-009 (no push notifications)
- **Impact:** 2-4 hours/day of coordination overhead documented for HK working families
- **Maps to Feature:** In-app notification channel + push notifications (P1)

### Pain 8: RLS/Access Control Gap (MEDIUM)
**"David can see everything. I need him to only see the family status, not all family members."**
As Sarah, I want extended family (grandparents, in-laws) to see only specific tasks, not everything. Molofu3 has no row-level security — everyone's view is either all-or-nothing.
- **Gap IDs:** GAP-010 (no RLS policies)
- **Impact:** Privacy risk for sensitive family health/school information
- **Maps to Feature:** Supabase RLS policies for row-level access control (P1)

### Pain 9: Notes Gatekeeper Bug (MEDIUM — Molofu3 bug)
**"Sarah can't add notes to tasks — only helpers can."**
As Sarah, I need to add context notes to tasks (e.g., "Ethan has a dentist appointment on Tuesday, remind Maria to book a taxi"). But the `TaskDetail.tsx` gates note input to `isHelper` only. This is inverted — commanders should be able to annotate.
- **Gap IDs:** BUG-001
- **Impact:** Commander must send clarifications via WhatsApp instead of in-app
- **Maps to Feature:** Fix note authorship — both commander and helper can add notes (P0 quick fix)

### Pain 10: David's Message Channel Broken (MEDIUM — Molofu3 bug)
**"David sent Sarah a message from Singapore. She never received it."**
As David, I tried to send Sarah a note about Tim's reading folder. The ObserverDashboard sends the message but it goes nowhere — there's no backend, no inbox, no notification.
- **Gap IDs:** BUG-002
- **Impact:** David gives up on the app and texts Sarah directly, disrupting her
- **Maps to Feature:** Two-way message channel (Commander ↔ Observer) (P1)

---

## Design Principles for HK Families

**1. Calm over comprehensive.**
The app should feel like a well-organized desk, not a war room. Only show what needs action now. HK working parents are already overwhelmed — the app must reduce cognitive load, not add to it.

**2. Frictionless handoff.**
The commander creates a task in ≤30 seconds, one-handed, in a meeting. Not a form — a quick capture. Every additional field is a reason to WhatsApp instead.

**3. GPS adds trust, not surveillance.**
Location tracking should help Sarah trust that Maria is en route, and help Maria navigate to the exact pickup gate. Location is shared context for coordination, not a surveillance tool. Both parties benefit.

**4. Offline-first for Maria.**
Maria's phone may have no data at the wet market, in MTR tunnels, or at rural tuition centres. The app must work without network. Sync when data returns.

**5. Week view is non-negotiable for Sunday planning.**
HK families book tuition and activities weeks in advance. Sarah needs to see the full week, spot conflicts, and plan coverage. Today-only view is a dealbreaker.

**6. Typhoon calendar integration.**
Hong Kong's Typhoon 8/9/10 signals can cancel school and activities with hours of notice. The app should surface these disruptions clearly — not bury them.

**7. Icons > text for helpers.**
Maria has limited English. Every action should be icon-first with text labels. Color coding supports quick scanning. One-tap interactions where possible.

**8. Graceful degradation for observers.**
David is read-only. His dashboard should be a glance — 30 seconds, laptop, different timezone. No action required, just reassurance.

---

## Target Customer

**Hong Kong Working Families**
- Dual-income parents (commander + co-parent/helper role)
- Domestic helper (helper role)
- Extended family — grandparents, in-laws (observer role)
- Kids: 5-15 years old, enrolled in multiple tuition/activities
- Household has: 2+ WhatsApp groups, shared family calendar, school communication app

**Where they are:** Commuting MTR, at office, in meetings, cooking, sending kids to activities.
**When they need this:** 7-8am (morning coordination), 3-4pm (pickup coordination), 8-9pm (evening planning).
**Typhoon scenario:** T8 signal hoisted at 10am — school cancelled, pickup times change, all plans disrupted. Sarah needs to update everyone in under 60 seconds.

---

## User Personas

### Persona 1: Sarah Chen (Commander)

**Who:** 38-year-old marketing director. Mother of 2 (Tim, 9; Lily, 6). Employs helper Maria. Lives in a 800 sq ft apartment in Kowloon Tong.

**Context:** Works 5 days a week, often in meetings until 6-7pm. Coordinates everything for the household — groceries, kids' activities, helper instructions, school communication. She is the default "commander" and the single point of failure.

**Constraints:**
- 30 seconds to act while in a meeting
- One hand occupied (holding phone or coffee)
- Stressed, distracted, context-switching
- Speaks Cantonese and English; helper speaks limited English
- Phone: iPhone 14, primarily used one-handed

**Goal:** Hand off a task and trust it will be done. Free her mind for actual work.

**Frustrations:**
- WhatsApp messages get buried under 200 other messages
- "Seen" doesn't mean "understood" — Maria arrives at school 30 minutes late because the message wasn't clear
- Chasing Maria for status updates is a daily job
- When she forgets to send a morning instruction, the whole day is disrupted
- Sunday planning session for the week ahead takes 90 minutes of mental load
- GPS blind spot — she doesn't know if Maria is en route or stuck
- No visibility into tomorrow beyond guessing

**Success looks like:** Sarah opens the app, sees her 3 priority tasks for today + the week at a glance, knows Maria is on track via GPS, and closes the app in 20 seconds.

**Failure looks like:** Sarah spends her 15-minute coffee break chasing Maria via WhatsApp, then has to call the school to apologize for the late pickup.

---

### Persona 2: Maria Santos (Helper)

**Who:** 32-year-old Filipino domestic helper. Has worked for the Chen family for 2 years. Speaks Tagalog at home, English at work, understands basic Cantonese. Takes kids to school and activities.

**Context:** Carries kids to school, wet market, tuition centres. Uses phone primarily standing, outdoors, in bright sunlight. Sometimes in noisy environments. Limited English reading comprehension.

**Constraints:**
- Limited English — labels must be simple or have icons
- Bright sunlight, wet hands, noisy environment
- Needs to see tasks without scrolling through chat history
- No access to WhatsApp during work hours (employer policy)
- Phone: Budget Android, 2-3 years old, sometimes slow
- May have no data connection at wet market or rural tuition venues

**Goal:** Know exactly what to do, by when, without guessing or calling. Feel competent and trusted.

**Frustrations:**
- Long WhatsApp messages buried under other messages
- Instructions like "pick up Tim from basketball at 4pm" arrive without enough context — where exactly? which gate?
- When confused, Maria feels embarrassed asking — so she guesses and sometimes gets it wrong
- No way to tell Sarah "I'm running late" without calling (which interrupts meetings)
- Offline at wet market = no access to tasks = calls Sarah
- Sunday is her day off — tasks assigned Saturday night for Monday appear without warning

**Success looks like:** Maria opens the app at 7am, sees her task list for the day (offline-cached), knows the exact pickup location from the app, marks tasks done with one tap, and completes everything without calling Sarah once.

**Failure looks like:** Maria calls Sarah 3 times today because instructions were unclear, disrupting her meeting twice.

---

### Persona 3: David Chen (Co-Commander / Observer)

**Who:** 40-year-old finance director. Sarah's husband. Travels frequently for work (50% of the time in Singapore/Shanghai). Wants to actively help, not just observe.

**Context:** Laptop browser, different timezone, limited time to check in. Feels guilty about not being present. Currently read-only in molofu3 — he can see everything but do nothing.

**Constraints:**
- Laptop browser (not mobile)
- Different timezone (may be asleep when things happen)
- Wants to actively help, not just read
- Limited time — checks in 2-3x per day, 30 seconds each
- Not tech-savvy for complex task management

**Goal:** In 30 seconds, know if the family is on track and be able to help — reassign a task, flag a conflict, send Sarah a note.

**Frustrations:**
- WhatsApp groups are noise — 500 messages he doesn't need to read
- He can see tasks but can't do anything — feels helpless
- Has to text Sarah to help, which adds to her burden
- No way to say "I'll take Tim to his Saturday game" from Singapore
- Read-only view in molofu3 makes the app useless for him

**Success looks like:** David opens his laptop, sees a one-line status: "Kids: on track. Maria: 3 tasks done, 1 in progress." He sees a scheduling conflict, taps "Help" to reassign a task, and closes the laptop.

**Failure looks like:** David sees a conflict in Sarah's schedule, wants to help, but the app won't let him. He sends a WhatsApp. Sarah is in a meeting, doesn't see it, and the conflict isn't resolved.

---

## MVP Wedge

The smallest thing that delivers real value and addresses documented pain points:

**Molofu4 MVP = Real Backend + Week View + GPS + Offline**

- Real Supabase backend (pain_point_coverage: Pain 1, Pain 2)
- Week view + date picker + conflict detection (pain_point_coverage: Pain 4)
- GPS tracking + "Open in Maps" (pain_point_coverage: Pain 3)
- Offline mode (IndexedDB + background sync) (pain_point_coverage: Pain 6)
- Co-parent role with reassign/help capability (pain_point_coverage: Pain 5)
- Fix notes authorship bug (pain_point_coverage: Pain 9)

What is explicitly OUT of scope for MVP:
- Push notification infrastructure (P1, not P0)
- Full RLS policy system (P1, not P0)
- WhatsApp-style notification channel (P1, not P0)
- Typhoon calendar integration (P2)

---

## Blocking Requirements

These are NOT "Phase 2" items — the MVP cannot deliver value without them:

1. **Supabase project** — must exist with auth + database + realtime enabled before any code is written
2. **Environment variables** — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` must be loaded from `.env`, never hardcoded
3. **IndexedDB** — must be implemented for offline mode; no service worker complexity for MVP, just direct IndexedDB read/write
4. **GPS API** — browser Geolocation API; graceful fallback if denied
5. **Week view component** — must be built, not just designed

---

## Success Metrics

1. **Task creation time:** Sarah creates a task in ≤30 seconds, ≤4 taps
2. **Offline access:** Maria sees her cached tasks at the wet market with zero network
3. **GPS visibility:** Sarah sees Maria's current location on the task detail screen
4. **Week view usage:** Sarah plans the full week on Sunday without opening any other app
5. **Persistence:** All tasks survive page refresh, browser close, next-day open
6. **David's engagement:** David performs at least 1 helpful action per week (reassign, flag, note)
7. **Zero credential exposure:** No Supabase URL or anon key in source code or network tab

---

## Competitive Analysis

### Existing Tools HK Families Use

| Tool | Why It Fails for This Pain |
|------|--------------------------|
| WhatsApp Groups | Messages buried, "seen" ≠ understood, no task state, no offline, language barrier for helpers |
| Shared Calendar (Google/Apple) | No location, no assignee clarity, no completion tracking, too technical for helpers |
| Apple Family Sharing | Designed for Apple IDs, not household coordination, no task assignment |
| WeChat | Not designed for task management, closed ecosystem |
| Trello/Asana | Too complex for home use, helpers can't use them, designed for work teams |

### Why They Would Switch

**Switching cost:** Low. The alternative (WhatsApp chaos) is already painful. Molofu4 replaces WhatsApp for coordination tasks with a structured system.

**Switching benefit:** Saves 2-3 hours/day of coordination overhead. Reduces school pickup mistakes. Gives helpers confidence. Keeps traveling co-parent engaged.

**Net:** A motivated commander (Sarah) would switch. The app must prove trustworthy through real persistence and zero downtime.

---

## Phase 1 Completion Criteria

- [x] Pain points identified and documented (10 documented, mapping to 9 molofu3 gaps)
- [x] Competitive analysis completed (WhatsApp, calendars, existing tools, why they fail)
- [x] MVP wedge defined (backend + week view + GPS + offline + co-parent + bug fixes)
- [x] Blocking requirements identified (Supabase project, env vars, IndexedDB, GPS API)
- [x] Success metrics defined (7 measurable criteria)
- [x] Personas validated (3 personas, real HK constraints, emotional states documented)
- [x] Design.md written (this document)
