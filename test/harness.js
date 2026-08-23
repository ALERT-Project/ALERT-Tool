import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Loads the real index.html with the real built bundle, so these tests exercise the same
// markup and the same code the ward gets - not a reconstruction of it. jsdom has no layout
// engine, so anything about how the page *looks* is out of scope here; what it can prove is
// that the wiring is connected and the behaviour fires.
// `url` matters for anything that reads location: the live tool and the pilot are the same
// origin serving the same bytes, so the path is what tells them apart.
export async function loadTool({ url = 'http://localhost/' } = {}) {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8');
    const dom = new JSDOM(html, {
        url,
        runScripts: 'dangerously',
        pretendToBeVisual: true
    });

    const { window } = dom;
    // Wait for jsdom's own load before injecting, so document.readyState is 'complete'. The
    // bundle self-initialises on readyState, and the plugins wait for DOMContentLoaded - if
    // both that event and ours fire, initialize() runs twice and every listener is doubled,
    // which makes toggles flip twice and look broken.
    await new Promise(res => window.addEventListener('load', res, { once: true }));
    // Scripts are injected rather than fetched: jsdom's resource loader would go looking for
    // the font and the stylesheet too, which are irrelevant here and slow.
    for (const src of ['dist/bundle.js', 'plugins/redcap.js', 'plugins/adds_calc.js', 'plugins/importer.js']) {
        const el = window.document.createElement('script');
        el.textContent = readFileSync(resolve(root, src), 'utf8');
        window.document.body.appendChild(el);
    }

    window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
    await tick(window);
    // close() releases the jsdom window. Leaving it open keeps Node's event loop alive if
    // anything in the page has scheduled a timer.
    return { dom, window, document: window.document, close: () => dom.window.close() };
}

// computeAll is debounced at 350ms, so tests have to wait for it rather than assume.
export function tick(window, ms = 400) {
    return new Promise(res => window.setTimeout(res, ms));
}

export const $ = (document, id) => document.getElementById(id);

// Types into a field the way a clinician would, so the input handlers actually run.
export function type(window, id, value) {
    const el = window.document.getElementById(id);
    if (!el) throw new Error(`no element #${id}`);
    el.value = value;
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
    el.dispatchEvent(new window.Event('change', { bubbles: true }));
}

export function click(window, selectorOrEl) {
    const el = typeof selectorOrEl === 'string'
        ? window.document.querySelector(selectorOrEl)
        : selectorOrEl;
    if (!el) throw new Error(`no element ${selectorOrEl}`);
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    return el;
}

// Generating the note asks how the patient was reviewed, and who is signing it, if those have
// not been answered yet - so a test that just clicks the button gets the prompt instead of a
// note. Answers it the way a clinician would and lets the click carry on. Pass 'chart' where
// the method is the point, and `initials` where the signature is; leaving initials undefined
// dismisses that half unsigned, which is what most tests want.
export function generateNote(window, method = 'physical', initials) {
    click(window, '#btn_generate_summary');
    const prompt = window.document.getElementById('reviewMethodPrompt');
    if (!prompt || prompt.style.display !== 'flex') return;

    if (initials !== undefined) {
        const box = window.document.getElementById('promptReviewerInitials');
        if (box) box.value = initials;
    }
    // Only the halves still unanswered are on show, so the method buttons are not always the
    // way out of this dialog.
    const methodActions = window.document.getElementById('review_prompt_method_actions');
    if (methodActions && methodActions.style.display === 'none') {
        click(window, '#btn_prompt_continue');
    } else {
        click(window, method === 'chart' ? '#btn_method_chart' : '#btn_method_physical');
    }
}
