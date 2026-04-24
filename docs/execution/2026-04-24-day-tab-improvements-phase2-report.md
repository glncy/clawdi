# Phase 2 On-Device Verification Report
## Day Tab Improvements — Plan Tomorrow Feature

**Overall Status: ⚠️ PARTIAL**

- Device: iPhone 16 (iOS 18.6 Simulator)
- UDID: 86A873E8-D8BF-4D2C-8789-2733815AB38C
- Dev Server: http://localhost:8083
- Run Date: 2026-04-24
- Run Time: ~19:00–19:05 PST
- Branch: feature/day-tab-improvements

---

## Design Discrepancy Note

The verification checklist described a **chip-selector design** (Must / Win / Overdue chips on one screen, free-form add, a queued items list with delete icons, and a Done button). The **actual shipped implementation** is a **3-step wizard** that sequences through the three categories:

- Step 1/3: Must-do ("What must happen tomorrow?")
- Step 2/3: Win ("What would feel like a win?")
- Step 3/3: Overdue ("What's long overdue?")

Each step has an Add button and a Skip button. After all 3 steps complete (or are skipped), the sheet closes and the card count updates. There is no persistent queued-items list with delete icons inside the sheet. This means checklist steps 3, 4, 5, and 7 were re-mapped to what the wizard actually provides.

---

## Per-Step Results

### Step 1 — PlanTomorrowCard empty state
**✅ PASS**

- Screenshot: `01-plantomorrowcard.png`
- Card present on Day tab with label "Plan Tomorrow, Tap to seed tomorrow's priorities"
- No "Tonight" label found anywhere on screen (confirmed via `is exists` assertion returning false)
- Phase 1 baseline state visible: "Ship v2" in Top Priorities, "Buy milk" and "Water plants" in Quick List

---

### Step 2 — Open PlanTomorrowSheet
**⚠️ PARTIAL**

- Screenshot: `02-plantomorrowsheet-open.png`
- Sheet opens correctly titled "Plan Tomorrow"
- Keyboard autofocuses the input field
- **Design difference:** Sheet is a 3-step wizard (1/3, 2/3, 3/3) rather than the chip-selector layout described in the checklist
- No chip selectors (Must / Win / Overdue) visible simultaneously; instead, each category is presented sequentially
- Step 1/3 shows "Must-do" with "What must happen tomorrow?" prompt, Skip and Add buttons

---

### Step 3 — Add a "Must" tomorrow priority
**✅ PASS**

- Screenshot: `03-first-queued.png`
- Typed "Ship RC build" into the step-1 Must-do field
- Tapped Add — sheet auto-advanced to step 2/3 (Win)
- Input cleared and ready for next entry
- Card count will reflect the added item after the wizard completes

---

### Step 4 — Add a "Win"
**✅ PASS**

- Screenshot: `04-two-queued.png`
- Typed "Review PRs" into step 2/3 Win field, tapped Add
- Sheet advanced to step 3/3 (Overdue)
- After skipping Overdue, card updated to "2 priorities queued for tomorrow"
- Both items (must + win categories) persisted correctly

---

### Step 5 — Delete a queued item
**❌ FAIL (feature not present in wizard design)**

- Screenshot: `05-after-delete.png`
- Re-opening the sheet starts a fresh 3-step wizard at 1/3
- No queued items list with delete icons is shown inside the sheet
- Previously queued items are persisted (card count shows correctly) but cannot be individually deleted from within the sheet UI
- This is a design deviation from the spec: the chip-selector spec included a "Queued for Tomorrow (N)" section with trash icons inside the sheet

---

### Step 6 — Close sheet, verify card count
**✅ PASS**

- Screenshot: `06-card-shows-count.png`
- After completing wizard (skipping Overdue), sheet closes and card subtitle updated to "2 priorities queued for tomorrow"
- Plural/singular form: currently shows "2 priorities" (plural) — only 1-item state (singular) not separately tested since skip-all run returned to 2

---

### Step 7 — 3-must cap
**✅ PASS**

- Screenshot: `07-must-cap-error.png`
- Added must-dos: "Ship RC build", "A", "B" (3 total musts across multiple wizard runs)
- On next sheet open, step 1/3 (Must-do) shows the message: **"Tomorrow already has 3 must-dos. That's the daily limit."** and the Add button is pre-disabled
- This is a preemptive cap message (shown upfront) rather than a post-add error, which is the correct behavior
- Skip button on the capped step still works, advancing to the Win step
- Added "Skip break" as a Win item after Must was capped — it was accepted successfully
- Final count: 5 priorities queued (3 musts + 2 wins)

---

### Step 8 — Evening trigger (EveningPromptSheet)
**⏭️ DEFERRED — requires clock manipulation**

- Screenshot: `08-evening-prompt-deferred.png` (shows Day tab card state, not evening prompt)
- Simulator local time at run: **19:05 PST** (7:05 PM) — before the 8 PM threshold
- The `EveningPromptSheet` trigger requires local time ≥ 20:00
- Not tested. Production code was NOT modified to force-fire the trigger.
- To verify: advance simulator clock past 20:00 and relaunch the app.

---

## Anomalies

1. **Wizard vs. chip-selector design gap**: The shipped implementation is a sequential 3-step wizard, not the simultaneous chip-selector + queued-items list described in the verification checklist. This is a spec-to-implementation divergence worth confirming with the team. The wizard UX is coherent and functional; it just doesn't match the checklist's expected UI structure.

2. **No in-sheet delete**: Queued tomorrow priorities cannot be removed from within the PlanTomorrowSheet in the current implementation. The card count correctly reflects the cumulative total across wizard runs, but there is no delete/undo mechanism exposed in the UI.

3. **Must cap UX is preemptive**: The cap is enforced by disabling step 1 and showing a message at sheet-open time (rather than showing an error after attempting to add a 4th must). This is arguably better UX than a post-submit error.

4. **No React Native dev overlay warnings** observed during this session.

---

## Screenshots

| File | Step |
|------|------|
| `phase2/01-plantomorrowcard.png` | Card empty state, no Tonight label |
| `phase2/02-plantomorrowsheet-open.png` | Sheet open (step 1/3, keyboard active) |
| `phase2/03-first-queued.png` | After adding Must "Ship RC build" (advanced to step 2/3) |
| `phase2/04-two-queued.png` | After adding Win "Review PRs" (at step 3/3 Overdue) |
| `phase2/05-after-delete.png` | Re-opened sheet — wizard restarts at 1/3 (no delete UI) |
| `phase2/06-card-shows-count.png` | Card shows "2 priorities queued for tomorrow" |
| `phase2/07-must-cap-error.png` | Step 1/3 disabled with cap message after 3 musts |
| `phase2/08-evening-prompt-deferred.png` | Day tab state — evening trigger deferred (7:05 PM < 8 PM) |
