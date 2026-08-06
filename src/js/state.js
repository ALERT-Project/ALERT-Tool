/* =========================================
   ALERT Nursing Risk Assessment Tool
   Session state: save, restore, and the Review List model
   Copyright © 2025-2026 Casey Bond
   MIT License - https://opensource.org/licenses/MIT
   ========================================= */

import { STORAGE_KEY, UNDO_KEY, ACCORDION_KEY, staticInputs, segmentedInputs, toggleInputs, selectInputs, deviceTypes } from './config.js';
import { $, showToast } from './utils.js';
import { handleSegmentClick, updateWardOptions, updateReviewTypeVisibility, updateWardOtherVisibility, createDeviceEntry, updateDevicesSectionVisibility, toggleOxyFields, toggleInfusionsBox, toggleBowelDate } from './ui.js';

window.prevBloods = {};

export let isQuickReviewMode = false;
export function setQuickReviewMode(v) { isQuickReviewMode = v; }

export let previousCategoryData = null;
export function setPreviousCategoryData(v) { previousCategoryData = v; }

export let initialQuickReviewRisks = { red: [], amber: [] };
export function setInitialQuickReviewRisks(v) { initialQuickReviewRisks = v; }

export let quickReviewBaselineCaptured = false;
export function setQuickReviewBaselineCaptured(v) { quickReviewBaselineCaptured = v; }

export let quickReviewDismissedBySession = false;
export function setQuickReviewDismissed(v) { quickReviewDismissedBySession = v; }

// Set once the offer banner has been shown, so computeAll doesn't re-show/re-scroll it.
export let quickReviewOffered = false;
export function setQuickReviewOffered(v) { quickReviewOffered = v; }

// --- Active Issues model: backs the Scraped Risks staging list + Excel handover line ---
export let activeIssues = [];
const toastedRiskKeys = new Set();
let _activeIssueCounter = 0;

export function addActiveIssue({ text, source, severity, key }) {
    // A tick the clinician made still counts as a match, so a risk that is still firing
    // updates that entry instead of reappearing as a second, unticked copy. Entries retired
    // by reconcileAutoIssues() are not matched, so a genuine recurrence still arrives as new.
    const existing = activeIssues.find(i => i.key === key && (!i.resolved || i.resolvedByUser));
    if (existing) {
        existing.text = text;
        existing.severity = severity;
        return { issue: existing, isNew: false };
    }
    const issue = { id: `ai_${++_activeIssueCounter}`, text, source, severity, key, resolved: false, createdAt: _activeIssueCounter };
    activeIssues.push(issue);
    return { issue, isNew: true };
}

export function addManualIssue(text) {
    return addActiveIssue({ text, source: 'manual', severity: 'amber', key: `manual_${_activeIssueCounter + 1}` });
}

// Resolving an entry marks it dealt with without removing it: it stays visible (struck
// through), drops out of the note and the handover line, and can be undone. This is the only
// control on a row that changes what the outputs say.
export function toggleActiveIssueResolved(id) {
    const issue = activeIssues.find(i => i.id === id);
    if (!issue) return;
    issue.resolved = !issue.resolved;
    // Distinguishes a clinician's tick from reconcileAutoIssues() retiring a stale auto risk,
    // which should still disappear silently.
    issue.resolvedByUser = issue.resolved;
    renderScrapedIssuesList();
}

// No longer wired to a control on the row - resolve covers taking an entry out of the note
// and the handover line, and does it reversibly. Kept because clearActiveIssues and any
// future tidy-up path need a way to actually remove one.
export function deleteActiveIssue(id) {
    activeIssues = activeIssues.filter(i => i.id !== id);
    renderScrapedIssuesList();
}

export function editActiveIssueText(id, newText) {
    const issue = activeIssues.find(i => i.id === id);
    if (issue) issue.text = newText;
    renderScrapedIssuesList();
}

export function getUnresolvedActiveIssues() { return activeIssues.filter(i => !i.resolved); }

// What the clinician typed into the Review List themselves. Until now this reached the Excel
// handover line and nothing else, so an observation made during a Quick Review never got into
// the record. The auto and bloods entries are excluded: those are the tool's own findings and
// the note already states them from the rules, in the rules' own wording.
export function getManualIssuesForNote() {
    return activeIssues.filter(i => i.source === 'manual' && !i.resolved).map(i => i.text);
}

// What the list shows: everything live, plus anything the clinician ticked off themselves.
function getVisibleActiveIssues() { return activeIssues.filter(i => !i.resolved || i.resolvedByUser); }

export function clearActiveIssues() {
    activeIssues = [];
    toastedRiskKeys.clear();
    renderScrapedIssuesList();
}

// Resolve auto-sourced issues whose risk no longer fires, so a recurrence toasts again as new.
export function reconcileAutoIssues(currentKeys) {
    activeIssues.forEach(issue => {
        const isAutoSourced = issue.source === 'auto' || issue.source === 'bloods';
        if (isAutoSourced && !issue.resolved && !currentKeys.has(issue.key)) {
            issue.resolved = true;
            toastedRiskKeys.delete(issue.key);
        }
    });
}

// Per-risk toasts are retired. A busy patient could fire half a dozen of them in a row while
// the clinician was still typing, each one covering the footer for three seconds. The Review
// List already holds every risk, and genuinely new ones raise a notice. Kept as a no-op that
// still records the key, because that set is what stops a risk being treated as new twice.
export function maybeToastNewRisk(key, text) {
    toastedRiskKeys.add(key);
}

export function renderScrapedIssuesList() {
    const list = $('scraped_issues_list');
    if (!list) return;
    // computeAll re-renders this list constantly; don't destroy an in-progress inline edit.
    if (list.querySelector('.scraped-issue-edit')) return;
    const issues = getVisibleActiveIssues();
    const count = $('issues_count');
    const openCount = issues.filter(i => !i.resolved).length;
    const doneCount = issues.length - openCount;
    // Says what the two states are, so a struck-through line isn't a mystery.
    if (count) {
        const parts = [];
        if (openCount) parts.push(`${openCount} open`);
        if (doneCount) parts.push(`${doneCount} resolved`);
        count.textContent = parts.length ? `(${parts.join(' · ')})` : '';
    }
    // In Full Review an empty list stays empty - it is one quiet card among many, and the add
    // row underneath already says what it's for. In Quick Review the same card is the largest
    // thing on the page and it grows to fill the column, so blank reads as broken rather than
    // as "nothing yet"; there it says what to do with itself.
    if (issues.length === 0) {
        list.innerHTML = document.body.classList.contains('quick-review-active')
            ? `<div class="issues-empty">Add issues from your review below</div>`
            : '';
        return;
    }
    // Two controls, each saying what it does. Delete is gone: it and resolve were the same
    // act from the reader's side - the entry leaves the note and the handover line either way
    // - except resolve is reversible and leaves a record on screen of what was considered.
    // Correcting a wrong entry is what edit is for, and the pencil is what says so; the text
    // has always been click-to-edit, but nothing on the row admitted it.
    list.innerHTML = issues.map(issue => `
        <div class="scraped-issue-row${issue.resolved ? ' resolved' : ''}" data-id="${issue.id}">
            <span class="scraped-issue-text" data-id="${issue.id}" title="Click to edit">${issue.text}</span>
            ${issue.severity === 'info' ? '<span class="scraped-issue-note-tag">note</span>' : ''}
            <button type="button" class="scraped-issue-edit-btn" data-id="${issue.id}"
                title="Edit" aria-label="Edit">&#9998;</button>
            <button type="button" class="scraped-issue-resolve" data-id="${issue.id}"
                title="${issue.resolved ? 'Put it back on the list' : 'Dealt with - keeps it here but leaves it out of the note and the handover line'}">${issue.resolved ? 'undo' : 'resolve'}</button>
        </div>
    `).join('');

    list.querySelectorAll('.scraped-issue-resolve').forEach(btn => {
        btn.addEventListener('click', e => toggleActiveIssueResolved(e.currentTarget.dataset.id));
    });
    const startEdit = (span) => {
        const id = span.dataset.id;
        const issue = activeIssues.find(i => i.id === id);
        if (!issue) return;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'scraped-issue-edit';
        input.value = issue.text;
        span.replaceWith(input);
        input.focus();
        input.select();
        let committed = false;
        const finish = (save) => {
            if (committed) return;
            committed = true;
            const newText = input.value.trim() || issue.text;
            // Drop the input first: renderScrapedIssuesList() bails out while an edit field is
            // still in the list, which would otherwise leave the row stuck in edit state.
            input.remove();
            // Re-render either way - cancelling has to put the span back too.
            if (save) editActiveIssueText(id, newText);
            else renderScrapedIssuesList();
        };
        input.addEventListener('blur', () => finish(true));
        input.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') { finish(true); $('manualIssueInput')?.focus(); }
            else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
        });
    };

    list.querySelectorAll('.scraped-issue-text').forEach(span => {
        span.addEventListener('click', () => startEdit(span));
    });
    list.querySelectorAll('.scraped-issue-edit-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const span = list.querySelector(`.scraped-issue-text[data-id="${e.currentTarget.dataset.id}"]`);
            if (span) startEdit(span);
        });
    });
}

export function saveState(instantly = false) {
    const state = getState();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    sessionStorage.setItem('alertToolLastSaved_v7_7', new Date().toISOString());
    updateLastSaved();
}

export function loadState() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
}

export function updateLastSaved() {
    const iso = sessionStorage.getItem('alertToolLastSaved_v7_7');
    const el = $('lastSaved');
    if (el) el.textContent = iso ? 'Last saved: ' + new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Last saved: --:--';
}

export function pushUndo(snapshot) { sessionStorage.setItem(UNDO_KEY, JSON.stringify({ snapshot, created: Date.now() })); }

export function getState() {
    const state = {};
    staticInputs.forEach(id => { const el = $(id); if (el) state[id] = el.value; });

    segmentedInputs.forEach(id => {
        const group = $(`seg_${id}`);
        const active = group?.querySelector('.seg-btn.active');
        if (!active) {
            state[id] = null;
        } else if (active.dataset.value === "true" || active.dataset.value === "false") {
            state[id] = (active.dataset.value === "true");
        } else {
            state[id] = active.dataset.value;
        }
    });

    toggleInputs.forEach(id => {
        if ([
            'resp_tachypnea', 'resp_rapid_wean', 'resp_poor_cough', 'resp_poor_swallow',
            'lactate_trend'
        ].includes(id)) return;
        const el = $(`toggle_${id}`);
        if (!el && id === 'chk_aperients') { const chk = $('chk_aperients'); if (chk) state[id] = chk.checked; return; }
        if (!el && id === 'chk_unknown_blo_date') { const chk = $('chk_unknown_blo_date'); if (chk) state[id] = chk.checked; return; }
        state[id] = el ? (el.dataset.value === 'true') : false;
    });

    selectInputs.forEach(id => {
        const group = $(id);
        state[id] = group?.querySelector('.select-btn.active')?.dataset.value || '';
    });

    state['reviewType'] = document.querySelector('input[name="reviewType"]:checked')?.value || 'post';
    state['clinicianRole'] = document.querySelector('input[name="clinicianRole"]:checked')?.value || 'ALERT CNS';
    // Empty, not 'physical', when nothing is ticked: defaulting here would restore as a real
    // answer and satisfy the prompt on the generate button without anyone having chosen.
    state['reviewModeType'] = document.querySelector('input[name="reviewModeType"]:checked')?.value || '';
    state.activeIssues = activeIssues;

    ['chk_medical_rounding', 'chk_discharge_alert', 'chk_continue_alert', 'chk_use_mods', 'chk_bloods_nil_sig', 'chk_discharge_pending_bloods'].forEach(id => {
        const el = $(id);
        if (el) state[id] = el.checked;
    });

    state['bowel_mode'] = document.querySelector('#panel_ae .quick-select.active')?.id || null;

    state.devices = {};
    deviceTypes.forEach(type => {
        state.devices[type] = Array.from(document.querySelectorAll(`.device-entry[data-type="${type}"]`)).map(entry => {
            const detailsInput = entry.querySelector('.device-textarea');
            const dateInput = entry.querySelector('.device-date');
            return {
                details: detailsInput ? detailsInput.value : '',
                insertionDate: dateInput ? dateInput.value : ''
            };
        });
    });

    document.querySelectorAll('.trend-buttons').forEach(group => {
        state[group.id] = group.querySelector('.trend-btn.active')?.dataset.value || '';
        // Whether the clinician set this arrow themselves has to survive a refresh, or the
        // auto-calculation would overwrite their choice the moment the page reloaded.
        if (group.dataset.manual === 'true') state[`${group.id}__manual`] = true;
    });

    return state;
}

export function restoreState(state) {
    if (!state) return;

    // Handle name/initials fallback
    if (state.initials && !state.ptName) state.ptName = state.initials;
    if (state.ptName && !state.initials) state.initials = state.ptName;

    staticInputs.forEach(id => { const el = $(id); if (el && state[id] !== undefined) el.value = state[id]; });

    segmentedInputs.forEach(id => {
        const group = $(`seg_${id}`);
        if (!group) return;
        group.querySelectorAll('.seg-btn').forEach(btn => btn.classList.remove('active'));

        let valStr = String(state[id]);
        if (state[id] === true) valStr = "true";
        if (state[id] === false) valStr = "false";

        const target = group.querySelector(`.seg-btn[data-value="${valStr}"]`);
        if (target) target.classList.add('active');

        handleSegmentClick(id, valStr);
    });

    toggleInputs.forEach(id => {
        if (id === 'chk_aperients') { const chk = $('chk_aperients'); if (chk) chk.checked = state[id]; return; }
        if (id === 'chk_unknown_blo_date') { const chk = $('chk_unknown_blo_date'); if (chk) chk.checked = state[id]; return; }
        const el = $(`toggle_${id}`);
        if (el) {
            el.dataset.value = state[id] ? 'true' : 'false';
            el.classList.toggle('active', !!state[id]);
            if (id === 'comorb_other') $('comorb_other_note_wrapper').style.display = state[id] ? 'block' : 'none';
            if (id === 'pressor_recent_other') $('pressor_recent_other_note_wrapper').style.display = state[id] ? 'block' : 'none';
            if (id === 'pressor_current_other') $('pressor_current_other_note_wrapper').style.display = state[id] ? 'block' : 'none';
            if (id === 'anticoag_active') $('anticoag_note_wrapper').style.display = state[id] ? 'block' : 'none';
            if (id === 'vte_prophylaxis_active') $('vte_prophylaxis_note_wrapper').style.display = state[id] ? 'block' : 'none';
            if (id === 'renal_dialysis') $('dialysis_type_wrapper').style.display = state[id] ? 'block' : 'none';
        }
    });

    if (state['comorbs_gate'] === undefined) {
        const anyComorb = toggleInputs.filter(k => k.startsWith('comorb_') && state[k]).length > 0;
        if (anyComorb) {
            const group = $('seg_comorbs_gate');
            group?.querySelectorAll('.seg-btn').forEach(btn => btn.classList.remove('active'));
            const yesBtn = group?.querySelector('.seg-btn[data-value="true"]');
            if (yesBtn) yesBtn.classList.add('active');
            handleSegmentClick('comorbs_gate', 'true');
        }
    }

    selectInputs.forEach(id => {
        const group = $(id);
        if (group) {
            group.querySelectorAll('.select-btn').forEach(b => b.classList.remove('active'));
            if (state[id]) {
                group.querySelector(`.select-btn[data-value="${state[id]}"]`)?.classList.add('active');
                // Only reveal the neuro drawer when a type was actually recorded. Unguarded,
                // this re-opened the gate on every restore, undoing handleSegmentClick above.
                if (id === 'neuroType') $('neuro_gate_content').style.display = 'block';
            }
        }
    });

    if (state['reviewType']) {
        const r = document.querySelector(`input[name="reviewType"][value="${state['reviewType']}"]`);
        if (r) r.checked = true;
        updateWardOptions();
        updateReviewTypeVisibility();
    }
    if (state['clinicianRole']) {
        const r = document.querySelector(`input[name="clinicianRole"][value="${state['clinicianRole']}"]`);
        if (r) r.checked = true;
    }
    if (state['reviewModeType']) {
        const r = document.querySelector(`input[name="reviewModeType"][value="${state['reviewModeType']}"]`);
        if (r) r.checked = true;
    }
    if (Array.isArray(state.activeIssues)) {
        activeIssues = state.activeIssues;
        _activeIssueCounter = activeIssues.reduce((max, i) => Math.max(max, i.createdAt || 0), 0);
        renderScrapedIssuesList();
    }

    ['chk_medical_rounding', 'chk_discharge_alert', 'chk_continue_alert', 'chk_use_mods', 'chk_bloods_nil_sig', 'chk_discharge_pending_bloods'].forEach(id => {
        const el = $(id);
        if (el && state[id] !== undefined) el.checked = state[id];
    });

    if (state['chk_use_mods']) $('mods_inputs').style.display = 'block';
    
    if (state['chk_discharge_pending_bloods']) {
        const wrapper = $('discharge_pending_bloods_note_wrapper');
        if (wrapper) wrapper.style.display = 'block';
    }

    if (state['bowel_mode']) {
        $(state['bowel_mode'])?.classList.add('active');
        toggleBowelDate(state['bowel_mode']);
    }

    if (state.ptWard) {
        updateWardOptions();
        const sel = $('ptWard');
        if (sel) sel.value = state.ptWard;
    }
    updateWardOtherVisibility();

    const devCont = $('devices-container');
    if (devCont) {
        devCont.innerHTML = '';
        if (state.devices) {
            deviceTypes.forEach(type => {
                state.devices[type]?.forEach(item => {
                    if (typeof item === 'string') {
                        createDeviceEntry(type, item, '');
                    } else {
                        createDeviceEntry(type, item.details || '', item.insertionDate || '');
                    }
                });
            });
        }
    }
    updateDevicesSectionVisibility();

    document.querySelectorAll('.trend-buttons').forEach(group => {
        if (state[`${group.id}__manual`]) group.dataset.manual = 'true';
        if (state[group.id]) group.querySelector(`.trend-btn[data-value="${state[group.id]}"]`)?.classList.add('active');
    });

    toggleOxyFields();
    toggleInfusionsBox();
}
