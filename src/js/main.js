import { $, debounce, showToast } from './utils.js';
import { ACCORDION_KEY, staticInputs, segmentedInputs, toggleInputs } from './config.js';
import { getState, saveState, loadState, restoreState, previousCategoryData, updateLastSaved } from './state.js';
import { computeAll } from './logic.js';
import { generateSummary } from './summary.js';
import {
    checkBloodRanges, updateWardOptions, updateReviewTypeVisibility, updateWardOtherVisibility,
    createDeviceEntry, updateDevicesSectionVisibility, toggleOxyFields, toggleInfusionsBox,
    handleUnknownBLODate, showClearDataModal, hideClearDataModal, syncComorbsToPMH, clearData,
    enableQuickReviewMode, exitQuickReviewMode, showQuickReviewPrompt, openMobileNav, closeMobileNav,
    handleSegmentClick, toggleBowelDate
} from './ui.js';

function initialize() {
    updateLastSaved();

    document.querySelectorAll('.quick-select, .select-btn, .detail-toggle, .accordion, .trend-btn').forEach(btn => {
        btn.setAttribute('tabindex', '-1');
    });

    document.addEventListener('focusin', (e) => {
        if (e.target && e.target.tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            const footer = document.querySelector('footer');
            if (footer) {
                const rect = e.target.getBoundingClientRect();
                const footerRect = footer.getBoundingClientRect();
                if (rect.bottom > footerRect.top - 20) {
                    window.scrollBy({
                        top: rect.bottom - footerRect.top + 40,
                        behavior: 'smooth'
                    });
                }
            }
        }
    });

    const compute = debounce(() => { computeAll(); checkBloodRanges(); saveState(true); }, 350);

    window.addDevice = (type, val, insertionDate = '') => { createDeviceEntry(type, val, insertionDate); compute(); };
    window.compute = compute;
    window.showQuickReviewPrompt = showQuickReviewPrompt;
    window.previousCategoryData = previousCategoryData;

    function triggerGenerate() {
        const summaryEl = $('summary');
        const actions = $('summary_actions');

        syncComorbsToPMH();
        computeAll();

        summaryEl.value = '';

        generateSummary(
            window._lastState || getState(),
            window._lastCat || { id: 'green', text: 'CAT 3' },
            window._lastWardTime || '',
            window._lastRed || [],
            window._lastAmber || [],
            window._lastSuppressed || [],
            window._lastActiveComorbsKeys || []
        );

        summaryEl.style.height = 'auto';
        summaryEl.style.height = summaryEl.scrollHeight + 'px';

        if (actions) actions.style.display = 'block';
        const btn = $('btn_generate_summary');
        if (btn) btn.innerHTML = '🔄 Click again to regenerate DMR summary <span style="font-size:0.9em; font-weight:normal; opacity:0.9;">(will overwrite any manual edits)</span>';
        saveState(true);
    }

    $('btn_generate_summary')?.addEventListener('click', triggerGenerate);

    const summaryInputEl = $('summary');
    if (summaryInputEl) {
        summaryInputEl.addEventListener('input', () => {
            if (!summaryInputEl.classList.contains('script-updating')) {
                const badge = $('manual_edit_badge');
                if (badge) badge.style.display = 'block';
            }
        });
    }

    const btnYes = $('btn_discharge_yes');
    if (btnYes) {
        btnYes.addEventListener('click', (e) => {
            e.preventDefault();
            const catScoreText = $('catText')?.textContent || '';
            if (catScoreText.includes('CAT 3') || catScoreText.includes('Green')) {
                const modal = $('greenDischargeConfirmModal');
                if (modal) modal.style.display = 'flex';
                return;
            }

            const chk = $('chk_discharge_alert');
            if (chk) {
                chk.checked = true;
                compute();
                showToast("Patient marked for discharge", 1500);
            }
        });
    }

    const btnConfirmGreenYes = $('btn_green_confirm_yes');
    if (btnConfirmGreenYes) {
        btnConfirmGreenYes.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = $('greenDischargeConfirmModal');
            if (modal) modal.style.display = 'none';
            const chk = $('chk_discharge_alert');
            if (chk) {
                chk.checked = true;
                compute();
                showToast("Patient marked for discharge (criteria confirmed)", 1500);
            }
        });
    }
    const btnConfirmGreenNo = $('btn_green_confirm_no');
    if (btnConfirmGreenNo) {
        btnConfirmGreenNo.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = $('greenDischargeConfirmModal');
            if (modal) modal.style.display = 'none';
        });
    }

    const btnNo = $('btn_discharge_no');
    if (btnNo) {
        btnNo.addEventListener('click', (e) => {
            e.preventDefault();
            window.dismissedDischarge = true;
            const continueChk = $('chk_continue_alert');
            if (continueChk) continueChk.checked = true;
            compute();
        });
    }

    const btnRevPlus = $('btn_review_plus');
    const btnRevMinus = $('btn_review_minus');
    const revCountEl = $('wardReviewCount');
    if (btnRevPlus && revCountEl) {
        btnRevPlus.addEventListener('click', () => {
            const cur = parseInt(revCountEl.value) || 0;
            revCountEl.value = cur + 1;
            compute();
        });
    }
    if (btnRevMinus && revCountEl) {
        btnRevMinus.addEventListener('click', () => {
            const cur = parseInt(revCountEl.value) || 0;
            revCountEl.value = Math.max(0, cur - 1);
            compute();
        });
    }

    function syncSegments(id1, id2, type) {
        const g1 = $(id1);
        const g2 = $(id2);
        if (!g1 || !g2) return;

        [g1, g2].forEach(group => {
            group.querySelectorAll('.seg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    setTimeout(() => {
                        const val = btn.dataset.value;
                        const otherGroup = (group === g1) ? g2 : g1;
                        otherGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
                        otherGroup.querySelector(`.seg-btn[data-value="${val}"]`)?.classList.add('active');

                        if (val === "true") {
                            if (type === 'renal') showToast("Mitigation applied", 1500);
                            if (type === 'infection') showToast("Mitigation applied", 1500);
                        }
                        compute();
                    }, 50);
                });
            });
        });
    }

    syncSegments('seg_renal_chronic', 'seg_renal_chronic_bloods', 'renal');
    syncSegments('seg_infection_downtrend', 'seg_infection_downtrend_bloods', 'infection');

    function setDetailToggleState(targetEl, show) {
        if (!targetEl) return;
        targetEl.style.display = show ? 'block' : 'none';
        const btn = document.querySelector(`.detail-toggle[data-target="${targetEl.id}"]`);
        if (btn) btn.textContent = show ? 'Hide details' : 'Add details';
    }

    function refreshDetailToggleState() {
        document.querySelectorAll('.detail-toggle').forEach(btn => {
            const targetId = btn.dataset.target;
            const targetEl = $(targetId);
            if (!targetEl) return;
            const inputEl = targetEl.querySelector('textarea, input');
            const hasVal = !!(inputEl && inputEl.value && inputEl.value.trim());
            setDetailToggleState(targetEl, hasVal);
        });
    }

    document.querySelectorAll('.detail-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetEl = $(btn.dataset.target);
            if (!targetEl) return;
            const isHidden = targetEl.style.display === 'none' || !targetEl.style.display;
            setDetailToggleState(targetEl, isHidden);
        });
    });

    document.addEventListener('input', (e) => {
        if (e.target && e.target.classList.contains('scraped-data')) {
            e.target.classList.remove('scraped-data');
        }
        const wrapper = e.target?.closest?.('.detail-wrapper');
        if (wrapper && wrapper.id) {
            setDetailToggleState(wrapper, true);
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

    const rrInput = $('b_rr');
    if (rrInput) {
        rrInput.addEventListener('input', debounce(() => {
            const val = parseFloat(rrInput.value);
            if (!isNaN(val) && val > 20) {
                const respSeg = $('seg_resp_concern');
                const respYes = respSeg?.querySelector('.seg-btn[data-value="true"]');
                if (respYes && !respYes.classList.contains('active')) respYes.click();
                const tachSeg = $('seg_resp_tachypnea');
                const yesBtn = tachSeg?.querySelector('.seg-btn[data-value="true"]');
                if (yesBtn && !yesBtn.classList.contains('active')) {
                    yesBtn.click();
                    showToast('Auto-selected Resp Concern + Tachypnea (>20)', 1500);
                }
            }
        }, 500));
    }

    document.querySelectorAll('.risk-trigger[data-risk="renal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const renalSeg = $('seg_renal');
            const yesBtn = renalSeg.querySelector('.seg-btn[data-value="true"]');
            if (yesBtn && !yesBtn.classList.contains('active')) yesBtn.click();
            const btnVal = btn.dataset.value;
            if ((btnVal === "Oliguric" || btnVal.includes("<0.5")) && $('toggle_renal_oliguria').dataset.value === "false") $('toggle_renal_oliguria').click();
            if (btnVal === "Anuric" && $('toggle_renal_anuria').dataset.value === "false") $('toggle_renal_anuria').click();
            if (btnVal === "Dialysis" && $('toggle_renal_dialysis').dataset.value === "false") $('toggle_renal_dialysis').click();
        });
    });

    const tempInput = $('e_temp');
    if (tempInput) {
        tempInput.addEventListener('input', debounce(() => {
            const t = parseFloat(tempInput.value);
            if (!isNaN(t) && t > 38.0) {
                const infSeg = $('seg_infection');
                const yesBtn = infSeg.querySelector('.seg-btn[data-value="true"]');
                if (yesBtn && !yesBtn.classList.contains('active')) yesBtn.click();
            }
        }, 600));
    }

    const neuroInput = $('d_alert');
    if (neuroInput) {
        neuroInput.addEventListener('input', debounce((e) => {
            const val = e.target.value.toLowerCase();
            const keywords = ['confus', 'drows', 'agitat', 'delirium', 'somnolent', 'gcs 14', 'gcs 13', 'gcs 12', 'gcs 11', 'gcs 10', 'gcs 9', 'gcs 8'];
            const isGcsLow = (val.match(/gcs\\s*(\\d+)/i)?.[1] || 15) < 15;

            if (keywords.some(k => val.includes(k)) || isGcsLow) {
                const neuroSeg = $('seg_neuro_gate');
                const yesBtn = neuroSeg.querySelector('.seg-btn[data-value="true"]');
                if (yesBtn && !yesBtn.classList.contains('active')) yesBtn.click();
            }
        }, 800));
    }

    const coughInput = $('b_cough');
    if (coughInput) {
        coughInput.addEventListener('input', debounce(() => {
            const val = coughInput.value.toLowerCase();
            if (val.includes('weak') || val.includes('poor') || val.includes('ineffective')) {
                const respSeg = $('seg_resp_concern');
                const respYes = respSeg?.querySelector('.seg-btn[data-value="true"]');
                if (respYes && !respYes.classList.contains('active')) respYes.click();
                const seg = $('seg_resp_poor_cough');
                const yesBtn = seg?.querySelector('.seg-btn[data-value="true"]');
                if (yesBtn && !yesBtn.classList.contains('active')) {
                    yesBtn.click();
                    showToast('Auto-selected Resp Concern + Poor Cough (B)', 1500);
                }
            }
        }, 600));
    }

    const poorCoughSeg = $('seg_resp_poor_cough');
    if (poorCoughSeg) {
        poorCoughSeg.querySelectorAll('.seg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const coughEl = $('b_cough');
                if (coughEl && !coughEl.value && btn.dataset.value === 'true') {
                    coughEl.value = 'Weak';
                    coughEl.dispatchEvent(new Event('input'));
                }
            });
        });
    }

    const uopInput = $('e_uop');
    if (uopInput) {
        uopInput.addEventListener('input', debounce(() => {
            const val = uopInput.value.toLowerCase();
            if (val.includes('oligur') || val.includes('<0.5') || val.includes('low') || val.includes('decreas')) {
                const renalSeg = $('seg_renal');
                const yesBtn = renalSeg?.querySelector('.seg-btn[data-value="true"]');
                if (yesBtn && !yesBtn.classList.contains('active')) {
                    yesBtn.click();
                    showToast('Auto-selected Renal Concern (UOP)', 1500);
                }
                const oliguToggle = $('toggle_renal_oliguria');
                if (oliguToggle && oliguToggle.dataset.value === 'false') oliguToggle.click();
            }
        }, 600));
    }

    const oliguToggleEl = $('toggle_renal_oliguria');
    if (oliguToggleEl) {
        oliguToggleEl.addEventListener('click', () => {
            setTimeout(() => {
                const uopEl = $('e_uop');
                if (uopEl && !uopEl.value.trim() && oliguToggleEl.dataset.value === 'true') {
                    uopEl.value = 'Oliguric (<0.5ml/kg)';
                    uopEl.dispatchEvent(new Event('input'));
                }
            }, 50);
        });
    }
    const anuriaToggleEl = $('toggle_renal_anuria');
    if (anuriaToggleEl) {
        anuriaToggleEl.addEventListener('click', () => {
            setTimeout(() => {
                const uopEl = $('e_uop');
                if (uopEl && !uopEl.value.trim() && anuriaToggleEl.dataset.value === 'true') {
                    uopEl.value = 'Anuric';
                    uopEl.dispatchEvent(new Event('input'));
                }
            }, 50);
        });
    }

    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const targetId = href.substring(1);
                const targetEl = document.getElementById(targetId);
                if (targetEl && targetEl.classList.contains('accordion-wrapper')) {
                    const panel = targetEl.querySelector('.panel');
                    if (panel && panel.style.display !== 'block') {
                        panel.style.display = 'block';
                        targetEl.querySelector('.icon').textContent = '[-]';
                    }
                }
            }
        });
    });

    const weightInput = $('ptWeight');
    if (weightInput) {
        weightInput.addEventListener('input', () => {
            const w = parseFloat(weightInput.value);
            const targetEl = $('target_uop_display');
            if (w && !isNaN(w)) {
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
            if (input) {
                input.value = time;
                input.dispatchEvent(new Event('input'));
            }
        });
    });

    $('pressor_ceased_time')?.addEventListener('input', compute);
    $('pressor_recent_other_note')?.addEventListener('input', compute);
    $('pressor_current_other_note')?.addEventListener('input', compute);

    const fluidInput = $('e_fluid');
    const oedemaToggle = $('toggle_renal_oedema');
    const dehydratedToggle = $('toggle_renal_dehydrated');

    if (fluidInput && oedemaToggle && dehydratedToggle) {
        fluidInput.addEventListener('input', () => {
            const val = fluidInput.value.toLowerCase();
            if (val.includes('oedema') && oedemaToggle.dataset.value === 'false') {
                oedemaToggle.click();
            } else if (!val.includes('oedema') && oedemaToggle.dataset.value === 'true') {
                oedemaToggle.click();
            }
            if (val.includes('dehydrated') && dehydratedToggle.dataset.value === 'false') {
                dehydratedToggle.click();
            } else if (!val.includes('dehydrated') && dehydratedToggle.dataset.value === 'true') {
                dehydratedToggle.click();
            }
        });

        [oedemaToggle, dehydratedToggle].forEach(toggle => {
            toggle.addEventListener('click', () => {
                setTimeout(() => {
                    const oedema = oedemaToggle.dataset.value === 'true';
                    const dehydrated = dehydratedToggle.dataset.value === 'true';
                    if (oedema && dehydrated) {
                        fluidInput.value = 'Oedema + Dehydrated';
                    } else if (oedema) {
                        fluidInput.value = 'Oedema';
                    } else if (dehydrated) {
                        fluidInput.value = 'Dehydrated';
                    } else {
                        fluidInput.value = 'Euvolaemic';
                    }
                    fluidInput.dispatchEvent(new Event('input'));
                }, 50);
            });
        });
    }

    document.querySelectorAll('.quick-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (btn.classList.contains('risk-trigger') || btn.classList.contains('safe-trigger')) {
                const targetId = btn.dataset.target;
                const target = $(targetId);
                if (target) {
                    if (btn.dataset.stack === "true") {
                        const current = target.value;
                        if (!current.includes(btn.dataset.value)) target.value = current ? `${current}, ${btn.dataset.value}` : btn.dataset.value;
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
                    if (targetId === 'lactate_trend') {
                        document.querySelectorAll('.quick-select[data-target="lactate_trend"]').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    }
                    if (targetId === 'dyspneaConcern') {
                        document.querySelectorAll('.quick-select[data-target="dyspneaConcern"]').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    }
                    if (btn.id === 'btn_fluid_restrict') {
                        const frWrapper = $('fluid_restriction_wrapper');
                        if (frWrapper) {
                            frWrapper.style.display = target.value.includes('Fluid Restriction') ? 'block' : 'none';
                        }
                    }
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
                saveState(true);
                computeAll();
                checkBloodRanges();
            });
        });
    });

    document.querySelectorAll('.toggle-label').forEach(el => {
        if ([
            'toggle_resp_tachypnea', 'toggle_resp_rapid_wean', 'toggle_resp_poor_cough', 'toggle_resp_poor_swallow'
        ].includes(el.id)) return;
        el.addEventListener('click', () => {
            const isOn = el.dataset.value === 'true';
            el.dataset.value = isOn ? 'false' : 'true';
            el.classList.toggle('active', !isOn);
            if (el.id === 'toggle_comorb_other') $('comorb_other_note_wrapper').style.display = !isOn ? 'block' : 'none';
            if (el.id === 'toggle_pressor_recent_other') $('pressor_recent_other_note_wrapper').style.display = !isOn ? 'block' : 'none';
            if (el.id === 'toggle_pressor_current_other') $('pressor_current_other_note_wrapper').style.display = !isOn ? 'block' : 'none';
            if (el.id === 'toggle_renal_dialysis') {
                $('dialysis_type_wrapper').style.display = !isOn ? 'block' : 'none';
            }
            if (el.id === 'toggle_renal_dialysis') {
                const comorb = $('toggle_comorb_dialysis');
                if (comorb && comorb.dataset.value !== el.dataset.value) {
                    comorb.click();
                }
            }
            if (el.id === 'toggle_comorb_dialysis') {
                const renal = $('toggle_renal_dialysis');
                if (renal && renal.dataset.value !== el.dataset.value) {
                    renal.click();
                }
            }
            if (el.id.startsWith('toggle_comorb_')) {
                syncComorbsToPMH();
            }
            saveState(true);
            computeAll();
            checkBloodRanges();
        });
    });

    document.querySelectorAll('.button-group').forEach(group => {
        group.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.select-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (group.id === 'oxMod') {
                    const devEl = $('b_device');
                    if (devEl) devEl.dataset.manual = 'false';
                    toggleOxyFields();
                }

                if (group.id === 'neuroType') $('neuro_gate_content').style.display = 'block';
                saveState(true);
                computeAll();
                checkBloodRanges();
            });
        });
    });

    staticInputs.forEach(id => { const el = $(id); if (el) el.addEventListener('input', compute); });

    $('bowel_date')?.addEventListener('change', compute);
    $('stepdownDate')?.addEventListener('change', compute);

    $('chk_use_mods')?.addEventListener('change', () => { $('mods_inputs').style.display = $('chk_use_mods').checked ? 'block' : 'none'; compute(); });
    $('chk_aperients')?.addEventListener('change', compute);
    $('chk_unknown_blo_date')?.addEventListener('change', () => { handleUnknownBLODate(); compute(); });
    $('comorb_other_note')?.addEventListener('input', compute);
    $('comorb_other_note')?.addEventListener('blur', () => {
        const toggle = $('toggle_comorb_other');
        if (toggle && toggle.dataset.value === 'true') syncComorbsToPMH();
    });

    $('chk_discharge_alert')?.addEventListener('change', () => {
        const dischargeChk = $('chk_discharge_alert');
        const continueChk = $('chk_continue_alert');

        if (dischargeChk && dischargeChk.checked) {
            const catScoreText = $('catText')?.textContent || '';
            if (catScoreText.includes('CAT 3') || catScoreText.includes('Green')) {
                dischargeChk.checked = false;
                const modal = $('greenDischargeConfirmModal');
                if (modal) modal.style.display = 'flex';
                return;
            }

            if (continueChk) {
                continueChk.checked = false;
            }
        }
        compute();
    });
    $('chk_continue_alert')?.addEventListener('change', () => {
        const continueChk = $('chk_continue_alert');
        const dischargeChk = $('chk_discharge_alert');
        const disPrompt = $('discharge_prompt');

        if (continueChk && continueChk.checked) {
            if (dischargeChk) dischargeChk.checked = false;
            if (disPrompt && disPrompt.style.display !== 'none') {
                window.dismissedDischarge = true;
            }
        }
        compute();
    });
    $('chk_medical_rounding')?.addEventListener('change', () => {
        const preCheckbox = $('chk_medical_rounding_pre');
        if (preCheckbox) preCheckbox.checked = $('chk_medical_rounding').checked;
        compute();
    });
    $('chk_medical_rounding_pre')?.addEventListener('change', () => {
        const mainCheckbox = $('chk_medical_rounding');
        if (mainCheckbox) mainCheckbox.checked = $('chk_medical_rounding_pre').checked;
        compute();
    });

    document.querySelectorAll('input[name="reviewType"]').forEach(r => r.addEventListener('change', () => {
        updateWardOptions();
        toggleInfusionsBox();
        updateReviewTypeVisibility();
        compute();
    }));
    $('ptWard')?.addEventListener('change', () => { updateWardOtherVisibility(); compute(); });

    $('clearDataBtnTop')?.addEventListener('click', () => showClearDataModal());
    $('footerClear')?.addEventListener('click', () => showClearDataModal());

    $('closeClearModal')?.addEventListener('click', hideClearDataModal);
    $('confirmClearData')?.addEventListener('click', () => {
        hideClearDataModal();
        clearData();
    });
    $('btnQuickCopySummary')?.addEventListener('click', () => {
        const text = $('summary').value;
        if (!text) { showToast('Summary is empty', 1500); return; }
        navigator.clipboard.writeText(text).then(() => showToast('✓ Copied to clipboard', 1500));
    });

    $('btnQuickReview')?.addEventListener('click', enableQuickReviewMode);
    $('btnFullReview')?.addEventListener('click', () => {
        const prompt = $('quickReviewPrompt');
        if (prompt) prompt.style.display = 'none';
    });
    $('btnExitQuickReview')?.addEventListener('click', exitQuickReviewMode);

    $('floatingNavBtn')?.addEventListener('click', openMobileNav);
    $('closeMobileNav')?.addEventListener('click', closeMobileNav);
    $('mobileNavOverlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'mobileNavOverlay') closeMobileNav();
    });
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMobileNav);
    });

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
            if (count > 0) {
                const ev = new Event('input');
                Object.values(blMap).forEach(id => $(id)?.dispatchEvent(ev));
                showToast(`Filled ${count} fields`, 1500);
            } else {
                showToast("No previous bloods found", 1500);
            }
        }
    });

    $('btnClearCurrentBloods')?.addEventListener('click', () => {
        const bloodFields = [
            'bl_lac_review', 'bl_hb', 'bl_wcc', 'bl_crp', 'bl_cr_review', 'bl_egfr',
            'bl_k', 'bl_na', 'bl_mg', 'bl_phos', 'bl_plts', 'bl_alb',
            'bl_neut', 'bl_lymph', 'bl_bili', 'bl_alt', 'bl_inr', 'bl_aptt'
        ];

        let count = 0;
        bloodFields.forEach(id => {
            const field = $(id);
            if (field && field.value) {
                field.value = '';
                field.classList.remove('scraped-data');
                count++;
            }
        });

        document.querySelectorAll('.trend-buttons .trend-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });

        if (count > 0) {
            compute();
            showToast(`Cleared ${count} blood result${count > 1 ? 's' : ''}`, 1500);
        } else {
            showToast("No blood results to clear", 1500);
        }
    });

    $('btnClearPreviousBloods')?.addEventListener('click', () => {
        const prevLabels = [
            'prev_bl_lac_review', 'prev_bl_hb', 'prev_bl_wcc', 'prev_bl_crp',
            'prev_bl_cr_review', 'prev_bl_egfr', 'prev_bl_k', 'prev_bl_na',
            'prev_bl_mg', 'prev_bl_phos', 'prev_bl_plts', 'prev_bl_alb',
            'prev_bl_neut', 'prev_bl_lymph', 'prev_bl_bili', 'prev_bl_alt',
            'prev_bl_inr', 'prev_bl_aptt'
        ];

        let count = 0;
        prevLabels.forEach(id => {
            const label = $(id);
            if (label && label.textContent.trim()) {
                label.textContent = '';
                count++;
            }
        });

        window.prevBloods = {};

        if (count > 0) {
            compute();
            showToast(`Cleared ${count} previous blood result${count > 1 ? 's' : ''}`, 1500);
        } else {
            showToast("No previous blood results to clear", 1500);
        }
    });

    document.querySelectorAll('.trend-buttons').forEach(group => {
        ['↑', '↓', '→'].forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'trend-btn'; btn.textContent = t; btn.dataset.value = t;
            btn.setAttribute('tabindex', '-1');
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
        btn.addEventListener('click', () => { createDeviceEntry(btn.dataset.deviceType); updateDevicesSectionVisibility(); computeAll(); });
    });

    ['red', 'amber'].forEach(t => {
        const btn = $(`override_${t}`);
        if (btn) btn.addEventListener('click', () => {
            const isActive = btn.classList.contains('active');

            if (isActive) {
                $('override').value = 'none';
                $('override_reason_box').style.display = 'none';
                $('override_amber').classList.remove('active');
                $('override_red').classList.remove('active');
            } else {
                $('override').value = t;
                $('override_reason_box').style.display = 'block';
                $('override_amber').classList.toggle('active', t === 'amber');
                $('override_red').classList.toggle('active', t === 'red');
            }
            compute();
        });
    });

    updateWardOptions();

    const journeyDataRaw = sessionStorage.getItem('alert_form_data');
    if (journeyDataRaw) {
        try {
            const parsed = JSON.parse(journeyDataRaw);
            restoreState(parsed);
            sessionStorage.removeItem('alert_form_data'); // Clear it so it doesn't persistently load
        } catch (e) {
            console.error(e);
        }
    } else {
        const saved = loadState();
        if (saved) restoreState(saved);
    }
    refreshDetailToggleState();
    updateReviewTypeVisibility();

    const accMap = JSON.parse(sessionStorage.getItem(ACCORDION_KEY) || '{}');
    document.querySelectorAll('.accordion-wrapper').forEach(w => {
        if (accMap[w.dataset.accordionId]) { w.querySelector('.panel').style.display = 'block'; w.querySelector('.icon').textContent = '[-]'; }
    });

    compute();
    checkBloodRanges();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
