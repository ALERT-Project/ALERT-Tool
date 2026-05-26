# ALERT Tool Changelog: New Features & Upgrades (May 2026)

Over the past month, we have focused on modernizing the user interface, improving clinical safety logic, and streamlining the post-ICU discharge workflow to reduce alarm fatigue and improve clinical efficiency. Here are the major changes in this release:

### 🆕 Clinical Workflow & Decision Support
* **Discharge Pending Next Bloods Feature:** 
  * You can now mark a patient as **"Discharge pending next blood results"** in the ALERT Actions panel. 
  * The discharge prompt has been redesigned with a clean three-way decision: **"Yes - Discharge"**, **"Yes - Pending Next Bloods"**, or **"No - Keep on list"**.
  * A dedicated clinical inputs box is automatically revealed when pending bloods is selected, allowing you to document the specific blood parameters of interest.
  * The discharge confirmation modal now correctly validates and fires for low-acuity (CAT 3 / Green) patients within 24 hours of stepdown, and tracks confirmation states (`window.dischargeConfirmed`) to prevent infinite looping.
* **Overnight Shift Handover Banner & Quick-Discharge:**
  * High-visibility **Shift Handover Banner** added at the top of the interface when the overnight team has recommended a discharge pending bloods & DMR review.
  * Features a single-click **"⚡ Discharge Patient"** quick-approval button to execute the recommendation instantly.
* **Age Risk Mitigator Banner:**
  * For patients age 75 or older, an inline mitigator banner is now displayed.
  * If the patient's baseline function is high, clinicians can click a new **"Mitigate Risk"** button and enter a justification (e.g., *"marathon runner, highly functional"*) to bypass automatic age-based alert escalations.

### 🧠 Clinical Logic & Safety Refinements
* **Respiratory Risk Prioritization Fix:** Corrected a critical logic priority bug where low-level oxygen support (Nasal Prongs < 2L) was incorrectly triggering a low-level Amber (CAT 2) flag and overriding more severe Red (CAT 1) respiratory indicators (such as tachypnea or poor cough). High-acuity respiratory factors now correctly escalate the patient to a Red flag regardless of the oxygen method.
* **Decoupled Known Frailty:** "Known Frailty" has been decoupled from age-based risk scoring, now operating as an independent clinical risk factor for clearer clinical tracking.
* **Dropping Hemoglobin Detection:** Improved logic to track and trigger a low Hb warning if hemoglobin is <= 90 g/L and either the dropping Hb checkbox is marked or the blood trend indicator shows decreasing (↓).
* **Smarter Input Syncing:** Removed problematic auto-overwriting of lactate and Hb values between the blood gas review and primary input fields to prevent conflicting clinical entries.

### 🎨 Premium UI/UX Modernization
* **Unified Risk Gates Grid:** 
  * Reorganized the core clinical risk gates (including ADDS, Respiratory, Neurological, Renal/Fluid, Electrolyte, HAC, After Hours, Immobility, Infection, Known Frailty, Vasoactive Support, and Comorbidities) into a modern, responsive **3-column grid**.
  * **Nested Drawers:** Sub-panels and specific detail fields now expand inline **directly within each parent card** rather than stretching the outer layout, keeping the workspace highly compact and visually cohesive.
  * **Symmetrical Design:** Standardized the trigger area height (minimum 120px) to keep control buttons perfectly aligned across columns.
* **Active Gate Highlights:** Active risk gates now dynamic-light up with an elegant, glowing accent outline and subtle shadow whenever positive risk factors are selected, immediately drawing focus to areas of concern.
* **Premium Segmented Selectors:**
  * Replaced traditional checkboxes and text fields for Clinician Role and Review Type with elegant custom radio-segmented button groups (e.g., **CNS vs. CN**, **Pre-Stepdown vs. Post-Stepdown**).
  * Replaced post-ICU decision checkboxes with a high-fidelity stacked segmented action group (**"Continue Reviews"**, **"Discharge"**, **"Pending Bloods"**, and **"Overnight Handover"**).

### 🔌 Importer & Integration Upgrades
* **Handover Detection Auto-Parsing:** Upgraded the DMR Importer (`plugins/importer.js`) to scan clinical handover notes for common phrases (e.g., *"Recommend discharge... pending... bloods... DMR"* or *"stable overnight... discharge"*). The tool now automatically checks the overnight handover state on import and populates the form accordingly.
