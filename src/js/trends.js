import { num } from './utils.js';
import { normalRanges } from './config.js';

// Movement between one review's bloods and the next.
//
// Two jobs, deliberately separated. The arrows are descriptive: they save the clinician
// clicking ↑/↓ on eighteen markers they have just typed, and say nothing about risk. The flags
// built on top of them (worsening Cr, rising CRP) use their own, higher thresholds - because
// "something moved" and "something moved enough to worry about" are different statements.
//
// The deadbands exist because a result that has drifted by less than day-to-day assay and
// hydration variation is not a trend, and an arrow on it is noise.
//
// The in-range rule is the part that took a real patient to get right. Requiring both an
// absolute and a percentage floor works while a marker sits in its reference range, and is
// wrong once it doesn't: a platelet count falling 11 -> 8 is a 27% drop that matters, and an
// absolute floor of 30 would silence it completely. So the absolute floor applies only while
// both values are in range; beyond it, the percentage decides alone.
//
// `floor` is a separate idea again - the level below which a marker is not worth reporting on
// at all, whatever it does. CRP going 5 -> 10 is a 100% rise and means nothing.

export const TREND_RULES = {
    cr_review:  { minAbs: 15,  minPct: 15, floor: 40 },
    crp:        { minAbs: 20,  minPct: 25, floor: 20 },
    hb:         { minAbs: 10,  minPct: 8,  floor: 0 },
    wcc:        { minAbs: 2.0, minPct: 20, floor: 0 },
    neut:       { minAbs: 1.0, minPct: 20, floor: 0 },
    lymph:      { minAbs: 1.0, minPct: 20, floor: 0 },
    plts:       { minAbs: 30,  minPct: 20, floor: 0 },
    k:          { minAbs: 0.4, minPct: 8,  floor: 0 },
    na:         { minAbs: 3,   minPct: 2,  floor: 0 },
    mg:         { minAbs: 0.2, minPct: 15, floor: 0 },
    phos:       { minAbs: 0.2, minPct: 15, floor: 0 },
    inr:        { minAbs: 0.3, minPct: 15, floor: 0 },
    aptt:       { minAbs: 5,   minPct: 15, floor: 0 },
    alb:        { minAbs: 5,   minPct: 12, floor: 0 },
    alt:        { minAbs: 0,   minPct: 50, floor: 0 },
    bili:       { minAbs: 0,   minPct: 50, floor: 0 },
    lac_review: { minAbs: 0.5, minPct: 25, floor: 0 }
    // egfr is deliberately absent: it is calculated from creatinine, so its arrow would only
    // ever repeat the creatinine one.
};

// null when there is nothing worth showing - no previous value, no meaningful movement, or a
// marker sitting below the level anyone cares about.
export function computeTrend(key, current, previous) {
    const rule = TREND_RULES[key];
    const cur = num(current);
    const prev = num(previous);
    if (!rule || cur === null || prev === null || cur === prev) return null;

    if (Math.max(Math.abs(cur), Math.abs(prev)) < rule.floor) return null;

    const absDelta = Math.abs(cur - prev);
    const pctDelta = prev === 0 ? Infinity : (absDelta / Math.abs(prev)) * 100;
    if (pctDelta < rule.minPct) return null;

    const range = normalRanges[key];
    const inRange = v => !range || (v >= range.low && v <= range.high);
    if (inRange(cur) && inRange(prev) && absDelta < rule.minAbs) return null;

    return {
        key,
        current: cur,
        previous: prev,
        delta: cur - prev,
        absDelta,
        pctDelta,
        rising: cur > prev,
        direction: cur > prev ? '↑' : '↓'
    };
}

// Paints the ↑/↓ control for every marker with a previous result. A clinician who clicks an
// arrow themselves owns it from then on - same dataset.manual convention the oxygen device and
// after-hours fields already use.
export function applyTrendArrows(state, prevBloods) {
    if (!prevBloods) return;
    Object.keys(TREND_RULES).forEach(key => {
        const group = document.getElementById(`bl_${key}_trend`);
        if (!group || group.dataset.manual === 'true') return;

        const trend = computeTrend(key, state[`bl_${key}`], prevBloods[key]);
        group.querySelectorAll('.trend-btn').forEach(b => b.classList.remove('active'));
        if (!trend) return;
        group.querySelector(`.trend-btn[data-value="${trend.direction}"]`)?.classList.add('active');
    });
}
