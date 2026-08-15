/* =========================================
   ALERT Nursing Risk Assessment Tool
   Shared helpers
   Copyright © 2025-2026 Casey Bond
   MIT License - https://opensource.org/licenses/MIT
   ========================================= */

export const $ = id => document.getElementById(id);

export const debounce = (fn, wait = 350) => {
    let t;
    return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, a), wait);
    };
};

export const num = v => {
    const x = parseFloat(v);
    return isNaN(x) ? null : x;
};

// Which home-screen icon set this deployment should wear. The live tool and the pilot are
// the same origin serving the same commit, so the path is the only thing that separates
// them: /ALERT-Tool/ against /alert-tool-testing/. Anything unrecognised - a local file,
// a preview server - gets the live set, so only the pilot ever has to be detected.
export function iconSetForPath(pathname = location.pathname) {
    return /alert-tool-testing/i.test(pathname) ? 'test' : 'alert';
}

export function nowTimeStr() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

export function todayDateStr() { const d = new Date(); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }

export function formatDateDDMMYYYY(isoStr) {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}/${m}/${y}`;
}

// The ward select's "Other" option is a control value, not a place. Reading s.ptWard straight
// put the literal word "Other" into the DMR note and the footer, hiding the ward the clinician
// had just typed into #ptWardOther beside it.
export function wardLabel(s) {
    const ward = (s.ptWard || '').trim();
    if (ward === 'Other') return (s.ptWardOther || '').trim();
    return ward;
}

export function sentenceCase(str) {
    if (!str) return '';
    str = str.trim();
    if (/^[0-9]/.test(str) || /^[A-Z]{2}/.test(str) || /^[A-Z][0-9]/.test(str)) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function joinGrammatically(parts) {
    if (!parts || parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    const [first, ...rest] = parts;
    const procRest = rest.map(s => {
        if (/^[0-9]/.test(s) || /^[A-Z]{2}/.test(s) || /^[A-Z][0-9]/.test(s) || /\b[A-Z]{2,}\b/.test(s)) return s;
        return s.toLowerCase();
    });
    return [first, ...procRest].join(', ');
}

// Shared ward workstations are the exposure this closes. The browser remembers what the last
// clinician typed and offers it back as a dropdown to whoever uses the machine next, and that
// survives the tab closing because it is stored by the browser rather than by the tool.
// spellcheck is off for the same reason: some browsers ship an "enhanced" spellchecker that
// sends the contents of text fields to a remote service, which would break the tool's
// no-transmission guarantee without a single line of our own code being involved.
// Applied in JS rather than as markup so fields created after load are covered too - and there
// are more of those than is obvious. The ADDS calculator injects its own vitals inputs from a
// plugin that runs after initialize(), so a one-off pass at startup missed RR, SpO2, SBP, HR
// and temperature entirely. An observer is used rather than a longer list of call sites,
// because the next thing to inject a field will not remember to ask.
export function disableAutofill(root = document) {
    applyAutofillOff(root);
    if (root === document && !document.__autofillObserver) {
        const observer = new MutationObserver(records => {
            records.forEach(r => r.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.matches?.('input, textarea')) applyAutofillOff({ querySelectorAll: () => [node] });
                applyAutofillOff(node);
            }));
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        document.__autofillObserver = observer;
    }
}

function applyAutofillOff(root) {
    root.querySelectorAll('input, textarea').forEach(el => {
        el.setAttribute('autocomplete', 'off');
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('spellcheck', 'false');
    });
}

// The DMR does not render characters outside plain ASCII - they arrive as boxes or vanish. So
// anything the tool generates for pasting into it gets normalised on the way out. The screen
// keeps its arrows and symbols; only the text that leaves the tool is flattened.
//
// Mapped rather than stripped: silently deleting a character a future rule introduces would
// turn "Temp 38.5°" into "Temp 38.5" and nobody would notice.
const DMR_SUBSTITUTIONS = [
    [/→/g, ' to '],       // →
    [/←/g, ' from '],     // ←
    [/↑/g, ' up'],        // ↑
    [/↓/g, ' down'],      // ↓
    [/[–—]/g, '-'],  // – —
    [/[‘’]/g, "'"],  // ' '
    [/[“”]/g, '"'],  // " "
    [/…/g, '...'],        // …
    [/≥/g, '>='],         // ≥
    [/≤/g, '<='],         // ≤
    [/°/g, ' deg'],       // °
    [/µ/g, 'u'],          // µ
    [/×/g, 'x'],          // ×
    [/[₂²]/g, '2'],  // SpO₂ / m² - the tool writes plain digits, but pasted text may not
    [/ /g, ' ']           // non-breaking space
];

export function toDmrSafeText(text) {
    let out = String(text ?? '');
    DMR_SUBSTITUTIONS.forEach(([re, rep]) => { out = out.replace(re, rep); });
    // Collapse any double spacing the substitutions introduced, but not newlines.
    return out.replace(/[ \t]{2,}/g, ' ');
}

export function showToast(msg, timeout = 2500) {
    const t = $('toast');
    if (t) {
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), timeout);
    }
}
