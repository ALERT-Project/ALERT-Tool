import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTool, tick, type, click } from './harness.js';

// Interface tests, against the real index.html and the real built bundle.
//
// jsdom has no layout engine, so nothing here can tell you whether the page *looks* right -
// that still needs a human and a browser. What it can prove is that the wiring is connected:
// that a control exists, that clicking it does what it claims, and that the things removed
// over the last few batches are genuinely gone rather than merely hidden.
//
// Run against dist/bundle.js, so `npm run build` has to have happened first.

test('page loads and the tool initialises', async () => {
    const { document, close } = await loadTool();
    assert.ok(document.getElementById('catText'), 'category display exists');
    assert.equal(document.getElementById('catText').textContent, 'CAT 3', 'starts at CAT 3');
    close();
});

test('every input and textarea opts out of browser autofill', async () => {
    const { document, close } = await loadTool();
    const fields = [...document.querySelectorAll('input, textarea')];
    const missing = fields.filter(el => el.getAttribute('autocomplete') !== 'off');
    assert.ok(fields.length > 100, `sanity: found ${fields.length} fields`);
    assert.deepEqual(missing.map(el => el.id || '(no id)'), [],
        'includes fields injected by plugins after startup');
    close();
});

test('spellcheck is disabled, so browsers cannot send free text to a remote checker', async () => {
    const { document, close } = await loadTool();
    const checked = [...document.querySelectorAll('textarea')].filter(el => el.getAttribute('spellcheck') !== 'false');
    assert.deepEqual(checked.map(el => el.id), []);
    close();
});

test('the privacy screen exists and starts hidden', async () => {
    const { document, close } = await loadTool();
    const screen = document.getElementById('privacyScreen');
    assert.ok(screen);
    assert.ok(screen.hidden, 'not covering the page on load');
    close();
});

test('typing a risk factor moves the category', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptAge', '82');
    await tick(window);
    assert.equal(document.getElementById('catText').textContent, 'CAT 2');
    type(window, 'c_hr', '140');
    await tick(window);
    assert.equal(document.getElementById('catText').textContent, 'CAT 1');
    close();
});

test('the notice region shows one notice at a time and counts the rest', async () => {
    const { window, document, close } = await loadTool();
    const region = document.getElementById('noticeRegion');

    // Completeness is the only notice on a blank form.
    await tick(window);
    assert.ok(!region.hidden, 'completeness nudge is showing');
    assert.match(region.textContent, /Not yet recorded/);
    assert.equal(region.querySelectorAll('.notice-title').length, 1, 'exactly one notice rendered');

    // Fill the identifiers and it stands down.
    type(window, 'ptName', 'ABC');
    type(window, 'ptMrn', '123');
    type(window, 'reviewerInitials', 'XY');
    document.getElementById('ptWard').value = '6B';
    document.getElementById('ptWard').dispatchEvent(new window.Event('change', { bubbles: true }));
    await tick(window);
    assert.ok(region.hidden, 'nothing left to say');
    close();
});

test('the completeness notice asks for initials, not a patient name', async () => {
    const { window, document, close } = await loadTool();
    await tick(window);
    const text = document.getElementById('noticeRegion').textContent;
    assert.match(text, /Patient initials/);
    assert.ok(!/Patient Name/.test(text), 'the tool only ever collects initials');
    close();
});

test('the discharge confirmation is shown for CAT 1, not only CAT 3', async () => {
    const { window, document, close } = await loadTool();
    const modal = document.getElementById('dischargeConfirmModal');
    assert.ok(modal, 'modal exists under its new, category-neutral id');
    assert.notEqual(modal.style.display, 'flex', 'starts closed');

    // A CAT 1 patient, ticked for discharge, must still be asked.
    type(window, 'c_hr', '140');
    await tick(window);
    assert.equal(document.getElementById('catText').textContent, 'CAT 1');

    const chk = document.getElementById('chk_discharge_alert');
    chk.checked = true;
    chk.dispatchEvent(new window.Event('change', { bubbles: true }));
    await tick(window);

    assert.equal(modal.style.display, 'flex', 'confirmation opened');
    assert.equal(chk.checked, false, 'discharge is not applied until confirmed');
    close();
});

test('the discharge question changes with the review mode', async () => {
    const { window, document, close } = await loadTool();
    const body = document.getElementById('discharge_confirm_body');

    window.openDischargeConfirm('full');
    assert.match(body.textContent, /2 completed ALERT reviews/);
    assert.ok(!/physical/i.test(body.textContent), 'does not ask about something already true');

    const chart = document.querySelector('input[name="reviewModeType"][value="chart"]');
    chart.checked = true;
    chart.dispatchEvent(new window.Event('change', { bubbles: true }));
    window.openDischargeConfirm('full');
    assert.match(body.textContent, /one physical review/, 'asks only when today is a chart review');
    close();
});

test('confirming discharge applies it; declining does not', async () => {
    const { window, document, close } = await loadTool();
    window.openDischargeConfirm('full');
    click(window, '#btn_discharge_confirm_no');
    await tick(window);
    assert.equal(document.getElementById('chk_discharge_alert').checked, false);

    window.openDischargeConfirm('full');
    click(window, '#btn_discharge_confirm_yes');
    await tick(window);
    assert.equal(document.getElementById('chk_discharge_alert').checked, true);
    close();
});

test('the LOS mitigator appears only past 4 days, and suppresses the escalation', async () => {
    const { window, document, close } = await loadTool();
    const wrapper = document.getElementById('los_risk_wrapper');
    assert.equal(wrapper.style.display, 'none', 'hidden for a short stay');

    type(window, 'icuLos', '6');
    type(window, 'bl_wcc', '18');
    await tick(window);
    assert.equal(wrapper.style.display, 'block', 'offered for a long stay');
    assert.equal(document.getElementById('catText').textContent, 'CAT 1');

    click(window, '#btn_los_mitigated');
    await tick(window);
    assert.equal(document.getElementById('catText').textContent, 'CAT 2', 'no longer escalates');
    close();
});

test('the LOS mitigator is not offered once immobility is recorded', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'icuLos', '6');
    await tick(window);
    assert.equal(document.getElementById('los_risk_wrapper').style.display, 'block');

    click(window, '#seg_immobility .seg-btn[data-value="true"]');
    await tick(window);
    assert.equal(document.getElementById('los_risk_wrapper').style.display, 'none');
    close();
});

test('both mitigator boxes collapse when the form is cleared', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptAge', '82');
    type(window, 'icuLos', '6');
    await tick(window);
    assert.equal(document.getElementById('age_risk_wrapper').style.display, 'block');
    assert.equal(document.getElementById('los_risk_wrapper').style.display, 'block');

    click(window, '#confirmClearData');
    await tick(window);
    assert.equal(document.getElementById('age_risk_wrapper').style.display, 'none');
    assert.equal(document.getElementById('los_risk_wrapper').style.display, 'none');
    assert.equal(document.getElementById('los_mitigate_reason').value, '');
    close();
});

test('the infection downtrend question no longer mentions antibiotics', async () => {
    const { document, close } = await loadTool();
    const labels = [...document.querySelectorAll('label')].map(l => l.textContent).join(' ');
    assert.ok(!/antibiotic/i.test(labels), 'the three-part question is gone from every label');
    assert.match(labels, /infection markers\s+downtrending/i);
    close();
});

test('the orphaned handover banner is gone', async () => {
    const { document, close } = await loadTool();
    assert.equal(document.getElementById('handoverBanner'), null);
    assert.equal(document.getElementById('btnApproveHandoverDischarge'), null);
    close();
});

test('new fields are present and registered', async () => {
    const { document, close } = await loadTool();
    ['bloods_date', 'bloods_time', 'inr_target', 'aptt_target', 'los_mitigate_reason']
        .forEach(id => assert.ok(document.getElementById(id), `#${id} exists`));
    close();
});

test('the generated note carries no characters the DMR cannot render', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    type(window, 'icuLos', '6');
    type(window, 'c_hr', '118');
    type(window, 'bl_hb', '94');
    window.prevBloods = { hb: '118', cr_review: '120' };
    type(window, 'bl_cr_review', '180');
    await tick(window);

    click(window, '#btn_generate_summary');
    await tick(window);

    const note = document.getElementById('summary').value;
    assert.ok(note.length > 0, 'a note was produced');
    const nonAscii = note.match(/[^\x00-\x7F]/g);
    assert.deepEqual(nonAscii, null, `note contains ${nonAscii} which the DMR cannot render`);
    close();
});

test('the note states no review-hours commitment and keeps one risk list', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    type(window, 'icuLos', '6');
    await tick(window);
    click(window, '#btn_generate_summary');
    await tick(window);

    const note = document.getElementById('summary').value;
    assert.match(note, /ALERT nursing post ICU reviews continue/);
    assert.ok(!/up to \d+h post-ICU stepdown/.test(note), 'no hours promised in the record');
    assert.ok(!/Considered, not counted/.test(note), 'one list, not two');
    assert.match(note, /mitigated: no other risk factors identified/, 'discounted risks say so inline');
    close();
});

test('the on-screen plan still shows the review schedule', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptAge', '82');
    await tick(window);
    assert.match(document.getElementById('followUpInstructions').textContent, /48h/,
        'the ladder stays on screen for the clinician');
    close();
});

// --- PICS risk score panel --------------------------------------------------------------------

test('the PICS panel is built from the item table and every row is registered', async () => {
    const { document, close } = await loadTool();
    const ids = ['pics_p01', 'pics_p02', 'pics_p03', 'pics_p04', 'pics_p05', 'pics_p06',
        'pics_p07', 'pics_p08', 'pics_p09', 'pics_p10', 'pics_p11'];
    const missing = ids.filter(id => !document.getElementById(`toggle_${id}`));
    assert.deepEqual(missing, [], 'all eleven item rows exist');
    assert.ok(document.getElementById('pics_score_value'), 'running total');
    assert.ok(document.getElementById('pics_band_chip'), 'band chip');
    // The old binary survives as the override, so nothing downstream loses its control.
    assert.ok(document.querySelector('#seg_pics .seg-btn[data-value="positive"]'));
    close();
});

test('a derived item ticks itself and says so', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'icuLos', '7');
    await tick(window);

    const los = document.getElementById('toggle_pics_p08');
    assert.equal(los.dataset.value, 'true', 'ICU LOS >3 days ticked itself');
    assert.match(los.textContent, /auto: ICU LOS/, 'and is marked as the tool doing it');
    assert.equal(document.getElementById('pics_score_value').textContent, '1');
    close();
});

test('unticking a derived item sticks across a save and reload', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'icuLos', '7');
    await tick(window);
    assert.equal(document.getElementById('toggle_pics_p08').dataset.value, 'true');

    click(window, '#toggle_pics_p08');
    await tick(window);
    assert.equal(document.getElementById('toggle_pics_p08').dataset.value, 'false',
        'the clinician overruled the derivation');
    assert.equal(document.getElementById('pics_score_value').textContent, '0');

    // sessionStorage is what a refresh restores from.
    const saved = JSON.parse(window.sessionStorage.getItem('alertToolData_v7_7'));
    assert.ok(saved.pics_manual.includes('pics_p08'), 'the override is persisted, not just painted');
    close();
});

test('a high score reaches the note and the plan, and stays out of red', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    click(window, '#toggle_pics_p01');   // ventilation >48h, 3
    click(window, '#toggle_pics_p02');   // CAM-ICU positive, 3
    await tick(window);

    assert.equal(document.getElementById('pics_score_value').textContent, '6');
    assert.match(document.getElementById('pics_band_chip').textContent, /High risk/);
    assert.equal(document.getElementById('catText').textContent, 'CAT 2', 'amber, never red');

    click(window, '#btn_generate_summary');
    await tick(window);
    const note = document.getElementById('summary').value;
    assert.match(note, /Post ICU Syndrome: High risk - PICS score 6 \(Dhanju 2026, local score\)/);
    assert.match(note, /mechanical ventilation >48h/, 'the note carries the working');
    assert.match(note, /- PICS high risk: formal PICS alert given at handover/, 'band action in the plan');
    close();
});

test('the plan action can be taken out before the note is generated', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    click(window, '#toggle_pics_p01');
    click(window, '#toggle_pics_p02');
    await tick(window);

    const chk = document.getElementById('chk_pics_action');
    assert.equal(chk.checked, true, 'pre-ticked, because it usually applies');
    chk.checked = false;
    chk.dispatchEvent(new window.Event('change', { bubbles: true }));
    await tick(window);

    click(window, '#btn_generate_summary');
    await tick(window);
    const note = document.getElementById('summary').value;
    assert.ok(!/PICS high risk: formal PICS alert/.test(note), 'the action is gone');
    assert.match(note, /Post ICU Syndrome: High risk/, 'the score itself stays');
    close();
});

test('a patient with no PICS input says nothing about it', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    await tick(window);
    click(window, '#btn_generate_summary');
    await tick(window);
    assert.ok(!/Post ICU Syndrome/.test(document.getElementById('summary').value));
    close();
});
