import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTool, tick, type, click, generateNote } from './harness.js';
import { iconSetForPath } from '../src/js/utils.js';
import { readFileSync } from 'node:fs';

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

    generateNote(window);
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
    generateNote(window);
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


// --- Data minimisation --------------------------------------------------------------------

test('an imported note cannot put a full name or URN into the tool', async () => {
    const { window, document, close } = await loadTool();
    // maxlength stops a clinician typing a full name; it does not stop the importer assigning
    // one, which is how a DMR note's real identifiers would have got in.
    type(window, 'importText', [
        'ALERT CNS post ICU review - Physical review',
        'Patient: Casey Bond | URN: ...9876543 | Location: 4B, Room: 12',
        'Age: 61'
    ].join('\n'));
    click(window, '#runImport');
    await tick(window);

    assert.equal(document.getElementById('ptName').value, 'CB', 'reduced to initials');
    assert.equal(document.getElementById('ptMrn').value, '543', 'last three digits only');
    close();
});

test('initials already in the tool\'s own format survive a round trip', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'importText', 'Patient: ABC | URN: ...123 | Location: 4B, Room: 12');
    click(window, '#runImport');
    await tick(window);
    assert.equal(document.getElementById('ptName').value, 'ABC', 'not collapsed to one letter');
    close();
});

test('the identifier fields cannot be typed past three characters', async () => {
    const { document, close } = await loadTool();
    assert.equal(document.getElementById('ptName').getAttribute('maxlength'), '3');
    assert.equal(document.getElementById('ptMrn').getAttribute('maxlength'), '3');
    close();
});

test('a room label with a letter in it imports and stays editable', async () => {
    const { window, document, close } = await loadTool();
    // #ptBed used to be type=number, which discards "24B" on assignment: the scraped room
    // vanished and could not be typed back in either.
    type(window, 'importText', 'Patient: ABC | URN: ...123 | Location: 4B, Room: 24B');
    click(window, '#runImport');
    await tick(window);

    assert.equal(document.getElementById('ptBed').value, '24B');
    type(window, 'ptBed', 'A4');
    assert.equal(document.getElementById('ptBed').value, 'A4');
    close();
});

test('a note written with blank identifiers does not import its own dashes', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'importText', 'Patient: -- | URN: ... | Location: --, Room: --');
    click(window, '#runImport');
    await tick(window);

    assert.equal(document.getElementById('ptName').value, '');
    assert.equal(document.getElementById('ptBed').value, '');
    close();
});

test('2L nasal prongs scores on the ADDS calculator', async () => {
    const { window, document, close } = await loadTool();
    click(window, '#btnAddsOverride');   // no-op if absent; the calculator lives in the page
    click(window, '.o2-chip[data-val="RA"]');
    await tick(window);
    assert.equal(String(document.getElementById('score_o2').innerText), '0', 'room air scores nothing');

    click(window, '.o2-chip[data-val="1LNP"]');
    await tick(window);
    assert.equal(String(document.getElementById('score_o2').innerText), '0', '1L stays at nothing');

    click(window, '.o2-chip[data-val="2LNP"]');
    await tick(window);
    assert.equal(String(document.getElementById('score_o2').innerText), '1', '2L scores 1');

    click(window, '.o2-chip[data-val="3LNP"]');
    await tick(window);
    assert.equal(String(document.getElementById('score_o2').innerText), '1', 'and so does 3L');
    close();
});

test('a manual category selection is not annotated in the DMR note', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    type(window, 'adds', '4');
    await tick(window);
    click(window, '#override_amber');
    await tick(window);

    generateNote(window);
    await tick(window);
    const note = document.getElementById('summary').value;
    assert.ok(note.includes('ALERT Nursing Review Category - CAT 2'), 'the clinician\'s choice is the category');
    assert.ok(!/manually set/i.test(note), 'and it is not editorialised');
    close();
});

test('the device dwell line reports days without calling them long', async () => {
    const { window, document, close } = await loadTool();
    const old = new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10);
    click(window, '.device-add-group .btn[data-device-type="PIVC"]');
    await tick(window);
    const dateEl = document.querySelector('#devices-container .device-date');
    assert.ok(dateEl, 'the PIVC row was added');
    dateEl.value = old;
    dateEl.dispatchEvent(new window.Event('change', { bubbles: true }));
    await tick(window);

    const shown = document.getElementById('devices-container').textContent;
    assert.match(shown, /12d dwell/, 'the day count is still reported');
    assert.ok(!/long dwell/i.test(shown), 'no "long"/"very long" wording on screen');

    type(window, 'ptName', 'ABC');
    generateNote(window);
    await tick(window);
    const note = document.getElementById('summary').value;
    assert.match(note, /12d dwell/);
    assert.ok(!/long dwell/i.test(note), 'nor in the note');
    close();
});

test('the reviewer field marks itself until it is signed', async () => {
    const { window, document, close } = await loadTool();
    const field = document.querySelector('.rs-field-reviewer');
    assert.ok(field, 'the reviewer field is its own marked block');

    type(window, 'ptName', 'ABC');
    await tick(window);
    assert.ok(field.classList.contains('reviewer-missing'), 'unsigned notes say so');

    type(window, 'reviewerInitials', 'CB');
    await tick(window);
    assert.ok(!field.classList.contains('reviewer-missing'), 'and stop once signed');
    close();
});

// --- Note hygiene: only fields with data reach the DMR -----------------------------------

test('a note with no ward or bed prints no location and no dashes', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    type(window, 'icuLos', '6');
    await tick(window);
    generateNote(window);
    await tick(window);

    const note = document.getElementById('summary').value;
    assert.match(note, /Patient: ABC/);
    assert.ok(!/Location:/.test(note), 'no empty Location');
    assert.ok(!/Room:/.test(note), 'no empty Room');
    assert.ok(!/--/.test(note), 'no placeholder dashes anywhere in the note');
    assert.ok(!/Reason for ICU Admission/.test(note), 'no empty admission reason');
    close();
});

test('the note names the ward the clinician typed, not the word "Other"', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    type(window, 'ptWard', 'Other');
    type(window, 'ptWardOther', 'Short Stay Unit');
    type(window, 'ptBed', '4A');
    await tick(window);
    generateNote(window);
    await tick(window);

    const note = document.getElementById('summary').value;
    assert.match(note, /Location: Short Stay Unit, Room: 4A/);
    assert.ok(!/Location: Other/.test(note));
    close();
});

test('the reviewer field holds initials, not a name', async () => {
    const { document, close } = await loadTool();
    assert.equal(document.getElementById('reviewerInitials').getAttribute('maxlength'), '3');
    close();
});

// --- Quick Review layout ------------------------------------------------------------------

test('the category buttons live inside the category card and still work', async () => {
    const { window, document, close } = await loadTool();
    // They used to be a separate card 800 lines up the page. The move must not break the
    // listeners bound to them by id.
    assert.ok(document.getElementById('section-category').contains(document.getElementById('override_red')),
        'the decision sits with the evidence for it');

    type(window, 'ptName', 'ABC');
    await tick(window);
    click(window, '#override_red');
    await tick(window);
    assert.equal(document.getElementById('catText').textContent, 'CAT 1');
    close();
});

test('Quick Review fills the empty write-up panel with a prompt', async () => {
    const { window, document, close } = await loadTool();
    const list = document.getElementById('scraped_issues_list');
    assert.equal(list.innerHTML, '', 'Full Review leaves it blank');

    click(window, 'input[name="reviewDepth"][value="quick"]');
    await tick(window);
    assert.match(list.textContent, /Add issues from your review/, 'Quick Review says what to do with it');

    click(window, 'input[name="reviewDepth"][value="full"]');
    await tick(window);
    assert.equal(list.innerHTML, '', 'and the prompt does not linger on the way back');
    close();
});

test('Quick Review puts lines in the rail and the write-up in the wide column', async () => {
    const { window, document, close } = await loadTool();
    click(window, 'input[name="reviewDepth"][value="quick"]');
    await tick(window);

    const inCell = (cell, id) => document.getElementById(cell).contains(document.getElementById(id));
    assert.ok(inCell('qgLeft', 'section-devices'), 'lines moved to the rail');
    assert.ok(inCell('qgRight', 'scraped_risks_wrapper'));
    assert.ok(inCell('qgRight', 'quick_notes_wrapper'), 'notes joined to the review list');
    assert.ok(inCell('qgBottom', 'override_card'), 'category buttons ride with the bottom band');
    close();
});

test('the Quick Review-only cards carry no inline display of their own', async () => {
    const { window, document, close } = await loadTool();
    // Their visibility moved from an inline style to body.quick-review-active in style.css:
    // the inline display outranked the stylesheet, so the write-up panel could never be the
    // flex column it needs to be to stretch, and it kept a dead band at its foot. jsdom does
    // not load the stylesheet (see harness.js), so what is asserted here is that nothing
    // writes an inline display any more - the CSS itself is verified in a real browser.
    const notes = document.getElementById('quick_notes_wrapper');
    const list = document.getElementById('scraped_risks_wrapper');
    assert.equal(notes.style.display, '');
    assert.equal(list.style.display, '');

    click(window, 'input[name="reviewDepth"][value="quick"]');
    await tick(window);
    assert.equal(notes.style.display, '', 'entering Quick Review must not set one');
    assert.equal(list.style.display, '');

    click(window, 'input[name="reviewDepth"][value="full"]');
    await tick(window);
    assert.equal(notes.style.display, '', 'nor must leaving it');
    assert.equal(list.style.display, '');
    close();
});

test('a floating Quick Review card can be closed from its own corner', async () => {
    const { window, document, close } = await loadTool();
    click(window, 'input[name="reviewDepth"][value="quick"]');
    await tick(window);

    click(window, '#btnBloodsDetailsToggle');
    await tick(window);
    const bloods = document.getElementById('section-bloods');
    assert.ok(bloods.classList.contains('qr-expanded'), 'the card floats over the page');

    // Closing used to mean finding the Details toggle again, which scrolls out of sight.
    click(window, '#section-bloods .qr-overlay-close');
    await tick(window);
    assert.ok(!bloods.classList.contains('qr-expanded'), 'the corner button closes it');
    assert.ok(document.getElementById('qrBackdrop').hidden, 'and takes the backdrop with it');
    close();
});

test('the floating bloods card can also be closed from the bottom', async () => {
    const { window, document, close } = await loadTool();
    click(window, 'input[name="reviewDepth"][value="quick"]');
    await tick(window);

    click(window, '#btnBloodsDetailsToggle');
    await tick(window);
    const bloods = document.getElementById('section-bloods');
    assert.ok(bloods.classList.contains('qr-expanded'), 'the card floats over the page');

    // The corner ✕ is sticky, so it never scrolls off - but it is still at the top of a card
    // longer than the overlay. Having scrolled to the end of the bloods grid, the way out
    // should be right there, the way the ADDS calculator has offered it since May.
    const bottom = document.querySelector('#section-bloods .qr-overlay-close-bottom');
    assert.ok(bottom, 'there is a close at the bottom too');
    assert.equal(bloods.lastElementChild, bottom, 'and it is the last thing in the card');

    click(window, bottom);
    await tick(window);
    assert.ok(!bloods.classList.contains('qr-expanded'), 'it closes the card');
    assert.ok(document.getElementById('qrBackdrop').hidden, 'and takes the backdrop with it');
    close();
});

test('a clotting target box suggests no target of its own', async () => {
    const { window, document, close } = await loadTool();
    // "target 2-3" and "target 60-90" read as this patient's target rather than as an example
    // of what to type, which is a clinical claim the tool has no basis for making.
    for (const id of ['inr_target', 'aptt_target']) {
        const el = document.getElementById(id);
        assert.equal(el.placeholder, 'target', `${id} names the field without naming a range`);
        assert.ok(/target/i.test(el.getAttribute('aria-label') || ''), `${id} still says what it is`);
    }
    close();
});

test('what the clinician writes down reaches the DMR note as plain bullets', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    type(window, 'adds', '2');
    type(window, 'quickNotes', 'Reviewed with bedside nurse\nPlan discussed with team');
    await tick(window);

    type(window, 'manualIssueInput', 'Mobilising with 1 assist');
    click(window, '#btnAddIssue');
    type(window, 'manualIssueInput', 'Family updated re GOC');
    click(window, '#btnAddIssue');
    await tick(window);

    generateNote(window);
    await tick(window);
    let note = document.getElementById('summary').value;

    // Review List entries and Quick Notes both used to stop at the handover line or go
    // nowhere at all. They are bullets under the score and the bloods now, with no heading.
    assert.match(note, /- Mobilising with 1 assist/);
    assert.match(note, /- Family updated re GOC/);
    assert.match(note, /- Reviewed with bedside nurse/, 'Quick Notes reaches the note');
    assert.match(note, /- Plan discussed with team/, 'one bullet per line');

    // They must land before the risk section, not inside it - that section says what drove
    // the category, and a typed item is not a readmission risk factor.
    const risksAt = note.indexOf('IDENTIFIED ICU READMISSION RISK FACTORS');
    assert.ok(note.indexOf('- Mobilising with 1 assist') < risksAt, 'bulleted above the risk section');
    assert.ok(note.indexOf('- Reviewed with bedside nurse') < risksAt);
    assert.ok(note.indexOf('- Mobilising with 1 assist') > note.indexOf('ADDS: 2'), 'and below the score');

    // Resolving an entry takes it out, the same way it leaves the handover line.
    click(window, '#scraped_issues_list .scraped-issue-row .scraped-issue-resolve');
    await tick(window);
    generateNote(window);
    await tick(window);
    note = document.getElementById('summary').value;
    assert.ok(!/Mobilising with 1 assist/.test(note), 'resolved entries drop out');
    assert.match(note, /Family updated re GOC/, 'the rest stay');
    close();
});

test('an issue row explains its own controls', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'manualIssueInput', 'Awaiting speech path review');
    click(window, '#btnAddIssue');
    await tick(window);

    const row = document.querySelector('#scraped_issues_list .scraped-issue-row');
    assert.equal(row.querySelector('.scraped-issue-resolve').textContent, 'resolve', 'a word, not a bare checkbox');
    assert.ok(row.querySelector('.scraped-issue-edit-btn'), 'a pencil says the row can be edited');
    assert.equal(row.querySelector('.scraped-issue-delete'), null, 'delete is gone - resolve does the same job, reversibly');
    assert.match(document.getElementById('issues_count').textContent, /1 open/);

    // The pencil opens the same inline editor the text does.
    click(window, '#scraped_issues_list .scraped-issue-edit-btn');
    await tick(window);
    const editor = document.querySelector('#scraped_issues_list .scraped-issue-edit');
    assert.ok(editor, 'the pencil opens the editor');
    editor.value = 'Awaiting SLT review';
    editor.dispatchEvent(new window.Event('blur'));
    await tick(window);
    assert.match(document.querySelector('.scraped-issue-text').textContent, /Awaiting SLT review/);

    click(window, '#scraped_issues_list .scraped-issue-resolve');
    await tick(window);
    assert.equal(document.querySelector('.scraped-issue-resolve').textContent, 'undo');
    assert.match(document.getElementById('issues_count').textContent, /1 resolved/);
    close();
});

test('the note cannot be generated until the review method is answered', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    await tick(window);

    // Nothing is pre-ticked, so the strip starts genuinely unanswered.
    assert.equal(document.querySelector('input[name="reviewModeType"]:checked'), null,
        'no review method is assumed on the clinician\'s behalf');

    click(window, '#btn_generate_summary');
    await tick(window);
    assert.equal(document.getElementById('summary').value, '', 'no note until the question is answered');
    assert.equal(document.getElementById('reviewMethodPrompt').style.display, 'flex', 'the question is asked instead');

    // Answering it resumes the click that raised it - the button does not need pressing twice.
    click(window, '#btn_method_chart');
    await tick(window);
    assert.equal(document.getElementById('reviewMethodPrompt').style.display, 'none');
    const note = document.getElementById('summary').value;
    assert.ok(note.length > 0, 'the note generates once the method is known');
    assert.match(note, /Chart review/, 'and it records the method that was chosen');
    close();
});

test('a review method already chosen on the strip is not asked about again', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    click(window, 'input[name="reviewModeType"][value="physical"]');
    await tick(window);

    click(window, '#btn_generate_summary');
    await tick(window);
    assert.notEqual(document.getElementById('reviewMethodPrompt').style.display, 'flex', 'no interruption');
    assert.match(document.getElementById('summary').value, /Physical review/);
    close();
});

test('the review method does not carry over to the next patient', async () => {
    const { window, document, close } = await loadTool();
    click(window, 'input[name="reviewModeType"][value="chart"]');
    type(window, 'ptName', 'ABC');
    await tick(window);
    assert.equal(document.querySelector('input[name="reviewModeType"]:checked').value, 'chart');

    click(window, '#clearDataBtnTop');
    click(window, '#confirmClearData');
    await tick(window);

    assert.equal(document.querySelector('input[name="reviewModeType"]:checked'), null,
        'the next patient starts with the question open, not the last answer');
    close();
});

test('the heart rate reads as a sentence with and without a rhythm', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    type(window, 'c_hr', '88');
    type(window, 'c_nibp', '120/70');
    await tick(window);
    generateNote(window);
    await tick(window);

    assert.match(document.getElementById('summary').value, /C: HR 88, NIBP 120\/70/, 'no gap before the comma');

    type(window, 'c_hr_rhythm', 'AF');
    await tick(window);
    generateNote(window);
    await tick(window);
    assert.match(document.getElementById('summary').value, /C: HR 88 \(AF\), NIBP 120\/70/, 'the rhythm keeps its space');
    close();
});

test('a half-typed stepdown date does not raise the quick review prompt', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    // What a date input reports part-way through typing the year "2026".
    type(window, 'stepdownDate', '0202-01-01');
    await tick(window);
    assert.notEqual(document.getElementById('quickReviewPrompt').style.display, 'flex',
        'a year that cannot be real is a typo in progress, not a long-stay patient');

    // A real stepdown two days ago still offers it.
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    type(window, 'stepdownDate', twoDaysAgo);
    await tick(window);
    assert.equal(document.getElementById('quickReviewPrompt').style.display, 'flex', 'the real offer still works');
    close();
});

test('mobility levels read as prose, and a scraped one is not stacked twice', async () => {
    const { window, document, close } = await loadTool();
    click(window, '.quick-select[data-target="ae_mobility"][data-value="1x assist"]');
    await tick(window);
    assert.equal(document.getElementById('ae_mobility').value, '1x assist', 'lower case mid-sentence');

    // A note imported from before this change carries the old capitalisation. Clicking the
    // button for what is already recorded must not record it a second time.
    type(window, 'ae_mobility', '1x Assist');
    click(window, '.quick-select[data-target="ae_mobility"][data-value="1x assist"]');
    await tick(window);
    assert.equal(document.getElementById('ae_mobility').value, '1x Assist', 'the scraped entry stands alone');
    close();
});

test('a score with no A-E findings prints as a bare score, not under a heading', async () => {
    const { window, document, close } = await loadTool();
    type(window, 'ptName', 'ABC');
    type(window, 'adds', '2');
    await tick(window);
    generateNote(window);
    await tick(window);

    let note = document.getElementById('summary').value;
    assert.match(note, /ADDS: 2/, 'the score is there');
    assert.ok(!/A-E ASSESSMENT:/.test(note), 'with no heading announcing an assessment that was not done');

    // Record something under A-E and the heading comes back.
    type(window, 'b_rr', '18');
    await tick(window);
    generateNote(window);
    await tick(window);
    note = document.getElementById('summary').value;
    assert.match(note, /A-E ASSESSMENT:/, 'the heading returns once there is an assessment');
    assert.match(note, /ADDS: 2/);
    assert.match(note, /B: RR 18/);
    close();
});

// --- Home screen icons ------------------------------------------------------
//
// The live tool and the pilot are the same origin serving the same commit, so the icon a
// saved shortcut gets is decided at runtime from the path. These tests hold that apart:
// the static tags in index.html must be the live tool's, and only the pilot path may
// change them.

test('the path picks the icon set, and anything unrecognised gets the live tool', () => {
    assert.equal(iconSetForPath('/alert-tool-testing/'), 'test');
    assert.equal(iconSetForPath('/alert-tool-testing/index.html'), 'test');
    assert.equal(iconSetForPath('/ALERT-Tool/'), 'alert');
    assert.equal(iconSetForPath('/'), 'alert', 'a local file or preview server is not the pilot');
});

test('the page ships installable as a web app', async () => {
    const { document, close } = await loadTool();
    assert.ok(document.querySelector('link[rel="manifest"]'), 'has a manifest');
    assert.ok(document.querySelector('link[rel="apple-touch-icon"]'), 'iOS ignores manifest icons');
    assert.ok(document.querySelector('meta[name="theme-color"]'), 'has a theme colour');
    // iOS will not take an SVG or a data: URI here, which is why the PNGs are committed.
    const apple = document.querySelector('link[rel="apple-touch-icon"]').getAttribute('href');
    assert.match(apple, /\.png$/, 'apple-touch-icon must be a real PNG file');
    close();
});

test('the live tool keeps the teal icon', async () => {
    const { document, close } = await loadTool({ url: 'https://alert-project.github.io/ALERT-Tool/' });
    assert.equal(document.getElementById('linkManifest').getAttribute('href'), 'manifest.json');
    assert.match(document.getElementById('linkAppleIcon').getAttribute('href'), /alert-180\.png$/);
    assert.equal(document.getElementById('metaThemeColor').getAttribute('content'), '#0f766e');
    assert.equal(document.getElementById('metaAppTitle').getAttribute('content'), 'A! Tool',
        'the label sitting under the icon on a home screen');
    assert.ok(!/PILOT/.test(document.title), 'the live tool does not call itself a pilot');
    close();
});

test('the pilot swaps to the amber TEST icon and says so in the title', async () => {
    const { document, close } = await loadTool({ url: 'https://alert-project.github.io/alert-tool-testing/' });
    assert.equal(document.getElementById('linkManifest').getAttribute('href'), 'manifest-test.json');
    assert.match(document.getElementById('linkAppleIcon').getAttribute('href'), /test-180\.png$/);
    assert.match(document.getElementById('linkFavicon').getAttribute('href'), /test\.svg$/);
    assert.equal(document.getElementById('metaThemeColor').getAttribute('content'), '#f59e0b');
    assert.equal(document.getElementById('metaAppTitle').getAttribute('content'), 'A! Test',
        'the label sitting under the icon on a home screen');
    assert.match(document.title, /PILOT/, 'standalone mode hides the URL bar, so the title has to say it');
    close();
});

test('the version in the footer matches the one in the file banner', () => {
    // Two hand-maintained strings that mean the same thing. They went out of step once and
    // stayed that way through several releases, because only one of them is on screen.
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const stamps = [...html.matchAll(/ALERT (?:Nursing Risk Assessment )?Tool\s+(A[\d.]+)\s+\(([^)]+)\)/g)]
        .map(m => `${m[1]} (${m[2]})`);
    assert.equal(stamps.length, 2, 'banner comment and page footer');
    assert.equal(stamps[0], stamps[1], 'version and date must agree');
});
