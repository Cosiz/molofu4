# Scenario Matrix — molofu3

**Generated:** 2026-05-02T09:32:43.755554
**Total scenarios:** 29

## Roles
- Commander
- Helper
- Observer

## Pain Points

## Scenario Matrix

| ID | Category | Role | Scenario | Expected |
|----|----------|------|----------|----------|
| S001 | Create Task | Commander | Commander creates task via + button — happy path | PASS |
| S002 | Create Task | Helper | Helper creates task via + button — happy path | PASS |
| S003 | Create Task | Observer | Observer creates task via + button — happy path | PASS |
| S004 | Task View | Commander | Commander sees their tasks on app open | PASS |
| S005 | Task View | Helper | Helper sees their tasks on app open | PASS |
| S006 | Task View | Observer | Observer sees their tasks on app open | PASS |
| S007 | Notes | Commander | Commander adds a note to a task | PASS |
| S008 | Notes | Helper | Helper adds a note to a task | PASS |
| S009 | Notes | Observer | Observer adds a note to a task | PASS |
| S010 | Task Completion | Commander | Commander marks task as complete | PASS |
| S011 | Task Completion | Helper | Helper marks task as complete | PASS |
| S012 | Task Completion | Observer | Observer marks task as complete | PASS |
| S013 | Needs Help | Commander | Commander marks task as needs help | PASS |
| S014 | Needs Help | Helper | Helper marks task as needs help | PASS |
| S015 | Week/Calendar | Commander | Commander navigates to next day view | PASS |
| S016 | Week/Calendar | Commander | Commander creates task for tomorrow | PASS |
| S017 | Week/Calendar | Commander | No conflict when scheduling overlapping times | FAIL (gap) |
| S018 | GPS/Location | Commander | Commander enters location as free text | PASS |
| S019 | GPS/Location | Helper | Helper sees location on task | PASS |
| S020 | GPS/Location | Commander | No GPS auto-detect button | FAIL (gap) |
| S021 | GPS/Location | Commander | No Open in Maps from task detail | FAIL (gap) |
| S022 | Observer | Observer | Observer sees family status summary | PASS |
| S023 | Observer | Commander | Observer sends message to Commander | PASS |
| S024 | Observer | Observer | Observer has no create task button | PASS |
| S025 | Observer | Observer | Observer sees all family tasks | PASS |
| S026 | Cross-Role | Commander | Role switch between any two roles | PASS |
| S027 | Cross-Role | Commander | Dashboard loads in < 3s | PASS |
| S028 | Cross-Role | Commander | Status badge visible per task | PASS |
| S029 | Cross-Role | Commander | Stat cards show Done / In Progress / Needs Help | PASS |

## Verification Criteria Coverage
- VC-001: | Sarah can create a task in ≤30 seconds | Sarah | S1: quarterly meeting | dynamic | Timer test: cre
- VC-010: | Today's tasks visible without scrolling | Maria | S2: morning, 7:15am | dynamic | Load app, measur
- VC-020: | Dashboard loads in ≤2 seconds | Sarah | S2: 5pm, just left meeting | dynamic | Network timing, no 
- VC-030: | One-tap marks task complete | Maria | S1: completed pickup | dynamic | Tap checkmark, verify statu