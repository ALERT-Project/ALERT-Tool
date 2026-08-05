import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRisks } from '../src/js/rules.js';

// Synthetic patients only. Every number here is invented - these fixtures exist to pin the
// rules down, not to describe anyone, and nothing patient-identifiable belongs in this file.
//
// Each fixture states the state it is testing and the category it should produce. When a rule
// changes deliberately, the expected value changes with it in the same commit; when a rule
// changes by accident, this is what says so.

// Fixed clock so anything time-dependent - ADDS 3 within 24h, the after-hours window - is
// deterministic rather than passing on a Tuesday and failing on a Sunday.
const NOW = new Date('2026-08-05T10:00:00');           // a Wednesday
const YESTERDAY_0800 = { stepdownDate: '2026-08-04', stepdownTime: '08:00' };  // 26h ago, in hours
const TODAY_1100 = { stepdownDate: '2026-08-05', stepdownTime: '11:00' };      // in hours, same day
const FRIDAY_2000 = { stepdownDate: '2026-07-31', stepdownTime: '20:00' };     // after-hours, >24h

// A patient with nothing wrong. Fixtures override only what they are testing, so a change to
// this baseline is a change to every fixture - which is the point.
const wellPatient = () => ({
    reviewType: 'post',
    ptAge: '60',
    icuLos: '2',
    ...TODAY_1100,
    adds: '0',
    chk_use_mods: false,
    bloods_status: 'reviewed'
});

const evaluate = (overrides = {}, ctx = {}) =>
    evaluateRisks({ ...wellPatient(), ...overrides }, { now: NOW, ...ctx });

const catOf = (overrides, ctx) => evaluate(overrides, ctx).cat.text;
const flagsOf = (overrides, ctx) => {
    const r = evaluate(overrides, ctx);
    return [...r.red, ...r.amber];
};
const hasFlag = (overrides, substring, ctx) =>
    flagsOf(overrides, ctx).some(f => f.includes(substring));
const hasCheck = (overrides, substring, ctx) =>
    evaluate(overrides, ctx).issues.some(i => i.severity === 'info' && i.text.includes(substring));

// --- Baseline ------------------------------------------------------------------------------

test('a well patient is CAT 3 with no flags', () => {
    const r = evaluate();
    assert.equal(r.cat.text, 'CAT 3');
    assert.deepEqual(r.red, []);
    assert.deepEqual(r.amber, []);
});

// --- Red rules -----------------------------------------------------------------------------

test('ADDS 4 or above is red', () => {
    assert.equal(catOf({ adds: '4' }), 'CAT 1');
    assert.equal(catOf({ adds: '9' }), 'CAT 1');
    assert.ok(hasFlag({ adds: '4' }, 'Elevated ADDS 4'));
});

test('MODS is named as MODS, not ADDS', () => {
    assert.ok(hasFlag({ adds: '5', chk_use_mods: true }, 'Elevated MODS 5'));
});

test('extreme vitals are red', () => {
    assert.equal(catOf({ c_hr: '140' }), 'CAT 1');
    assert.equal(catOf({ c_hr: '35' }), 'CAT 1');
    assert.equal(catOf({ c_nibp: '85/50' }), 'CAT 1');
    assert.equal(catOf({ b_rr: '28' }), 'CAT 1');
    assert.equal(catOf({ b_rr: '6' }), 'CAT 1');
    assert.equal(catOf({ b_spo2: '86%' }), 'CAT 1');
    assert.equal(catOf({ e_temp: '38.9' }), 'CAT 1');
    assert.equal(catOf({ e_temp: '35.1' }), 'CAT 1');
    assert.equal(catOf({ e_bsl: '3.2' }), 'CAT 1');
    assert.equal(catOf({ e_bsl: '22' }), 'CAT 1');
});

test('dangerous electrolytes are red', () => {
    // Sodium used to be described inside this gate but never opened it, so a Na of 122 alone
    // produced nothing at all.
    assert.equal(catOf({ bl_k: '6.4' }), 'CAT 1');
    assert.equal(catOf({ bl_k: '2.8' }), 'CAT 1');
    assert.equal(catOf({ bl_na: '122' }), 'CAT 1');
    assert.equal(catOf({ bl_na: '158' }), 'CAT 1');
});

test('PO4 below 0.32 is amber, 0.32-0.5 is only a check', () => {
    assert.equal(catOf({ bl_phos: '0.28' }), 'CAT 2');
    assert.equal(catOf({ bl_phos: '0.40' }), 'CAT 3');
    assert.ok(hasCheck({ bl_phos: '0.40' }, 'PO4 0.4 - replacement indicated'));
});

test('lactate above 4 is red, 2 to 4 is amber', () => {
    assert.equal(catOf({ bl_lac_review: '4.6' }), 'CAT 1');
    assert.equal(catOf({ bl_lac_review: '2.5' }), 'CAT 2');
});

// --- Amber rules ---------------------------------------------------------------------------

test('ADDS 3 is amber within 24h and says why', () => {
    assert.equal(catOf({ adds: '3' }), 'CAT 2');
    assert.ok(hasFlag({ adds: '3' }, 'ADDS 3, not baseline, monitor trend'));
});

test('ADDS 3 stops flagging once the patient is past 24h', () => {
    assert.equal(catOf({ adds: '3', ...YESTERDAY_0800 }), 'CAT 3');
});

test('soft vitals bands are amber', () => {
    assert.equal(catOf({ c_hr: '118' }), 'CAT 2');
    assert.equal(catOf({ c_hr: '45' }), 'CAT 2');
    assert.equal(catOf({ b_rr: '22' }), 'CAT 2');
});

test('recorded rhythm rides along in the wording', () => {
    assert.ok(hasFlag({ c_hr: '118', c_hr_rhythm: 'AF' }, 'Tachycardia HR 118 (AF)'));
});

test('magnesium flags below 0.7 and prompts replacement between 0.7 and 1.0', () => {
    assert.equal(catOf({ bl_mg: '0.62' }), 'CAT 2');
    assert.equal(catOf({ bl_mg: '0.85' }), 'CAT 3');
    assert.ok(hasCheck({ bl_mg: '0.85' }, 'Mg 0.85 - consider replacement'));
});

test('platelets flag under 20, not under 100', () => {
    assert.equal(catOf({ bl_plts: '55' }), 'CAT 3');
    assert.equal(catOf({ bl_plts: '15' }), 'CAT 2');
});

test('age 75+ is amber unless mitigated', () => {
    assert.equal(catOf({ ptAge: '82' }), 'CAT 2');
    assert.equal(catOf({ ptAge: '82', age_mitigated: true, age_mitigate_reason: 'runs marathons' }), 'CAT 3');
    assert.ok(evaluate({ ptAge: '82', age_mitigated: true }).suppressed
        .some(t => t.startsWith('Age 82, frailty risk (mitigated:')));
});

test('three or more comorbidities is red, one or two is amber', () => {
    assert.equal(catOf({ comorb_copd: true, comorb_diabetes: true }), 'CAT 2');
    assert.equal(catOf({ comorb_copd: true, comorb_diabetes: true, comorb_hf: true }), 'CAT 1');
});

// --- Rules that were deliberately removed ---------------------------------------------------

test('removed rules produce nothing', () => {
    assert.equal(catOf({ bl_alb: '17' }), 'CAT 3', 'albumin');
    assert.equal(catOf({ e_bsl: '17' }), 'CAT 3', 'BSL 15-20');
    assert.equal(catOf({ d_pain: '8' }), 'CAT 3', 'pain score');
    assert.equal(catOf({ bl_hb: '65' }), 'CAT 3', 'low Hb absolute');
    assert.equal(catOf({ bl_cr_review: '180' }), 'CAT 3', 'Cr no longer opens the renal gate');
    assert.equal(catOf({ bl_inr: '3.2' }), 'CAT 3', 'INR is a check, not a risk');
});

test('a raised creatinine still surfaces as a check', () => {
    assert.ok(hasCheck({ bl_cr_review: '180' }, 'Cr 180 - confirm against baseline'));
});

// --- Infection ------------------------------------------------------------------------------

test('any single infection marker opens the gate at amber, never red', () => {
    assert.equal(catOf({ bl_wcc: '18' }), 'CAT 2');
    assert.equal(catOf({ bl_crp: '150' }), 'CAT 2');
    assert.equal(catOf({ bl_neut: '12', bl_lymph: '0.8' }), 'CAT 2');   // NLR 15
});

test('fever is the only thing that makes infection red, and says it once', () => {
    const r = evaluate({ e_temp: '38.9', bl_wcc: '18' });
    assert.equal(r.cat.text, 'CAT 1');
    assert.equal(r.red.filter(f => f.includes('38.9')).length, 1, 'fever stated once, not twice');
    assert.ok(r.amber.some(f => f.startsWith('Infection risk')));
});

test('downtrend suppression applies only when the score checks out', () => {
    const low = evaluate({ bl_wcc: '18', infection_downtrend: true, adds: '1' });
    assert.equal(low.cat.text, 'CAT 3');
    assert.ok(low.suppressed.some(t => t.includes('ADDS 1')));

    const high = evaluate({ bl_wcc: '18', infection_downtrend: true, adds: '5' });
    assert.equal(high.cat.text, 'CAT 1', 'the ADDS itself still stands');
    assert.ok(high.amber.some(f => f.startsWith('Infection risk')), 'infection is not discounted');
    assert.ok(high.issues.some(i => i.text.includes('not discounted')));
});

test('the antibiotic clause is gone from the suppression wording', () => {
    const r = evaluate({ bl_wcc: '18', infection_downtrend: true, adds: '1' });
    assert.ok(!r.suppressed.join(' ').toLowerCase().includes('antibiotic'));
});

test('downtrending markers are suggested, never applied', () => {
    const r = evaluate({ infection: true, bl_crp: '80', adds: '1' }, { prevBloods: { crp: '160' } });
    assert.match(r.downtrendSuggestion, /CRP 160 to 80/);
    assert.ok(r.amber.some(f => f.startsWith('Infection risk')), 'still counted until the clinician clicks');
});

// --- MODS -----------------------------------------------------------------------------------

test('a modification relaxes only the parameter it names', () => {
    const s = { chk_use_mods: true, mods_details: 'mods RR<45', b_rr: '28', e_bsl: '3.2' };
    const r = evaluate(s);
    assert.ok(!r.red.some(f => f.includes('Tachypnea')), 'RR is modified');
    assert.ok(r.issues.some(i => i.text.includes('Tachypnea RR 28 - MODS in use')), 'but still visible');
    assert.ok(r.red.some(f => f.includes('Low BSL')), 'BSL is untouched by an RR modification');
});

// --- Trends ---------------------------------------------------------------------------------

test('worsening creatinine flags, and is suppressed by known CKD', () => {
    const ctx = { prevBloods: { cr_review: '120' } };
    assert.ok(hasFlag({ bl_cr_review: '180', renal: true }, 'Worsening Cr 120 to 180', ctx));
    assert.ok(!hasFlag({ bl_cr_review: '180', renal: true, renal_chronic: true }, 'Worsening Cr', ctx));
});

test('rising CRP flags; a small drift does not', () => {
    assert.ok(hasFlag({ bl_crp: '140' }, 'Rising CRP 60 to 140', { prevBloods: { crp: '60' } }));
    assert.ok(!hasFlag({ bl_crp: '68' }, 'Rising CRP', { prevBloods: { crp: '60' } }));
});

test('falling Hb adds context to a tachycardia without naming a cause', () => {
    const r = evaluate({ c_hr: '118', bl_hb: '94' }, { prevBloods: { hb: '118' } });
    assert.ok(r.amber.some(f => f === 'Tachycardia HR 118 with falling Hb 118 to 94'));
    assert.ok(!r.amber.join(' ').toLowerCase().includes('bleed'), 'describes, does not diagnose');
});

test('interpretive blood rules stand down when bloods were not checked', () => {
    assert.equal(catOf({ bl_wcc: '18', bloods_status: 'not_checked' }), 'CAT 3');
    assert.equal(catOf({ bl_wcc: '18', chk_bloods_nil_sig: true }), 'CAT 3');
    assert.ok(!hasCheck({ bl_mg: '0.85', bloods_status: 'not_checked' }, 'consider replacement'));
});

test('life-threatening electrolytes fire regardless of the bloods status', () => {
    // Deliberate asymmetry, and worth stating out loud: a potassium of 6.4 on screen is worth
    // acting on even if someone ticked "not checked this review". Flagged for review - see
    // ALERT_Risk_Rule_Decisions.md - because the split is currently by accident, not design.
    assert.equal(catOf({ bl_k: '6.4', bloods_status: 'not_checked' }), 'CAT 1');
    assert.equal(catOf({ bl_lac_review: '5.0', bloods_status: 'not_checked' }), 'CAT 1');
});

// --- Deconditioning -------------------------------------------------------------------------

test('a long stay alone is not counted', () => {
    const r = evaluate({ icuLos: '6' });
    assert.equal(r.cat.text, 'CAT 3');
    assert.ok(r.suppressed.some(t => t.includes('6-day ICU stay')));
});

test('a long stay plus anything else is red', () => {
    const r = evaluate({ icuLos: '6', bl_wcc: '18' });
    assert.equal(r.cat.text, 'CAT 1');
    assert.ok(r.red.some(f => f === 'Deconditioning risk - 6-day ICU stay'));
});

test('the LOS mitigator stops the escalation', () => {
    assert.equal(catOf({ icuLos: '6', bl_wcc: '18' }), 'CAT 1');
    assert.equal(catOf({ icuLos: '6', bl_wcc: '18', los_mitigated: true }), 'CAT 2');
});

test('the LOS mitigator does not apply to an immobile patient', () => {
    // "Trajectory to recovery established" is not something anyone can say about a patient who
    // isn't mobile, so the claim is ignored rather than half-applied. The control is hidden in
    // the interface at the same time.
    const r = evaluate({ icuLos: '6', bl_wcc: '18', los_mitigated: true, immobility: true });
    assert.equal(r.cat.text, 'CAT 1');
    assert.ok(r.red.some(f => f === 'Deconditioning risk - 6-day ICU stay, immobile'));
});

test('immobility and long stay produce one line, not two', () => {
    const r = evaluate({ icuLos: '6', immobility: true });
    const decon = [...r.red, ...r.amber, ...r.suppressed].filter(t => t.includes('Deconditioning'));
    assert.equal(decon.length, 1);
});

test('a flag containing the letters "age" still counts as another risk', () => {
    // The old test excluded anything matching /age/, which caught "haemorrhage".
    const r = evaluate({ icuLos: '6', ptAge: '82' });
    assert.equal(r.cat.text, 'CAT 2', 'age alone does not escalate a long stay');
});

// --- Renal ----------------------------------------------------------------------------------

test('known CKD suppresses the renal gate unless something acute overrides it', () => {
    const base = { renal: true, bl_cr_review: '260', renal_oliguria: true };
    assert.equal(catOf(base), 'CAT 1');
    assert.equal(catOf({ ...base, renal_chronic: true }), 'CAT 3');
    assert.equal(catOf({ ...base, renal_chronic: true, renal_dysfunction: true }), 'CAT 2',
        'an AKI on top of CKD still counts');
});

test('dialysis type reaches the rules', () => {
    const r = evaluate({ renal: true, renal_dialysis: true, dialysis_type: 'new' });
    assert.ok(r.amber.concat(r.red).some(f => f.includes('acute dialysis')));
});

// --- After hours ----------------------------------------------------------------------------

test('after-hours is derived from the stepdown time and drops off after 24h', () => {
    assert.equal(evaluate({ stepdownDate: '2026-08-05', stepdownTime: '20:00' }).afterHoursDerived, true);
    assert.equal(evaluate({ stepdownDate: '2026-08-05', stepdownTime: '11:00' }).afterHoursDerived, false);
    assert.equal(evaluate(FRIDAY_2000).afterHoursDerived, false, 'past 24h, the home team has seen them');
});

test('a manual after-hours answer is left alone', () => {
    const r = evaluate({ after_hours: true, ...FRIDAY_2000 }, { afterHoursManual: true });
    assert.equal(r.afterHoursDerived, null);
    assert.ok(r.amber.includes('Discharged after-hours'));
});

// --- Category and override --------------------------------------------------------------------

test('any red makes CAT 1; any amber with no red makes CAT 2', () => {
    assert.equal(catOf({ adds: '4', bl_mg: '0.6' }), 'CAT 1');
    assert.equal(catOf({ bl_mg: '0.6' }), 'CAT 2');
});

test('a downgrade needs a reason, and records what it overruled', () => {
    assert.equal(catOf({ adds: '4', override: 'green' }), 'CAT 1', 'no reason, no downgrade');
    const r = evaluate({ adds: '4', override: 'green', overrideNote: 'known chronic, at baseline' });
    assert.equal(r.cat.text, 'CAT 3');
    assert.equal(r.cat.downgradedFrom, 'CAT 1');
    assert.equal(r.red.length, 1, 'the evidence is still listed');
});

test('an upgrade override is itself a flag', () => {
    assert.equal(catOf({ override: 'red', overrideNote: 'gut feeling' }), 'CAT 1');
    assert.ok(hasFlag({ override: 'red', overrideNote: 'gut feeling' }, 'gut feeling'));
});

// --- Whole patients ---------------------------------------------------------------------------
// Shapes drawn from real reviews, with every number replaced.

test('post-op day 2, long stay, resolving infection markers', () => {
    const r = evaluate({
        ptAge: '63', icuLos: '6', ...YESTERDAY_0800,
        adds: '0', bl_wcc: '21.5', bl_cr_review: '195', renal: true,
        bl_k: '3.8', bl_na: '141', bl_mg: '0.9'
    });
    assert.equal(r.cat.text, 'CAT 1');
    assert.ok(r.red.some(f => f.includes('Deconditioning risk - 6-day ICU stay')));
});

test('haematology patient: pancytopenia is expected, low platelets are not', () => {
    const r = evaluate({
        ptAge: '71', icuLos: '5', adds: '0',
        bl_hb: '74', bl_wcc: '0.2', bl_plts: '11', bl_neut: '0.05'
    });
    assert.ok(!r.red.concat(r.amber).some(f => f.includes('Low Hb')), 'Hb is expected and not flagged');
    assert.ok(r.amber.some(f => f === 'Low platelets Plts 11'));
});

test('stable pre-stepdown patient with a modification is not escalated by it', () => {
    const r = evaluate({
        reviewType: 'pre', ptAge: '58', icuLos: '2',
        chk_use_mods: true, mods_details: 'MODS for HR<120', adds: '1', c_hr: '112'
    });
    assert.equal(r.cat.text, 'CAT 3');
});

// --- Cumulative PICS risk score ---------------------------------------------------------------
// Local instrument (Dhanju, 2026). It is a recovery-trajectory score, not a readmission score,
// so the thing most of these fixtures pin down is what it does *not* do to the category.

// Ticking a derived item by hand is a click in the tool, and a click marks the item as the
// clinician's. Fixtures that set one directly have to say so, or the derivation still wins.
const DERIVED = ['pics_p02', 'pics_p03', 'pics_p07', 'pics_p08', 'pics_p10'];
const byHand = (overrides) => ({
    ...overrides,
    pics_manual: overrides.pics_manual
        || DERIVED.filter(id => Object.prototype.hasOwnProperty.call(overrides, id))
});
const picsOf = (overrides) => evaluate(overrides).pics;

test('the score adds up its items and lands in the right band', () => {
    assert.equal(picsOf({}).score, 0);
    assert.equal(picsOf({}).band, 'low');

    // 3 + 2 = 5, one short of high.
    const moderate = picsOf({ pics_p01: true, pics_p04: true });
    assert.equal(moderate.score, 5);
    assert.equal(moderate.band, 'moderate');

    // 3 + 3 = 6.
    const high = picsOf(byHand({ pics_p01: true, pics_p02: true }));
    assert.equal(high.score, 6);
    assert.equal(high.band, 'high');
});

test('the band boundaries sit at 3 and 6', () => {
    assert.equal(picsOf(byHand({ pics_p09: true, pics_p10: true })).band, 'low');             // 2
    assert.equal(picsOf(byHand({ pics_p09: true, pics_p10: true, pics_p11: true })).band, 'moderate'); // 3
    assert.equal(picsOf({ pics_p04: true, pics_p05: true, pics_p09: true }).band, 'moderate'); // 5
    assert.equal(picsOf({ pics_p04: true, pics_p05: true, pics_p06: true }).band, 'high');     // 6
});

test('high risk is one amber, moderate is a check item, low is silent', () => {
    // Ticked by hand so the derivations are not what is under test here.
    const high = byHand({ pics_p01: true, pics_p02: true });
    assert.equal(catOf(high), 'CAT 2');
    assert.ok(hasFlag(high, 'PICS high risk - score 6'));

    const moderate = { pics_p01: true };
    assert.equal(catOf(moderate), 'CAT 3', 'moderate does not move the category');
    assert.ok(hasCheck(moderate, 'PICS moderate risk - score 3'));
    assert.ok(!flagsOf(moderate).some(f => f.includes('PICS')), 'and raises no flag');

    assert.ok(!flagsOf({ pics_p09: true }).some(f => f.includes('PICS')));
});

test('the score never reaches red, whatever is ticked', () => {
    const everything = {};
    for (let i = 1; i <= 11; i++) everything[`pics_p${String(i).padStart(2, '0')}`] = true;
    everything.pics_manual = DERIVED;
    const r = evaluate(everything);
    assert.equal(r.pics.score, 21);
    assert.ok(!r.red.some(f => f.includes('PICS')));
    assert.equal(r.cat.text, 'CAT 2');
});

test('the flag names the items behind the number', () => {
    const flag = flagsOf(byHand({ pics_p01: true, pics_p02: true })).find(f => f.startsWith('PICS high risk'));
    assert.ok(flag.includes('mechanical ventilation >48h'));
    assert.ok(flag.includes('CAM-ICU positive'));
});

// --- Derivation -------------------------------------------------------------------------------

test('each derived item fires from its own field and nothing else', () => {
    assert.ok(picsOf({ icuLos: '5' }).items.find(i => i.id === 'pics_p08').ticked, 'LOS >3 days');
    assert.ok(!picsOf({ icuLos: '3' }).items.find(i => i.id === 'pics_p08').ticked, 'exactly 3 is not >3');

    assert.ok(picsOf({ neuro_gate: true, neuroType: 'Delirium' }).items.find(i => i.id === 'pics_p02').ticked);
    assert.ok(!picsOf({ neuro_gate: true, neuroType: 'Agitation' }).items.find(i => i.id === 'pics_p02').ticked);

    assert.ok(picsOf({ frailty_known: true }).items.find(i => i.id === 'pics_p03').ticked);
    assert.ok(picsOf({ sleep_quality: true }).items.find(i => i.id === 'pics_p10').ticked);

    // Immobility alone is not >48h - the stay has to be long enough for the claim to hold.
    assert.ok(!picsOf({ immobility: true, icuLos: '1' }).items.find(i => i.id === 'pics_p07').ticked);
    assert.ok(picsOf({ immobility: true, icuLos: '4' }).items.find(i => i.id === 'pics_p07').ticked);
});

test('an auto-ticked item says it was auto-ticked, and where from', () => {
    const item = picsOf({ icuLos: '5' }).items.find(i => i.id === 'pics_p08');
    assert.equal(item.auto, true);
    assert.equal(item.derivedFrom, 'ICU LOS');
    // Ticked by hand, same value, but not the tool's doing.
    assert.equal(picsOf({ pics_p01: true }).items.find(i => i.id === 'pics_p01').auto, false);
});

test('a clinician override beats the derivation in both directions', () => {
    // Untick something the tool derived.
    const off = picsOf({ icuLos: '9', pics_p08: false, pics_manual: ['pics_p08'] });
    assert.ok(!off.items.find(i => i.id === 'pics_p08').ticked);
    assert.equal(off.score, 0);

    // Tick something the tool did not derive - the item asks about the whole admission.
    const on = picsOf({ icuLos: '1', pics_p08: true, pics_manual: ['pics_p08'] });
    assert.ok(on.items.find(i => i.id === 'pics_p08').ticked);
    assert.equal(on.score, 1);
});

test('suggestions offer without setting, and stop once the item is answered', () => {
    // Noradrenaline was recorded, but the dose - which is what P-06 turns on - never was.
    const sug = picsOf({ pressor_recent_norad: true });
    assert.ok(!sug.items.find(i => i.id === 'pics_p06').ticked);
    assert.ok(sug.suggestions.some(x => x.id === 'pics_p06'));

    // A psychological concern is not a pre-existing diagnosis, so P-03 asks rather than ticks.
    const psych = picsOf({ neuro_psych: true });
    assert.ok(!psych.items.find(i => i.id === 'pics_p03').ticked);
    assert.ok(psych.suggestions.some(x => x.id === 'pics_p03'));
    // Frailty answers it outright, so there is nothing left to ask.
    assert.ok(!picsOf({ neuro_psych: true, frailty_known: true }).suggestions.some(x => x.id === 'pics_p03'));

    // Answered either way, the prompt goes.
    assert.ok(!picsOf({ pressor_recent_norad: true, pics_p06: true }).suggestions.length);
    assert.ok(!picsOf({ pressor_recent_norad: true, pics_p06: false, pics_manual: ['pics_p06'] }).suggestions.length);
});

// --- Compatibility with what came before ------------------------------------------------------

test('a session saved before the score still flags on its Positive/Negative answer', () => {
    assert.equal(catOf({ pics: 'positive' }), 'CAT 2');
    assert.ok(hasFlag({ pics: 'positive' }, 'Post ICU Syndrome Positive'));
    assert.equal(catOf({ pics: 'negative' }), 'CAT 3');
});

test('the legacy flag stands down once the score is doing the work', () => {
    // Score already says high; the old wording would be a second line about the same thing.
    const r = evaluate(byHand({ pics: 'positive', pics_p01: true, pics_p02: true }));
    assert.ok(!r.amber.includes('Post ICU Syndrome Positive'));
    assert.equal(r.amber.filter(f => f.includes('PICS') || f.includes('Post ICU')).length, 1);
});

test('the binary status is derived from the score for anything downstream', () => {
    assert.equal(picsOf({}).status, 'negative');
    assert.equal(picsOf({ pics_p01: true }).status, 'positive');
});

test('a derived item retracts when its field changes back', () => {
    // The previous render wrote this tick onto the form; correcting the LOS has to undo it.
    const stale = picsOf({ icuLos: '1', pics_p08: true });
    assert.ok(!stale.items.find(i => i.id === 'pics_p08').ticked);
    assert.equal(stale.score, 0);
});
