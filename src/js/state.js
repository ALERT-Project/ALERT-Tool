import { STORAGE_KEY, UNDO_KEY, ACCORDION_KEY, staticInputs, segmentedInputs, toggleInputs, selectInputs, deviceTypes } from './config.js';
import { $ } from './utils.js';
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

    ['chk_medical_rounding', 'chk_discharge_alert', 'chk_continue_alert', 'chk_use_mods', 'chk_bloods_nil_sig'].forEach(id => {
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
            }
            if (id === 'neuroType') $('neuro_gate_content').style.display = 'block';
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

    ['chk_medical_rounding', 'chk_discharge_alert', 'chk_continue_alert', 'chk_use_mods', 'chk_bloods_nil_sig'].forEach(id => {
        const el = $(id);
        if (el && state[id] !== undefined) el.checked = state[id];
    });

    if (state['chk_use_mods']) $('mods_inputs').style.display = 'block';

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
        if (state[group.id]) group.querySelector(`.trend-btn[data-value="${state[group.id]}"]`)?.classList.add('active');
    });

    toggleOxyFields();
    toggleInfusionsBox();
}
