import { $, num, sentenceCase, joinGrammatically } from './utils.js';
import { comorbMap, toggleInputs } from './config.js';
import { getState, isQuickReviewMode, initialQuickReviewRisks, quickReviewBaselineCaptured, setQuickReviewBaselineCaptured, previousCategoryData } from './state.js';
import { exitQuickReviewMode, updateSidebarRiskBadges } from './ui.js';

export function calculateWardTime(dateStr, timeOfDay, isPre) {
    if (isPre) return { hours: 0, text: '(Pre-Stepdown)' };
    if (!dateStr) return { hours: 0, text: '' };

    const h = { 'Morning': 9, 'Afternoon': 15, 'Evening': 18, 'Night': 21 }[timeOfDay] || 18;

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

export function computeAll() {
    try {
        const s = getState();
        console.log('computeAll called, state keys:', Object.keys(s).length);
        const red = [], amber = [];
        const suppressedRisks = [];
        const flagged = { red: [], amber: [] };

        const pmhSubtitle = $('pmh_subtitle');
        const hasComorbidities = Object.keys(comorbMap).some(key => s[key]);
        const hasPmhNote = s.pmh_note && s.pmh_note.trim().length > 0;
        if (pmhSubtitle) {
            pmhSubtitle.style.display = (hasComorbidities || hasPmhNote) ? 'block' : 'none';
        }

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

        const fn = $('footerName'); if (fn) fn.textContent = s.ptName || '--';
        const fl = $('footerLocation'); if (fl) fl.textContent = `${s.ptWard || '--'} ${s.ptBed || ''}`;
        const fa = $('footerAdmission'); if (fa) fa.textContent = s.ptAdmissionReason || '--';

        const isPre = s.reviewType === 'pre';
        const timeData = calculateWardTime(s.stepdownDate, s.stepdownTime, isPre);
        const isRecent = isPre || (timeData.hours < 24);

        const timeOffEl = $('pressor_time_off_display');
        const recentKeys = ['pressor_recent_norad', 'pressor_recent_met', 'pressor_recent_gtn', 'pressor_recent_dob', 'pressor_recent_mid', 'pressor_recent_other'];
        const currentKeys = ['pressor_current_mid', 'pressor_current_other'];

        let hasRecent = recentKeys.some(k => s[k]);
        let hasCurrent = currentKeys.some(k => s[k]);

        if (timeOffEl) {
            if (hasRecent && s.pressor_ceased_time) {
                const now = new Date();
                const [cH, cM] = s.pressor_ceased_time.split(':');
                const ceasedDate = new Date();
                ceasedDate.setHours(cH, cM);
                if (ceasedDate > now) ceasedDate.setDate(ceasedDate.getDate() - 1);
                const diffMs = now - ceasedDate;
                const diffHrs = Math.floor(diffMs / 3600000);
                timeOffEl.textContent = `~${diffHrs} hrs ago`;
            } else {
                timeOffEl.textContent = '';
            }
        }

        if (hasCurrent || hasRecent) {
            let details = [];
            let currentList = [];
            currentKeys.forEach(k => {
                if (s[k]) {
                    let label = k.replace('pressor_current_', '').replace('mid', 'Midodrine');
                    if (k === 'pressor_current_other') label = `Other (${s.pressor_current_other_note || ''})`;
                    currentList.push(label);
                }
            });
            if (currentList.length > 0) {
                details.push(`Current vasoactive support - ${joinGrammatically(currentList)}`);
            }
            if (hasRecent) {
                let recentsList = [];
                recentKeys.forEach(k => {
                    if (s[k]) {
                        let label = k.replace('pressor_recent_', '').replace('norad', 'Noradrenaline').replace('met', 'Metaraminol').replace('gtn', 'GTN').replace('dob', 'Dobutamine').replace('mid', 'Midodrine');
                        if (k === 'pressor_recent_other') label = `Other (${s.pressor_recent_other_note || ''})`;
                        recentsList.push(label);
                    }
                });
                let recentPart = `Recent vasoactive support included ${joinGrammatically(recentsList)}`;
                if (s.pressor_ceased_time) recentPart += ` which was ceased at approximately ${s.pressor_ceased_time}`;
                details.push(recentPart);
            }
            add(amber, details.join('. '), 'seg_pressors', 'amber', s.pressors_note);
        }

        const adds = num(s.adds);
        if (adds !== null) {
            if (adds >= 6) add(red, `Elevated ADDS ${adds}`, 'adds', 'red');
            else if (adds >= 4) add(red, `Physiological instability ADDS ${adds}`, 'adds', 'red');
            else if (adds === 3 && isRecent) add(amber, `Observation required ADDS 3`, 'adds', 'amber');
        }

        const hr = num(s.c_hr);
        if (hr) {
            if (hr > 130) add(red, `Tachycardia HR ${hr}`, 'c_hr', 'red');
            else if (hr > 110) add(amber, `Tachycardia HR ${hr}`, 'c_hr', 'amber');
            else if (hr < 40) add(red, `Bradycardia HR ${hr}`, 'c_hr', 'red');
            else if (hr < 50) add(amber, `Bradycardia HR ${hr}`, 'c_hr', 'amber');
        }

        const bpStr = s.c_nibp;
        if (bpStr) {
            const sbp = parseFloat(bpStr.split('/')[0]);
            if (!isNaN(sbp)) {
                if (sbp < 90) add(red, `Hypotension SBP ${sbp}`, 'c_nibp', 'red');
            }
        }

        const rr = num(s.b_rr);
        if (rr) {
            if (rr > 25) add(red, `Tachypnea RR ${rr}`, 'b_rr', 'red');
            else if (rr > 20) add(amber, `Mild tachypnea RR ${rr}`, 'b_rr', 'amber');
            else if (rr < 8) add(red, `Bradypnea RR ${rr}`, 'b_rr', 'red');
        }

        const spo2Str = s.b_spo2 ? s.b_spo2.replace('%', '') : '';
        const spo2 = num(spo2Str);
        if (spo2 && spo2 < 88) add(red, `Hypoxia SpO2 ${spo2}%`, 'b_spo2', 'red');

        const temp = num(s.e_temp);
        if (temp) {
            if (temp > 38.5) add(red, `Pyrexia Temp ${temp}`, 'e_temp', 'red');
            else if (temp < 35.5) add(red, `Hypothermia Temp ${temp}`, 'e_temp', 'red');
        }

        const oxDevInput = $('b_device');
        if (oxDevInput && oxDevInput.dataset.manual !== 'true') {
            let devStr = '';
            const mode = s.oxMod;
            if (mode === 'RA') devStr = 'RA';
            else if (mode === 'NP') devStr = `NP ${s.npFlow || ''}L`;
            else if (mode === 'HFNP') devStr = `HFNP ${s.hfnpFio2 || ''}%/${s.hfnpFlow || ''}L`;
            else if (mode === 'NIV') devStr = `NIV ${s.nivFio2 || ''}%`;
            else if (mode === 'Trache') devStr = `Trache (${s.tracheStatus || ''})`;
            if (devStr) oxDevInput.value = devStr;
        }

        if (s.resp_concern === true) {
            let parts = [], hasRed = false;
            if (s.oxMod === 'NP') {
                const flow = num(s.npFlow);
                if (flow >= 3) { parts.push(`high flow NP ${flow}L`); flagged.red.push('npFlow'); hasRed = true; }
                else if (flow >= 2) { parts.push(`NP ${flow}L`); flagged.amber.push('npFlow'); }
            } else if (s.oxMod === 'HFNP') {
                const fio2 = num(s.hfnpFio2);
                if (fio2 >= 60) { parts.push(`HFNP - high FiO2 ${fio2}%`); flagged.red.push('oxMod'); hasRed = true; }
                else { parts.push(`HFNP requirement`); flagged.red.push('oxMod'); hasRed = true; }
            } else if (s.oxMod === 'NIV') {
                const fio2 = num(s.nivFio2);
                if (fio2 >= 60) { parts.push(`NIV - high FiO2 ${fio2}%`); flagged.red.push('oxMod'); hasRed = true; }
                else { parts.push(`NIV requirement`); flagged.red.push('oxMod'); hasRed = true; }
            } else if (s.oxMod === 'Trache') {
                if (s.tracheStatus === 'New') { parts.push(`new or unstable tracheostomy`); flagged.red.push('tracheStatus'); hasRed = true; }
                else { parts.push(`tracheostomy`); flagged.amber.push('oxMod'); }
            } else if (s.oxMod === 'RA') {
            }
            if (s.resp_dyspnea === true) {
                const dysp = s.dyspneaConcern;
                if (dysp === 'severe' || dysp === 'moderate') { parts.push(`${dysp} dyspnea`); flagged.red.push('dyspneaConcern'); hasRed = true; }
                else if (dysp === 'mild') { parts.push(`mild dyspnea`); flagged.amber.push('dyspneaConcern'); }
                else if (!dysp) { parts.push(`dyspnea`); flagged.amber.push('seg_resp_dyspnea'); }
            }
            if (s.resp_tachypnea === true) { parts.push('tachypnea >20bpm'); flagged.red.push('seg_resp_tachypnea'); hasRed = true; }
            if (s.resp_rapid_wean === true) { parts.push('rapid O2 wean <12hrs'); flagged.red.push('seg_resp_rapid_wean'); hasRed = true; }
            if (s.resp_poor_cough === true) { parts.push('poor cough effort'); flagged.amber.push('seg_resp_poor_cough'); }
            if (s.resp_poor_swallow === true) { parts.push('poor swallow'); flagged.amber.push('seg_resp_poor_swallow'); }

            if (s.hist_o2 === true) { parts.push('recent high O2/NIV requirement <12hrs'); flagged.red.push('seg_hist_o2'); hasRed = true; }

            if (s.intubated === true) {
                const reason = $('intubatedReason')?.querySelector('.active')?.dataset.value;
                if (reason === 'concern') { parts.push('intubated <24hrs ago'); flagged.red.push('seg_intubated'); hasRed = true; }
                else { parts.push('intubated <24hrs ago (elective)'); flagged.amber.push('seg_intubated'); }
            }

            if (s.dyspneaConcern_note && parts.length > 0) {
                parts[parts.length - 1] += `. Note: ${s.dyspneaConcern_note}`;
            }

            if (parts.length > 0) {
                const joined = joinGrammatically(parts);
                const finalTxt = `Respiratory concern - ${joined}`;
                if (hasRed) red.push(finalTxt); else amber.push(finalTxt);
            } else {
                add(amber, 'Respiratory concern - details required', 'seg_resp_concern', 'amber', s.dyspneaConcern_note);
            }
        }

        if (s.after_hours === true) add(amber, 'Discharged after-hours', 'seg_after_hours', 'amber', s.after_hours_note);
        if (s.hac === true) add(amber, 'Hospital acquired complication', 'seg_hac', 'amber', s.hac_note);

        if (s.neuro_gate === true) {
            let txt = "Neurological concern";
            const gcsInput = s.d_alert;
            const type = s.neuroType;
            const severity = s.neuroConcern;
            let details = [];
            if (gcsInput && gcsInput.toLowerCase().includes('gcs')) details.push(gcsInput);
            if (type) details.push(type.toLowerCase());
            if (details.length > 0) txt += ` with ${joinGrammatically(details)}`;

            const isRed = (severity === 'severe');
            add(isRed ? red : amber, sentenceCase(txt), 'neuroConcern', isRed ? 'red' : 'amber', s.neuroType_note);
        }

        const k = num(s.bl_k);
        if (s.electrolyte_gate === true || (k && (k < 3.0 || k > 6.0))) {
            let msg = "Electrolyte concern", isRed = false;
            let parts = [];
            if (k) {
                if (k > 6.0) { parts.push(`high K+ ${k}`); isRed = true; }
                else if (k < 3.0) { parts.push(`low K+ ${k}`); isRed = true; }
            }
            const na = num(s.bl_na);
            if (na && (na < 125 || na > 155)) {
                if (na < 125) parts.push(`low Na ${na}`);
                else parts.push(`high Na ${na}`);
                isRed = true;
            }
            const sev = s.electrolyteConcern;
            if (sev === 'severe') {
                if (parts.length === 0) parts.push("severe derangement");
                isRed = true;
            } else if (sev === 'mild' && parts.length === 0) {
                parts.push("mild/moderate derangement");
            }
            if (parts.length > 0) msg += ` with ${joinGrammatically(parts)}`;
            add(isRed ? red : amber, msg, 'electrolyteConcern', isRed ? 'red' : 'amber', s.electrolyteConcern_note);
        }

        const cr = num(s.bl_cr_review) || num(s.cr_review);
        const renalOpen = (s.renal === true) || (cr && cr > 150);

        if (renalOpen) {
            const fluidFlags = [];
            const renalFlags = [];

            if (s.renal_fluid) fluidFlags.push('fluid overload');
            if (s.renal_oedema) fluidFlags.push('oedema');
            if (s.renal_dehydrated) fluidFlags.push('dehydrated');

            if (s.renal_oliguria) renalFlags.push('oliguria <0.5ml/kg/hr');
            if (s.renal_anuria) renalFlags.push('anuria');
            if (s.renal_dysfunction) renalFlags.push('AKI');
            if (cr > 150) renalFlags.push(`Cr ${cr}`);

            if (s.renal_dialysis) {
                const dType = $('dialysis_type')?.querySelector('.active')?.dataset.value;
                if (dType === 'new') renalFlags.push('acute dialysis');
                else renalFlags.push('chronic dialysis');
            }

            const hasFluid = fluidFlags.length > 0;
            const hasRenal = renalFlags.length > 0;

            let label = "Renal concern";
            if (hasFluid && hasRenal) label = "Renal and fluid concern";
            else if (hasFluid && !hasRenal) label = "Fluid concern";

            const allFlags = [...renalFlags, ...fluidFlags];
            if (allFlags.length > 0) label += ` with ${joinGrammatically(allFlags)}`;

            const overrideChips = [
                s.renal_oliguria, s.renal_anuria, s.renal_dysfunction,
                s.renal_fluid, s.renal_oedema, s.renal_dehydrated
            ];

            const dType = $('dialysis_type')?.querySelector('.active')?.dataset.value;
            if (s.renal_dialysis && dType === 'new') overrideChips.push(true);

            const isForceAmber = overrideChips.some(x => x === true);
            const isMitigated = (s.renal_chronic === true);

            if (isMitigated && !isForceAmber) {
                suppressedRisks.push(`${label} (mitigated: known CKD and Cr around baseline)`);
            } else {
                const critical = s.renal_anuria || cr > 200 || (hasFluid && hasRenal && s.renal_dysfunction);
                if (critical) add(red, label, 'seg_renal', 'red', s.renal_note);
                else add(amber, label, 'seg_renal', 'amber', s.renal_note);
            }
        }

        const wcc = num(s.bl_wcc) || num(s.wcc);
        const crp = num(s.crp) || num(s.bl_crp);
        const nlrVal = (neut > 0 && lymph > 0) ? (neut / lymph) : 0;

        const autoTrigger = (wcc && (wcc > 15 || wcc < 2)) ||
            (temp && temp > 38) ||
            (crp && crp > 100) ||
            (nlrVal > 10);

        const manualConcern = s.infection === true;

        if (autoTrigger || manualConcern) {
            let markers = [], isRed = false;

            if (crp > 100) isRed = true;
            if (temp > 38.5) isRed = true;
            if (nlrVal > 10) isRed = true;

            if (wcc !== null && (wcc < 3 || wcc > 15)) markers.push(`WCC ${wcc}`);
            else if (wcc !== null && (wcc > 11)) markers.push(`WCC ${wcc}`);

            if (crp > 100) markers.push(`CRP ${crp}`);
            else if (crp > 50) markers.push(`CRP ${crp}`);

            if (temp > 38.5) markers.push(`Temp ${temp}`);
            else if (temp > 37.8) markers.push(`Temp ${temp}`);

            if (nlrVal > 10) markers.push(`NLR ${nlrVal.toFixed(1)}`);

            let msg = isRed ? "Infection risk" : "Infection risk";
            if (markers.length) msg += ` with ${joinGrammatically(markers)}`;

            const shouldSuppress = (s.infection_downtrend === true);

            if (shouldSuppress) {
                suppressedRisks.push("Infection risk (however, infection markers downtrending, ADDS low and the patient is on appropriate antibiotics)");
            } else {
                add(isRed ? red : amber, msg, 'seg_infection', isRed ? 'red' : 'amber', s.infection_note);
            }
        }

        if (s.immobility === true) {
            const icuLos = num(s.icuLos) || 0;
            if (icuLos >= 4) add(red, `Immobility concern - prolonged ICU stay`, 'seg_immobility', 'red', s.immobility_note);
            else add(amber, 'Immobility concern', 'seg_immobility', 'amber', s.immobility_note);
        }

        const hb = num(s.hb) || num(s.bl_hb);
        if (hb && hb <= 70) add(red, `Low Hb ${hb}`, 'hb_wrapper', 'red');
        else if (hb && hb <= 90 && s.hb_dropping) add(amber, `Low Hb ${hb} and dropping`, 'hb_wrapper', 'amber');

        const alb = num(s.bl_alb);
        if (alb && alb < 20) add(amber, `Low albumin Alb ${alb}`, 'bl_alb', 'amber');

        const plts = num(s.bl_plts);
        if (plts && plts < 100) add(amber, `Low platelets Plts ${plts}`, 'bl_plts', 'amber');

        const inr = num(s.bl_inr);
        if (inr && inr > 3.5) add(red, `High INR ${inr}`, 'bl_inr', 'red');
        else if (inr && inr > 2.5) add(amber, `Elevated INR ${inr}`, 'bl_inr', 'amber');

        const egfr = num(s.bl_egfr);
        if (egfr && egfr < 30) add(amber, `Low eGFR ${egfr}`, 'bl_egfr', 'amber');

        const bsl = num(s.e_bsl);
        if (bsl) {
            if (bsl < 4.0) add(red, `Low BSL ${bsl}`, 'e_bsl', 'red');
            else if (bsl > 20) add(red, `High BSL ${bsl}`, 'e_bsl', 'red');
            else if (bsl >= 15) add(amber, `High BSL ${bsl}`, 'e_bsl', 'amber');
        }

        const painScore = num(s.d_pain);
        if (painScore >= 7) {
            add(amber, `Pain not well controlled with score of ${painScore} out of 10`, 'neuro_section', 'amber', null);
        }

        if (window.prevBloods && window.prevBloods.cr_review && !s.renal_worsening_cr) {
            const prevCr = num(window.prevBloods.cr_review);
            const currCr = cr;
            if (currCr && prevCr && currCr > prevCr) {
                const percentChange = ((currCr - prevCr) / prevCr) * 100;
                if (percentChange > 30 || (currCr - prevCr) > 30) {
                    const chipEl = $('toggle_renal_worsening_cr');
                    if (chipEl && chipEl.dataset.value === 'false') {
                        chipEl.click();
                    }
                }
            }
        }

        if (s.renal_worsening_cr && window.prevBloods && window.prevBloods.cr_review) {
            const prevCr = num(window.prevBloods.cr_review);
            const currCr = cr;
            if (currCr && prevCr && currCr > prevCr) {
                const percentChange = ((currCr - prevCr) / prevCr) * 100;
                if (percentChange > 30 || (currCr - prevCr) > 30) {
                    add(amber, `Worsening Cr ${prevCr}→${currCr}`, 'bl_cr_review', 'amber');
                }
            }
        }

        if (s.nutrition_adequate === false) {
            add(amber, `Inadequate nutrition`, 'diet_section', 'amber', s.nutrition_context_note);
        }

        if (s.neuro_psych) {
            add(amber, `Psychological concern`, 'neuro_section', 'amber', s.neuro_psych_note);
        }

        if (s.pics === 'positive') {
            add(amber, `Post ICU Syndrome Positive`, 'seg_pics', 'amber', s.pics_note);
        }

        const activeComorbsKeys = toggleInputs.filter(k => k.startsWith('comorb_') && s[k]);
        const countComorbs = activeComorbsKeys.length;
        if (countComorbs >= 3) {
            add(red, sentenceCase('Multiple comorbidities'), null, 'red', null);
            flagged.red.push('comorbs_wrapper');
        } else if (countComorbs > 0) {
            const cList = activeComorbsKeys.map(k => {
                if (k === 'comorb_other' && s.comorb_other_note) return s.comorb_other_note.toLowerCase();
                return comorbMap[k].toLowerCase();
            });
            add(amber, sentenceCase(`Comorbidities including ${joinGrammatically(cList)}`), null, 'amber', null);
            flagged.amber.push('comorbs_wrapper');
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

        const catText = $('catText'); if (catText) { catText.className = `status ${cat.id}`; catText.textContent = cat.text; }
        const catBox = $('categoryBox'); if (catBox) catBox.style.borderColor = `var(--${cat.id})`;
        const rc = $('redCount'); if (rc) { rc.textContent = redCount; rc.style.color = redCount ? 'var(--red)' : ''; }
        const ac = $('amberCount'); if (ac) { ac.textContent = amberCount; ac.style.color = amberCount ? 'var(--amber)' : ''; }
        const stickyScore = $('footerScore');
        if (stickyScore) { stickyScore.className = `footer-score tag ${cat.id}`; stickyScore.textContent = cat.text; }

        updateSidebarRiskBadges(redCount, amberCount);

        if (isQuickReviewMode) {
            if (!quickReviewBaselineCaptured) {
                initialQuickReviewRisks.red = [...uniqueRed];
                initialQuickReviewRisks.amber = [...uniqueAmber];
                setQuickReviewBaselineCaptured(true);
            } else {
                const newRed = uniqueRed.filter(r => !initialQuickReviewRisks.red.includes(r));
                const newAmber = uniqueAmber.filter(r => !initialQuickReviewRisks.amber.includes(r));

                if (newRed.length > 0 || newAmber.length > 0) {
                    const newRedCount = newRed.length;
                    const newAmberCount = newAmber.length;
                    exitQuickReviewMode();

                    const alertDiv = document.createElement('div');
                    alertDiv.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:9999; background:var(--red); color:white; padding:24px 32px; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.3); font-size:1.1rem; font-weight:700; text-align:center; min-width:400px;';
                    alertDiv.innerHTML = `
                        <div style="font-size:2rem; margin-bottom:12px;">⚠️</div>
                        <div style="margin-bottom:8px;">NEW RISK DETECTED</div>
                        <div style="font-size:0.9rem; font-weight:500; opacity:0.95;">Quick Review Mode Exited</div>
                        <div style="font-size:0.85rem; margin-top:12px; opacity:0.9;">${newRedCount > 0 ? newRedCount + ' NEW RED' : newAmberCount + ' NEW AMBER'} risk factor(s)</div>
                    `;
                    document.body.appendChild(alertDiv);

                    setTimeout(() => {
                        alertDiv.style.transition = 'opacity 0.3s';
                        alertDiv.style.opacity = '0';
                        setTimeout(() => alertDiv.remove(), 300);
                    }, 3000);

                    setTimeout(() => {
                        const riskSection = $('section-risk');
                        if (riskSection) riskSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 500);
                }
            }
        }

        const listEl = $('flagList');
        if (listEl) {
            let html = [
                ...uniqueRed.map(t => `<div style="color:var(--red); font-weight:700;">${t}</div>`),
                ...uniqueAmber.map(t => `<div style="color:var(--amber); font-weight:700;">${t}</div>`),
                ...suppressedRisks.map(t => `<div style="color:var(--muted); font-style:italic; border-left:2px solid var(--muted); padding-left:6px;">${t}</div>`)
            ];

            if (html.length === 0) listEl.innerHTML = '<div style="color:var(--muted)">No risk factors identified</div>';
            else listEl.innerHTML = html.join('');
        }

        document.querySelectorAll('.flag-red, .flag-amber').forEach(e => e.classList.remove('flag-red', 'flag-amber'));
        flagged.red.forEach(id => {
            const el = $(id);
            if (el) {
                if (id.endsWith('_wrapper')) {
                    el.classList.add('flag-red');
                } else {
                    el.closest('.toggle-label, .input-box, .question-row')?.classList.add('flag-red');
                }
            }
        });
        flagged.amber.forEach(id => {
            const el = $(id);
            if (el) {
                if (id.endsWith('_wrapper')) {
                    el.classList.add('flag-amber');
                } else {
                    el.closest('.toggle-label, .input-box, .question-row')?.classList.add('flag-amber');
                }
            }
        });

        let planHtml = '';
        const hoursSinceStep = timeData.hours;

        const disPrompt = $('discharge_prompt');
        const disMsg = $('discharge_msg');
        const chkDischarge = $('chk_discharge_alert');
        const disWrap = $('chk_discharge_wrapper');

        if (disPrompt) {
            const alreadyChecked = chkDischarge && chkDischarge.checked;
            const dismissed = window.dismissedDischarge === true;
            const isPost = s.reviewType === 'post';

            let showPrompt = false;

            if (isPost && !alreadyChecked && !dismissed) {
                if (cat.id === 'green' && hoursSinceStep >= 12) {
                    showPrompt = true;
                }
                else if (cat.id === 'amber' && hoursSinceStep >= 48) showPrompt = true;
                else if (cat.id === 'red' && hoursSinceStep >= 72) showPrompt = true;
            }

            if (showPrompt) {
                disPrompt.style.display = 'block';
                disPrompt.style.borderColor = `var(--${cat.id})`;
                if (cat.id === 'green') disPrompt.style.borderColor = `var(--green)`;

                let colorName = "Green";
                if (cat.id === 'amber') colorName = "Amber";
                if (cat.id === 'red') colorName = "Red";

                let hoursTxt = Math.round(hoursSinceStep) + " hours";

                if (cat.id === 'green') {
                    disMsg.innerHTML = `<span style="color:var(--green)">${cat.text} Green patient.</span> ${hoursTxt} on ward.<br>Can patient be discharged?`;
                } else {
                    disMsg.innerHTML = `<span style="color:var(--${cat.id})">${cat.text} ${colorName} patient.</span> ${hoursTxt} on ward.<br>Can patient be discharged?`;
                }
                if (disWrap) disWrap.classList.add('pulse-highlight');
            } else {
                disPrompt.style.display = 'none';
                if (disWrap) disWrap.classList.remove('pulse-highlight');

                const continueChk = $('chk_continue_alert');
                if (continueChk && !s.chk_discharge_alert && s.reviewType === 'post') {
                    continueChk.checked = true;
                }
            }
        }

        if (s.stepdown_suitable === false) planHtml = `<div class="status red">Not suitable for stepdown.</div>`;
        else if (s.chk_discharge_alert) planHtml = `<div class="status" style="color:var(--blue-hint)">Discharge from ALERT nursing outreach list.</div>`;
        else if (s.chk_continue_alert) planHtml = `<div class="status green">Continue ALERT post ICU reviews.</div>`;
        else if (cat.id === 'red') planHtml = `<div class="status red">At least daily ALERT review (up to 72h).</div>`;
        else if (cat.id === 'amber') planHtml = `<div class="status amber">At least daily ALERT review (up to 48h).</div>`;
        else {
            if (s.reviewType === 'pre') planHtml = `<div class="status green">ALERT post ICU review on ward.</div>`;
            else planHtml = `<div class="status green">Continue ALERT reviews — minimum 2 reviews and 24h post-stepdown required before discharge.</div>`;
        }

        if (s.chk_medical_rounding) planHtml += `<div style="margin-top:2px; font-weight:600; color:var(--accent);">+ Added to ALERT Medical Rounding List</div>`;
        const fu = $('followUpInstructions'); if (fu) fu.innerHTML = planHtml;

        checkCompleteness(s, countComorbs);
        window._lastRed = uniqueRed;
        window._lastAmber = uniqueAmber;
        window._lastSuppressed = suppressedRisks;
        window._lastState = s;
        window._lastCat = cat;
        window._lastWardTime = timeData.text;
        window._lastActiveComorbsKeys = activeComorbsKeys;
    } catch (err) {
        console.error("Compute Error:", err);
    }
}

export function checkCompleteness(s, comorbCount) {
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
            nudge.style.color = '#7c3aed';
        } else { nudge.style.display = 'none'; }
    });
}
