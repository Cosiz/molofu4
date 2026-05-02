# Verification Criteria — Molofu3 Phase 1

Each criterion traces back to a persona journey step or scenario matrix entry.

## P0 — MVP Criteria

### Create Task (Sarah)

| ID | Criterion | Persona | Scenario | Type | Verification Method |
|----|-----------|---------|---------|------|---------------------|
| VC-001 | Sarah can create a task in ≤30 seconds | Sarah | S1: quarterly meeting | dynamic | Timer test: create task from blank screen to confirmation |
| VC-002 | Task creation requires ≤4 taps | Sarah | S1: quarterly meeting | dynamic | Count taps from app open to task sent |
| VC-003 | Task creation works one-handed | Sarah | S1: quarterly meeting | dynamic | One hand simulation (disable dominant hand) |
| VC-004 | Confirmation clearly shows "Sent to Maria" | Sarah | S1: quarterly meeting | dynamic | Visual confirmation after task creation |
| VC-005 | Voice input option for task title | Sarah | S1: one-handed, rushed | dynamic | Voice button present, transcribes correctly |
| VC-006 | Auto-suggest assignee based on role | Sarah | S1: fast assignment | static | Check autocomplete behavior |

### Helper Task View (Maria)

| ID | Criterion | Persona | Scenario | Type | Verification Method |
|----|-----------|---------|---------|------|---------------------|
| VC-010 | Today's tasks visible without scrolling | Maria | S2: morning, 7:15am | dynamic | Load app, measure scroll required |
| VC-011 | Each task shows: what, when, where | Maria | S2: morning | dynamic | Inspect task card content |
| VC-012 | Task detail (location/notes) visible on tap | Maria | S3: school gate | dynamic | Tap task, verify details shown |
| VC-013 | No text input required in task view | Maria | S4: wet hands | dynamic | No keyboard appears during task review |
| VC-014 | Language is simple, icon-supported | Maria | S2: limited English | dynamic | Content matches Maria's English level |
| VC-015 | One-tap "Question" sends to Sarah | Maria | S5: confused | dynamic | Tap question, verify note appears in Sarah's view |

### Family Timeline (Sarah Dashboard)

| ID | Criterion | Persona | Scenario | Type | Verification Method |
|----|-----------|---------|---------|------|---------------------|
| VC-020 | Dashboard loads in ≤2 seconds | Sarah | S2: 5pm, just left meeting | dynamic | Network timing, no loading spinner |
| VC-021 | Top 3 priority tasks visible on open | Sarah | S1: 7:30am coffee | dynamic | Count visible tasks without scroll |
| VC-022 | Status badge visible per task | Sarah | S4: in meeting, glancing | dynamic | Verify badge (On track / Late / Needs help) |
| VC-023 | Conflict detected 2+ hours in advance | Sarah | S1: 4pm double-booking | dynamic | Create overlapping tasks, verify warning |
| VC-024 | Week view shows all 7 days | Sarah | S3: Sunday planning | dynamic | Navigate to week view, count days visible |

### Task Completion

| ID | Criterion | Persona | Scenario | Type | Verification Method |
|----|-----------|---------|---------|------|---------------------|
| VC-030 | One-tap marks task complete | Maria | S1: completed pickup | dynamic | Tap checkmark, verify status changes |
| VC-031 | Completion confirmation visible to Sarah | Sarah | S3: in meeting | dynamic | Mark task done, verify Sarah sees it |
| VC-032 | Maria can add note on completion | Maria | S2: gear forgotten | dynamic | Complete with note, verify note in Sarah's view |
| VC-033 | Sarah receives push notification on completion | Sarah | S3: meeting | dynamic | Complete task, verify notification appears |

---

## Dynamic Verification Rules

- **≥50% of criteria must be dynamic** (browser-verified user flows)
- Each persona must have ≥3 dynamic criteria
- Each feature must have ≥1 criterion per scenario in the Scenario Matrix
- Presence-only criteria capped at 15%

## Not Tested (Pending Phase 1b Gate)

The following are not verified until Phase 1b (User Validation Gate) passes:
- Persona plausibility (are these real HK families?)
- Pain point market evidence (do HK families actually complain about this?)
- Competitor gap analysis (does this actually beat WhatsApp?)
- Journey step count vs alternatives (is this faster than WhatsApp?)
