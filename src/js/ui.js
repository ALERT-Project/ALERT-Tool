import { $, debounce, showToast } from './utils.js';
import { normalRanges, comorbMap, toggleInputs, staticInputs, ACCORDION_KEY, STORAGE_KEY, UNDO_KEY } from './config.js';
import {
    getState, saveState, pushUndo, isQuickReviewMode, setQuickReviewMode, initialQuickReviewRisks,
    setInitialQuickReviewRisks, quickReviewBaselineCaptured, setQuickReviewBaselineCaptured,
    previousCategoryData, updateLastSaved,
    quickReviewDismissedBySession, setQuickReviewDismissed, quickReviewOffered, setQuickReviewOffered,
    clearActiveIssues, renderScrapedIssuesList
} from './state.js';
import { computeAll } from './logic.js';

export function checkBloodRanges() {
    for (const [key, range] of Object.entries(normalRanges)) {
        const id = `bl_${key}`;
        const input = $(id);
        if (input) {
            const val = parseFloat(input.value);
            const parent = input.closest('.blood-item, .input-box');
            if (!isNaN(val) && (val < range.low || val > range.high)) {
                parent?.classList.add('blood-abnormal');
            } else {
                parent?.classList.remove('blood-abnormal');
            }
        }
    }
}

export function handleSegmentClick(id, value) {
    const map = {
        'resp_concern': 'resp_gate_content',
        'renal': 'renal_gate_content',
        'infection': 'infection_gate_content',
        'neuro_gate': 'neuro_gate_content',
        'nutrition_adequate': 'nutrition_context_wrapper',
        'electrolyte_gate': 'electrolyte_gate_content',
        'pressors': 'pressor_gate_content',
        'immobility': 'immobility_note_wrapper',
        'after_hours': 'after_hours_note_wrapper',
        'hac': 'hac_content',
        'stepdown_suitable': 'unsuitable_note_wrapper',
        'comorbs_gate': 'comorbs_gate_content',
        'sleep_quality': 'sleep_quality_wrapper',
        'pain_control': 'pain_context_wrapper',
        'neuro_psych': 'neuro_psych_wrapper',
        'pics': 'pics_wrapper',
        'resp_dyspnea': 'sub_dyspnea_severity',
        'intubated': 'sub_intubated_reason',
        'age_mitigated': 'age_mitigate_reason_wrapper',
        'frailty_known': 'frailty_note_wrapper'
    };

    if (map[id]) {
        const el = $(map[id]);
        if (el) {
            let isShown = false;
            if (id === 'stepdown_suitable' || id === 'nutrition_adequate') {
                isShown = (value === "false");
            } else if (id === 'pics') {
                isShown = (value === "positive" || value === "negative");
            } else {
                isShown = (value === "true");
            }
            el.style.display = isShown ? 'block' : 'none';

            if (isShown) {
                setTimeout(() => {
                    const firstFocusable = el.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) {
                        firstFocusable.focus({ preventScroll: true });
                    }
                }, 50);
            }
        }
    }

    if (id === 'resp_dyspnea' && value !== 'true') {
        const dyspInput = $('dyspneaConcern');
        if (dyspInput) dyspInput.value = '';
        document.querySelectorAll('.quick-select[data-target="dyspneaConcern"]').forEach(b => b.classList.remove('active'));
    }
}

export function updateWardOptions() {
    const type = document.querySelector('input[name="reviewType"]:checked')?.value || 'post';
    const sel = $('ptWard');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="" selected disabled>Select Ward...</option>';
    const opts = (type === 'pre')
        ? ['ICU Pod 1', 'ICU Pod 2', 'ICU Pod 3', 'ICU Pod 4']
        : ['3A', '3B', '3C', '3D', '4A', '4B', '4C', '4D', '5A', '5B', '5C', '5D', '6A', '6B', '6C', '6D', '7A', '7B', '7C', '7D', 'SRS2A', 'SRS1A', 'SRSA', 'SRSB', 'Medihotel 5', 'Medihotel 6', 'Medihotel 7', 'Medihotel 8', 'Short Stay', 'Transit Lounge', 'Mental Health', 'CCU'];
    [...opts, 'Other'].forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        if (currentVal === o) opt.selected = true;
        sel.appendChild(opt);
    });
    updateWardOtherVisibility();
}

export function updateReviewTypeVisibility() {
    const type = document.querySelector('input[name="reviewType"]:checked')?.value || 'post';
    const dis = $('chk_discharge_wrapper'); if (dis) dis.style.display = (type === 'post') ? 'block' : 'none';
    const uns = $('chk_unsuitable_wrapper'); if (uns) uns.style.display = (type === 'pre') ? 'block' : 'none';
    const icu = $('icu_summary_wrapper'); if (icu) icu.style.display = (type === 'pre') ? 'block' : 'none';
    const dateWrapper = $('stepdown_date_wrapper'); if (dateWrapper) dateWrapper.style.display = (type === 'post') ? 'contents' : 'none';

    const medRoundingWrapper = $('chk_medical_rounding_wrapper');
    const medRoundingPre = $('chk_medical_rounding_prestepdown');
    const continueAlertWrapper = $('chk_continue_alert_wrapper');
    if (medRoundingWrapper) medRoundingWrapper.style.display = (type === 'post') ? 'block' : 'none';
    if (medRoundingPre) medRoundingPre.style.display = (type === 'pre') ? 'block' : 'none';
    if (continueAlertWrapper) continueAlertWrapper.style.display = (type === 'post') ? 'flex' : 'none';

    const alertActionsSection = $('alert_actions_section');
    if (alertActionsSection) alertActionsSection.style.display = (type === 'post') ? 'block' : 'none';

    if (type === 'pre') { const c = $('chk_discharge_alert'); if (c) c.checked = false; }
}

export function updateWardOtherVisibility() {
    const w = $('ptWardOtherWrapper');
    const v = $('ptWard')?.value;
    if (w) w.style.display = (v === 'Other') ? 'block' : 'none';
}

export function updateDevicesSectionVisibility() { }

export function createDeviceEntry(type, val = '', insertionDate = '') {
    const c = $('devices-container');
    if (!c) return;
    const div = document.createElement('div');
    div.className = 'device-entry';
    div.dataset.type = type;

    const trackedDevices = ['CVC', 'PICC', 'PIVC', 'Other CVAD', 'IDC', 'Vascath'];
    const hasDateField = trackedDevices.includes(type);

    let dwellDays = 0;
    let borderColor = 'var(--line)';
    let infoText = '';
    let infoColor = '';

    if (hasDateField && insertionDate) {
        const now = new Date();
        const deviceDate = new Date(insertionDate + 'T00:00:00');
        dwellDays = Math.floor((now - deviceDate) / (1000 * 60 * 60 * 24));

        infoText = `${dwellDays}d dwell`;
        infoColor = 'var(--text)';

        if (type === 'PIVC') {
            if (dwellDays >= 7) { infoText = `${dwellDays}d, very long dwell`; infoColor = 'var(--red)'; borderColor = 'var(--red)'; }
            else if (dwellDays >= 5) { infoText = `${dwellDays}d, long dwell`; infoColor = 'var(--amber)'; borderColor = 'var(--amber)'; }
            else if (dwellDays >= 3) { infoText = `${dwellDays}d dwell`; infoColor = '#9333ea'; borderColor = '#9333ea'; }
        } else {
            if (dwellDays >= 14) { infoText = `${dwellDays}d, very long dwell`; infoColor = 'var(--red)'; borderColor = 'var(--red)'; }
            else if (dwellDays >= 10) { infoText = `${dwellDays}d, very long dwell`; infoColor = 'var(--amber)'; borderColor = 'var(--amber)'; }
            else if (dwellDays >= 7) { infoText = `${dwellDays}d, long dwell`; infoColor = '#9333ea'; borderColor = '#9333ea'; }
        }
    }

    // One row per device: type, insertion date, details, dwell warning, remove. The dwell
    // text sits inline rather than on its own line so a long line list stays scannable.
    let html = `<div class="device-row" style="border-color:${borderColor};">`;
    html += `<div class="device-type">${type}</div>`;

    if (hasDateField) {
        html += `<input class="device-date" type="date" value="${insertionDate}" placeholder="Date"/>`;
    }

    html += `<input class="device-textarea" type="text" placeholder="details..." value="${val}"/>`;
    if (infoText && infoColor) {
        html += `<div class="device-info-text" style="color:${infoColor};">${infoText}</div>`;
    }
    html += `<div class="remove-entry" title="Remove">✕</div>`;
    html += `</div>`;

    div.innerHTML = html;
    
    if (type === 'Tracheostomy') {
        const tracheBtn = document.querySelector('#oxMod .select-btn[data-value="Trache"]');
        if (tracheBtn && !tracheBtn.classList.contains('active')) {
            tracheBtn.click();
        }
        const tracheTypeBtn = document.querySelector('#tracheType .select-btn[data-value="Tracheostomy"]');
        if (tracheTypeBtn && !tracheTypeBtn.classList.contains('active')) {
            tracheTypeBtn.click();
        }
    }

    div.querySelector('.remove-entry').addEventListener('click', () => {
        const textarea = div.querySelector('.device-textarea');
        div.remove();
        if (type === 'Tracheostomy') {
            const raBtn = document.querySelector('#oxMod .select-btn[data-value="RA"]');
            if (raBtn) {
                raBtn.click();
            }
            const airwayInput = $('airway_a');
            if (airwayInput && airwayInput.dataset.manual !== 'true') {
                if (airwayInput.value.startsWith('Tracheostomy')) {
                    airwayInput.value = '';
                }
            }
        } else if (type === 'Other Device' && textarea && textarea.value.toLowerCase().includes('lary')) {
            const raBtn = document.querySelector('#oxMod .select-btn[data-value="RA"]');
            if (raBtn) {
                raBtn.click();
            }
            const airwayInput = $('airway_a');
            if (airwayInput && airwayInput.dataset.manual !== 'true') {
                if (airwayInput.value.startsWith('Laryngectomy')) {
                    airwayInput.value = '';
                }
            }
        }
        window.devicesModifiedSinceLastSummary = true;
        updateDevicesSectionVisibility();
        saveState(true);
        computeAll();
    });
    const textarea = div.querySelector('.device-textarea');
    if (textarea) {
        textarea.addEventListener('input', () => {
            if (type === 'Other Device') {
                const val = textarea.value.toLowerCase().trim();
                if (val.includes('lary')) {
                    const tracheBtn = document.querySelector('#oxMod .select-btn[data-value="Trache"]');
                    if (tracheBtn && !tracheBtn.classList.contains('active')) {
                        tracheBtn.click();
                    }
                    const laryBtn = document.querySelector('#tracheType .select-btn[data-value="Laryngectomy"]');
                    if (laryBtn && !laryBtn.classList.contains('active')) {
                        laryBtn.click();
                    }
                }
            }
            window.devicesModifiedSinceLastSummary = true;
            saveState(true);
            computeAll();
        });
    }
    if (hasDateField) {
        div.querySelector('.device-date').addEventListener('change', () => {
            const newDate = div.querySelector('.device-date').value;
            if (newDate) {
                const deviceDate = new Date(newDate + 'T00:00:00');
                const dwellDays = Math.floor((new Date() - deviceDate) / (1000 * 60 * 60 * 24));

                let newBorderColor = 'var(--line)';
                let infoText = `${dwellDays}d dwell`;
                let infoColor = 'var(--text)';

                if (type === 'PIVC') {
                    if (dwellDays >= 7) { newBorderColor = 'var(--red)'; infoText = `${dwellDays}d, very long dwell`; infoColor = 'var(--red)'; }
                    else if (dwellDays >= 5) { newBorderColor = 'var(--amber)'; infoText = `${dwellDays}d, long dwell`; infoColor = 'var(--amber)'; }
                    else if (dwellDays >= 3) { newBorderColor = '#9333ea'; infoText = `${dwellDays}d dwell`; infoColor = '#9333ea'; }
                } else {
                    if (dwellDays >= 14) { newBorderColor = 'var(--red)'; infoText = `${dwellDays}d, very long dwell`; infoColor = 'var(--red)'; }
                    else if (dwellDays >= 10) { newBorderColor = 'var(--amber)'; infoText = `${dwellDays}d, very long dwell`; infoColor = 'var(--amber)'; }
                    else if (dwellDays >= 7) { newBorderColor = '#9333ea'; infoText = `${dwellDays}d, long dwell`; infoColor = '#9333ea'; }
                }

                const innerDiv = div.querySelector('div[style*="border"]');
                if (innerDiv) {
                    innerDiv.style.borderColor = newBorderColor;
                }

                let infoTextEl = div.querySelector('.device-info-text');
                if (infoText && infoColor) {
                    if (!infoTextEl) {
                        infoTextEl = document.createElement('div');
                        infoTextEl.className = 'device-info-text';
                        infoTextEl.style.cssText = 'font-size:0.8rem; font-weight:600; padding-left:8px;';
                        div.querySelector('div[style*="flex-direction"]')?.appendChild(infoTextEl);
                    }
                    infoTextEl.textContent = infoText;
                    infoTextEl.style.color = infoColor;
                } else if (infoTextEl) {
                    infoTextEl.remove();
                }
            }
            window.devicesModifiedSinceLastSummary = true;
            saveState(true);
            computeAll();
        });
    }
    c.appendChild(div);
}

export function toggleOxyFields() {
    const mod = $('oxMod')?.querySelector('.select-btn.active')?.dataset.value || 'RA';
    const show = (cls) => document.querySelectorAll(cls).forEach(e => e.style.display = 'block');
    const hide = (cls) => document.querySelectorAll(cls).forEach(e => e.style.display = 'none');
    hide('.npOnly'); hide('.hfnpOnly'); hide('.nivOnly'); hide('.tracheOnly');
    if (mod === 'NP') show('.npOnly');
    if (mod === 'HFNP') show('.hfnpOnly');
    if (mod === 'NIV') show('.nivOnly');
    if (mod === 'Trache') show('.tracheOnly');
}

export function toggleInfusionsBox() {
    const w = $('infusions_wrapper');
    if (w) w.style.display = 'grid';
}

export function toggleBowelDate(mode) {
    const w = $('bowel_date_wrapper');
    if (w) w.style.display = mode ? 'block' : 'none';
    if (mode) {
        const l = $('bowel_date_label');
        if (l) l.textContent = (mode === 'btn_bno') ? 'Date Last Opened' : 'Date BO';
        const ap = $('aperients_wrapper');
        if (ap) ap.style.display = (mode === 'btn_bno') ? 'block' : 'none';
        handleUnknownBLODate();
    }
}

export function handleUnknownBLODate() {
    const unknownChk = $('chk_unknown_blo_date');
    const dateInput = $('bowel_date');
    const todayBtn = $('btn_bowel_today');
    const yesterdayBtn = $('btn_bowel_yesterday');

    if (unknownChk && dateInput) {
        const isUnknown = unknownChk.checked;
        dateInput.disabled = isUnknown;
        dateInput.style.opacity = isUnknown ? '0.5' : '1';
        if (todayBtn) {
            todayBtn.disabled = isUnknown;
            todayBtn.style.opacity = isUnknown ? '0.5' : '1';
        }
        if (yesterdayBtn) {
            yesterdayBtn.disabled = isUnknown;
            yesterdayBtn.style.opacity = isUnknown ? '0.5' : '1';
        }
        if (isUnknown) {
            dateInput.value = '';
        }
    }
}

export function showClearDataModal() {
    const modal = $('clearDataModal');
    if (modal) modal.style.display = 'flex';
}

export function hideClearDataModal() {
    const modal = $('clearDataModal');
    if (modal) modal.style.display = 'none';
}

let _syncingPMH = false;
export function syncComorbsToPMH() {
    if (_syncingPMH) return;
    _syncingPMH = true;

    const noteEl = $('pmh_note');
    if (!noteEl) { _syncingPMH = false; return; }

    const activeKeys = toggleInputs.filter(k => k.startsWith('comorb_') && $(`toggle_${k}`)?.dataset.value === 'true');
    const chipLines = [];
    activeKeys.forEach(k => {
        if (k === 'comorb_other') {
            const specVal = $('comorb_other_note')?.value.trim();
            if (specVal) {
                specVal.split(/[\n,]+/).forEach(v => {
                    const trimmed = v.trim();
                    if (trimmed) chipLines.push(trimmed);
                });
            }
        } else {
            chipLines.push(comorbMap[k]);
        }
    });

    const filterLower = Object.values(comorbMap).map(n => n.toLowerCase());
    const otherVal = $('comorb_other_note')?.value.trim();
    if (otherVal) {
        otherVal.split(/[\n,]+/).forEach(v => {
            const trimmed = v.trim();
            if (trimmed) filterLower.push(trimmed.toLowerCase());
        });
    }

    const userLines = noteEl.value.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed && !filterLower.includes(trimmed.toLowerCase());
    });

    noteEl.value = [...chipLines, ...userLines].join('\n');
    _syncingPMH = false;
}

export function clearData() {
    hideClearDataModal();

    if (isQuickReviewMode) {
        exitQuickReviewMode();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.accordion').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');

    });
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(UNDO_KEY);
    sessionStorage.removeItem('alertToolLastSaved_v7_7');
    localStorage.removeItem(ACCORDION_KEY);
    sessionStorage.removeItem(ACCORDION_KEY);
    localStorage.removeItem('alert_audit_log_v1');
    updateLastSaved();

    staticInputs.forEach(id => {
        if ($(id)) {
            $(id).value = '';
            $(id).classList.remove('scraped-data');
            const el = $(id);
            if (['b_device', 'airway_a'].includes(id)) {
                el.dataset.manual = 'false';
            }
        }
    });

    const impTxt = $('importText'); if (impTxt) impTxt.value = '';

    document.querySelectorAll('.active').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('input[type="checkbox"]').forEach(e => e.checked = false);
    document.querySelectorAll('.toggle-label').forEach(e => e.dataset.value = 'false');
    document.querySelectorAll('.blood-abnormal').forEach(e => e.classList.remove('blood-abnormal'));

    const dc = $('devices-container'); if (dc) dc.innerHTML = '';
    const sc = $('selected_comorbs_display');
    if (sc) { sc.innerHTML = ''; sc.style.display = 'none'; }
    document.querySelectorAll('.prev-datum').forEach(el => el.textContent = '');
    window.prevBloods = {};
    const pb = $('prevRisksBox'); if (pb) pb.style.display = 'none';

    // Fresh patient: drop staged issues and let the >24h offer re-evaluate from scratch.
    setQuickReviewDismissed(false);
    setQuickReviewOffered(false);
    const qrPrompt = $('quickReviewPrompt');
    if (qrPrompt) qrPrompt.style.display = 'none';
    clearActiveIssues();
    clearNewRiskAlert();
    // Bloods must come back as a true null state, not 'nil significant' with the grid hidden.
    const bloodsGrid = document.querySelector('.bloods-grid');
    if (bloodsGrid) bloodsGrid.style.display = '';

    const gatesToHide = [
        '#resp_gate_content', '#renal_gate_content', '#neuro_gate_content', '#electrolyte_gate_content', '#infection_gate_content', '#pressor_gate_content', '#hac_content',
        '#immobility_note_wrapper', '#after_hours_note_wrapper', '#comorb_other_note_wrapper', '#unsuitable_note_wrapper', '#override_reason_box', '#sub_intubated_reason', '#sub_dyspnea_severity',
        '#pressor_recent_other_note_wrapper', '#dialysis_type_wrapper', '#anticoag_note_wrapper', '#vte_prophylaxis_note_wrapper',
        '#pics_wrapper', '#sleep_quality_wrapper', '#neuro_psych_wrapper', '#pain_context_wrapper', '#nutrition_context_wrapper',
        '#frailty_note_wrapper'
    ];
    gatesToHide.forEach(sel => { const el = document.querySelector(sel); if (el) el.style.display = 'none'; });

    document.querySelectorAll('.concern-note').forEach(e => {
        if (!['immobility_note_wrapper', 'after_hours_note_wrapper', 'comorb_other_note_wrapper', 'unsuitable_note_wrapper', 'pressor_recent_other_note_wrapper'].includes(e.id)) {
            e.style.display = 'block';
        }
    });

    const summaryActions = $('summary_actions');
    if (summaryActions) summaryActions.style.display = 'none';
    const badge = $('manual_edit_badge');
    if (badge) badge.style.display = 'none';
    const btnGen = $('btn_generate_summary');
    if (btnGen) btnGen.innerHTML = '✨ Click here to generate DMR summary';
    const summaryEl = $('summary');
    if (summaryEl) { summaryEl.value = ''; summaryEl.style.height = ''; }
    const handoverEl = $('handoverLine');
    if (handoverEl) handoverEl.value = '';
    const handoverActions = $('handover_actions');
    if (handoverActions) handoverActions.style.display = 'none';
    window.dismissedDischarge = false;

    const now = new Date();
    const m = now.getMinutes();
    const rounded = Math.round(m / 15) * 15;
    now.setMinutes(rounded);
    const tb = $('reviewTime'); if (tb) tb.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const p = document.querySelector('input[value="post"]'); if (p) p.checked = true;
    updateWardOptions();
    updateReviewTypeVisibility();
    const listEl = $('flagList'); if (listEl) listEl.innerHTML = '';
    const sum = $('summary'); if (sum) sum.value = '';

    const orReason = $('override_reason_box'); if (orReason) orReason.style.display = 'none';
    $('override_amber')?.classList.remove('active');
    $('override_red')?.classList.remove('active');
    $('override_green')?.classList.remove('active');
    const orClear = $('override_clear'); if (orClear) orClear.style.display = 'none';

    const resetEv = new CustomEvent('resetAddsCalc');
    document.dispatchEvent(resetEv);

    computeAll();
    showToast("Data cleared", 2000);
}

// Keeps the Select Category card honest about what the tool calculated versus what the
// clinician chose, and shows the CAT 3 downgrade as pending until a reason is typed.
export function refreshCategorySelect(autoCat, override, reason, redCount, amberCount) {
    const hint = $('override_auto_hint');
    if (hint) hint.textContent = `Auto-calculated: ${autoCat.text}`;

    const chosen = (override && override !== 'none') ? override : null;
    ['red', 'amber', 'green'].forEach(c => $(`override_${c}`)?.classList.toggle('active', c === chosen));

    const clearBtn = $('override_clear');
    if (clearBtn) clearBtn.style.display = chosen ? '' : 'none';

    const box = $('override_reason_box');
    if (box) box.style.display = chosen ? 'block' : 'none';
    const warn = $('override_downgrade_warn');
    const label = $('override_reason_label');
    const required = $('override_reason_required');
    const isDowngrade = override === 'green';

    if (label) label.textContent = isDowngrade ? 'Reason for CAT 3 downgrade (required)' : 'Reason for override';
    if (required) required.style.display = (isDowngrade && !reason) ? 'block' : 'none';
    if (box) box.classList.toggle('reason-missing', isDowngrade && !reason);

    if (warn) {
        if (isDowngrade && (redCount > 0 || amberCount > 0)) {
            const parts = [];
            if (redCount) parts.push(`${redCount} red flag${redCount > 1 ? 's' : ''}`);
            if (amberCount) parts.push(`${amberCount} amber flag${amberCount > 1 ? 's' : ''}`);
            warn.textContent = `⚠ Downgrading to CAT 3 with ${parts.join(' and ')} present. The flags stay in the summary.`;
            warn.style.display = 'block';
        } else {
            warn.style.display = 'none';
        }
    }
}

// MODS patients are scored on MODS, not ADDS, and consultants sometimes modify the
// observation parameters - either way the recorded score must not be overwritten by the ADDS
// calculator. Entering MODS suppresses that write and mirrors the score and details into the
// existing MODS fields, so the DMR note and handover line report MODS rather than ADDS.
export function refreshAddsOverrideUI() {
    const manual = $('addsManual')?.value === 'true';
    const btn = $('btnAddsOverride');
    const box = $('adds_override_box');
    const hint = $('adds_calc_hint');
    const addsInput = $('adds');

    if (btn) {
        btn.textContent = manual ? 'MODS score - calculator not applied' : 'Enter MODS';
        btn.classList.toggle('active', manual);
        btn.setAttribute('aria-pressed', String(manual));
    }
    if (box) box.style.display = manual ? 'block' : 'none';

    // Keep the A-E MODS fields as the single record of the score; this control is just a
    // faster way in from the risk card.
    const modsChk = $('chk_use_mods');
    if (modsChk) {
        modsChk.checked = manual;
        const modsInputs = $('mods_inputs');
        if (modsInputs) modsInputs.style.display = manual ? 'block' : 'none';
    }
    if (manual) {
        const score = $('mods_score'); if (score) score.value = addsInput?.value || '';
        const details = $('mods_details'); if (details) details.value = $('addsOverrideNote')?.value || '';
    }

    const calcTotal = $('calc_total_display')?.textContent?.trim();
    const recorded = addsInput?.value?.trim();
    if (hint) {
        if (manual && calcTotal && recorded && calcTotal !== recorded) {
            hint.textContent = `ADDS calculator ${calcTotal} · MODS recorded ${recorded}`;
            hint.style.display = 'inline';
        } else {
            hint.style.display = 'none';
        }
    }
}

export function toggleAddsOverride() {
    const field = $('addsManual');
    if (!field) return;
    const manual = field.value !== 'true';
    field.value = String(manual);

    if (manual) {
        $('adds')?.focus();
        $('adds')?.select();
    } else {
        // Switching back to ADDS hands the field to the calculator again and clears the MODS
        // record, so a stale MODS score can't linger in the summary.
        const calcTotal = $('calc_total_display')?.textContent?.trim();
        const addsInput = $('adds');
        if (addsInput && calcTotal && calcTotal !== '0') {
            addsInput.value = calcTotal;
            addsInput.dispatchEvent(new Event('input'));
        }
        const note = $('addsOverrideNote'); if (note) note.value = '';
        const score = $('mods_score'); if (score) score.value = '';
        const details = $('mods_details'); if (details) details.value = '';
    }
    refreshAddsOverrideUI();
}

// Gates the importer answered from the previous note. The concern carried over; the values
// behind it did not, so this asks the one question that makes them today's data. Deliberately
// unobtrusive: no modal, no repeat prompting, and ignoring it leaves the risk flagged as it is.
export function renderCarriedForward() {
    const card = $('carried_forward_card');
    const list = $('carried_forward_list');
    if (!card || !list) return;

    const wrappers = [...document.querySelectorAll('.input-box.carried-forward')];
    if (!wrappers.length) {
        card.style.display = 'none';
        list.innerHTML = '';
        return;
    }

    list.innerHTML = wrappers.map(w => {
        // The question label carries a "(Prev: ...)" span; the row states that separately.
        const labelEl = w.querySelector('.question-label')?.cloneNode(true);
        labelEl?.querySelector('.prev-datum')?.remove();
        const label = (labelEl?.textContent || 'Concern').replace(/\?$/, '').trim();
        const was = w.dataset.carriedFrom || '';
        return `
            <div class="cf-row" data-wrapper="${w.id}">
                <div class="cf-row-text">
                    <div class="cf-row-title">${label}</div>
                    ${was ? `<div class="cf-row-was">was: ${was}</div>` : ''}
                </div>
                <div class="cf-row-actions">
                    <button type="button" class="btn small cf-chip" data-action="resolved" data-wrapper="${w.id}">Resolved</button>
                    <button type="button" class="btn small cf-chip" data-action="present" data-wrapper="${w.id}">Still present</button>
                    <button type="button" class="btn small cf-chip" data-action="improving" data-wrapper="${w.id}">Improving</button>
                </div>
            </div>`;
    }).join('');

    list.querySelectorAll('.cf-chip').forEach(btn => {
        btn.addEventListener('click', () => answerCarriedForward(btn.dataset.wrapper, btn.dataset.action));
    });
    card.style.display = 'block';
}

function answerCarriedForward(wrapperId, action) {
    const wrapper = $(wrapperId);
    if (!wrapper) return;
    const group = wrapper.querySelector('.segmented-group');

    if (action === 'resolved') {
        // Answering No runs the app's own handler, which closes the drawer and recomputes.
        group?.querySelector('.seg-btn[data-value="false"]')?.click();
    } else if (action === 'improving') {
        const noteEl = wrapper.dataset.carriedNote ? $(wrapper.dataset.carriedNote) : null;
        // "Improving" is the clinician's assessment today, so it belongs in today's note.
        if (noteEl && !/improving/i.test(noteEl.value)) {
            noteEl.value = noteEl.value.trim() ? `${noteEl.value.trim()}, improving` : 'improving';
            noteEl.dispatchEvent(new Event('input'));
        }
    }

    wrapper.classList.remove('carried-forward');
    delete wrapper.dataset.carriedFrom;
    delete wrapper.dataset.carriedNote;
    renderCarriedForward();
    computeAll();
}

// Risks flagged since Quick Review started. Shown in place, not as a mode switch: the
// clinician stays in Quick Review and decides whether the full assessment is warranted.
let newRiskLog = [];

export function showNewRiskAlert(newRed = [], newAmber = []) {
    const box = $('qrNewRiskAlert');
    if (!box) return;

    // The same wording can arrive from two sources (e.g. a gate and its detail field);
    // list it once so the count matches what's on screen.
    const seen = new Set(newRiskLog.map(r => r.text));
    [...newRed.map(text => ({ text, severity: 'red' })), ...newAmber.map(text => ({ text, severity: 'amber' }))]
        .forEach(entry => {
            if (seen.has(entry.text)) return;
            seen.add(entry.text);
            newRiskLog.push(entry);
        });
    // The risk model sometimes emits a headline and a more specific variant of the same
    // concern ("Respiratory concern" / "Respiratory concern - tachypnea >20bpm"); keep the
    // one that says more.
    newRiskLog = newRiskLog.filter(r =>
        !newRiskLog.some(other => other !== r && other.text.startsWith(r.text)));
    if (!newRiskLog.length) return;

    const redCount = newRiskLog.filter(r => r.severity === 'red').length;
    const amberCount = newRiskLog.length - redCount;
    const counts = [
        redCount ? `${redCount} red` : '',
        amberCount ? `${amberCount} amber` : ''
    ].filter(Boolean).join(' and ');

    box.className = redCount ? 'qr-new-risk red' : 'qr-new-risk amber';
    box.innerHTML = `
        <div class="qr-new-risk-head">
            <span>⚠️ New risk flagged since this review started (${counts})</span>
            <button type="button" id="qrNewRiskDismiss" class="btn small">Dismiss</button>
        </div>
        <ul>${newRiskLog.map(r => `<li class="${r.severity}">${r.text}</li>`).join('')}</ul>
        <div class="qr-new-risk-foot">Staged in the issues list. Add detail there or in Quick Notes, or exit to
            the full assessment if this needs a fuller work-up.</div>`;
    box.hidden = false;
    $('qrNewRiskDismiss')?.addEventListener('click', clearNewRiskAlert);

    showToast(`⚠️ New risk flagged: ${[...newRed, ...newAmber].join(', ')}`, 4000);
}

export function clearNewRiskAlert() {
    newRiskLog = [];
    const box = $('qrNewRiskAlert');
    if (box) { box.hidden = true; box.innerHTML = ''; }
}

// Quick Review only: float the bloods card over the page while its details are open.
export function setBloodsOverlay(open) {
    const section = $('section-bloods');
    if (!section) return;
    section.classList.toggle('qr-expanded', !!open && isQuickReviewMode);
    syncQuickOverlayBackdrop();
}

function syncQuickOverlayBackdrop() {
    const backdrop = $('qrBackdrop');
    if (!backdrop) return;
    const anyOpen = !!document.querySelector('.qr-expanded');
    backdrop.hidden = !anyOpen;
}

// The ADDS calculator is opened by plugins/adds_calc.js, which only knows how to show and
// hide its container. Watching that container keeps the overlay in step without the plugin
// needing to know Quick Review exists.
let addsCalcObserver = null;
function watchAddsCalculator() {
    const container = $('addsCalculatorContainer');
    const wrapper = $('adds_wrapper');
    if (!container || !wrapper || addsCalcObserver) return;
    const sync = () => {
        const open = container.style.display === 'block';
        wrapper.classList.toggle('qr-expanded', open && isQuickReviewMode);
        syncQuickOverlayBackdrop();
    };
    addsCalcObserver = new MutationObserver(sync);
    addsCalcObserver.observe(container, { attributes: true, attributeFilter: ['style'] });
    sync();
}

export function closeQuickOverlays() {
    const wrapper = $('adds_wrapper');
    if (wrapper?.classList.contains('qr-expanded')) $('btnToggleCalc')?.click();
    if ($('section-bloods')?.classList.contains('qr-expanded')) $('btnBloodsDetailsToggle')?.click();
    syncQuickOverlayBackdrop();
}

export function openAccordion(panelId, btnSelector) {
    const panel = $(panelId);
    const btn = document.querySelector(btnSelector);
    if (panel && btn) {
        panel.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
    }
}

export function closeAccordion(panelId, btnSelector) {
    const panel = $(panelId);
    const btn = document.querySelector(btnSelector);
    if (panel && btn) {
        panel.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
    }
}

// Quick Review keeps only what a Day 2+ follow-up needs: ADDS (+calculator), Bloods,
// Lines, category selection, Issues and Quick Notes - laid out as one page so the review
// can be done in ~5 minutes. Everything else is hidden.
const QUICK_REVIEW_SECTIONS_TO_HIDE = ['section-patient', 'section-risk', 'section-ae', 'section-context'];
const QUICK_REVIEW_ONLY_SECTIONS = ['quick_notes_wrapper', 'scraped_risks_wrapper'];

// Which live nodes get moved into which cell of #quickGrid, in the order they should appear.
// Nothing is cloned: IDs must stay unique and every listener already bound to these elements
// has to keep working, so the elements themselves move and are put back on exit.
// Lines live in the wide column: at 2/3 width each device fits on one row instead of
// wrapping to three in the rail, and they fill the space the notes card leaves over.
const QUICK_GRID_LAYOUT = {
    qgLeft: ['adds_wrapper', 'section-bloods', 'override_card', 'quick_notes_wrapper'],
    qgRight: ['carried_forward_card', 'scraped_risks_wrapper', 'section-devices'],
    qgBottom: ['section-category']
};

function moveIntoQuickGrid() {
    Object.entries(QUICK_GRID_LAYOUT).forEach(([cellId, ids]) => {
        const cell = $(cellId);
        if (!cell) return;
        ids.forEach(id => {
            const el = $(id);
            if (!el || el.dataset.qrMoved === 'true' || !el.parentNode) return;
            // A hidden marker left behind at the original position, so exit restores the
            // exact document order rather than appending everything to the end.
            const anchor = document.createElement('span');
            anchor.setAttribute('data-qr-anchor', id);
            anchor.style.display = 'none';
            el.parentNode.insertBefore(anchor, el);
            cell.appendChild(el);
            el.dataset.qrMoved = 'true';
        });
    });
}

function restoreFromQuickGrid() {
    document.querySelectorAll('[data-qr-moved="true"]').forEach(el => {
        const anchor = document.querySelector(`[data-qr-anchor="${el.id}"]`);
        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(el, anchor);
            anchor.remove();
        }
        delete el.dataset.qrMoved;
    });
}

export function enableQuickReviewMode() {
    setQuickReviewMode(true);
    setInitialQuickReviewRisks({ red: [], amber: [] });
    setQuickReviewBaselineCaptured(false);
    clearNewRiskAlert();

    computeAll();

    document.body.classList.add('quick-review-active');

    const banner = $('quickReviewBanner');
    if (banner) banner.style.display = 'block';
    const prompt = $('quickReviewPrompt');
    if (prompt) prompt.style.display = 'none';

    QUICK_REVIEW_SECTIONS_TO_HIDE.forEach(id => {
        const section = $(id);
        if (section) {
            section.style.display = 'none';
            section.setAttribute('data-hidden-by-quick-review', 'true');
        }
    });

    QUICK_REVIEW_ONLY_SECTIONS.forEach(id => {
        const section = $(id);
        if (section) section.style.display = 'block';
    });

    moveIntoQuickGrid();
    watchAddsCalculator();

    // Bloods stay behind the three quick buttons; lines open, since the add-chips are the
    // whole point of having the section on the page.
    closeAccordion('panel_bloods', '[aria-controls="panel_bloods"]');
    openAccordion('panel_devices', '[aria-controls="panel_devices"]');

    const bloodsQuick = $('bloods_quick_controls');
    if (bloodsQuick) bloodsQuick.style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href')?.substring(1);
        if (href && QUICK_REVIEW_SECTIONS_TO_HIDE.includes(href)) {
            item.style.opacity = '0.3';
            item.style.pointerEvents = 'none';
        }
    });

    const toggleBtn = $('btnManualQuickReview');
    if (toggleBtn) toggleBtn.textContent = 'Exit Quick Review';

    renderScrapedIssuesList();

    setTimeout(() => {
        const target = $('quickGrid');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    showToast('Quick Review mode', 2000);
}

// >24h since stepdown (stepdown time defaults to 16:00 upstream) *offers* Quick Review.
// The clinician decides - never switch modes out from under them.
export function maybeOfferQuickReview(timeData, s) {
    if (!s.stepdownDate) return;
    if (s.reviewType === 'pre') return;
    if (isQuickReviewMode) return;
    if (quickReviewDismissedBySession) return;
    if (timeData.hours > 24) {
        showQuickReviewPrompt($('catText')?.textContent || '', timeData.hours);
    }
}

export function exitQuickReviewMode() {
    setQuickReviewMode(false);
    setInitialQuickReviewRisks({ red: [], amber: [] });
    setQuickReviewBaselineCaptured(false);
    // Without this the >24h auto-trigger would immediately re-enter on the next compute.
    setQuickReviewDismissed(true);

    document.body.classList.remove('quick-review-active');

    const banner = $('quickReviewBanner');
    if (banner) banner.style.display = 'none';

    clearNewRiskAlert();
    $('adds_wrapper')?.classList.remove('qr-expanded');
    setBloodsOverlay(false);
    restoreFromQuickGrid();
    document.querySelector('.device-add-group')?.classList.remove('show-all');
    $('btnDeviceMore')?.setAttribute('aria-expanded', 'false');

    document.querySelectorAll('[data-hidden-by-quick-review]').forEach(section => {
        section.style.display = '';
        section.removeAttribute('data-hidden-by-quick-review');
    });

    QUICK_REVIEW_ONLY_SECTIONS.forEach(id => {
        const section = $(id);
        if (section) section.style.display = 'none';
    });

    const bloodsQuick = $('bloods_quick_controls');
    if (bloodsQuick) bloodsQuick.style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(item => {
        item.style.opacity = '';
        item.style.pointerEvents = '';
    });

    const toggleBtn = $('btnManualQuickReview');
    if (toggleBtn) toggleBtn.textContent = 'Quick Review';

    showToast("Full review mode restored", 2000);
}

export function checkStablePatientStatus() {
    const state = getState();
    if (!previousCategoryData) return false;

    const { category, hoursOnWard } = previousCategoryData;

    if (category === 'green' && state.reviewType === 'post' && hoursOnWard >= 24) {
        return true;
    }

    if (category === 'amber' && state.reviewType === 'post' && hoursOnWard >= 48) {
        return true;
    }

    return false;
}

export function showQuickReviewPrompt(categoryText, hoursOnWard, previousRisks = []) {
    const prompt = $('quickReviewPrompt');
    if (!prompt) return;
    // computeAll runs on every debounced input; offer once or we re-scroll on every keystroke.
    // This also de-duplicates the two trigger paths (DMR import and the >24h check).
    if (quickReviewOffered) return;
    setQuickReviewOffered(true);

    const prevCatText = $('prevCategoryText');
    const timeText = $('timeOnWardText');

    // The >24h path has no previous category; only show that clause when it's known.
    if (prevCatText) prevCatText.textContent = categoryText ? `Previous: ${categoryText}` : '';
    if (timeText) timeText.textContent = `${Math.round(hoursOnWard)}h since stepdown`;

    // Risks carried over from the scraped note get their own list - they're what the
    // follow-up is actually about.
    const risksBox = $('qrPromptRisks');
    if (risksBox) {
        if (previousRisks.length) {
            risksBox.innerHTML = `<strong>Previously flagged</strong><ul>${previousRisks.map(r => `<li>${r}</li>`).join('')}</ul>`;
            risksBox.style.display = 'block';
        } else {
            risksBox.style.display = 'none';
        }
    }

    prompt.style.display = 'flex';
    setTimeout(() => $('btnQuickReview')?.focus(), 100);
}

export function checkForExistingRisks(state) {
    if (state.resp_rr_concern || state.resp_o2_concern || state.resp_new_therapy) return true;
    if (state.neuro_severity === 'confusion' || state.neuro_severity === 'delirium') return true;
    if (state.renal_acute || state.renal_aki_stage) return true;
    if (state.infection_present) return true;
    if (state.pressor_recent_norad || state.pressor_recent_met || state.pressor_recent_gtn ||
        state.pressor_recent_dob || state.pressor_recent_mid) return true;
    if (state.immobility) return true;
    if (state.nutrition_concern) return true;
    return false;
}

export function updateSidebarRiskBadges(redCount, amberCount) {
    const badgeContainer = document.getElementById('sidebar-risk-badges');
    const mobileBadgeContainer = document.getElementById('mobile-risk-badges');

    let html = '';
    if (redCount > 0) html += `<span class="badge" style="color:var(--red);">🔴${redCount}</span>`;
    if (amberCount > 0) html += `<span class="badge" style="color:var(--amber);">🟡${amberCount}</span>`;

    if (badgeContainer) badgeContainer.innerHTML = html;
    if (mobileBadgeContainer) mobileBadgeContainer.innerHTML = html;
}

export function openMobileNav() {
    const overlay = $('mobileNavOverlay');
    if (overlay) overlay.classList.add('active');
}

export function closeMobileNav() {
    const overlay = $('mobileNavOverlay');
    if (overlay) overlay.classList.remove('active');
}

export function updateAgeMitigationUI() {
    const ageInput = $('ptAge');
    const wrapper = $('age_risk_wrapper');
    const reasonWrapper = $('age_mitigate_reason_wrapper');
    const reasonInput = $('age_mitigate_reason');
    const seg = $('seg_age_mitigated');
    const ageLabel = $('lbl_ptAge');
    const clickBox = $('btn_age_mitigated');
    const colWrapper = $('wrapper_ptAge');
    
    if (!ageInput || !wrapper) return;
    
    const age = parseFloat(ageInput.value);
    if (!isNaN(age) && age >= 75) {
        wrapper.style.display = 'block';
        
        // Add the card wrapper dynamically
        if (colWrapper) colWrapper.classList.add('input-box');
        
        // Find if mitigated
        const activeBtn = seg?.querySelector('.seg-btn.active');
        const isMitigated = activeBtn ? (activeBtn.dataset.value === 'true') : false;
        
        if (reasonWrapper) {
            reasonWrapper.style.display = isMitigated ? 'block' : 'none';
        }
        
        if (isMitigated) {
            // Mitigated — subtle clean border
            if (colWrapper) {
                colWrapper.style.borderColor = 'var(--line)';
                colWrapper.style.background = '';
                colWrapper.style.boxShadow = '';
            }
            
            if (ageLabel) {
                ageLabel.innerHTML = 'Age';
                ageLabel.style.color = '';
            }
            ageInput.style.borderColor = '';
            ageInput.style.boxShadow = '';
            
            if (clickBox) {
                clickBox.removeAttribute('style');
                clickBox.className = 'age-mitigate-btn mitigated';
                clickBox.innerHTML = '✓ Mitigated for good baseline';
            }
        } else {
            // Unmitigated — amber highlight on the card
            if (colWrapper) {
                colWrapper.style.borderColor = 'var(--amber)';
                colWrapper.style.background = 'rgba(245,158,11,0.03)';
                colWrapper.style.boxShadow = '0 0 0 1px var(--amber)';
            }
            
            if (ageLabel) {
                ageLabel.innerHTML = 'Age <span style="color: var(--amber); font-weight: bold; font-size: 0.72rem;">- Frailty risk identified</span>';
                ageLabel.style.color = 'var(--amber)';
            }
            ageInput.style.borderColor = '';
            ageInput.style.boxShadow = '';
            
            if (clickBox) {
                clickBox.removeAttribute('style');
                clickBox.className = 'age-mitigate-btn';
                clickBox.innerHTML = 'Click here to mitigate age risk for good baseline';
            }
        }
    } else {
        wrapper.style.display = 'none';
        if (reasonInput) reasonInput.value = '';
        if (reasonWrapper) reasonWrapper.style.display = 'none';
        if (seg) {
            seg.querySelectorAll('.seg-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.value === 'false');
            });
        }
        // Remove the card wrapper and restore bare style
        if (colWrapper) {
            colWrapper.classList.remove('input-box');
            colWrapper.style.borderColor = 'transparent';
            colWrapper.style.background = 'transparent';
            colWrapper.style.boxShadow = 'none';
        }
        if (ageLabel) {
            ageLabel.innerHTML = 'Age';
            ageLabel.style.color = '';
        }
        ageInput.style.borderColor = '';
        ageInput.style.boxShadow = '';
        if (clickBox) {
            clickBox.removeAttribute('style');
            clickBox.className = 'age-mitigate-btn';
            clickBox.innerHTML = 'Click here to mitigate age risk for good baseline';
        }
    }
}

