# ALERT Tool — Risk Rule Decisions

**Date:** 1 August 2026
**Author:** Casey Bond, ALERT Clinical Nurse Specialist, Fiona Stanley Hospital, SMHS
**Status:** Agreed, not yet implemented.
**Approval status:** Clinical rationale recorded here for review. Rule changes affecting
category distribution require clinical sign-off before ward use — see the implementation plan.
**Ownership:** authorship and clinical ownership are separated in §0 of
`ALERT_Data_Handling_Statement.md`.

## Governing principle

> If the tool auto-flags something, it must be a slam dunk — concerning to any trained
> clinician regardless of context. Anything requiring context is the clinician's call,
> because only trained clinicians use this tool and they hold the context the tool doesn't.

Two corollaries used throughout:

- **Auto-derived text describes findings; only clinician-ticked text names diagnoses.**
  The tool may print "Febrile 38.7"; it may not print "possible bleeding".
- **A flag that needs mitigating most of the time should have been context, not a flag.**
  Where politics prevent that, a mitigator is the accepted workaround.

---

## 1. Auto-flags — RED

Each fires without clinician input and is concerning irrespective of baseline.

| ID | Rule | Note |
|---|---|---|
| R-01 | ADDS ≥4 (or MODS where selected) | validated escalation threshold |
| R-02 | RR >25 | |
| R-03 | RR <8 | |
| R-04 | SpO2 <88% | |
| R-05 | HR >130 | |
| R-06 | HR <40 | |
| R-07 | SBP <90 | |
| R-08 | Temp >38.5 | also opens the infection gate — see A-04 |
| R-09 | Temp <35.5 | |
| R-10 | BSL <4.0 | |
| R-11 | BSL >20 | |
| R-12 | K <3.0 or >6.0 | arrhythmia risk irrespective of baseline |
| R-13 | Na <125 or >155 | see A-16 — this never actually fired until August 2026 |
| R-15 | Lactate >4.0 | |

**R-14 (PO4) was moved to amber** — see A-15. Phosphate only becomes reliably symptomatic
below 0.32 rather than 0.5, and a marker nobody currently looks at should not be minting CAT 1s.

The dead `adds >= 6` branch is collapsed into R-01 — there is no third ADDS tier.

---

## 2. Auto-flags — AMBER

| ID | Rule | Note |
|---|---|---|
| A-01 | ADDS 3 within 24h of stepdown | prints as **"ADDS 3, not baseline, monitor trend"**. Not a concern — a reason not to discharge today |
| A-02 | HR 111–130 | tachyarrhythmias are a common MET/readmit cause and often correctable |
| A-03 | HR 40–49 | bradyarrhythmia/heart block also actionable |
| A-04 | RR 21–25 | respiratory failure is the leading readmission cause; first band above normal is the watch point |
| A-05 | Lactate ≥2.0 | low volume — only exists if someone took a gas, which is itself a signal |
| A-06 | Mg <0.7 | |
| A-07 | Worsening Cr >30% or >30 absolute | mitigable by CKD (M-02) |
| A-08 | Rising CRP >50% or >50 absolute | **new**. Mitigable |
| A-09 | Infection gate opened by WCC >15 or <2, CRP >100, or NLR >10 | all three open at amber; none makes it red alone |
| A-10 | Age ≥75 | mitigable (M-01) |
| A-11 | ICU LOS >4 days **and** ≥1 other flag → red; alone → suppressed | mitigable (M-04) |
| A-12 | After-hours stepdown, within 24h | intentionally drops off after 24h — home team reviews next day shift |
| A-13 | Comorbidities: ≥3 → red, 1–2 → amber | |
| A-14 | Any clinician-set gate answered Yes | resp, neuro, renal, infection, electrolyte, immobility, HAC, vasoactive, frailty, PICS, psych |
| A-15 | PO4 <0.32 | moved down from R-14; 0.32–0.5 becomes a replacement prompt instead |
| A-16 | Na <125 or >155 → red | **bug fix.** Sodium was described inside the electrolyte gate but never opened it, so a Na of 122 with a normal potassium produced nothing at all. Found by the fixture suite |

**Rhythm wording (A-02, A-03):** where `c_hr_rhythm` is recorded, the flag reads
`Tachycardia HR 118 (AF)`. Same trigger, more actionable text.

**Bleeding context:** where Hb is falling *and* (HR >110 or SBP <90), the existing vitals flag
gains the Hb context — `Tachycardia HR 115 with falling Hb 118→94`. This is a wording change
to an existing flag, not a new flag, and deliberately states no diagnosis.

---

## 3. Check items — visible, actionable, no category effect

Staged as `severity: 'info'` in the Review List and carried in the handover line.

| ID | Item | Wording |
|---|---|---|
| C-01 | INR abnormal, target known | `INR 3.2, above target 2-3` |
| C-02 | INR abnormal, no target recorded | `INR 3.2 — target not documented` |
| C-03 | APTT, as above | requires adding `aptt` to `GATE_LINKED_BLOODS` — it currently has no rule at all |
| C-04 | Cr raised | `Cr 250 — confirm against baseline`. Safety net now that Cr no longer auto-opens the renal gate |
| C-05 | Mg 0.7–1.0 | `Mg 0.85 — consider replacement`. Keeps Mg visible to 1.0 without scoring |
| C-06 | Existing abnormal gate-linked bloods | unchanged |

New per-marker **target** fields beside INR and APTT, printed in the bloods line as
`INR 3.2 (target 2-3)`.

---

## 4. Removed

| Was | Reason |
|---|---|
| CRP >100 → red | demoted to amber gate-opener (A-09). Post-op day 2 CRP 150 is expected physiology |
| Albumin <20 → amber | near-universal post-ICU |
| Platelets <100 → amber | common post-ICU, usually recovering |
| BSL ≥15 → amber | noisy; many diabetics run here at baseline |
| Pain ≥7 → amber | fixable at the bedside, rare readmission cause. Still prints under D |
| Hb ≤70 red, Hb ≤90+dropping amber | baseline is wildly patient-specific (haem, CTS). Rarely the readmit cause and not missed |
| Cr >150 auto-opening renal gate | entirely baseline-dependent |
| Antibiotics clause in infection downtrend | if markers are falling and obs are fine, antibiotic status doesn't change the assessment. Three locations: `index.html:771`, `index.html:1713`, `logic.js:474` |
| Pulsing discharge box | |
| Dead code | `adds >= 6` branch; `s.hb`, `s.lactate`, `s.cr_review`, `s.hb_dropping` references |

---

## 5. Trends

One shared helper computes deltas against `prevBloods` and drives arrows, flags and
mitigator suggestions.

**Arrow appears only when the change clears both an absolute floor and a percentage floor.**
Requiring both suppresses a big percentage of a tiny number (CRP 5→10) and a tiny movement in
a big number (Cr 100→110).

| Marker | Min abs | Min % | Marker | Min abs | Min % |
|---|---|---|---|---|---|
| Cr | 15 | 15% | K | 0.4 | 8% |
| CRP | 20 | 25% | Na | 3 | 2% |
| Hb | 10 | 8% | Mg / PO4 | 0.2 | 15% |
| WCC | 2.0 | 20% | INR | 0.3 | 15% |
| Neut / Lymph | 1.0 | 20% | Albumin | 5 | 12% |
| Platelets | 30 | 20% | ALT / Bili | — | 50% |

- eGFR excluded — derived from Cr, the arrow would duplicate it.
- **Vitals arrows (RR, HR, BP) stay manual.** Two point-in-time obs a day apart are not a
  trend; the ADDS chart owns that and has every reading.
- Flags use their own higher thresholds (A-07, A-08), so an arrow can appear without a flag
  firing — *something moved* and *something moved enough to worry about* are different.
- A mitigated marker computes its arrow but does not flag.
- Manual override of an auto-set arrow sticks, via the existing `dataset.manual` pattern.
- Hb is display-only: auto arrow, no flag.
- No previous value → **"No previous found — check iCM"**. A prompt to look, not a passive
  absence.

**Bloods date/time field** added, scraped by the importer where possible. Without it,
"risen over 12 hours" and "risen over four days" are indistinguishable and every trend rule
is temporally blind.

---

## 6. Mitigators

| ID | Mitigator | Effect |
|---|---|---|
| M-01 | Age ≥75 — baseline function high | existing |
| M-02 | Known CKD, Cr/UO around baseline | existing. **Extended** to gate the trend rules (A-07) — a dialysis patient's Cr rising 400→550 between sessions is the dialysis rhythm, not deterioration |
| M-03 | Infection markers downtrending | antibiotics clause removed; ADDS verified by the tool rather than asserted by the clinician, leaving one honest question |
| M-04 | **New:** ICU LOS >4 but recovering well | stops LOS escalating to red. Prints as *"Prolonged ICU stay >4 days (mitigated: recovering appropriately, trajectory to recovery established)"* |

**Suppressors suggest, never set.** Getting a flag wrong adds noise; getting a suppressor
wrong silently removes a concern. The tool offers *"CRP 140→80, WCC 18→11 — mark infection
markers as downtrending?"* and the clinician clicks. This also replaces the existing
auto-click on the worsening-Cr chip.

---

## 7. Structural fixes

| Fix | Detail |
|---|---|
| Duplicate blood inputs | WCC, CRP, Neut and Lymph each have two boxes and the resolution order is inconsistent between them — WCC prefers the bloods panel, CRP prefers the gate. Resolve to one canonical field each |
| Deconditioning merge | Immobility and prolonged LOS run near-identical logic at different points in evaluation, producing contradictory severities for the same situation. Collect all flags first, then run both in a second pass, emit one line: *"Deconditioning risk — 6-day ICU stay, immobile"* |
| Fever double-count | Temp 38.7 currently produces both `Febrile 38.7` and `Infection risk - Temp 38.7`, two reds from one observation. Vitals feed the gate rather than standing alongside it |
| Respiratory concern | Bypasses `add()` at `logic.js:306`, so it never reaches the Review List and never toasts in Quick Review. Every other gate does. Route through `add()` |
| WCC threshold | Trigger says <2, descriptive text says <3 — a WCC of 2.4 falls in the crack. Both become <2 |
| Discharge modal | Shown for **all three categories**, not just CAT 3. Time gating is already automatic so the modal drops that question. Asks only ≥2 reviews, and ≥1 physical — the physical clause omitted when the current review is itself physical |
| Notice region | One banner at a time, priority-ordered: new risk → discharge prompt → shift handover → quick-review offer → completeness nudge. Quick Review becomes a header marker, not a banner. Per-risk toasts retired |
| Inline styles | Extract to the token system, starting with the three duplicated modal overlays and the new notice component. Styling currently leaks into `logic.js` |

---

## 8. PICS — scored version considered and removed

A colleague's masters project (Dhanju, 2026) proposed an eleven-item cumulative PICS score with
0–2 / 3–5 / 6+ bands. It was built in full on 2 August 2026 and removed on 5 August. The
reasoning is recorded because the question will come round again.

**What the tool does instead:** the existing single question. New hallucinations or delirium on
the ward, positive, refer to OT, pastoral care, and psychology where the presentation is
PTSD-like. That is the practice the service already runs, and it is the practice the evidence
supports.

**Why the score didn't earn its place:**

- **Delirium is the predictor**, and this control already captures it. It is the only
  significant cognitive risk factor in the 2020 meta-analysis (OR 2.85,
  [PMID 31839375](https://pubmed.ncbi.nlm.nih.gov/31839375/)) and carries the heaviest weight in
  the only published ward-based PICS screening tool (Blot et al., *Critical Care*, July 2025,
  [PMC12243358](https://pmc.ncbi.nlm.nih.gov/articles/PMC12243358/)). Pre-existing cognitive or
  psychiatric impairment is the other strong one — previous mental health problems OR 9.45.
  Both were already on the form.
- **That published tool has four predictors, not eleven** — previous cognitive problems,
  negative ICU experience, delirium, renal support. Respiratory support was tested and dropped
  for contributing under 1% to the AUC, which is the item Prabh's score weighted joint-highest
  (mechanical ventilation >48h).
- **ICU LOS >3 days does not separate risk.** *Critical Care* 2024
  ([PMC10807116](https://pmc.ncbi.nlm.nih.gov/articles/PMC10807116/)) found impairment at six
  months in 29% of patients staying under 72h against 33% over.
- **The weights were not cohort-derived**, so summing them manufactured a precision that does
  not exist. A systematic review of 16 PICS prediction models
  ([PMC11846601](https://pmc.ncbi.nlm.nih.gov/articles/PMC11846601/)) rated 14 at high risk of
  bias with only 3 externally validated — there is no gold standard to adopt instead, which
  argues for a small screen rather than a comprehensive one.
- **This tool cannot validate it anyway.** ALERT persists nothing beyond the session, so
  embedding the score generates no dataset and tests no threshold. It could only ever add
  interface.

**The real gap is not assessment, it is what happens next.** PICS is hard to manage in the ≤3
days ALERT holds a patient, and there is no follow-up service to hand to. A patient-facing
leaflet on what to expect and where to go is the intervention that survives discharge; a score
is not. Recorded here as the open item, not as a tool feature.

---

## 9. Deferred

- **Context block** — moving age, comorbidity count and after-hours out of scoring into a
  displayed, printed, non-scoring block. Clinically the right shape; pending SHIMS review and
  team agreement.
- **Weighted category scoring** — `redCount` and `amberCount` are computed and displayed but
  unused; any single red is CAT 1. Age contributes 0–6 of 71 points in APACHE II and can never
  determine the outcome alone. (Age is *not* in SOFA — SOFA is organ dysfunction only.)
- **Fixture test suite** — 30–40 saved patients asserting category and flag list. Doubles as
  the specification if a Power Platform build revives.

## 10. Open

- SHIMS check: of patients who bounced back, how many were carried only by age, LOS,
  after-hours or comorbidity count with no acute flag? Near zero would justify the context
  block.
- Audit requirement if the future build moves to SharePoint rather than Dataverse — SharePoint
  version history is weaker and easier to disable.

---

## 11. Open question raised by the fixtures

Blood-derived rules currently split into two groups when the clinician marks bloods as *not
checked* or *nil significant*:

- **Stand down:** WCC, CRP, NLR, platelets, INR, APTT, the creatinine check, the trend flags,
  and the magnesium/phosphate replacement prompts.
- **Still fire:** K, Na, magnesium <0.7, phosphate <0.32, lactate.

The second group is arguably right - a potassium of 6.4 on screen is worth acting on however
the bloods status is set - but the split arose by accident rather than design, and magnesium
<0.7 sitting in the "always fires" group is hard to defend on the same reasoning.

Needs a decision: either life-threatening values always fire and everything else stands down
(with magnesium moving), or the bloods status governs everything uniformly.
