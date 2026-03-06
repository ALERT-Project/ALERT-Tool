export const STORAGE_KEY = 'alertToolData_v7_7';
export const ACCORDION_KEY = 'alertToolAccordions_v7_7';
export const UNDO_KEY = 'alertToolUndo_v7_7';

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

export const staticInputs = [
    'reviewTime', 'ptName', 'ptMrn', 'ptAge', 'ptWeight', 'ptWard', 'ptBed', 'ptWardOther', 'ptAdmissionReason', 'icuSummary', 'icuLos', 'stepdownDate',
    'npFlow', 'hfnpFio2', 'hfnpFlow', 'nivFio2', 'nivPeep', 'nivPs', 'override', 'overrideNote',
    'trache_details_note', 'mods_score', 'mods_details', 'airway_a', 'a_comment', 'b_rr', 'b_spo2', 'b_device', 'b_wob', 'b_cough', 'b_comment',
    'c_hr', 'c_hr_rhythm', 'c_nibp', 'c_cr', 'c_perf', 'c_comment', 'd_alert', 'd_pain', 'd_comment', 'e_temp', 'e_bsl', 'e_fluid', 'e_uop', 'e_comment', 'atoe_adds',
    'ae_mobility', 'ae_diet', 'ae_bowels', 'bowel_date',
    'bl_wcc', 'bl_crp', 'bl_neut', 'bl_lymph', 'bl_hb', 'bl_plts', 'bl_k', 'bl_na',
    'bl_cr_review', 'bl_mg', 'bl_alb', 'bl_lac_review', 'bl_phos',
    'bl_bili', 'bl_alt', 'bl_inr', 'bl_aptt', 'bl_egfr', 'anticoag_note', 'vte_prophylaxis_note',
    'elec_replace_note', 'goc_note', 'allergies_note', 'pics_note', 'context_other_note', 'pmh_note',
    'adds', 'lactate', 'lactate_trend', 'hb', 'wcc', 'crp', 'neut', 'lymph', 'infusions_note',
    'dyspneaConcern', 'dyspneaConcern_note', 'renal_note', 'infection_note',
    'electrolyteConcern_note', 'neuroType_note', 'nutrition_context_note', 'pain_context_note', 'neuro_psych_note', 'sleep_quality_note', 'fluid_restriction_amount',
    'after_hours_note', 'pressors_note', 'immobility_note', 'comorb_other_note',
    'unsuitable_note', 'pressor_ceased_time', 'pressor_recent_other_note', 'pressor_current_other_note', 'hac_note',
    'wardReviewCount'
];

export const segmentedInputs = [
    'hb_dropping', 'after_hours', 'hist_o2', 'intubated',
    'resp_concern', 'renal', 'immobility', 'infection', 'new_bloods_ordered',
    'neuro_gate', 'nutrition_adequate', 'electrolyte_gate', 'pressors', 'hac',
    'stepdown_suitable', 'comorbs_gate',
    'renal_chronic', 'renal_chronic_bloods',
    'infection_downtrend', 'infection_downtrend_bloods',
    'dialysis_type', 'sleep_quality', 'pain_control', 'neuro_psych', 'pics',
    'lactate_trend', 'resp_dyspnea', 'resp_tachypnea', 'resp_rapid_wean', 'resp_poor_cough', 'resp_poor_swallow'
];

export const toggleInputs = [
    'comorb_copd', 'comorb_asthma', 'comorb_hf', 'comorb_esrd', 'comorb_dialysis',
    'comorb_diabetes', 'comorb_cirrhosis', 'comorb_malignancy', 'comorb_immuno', 'comorb_other',
    'renal_oliguria', 'renal_anuria', 'renal_fluid', 'renal_oedema', 'renal_dysfunction', 'renal_dialysis', 'renal_dehydrated', 'renal_worsening_cr',
    'chk_aperients', 'chk_unknown_blo_date',
    'pressor_recent_norad', 'pressor_recent_met', 'pressor_recent_gtn', 'pressor_recent_dob', 'pressor_recent_mid', 'pressor_recent_other',
    'pressor_current_mid', 'pressor_current_other'
];

export const selectInputs = [
    'oxMod', 'dyspneaConcern', 'neuroConcern', 'neuroType', 'electrolyteConcern', 'stepdownTime',
    'tracheType', 'tracheStatus', 'intubatedReason'
];

export const deviceTypes = ['CVC', 'PICC', 'Other CVAD', 'PIVC', 'Arterial Line', 'Enteral Tube', 'IDC', 'Pacing Wire', 'Drain', 'Wound', 'Vascath', 'Other Device'];
