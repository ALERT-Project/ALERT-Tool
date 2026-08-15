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
