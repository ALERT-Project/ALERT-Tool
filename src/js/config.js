export const STORAGE_KEY = 'alertToolData_v7_7';
export const ACCORDION_KEY = 'alertToolAccordions_v7_7';
export const UNDO_KEY = 'alertToolUndo_v7_7';

// Bloods that actually feed a risk gate: Cr -> renal, WCC/CRP/Neut/Lymph -> infection,
// K/Na/Mg/PO4 -> electrolytes, lactate -> its own rule. Everything else still highlights in
// the grid when out of range, but staging it as an issue was noise rather than signal.
// (Mg and PO4 are listed for visibility; the electrolyte rule itself still tests only K and Na.)
// aptt is listed so a deranged clotting time on a heparin infusion appears at all - it
// previously had no rule anywhere in the tool, so an APTT of 110 produced nothing.
export const GATE_LINKED_BLOODS = ['cr_review', 'wcc', 'crp', 'neut', 'lymph', 'k', 'na', 'mg', 'phos', 'lac_review', 'aptt'];

// Display names for blood keys - "Abnormal CR 180" reads as shouting, and the handover line
// inherits the same text.
export const BLOOD_LABELS = {
    wcc: 'WCC', crp: 'CRP', neut: 'Neut', lymph: 'Lymph', hb: 'Hb', plts: 'Plts',
    k: 'K+', na: 'Na', cr_review: 'Cr', egfr: 'eGFR', mg: 'Mg', alb: 'Alb',
    lac_review: 'Lactate', phos: 'PO4', bili: 'Bili', alt: 'ALT', inr: 'INR',
    aptt: 'APTT', bsl: 'BSL'
};

export const normalRanges = {
    wcc: { low: 4, high: 11 },
    crp: { low: 0, high: 5 },
    neut: { low: 1.5, high: 7.5 },
    lymph: { low: 1.0, high: 4.0 },
    hb: { low: 115, high: 165 },
    plts: { low: 150, high: 400 },
    k: { low: 3.5, high: 5.2 },
    na: { low: 135, high: 145 },
    cr_review: { low: 50, high: 98 },
    egfr: { low: 60, high: 120 },
    mg: { low: 0.7, high: 1.1 },
    alb: { low: 35, high: 50 },
    lac_review: { low: 0.5, high: 2.0 },
    phos: { low: 0.8, high: 1.5 },
    bili: { low: 0, high: 20 },
    alt: { low: 0, high: 40 },
    inr: { low: 0.9, high: 1.2 },
    aptt: { low: 25, high: 38 },
    bsl: { low: 4.0, high: 15.0 }
};

export const comorbMap = {
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

// --- Cumulative PICS Risk Score ----------------------------------------------------------
// Local instrument (Dhanju, 2026), not a published or validated score. One source of truth for
// the rules, the panel and the summary line, so an item cannot exist in one and not the other.
//
// `derive` is a pure predicate over the state object: where the tool already holds the answer
// it ticks the item itself rather than asking a second time. `derivedFrom` names the control
// that did it, so an auto-tick can say where it came from. Items with neither are the
// clinician's alone - the ICU history the tool never sees.
//
// That split is the whole design of the panel. Five items cost nothing and are always scored;
// the six without a `derive` are the entire cost of the screen, and are the only ones the gate
// puts on screen. `chip` is the terse label for those - the panel has one dense row for them,
// not eleven, because an assessment nobody completes is worse than one that admits it is
// partial. `short` is the prose form, used in the note.
//
// Two items are deliberately *not* derived even though a field looks close enough:
//   P-03 - frailty is pre-existing by definition; a psychological concern recorded at a ward
//          review is not, so neuro_psych only suggests.
//   P-06 - the pressor toggles record which agent, never the dose, and this item turns on
//          "high dose".
export const PICS_ITEMS = [
    { id: 'pics_p01', code: 'P-01', points: 3, tier: 'High-yield', label: 'Mechanical ventilation >48h', short: 'mechanical ventilation >48h', chip: 'MV >48h' },
    {
        id: 'pics_p02', code: 'P-02', points: 3, tier: 'High-yield',
        label: 'Positive delirium screen (CAM-ICU+) at any point', short: 'CAM-ICU positive',
        derive: s => s.neuro_gate === true && s.neuroType === 'Delirium', derivedFrom: 'neuro type Delirium'
    },
    {
        id: 'pics_p03', code: 'P-03', points: 3, tier: 'High-yield',
        label: 'Pre-existing baseline impairment (cognitive decline, frailty, PTSD/depression)', short: 'pre-existing baseline impairment',
        derive: s => s.frailty_known === true, derivedFrom: 'known frailty at baseline',
        suggest: s => s.neuro_psych === true && s.frailty_known !== true,
        suggestReason: 'Psychological concern recorded - pre-existing diagnosis?'
    },
    { id: 'pics_p04', code: 'P-04', points: 2, tier: 'Moderate', label: 'Severe sepsis, septic shock or ARDS', short: 'severe sepsis/ARDS', chip: 'Sepsis/ARDS' },
    { id: 'pics_p05', code: 'P-05', points: 2, tier: 'Moderate', label: 'Neuromuscular blockade or high dose corticosteroids', short: 'paralytics/high dose steroids', chip: 'Paralytics/steroids' },
    {
        id: 'pics_p06', code: 'P-06', points: 2, tier: 'Moderate',
        label: 'Severe hypoxia or high dose vasopressors', short: 'severe hypoxia/high dose vasopressors', chip: 'High-dose pressors',
        suggest: s => s.pressor_recent_norad === true,
        suggestReason: 'Noradrenaline recorded in ICU - was the dose high?'
    },
    {
        id: 'pics_p07', code: 'P-07', points: 2, tier: 'Moderate',
        label: 'Strict bed rest or complete immobility >48h', short: 'immobile >48h',
        derive: s => s.immobility === true && (parseFloat(s.icuLos) || 0) >= 2, derivedFrom: 'immobility gate'
    },
    {
        id: 'pics_p08', code: 'P-08', points: 1, tier: 'Additive',
        label: 'ICU length of stay >3 days', short: 'ICU LOS >3 days',
        derive: s => (parseFloat(s.icuLos) || 0) > 3, derivedFrom: 'ICU LOS'
    },
    { id: 'pics_p09', code: 'P-09', points: 1, tier: 'Additive', label: 'Use of physical restraints', short: 'physical restraints', chip: 'Restraints' },
    {
        id: 'pics_p10', code: 'P-10', points: 1, tier: 'Additive',
        label: 'Severe sleep disruption or altered sleep architecture', short: 'severe sleep disruption',
        derive: s => s.sleep_quality === true, derivedFrom: 'poor sleep'
    },
    { id: 'pics_p11', code: 'P-11', points: 1, tier: 'Additive', label: 'Extreme family or caregiver distress or conflict', short: 'family/caregiver distress', chip: 'Family distress' }
];

// 0-2 low, 3-5 moderate, 6+ high. The ward action attached to each band is the reason the
// score exists at all, so it travels with the band rather than living in the summary.
export const PICS_BANDS = {
    low: { label: 'Low risk', action: null },
    moderate: {
        label: 'Moderate risk',
        action: 'PICS moderate risk: patient & family education bundle delivered. Monitor for emerging symptoms at next review.'
    },
    high: {
        label: 'High risk',
        action: 'PICS high risk: formal PICS alert given at handover, priority 72-hour ICU Outreach review, referrals to Physiotherapy and Social Work.'
    }
};

export const staticInputs = [
    'reviewTime', 'reviewerInitials', 'quickNotes', 'ptName', 'ptMrn', 'ptAge', 'ptWeight', 'ptWard', 'ptBed', 'ptWardOther', 'ptAdmissionReason', 'icuSummary', 'icuLos', 'stepdownDate', 'stepdownTime',
    'npFlow', 'hfnpFio2', 'hfnpFlow', 'nivFio2', 'nivPeep', 'nivPs', 'override', 'overrideNote', 'addsManual', 'addsOverrideNote',
    'trache_details_note', 'mods_score', 'mods_details', 'airway_a', 'a_comment', 'b_rr', 'b_spo2', 'b_device', 'b_wob', 'b_cough', 'b_comment',
    'c_hr', 'c_hr_rhythm', 'c_nibp', 'c_cr', 'c_perf', 'c_comment', 'd_alert', 'd_pain', 'd_comment', 'e_temp', 'e_bsl', 'e_fluid', 'e_uop', 'e_comment', 'atoe_adds',
    'ae_mobility', 'ae_diet', 'ae_bowels', 'bowel_date',
    'bl_wcc', 'bl_crp', 'bl_neut', 'bl_lymph', 'bl_hb', 'bl_plts', 'bl_k', 'bl_na',
    'bl_cr_review', 'bl_mg', 'bl_alb', 'bl_lac_review', 'bl_phos',
    'bl_bili', 'bl_alt', 'bl_inr', 'bl_aptt', 'bl_egfr', 'inr_target', 'aptt_target',
    'bloods_date', 'bloods_time', 'anticoag_note', 'vte_prophylaxis_note',
    'elec_replace_note', 'goc_note', 'allergies_note', 'pics_note', 'context_other_note', 'pmh_note',
    'adds', 'wcc', 'crp', 'neut', 'lymph', 'infusions_note',
    'dyspneaConcern', 'dyspneaConcern_note', 'renal_note', 'infection_note',
    'electrolyteConcern_note', 'neuroType_note', 'nutrition_context_note', 'pain_context_note', 'neuro_psych_note', 'sleep_quality_note', 'fluid_restriction_amount',
    'after_hours_note', 'pressors_note', 'immobility_note', 'comorb_other_note',
    'unsuitable_note', 'pressor_ceased_time', 'pressor_recent_other_note', 'pressor_current_other_note', 'hac_note', 'discharge_pending_bloods_note',
    'age_mitigate_reason', 'los_mitigate_reason', 'frailty_note'
];

export const segmentedInputs = [
    'bloods_status',
    'after_hours', 'hist_o2', 'intubated',
    'resp_concern', 'renal', 'immobility', 'infection', 'new_bloods_ordered',
    'neuro_gate', 'nutrition_adequate', 'electrolyte_gate', 'pressors', 'hac',
    'stepdown_suitable', 'comorbs_gate',
    'renal_chronic', 'renal_chronic_bloods',
    'infection_downtrend', 'infection_downtrend_bloods',
    'sleep_quality', 'pain_control', 'neuro_psych', 'pics',
    'resp_dyspnea', 'resp_tachypnea', 'resp_rapid_wean', 'resp_poor_cough', 'resp_poor_swallow',
    'age_mitigated', 'los_mitigated', 'frailty_known'
];

export const toggleInputs = [
    'comorb_copd', 'comorb_asthma', 'comorb_hf', 'comorb_esrd', 'comorb_dialysis',
    'comorb_diabetes', 'comorb_cirrhosis', 'comorb_malignancy', 'comorb_immuno', 'comorb_other',
    'renal_oliguria', 'renal_anuria', 'renal_fluid', 'renal_oedema', 'renal_dysfunction', 'renal_dialysis', 'renal_dehydrated', 'renal_worsening_cr',
    'chk_aperients', 'chk_unknown_blo_date',
    'pressor_recent_norad', 'pressor_recent_met', 'pressor_recent_gtn', 'pressor_recent_dob', 'pressor_recent_mid', 'pressor_recent_other',
    'pressor_current_mid', 'pressor_current_other',
    ...PICS_ITEMS.map(i => i.id)
];

// dialysis_type and intubatedReason are .select-btn button-groups, not segmented groups.
// dialysis_type was listed under segmentedInputs, where getState looked for a #seg_dialysis_type
// that does not exist - so it never saved and was lost on every refresh.
export const selectInputs = [
    'oxMod', 'dyspneaConcern', 'neuroConcern', 'neuroType', 'electrolyteConcern',
    'tracheType', 'tracheStatus', 'intubatedReason', 'dialysis_type'
];

export const deviceTypes = ['CVC', 'PICC', 'Other CVAD', 'PIVC', 'Arterial Line', 'Enteral Tube', 'IDC', 'Pacing Wire', 'Drain', 'Wound', 'Vascath', 'Tracheostomy', 'Other Device'];
