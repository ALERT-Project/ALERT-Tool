/* =========================================
   ALERT Tool Plugin: ADDS Calculator
   Copyright © 2025-2026 Casey Bond
   Part of ALERT Nursing Risk Assessment Tool
   MIT License - https://opensource.org/licenses/MIT
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Calculator HTML
    const container = document.getElementById('addsCalculatorContainer');
    if (container) {
        container.innerHTML = `
            <style>
                .calc-box { 
                    border: 1px solid var(--line); 
                    background: var(--input-bg); 
                    border-radius: 8px; 
                    padding: 6px 10px; 
                    margin-bottom: 6px; 
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .quick-chip-group { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
                .quick-calc {
                    padding: 2px 6px !important;
                    font-size: 0.72rem !important;
                    font-weight: 600 !important;
                    border-radius: 4px !important;
                    background: var(--bg) !important;
                    border: 1px solid var(--line) !important;
                    color: var(--muted) !important;
                    cursor: pointer !important;
                    margin: 0 !important;
                    height: 22px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.15s ease !important;
                }
                .quick-calc:hover {
                    background: var(--line) !important;
                    color: var(--ink) !important;
                    border-color: var(--accent) !important;
                }
                .adds-calc-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                }
                .adds-calc-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .adds-calc-label {
                    display: block !important;
                    font-size: 0.78rem !important;
                    color: var(--muted) !important;
                    margin-bottom: 2px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                }
                .adds-calc-input {
                    height: 28px !important;
                    padding: 2px 8px !important;
                    font-size: 0.82rem !important;
                    margin: 0 !important;
                    border-radius: 6px !important;
                    border: 1px solid var(--line) !important;
                    background: var(--bg) !important;
                    color: var(--ink) !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    outline: none !important;
                }
                .adds-calc-input:focus {
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 2px rgba(0, 122, 122, 0.1) !important;
                }
                .adds-calc-score-wrapper {
                    width: 48px;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    align-self: center;
                }
                .adds-calc-score-label {
                    font-size: 0.6rem;
                    color: var(--muted);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 1px;
                }
                .adds-calc-score-value {
                    font-weight: 800;
                    font-size: 1.2rem;
                    color: var(--accent);
                    line-height: 1;
                    min-height: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .o2-mode-label {
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 4px !important;
                    font-weight: 600 !important;
                    font-size: 0.75rem !important;
                    color: var(--muted) !important;
                    cursor: pointer !important;
                    margin-bottom: 0 !important;
                }
                .o2-mode-label input {
                    margin: 0 !important;
                    width: 12px !important;
                    height: 12px !important;
                }
                .bp-input-unified-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg);
                    border-radius: 6px;
                    overflow: hidden;
                    border: 1px solid var(--line);
                    transition: all 0.2s ease;
                }
                .bp-input-unified-container:focus-within {
                    border-color: var(--accent);
                }
                .bp-input-unified-field {
                    width: 100% !important;
                    box-sizing: border-box !important;
                    margin: 0 !important;
                    border: none !important;
                    background: transparent !important;
                    text-align: center !important;
                    height: 26px !important;
                    outline: none !important;
                    box-shadow: none !important;
                    font-size: 0.82rem !important;
                    padding: 2px 8px !important;
                    color: var(--ink) !important;
                }
                .bp-input-unified-divider {
                    border-top: 1px solid var(--line);
                    width: 100%;
                }
                #calc_avpu .select-btn {
                    padding: 3px 6px !important;
                    font-size: 0.72rem !important;
                    height: 24px !important;
                    line-height: 1 !important;
                    font-weight: 600 !important;
                    border-radius: 4px !important;
                }
            </style>

            <div style="font-size:0.85rem; margin-bottom:8px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px;">ADDS Calculator</div>
            
            <div class="calc-box">
                <div class="adds-calc-row">
                    <div class="adds-calc-content">
                        <label class="adds-calc-label">Respiratory Rate (RR)</label>
                        <input type="text" id="calc_rr" placeholder="Rate (e.g. 15-20)" class="adds-calc-input">
                        <div class="quick-chip-group">
                            <button class="quick-calc" data-target="calc_rr" data-val="12-14">12-14</button>
                            <button class="quick-calc" data-target="calc_rr" data-val="15-20">15-20</button>
                            <button class="quick-calc" data-target="calc_rr" data-val="21-24">21-24</button>
                        </div>
                    </div>
                    <div class="adds-calc-score-wrapper">
                        <span class="adds-calc-score-label">Score</span>
                        <div id="score_rr" class="adds-calc-score-value"></div>
                    </div>
                </div>
            </div>

            <div class="calc-box">
                <div class="adds-calc-row">
                    <div class="adds-calc-content">
                        <label class="adds-calc-label">SpO2 (%)</label>
                        <input type="text" id="calc_spo2" placeholder="%" class="adds-calc-input">
                        <div class="quick-chip-group">
                            <button class="quick-calc" data-target="calc_spo2" data-val=">94%">SpO2 >94%</button>
                        </div>
                    </div>
                    <div class="adds-calc-score-wrapper">
                        <span class="adds-calc-score-label">Score</span>
                        <div id="score_spo2" class="adds-calc-score-value"></div>
                    </div>
                </div>
            </div>

            <div class="calc-box">
                <div class="adds-calc-row">
                    <div class="adds-calc-content">
                        <label class="adds-calc-label">Oxygen Support</label>
                        <div style="display:flex; gap:10px; margin-bottom:2px;">
                            <label class="o2-mode-label"><input type="radio" name="calc_o2_mode" value="std" checked> Standard (L/min)</label>
                            <label class="o2-mode-label"><input type="radio" name="calc_o2_mode" value="hf"> High Flow / FiO2</label>
                        </div>
                        <input type="text" id="calc_o2_val" placeholder="Liters or %" class="adds-calc-input">
                        <div class="quick-chip-group">
                            <button class="quick-calc o2-chip" data-target="calc_o2_val" data-mode="std" data-val="RA">RA</button>
                            <button class="quick-calc o2-chip" data-target="calc_o2_val" data-mode="std" data-val="1LNP">1LNP</button>
                            <button class="quick-calc o2-chip" data-target="calc_o2_val" data-mode="std" data-val="2LNP">2LNP</button>
                            <button class="quick-calc o2-chip" data-target="calc_o2_val" data-mode="std" data-val="3LNP">3LNP</button>
                            <button class="quick-calc o2-chip" data-target="calc_o2_val" data-mode="std" data-val="4LNP">4LNP</button>
                            <button class="quick-calc o2-chip" data-target="calc_o2_val" data-mode="hf" data-val="30%">HFNP 30%</button>
                            <button class="quick-calc o2-chip" data-target="calc_o2_val" data-mode="hf" data-val="40%">HFNP 40%</button>
                        </div>
                    </div>
                    <div class="adds-calc-score-wrapper">
                        <span class="adds-calc-score-label">Score</span>
                        <div id="score_o2" class="adds-calc-score-value"></div>
                    </div>
                </div>
            </div>

            <div class="calc-box">
                <div class="adds-calc-row">
                    <div class="adds-calc-content">
                        <label class="adds-calc-label">Blood Pressure</label>
                        <div class="bp-input-unified-container">
                            <input type="number" id="calc_sbp" placeholder="SBP" class="bp-input-unified-field">
                            <div class="bp-input-unified-divider"></div>
                            <input type="number" id="calc_dbp" placeholder="DBP" class="bp-input-unified-field">
                        </div>
                    </div>
                    <div class="adds-calc-score-wrapper">
                        <span class="adds-calc-score-label">Score</span>
                        <div id="score_sbp" class="adds-calc-score-value"></div>
                    </div>
                </div>
            </div>

            <div class="calc-box">
                <div class="adds-calc-row">
                    <div class="adds-calc-content">
                        <label class="adds-calc-label">Heart Rate</label>
                        <input type="text" id="calc_hr" placeholder="BPM" class="adds-calc-input">
                        <div class="quick-chip-group">
                            <button class="quick-calc" data-target="calc_hr" data-val="60s">60s</button>
                            <button class="quick-calc" data-target="calc_hr" data-val="70s">70s</button>
                            <button class="quick-calc" data-target="calc_hr" data-val="80s">80s</button>
                            <button class="quick-calc" data-target="calc_hr" data-val="90s">90s</button>
                            <button class="quick-calc" data-target="calc_hr" data-val="100s">100s</button>
                        </div>
                    </div>
                    <div class="adds-calc-score-wrapper">
                        <span class="adds-calc-score-label">Score</span>
                        <div id="score_hr" class="adds-calc-score-value"></div>
                    </div>
                </div>
            </div>

            <div class="calc-box">
                <div class="adds-calc-row">
                    <div class="adds-calc-content">
                        <label class="adds-calc-label">Temperature</label>
                        <input type="text" id="calc_temp" placeholder="°C" class="adds-calc-input">
                        <div class="quick-chip-group">
                            <button class="quick-calc" data-target="calc_temp" data-val="Afebrile">Afebrile</button>
                        </div>
                    </div>
                    <div class="adds-calc-score-wrapper">
                        <span class="adds-calc-score-label">Score</span>
                        <div id="score_temp" class="adds-calc-score-value"></div>
                    </div>
                </div>
            </div>

            <div class="calc-box">
                <div class="adds-calc-row">
                    <div class="adds-calc-content">
                        <label class="adds-calc-label">Consciousness</label>
                        <div class="button-group" id="calc_avpu" style="margin-top:2px;">
                            <button class="select-btn active" data-value="A">Alert</button>
                            <button class="select-btn" data-value="V">Voice</button>
                            <button class="select-btn" data-value="P">Pain</button>
                            <button class="select-btn" data-value="U">Unresp</button>
                        </div>
                    </div>
                    <div class="adds-calc-score-wrapper">
                        <span class="adds-calc-score-label">Score</span>
                        <div id="score_avpu" class="adds-calc-score-value"></div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top:8px; margin-bottom:28px; padding-top:8px; border-top:1px solid var(--line); display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--muted); letter-spacing:0.5px;">Total Score</div>
                <div id="calc_total_display" style="font-size:1.3rem; font-weight:800; color:var(--ink);">0</div>
            </div>
            
            <button id="btnHideCalc" class="quick-calc" style="position:absolute; bottom:6px; right:6px; background:var(--muted) !important; color:white !important; border:none !important; height:24px !important; padding:0 8px !important; font-size:0.75rem !important;">Hide Calc</button>
        `;
    }

    // 2. Logic & Event Listeners
    const btnToggle = document.getElementById('btnToggleCalc');
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            const c = document.getElementById('addsCalculatorContainer');
            if (c.style.display === 'none') {
                c.style.display = 'block';
                btnToggle.textContent = 'Calc';
            } else {
                c.style.display = 'none';
                btnToggle.textContent = 'Calc';
            }
        });
    }

    // Hide Calc button
    const btnHideCalc = document.getElementById('btnHideCalc');
    if (btnHideCalc) {
        btnHideCalc.addEventListener('click', () => {
            const c = document.getElementById('addsCalculatorContainer');
            const btnToggle = document.getElementById('btnToggleCalc');
            if (c) c.style.display = 'none';
            if (btnToggle) btnToggle.textContent = 'Calc';
        });
    }

    // Inputs
    const inputs = ['calc_rr', 'calc_spo2', 'calc_o2_val', 'calc_sbp', 'calc_dbp', 'calc_hr', 'calc_temp'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', runCalc);
    });

    document.querySelectorAll('input[name="calc_o2_mode"]').forEach(r => r.addEventListener('change', runCalc));

    document.querySelectorAll('#calc_avpu .select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#calc_avpu .select-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            runCalc();
        });
    });

    // Quick Chips Logic
    document.querySelectorAll('.quick-calc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.dataset.target;
            const textVal = btn.dataset.val;

            if (btn.classList.contains('o2-chip')) {
                const mode = btn.dataset.mode;
                const radio = document.querySelector(`input[name="calc_o2_mode"][value="${mode}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            }

            const inputEl = document.getElementById(targetId);
            if (inputEl) {
                inputEl.value = textVal;
                runCalc();
            }
        });
    });

    // Reset Logic
    document.addEventListener('resetAddsCalc', () => {
        inputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const r = document.querySelector('input[name="calc_o2_mode"][value="std"]');
        if (r) r.checked = true;
        document.querySelectorAll('#calc_avpu .select-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#calc_avpu .select-btn[data-value="A"]')?.classList.add('active');
        ['rr', 'spo2', 'o2', 'sbp', 'hr', 'temp', 'avpu'].forEach(k => {
            const el = document.getElementById(`score_${k}`);
            if (el) el.textContent = '';
        });
        const tot = document.getElementById('calc_total_display');
        if (tot) tot.textContent = '0';
        const mAlert = document.getElementById('mScoreAlert');
        if (mAlert) mAlert.style.display = 'none';
    });

    function parseVal(inputStr, type) {
        if (!inputStr) return NaN;
        const str = inputStr.toString().toLowerCase().trim();
        if (str.includes('afebrile')) return 36.8;
        if (str === 'ra') return 0;
        if (str.match(/^\d+s$/)) {
            const base = parseFloat(str);
            if (!isNaN(base)) return base + 5;
        }
        if (str.includes('-')) {
            const parts = str.split('-');
            if (parts.length === 2) {
                const n1 = parseFloat(parts[0]);
                const n2 = parseFloat(parts[1]);
                if (!isNaN(n1) && !isNaN(n2)) return (n1 + n2) / 2;
            }
        }
        const match = str.match(/(\d+(\.\d+)?)/);
        if (match) return parseFloat(match[1]);

        return parseFloat(str);
    }

    function getScore(type, rawVal, mode = 'std') {
        const n = parseVal(rawVal, type);
        if (isNaN(n)) return { s: 0, m: false };

        if (type === 'rr') {
            if (n >= 36 || n <= 4) return { s: 3, m: true };
            if (n >= 30) return { s: 3, m: false };
            if (n >= 25) return { s: 2, m: false };
            if (n >= 21) return { s: 1, m: false };
            if (n <= 9) return { s: 3, m: false };
            return { s: 0, m: false };
        }
        if (type === 'spo2') {
            if (n >= 94) return { s: 0, m: false };
            if (n >= 91) return { s: 1, m: false };
            if (n >= 85) return { s: 2, m: false };
            return { s: 3, m: true };
        }
        if (type === 'o2') {
            const rawStr = (rawVal || '').toString().toLowerCase();
            if (rawStr === 'ra') return { s: 0, m: false };

            if (mode === 'std') {
                if (n > 10) return { s: 3, m: false };
                if (n >= 5) return { s: 2, m: false };
                if (n >= 2) return { s: 1, m: false };
                return { s: 0, m: false };
            } else {
                if (n > 40) return { s: 3, m: false };
                if (n >= 29) return { s: 2, m: false };
                if (n >= 21) return { s: 1, m: false };
                return { s: 0, m: false };
            }
        }
        if (type === 'sbp') {
            if (n >= 200) return { s: 3, m: false };
            if (n >= 180) return { s: 2, m: false };
            if (n >= 160) return { s: 1, m: false };
            if (n <= 89) return { s: 3, m: true };
            if (n <= 99) return { s: 2, m: false };
            if (n <= 109) return { s: 1, m: false };
            return { s: 0, m: false };
        }
        if (type === 'hr') {
            if (n >= 140) return { s: 3, m: true };
            if (n >= 130) return { s: 3, m: false };
            if (n >= 110) return { s: 2, m: false };
            if (n >= 100) return { s: 1, m: false };
            if (n <= 39) return { s: 3, m: true };
            if (n <= 49) return { s: 1, m: false };
            return { s: 0, m: false };
        }
        if (type === 'temp') {
            if (n >= 38.6) return { s: 2, m: false };
            if (n >= 38.0) return { s: 1, m: false };
            if (n <= 35.0) return { s: 3, m: false };
            if (n <= 36.0) return { s: 1, m: false };
            return { s: 0, m: false };
        }
        return { s: 0, m: false };
    }

    function runCalc() {
        let total = 0;
        let isM = false;

        const rr = document.getElementById('calc_rr').value;
        const spo2 = document.getElementById('calc_spo2').value;
        const o2Mode = document.querySelector('input[name="calc_o2_mode"]:checked').value;
        const o2Val = document.getElementById('calc_o2_val').value;
        const sbp = document.getElementById('calc_sbp').value;
        const dbp = document.getElementById('calc_dbp').value;
        const hr = document.getElementById('calc_hr').value;
        const temp = document.getElementById('calc_temp').value;
        const avpuBtn = document.querySelector('#calc_avpu .select-btn.active');
        const avpu = avpuBtn ? avpuBtn.dataset.value : 'A';

        const rR = getScore('rr', rr);
        const rSp = getScore('spo2', spo2);
        const rO2 = getScore('o2', o2Val, o2Mode);
        const rBp = getScore('sbp', sbp);
        const rHr = getScore('hr', hr);
        const rTp = getScore('temp', temp);

        let rAv = { s: 0, m: false };
        if (avpu === 'V') rAv.s = 2;
        else if (avpu === 'P') rAv.s = 3;
        else if (avpu === 'U') { rAv.s = 3; rAv.m = true; }

        document.getElementById('score_rr').innerText = rR.m ? 'M' : rR.s;
        document.getElementById('score_spo2').innerText = rSp.m ? 'M' : rSp.s;
        document.getElementById('score_o2').innerText = rO2.s;
        document.getElementById('score_sbp').innerText = rBp.m ? 'M' : rBp.s;
        document.getElementById('score_hr').innerText = rHr.m ? 'M' : rHr.s;
        document.getElementById('score_temp').innerText = rTp.s;
        document.getElementById('score_avpu').innerText = rAv.m ? 'M' : rAv.s;

        total = rR.s + rSp.s + rO2.s + rBp.s + rHr.s + rTp.s + rAv.s;
        if (rR.m || rSp.m || rBp.m || rHr.m || rAv.m) isM = true;

        document.getElementById('calc_total_display').innerText = total + (isM ? ' (M)' : '');

        const mainAdds = document.getElementById('adds');
        if (mainAdds) {
            mainAdds.value = total;
            mainAdds.dispatchEvent(new Event('input'));
        }

        const mAlert = document.getElementById('mScoreAlert');
        if (mAlert) {
            mAlert.style.display = isM ? 'block' : 'none';
        }

        // --- SYNC TO A-E (Main Assessment) ---
        if (rr) syncVal('b_rr', rr);
        if (spo2) syncVal('b_spo2', spo2 + (spo2.includes('%') ? '' : '%'));

        if (o2Val) {
            syncVal('b_device', o2Val);
            const devEl = document.getElementById('b_device');
            if (devEl) devEl.dataset.manual = 'true';
        }

        // --- SYNC TO RISK ASSESSMENT (Respiratory) ---
        // If oxygen support selected in calculator, set Risk Assessment and open gate
        if (o2Val) {
            const lowerVal = o2Val.toLowerCase();
            let selectedMode = null;
            let selectedFlow = null;

            // Determine which oxygen support mode and extract flow if applicable
            if (lowerVal === 'ra') {
                selectedMode = 'RA';
            } else if (lowerVal.includes('hfnp') || (lowerVal.includes('hf') && mode === 'hf')) {
                selectedMode = 'HFNP';
            } else if (lowerVal.includes('np') || lowerVal.includes('nasal')) {
                selectedMode = 'NP';
                // Extract flow for NP
                const flowMatch = o2Val.match(/(\d+)/);
                if (flowMatch) selectedFlow = flowMatch[1];
            } else if (lowerVal.includes('niv')) {
                selectedMode = 'NIV';
            } else if (lowerVal.includes('trache')) {
                selectedMode = 'Trache';
            }

            // Only open respiratory concern gate if NOT room air and NOT low-flow NP (1L) - alarm fatigue
            const isLowFlowNP = (selectedMode === 'NP' && selectedFlow && parseInt(selectedFlow) < 2);
            if (selectedMode && selectedMode !== 'RA' && !isLowFlowNP) {
                const respGateYes = document.querySelector('#seg_resp_concern .seg-btn[data-value="true"]');
                if (respGateYes && !respGateYes.classList.contains('active')) {
                    respGateYes.click();
                }
            }

            // Click the appropriate oxygen mode button
            if (selectedMode) {
                const oxModBtn = document.querySelector(`#oxMod .select-btn[data-value="${selectedMode}"]`);
                if (oxModBtn && !oxModBtn.classList.contains('active')) {
                    oxModBtn.click();
                }
            }

            // Set NP flow if applicable
            if (selectedFlow && selectedMode === 'NP') {
                const npFlowInput = document.getElementById('npFlow');
                if (npFlowInput) {
                    npFlowInput.value = selectedFlow;
                    npFlowInput.dispatchEvent(new Event('input'));
                }
            }
        }

        if (sbp) {
            let bpStr = sbp;
            if (dbp) bpStr += `/${dbp}`;
            syncVal('c_nibp', bpStr);
        }

        if (hr) syncVal('c_hr', hr);
        if (temp) syncVal('e_temp', temp);

        // --- UPDATED AVPU MAPPING ---
        if (avpu) {
            // Updated mapping based on request
            const map = {
                'A': 'Alert',
                'V': 'alert to voice',
                'P': 'alert to pain',
                'U': 'unresponsive'
            };
            syncVal('d_alert', map[avpu] || '');
        }
    }

    function syncVal(id, val) {
        const el = document.getElementById(id);
        if (el) {
            el.value = val;
            el.dispatchEvent(new Event('input'));
        }
    }
});
