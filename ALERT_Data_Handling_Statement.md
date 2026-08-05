# ALERT Nursing Risk Assessment Tool — Data Handling Statement

**Version:** 1.0
**Date:** 1 August 2026
**Author / developer:** Casey Bond, ALERT Clinical Nurse Specialist, Fiona Stanley Hospital, SMHS
**Prepared for:** ICT / Clinical Governance review
**Clinical owner:** *to be nominated by the service — see §0*
**Approval status:** *Not yet reviewed by Clinical Governance or ICT. Prepared for submission
at the conclusion of the 12-month quality improvement period, and pending the service's
decision on whether the tool continues in this form — see §10.*

---

## 0. Authorship and ownership

Two distinct roles, separated deliberately because they carry different accountabilities.

**Author / developer — Casey Bond.** Designed and built the tool, and authored the rule set,
the clinical rationale recorded in `ALERT_Risk_Rule_Decisions.md`, and this statement. This is
a statement of fact about who did the work; the repository's commit history is the underlying
record.

**Clinical owner — to be nominated by the service.** Accountable for the tool's use across
ALERT, for authorising rule changes, and for the governance obligations that follow from other
clinicians using it. This is a service role rather than an authorship one, and it is left
unfilled because it is the service's appointment to make, not the author's to assume.

Where the two are the same person, that should be stated explicitly rather than inferred.

---

## 1. What the tool is

A browser-based clinical calculator used by ALERT clinical nurse specialists during post-ICU
ward reviews. It takes clinical values entered by the clinician, applies a documented set of
risk rules, and produces draft text for the clinician to review, edit and paste into the
primary medical record.

**What it is not:**

- Not a clinical record system. It retains nothing after the browser tab is closed.
- Not a diagnostic or treatment device. It applies published clinical thresholds and displays
  the reasoning for each flag.
- Not autonomous. Every output is reviewed and edited by a registered clinician before it
  enters any record.

The complete rule set and the clinical reasoning behind each rule are documented in
`ALERT_Risk_Rule_Decisions.md`.

---

## 2. Data collected

**None.** The tool has no telemetry, no analytics, no usage logging, no error reporting and no
user accounts. It does not collect data from the clinician, the workstation or the patient.

---

## 3. Data captured — minimisation by design

**The tool does not accept the patient's name or their URN.**

| Field | Constraint | Purpose |
|---|---|---|
| Initials | **3 characters, letters only**, enforced in the markup and on import | confirm the note is being pasted into the correct record |
| URN | **last 3 digits only**, numeric, enforced in the markup and truncated on import | as above |
| Age, ward, bed | as entered | clinical context and location for handover |
| Clinical values, PMH, narrative | free text | the substance of the review |

This is a deliberate design constraint rather than a convention, enforced in three places:
`maxlength` and `pattern` on the inputs; truncation to the last three digits when a URN is
scraped from a pasted note; and reduction of a scraped name to initials, because `maxlength`
constrains typing but not values set by script.

### Why this is not identifiable data

Three initials and three digits cannot be searched, matched or resolved to a patient using
health service systems. Re-identification requires the ALERT team's own patient list, which is
held separately and under its own controls. The data is therefore **pseudonymised: identifiable
only in combination with a key held elsewhere**, and the identifiers present exist solely so the
clinician can confirm they are pasting into the right record — a patient-safety function, at the
minimum detail that satisfies it.

### Residual re-identification risk, stated plainly

A detailed clinical narrative, combined with a ward and an age, could allow a colleague who
already knows the patient to recognise them. This is inherent to any clinical handover — it is
equally true of a paper handover sheet, a verbal handover and the DMR entry itself — and it is
not addressed by minimisation, since removing the clinical detail would remove the tool's
purpose. It is addressed by the same controls that govern all three: professional
confidentiality, and workstation locking — see §7.

**Comparison for review:** the tool holds less identifying information than the paper handover
sheets already in routine use on the ward, and disposes of it more reliably — a closed tab is
unrecoverable, whereas paper depends on correct use of confidential waste.

---

## 4. Data stored

Clinical values entered during a review are held in the browser's **`sessionStorage`** so that
an accidental page refresh does not lose work in progress.

| Key | Contents |
|---|---|
| `alertToolData_v7_7` | current review in progress |
| `alertToolUndo_v7_7` | single undo snapshot |
| `alertToolAccordions_v7_7` | which panels are open (no clinical data) |
| `alertToolLastSaved_v7_7` | timestamp only |

Properties of `sessionStorage`:

- Scoped to the single browser tab
- **Automatically and irrecoverably cleared when the tab is closed**
- Never written to disk by the application
- Not shared between tabs, windows, users or sessions

**No `localStorage` is written.** Two `localStorage` keys are *removed* on reset as cleanup
from a superseded feature; nothing writes to them.

The tool also provides an explicit reset that clears all of the above plus in-memory state,
used when moving to the next patient.

---

## 5. Data transmitted

**None.** The application makes no network requests of any kind. Verified by source
inspection: no `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource` or
third-party HTTP client appears anywhere in the source.

All assets are local, including the typeface — there are no CDN references, external
stylesheets, remote fonts or external scripts. The tool renders identically offline.

### Single exception: REDCap export

A clearly labelled button opens a REDCap survey in a new browser tab, pre-filling
administrative fields via URL parameters. This happens **only on explicit user click**.

The parameters carry: site, contact reason, shift type, shift date, ALERT category, team,
ward code, ADDS score and intervention codes.

**No patient identifiers are transmitted** — no name, no URN, no date of birth, no bed number,
no free text, no clinical narrative.

---

## 6. Verification

Re-runnable at any time from the repository root:

```
# Confirm no outbound requests exist
grep -rn 'fetch(\|XMLHttpRequest\|sendBeacon\|WebSocket\|EventSource\|axios' src/ plugins/ index.html

# Confirm no external endpoints beyond the REDCap export
grep -rno 'https\?://[^"'"'"' )]*' src/ plugins/ index.html

# Confirm no persistent browser storage is written
grep -rn 'localStorage.setItem' src/ plugins/
```

This check is run before each release.

---

## 7. Residual risks and controls

| Risk | Control |
|---|---|
| Clinical data visible on an unattended shared workstation | Workstation locking, per existing WA Health policy and the same expectation that applies to the DMR, iCM and every other clinical system on the same screen. An idle screen overlay was trialled and removed: reviews are routinely started, paused to see the patient, and finished on return, and an overlay interrupting that workflow displaced a control staff are already required to apply |
| Browser remembering entered values and offering them to the next user | `autocomplete="off"` on all patient data fields |
| Work in progress lost if tab closed | Accepted. Session-only retention is a deliberate design choice — see §8 |
| Tool loaded from an external host | Distribution moved to an internal location; repository private and used for source control only |
| Review left on the clipboard after the tab is closed, reachable by other applications | Clipboard overwritten when the review is reset for the next patient. Skipped where the clinician copied from the reset dialog itself, so a note is never destroyed between copying and pasting |
| Paper copy created accidentally | Printing suppressed by stylesheet; the printed page carries a notice instead of the review. Output reaches the DMR by clipboard, so no print path is needed |
| Full name entering via an imported DMR note | Scraped names reduced to initials before assignment — `maxlength` restricts typing but not values set by script |

---

## 8. Design constraint: no persistence

The tool retains nothing between sessions **by design**, and this is deliberate rather than
incidental.

Session-only retention is what keeps the tool a calculator rather than a clinical record
system. Adding cross-session storage, a patient list, file export or a resume feature would
change its character and attract record-keeping, retention, access-control and audit
obligations that a calculator does not carry.

**No persistence feature will be added to this tool.** Where such capability is required, it
belongs in a governed platform build with the corresponding controls.

---

## 9. Clinical governance

- Every output is reviewed, edited and signed by a registered clinician before entering any
  record.
- The basis for every flag is displayed to the clinician and printed alongside it, so the
  reasoning can be independently reviewed rather than taken on trust.
- The clinician can override the calculated category; overrides require a documented reason,
  which is printed in the note alongside the automatically calculated category.
- Risk rules and thresholds are documented with their clinical rationale and the clinician who
  agreed them.
- Rule changes are version-controlled and recorded in a dated changelog.

---

## 10. Open items

- Confirmation from the REDCap survey owner that the survey link may be distributed in
  application source.
- Confirmation from Clinical Governance / ICT as to whether the tool falls within the clinical
  decision support exclusion, and whether local registration is required.
- Named clinical sponsor recorded at §0.
- Test evidence: fixture suite covering the documented rule set (in progress).
- **Submission timing.** This statement is held pending completion of the 12-month quality
  improvement period, and pending the service's decision on platform. Where a supported
  platform build proceeds, the rule set and its clinical rationale transfer as documentation
  and this statement is superseded rather than submitted.
