# ALERT Tool Changelog: A9.1 (22 August 2026)

This is a point release on top of A9.0: Quick Review keeps its shape and changes its model, from a shortened questionnaire to a list. It also carries a set of scoring fixes found while building it, several of which were under-calling patients.

**Everyone needs to hard-refresh once** (Ctrl+Shift+R, or Cmd+Shift+R on a Mac) to pick this up.

### ⚠️ Read this first: scoring corrections

* **Every measured observation now scores in Quick Review.** The category was reading the ADDS total but not the parameters it is calculated from, so an SpO2 of 84, an SBP of 82, an HR of 135, an RR of 28 and a temperature of 39.1 each came out **CAT 3 in Quick Review and CAT 1 in Full Review**. Those thresholds are the safety net for exactly what a total misses - one catastrophic parameter inside an unremarkable score, or a MODS in use - and the net was off in the mode most likely to be used at speed.
* **Oxygen no longer sits behind the respiratory gate.** A patient recorded on 4L nasal prongs scored nothing at all unless "Respiratory Concern?" had also been answered Yes. A flow rate is a measurement: 4L is 4L whether or not anybody called it a concern. The gate keeps the subjective half - dyspnoea, cough, swallow.
* **Risks carried from the last note now score.** In Quick Review a carried risk sits on the list rather than in a gate, and while it is there it carries the weight the gate it came from was carrying - including red, where the detail made it red. Deleting it is what withdraws it. A risk sitting in plain sight scoring nothing is how a category gets missed by someone working from the list.
* **Temperature is one ladder.** It was judged by two rules with two thresholds and neither said so: 38.5 exactly fell through the febrile rule and came out amber through the infection gate, as a bare "Infection risk" with no reason and no temperature stated. Now 38.0-38.4 is amber with the temperature named, 38.5 and above is febrile, 35.5 and below is red.
* **CRP reaches the note.** It was missing from the bloods line entirely, so however high it went the value was never written down - it could open the infection gate and be quoted inside "Infection risk - CRP 250", but the number itself was nowhere.
* **Bloods import from notes that recorded a collection time.** The note writes "Bloods (taken 20/08 06:00):" and the importer only ever matched a bare "Bloods:", so every note written since the collection time was added lost its bloods on import in silence - previous values, trend arrows and every trend-based rule with them.

### 📋 Two lists instead of one

* **Patient Factors and Readmission Risks** replace the single Review List. One list was holding "assist x1 with frame" and "high K+ 6.4" at once and asking the reader to sort them out. Each takes its own typed entries, so what you write lands where you wrote it.
* **"From the last review" is gone.** It listed the same carried gates that were already outlined and badged in place further down, so every carried concern was on screen twice in two different shapes.
* **Rows say "delete", not "resolve".** Most of what sits on these lists arrived from the previous note, and "resolved" asserts that something was dealt with, which is not what clearing an inapplicable line means. It is still reversible - the row strikes through and the button offers undo.
* **Lines say how long they have been carried.** A list that only grows stops being read; by day five a line nobody has pruned looks exactly like one raised this morning.
* **A quiet nudge** names how many carried lines have not been looked at, and clears as they are dealt with.

### ⚡ Quick Review is a list, not a questionnaire

* **Entering Quick Review hands the gates back.** A gate silently set to Yes on the strength of yesterday's note is a finding nobody made today. The risk goes onto the list in the previous reviewer's own wording, where it can be edited or deleted.
* **A carried blood concern keeps its concern and loses its numbers.** "Infection risk - WCC 16, CRP 180" carries across as "Infection risk". If today's bloods raise the same concern, today's finding supersedes it rather than both being stated.
* **The category is a decision, not an override.** No downgrade warning and no reason demanded - the tool has seen the score, the bloods and two demographic facts, and is in no position to treat your call as a correction of its own. Age and ICU length of stay keep counting in both modes.
* **A discharge question** appears once the category is chosen, naming the time on the list. CAT 2 is deliberately silent: asking "continue, or discharge pending bloods?" at a day and a half puts the second half of the sentence in your head.

### 📄 Note output

* **PATIENT FACTORS is a new section.** Mobility, diet, nutrition and the psychosocial answers were printing scattered across three parts of the assessment. They are one thing, they now print as one, and - unlike loose lines - the next import can read the whole section back.
* **Everything under the risk heading survives into the next note**, whether it came from a gate, from the previous note or from you. Risks the tool works out for itself are excluded, so they do not arrive as text beside the copy the rules are about to produce.
* **Mitigated risks come back mitigated.** "Renal concern (mitigated: known CKD...)" was being matched on "renal", carried to the renal gate and set to Yes - so a risk the previous reviewer had discounted came back as a live one, the mitigation destroyed by the act of reading the note.
* **The note no longer narrates itself.** An override with no typed reason used to write "Clinician override: CAT 1" into the risk factors. The selection still stands; it just no longer announces that the category came out of a piece of software. A typed reason is your own words and still belongs in the record.
* **Plan wording throughout**: "re-contact ALERT for re-review", the missing "is" in "if further support required", and a comma-spliced pending-bloods line that left its whole meaning in a bracket. The not-suitable case stated its plan twice in different words; it now states it once.

### 🩸 Bloods

* **Potassium gets a replacement prompt** between 3.0 and the reference range, alongside magnesium and phosphate. A K of 3.2 previously produced nothing.
* **Sodium is named** between the risk thresholds and the reference range, where it previously produced nothing. It is stated and not prompted on - a sodium in that band is often a diagnosis in its own right rather than a number to top up, and correcting it is the treating team's call.
* **Out-of-range results no longer stage a list row.** The value is in the grid, highlighted, and on the note's bloods line; out-of-range is not the same as worth flagging. Only the severe ones become risks. The handover line still names them.
* **The clotting target boxes no longer suggest a target.** "target 2-3" was being read as this patient's target rather than as an example of what to type.

### 🧹 Fixes

* **Clearing for the next patient takes the carried-forward marks with it.** The gate answers, the "(Prev: ...)" hints and the name were cleared, but not the carried-forward marks - so a new patient's form opened wearing the last patient's badges, with their clinical detail still behind them.
* **The floating bloods card can be closed from the bottom** as well as the corner, the way the ADDS calculator has been since May.
* **Psychosocial & Recovery is formatted like the A-E section it sits in**, rather than as a bordered box with its own heading size.
* On screen, "CAT 3 Green" loses the redundant colour, and "Yes - Pending Next Bloods" - which answered a question that was not there - becomes "Discharge pending next bloods".

---

# ALERT Tool Changelog: A9.0 (15 August 2026)

This release was piloted on the testing page before going out, and most of what follows came from people using it on the ward and telling us what got in the way. The headline is **Quick Review**: a stripped-back mode for day 2+ follow-ups, which are the bulk of the workload and were being done on a form built for first assessments. The rest is the accumulated set of fixes and wording changes raised during the pilot.

**Everyone needs to hard-refresh once** (Ctrl+Shift+R, or Cmd+Shift+R on a Mac) to pick this up.

### ⚡ Quick Review

* **A follow-up no longer requires the full form.** Quick Review hides the Risk Assessment, A–E and Patient Background sections and lays the rest out in two columns — review list, lines and devices, and the write-up — so a day 2+ review is one screen rather than a scroll.
* **It is offered automatically.** More than 24 hours since stepdown and the tool raises a **"Day 2+ follow-up detected"** prompt, with the choice of taking Quick Review or staying in Full Review. Coming in from a DMR import, the prompt also lists the risks carried over from the previous note, since those are what the follow-up is actually about.
* **New Review Depth toggle** in the review strip switches between Full and Quick at any point, in either direction, without losing what has been entered.
* **New risks are still caught.** Entering Quick Review takes a snapshot of the patient's current risks. Anything flagged after that point raises a banner naming the new risks and counting them by severity, so the shorter form does not mean a quieter one.
* **Bloods sit behind three quick buttons**, with a **Details** control that opens the full grid as an overlay without leaving Quick Review. Lines and devices open by default, because the add-chips are the reason that section is on the page at all.
* Full Review is unchanged and remains the default for first reviews and pre-stepdown assessments.

### 📄 Note & Handover Output

* **The Excel handover line no longer ends with "Continue ALERT."** A patient still on that sheet is still under review — discharging them moves them to a different sheet — so the cell was restating what the sheet already said. Discharge, pending-bloods and not-suitable-for-stepdown outcomes still print, the checkbox remains, and it still drives the REDCap outcome. The DMR note still states that reviews continue in its PLAN section.
* **New "Copy Handover Line" button**, so the line no longer has to be selected by hand.
* **A score with no A–E findings prints as a bare score.** The "A-E ASSESSMENT:" heading was announcing an assessment that had not been done, which is the usual shape of a Quick Review note.
* **Fixed "1 days" and "1 hours"** in time since stepdown, which appeared whenever the rounding landed on exactly one. Half days correctly keep their plural.
* **Fixed a stray space** before the comma on the HR line when no rhythm was recorded.

### 🖊️ Review Details & Data Entry

* **Review Method (Physical r/v vs Chart review) is no longer pre-ticked and no longer carries between patients.** If it is still blank when the note is generated, the tool asks. Previously a wrong method was only discoverable after the note had been pasted into DMR.
* **The Reviewer field no longer carries a placeholder.** It held one real set of initials, so every reviewer saw the same name sitting in the box until they typed over it.
* **The Quick Review offer no longer fires mid-typing.** A date input reports a valid value for every keystroke of the year — 0002, 0020, 0202 on the way to 2026 — and each of those read as long past stepdown, so the prompt appeared during entry and took the focus with it. Stepdown dates in the future or before this tool existed are now treated as typos rather than long-stay patients.
* **Review Type is now "Review Stage"**, and **"Other Factors" is now "Patient Background"**.
* **Placeholders and button text stop explaining things clinicians already know.** The mitigator confirmations now name their effect on the score, and make clear that the risk is recorded in the note either way.

### 🧠 Clinical Logic & Scoring

* **2L nasal prongs now scores 1 on the ADDS calculator**, down from a 3L threshold. The risk rules still only flag nasal prongs at 3L: the score describes the patient as they are, the flag decides what is worth escalating.
* **New "Enter MODS" control** beside the ADDS score for patients whose parameters have been modified and where the calculator does not apply, with a field for the detail.
* **New "Long stay but recovering well?" mitigator.** Long stay can now be mitigated with a reason, in the same way as the age mitigator. The risk still prints in the note, marked as mitigated, rather than disappearing.

### 📲 Install as an App

* **Both sites now have proper home screen icons.** Saving the tool to a home screen previously gave a blank tile or a page screenshot.
* The live tool installs as **"A! Tool"** — a white **A** and a red **!** on teal. The pilot page installs as **"A! Test"** — the same mark on amber under a **TEST** band, so the two cannot be confused on a home screen.
* Both open without browser chrome. **Anyone who already saved a shortcut needs to delete and re-add it**, as the icon is cached at the moment it was added.

### 🔌 Importer & Layout

* **"Import data from last DMR note" is now the primary action** at the top of the form. It is worth using: it pulls the previous risks through and feeds the Quick Review prompt.
* **The review control strip is now an even grid.** Every toggle is the same width, Review Depth sits beside the other three rather than orphaned in the patient header, and heights and corner radii are consistent across toggles and inputs.
* **Breakpoints added** for the strip: two columns at 900px, one column with 44px touch targets at 600px.
* **HFNP and NIV fields in the respiratory gate are no longer clipped** — grid spans inside a nested panel now resolve against the gate card rather than the full page.
* **Mobility levels read as prose** — "1x assist", not "1x Assist".

### 🧪 Behind the Scenes

* The risk rules are now a separate, self-contained module with no access to the page, the clock or storage, which means they can be tested directly against invented patients.
* The tool ships with **96 automated tests** covering the risk rules, the note output and the interface wiring, run against the real page and the real build.

---

*Deliberately not included: an offline cache (service worker). It would let the tool run without a connection, at the cost of making stale versions much harder to clear — the opposite of what is wanted right after asking everyone to refresh.*
