import { $, nowTimeStr, todayDateStr, formatDateDDMMYYYY, num } from './utils.js';
import { comorbMap } from './config.js';

export function generateSummary(s, cat, wardTimeTxt, red, amber, suppressed, activeComorbsKeys) {

    const sum = $('summary');

    // Clear device modified flag when summary is generated
    window.devicesModifiedSinceLastSummary = false;

    const lines = [];
    const addLine = (txt) => { if (txt) lines.push(txt); };
    const role = s.clinicianRole;
    const reviewName = (s.reviewType === 'pre') ? 'Pre-Stepdown' : 'post ICU review';

    if (s.reviewType === 'pre') {
        lines.push(`${role} Pre-Stepdown Review`);
    } else {
        lines.push(`${role} ${reviewName}`);
    }

    lines.push(`Patient: ${s.ptName || '--'} | URN: ...${s.ptMrn || ''} | Location: ${s.ptWard || '--'}, Room: ${s.ptBed || '--'}`);
    let demo = [];
    if (s.ptAge) demo.push(`Age: ${s.ptAge}`);
    if (s.ptWeight) demo.push(`Weight: ${s.ptWeight}kg`);
    if (demo.length) lines.push(demo.join(', '));

    lines.push(`Time of review: ${s.reviewTime || nowTimeStr()}`);

    if (s.reviewType === 'pre') {
        lines.push(`Stepdown Date: Today (${todayDateStr()})`);
    } else if (s.stepdownDate) {
        lines.push(`ICU Discharge Date: ${formatDateDDMMYYYY(s.stepdownDate)}`);
    }
    lines.push('');

    if (wardTimeTxt && s.reviewType !== 'pre') lines.push(`Time since stepdown: ${wardTimeTxt}`);
    if (s.icuLos) lines.push(`ICU LOS: ${s.icuLos} days`);
    lines.push(`Reason for ICU Admission: ${s.ptAdmissionReason || '--'}`);

    if (s.reviewType === 'pre' && s.icuSummary) {
        lines.push('');
        lines.push(`ICU Course Summary: ${s.icuSummary}`);
    }
    lines.push('');

    if (s.stepdown_suitable === false) {
        lines.push(`ALERT Nursing Review Category - Not suitable for stepdown`);
        lines.push('');
        lines.push('Assessed as not presently suitable for ward stepdown.');
        lines.push(`Reason: ${s.unsuitable_note || 'Clinical concerns (see notes)'}`);
        lines.push('Plan: ICU Senior Review requested. Please contact ALERT for re-review when appropriate.');
        lines.push('');
        lines.push('--- FULL ASSESSMENT BELOW ---');
        lines.push('');
    } else {
        lines.push(`ALERT Nursing Review Category - ${cat.text}`);
        if (s.stepdown_suitable === true && s.reviewType === 'pre') {
            lines.push('Patient is suitable for ward stepdown.');
        }
        lines.push('');
    }

    // PMH: read chips directly AND pmh_note, deduplicate
    const pmhItems = [];
    const pmhSeen = new Set();
    // First: add active chip names
    activeComorbsKeys.forEach(k => {
        let name;
        if (k === 'comorb_other' && s.comorb_other_note) {
            name = s.comorb_other_note.trim();
        } else if (k === 'comorb_other') {
            return; // skip "Other" with no text
        } else {
            name = comorbMap[k];
        }
        if (name && !pmhSeen.has(name.toLowerCase())) {
            pmhSeen.add(name.toLowerCase());
            pmhItems.push(name);
        }
    });
    // Second: add any extra lines from pmh_note that aren't already listed
    if (s.pmh_note) {
        s.pmh_note.split('\n').forEach(p => {
            const trimmed = p.trim().replace(/^-/, '').trim();
            if (trimmed && !pmhSeen.has(trimmed.toLowerCase())) {
                pmhSeen.add(trimmed.toLowerCase());
                pmhItems.push(trimmed);
            }
        });
    }
    if (pmhItems.length > 0) {
        lines.push('PMH:');
        pmhItems.forEach(item => lines.push(`-${item}`));
        lines.push('');
    }

    if (s.allergies_note) {
        lines.push(`Allergies: ${s.allergies_note}`);
        lines.push('');
    }

    if (s.goc_note) {
        lines.push(`GOC: ${s.goc_note}`);
        lines.push('');
    }

    lines.push('A-E ASSESSMENT:');
    if (s.chk_use_mods) addLine(`MODS: ${s.mods_score} ${s.mods_details ?`(${s.mods_details})` : ''}`);
    else addLine(`ADDS: ${s.adds}`);

    if (s.airway_a) addLine(`A: ${s.airway_a}`);
    else if (s.a_comment) addLine(`A:`);
    if (s.a_comment) addLine(`  - ${s.a_comment}`);

    let b = [];
    if (s.b_rr) b.push(`RR ${s.b_rr}`);
    if (s.b_spo2) b.push(`SpO2 ${s.b_spo2}`);
    if (s.b_device) b.push(s.b_device);
    if (s.b_wob) b.push(`WOB: ${s.b_wob}`);
    if (s.b_cough) b.push(`Cough: ${s.b_cough}`);
    if (b.length) addLine(`B: ${b.join(', ')}`);
    else if (s.b_comment) addLine(`B:`);
    if (s.b_comment) addLine(`  - ${s.b_comment}`);

    let c = [];
    if (s.c_hr) c.push(`HR ${s.c_hr} ${s.c_hr_rhythm ?`(${s.c_hr_rhythm})` : ''}`);
    if (s.c_nibp) c.push(`NIBP ${s.c_nibp}`);
    if (s.c_cr) c.push(`CR ${s.c_cr}`);
    if (s.c_perf) c.push(`Perf ${s.c_perf}`);
    if (c.length) addLine(`C: ${c.join(', ')}`);
    else if (s.c_comment) addLine(`C:`);
    if (s.c_comment) addLine(`  - ${s.c_comment}`);

    let d = [];
    if (s.d_alert) d.push(s.d_alert);
    if (s.d_pain) {
        if (s.d_pain.toLowerCase() === 'no pain') {
            d.push('No pain');
        } else {
            d.push(`Pain: ${s.d_pain}`);
        }
    }
    if (d.length) addLine(`D: ${d.join(', ')}`);
    else if (s.d_comment) addLine(`D:`);
    if (s.d_comment) addLine(`  - ${s.d_comment}`);

    let e = [];
    if (s.e_temp) e.push(`Temp ${s.e_temp}`);
    if (s.e_uop) e.push(`UOP ${s.e_uop}`);
    if (s.e_bsl) e.push(`BSL ${s.e_bsl}`);
    if (e.length) addLine(`E: ${e.join(', ')}`);
    else if (s.e_comment) addLine(`E:`);
    if (s.e_comment) addLine(`  - ${s.e_comment}`);

    lines.push('');

    if (s.ae_mobility) addLine(`Mobility: ${s.ae_mobility}`);

    let bowelTxt = '';
    if (s.bowel_mode === 'btn_bo') bowelTxt = 'BO';
    else if (s.bowel_mode === 'btn_bno') bowelTxt = 'BNO';

    if (s.chk_unknown_blo_date && s.bowel_mode === 'btn_bno') {
        bowelTxt += ', unknown when BLO';
    } else if (s.bowel_date) {
        const bd = new Date(s.bowel_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        bd.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - bd) / (1000 * 60 * 60 * 24));

        if (s.bowel_mode === 'btn_bo') {
            if (daysDiff === 0) {
                bowelTxt += `, today (${bd.getDate()}/${bd.getMonth() + 1})`;
            } else if (daysDiff === 1) {
                bowelTxt += `, yesterday (${bd.getDate()}/${bd.getMonth() + 1})`;
            } else {
                bowelTxt += `, ${daysDiff} days ago (${bd.getDate()}/${bd.getMonth() + 1})`;
            }
        } else if (s.bowel_mode === 'btn_bno') {
            if (daysDiff === 0) {
                bowelTxt += `. Last opened today (${bd.getDate()}/${bd.getMonth() + 1})`;
            } else if (daysDiff === 1) {
                bowelTxt += `. Last opened yesterday on ${bd.getDate()}/${bd.getMonth() + 1}`;
            } else {
                bowelTxt += `. Last opened ${daysDiff} days ago on ${bd.getDate()}/${bd.getMonth() + 1}`;
            }
        }
    }
    if (s.chk_aperients && s.bowel_mode === 'btn_bno') bowelTxt += '. On aperients';
    if (s.ae_bowels) {
        if (s.bowel_mode === 'btn_bo') {
            bowelTxt += `, type ${s.ae_bowels}`;
        } else {
            bowelTxt += `. ${s.ae_bowels}`;
        }
    }

    if (bowelTxt) addLine(`Bowels: ${ bowelTxt } `);

    if (s.ae_diet) addLine(`Diet: ${ s.ae_diet } `);
    if (s.nutrition_adequate === false) addLine(`Nutrition: Inadequate${
                    s.nutrition_context_note ?` - ${s.nutrition_context_note}` : ''}`);
    else if (s.nutrition_adequate === true) addLine(`Nutrition: Adequate`);

                    if (s.pics) {
                        const picsStatus = s.pics === 'positive' ? 'Positive' : 'Negative';
                        addLine(`Post ICU Syndrome: ${picsStatus}${s.pics_note ?` - ${s.pics_note}` : ''}`);
                    }
                    if (s.sleep_quality === true) addLine(`Sleep: Poor${s.sleep_quality_note ?` - ${s.sleep_quality_note}` : ''}`);
                    else if (s.sleep_quality === false) addLine(`Sleep: No sleep issues identified`);
                    if (s.neuro_psych === true) addLine(`Psychological issues: ${s.neuro_psych_note || 'Concerns identified'}`);
                    else if (s.neuro_psych === false) addLine(`Psychological issues: Nil identified`);

                    if (s.anticoag_note) addLine(`Anticoagulation: ${s.anticoag_note}`);
                    if (s.vte_prophylaxis_note) addLine(`VTE Prophylaxis: ${s.vte_prophylaxis_note}`);
                    if (s.infusions_note) addLine(`Infusions: ${s.infusions_note}`);

                    lines.push('');

                    const blMap = { 'lac_review': 'Lac', 'hb': 'Hb', 'wcc': 'WCC', 'cr_review': 'Cr', 'egfr': 'eGFR', 'k': 'K', 'na': 'Na', 'mg': 'Mg', 'phos': 'PO4', 'plts': 'Plts', 'alb': 'Alb', 'neut': 'Neut', 'lymph': 'Lymph', 'bili': 'Bili', 'alt': 'ALT', 'inr': 'INR', 'aptt': 'APTT' };
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
                    if (s.new_bloods_ordered === 'ordered') addLine('New bloods ordered for next round');
                    if (s.new_bloods_ordered === 'requested') addLine('New bloods requested (not yet ordered)');
                    if (s.new_bloods_ordered === 'not_required') addLine('New bloods not required');
                    if (s.elec_replace_note) addLine(`Electrolyte Plan: ${s.elec_replace_note}`);
                    lines.push('');

                    const hasAnyDevices = Object.values(s.devices || {}).some(arr => arr.length);
                    if (hasAnyDevices) {
                        lines.push('LINES, DRAINS, DEVICES & WOUNDS:');
                        const trackedDevices = ['CVC', 'PICC', 'PIVC', 'Other CVAD', 'IDC', 'Vascath'];
                        Object.entries(s.devices).forEach(([k, v]) => {
                            v.forEach(item => {
                                let deviceLine = `- ${k}`;

                                if (item.insertionDate && trackedDevices.includes(k)) {
                                    const deviceDate = new Date(item.insertionDate + 'T00:00:00');
                                    const dwellDays = Math.floor((new Date() - deviceDate) / (1000 * 60 * 60 * 24));

                                    if (item.details) deviceLine += ` - ${item.details}`;

                                    const threshold = (k === 'PIVC') ? 5 : 7;
                                    if (k === 'PIVC') {
                                        if (dwellDays >= 5) deviceLine += ` - ${dwellDays}d long dwell`;
                                        else deviceLine += ` - ${dwellDays}d dwell`;
                                    } else {
                                        if (dwellDays >= 7) deviceLine += ` - ${dwellDays}d long dwell`;
                                        else deviceLine += ` - ${dwellDays}d dwell`;
                                    }

                                    const bd = new Date(item.insertionDate);
                                    deviceLine += `, inserted ${bd.getDate()}/${bd.getMonth() + 1}/${bd.getFullYear().toString().slice(-2)}`;
                                } else {
                                    if (item.details) deviceLine += ` - ${item.details}`;
                                    if (item.insertionDate) {
                                        const bd = new Date(item.insertionDate);
                                        deviceLine += ` - inserted ${bd.getDate()}/${bd.getMonth() + 1}/${bd.getFullYear().toString().slice(-2)}`;
                                    }
                                }
                                lines.push(deviceLine);
                            });
                        });
                    }
                    lines.push('');

                    if (s.context_other_note) lines.push(`Other: ${s.context_other_note}`);
                    lines.push('');

                    lines.push('IDENTIFIED ICU READMISSION RISK FACTORS:');
                    const risks = [...red, ...amber];
                    if (risks.length) { risks.forEach(r => lines.push(`- ${r}`)); }
                    if (suppressed.length) { suppressed.forEach(r => lines.push(`- ${r}`)); }

                    if (risks.length === 0 && suppressed.length === 0) { lines.push('- None identified'); }
                    lines.push('');

                    lines.push('PLAN:');

                    if (s.stepdown_suitable === false) {
                        lines.push('- ICU Senior Review requested due to unsuitability for ward stepdown.');
                        lines.push('- Please re-contact ALERT for re-review when appropriate.');
                    } else if (s.chk_discharge_alert) {
                        lines.push('- Discharge from ALERT nursing post-ICU list. Please re-contact ALERT if further support required.');
                    } else if (s.chk_continue_alert) {
                        lines.push('- Continue ALERT post ICU reviews.');
                    } else if (cat.id === 'red') {
                        lines.push('- At least daily ALERT review for up to 72h post-ICU stepdown.');
                    } else if (cat.id === 'amber') {
                        lines.push('- At least daily ALERT review for up to 48h post-ICU stepdown.');
                    } else {
                        if (s.reviewType === 'pre') {
                            lines.push('- At least single ALERT nursing follow up on ward.');
                        } else if (s.chk_discharge_alert) {
                            lines.push('- Discharge from ALERT post ICU list. Please re-contact ALERT if further support required.');
                        } else {
                            lines.push('- Continued ALERT nursing reviews for up to 24h post stepdown (minimum 2 reviews required before discharge).');
                        }
                    }

                    if (s.chk_medical_rounding) {
                        lines.push('- Patient added to ALERT medical rounding list for further review.');
                    }

                    if (sum) {
                        sum.classList.add('script-updating');
                        sum.value = lines.join('\n');
                        sum.classList.remove('script-updating');
                        const badge = $('manual_edit_badge');
                        if (badge) badge.style.display = 'none';
                    }
                }
