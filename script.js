/* =========================================
   ALERT Nursing Risk Assessment Tool v7.7
   Logic Layer - Full File with Manual Edit Protection
   ========================================= */

/* --- 1. CONFIGURATION & STATE --- */
let isManuallyEdited = false; // Global flag for manual edits

const $ = id => document.getElementById(id);
const debounce = (fn, wait = 350) => {
    let t;
    return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, a), wait);
    };
};
const num = v => {
    const x = parseFloat(v);
    return isNaN(x) ? null : x;
};

const STORAGE_KEY = 'alertToolData_v7_7';
const ACCORDION_KEY = 'alertToolAccordions_v7_7';
const UNDO_KEY = 'alertToolUndo_v7_7';

window.prevBloods = {};

const normalRanges = {
    wcc: { low: 4, high: 11 },
    crp: { low: 0, high: 5 },
    neut: { low: 1.5, high: 7.5 },
    lymph: { low: 1.0, high: 4.0 },
    hb: { low: 115, high: 165 },
    plts: { low: 150, high: 400 },
    k: { low: 3.5, high: 5.2 },
    na: { low: 135, high: 145 },
    cr_review: { low: 50, high: 98 },
    mg: { low: 0.7, high: 1.1 },
    alb: { low: 35, high: 50 },
    lac_review: { low: 0.5, high: 2.0 },
    phos: { low: 0.8, high: 1.5 },
    bili: { low: 0, high: 20 },
    alt: { low: 0, high: 40 },
    inr: { low: 0.9, high: 1.2 },
    aptt: { low: 25, high: 38 }
};

const comorbMap = {
    'comorb_copd': 'COPD',
    'comorb_asthma': 'Asthma',
    'comorb_hf': 'Active Heart Failure',
    'comorb_esrd': 'ESRD',
    'comorb_dialysis': 'Dialysis',
    'comorb_diabetes': 'Diabetes',
    'comorb_cirrhosis': 'Cirrhosis',
    'comorb_malignancy': 'Active malignancy',
    'comorb_immuno': 'Immunosuppression',
    'comorb_other': 'Other'
};

const staticInputs = [
    'reviewTime', 'ptName', 'ptMrn', 'ptAge', 'ptWeight', 'ptWard', 'ptBed', 'ptWardOther', 'ptAdmissionReason', 'icuSummary', 'icuLos', 'stepdownDate',
    'npFlow', 'hfnpFio2', 'hfnpFlow', 'nivFio2', 'nivPeep', 'nivPs', 'override', 'overrideNote',
    'trache_details_note', 'mods_score', 'mods_details', 'airway_a', 'b_rr', 'b_spo2', 'b_device', 'b_wob',
    'c_hr', 'c_hr_rhythm', 'c_nibp', 'c_cr', 'c_perf', 'd_alert', 'd_pain', 'e_temp', 'e_bsl', 'e_uop', 'atoe_adds',
    'ae_mobility', 'ae_diet', 'ae_bowels', 'bowel_date',
    'bl_wcc', 'bl_crp', 'bl_neut', 'bl_lymph', 'bl_hb', 'bl_plts', 'bl_k', 'bl_na',
    'bl_cr_review', 'bl_mg', 'bl_alb', 'bl_lac_review', 'bl_phos',
    'bl_bili', 'bl_alt', 'bl_inr', 'bl_aptt',
    'elec_replace_note', 'goc_note', 'allergies_note', 'pics_note', 'context_other_note', 'pmh_note',
    'adds', 'lactate', 'hb', 'wcc', 'crp', 'neut', 'lymph', 'infusions_note',
    'dyspneaConcern_note', 'renal_note', 'infection_note',
    'electrolyteConcern_note', 'neuroType_note', 
    'after_hours_note', 'pressors_note', 'immobility_note', 'comorb_other_note',
    'unsuitable_note', 'pressor_ceased_time', 'pressor_recent_other_note', 'hac_note'
];

const segmentedInputs = [
    'hb_dropping', 'after_hours', 'hist_o2', 'intubated',
    'resp_concern', 'renal', 'immobility', 'infection', 'new_bloods_ordered',
    'neuro_gate', 'electrolyte_gate', 'pressors', 'hac',
    'stepdown_suitable',
    'renal_chronic', 'renal_chronic_bloods', 
    'infection_downtrend', 'infection_downtrend_bloods',
    'dialysis_type' // New input
];

const toggleInputs = [
    'comorb_copd', 'comorb_asthma', 'comorb_hf', 'comorb_esrd', 'comorb_dialysis',
    'comorb_diabetes', 'comorb_cirrhosis', 'comorb_malignancy', 'comorb_immuno', 'comorb_other',
    'resp_tachypnea', 'resp_rapid_wean',
    'renal_oliguria', 'renal_anuria', 'renal_fluid', 'renal_oedema', 'renal_dysfunction', 'renal_dialysis', 'renal_dehydrated',
    'chk_aperients',
    'pressor_recent_norad', 'pressor_recent_met', 'pressor_recent_gtn', 'pressor_recent_dob', 'pressor_recent_mid', 'pressor_recent_other',
    'pressor_current_mid', 'pressor_current_other'
];

const selectInputs = [
    'oxMod', 'dyspneaConcern', 'neuroConcern', 'neuroType', 'electrolyteConcern', 'stepdownTime',
    'tracheType', 'tracheStatus', 'intubatedReason'
];

const deviceTypes = ['CVC', 'PICC', 'Other CVAD', 'PIVC', 'Arterial Line', 'Enteral Tube', 'IDC', 'Pacing Wire', 'Drain', 'Wound', 'Other Device'];

/* --- 2. UTILITY FUNCTIONS --- */
function nowTimeStr() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function todayDateStr() { const d = new Date(); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }
function formatDateDDMMYYYY(isoStr) {
    if(!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}/${m}/${y}`;
}

function lower(str) {
    if(!str) return '';
    if(/^[0-9]/.test(str) || /^[A-Z]{2}/.test(str) || /^[A-Z][0-9]/.test(str)) return str;
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function joinGrammatically(parts) {
    if(!parts || parts.length === 0) return '';
    if(parts.length === 1) return parts[0];
    const [first, ...rest] = parts;
    const procRest = rest.map(s => lower(s));
    return [first, ...procRest].join(', ');
}

function showToast(msg, timeout = 2500) {
    const t = $('toast');
    if (t) {
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), timeout);
    }
}

function saveState(instantly = false) {
    const state = getState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem('alertToolLastSaved_v7_7', new Date().toISOString());
    updateLastSaved();
}

function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
}

function updateLastSaved() {
    const iso = localStorage.getItem('alertToolLastSaved_v7_7');
    const el = $('lastSaved');
    if (el) el.textContent = iso ? 'Last saved: ' + new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Last saved: --:--';
}

function pushUndo(snapshot) { localStorage.setItem(UNDO_KEY, JSON.stringify({ snapshot, created: Date.now() })); }

/* --- 3. DOM STATE MAPPING --- */
function getState() {
    const state = {};
    staticInputs.forEach(id => { const el = $(id); if (el) state[id] = el.value; });

    segmentedInputs.forEach(id => {
        const group = $(`seg_${id}`);
        const active = group?.querySelector('.seg-btn.active');
        state[id] = active ? (active.dataset.value === "true" || active.dataset.value) : null;
        // Handle boolean vs string values for segmentation
        if(active && (active.dataset.value === "true" || active.dataset.value === "false")) {
            state[id] = (active.dataset.value === "true");
        }
    });

    toggleInputs.forEach(id => {
        const el = $(`toggle_${id}`);
        if (!el && id === 'chk_aperients') { const chk = $('chk_aperients'); if(chk) state[id] = chk.checked; return; }
        state[id] = el ? (el.dataset.value === 'true') : false;
    });

    selectInputs.forEach(id => {
        const group = $(id);
        state[id] = group?.querySelector('.select-btn.active')?.dataset.value || '';
    });

    state['reviewType'] = document.querySelector('input[name="reviewType"]:checked')?.value || 'post';
    state['clinicianRole'] = document.querySelector('input[name="clinicianRole"]:checked')?.value || 'ALERT CNS';

    ['chk_medical_rounding', 'chk_discharge_alert', 'chk_use_mods'].forEach(id => {
        const el = $(id);
        if(el) state[id] = el.checked;
    });

    state['bowel_mode'] = document.querySelector('#panel_ae .quick-select.active')?.id || null;

    state.devices = {};
    deviceTypes.forEach(type => {
        state.devices[type] = Array.from(document.querySelectorAll(`.device-entry[data-type="${type}"] textarea`)).map(ta => ta.value);
    });

    document.querySelectorAll('.trend-buttons').forEach(group => {
        state[group.id] = group.querySelector('.trend-btn.active')?.dataset.value || '';
    });

    return state;
}

function restoreState(state) {
    if (!state) return;
    staticInputs.forEach(id => { const el = $(id); if (el && state[id] !== undefined) el.value = state[id]; });

    segmentedInputs.forEach(id => {
        const group = $(`seg_${id}`);
        if (!group) return;
        group.querySelectorAll('.seg-btn').forEach(btn => btn.classList.remove('active'));
        
        let valStr = String(state[id]);
        if(state[id] === true) valStr = "true";
        if(state[id] === false) valStr = "false";
        
        const target = group.querySelector(`.seg-btn[data-value="${valStr}"]`);
        if(target) target.classList.add('active');
        
        handleSegmentClick(id, valStr);
    });

    toggleInputs.forEach(id => {
        if (id === 'chk_aperients') { const chk = $('chk_aperients'); if(chk) chk.checked = state[id]; return; }
        const el = $(`toggle_${id}`);
        if (el) {
            el.dataset.value = state[id] ? 'true' : 'false';
            el.classList.toggle('active', !!state[id]);
            if (id === 'comorb_other') $('comorb_other_note_wrapper').style.display = state[id] ? 'block' : 'none';
            if (id === 'pressor_recent_other') $('pressor_recent_other_note_wrapper').style.display = state[id] ? 'block' : 'none';
            if (id === 'renal_dialysis') $('dialysis_type_wrapper').style.display = state[id] ? 'block' : 'none';
        }
    });

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
        if(r) r.checked = true;
        updateWardOptions();
        updateReviewTypeVisibility();
    }
    if (state['clinicianRole']) {
        const r = document.querySelector(`input[name="clinicianRole"][value="${state['clinicianRole']}"]`);
        if(r) r.checked = true;
    }

    ['chk_medical_rounding', 'chk_discharge_alert', 'chk_use_mods'].forEach(id => {
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
        if(sel) sel.value = state.ptWard;
    }
    updateWardOtherVisibility();

    const devCont = $('devices-container');
    if(devCont) {
        devCont.innerHTML = '';
        if (state.devices) {
            deviceTypes.forEach(type => {
                state.devices[type]?.forEach(v => createDeviceEntry(type, v));
            });
        }
    }

    document.querySelectorAll('.trend-buttons').forEach(group => {
        if (state[group.id]) group.querySelector(`.trend-btn[data-value="${state[group.id]}"]`)?.classList.add('active');
    });

    toggleOxyFields();
    toggleInfusionsBox();
}

/* --- 4. INTERACTIVITY & EVENTS --- */
function initialize() {
    updateLastSaved();
    const compute = debounce(() => { computeAll(); checkBloodRanges(); saveState(true); }, 500);

    window.addDevice = (type, val) => { createDeviceEntry(type, val); compute(); };
    
    // --- Manual Edit Protection ---
    const sumBox = $('summary');
    if(sumBox) {
        sumBox.addEventListener('input', () => {
            if(!sumBox.classList.contains('script-updating')) {
                isManuallyEdited = true;
                const warn = $('manual_edit_warning');
                if(warn) warn.style.display = 'flex';
            }
        });
    }

    // Force Update Button
    const forceBtn = $('btn_force_update');
    if(forceBtn) {
        forceBtn.addEventListener('click', () => {
            if(confirm("This will overwrite your manual edits with the latest auto-generated data. Continue?")) {
                isManuallyEdited = false;
                $('manual_edit_warning').style.display = 'none';
                computeAll();
            }
        });
    }

    // --- Discharge Prompt Listeners ---
    const btnYes = $('btn_discharge_yes');
    if (btnYes) {
        btnYes.addEventListener('click', (e) => {
            e.preventDefault(); 
            const chk = $('chk_discharge_alert');
            if (chk) {
                chk.checked = true;
                compute(); 
                showToast("Patient marked for discharge", 1500);
            }
        });
    }
    
    const btnNo = $('btn_discharge_no');
    if (btnNo) {
        btnNo.addEventListener('click', (e) => {
            e.preventDefault();
            window.dismissedDischarge = true;
            compute(); 
        });
    }

    // --- Bilateral Sync for Segmented Controls ---
    function syncSegments(id1, id2, type) {
        const g1 = $(id1);
        const g2 = $(id2);
        if(!g1 || !g2) return;

        [g1, g2].forEach(group => {
            group.querySelectorAll('.seg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    setTimeout(() => {
                        const val = btn.dataset.value;
                        const otherGroup = (group === g1) ? g2 : g1;
                        otherGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
                        otherGroup.querySelector(`.seg-btn[data-value="${val}"]`)?.classList.add('active');
                        
                        if(val === "true") {
                            if(type === 'renal') showToast("Mitigation applied", 1500);
                            if(type === 'infection') showToast("Mitigation applied", 1500);
                        }
                        compute();
                    }, 50);
                });
            });
        });
    }
    
    syncSegments('seg_renal_chronic', 'seg_renal_chronic_bloods', 'renal');
    syncSegments('seg_infection_downtrend', 'seg_infection_downtrend_bloods', 'infection');

    document.addEventListener('input', (e) => {
        if(e.target && e.target.classList.contains('scraped-data')) {
            e.target.classList.remove('scraped-data');
        }
    });

    const timeBox = $('reviewTime');
    if (timeBox && !timeBox.value) {
        const now = new Date();
        const m = now.getMinutes();
        const rounded = Math.round(m / 15) * 15;
        now.setMinutes(rounded);
        timeBox.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function syncInputs(id1, id2) {
        const el1 = $(id1), el2 = $(id2);
        if (!el1 || !el2) return;
        el1.addEventListener('input', () => { el2.value = el1.value; compute(); });
        el2.addEventListener('input', () => { el1.value = el2.value; compute(); });
    }

    syncInputs('adds', 'atoe_adds');
    syncInputs('lactate', 'bl_lac_review');
    syncInputs('hb', 'bl_hb');
    syncInputs('wcc', 'bl_wcc');
    syncInputs('crp', 'bl_crp');
    syncInputs('neut', 'bl_neut');
    syncInputs('lymph', 'bl_lymph');

    // === AUTO-RISK LISTENERS ===
    const rrInput = $('b_rr');
    if(rrInput) {
        rrInput.addEventListener('input', debounce(() => {
            const val = parseFloat(rrInput.value);
            if(!isNaN(val) && val > 20) {
                const tachToggle = $('toggle_resp_tachypnea');
                if(tachToggle && tachToggle.dataset.value === 'false') {
                    tachToggle.click();
                    showToast('Auto-selected Tachypnea (>20)', 1500);
                }
            }
        }, 500));
    }

    document.querySelectorAll('.risk-trigger[data-risk="renal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const renalSeg = $('seg_renal');
            const yesBtn = renalSeg.querySelector('.seg-btn[data-value="true"]');
            if(yesBtn && !yesBtn.classList.contains('active')) yesBtn.click();
            const btnVal = btn.dataset.value; 
            if((btnVal === "Oliguric" || btnVal.includes("<0.5")) && $('toggle_renal_oliguria').dataset.value === "false") $('toggle_renal_oliguria').click();
            if(btnVal === "Anuric" && $('toggle_renal_anuria').dataset.value === "false") $('toggle_renal_anuria').click();
        });
    });

    const tempInput = $('e_temp');
    if(tempInput) {
        tempInput.addEventListener('input', debounce(() => {
            const t = parseFloat(tempInput.value);
            if(!isNaN(t) && t > 38.0) {
                const infSeg = $('seg_infection');
                const yesBtn = infSeg.querySelector('.seg-btn[data-value="true"]');
                if(yesBtn && !yesBtn.classList.contains('active')) yesBtn.click();
            }
        }, 600));
    }

    const neuroInput = $('d_alert');
    if(neuroInput) {
        neuroInput.addEventListener('input', debounce((e) => {
            const val = e.target.value.toLowerCase();
            const keywords = ['confus', 'drows', 'agitat', 'delirium', 'somnolent', 'gcs 14', 'gcs 13', 'gcs 12', 'gcs 11', 'gcs 10', 'gcs 9', 'gcs 8'];
            const isGcsLow = (val.match(/gcs\s*(\d+)/i)?.[1] || 15) < 15;
            
            if(keywords.some(k => val.includes(k)) || isGcsLow) {
                 const neuroSeg = $('seg_neuro_gate');
                 const yesBtn = neuroSeg.querySelector('.seg-btn[data-value="true"]');
                 if(yesBtn && !yesBtn.classList.contains('active')) yesBtn.click();
            }
        }, 800));
    }

    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if(targetEl && targetEl.classList.contains('accordion-wrapper')) {
                const panel = targetEl.querySelector('.panel');
                if(panel && panel.style.display !== 'block') {
                    panel.style.display = 'block';
                    targetEl.querySelector('.icon').textContent = '[-]';
                }
            }
        });
    });

    const weightInput = $('ptWeight');
    if(weightInput) {
        weightInput.addEventListener('input', () => {
            const w = parseFloat(weightInput.value);
            const targetEl = $('target_uop_display');
            if(w && !isNaN(w)) {
                const target = (w * 0.5).toFixed(1);
                targetEl.textContent = `Target: >${target} ml/hr`;
                targetEl.style.display = 'block';
            } else {
                targetEl.style.display = 'none';
            }
        });
    }

    document.querySelectorAll('.time-set-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const time = btn.dataset.time;
            const input = $('pressor_ceased_time');
            if(input) {
                input.value = time;
                input.dispatchEvent(new Event('input')); 
            }
        });
    });

    $('pressor_ceased_time')?.addEventListener('input', compute);
    $('pressor_recent_other_note')?.addEventListener('input', compute);

    document.querySelectorAll('.quick-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if(btn.classList.contains('risk-trigger') || btn.classList.contains('safe-trigger')) {
                 const targetId = btn.dataset.target;
                 const target = $(targetId);
                 if(target) {
                     if(btn.dataset.stack === "true") {
                         const current = target.value;
                         if(!current.includes(btn.dataset.value)) target.value = current ? `${current}, ${btn.dataset.value}` : btn.dataset.value;
                     } else { target.value = btn.dataset.value; }
                     target.dispatchEvent(new Event('input'));
                 }
                 return;
            }
            const targetId = btn.dataset.target;
            if (targetId) {
                const target = $(targetId);
                if (target) {
                    const val = btn.dataset.value;
                    if (btn.dataset.stack === "true") {
                        if (!target.value.includes(val)) target.value = target.value ? `${target.value}, ${val}` : val;
                    } else { target.value = val; }
                    target.dispatchEvent(new Event('input'));
                    compute();
                }
            } else if (btn.id === 'btn_bo' || btn.id === 'btn_bno') {
                const other = btn.id === 'btn_bno' ? $('btn_bo') : $('btn_bno');
                const isActive = btn.classList.contains('active');
                if (isActive) {
                    btn.classList.remove('active');
                    toggleBowelDate(null);
                } else {
                    btn.classList.add('active');
                    other.classList.remove('active');
                    toggleBowelDate(btn.id);
                }
                compute();
            }
        });
    });

    function setDateInput(id, offsetDays) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const val = `${year}-${month}-${day}`;
        const el = $(id);
        if (el) {
            el.value = val;
            el.dispatchEvent(new Event('input'));
            compute();
        }
    }

    $('btn_stepdown_today')?.addEventListener('click', () => setDateInput('stepdownDate', 0));
    $('btn_stepdown_yesterday')?.addEventListener('click', () => setDateInput('stepdownDate', -1));
    $('btn_bowel_today')?.addEventListener('click', () => setDateInput('bowel_date', 0));
    $('btn_bowel_yesterday')?.addEventListener('click', () => setDateInput('bowel_date', -1));

    document.querySelectorAll('.segmented-group').forEach(group => {
        group.querySelectorAll('.seg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.value;
                const id = group.id.replace('seg_', '');
                const wasActive = btn.classList.contains('active');
                group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
                if (wasActive) {
                    handleSegmentClick(id, null);
                } else {
                    btn.classList.add('active');
                    handleSegmentClick(id, val);
                }
                compute();
            });
        });
    });

    document.querySelectorAll('.toggle-label').forEach(el => {
        el.addEventListener('click', () => {
            const isOn = el.dataset.value === 'true';
            el.dataset.value = isOn ? 'false' : 'true';
            el.classList.toggle('active', !isOn);
            
            // Toggle Logic for Visibility
            if (el.id === 'toggle_comorb_other') $('comorb_other_note_wrapper').style.display = !isOn ? 'block' : 'none';
            if (el.id === 'toggle_pressor_recent_other') $('pressor_recent_other_note_wrapper').style.display = !isOn ? 'block' : 'none';
            if (el.id === 'toggle_renal_dialysis') $('dialysis_type_wrapper').style.display = !isOn ? 'block' : 'none';
            
            compute();
        });
    });

    document.querySelectorAll('.button-group').forEach(group => {
        group.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.select-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (group.id === 'oxMod') {
                    const devEl = $('b_device');
                    if(devEl) devEl.dataset.manual = 'false';
                    toggleOxyFields();
                }
                
                if (group.id === 'neuroType') $('neuro_gate_content').style.display = 'block'; 
                compute();
            });
        });
    });

    staticInputs.forEach(id => { const el = $(id); if (el) el.addEventListener('input', compute); });

    $('chk_use_mods')?.addEventListener('change', () => { $('mods_inputs').style.display = $('chk_use_mods').checked ? 'block' : 'none'; compute(); });
    $('chk_aperients')?.addEventListener('change', compute);
    $('comorb_other_note')?.addEventListener('input', compute);

    $('chk_discharge_alert')?.addEventListener('change', compute);
    $('chk_medical_rounding')?.addEventListener('change', compute);

    document.querySelectorAll('input[name="reviewType"]').forEach(r => r.addEventListener('change', () => {
        updateWardOptions();
        toggleInfusionsBox();
        updateReviewTypeVisibility();
        compute();
    }));
    $('ptWard')?.addEventListener('change', () => { updateWardOtherVisibility(); compute(); });

    $('clearDataBtnTop')?.addEventListener('click', clearData);
    $('footerClear')?.addEventListener('click', clearData);
    $('footerCopy')?.addEventListener('click', () => {
        const text = $('summary').value;
        if (!text) { showToast('Nothing to copy', 1500); return; }
        navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard', 1500));
    });
    $('btnCopySummaryMain')?.addEventListener('click', () => {
        const text = $('summary').value;
        if (!text) { showToast('Nothing to copy', 1500); return; }
        navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard', 1500));
    });


    $('btnUseSameBloods')?.addEventListener('click', () => {
         const blMap = { 
            'lac_review': 'bl_lac_review', 'hb': 'bl_hb', 'wcc': 'bl_wcc', 'cr_review': 'bl_cr_review', 
            'k': 'bl_k', 'na': 'bl_na', 'mg': 'bl_mg', 'phos': 'bl_phos', 'plts': 'bl_plts', 
            'alb': 'bl_alb', 'neut': 'bl_neut', 'lymph': 'bl_lymph', 'crp': 'bl_crp',
            'bili': 'bl_bili', 'alt': 'bl_alt', 'inr': 'bl_inr', 'aptt': 'bl_aptt' 
        };
        if (window.prevBloods) {
            let count = 0;
            Object.keys(window.prevBloods).forEach(key => {
                const targetId = blMap[key];
                const val = window.prevBloods[key];
                if (targetId && val && $(targetId)) {
                    $(targetId).value = val;
                    $(targetId).classList.add('scraped-data');
                    count++;
                }
            });
            if(count > 0) {
                const ev = new Event('input');
                Object.values(blMap).forEach(id => $(id)?.dispatchEvent(ev));
                showToast(`Filled ${count} fields`, 1500);
            } else {
                showToast("No previous bloods found", 1500);
            }
        }
    });

    document.querySelectorAll('.trend-buttons').forEach(group => {
        ['↑', '↓', '→'].forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'trend-btn'; btn.textContent = t; btn.dataset.value = t;
            btn.addEventListener('click', () => {
                const was = btn.classList.contains('active');
                group.querySelectorAll('.trend-btn').forEach(b => b.classList.remove('active'));
                if (!was) btn.classList.add('active');
                compute();
            });
            group.appendChild(btn);
        });
    });

    document.querySelectorAll('.accordion-wrapper').forEach(w => {
        w.querySelector('.accordion').addEventListener('click', () => {
            const panel = w.querySelector('.panel');
            const isOpen = panel.style.display === 'block';
            panel.style.display = isOpen ? 'none' : 'block';
            w.querySelector('.icon').textContent = isOpen ? '[+]' : '[-]';
            const map = JSON.parse(localStorage.getItem(ACCORDION_KEY) || '{}');
            map[w.dataset.accordionId] = !isOpen;
            localStorage.setItem(ACCORDION_KEY, JSON.stringify(map));
        });
    });

    document.querySelectorAll('.btn[data-device-type]').forEach(btn => {
        btn.addEventListener('click', () => { createDeviceEntry(btn.dataset.deviceType); compute(); });
    });

    $('darkToggle')?.addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('alertToolDark', document.body.classList.contains('dark') ? '1' : '0'); });
    if (localStorage.getItem('alertToolDark') === '1') document.body.classList.add('dark');

    ['red', 'amber', 'clear'].forEach(t => {
        const btn = $(`override_${t}`);
        if(btn) btn.addEventListener('click', () => {
            $('override').value = t === 'clear' ? 'none' : t;
            $('override_reason_box').style.display = t === 'clear' ? 'none' : 'block';
            $('override_amber').classList.toggle('active', t === 'amber');
            $('override_red').classList.toggle('active', t === 'red');
            compute();
        });
    });

    updateWardOptions();
    const saved = loadState();
    if (saved) restoreState(saved);
    updateReviewTypeVisibility();

    const accMap = JSON.parse(localStorage.getItem(ACCORDION_KEY) || '{}');
    document.querySelectorAll('.accordion-wrapper').forEach(w => {
        if (accMap[w.dataset.accordionId]) { w.querySelector('.panel').style.display = 'block'; w.querySelector('.icon').textContent = '[-]'; }
    });

    compute();
    checkBloodRanges();
}

/* --- 5. UI LOGIC HELPERS --- */
function checkBloodRanges() {
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

function handleSegmentClick(id, value) {
    const map = {
        'resp_concern': 'resp_gate_content',
        'renal': 'renal_gate_content',
        'infection': 'infection_gate_content', 
        'neuro_gate': 'neuro_gate_content',
        'electrolyte_gate': 'electrolyte_gate_content',
        'pressors': 'pressor_gate_content', 
        'immobility': 'immobility_note_wrapper',
        'after_hours': 'after_hours_note_wrapper',
        'hac': 'hac_content',
        'stepdown_suitable': 'unsuitable_note_wrapper'
    };

    if (map[id]) {
        const el = $(map[id]);
        if (el) {
             if(id === 'stepdown_suitable') {
                 el.style.display = (value === "false") ? 'block' : 'none';
             } else {
                 el.style.display = (value === "true") ? 'block' : 'none';
             }
        }
    }
}

function updateWardOptions() {
    const type = document.querySelector('input[name="reviewType"]:checked')?.value || 'post';
    const sel = $('ptWard');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="" selected disabled>Select Ward...</option>';
    const opts = (type === 'pre')
        ? ['ICU Pod 1', 'ICU Pod 2', 'ICU Pod 3', 'ICU Pod 4']
        : ['3A', '3B', '3C', '3D', '4A', '4B', '4C', '4D', '5A', '5B', '5C', '5D', '6A', '6B', '6C', '6D', '7A', '7B', '7C', '7D', 'SRS2A', 'SRS1A', 'SRSA', 'SRSB', 'Medihotel', 'Short Stay', 'Transit Lounge', 'Mental Health', 'CCU'];
    [...opts, 'Other'].forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        if (currentVal === o) opt.selected = true;
        sel.appendChild(opt);
    });
    updateWardOtherVisibility();
}

function updateReviewTypeVisibility() {
    const type = document.querySelector('input[name="reviewType"]:checked')?.value || 'post';
    const dis = $('chk_discharge_wrapper'); if(dis) dis.style.display = (type === 'post') ? 'block' : 'none';
    const uns = $('chk_unsuitable_wrapper'); if(uns) uns.style.display = (type === 'pre') ? 'block' : 'none';
    const icu = $('icu_summary_wrapper'); if(icu) icu.style.display = (type === 'pre') ? 'block' : 'none';
    const dateWrapper = $('stepdown_date_wrapper'); if (dateWrapper) dateWrapper.style.display = (type === 'post') ? 'contents' : 'none';
    
    if (type === 'pre') { const c = $('chk_discharge_alert'); if(c) c.checked = false; }
}

function updateWardOtherVisibility() { 
    const w = $('ptWardOtherWrapper');
    const v = $('ptWard').value;
    if(w) w.style.display = (v === 'Other') ? 'block' : 'none'; 
}

function createDeviceEntry(type, val = '') {
    const c = $('devices-container');
    if(!c) return;
    const div = document.createElement('div');
    div.className = 'device-entry';
    div.dataset.type = type;
    div.innerHTML = `<label>${type}</label><div style="display:flex; gap:8px;"><textarea placeholder="Enter details...">${val}</textarea><div class="remove-entry">X</div></div>`;
    div.querySelector('.remove-entry').addEventListener('click', () => { div.remove(); debounce(() => saveState(true), 500)(); });
    div.querySelector('textarea').addEventListener('input', debounce(() => saveState(true), 500));
    c.appendChild(div);
}

function toggleOxyFields() {
    const mod = $('oxMod').querySelector('.select-btn.active')?.dataset.value || 'RA';
    const show = (cls) => document.querySelectorAll(cls).forEach(e => e.style.display = 'block');
    const hide = (cls) => document.querySelectorAll(cls).forEach(e => e.style.display = 'none');
    hide('.npOnly'); hide('.hfnpOnly'); hide('.nivOnly'); hide('.tracheOnly');
    if (mod === 'NP') show('.npOnly');
    if (mod === 'HFNP') show('.hfnpOnly');
    if (mod === 'NIV') show('.nivOnly');
    if (mod === 'Trache') show('.tracheOnly');
}

function toggleInfusionsBox() {
    const type = document.querySelector('input[name="reviewType"]:checked')?.value || 'post';
    const w = $('infusions_wrapper');
    if(w) w.style.display = (type === 'pre') ? 'grid' : 'none';
}

function toggleBowelDate(mode) {
    const w = $('bowel_date_wrapper');
    if(w) w.style.display = mode ? 'block' : 'none';
    if (mode) {
        const l = $('bowel_date_label');
        if(l) l.textContent = (mode === 'btn_bno') ? 'Date Last Opened' : 'Date BO';
        const ap = $('aperients_wrapper');
        if(ap) ap.style.display = (mode === 'btn_bno') ? 'block' : 'none';
    }
}

function clearData() {
    if (!confirm("Are you sure you want to clear all data?")) return;
    pushUndo(getState());
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.accordion .icon').forEach(i => i.textContent = '[+]');
    localStorage.removeItem(ACCORDION_KEY);

    staticInputs.forEach(id => { 
        if ($(id)) {
            $(id).value = ''; 
            $(id).classList.remove('scraped-data'); 
        }
    });

    const impTxt = $('importText'); if(impTxt) impTxt.value = '';

    document.querySelectorAll('.active').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('input[type="checkbox"]').forEach(e => e.checked = false);
    document.querySelectorAll('.toggle-label').forEach(e => e.dataset.value = 'false');
    document.querySelectorAll('.blood-abnormal').forEach(e => e.classList.remove('blood-abnormal'));

    const dc = $('devices-container'); if(dc) dc.innerHTML = '';
    const sc = $('selected_comorbs_display'); 
    if(sc) { sc.innerHTML = ''; sc.style.display = 'none'; }
    document.querySelectorAll('.prev-datum').forEach(el => el.textContent = '');
    const pb = $('prevRisksBox'); if(pb) pb.style.display = 'none';
    
    const gatesToHide = [
        '#resp_gate_content', '#renal_gate_content', '#neuro_gate_content', '#electrolyte_gate_content', '#infection_gate_content', '#pressor_gate_content', '#hac_content',
        '#immobility_note_wrapper', '#after_hours_note_wrapper', '#comorb_other_note_wrapper', '#unsuitable_note_wrapper', '#override_reason_box', '#sub_intubated_reason', 
        '#pressor_recent_other_note_wrapper', '#dialysis_type_wrapper'
    ];
    gatesToHide.forEach(sel => { const el = document.querySelector(sel); if(el) el.style.display = 'none'; });
    
    document.querySelectorAll('.concern-note').forEach(e => {
        if (!['immobility_note_wrapper', 'after_hours_note_wrapper', 'comorb_other_note_wrapper', 'unsuitable_note_wrapper', 'pressor_recent_other_note_wrapper'].includes(e.id)) {
            e.style.display = 'block';
        }
    });
    
    // Reset manual edits flag
    isManuallyEdited = false; 
    $('manual_edit_warning').style.display = 'none';
    window.dismissedDischarge = false;

    const now = new Date();
    const m = now.getMinutes();
    const rounded = Math.round(m / 15) * 15;
    now.setMinutes(rounded);
    const tb = $('reviewTime'); if(tb) tb.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const p = document.querySelector('input[value="post"]'); if(p) p.checked = true;
    updateWardOptions();
    updateReviewTypeVisibility();
    const listEl = $('flagList'); if(listEl) listEl.innerHTML = '';
    const sum = $('summary'); if(sum) sum.value = '';

    $('override_reason_box').style.display = 'none';
    $('override_amber').classList.remove('active');
    $('override_red').classList.remove('active');
    
    const resetEv = new CustomEvent('resetAddsCalc');
    document.dispatchEvent(resetEv);

    computeAll(); 
    saveState(true);
    showToast("Data cleared", 2000);
}

function calculateWardTime(dateStr, timeOfDay, isPre) {
    if (isPre) return { hours: 0, text: '(Pre-Stepdown)' };
    if (!dateStr) return { hours: 0, text: '' };
    
    // Default to Midday (12) if captured time logic isn't perfect, but we use strict bands here
    const h = { 'Morning': 9, 'Afternoon': 15, 'Evening': 18, 'Night': 21 }[timeOfDay] || 12;
    
    const [y, m, d] = dateStr.split('-');
    const stepObj = new Date(y, m - 1, d, h);
    const diffHours = (new Date() - stepObj) / 3600000; 

    if (diffHours < 0) return { hours: diffHours, text: "(Planned Stepdown)" };

    if (diffHours < 12) {
        return { hours: diffHours, text: `${Math.round(diffHours)} hours` };
    } else if (diffHours <= 48) {
        const halfDays = Math.round((diffHours / 24) * 2) / 2;
        return { hours: diffHours, text: `${halfDays} days` };
    } else {
        const days = Math.round(diffHours / 24);
        return { hours: diffHours, text: `${days} days` };
    }
}

/* --- 6. CORE LOGIC ENGINE --- */
function computeAll() {
    try {
        const s = getState();
        const red = [], amber = [];
        const suppressedRisks = [];
        const flagged = { red: [], amber: [] };

        const add = (list, txt, id, type, noteValue = null) => {
            let finalTxt = txt;
            if (noteValue && noteValue.trim()) finalTxt = `${txt} (${noteValue.trim()})`;
            list.push(finalTxt);
            if (id) flagged[type].push(id);
        };

        const neut = num(s.bl_neut) || num(s.neut);
        const lymph = num(s.bl_lymph) || num(s.lymph);
        const nlrEl = $('nlrCalc');
        if (nlrEl) {
            if (neut > 0 && lymph > 0) {
                const nlr = (neut / lymph).toFixed(2);
                nlrEl.textContent = `NLR: ${nlr}`;
                nlrEl.style.borderColor = (nlr > 10) ? 'var(--red)' : 'var(--line)';
            } else {
                nlrEl.textContent = `NLR: --`;
            }
        }

        const fn = $('footerName'); if(fn) fn.textContent = s.ptName || '--';
        const fl = $('footerLocation'); if(fl) fl.textContent = `${s.ptWard || '--'} ${s.ptBed || ''}`;
        const fa = $('footerAdmission'); if(fa) fa.textContent = s.ptAdmissionReason || '--';

        const isPre = s.reviewType === 'pre';
        const timeData = calculateWardTime(s.stepdownDate, s.stepdownTime, isPre);
        const isRecent = isPre || (timeData.hours < 24);

        const ahWrapper = $('ah_wrapper');
        if(ahWrapper) ahWrapper.style.display = 'block';

        // --- Vasoactive Logic ---
        const timeOffEl = $('pressor_time_off_display');
        const recentKeys = ['pressor_recent_norad', 'pressor_recent_met', 'pressor_recent_gtn', 'pressor_recent_dob', 'pressor_recent_mid', 'pressor_recent_other'];
        const currentKeys = ['pressor_current_mid', 'pressor_current_other'];
        
        let hasRecent = recentKeys.some(k => s[k]);
        let hasCurrent = currentKeys.some(k => s[k]);

        if(timeOffEl) {
            if(hasRecent && s.pressor_ceased_time) {
                 const now = new Date();
                 const [cH, cM] = s.pressor_ceased_time.split(':');
                 const ceasedDate = new Date();
                 ceasedDate.setHours(cH, cM);
                 if(ceasedDate > now) ceasedDate.setDate(ceasedDate.getDate() - 1);
                 const diffMs = now - ceasedDate;
                 const diffHrs = Math.floor(diffMs / 3600000);
                 timeOffEl.textContent = `~${diffHrs} hrs ago`;
            } else {
                 timeOffEl.textContent = '';
            }
        }

        if (hasCurrent || hasRecent) { 
            let details = [];
            currentKeys.forEach(k => { if(s[k]) details.push(k.replace('pressor_current_','').replace('other','Other Vasoactive').replace('mid','Midodrine')); });
            
            if (hasRecent) {
                let recentsList = [];
                recentKeys.forEach(k => { 
                    if(s[k]) {
                         let label = k.replace('pressor_recent_','').replace('norad','Noradrenaline').replace('met','Metaraminol').replace('gtn','GTN').replace('dob','Dobutamine').replace('mid','Midodrine');
                         if(k === 'pressor_recent_other') label = `Other (${s.pressor_recent_other_note || ''})`;
                         recentsList.push(label);
                    }
                });
                let recentPart = "Recent Vasoactive Support (" + recentsList.join('/');
                if (s.pressor_ceased_time) recentPart += ` off at ${s.pressor_ceased_time}`;
                recentPart += ")";
                details.push(recentPart);
            }
            add(amber, details.join(', '), 'seg_pressors', 'amber', s.pressors_note);
        }

        const adds = num(s.adds);
        if (adds !== null) {
            if (adds >= 6) add(red, `Severe physiological instability (ADDS ${adds})`, 'adds', 'red');
            else if (adds >= 4) add(red, `Physiological instability (ADDS ${adds})`, 'adds', 'red');
            else if (adds === 3 && isRecent) add(amber, `Observation required (ADDS 3)`, 'adds', 'amber');
        }

        const hr = num(s.c_hr);
        if (hr) {
            if (hr > 130) add(red, `Signif. Tachycardia (HR ${hr})`, 'c_hr', 'red');
            else if (hr > 110) add(amber, `Tachycardia (HR ${hr})`, 'c_hr', 'amber');
            else if (hr < 40) add(red, `Severe Bradycardia (HR ${hr})`, 'c_hr', 'red');
            else if (hr < 50) add(amber, `Bradycardia (HR ${hr})`, 'c_hr', 'amber');
        }

        const bpStr = s.c_nibp;
        if (bpStr) {
            const sbp = parseFloat(bpStr.split('/')[0]); 
            if (!isNaN(sbp)) {
                if (sbp < 90) add(red, `Hypotension (SBP ${sbp})`, 'c_nibp', 'red');
            }
        }

        const rr = num(s.b_rr);
        if (rr) {
            if (rr > 25) add(red, `Tachypnea (RR ${rr})`, 'b_rr', 'red');
            else if (rr > 20) add(amber, `Mild Tachypnea (RR ${rr})`, 'b_rr', 'amber');
            else if (rr < 8) add(red, `Bradypnea (RR ${rr})`, 'b_rr', 'red');
        }

        const spo2Str = s.b_spo2 ? s.b_spo2.replace('%', '') : '';
        const spo2 = num(spo2Str);
        if (spo2 && spo2 < 88) add(red, `Hypoxia (SpO2 ${spo2}%)`, 'b_spo2', 'red'); 
        
        const temp = num(s.e_temp);
        if (temp) {
            if (temp > 38.5) add(red, `Pyrexia (${temp})`, 'e_temp', 'red');
            else if (temp < 35.5) add(red, `Hypothermia (${temp})`, 'e_temp', 'red');
        }

        const oxDevInput = $('b_device');
        if(oxDevInput && oxDevInput.dataset.manual !== 'true') {
            let devStr = '';
            const mode = s.oxMod;
            if(mode === 'RA') devStr = 'RA';
            else if(mode === 'NP') devStr = `NP ${s.npFlow || ''}L`;
            else if(mode === 'HFNP') devStr = `HFNP ${s.hfnpFio2 || ''}%/${s.hfnpFlow || ''}L`;
            else if(mode === 'NIV') devStr = `NIV ${s.nivFio2 || ''}%`;
            else if(mode === 'Trache') devStr = `Trache (${s.tracheStatus || ''})`;
            if(devStr) oxDevInput.value = devStr;
        }

        if (s.resp_concern === true) {
            let parts = [], hasRed = false;
            if (s.oxMod === 'NP') {
                const flow = num(s.npFlow);
                if (flow >= 3) { parts.push(`high flow NP (${flow}L)`); flagged.red.push('npFlow'); hasRed = true; }
                else if (flow >= 2) { parts.push(`NP flow (${flow}L)`); flagged.amber.push('npFlow'); }
            } else if (s.oxMod === 'HFNP') { parts.push(`HFNP requirement`); flagged.red.push('oxMod'); hasRed = true; }
            else if (s.oxMod === 'NIV') { parts.push(`NIV requirement`); flagged.red.push('oxMod'); hasRed = true; }
            else if (s.oxMod === 'Trache') {
                if (s.tracheStatus === 'New') { parts.push(`new/unstable tracheostomy`); flagged.red.push('tracheStatus'); hasRed = true; }
                else { parts.push(`tracheostomy`); flagged.amber.push('oxMod'); }
            }
            const dysp = s.dyspneaConcern;
            if (dysp === 'severe' || dysp === 'mod') { parts.push(`${dysp} dyspnea`); flagged.red.push('dyspneaConcern'); hasRed = true; }
            else if (dysp === 'mild') { parts.push(`mild dyspnea`); flagged.amber.push('dyspneaConcern'); }
            if (s.resp_tachypnea) { parts.push('tachypnea (>20)'); flagged.red.push('toggle_resp_tachypnea'); hasRed = true; }
            if (s.resp_rapid_wean) { parts.push('rapid O2 wean (<12h)'); flagged.red.push('toggle_resp_rapid_wean'); hasRed = true; }
            
            if (s.hist_o2 === true) { parts.push('recent high O2/NIV Requirement (<12h)'); flagged.red.push('seg_hist_o2'); hasRed = true; }
            
            if (s.intubated === true) {
                const reason = $('intubatedReason')?.querySelector('.active')?.dataset.value;
                if (reason === 'concern') { parts.push('intubated <24h with concerns'); flagged.red.push('seg_intubated'); hasRed = true; }
                else { parts.push('intubated <24h'); flagged.amber.push('seg_intubated'); }
            }
            
            if(s.dyspneaConcern_note && parts.length > 0) {
                 parts[parts.length-1] += ` (${s.dyspneaConcern_note})`;
            }

            if (parts.length > 0) {
                const joined = joinGrammatically(parts);
                const finalTxt = `Respiratory concern - ${joined}`;
                if (hasRed) red.push(finalTxt); else amber.push(finalTxt);
            }
        }

        if (s.after_hours === true) add(amber, 'Discharged after-hours', 'seg_after_hours', 'amber', s.after_hours_note);
        if (s.hac === true) add(amber, 'Hospital Acquired Complication', 'seg_hac', 'amber', s.hac_note);

        if (s.neuro_gate === true) {
            let txt = "Neuro concern";
            const sev = s.neuroConcern;
            if(sev) txt += ` (${sev})`;
            const gcsInput = s.d_alert;
            if(gcsInput && gcsInput.toLowerCase().includes('gcs')) txt += ` - ${gcsInput}`;
            const type = s.neuroType;
            if(type) txt += ` - ${type}`;

            if (sev === 'severe' || sev === 'mod') add(red, txt, 'neuroConcern', 'red', s.neuroType_note);
            else add(amber, txt, 'neuroConcern', 'amber', s.neuroType_note);
        }

        const k = num(s.bl_k);
        if (s.electrolyte_gate === true || (k && (k < 2.5 || k > 6.0))) {
            let msg = "Electrolyte concern", isRed = false;
            if (k) {
                if (k > 6.0) { msg += ` (Hyperkalemia ${k})`; isRed = true; }
                else if (k < 2.5) { msg += ` (Hypokalemia ${k})`; isRed = true; }
            }
            const na = num(s.bl_na);
            if(na && (na < 125 || na > 155)) {
                 msg += ` (Severe Na ${na})`; isRed = true;
            }
            const sev = s.electrolyteConcern;
            if (sev === 'severe') { msg += " (Severe)"; isRed = true; }
            add(isRed ? red : amber, msg, 'electrolyteConcern', isRed ? 'red' : 'amber', s.electrolyteConcern_note);
        }

        // --- UPDATED RENAL / FLUID LOGIC ---
        const cr = num(s.bl_cr_review) || num(s.cr_review);
        const renalOpen = (s.renal === true) || (cr && cr > 150);
        
        if (renalOpen) {
            // Chip Groups
            const fluidFlags = [];
            const renalFlags = [];
            
            // Fluid
            if(s.renal_fluid) fluidFlags.push('fluid overload');
            if(s.renal_oedema) fluidFlags.push('oedema');
            if(s.renal_dehydrated) fluidFlags.push('dehydrated/dry'); // New Chip

            // Renal
            if(s.renal_oliguria) renalFlags.push('oliguria (<0.5ml/kg)');
            if(s.renal_anuria) renalFlags.push('anuria');
            if(s.renal_dysfunction) renalFlags.push('dysfunction/AKI');
            if(cr > 150) renalFlags.push(`High Cr ${cr}`);

            // Dialysis Logic
            if(s.renal_dialysis) {
                const dType = $('dialysis_type')?.querySelector('.active')?.dataset.value;
                if(dType === 'acute') renalFlags.push('Acute Dialysis');
                else renalFlags.push('Chronic Dialysis');
            }

            const hasFluid = fluidFlags.length > 0;
            const hasRenal = renalFlags.length > 0;

            // Determine Label
            let label = "Renal concern"; // Default
            if (hasFluid && hasRenal) label = "Renal / Fluid concern";
            else if (hasFluid && !hasRenal) label = "Fluid concern";
            
            // Append Details
            const allFlags = [...renalFlags, ...fluidFlags];
            if(allFlags.length > 0) label += ` - ${joinGrammatically(allFlags)}`;

            // Check Mitigation vs Amber Override
            // Chips that override mitigation (Force Amber)
            const overrideChips = [
                s.renal_oliguria, s.renal_anuria, s.renal_dysfunction, // Renal overrides
                s.renal_fluid, s.renal_oedema, s.renal_dehydrated     // Fluid overrides
            ];
            
            // Dialysis overrides only if Acute
            const dType = $('dialysis_type')?.querySelector('.active')?.dataset.value;
            if(s.renal_dialysis && dType === 'acute') overrideChips.push(true);

            const isForceAmber = overrideChips.some(x => x === true);
            const isMitigated = (s.renal_chronic === true);

            if (isMitigated && !isForceAmber) {
                // Fully mitigated (Chronic CKD, no acute flags)
                suppressedRisks.push(`${label} (mitigated: known CKD and Cr around baseline)`);
            } else {
                // Score it
                // Logic: Red if critical, otherwise Amber
                const critical = s.renal_anuria || cr > 200 || (hasFluid && hasRenal && s.renal_dysfunction);
                
                if (critical) add(red, label, 'seg_renal', 'red', s.renal_note);
                else add(amber, label, 'seg_renal', 'amber', s.renal_note);
            }
        }

        // --- INFECTION LOGIC ---
        const wcc = num(s.bl_wcc) || num(s.wcc);
        const crp = num(s.crp) || num(s.bl_crp);
        const nlrVal = (neut > 0 && lymph > 0) ? (neut/lymph) : 0;
        
        const autoTrigger = (wcc && (wcc > 15 || wcc < 2)) || 
                            (temp && temp > 38) || 
                            (crp && crp > 100) || 
                            (nlrVal > 10);
                            
        const manualConcern = s.infection === true; 

        if (autoTrigger || manualConcern) {
            let markers = [], isRed = false;
            
            if (wcc !== null && (wcc > 15 || wcc < 2)) isRed = true;
            if (crp > 100) isRed = true;
            if (temp > 38.5) isRed = true;
            
            if (wcc !== null && (wcc < 3 || wcc > 15)) markers.push(`WCC ${wcc}`);
            else if (wcc !== null && (wcc > 11)) markers.push(`WCC ${wcc}`);
            
            if (crp > 100) markers.push(`CRP ${crp}`);
            else if (crp > 50) markers.push(`CRP ${crp}`);
            
            if (temp > 38.5) markers.push(`Temp ${temp}`);
            else if (temp > 37.8) markers.push(`Temp ${temp}`);
            
            if (nlrVal > 10) markers.push(`NLR ${nlrVal.toFixed(1)}`);
            
            let msg = isRed ? "Infection Risk (Severe)" : "Infection Risk";
            if (markers.length) msg += ` - ${markers.join(', ')}`;

            const shouldSuppress = (s.infection_downtrend === true);

            if (shouldSuppress) {
                suppressedRisks.push("Infection risk (however, infection markers downtrending, ADDS low and the patient is on appropriate antibiotics)");
            } else {
                add(isRed ? red : amber, msg, 'seg_infection', isRed ? 'red' : 'amber', s.infection_note);
            }
        }

        if (s.immobility === true) {
            const icuLos = num(s.icuLos) || 0;
            if (icuLos >= 4) add(red, `Immobility plus long ICU LOS`, 'seg_immobility', 'red', s.immobility_note);
            else add(amber, 'Immobility concern', 'seg_immobility', 'amber', s.immobility_note);
        }

        const hb = num(s.hb) || num(s.bl_hb);
        if (hb && hb <= 70) add(red, `Hb ${hb}`, 'hb_wrapper', 'red');
        else if (hb && hb <= 90 && s.hb_dropping) add(amber, `Hb ${hb} (dropping)`, 'hb_wrapper', 'amber');
        else if (s.hb_dropping) add(amber, `Hb Dropping`, 'hb_wrapper', 'amber');

        const alb = num(s.bl_alb);
        if(alb && alb < 20) add(amber, `Severe hypoalbuminemia (${alb})`, 'bl_alb', 'amber');
        
        const plts = num(s.bl_plts);
        if(plts && plts < 100) add(amber, `Thrombocytopenia (${plts})`, 'bl_plts', 'amber');

        const activeComorbsKeys = toggleInputs.filter(k => k.startsWith('comorb_') && s[k]);
        const countComorbs = activeComorbsKeys.length;
        const comorbDisplay = $('selected_comorbs_display');
        if (comorbDisplay) {
            if (countComorbs > 0) {
                const names = activeComorbsKeys.map(k => `<span style="color:var(--red)">${comorbMap[k]}</span>`).join(', ');
                comorbDisplay.innerHTML = `Already selected: ${names}`;
                comorbDisplay.style.display = 'block';
            } else { comorbDisplay.style.display = 'none'; }
        }
        if (countComorbs >= 3) {
            add(red, 'Multiple comorbidities (3+)', null, 'red', s.comorb_other_note);
            activeComorbsKeys.forEach(k => flagged.red.push(`toggle_${k}`));
        } else if (countComorbs > 0) {
            const cList = activeComorbsKeys.map(k => comorbMap[k]).join(', ');
            add(amber, `Comorbidities (${cList})`, null, 'amber', s.comorb_other_note);
            activeComorbsKeys.forEach(k => flagged.amber.push(`toggle_${k}`));
        }

        const lact = num(s.lactate) || num(s.bl_lac_review);
        if (lact > 4.0) add(red, `Lactate ${lact}`, 'lactate', 'red');
        else if (lact >= 2.0) add(amber, `Lactate ${lact}`, 'lactate', 'amber');

        if (s.override === 'red') {
            const reason = s.overrideNote || 'Clinician override: CAT 1';
            add(red, reason, 'override_red', 'red');
        }
        if (s.override === 'amber') {
            const reason = s.overrideNote || 'Clinician override: CAT 2';
            add(amber, reason, 'override_amber', 'amber');
        }

        const age = num(s.ptAge);
        if (age >= 75) add(amber, `Age ${age} (frailty risk)`, 'ptAge', 'amber');

        const uniqueRed = [...new Set(red)];
        const uniqueAmber = [...new Set(amber)];
        const redCount = uniqueRed.length;
        const amberCount = uniqueAmber.length;
        let cat = { id: 'green', text: 'CAT 3' };
        if (redCount > 0) cat = { id: 'red', text: 'CAT 1' };
        else if (amberCount > 0) cat = { id: 'amber', text: 'CAT 2' };

        const catText = $('catText'); if(catText) { catText.className = `status ${cat.id}`; catText.textContent = cat.text; }
        const catBox = $('categoryBox'); if(catBox) catBox.style.borderColor = `var(--${cat.id})`;
        const rc = $('redCount'); if(rc) { rc.textContent = redCount; rc.style.color = redCount ? 'var(--red)' : ''; }
        const ac = $('amberCount'); if(ac) { ac.textContent = amberCount; ac.style.color = amberCount ? 'var(--amber)' : ''; }
        const stickyScore = $('footerScore');
        if (stickyScore) { stickyScore.className = `footer-score tag ${cat.id}`; stickyScore.textContent = cat.text; }

        const listEl = $('flagList');
        if(listEl) {
            let html = [
                ...uniqueRed.map(t => `<div style="color:var(--red); font-weight:700;">${t}</div>`),
                ...uniqueAmber.map(t => `<div style="color:var(--amber); font-weight:700;">${t}</div>`),
                ...suppressedRisks.map(t => `<div style="color:var(--muted); font-style:italic; border-left:2px solid var(--muted); padding-left:6px;">${t}</div>`)
            ];

            if (html.length === 0) listEl.innerHTML = '<div style="color:var(--muted)">No risk factors identified</div>';
            else listEl.innerHTML = html.join('');
        }

        document.querySelectorAll('.flag-red, .flag-amber').forEach(e => e.classList.remove('flag-red', 'flag-amber'));
        flagged.red.forEach(id => $(id)?.closest('.toggle-label, .input-box, .question-row')?.classList.add('flag-red'));
        flagged.amber.forEach(id => $(id)?.closest('.toggle-label, .input-box, .question-row')?.classList.add('flag-amber'));

        // --- PLAN & DISCHARGE LOGIC (UPDATED WITH TIME GATING) ---
        let planHtml = '';
        const hoursSinceStep = timeData.hours;
        
        let dischargeOverride = false;
        
        // Post-Stepdown Discharge Prompt Logic
        const disPrompt = $('discharge_prompt');
        const disMsg = $('discharge_msg');
        const chkDischarge = $('chk_discharge_alert');
        const disWrap = $('chk_discharge_wrapper');

        if(disPrompt) {
            const alreadyChecked = chkDischarge && chkDischarge.checked;
            const dismissed = window.dismissedDischarge === true;
            const isPost = s.reviewType === 'post';
            
            // TIMING GATES
            let showPrompt = false;
            
            if (isPost && !alreadyChecked && !dismissed) {
                if (cat.id === 'green') showPrompt = true; // Immediate
                else if (cat.id === 'amber' && hoursSinceStep >= 48) showPrompt = true;
                else if (cat.id === 'red' && hoursSinceStep >= 72) showPrompt = true;
            }

            if(showPrompt) {
                disPrompt.style.display = 'block';
                disPrompt.style.borderColor = `var(--${cat.id})`;
                if(cat.id === 'green') disPrompt.style.borderColor = `var(--green)`; 
                
                let colorName = "Green";
                if(cat.id === 'amber') colorName = "Amber";
                if(cat.id === 'red') colorName = "Red";
                
                let hoursTxt = Math.round(hoursSinceStep) + " hours";
                
                disMsg.innerHTML = `<span style="color:var(--${cat.id})">${cat.text} ${colorName} patient.</span> ${hoursTxt} on ward.<br>Can patient be discharged?`;
                if(disWrap) disWrap.classList.add('pulse-highlight');
            } else {
                disPrompt.style.display = 'none';
                if(disWrap) disWrap.classList.remove('pulse-highlight');
            }
        }

        if (s.stepdown_suitable === false) planHtml = `<div class="status red">NOT SUITABLE FOR STEPDOWN.</div>`;
        else if (s.chk_discharge_alert) planHtml = `<div class="status" style="color:var(--blue-hint)">Discharge from ALERT nursing outreach list.</div>`;
        else if (cat.id === 'red') planHtml = `<div class="status red">At least daily ALERT review (up to 72h).</div>`;
        else if (cat.id === 'amber') planHtml = `<div class="status amber">At least daily ALERT review (up to 48h).</div>`;
        else {
            // Green Logic
            if(s.reviewType === 'pre') planHtml = `<div class="status green">At least single ALERT nursing follow up on ward.</div>`;
            else planHtml = `<div class="status green">Continue ALERT post ICU review.</div>`; 
        }

        if (s.chk_medical_rounding) planHtml += `<div style="margin-top:2px; font-weight:600; color:var(--accent);">+ Added to ALERT Medical Rounding List</div>`;
        const fu = $('followUpInstructions'); if(fu) fu.innerHTML = planHtml;

        checkCompleteness(s, countComorbs);
        generateSummary(s, cat, timeData.text, uniqueRed, uniqueAmber, suppressedRisks, activeComorbsKeys);
    } catch(err) {
        console.error("Compute Error:", err);
    }
}

function checkCompleteness(s, comorbCount) {
    const nudges = document.querySelectorAll('#completeness_nudge');
    if (!nudges.length) return;
    let missing = [];
    if (!s.ptName) missing.push('Patient Name');
    if (!s.ptMrn) missing.push('URN');
    if (!s.ptWard) missing.push('Ward');
    nudges.forEach(nudge => {
        if (missing.length > 0) {
            nudge.style.display = 'block';
            nudge.textContent = 'Missing: ' + missing.join(', ');
            nudge.style.color = 'var(--red)';
        } else { nudge.style.display = 'none'; }
    });
}

function generateSummary(s, cat, wardTimeTxt, red, amber, suppressed, activeComorbsKeys) {
    
    // Manual Edit Protection
    if(isManuallyEdited) {
        return; 
    }

    const lines = [];
    const addLine = (txt) => { if (txt) lines.push(txt); };
    const role = s.clinicianRole;
    const reviewName = (s.reviewType === 'pre') ? 'Pre-Stepdown' : 'post ICU review';

    if(s.reviewType === 'pre') {
        lines.push(`${role} Pre-Stepdown Review`);
    } else {
        lines.push(`${role} ${reviewName}`);
    }

    lines.push(`Patient: ${s.ptName || '--'} | URN: ...${s.ptMrn || ''} | Location: ${s.ptWard || '--'} ${s.ptBed || ''}`);
    let demo = [];
    if(s.ptAge) demo.push(`Age: ${s.ptAge}`);
    if(s.ptWeight) demo.push(`Weight: ${s.ptWeight}kg`);
    if(demo.length) lines.push(demo.join(' | '));
    
    lines.push(`Time of review: ${s.reviewTime || nowTimeStr()}`);

    if (s.reviewType === 'pre') {
        lines.push(`Stepdown Date: Today (${todayDateStr()})`);
    } else if (s.stepdownDate) {
        lines.push(`ICU Discharge Date: ${formatDateDDMMYYYY(s.stepdownDate)}`);
    }
    lines.push('');

    if (wardTimeTxt && s.reviewType !== 'pre') lines.push(`Time since stepdown: ${wardTimeTxt}`);
    lines.push(`ICU LOS: ${s.icuLos || '?'} days.`);
    lines.push(`Reason for ICU Admission: ${s.ptAdmissionReason || '--'}`);
    if (s.allergies_note) lines.push(`Allergies: ${s.allergies_note}`);

    if (s.reviewType === 'pre' && s.icuSummary) {
        lines.push('');
        lines.push(`ICU Course Summary: ${s.icuSummary}`);
    }
    lines.push('');

    if (s.stepdown_suitable === false) {
        lines.push(`ALERT Nursing Review Category - NOT SUITABLE FOR STEPDOWN`);
        lines.push('');
        lines.push('Assessed as not presently suitable for ward stepdown.');
        lines.push(`Reason: ${s.unsuitable_note || 'Clinical concerns (see notes)'}`);
        lines.push('Plan: ICU Senior Review requested. Please contact ALERT for re-review when appropriate.');
        lines.push('');
        lines.push('--- FULL ASSESSMENT BELOW ---');
        lines.push('');
    } else {
        lines.push(`ALERT Nursing Review Category - ${cat.text}`);
        if(s.stepdown_suitable === true && s.reviewType === 'pre') {
             lines.push('Patient is suitable for ward stepdown.');
        }
        lines.push('');
    }

    lines.push('PMH:');
    activeComorbsKeys.forEach(k => { lines.push(`-${comorbMap[k]}`); });
    if (s.pmh_note) {
        const splitPmh = s.pmh_note.split('\n');
        splitPmh.forEach(p => { if (p.trim()) lines.push(`-${p.trim().replace(/^-/, '')}`); });
    }
    lines.push('');

    lines.push('A-E ASSESSMENT');
    if (s.chk_use_mods) addLine(`MODS: ${s.mods_score} ${s.mods_details ? `(${s.mods_details})` : ''}`);
    else addLine(`ADDS: ${s.adds}`);

    if (s.airway_a) addLine(`A: ${s.airway_a}`);

    let b = [];
    if (s.b_rr) b.push(`RR ${s.b_rr}`);
    if (s.b_spo2) b.push(`SpO2 ${s.b_spo2}`);
    if (s.b_device) b.push(s.b_device);
    if (s.b_wob) b.push(`WOB: ${s.b_wob}`);
    if (b.length) addLine(`B: ${b.join(', ')}`);

    let c = [];
    if (s.c_hr) c.push(`HR ${s.c_hr} ${s.c_hr_rhythm ? `(${s.c_hr_rhythm})` : ''}`);
    if (s.c_nibp) c.push(`NIBP ${s.c_nibp}`);
    if (s.c_cr) c.push(`CR ${s.c_cr}`);
    if (s.c_perf) c.push(`Perf ${s.c_perf}`);
    if (c.length) addLine(`C: ${c.join(', ')}`);

    let d = [];
    if (s.d_alert) d.push(s.d_alert);
    if (s.d_pain) d.push(`Pain: ${s.d_pain}`);
    if (d.length) addLine(`D: ${d.join(', ')}`);

    let e = [];
    if (s.e_temp) e.push(`Temp ${s.e_temp}`);
    if (s.e_uop) e.push(`UOP ${s.e_uop}`);
    if (s.e_bsl) e.push(`BSL ${s.e_bsl}`);
    if (e.length) addLine(`E: ${e.join(', ')}`);

    lines.push('');

    if (s.ae_mobility) addLine(`Mobility: ${s.ae_mobility}`);
    if (s.ae_diet) addLine(`Diet: ${s.ae_diet}`);

    let bowelTxt = '';
    if (s.bowel_mode === 'btn_bo') bowelTxt = 'BO';
    else if (s.bowel_mode === 'btn_bno') bowelTxt = 'BNO';

    if (s.bowel_date) {
        const bd = new Date(s.bowel_date);
        bowelTxt += ` last opened (${bd.getDate()}/${bd.getMonth() + 1})`;
    }
    if (s.chk_aperients && s.bowel_mode === 'btn_bno') bowelTxt += ' (Aperients charted)';
    if (s.ae_bowels) bowelTxt += ` ${s.ae_bowels}`;

    if (bowelTxt) addLine(`Bowels: ${bowelTxt}`);

    lines.push('');

    const blMap = { 'lac_review': 'Lac', 'hb': 'Hb', 'wcc': 'WCC', 'cr_review': 'Cr', 'k': 'K', 'na': 'Na', 'mg': 'Mg', 'phos': 'PO4', 'plts': 'Plts', 'alb': 'Alb', 'neut': 'Neut', 'lymph': 'Lymph', 'bili': 'Bili', 'alt': 'ALT', 'inr': 'INR', 'aptt': 'APTT' };
    const blLines = [];
    Object.keys(blMap).forEach(key => {
        const currentVal = s[`bl_${key}`];
        const prevVal = window.prevBloods ? window.prevBloods[key] : null;
        if (currentVal) {
            let str = `${blMap[key]} ${currentVal}`;
            if (prevVal && prevVal !== currentVal) str += ` (${prevVal})`;
            blLines.push(str);
        }
    });
    if (blLines.length) addLine(`Bloods: ${blLines.join(', ')}`);
    if (s.infusions_note) addLine(`Infusions: ${s.infusions_note}`);
    if (s.new_bloods_ordered) addLine('(new bloods ordered for next round)');
    if (s.elec_replace_note) addLine(`Electrolyte Plan: ${s.elec_replace_note}`);
    lines.push('');

    lines.push('DEVICES:');
    if (Object.values(s.devices || {}).some(arr => arr.length)) {
        Object.entries(s.devices).forEach(([k, v]) => { v.forEach(item => lines.push(`- ${k} ${item ? `(${item})` : ''}`)); });
    } else { lines.push('- Nil'); }
    lines.push('');

    if (s.goc_note) lines.push(`GOC: ${s.goc_note}`);
    if (s.pics_note) lines.push(`PICS Assessment: ${s.pics_note}`);
    if (s.context_other_note) lines.push(`Other: ${s.context_other_note}`);
    lines.push('');

    lines.push('IDENTIFIED ICU READMISSION RISK FACTORS:');
    const risks = [...red, ...amber];
    if (risks.length) { risks.forEach(r => lines.push(`- ${r}`)); } 
    // Add suppressed risks text
    if (suppressed.length) { suppressed.forEach(r => lines.push(`- ${r}`)); }
    
    if (risks.length === 0 && suppressed.length === 0) { lines.push('- None identified'); }
    lines.push('');

    lines.push('PLAN:');
    
    if (s.stepdown_suitable === false) {
        lines.push('- ICU Senior Review requested due to unsuitability for ward stepdown.');
        lines.push('- Please re-contact ALERT for re-review when appropriate.');
    } else if (s.chk_discharge_alert) {
        lines.push('- Discharge from ALERT nursing post-ICU list. Please re-contact ALERT if further support required.');
    } else if (cat.id === 'red') {
        lines.push('- At least daily ALERT review for up to 72h post-ICU stepdown.');
    } else if (cat.id === 'amber') {
        lines.push('- At least daily ALERT review for up to 48h post-ICU stepdown.');
    } else {
        // Green
        if(s.reviewType === 'pre') lines.push('- At least single ALERT nursing follow up on ward.');
        else lines.push('- Continue ALERT post ICU review.');
    }
    
    if (s.chk_medical_rounding) {
        lines.push('- Patient added to ALERT medical rounding list for further review.');
    }

    const sum = $('summary'); 
    if(sum) { 
        sum.classList.add('script-updating');
        sum.value = lines.join('\n');
        sum.classList.remove('script-updating');
    }
}

document.addEventListener('DOMContentLoaded', initialize);
