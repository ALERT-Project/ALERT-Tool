import { $, debounce, showToast } from './utils.js';
import { normalRanges, comorbMap, toggleInputs, staticInputs, ACCORDION_KEY } from './config.js';
import { getState, saveState, pushUndo, isQuickReviewMode, setQuickReviewMode, initialQuickReviewRisks, setInitialQuickReviewRisks, quickReviewBaselineCaptured, setQuickReviewBaselineCaptured, previousCategoryData } from './state.js';
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
        'intubated': 'sub_intubated_reason'
    };

    if (map[id]) {
        const el = $(map[id]);
        if (el) {
            if (id === 'stepdown_suitable' || id === 'nutrition_adequate') {
                el.style.display = (value === "false") ? 'block' : 'none';
            } else if (id === 'pics') {
                el.style.display = (value === "positive" || value === "negative") ? 'block' : 'none';
            } else {
                el.style.display = (value === "true") ? 'block' : 'none';
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

    let html = `<div style="display:flex; flex-direction:column; gap:4px; width:100%; box-sizing:border-box;">`;
    html += `<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:8px; background:var(--input-bg); border:1px solid ${borderColor}; border-radius:6px; box-sizing:border-box;">`;
    html += `<div style="flex-shrink:0; font-weight:600; font-size:0.85rem; min-width:80px;">${type}</div>`;

    if (hasDateField) {
        html += `<input class="device-date" type="date" value="${insertionDate}" placeholder="Date" style="padding:4px 6px; border:1px solid var(--line); border-radius:4px; font-size:0.8rem; width:130px;"/>`;
    }

    html += `<input class="device-textarea" type="text" placeholder="details..." value="${val}" style="flex:1; min-width:120px; padding:4px 8px; border:1px solid var(--line); border-radius:4px; font-size:0.85rem; box-sizing:border-box;"/>`;
    html += `<div class="remove-entry" style="cursor:pointer; font-weight:bold; color:var(--accent); font-size:1rem; flex-shrink:0;">✕</div>`;
    html += `</div>`;

    if (infoText && infoColor) {
        html += `<div class="device-info-text" style="font-size:0.8rem; font-weight:600; color:${infoColor}; padding-left:8px;">${infoText}</div>`;
    }
    html += `</div>`;

    div.innerHTML = html;
    div.querySelector('.remove-entry').addEventListener('click', () => {
        div.remove();
        window.devicesModifiedSinceLastSummary = true;
        updateDevicesSectionVisibility();
        saveState(true);
        computeAll();
    });
    const textarea = div.querySelector('.device-textarea');
    if (textarea) {
        textarea.addEventListener('input', () => {
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
            if (specVal) chipLines.push(specVal);
        } else {
            chipLines.push(comorbMap[k]);
        }
    });

    const filterLower = Object.values(comorbMap).map(n => n.toLowerCase());
    const otherVal = $('comorb_other_note')?.value.trim();
    if (otherVal) filterLower.push(otherVal.toLowerCase());

    const userLines = noteEl.value.split('\\n').filter(line => {
        const trimmed = line.trim();
        return trimmed && !filterLower.includes(trimmed.toLowerCase());
    });

    noteEl.value = [...chipLines, ...userLines].join('\\n');
    _syncingPMH = false;
}

export function clearData() {
    hideClearDataModal();

    if (isQuickReviewMode) {
        exitQuickReviewMode();
    }

    pushUndo(getState());
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.accordion').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        const icon = btn.querySelector('.icon');
        if (icon) icon.textContent = '[+]';
    });
    sessionStorage.removeItem(ACCORDION_KEY);

    staticInputs.forEach(id => {
        if ($(id)) {
            $(id).value = '';
            $(id).classList.remove('scraped-data');
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
    const pb = $('prevRisksBox'); if (pb) pb.style.display = 'none';

    const gatesToHide = [
        '#resp_gate_content', '#renal_gate_content', '#neuro_gate_content', '#electrolyte_gate_content', '#infection_gate_content', '#pressor_gate_content', '#hac_content',
        '#immobility_note_wrapper', '#after_hours_note_wrapper', '#comorb_other_note_wrapper', '#unsuitable_note_wrapper', '#override_reason_box', '#sub_intubated_reason', '#sub_dyspnea_severity',
        '#pressor_recent_other_note_wrapper', '#dialysis_type_wrapper', '#anticoag_note_wrapper', '#vte_prophylaxis_note_wrapper',
        '#pics_wrapper', '#sleep_quality_wrapper', '#neuro_psych_wrapper', '#pain_context_wrapper', '#nutrition_context_wrapper'
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

    const orReason = $('override_reason_box'); if(orReason) orReason.style.display = 'none';
    $('override_amber')?.classList.remove('active');
    $('override_red')?.classList.remove('active');

    const resetEv = new CustomEvent('resetAddsCalc');
    document.dispatchEvent(resetEv);

    computeAll();
    saveState(true);
    showToast("Data cleared", 2000);
}

export function openAccordion(panelId, btnSelector) {
    const panel = $(panelId);
    const btn = document.querySelector(btnSelector);
    if (panel && btn) {
        panel.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        const icon = btn.querySelector('.icon');
        if (icon) icon.textContent = '[-]';
    }
}

export function enableQuickReviewMode() {
    setQuickReviewMode(true);
    const s = getState();
    setInitialQuickReviewRisks({ red: [], amber: [] });
    setQuickReviewBaselineCaptured(false);

    computeAll();

    const banner = $('quickReviewBanner');
    if (banner) banner.style.display = 'block';

    const prompt = $('quickReviewPrompt');
    if (prompt) prompt.style.display = 'none';

    const previousRisks = previousCategoryData?.previousRisks || [];

    const riskSectionMap = {
        'respiratory': 'resp_wrapper',
        'neuro': 'neuro_wrapper',
        'renal': 'renal_wrapper',
        'infection': 'infection_wrapper',
        'vasoactive': 'pressor_wrapper',
        'immobility': 'immobility_wrapper',
        'nutrition': 'nutrition_wrapper',
        'electrolyte': 'elec_wrapper'
    };

    const allRiskSections = [...Object.values(riskSectionMap), 'hac_wrapper', 'ah_wrapper', 'comorbs_wrapper', 'after_hours_note_wrapper'];

    const sectionsToShow = previousRisks.map(risk => riskSectionMap[risk]).filter(Boolean);
    const sectionsToHide = allRiskSections.filter(id => !sectionsToShow.includes(id));

    sectionsToHide.forEach(id => {
        const section = $(id);
        if (section) {
            section.style.display = 'none';
            section.setAttribute('data-hidden-by-quick-review', 'true');
        }
    });

    sectionsToShow.forEach(id => {
        const section = $(id);
        if (section) {
            const heading = section.querySelector('.bold-heading');
            if (heading && !heading.querySelector('.review-badge')) {
                const badge = document.createElement('span');
                badge.className = 'review-badge';
                badge.style.cssText = 'display:inline-block; margin-left:8px; padding:2px 8px; background:var(--amber); color:white; font-size:0.75rem; border-radius:4px; font-weight:600;';
                badge.textContent = '↻ Re-assess';
                heading.appendChild(badge);
            }
        }
    });

    const otherSectionsToHide = ['section-psychosocial'];

    otherSectionsToHide.forEach(id => {
        const section = $(id);
        if (section) {
            section.style.display = 'none';
            section.setAttribute('data-hidden-by-quick-review', 'true');
        }
    });

    const accordionsToClose = ['panel_devices', 'panel_other'];
    accordionsToClose.forEach(panelId => {
        if (panelId === 'panel_devices') {
            const hasDevices = Object.values(s.devices || {}).some(arr => Array.isArray(arr) && arr.length > 0);
            if (hasDevices) {
                openAccordion('panel_devices', '[aria-controls="panel_devices"]');
                return;
            }
        }

        const btnSelector = `[aria-controls="${panelId}"]`;
        const btn = document.querySelector(btnSelector);
        const panel = $(panelId);
        if (btn && panel) {
            panel.style.display = 'none';
            btn.setAttribute('aria-expanded', 'false');
            const icon = btn.querySelector('.icon');
            if (icon) icon.textContent = '[+]';
        }
    });

    openAccordion('panel_ae', '[aria-controls="panel_ae"]');
    openAccordion('panel_bloods', '[aria-controls="panel_bloods"]');

    const riskSection = $('section-risk');
    if (riskSection) {
        riskSection.style.display = '';
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && otherSectionsToHide.includes(href.substring(1))) {
            item.style.opacity = '0.3';
            item.style.pointerEvents = 'none';
        }
    });

    setTimeout(() => {
        const aeSection = $('section-ae');
        if (aeSection) aeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);

    const riskNames = previousRisks.join(', ');
    showToast(`⚡ Quick Review - Re-assessing: ${riskNames}`, 3000);
}

export function exitQuickReviewMode() {
    setQuickReviewMode(false);
    setInitialQuickReviewRisks({ red: [], amber: [] });
    setQuickReviewBaselineCaptured(false);

    const banner = $('quickReviewBanner');
    if (banner) banner.style.display = 'none';

    document.querySelectorAll('[data-hidden-by-quick-review]').forEach(section => {
        section.style.display = '';
        section.removeAttribute('data-hidden-by-quick-review');
    });

    document.querySelectorAll('.review-badge').forEach(badge => badge.remove());

    document.querySelectorAll('.nav-item').forEach(item => {
        item.style.opacity = '';
        item.style.pointerEvents = '';
    });

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

    const prevCatText = $('prevCategoryText');
    const timeText = $('timeOnWardText');

    if (prevCatText) {
        const riskList = previousRisks.length > 0 ? ` (${previousRisks.join(', ')})` : '';
        prevCatText.textContent = categoryText + riskList;
    }
    if (timeText) timeText.textContent = `${Math.round(hoursOnWard)}h`;

    prompt.style.display = 'block';

    setTimeout(() => {
        prompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
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
