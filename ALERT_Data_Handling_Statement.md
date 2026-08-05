# ALERT Nursing Risk Assessment Tool — Data Handling Statement

**Version:** 1.0
**Date:** 1 August 2026
**Prepared for:** ICT / Clinical Governance review
**Clinical owner:** *(to be named)*

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

## 3. Data stored

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

## 4. Data transmitted

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

## 5. Verification

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

## 6. Residual risks and controls

| Risk | Control |
|---|---|
| Clinical data visible on an unattended shared workstation | Privacy overlay after 10 minutes idle — obscures the screen, preserves work in progress, single click to resume |
| Browser remembering entered values and offering them to the next user | `autocomplete="off"` on all patient data fields |
| Work in progress lost if tab closed | Accepted. Session-only retention is a deliberate design choice — see §7 |
| Tool loaded from an external host | Distribution moved to an internal location; repository private and used for source control only |

---

## 7. Design constraint: no persistence

The tool retains nothing between sessions **by design**, and this is deliberate rather than
incidental.

Session-only retention is what keeps the tool a calculator rather than a clinical record
system. Adding cross-session storage, a patient list, file export or a resume feature would
change its character and attract record-keeping, retention, access-control and audit
obligations that a calculator does not carry.

**No persistence feature will be added to this tool.** Where such capability is required, it
belongs in a governed platform build with the corresponding controls.

---

## 8. Clinical governance

- Every output is reviewed, edited and signed by a registered clinician before entering any
  record.
- The basis for every flag is displayed to the clinician and printed alongside it, so the
  reasoning can be independently reviewed rather than taken on trust.
- The clinician can override the calculated category; overrides require a documented reason,
  which is printed in the note alongside the automatically calculated category.
- Risk rules and thresholds are documented with their clinical rationale and the clinician who
  agreed them.
- Rule changes are version-controlled and recorded in a dated changelog.
- **Cumulative PICS Risk Score (added August 2026):** eleven additional assessment fields, held
  and computed entirely in the browser like every other field — no new storage, no new
  transmission, no change to §2–§4. It is a **local instrument (Dhanju, 2026), not a published
  or validated score**, is labelled as such in the note it produces, and does not affect the
  ALERT category beyond a single amber at the highest band. Awaiting clinical sign-off before
  ward use.

---

## 9. Open items

- Confirmation from the REDCap survey owner that the survey link may be distributed in
  application source.
- Confirmation from Clinical Governance / ICT as to whether the tool falls within the clinical
  decision support exclusion, and whether local registration is required.
- Named clinical sponsor recorded at §0.
- Test evidence: fixture suite covering the documented rule set (in progress).
