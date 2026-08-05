import { $ } from './utils.js';

// One notice at a time.
//
// The top of the page used to be contested by several independent banners - a new-risk alert,
// a completeness nudge, a shift handover strip - each with its own markup, its own colours and
// its own claim on the clinician's attention, on top of a toast for every risk the rules fired.
// That is the interface version of the alarm fatigue this tool exists to reduce: when
// everything is urgent, nothing reads as urgent.
//
// Sources register a notice and forget about it. The region shows whichever is most important
// and counts the rest, so nothing is hidden but only one thing is asking to be read.

const notices = new Map();

const TONE_CLASS = { red: 'notice-red', amber: 'notice-amber', info: 'notice-info' };

// Lower number wins. Left as gaps so a source can be slotted between two others later without
// renumbering everything.
export const NOTICE_PRIORITY = {
    NEW_RISK: 10,
    HANDOVER: 20,
    DISCHARGE: 30,
    COMPLETENESS: 90
};

export function setNotice(id, { priority = 50, tone = 'info', html = '', actions = [] }) {
    const existing = notices.get(id);
    // Re-rendering identical content on every keystroke would fight any button the clinician is
    // reaching for, and computeAll() runs constantly.
    if (existing && existing.html === html && existing.tone === tone && existing.actions.length === actions.length) {
        existing.actions = actions;
        return;
    }
    notices.set(id, { id, priority, tone, html, actions });
    renderNotices();
}

export function clearNotice(id) {
    if (notices.delete(id)) renderNotices();
}

export function hasNotice(id) {
    return notices.has(id);
}

export function renderNotices() {
    const region = $('noticeRegion');
    if (!region) return;

    const ordered = [...notices.values()].sort((a, b) => a.priority - b.priority);
    const active = ordered[0];

    if (!active) {
        region.hidden = true;
        region.innerHTML = '';
        region.className = 'notice';
        return;
    }

    const waiting = ordered.length - 1;
    region.className = `notice ${TONE_CLASS[active.tone] || TONE_CLASS.info}`;
    region.innerHTML = `
        <div class="notice-body">${active.html}</div>
        ${active.actions.length ? `<div class="notice-actions">${active.actions
            .map(a => `<button type="button" class="btn small" data-notice-action="${a.id}">${a.label}</button>`)
            .join('')}</div>` : ''}
        ${waiting > 0 ? `<div class="notice-more" title="${ordered.slice(1).map(n => n.id).join(', ')}">+${waiting} more</div>` : ''}`;
    region.hidden = false;

    active.actions.forEach(a => {
        region.querySelector(`[data-notice-action="${a.id}"]`)
            ?.addEventListener('click', (e) => { e.preventDefault(); a.onClick(); });
    });
}
