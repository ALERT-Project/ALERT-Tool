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

export function nowTimeStr() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

export function todayDateStr() { const d = new Date(); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; }

export function formatDateDDMMYYYY(isoStr) {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}/${m}/${y}`;
}

export function sentenceCase(str) {
    if (!str) return '';
    if (/^[0-9]/.test(str) || /^[A-Z]{2}/.test(str) || /^[A-Z][0-9]/.test(str)) return str;
    str = str.trim().toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function joinGrammatically(parts) {
    if (!parts || parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    const [first, ...rest] = parts;
    const procRest = rest.map(s => s.toLowerCase());
    return [first, ...procRest].join(', ');
}

export function showToast(msg, timeout = 2500) {
    const t = $('toast');
    if (t) {
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), timeout);
    }
}
