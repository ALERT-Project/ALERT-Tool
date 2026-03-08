(() => {
  // src/js/utils.js
  var $ = (id) => document.getElementById(id);
  var debounce = (fn, wait = 350) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(void 0, a), wait);
    };
  };
  var num = (v) => {
    const x = parseFloat(v);
    return isNaN(x) ? null : x;
  };
  function nowTimeStr() {
    return (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function todayDateStr() {
    const d = /* @__PURE__ */ new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  function formatDateDDMMYYYY(isoStr) {
    if (!isoStr) return "";
    const [y, m, d] = isoStr.split("-");
    return `${d}/${m}/${y}`;
  }
  function sentenceCase(str) {
    if (!str) return "";
    if (/^[0-9]/.test(str) || /^[A-Z]{2}/.test(str) || /^[A-Z][0-9]/.test(str)) return str;
    str = str.trim().toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  function joinGrammatically(parts) {
    if (!parts || parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    const [first, ...rest] = parts;
    const procRest = rest.map((s) => s.toLowerCase());
    return [first, ...procRest].join(", ");
  }
  function showToast(msg, timeout = 2500) {
    const t = $("toast");
    if (t) {
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), timeout);
    }
  }

  // src/js/config.js
  var STORAGE_KEY = "alertToolData_v7_7";
  var ACCORDION_KEY = "alertToolAccordions_v7_7";
  var UNDO_KEY = "alertToolUndo_v7_7";
  var normalRanges = {
    wcc: { low: 4, high: 11 },
    crp: { low: 0, high: 5 },
    neut: { low: 1.5, high: 7.5 },
    lymph: { low: 1, high: 4 },
    hb: { low: 115, high: 165 },
    plts: { low: 150, high: 400 },
    k: { low: 3.5, high: 5.2 },
    na: { low: 135, high: 145 },
    cr_review: { low: 50, high: 98 },
    egfr: { low: 60, high: 120 },
    mg: { low: 0.7, high: 1.1 },
    alb: { low: 35, high: 50 },
    lac_review: { low: 0.5, high: 2 },
    phos: { low: 0.8, high: 1.5 },
    bili: { low: 0, high: 20 },
    alt: { low: 0, high: 40 },
    inr: { low: 0.9, high: 1.2 },
    aptt: { low: 25, high: 38 },
    bsl: { low: 4, high: 15 }
  };
  var comorbMap = {
    "comorb_copd": "COPD",
    "comorb_asthma": "Asthma",
    "comorb_hf": "Active Heart Failure",
    "comorb_esrd": "ESRD",
    "comorb_dialysis": "Dialysis",
    "comorb_diabetes": "Diabetes",
    "comorb_cirrhosis": "Cirrhosis",
    "comorb_malignancy": "Active malignancy",
    "comorb_immuno": "Immunosuppression",
    "comorb_other": "Other"
  };
  var staticInputs = [
    "reviewTime",
    "ptName",
    "ptMrn",
    "ptAge",
    "ptWeight",
    "ptWard",
    "ptBed",
    "ptWardOther",
    "ptAdmissionReason",
    "icuSummary",
    "icuLos",
    "stepdownDate",
    "npFlow",
    "hfnpFio2",
    "hfnpFlow",
    "nivFio2",
    "nivPeep",
    "nivPs",
    "override",
    "overrideNote",
    "trache_details_note",
    "mods_score",
    "mods_details",
    "airway_a",
    "a_comment",
    "b_rr",
    "b_spo2",
    "b_device",
    "b_wob",
    "b_cough",
    "b_comment",
    "c_hr",
    "c_hr_rhythm",
    "c_nibp",
    "c_cr",
    "c_perf",
    "c_comment",
    "d_alert",
    "d_pain",
    "d_comment",
    "e_temp",
    "e_bsl",
    "e_fluid",
    "e_uop",
    "e_comment",
    "atoe_adds",
    "ae_mobility",
    "ae_diet",
    "ae_bowels",
    "bowel_date",
    "bl_wcc",
    "bl_crp",
    "bl_neut",
    "bl_lymph",
    "bl_hb",
    "bl_plts",
    "bl_k",
    "bl_na",
    "bl_cr_review",
    "bl_mg",
    "bl_alb",
    "bl_lac_review",
    "bl_phos",
    "bl_bili",
    "bl_alt",
    "bl_inr",
    "bl_aptt",
    "bl_egfr",
    "anticoag_note",
    "vte_prophylaxis_note",
    "elec_replace_note",
    "goc_note",
    "allergies_note",
    "pics_note",
    "context_other_note",
    "pmh_note",
    "adds",
    "lactate",
    "lactate_trend",
    "hb",
    "wcc",
    "crp",
    "neut",
    "lymph",
    "infusions_note",
    "dyspneaConcern",
    "dyspneaConcern_note",
    "renal_note",
    "infection_note",
    "electrolyteConcern_note",
    "neuroType_note",
    "nutrition_context_note",
    "pain_context_note",
    "neuro_psych_note",
    "sleep_quality_note",
    "fluid_restriction_amount",
    "after_hours_note",
    "pressors_note",
    "immobility_note",
    "comorb_other_note",
    "unsuitable_note",
    "pressor_ceased_time",
    "pressor_recent_other_note",
    "pressor_current_other_note",
    "hac_note",
    "wardReviewCount"
  ];
  var segmentedInputs = [
    "hb_dropping",
    "after_hours",
    "hist_o2",
    "intubated",
    "resp_concern",
    "renal",
    "immobility",
    "infection",
    "new_bloods_ordered",
    "neuro_gate",
    "nutrition_adequate",
    "electrolyte_gate",
    "pressors",
    "hac",
    "stepdown_suitable",
    "comorbs_gate",
    "renal_chronic",
    "renal_chronic_bloods",
    "infection_downtrend",
    "infection_downtrend_bloods",
    "dialysis_type",
    "sleep_quality",
    "pain_control",
    "neuro_psych",
    "pics",
    "lactate_trend",
    "resp_dyspnea",
    "resp_tachypnea",
    "resp_rapid_wean",
    "resp_poor_cough",
    "resp_poor_swallow"
  ];
  var toggleInputs = [
    "comorb_copd",
    "comorb_asthma",
    "comorb_hf",
    "comorb_esrd",
    "comorb_dialysis",
    "comorb_diabetes",
    "comorb_cirrhosis",
    "comorb_malignancy",
    "comorb_immuno",
    "comorb_other",
    "renal_oliguria",
    "renal_anuria",
    "renal_fluid",
    "renal_oedema",
    "renal_dysfunction",
    "renal_dialysis",
    "renal_dehydrated",
    "renal_worsening_cr",
    "chk_aperients",
    "chk_unknown_blo_date",
    "pressor_recent_norad",
    "pressor_recent_met",
    "pressor_recent_gtn",
    "pressor_recent_dob",
    "pressor_recent_mid",
    "pressor_recent_other",
    "pressor_current_mid",
    "pressor_current_other"
  ];
  var selectInputs = [
    "oxMod",
    "dyspneaConcern",
    "neuroConcern",
    "neuroType",
    "electrolyteConcern",
    "stepdownTime",
    "tracheType",
    "tracheStatus",
    "intubatedReason"
  ];
  var deviceTypes = ["CVC", "PICC", "Other CVAD", "PIVC", "Arterial Line", "Enteral Tube", "IDC", "Pacing Wire", "Drain", "Wound", "Vascath", "Other Device"];

  // src/js/logic.js
  function calculateWardTime(dateStr, timeOfDay, isPre) {
    if (isPre) return { hours: 0, text: "(Pre-Stepdown)" };
    if (!dateStr) return { hours: 0, text: "" };
    const h = { "Morning": 9, "Afternoon": 15, "Evening": 18, "Night": 21 }[timeOfDay] || 18;
    const [y, m, d] = dateStr.split("-");
    const stepObj = new Date(y, m - 1, d, h);
    const diffHours = (/* @__PURE__ */ new Date() - stepObj) / 36e5;
    if (diffHours < 0) return { hours: diffHours, text: "(Planned Stepdown)" };
    if (diffHours < 12) {
      return { hours: diffHours, text: `${Math.round(diffHours)} hours` };
    } else if (diffHours <= 48) {
      const halfDays = Math.round(diffHours / 24 * 2) / 2;
      return { hours: diffHours, text: `${halfDays} days` };
    } else {
      const days = Math.round(diffHours / 24);
      return { hours: diffHours, text: `${days} days` };
    }
  }
  function computeAll() {
    try {
      const s = getState();
      console.log("computeAll called, state keys:", Object.keys(s).length);
      const red = [], amber = [];
      const suppressedRisks = [];
      const flagged = { red: [], amber: [] };
      const pmhSubtitle = $("pmh_subtitle");
      const hasComorbidities = Object.keys(comorbMap).some((key) => s[key]);
      const hasPmhNote = s.pmh_note && s.pmh_note.trim().length > 0;
      if (pmhSubtitle) {
        pmhSubtitle.style.display = hasComorbidities || hasPmhNote ? "block" : "none";
      }
      const add = (list, txt, id, type, noteValue = null) => {
        let finalTxt = txt;
        if (noteValue && noteValue.trim()) finalTxt = `${txt} (${noteValue.trim()})`;
        list.push(finalTxt);
        if (id) flagged[type].push(id);
      };
      const neut = num(s.bl_neut) || num(s.neut);
      const lymph = num(s.bl_lymph) || num(s.lymph);
      const nlrEl = $("nlrCalc");
      if (nlrEl) {
        if (neut > 0 && lymph > 0) {
          const nlr = (neut / lymph).toFixed(2);
          nlrEl.textContent = `NLR: ${nlr}`;
          nlrEl.style.borderColor = nlr > 10 ? "var(--red)" : "var(--line)";
        } else {
          nlrEl.textContent = `NLR: --`;
        }
      }
      const fn = $("footerName");
      if (fn) fn.textContent = s.ptName || "--";
      const fl = $("footerLocation");
      if (fl) fl.textContent = `${s.ptWard || "--"} ${s.ptBed || ""}`;
      const fa = $("footerAdmission");
      if (fa) fa.textContent = s.ptAdmissionReason || "--";
      const isPre = s.reviewType === "pre";
      const timeData = calculateWardTime(s.stepdownDate, s.stepdownTime, isPre);
      const isRecent = isPre || timeData.hours < 24;
      const timeOffEl = $("pressor_time_off_display");
      const recentKeys = ["pressor_recent_norad", "pressor_recent_met", "pressor_recent_gtn", "pressor_recent_dob", "pressor_recent_mid", "pressor_recent_other"];
      const currentKeys = ["pressor_current_mid", "pressor_current_other"];
      let hasRecent = recentKeys.some((k2) => s[k2]);
      let hasCurrent = currentKeys.some((k2) => s[k2]);
      if (timeOffEl) {
        if (hasRecent && s.pressor_ceased_time) {
          const now = /* @__PURE__ */ new Date();
          const [cH, cM] = s.pressor_ceased_time.split(":");
          const ceasedDate = /* @__PURE__ */ new Date();
          ceasedDate.setHours(cH, cM);
          if (ceasedDate > now) ceasedDate.setDate(ceasedDate.getDate() - 1);
          const diffMs = now - ceasedDate;
          const diffHrs = Math.floor(diffMs / 36e5);
          timeOffEl.textContent = `~${diffHrs} hrs ago`;
        } else {
          timeOffEl.textContent = "";
        }
      }
      if (hasCurrent || hasRecent) {
        let details = [];
        let currentList = [];
        currentKeys.forEach((k2) => {
          if (s[k2]) {
            let label = k2.replace("pressor_current_", "").replace("mid", "Midodrine");
            if (k2 === "pressor_current_other") label = `Other (${s.pressor_current_other_note || ""})`;
            currentList.push(label);
          }
        });
        if (currentList.length > 0) {
          details.push(`Current vasoactive support - ${joinGrammatically(currentList)}`);
        }
        if (hasRecent) {
          let recentsList = [];
          recentKeys.forEach((k2) => {
            if (s[k2]) {
              let label = k2.replace("pressor_recent_", "").replace("norad", "Noradrenaline").replace("met", "Metaraminol").replace("gtn", "GTN").replace("dob", "Dobutamine").replace("mid", "Midodrine");
              if (k2 === "pressor_recent_other") label = `Other (${s.pressor_recent_other_note || ""})`;
              recentsList.push(label);
            }
          });
          let recentPart = `Recent vasoactive support included ${joinGrammatically(recentsList)}`;
          if (s.pressor_ceased_time) recentPart += ` which was ceased at approximately ${s.pressor_ceased_time}`;
          details.push(recentPart);
        }
        add(amber, details.join(". "), "seg_pressors", "amber", s.pressors_note);
      }
      const adds = num(s.adds);
      if (adds !== null) {
        if (adds >= 6) add(red, `Elevated ADDS ${adds}`, "adds", "red");
        else if (adds >= 4) add(red, `Physiological instability ADDS ${adds}`, "adds", "red");
        else if (adds === 3 && isRecent) add(amber, `Observation required ADDS 3`, "adds", "amber");
      }
      const hr = num(s.c_hr);
      if (hr) {
        if (hr > 130) add(red, `Tachycardia HR ${hr}`, "c_hr", "red");
        else if (hr > 110) add(amber, `Tachycardia HR ${hr}`, "c_hr", "amber");
        else if (hr < 40) add(red, `Bradycardia HR ${hr}`, "c_hr", "red");
        else if (hr < 50) add(amber, `Bradycardia HR ${hr}`, "c_hr", "amber");
      }
      const bpStr = s.c_nibp;
      if (bpStr) {
        const sbp = parseFloat(bpStr.split("/")[0]);
        if (!isNaN(sbp)) {
          if (sbp < 90) add(red, `Hypotension SBP ${sbp}`, "c_nibp", "red");
        }
      }
      const rr = num(s.b_rr);
      if (rr) {
        if (rr > 25) add(red, `Tachypnea RR ${rr}`, "b_rr", "red");
        else if (rr > 20) add(amber, `Mild tachypnea RR ${rr}`, "b_rr", "amber");
        else if (rr < 8) add(red, `Bradypnea RR ${rr}`, "b_rr", "red");
      }
      const spo2Str = s.b_spo2 ? s.b_spo2.replace("%", "") : "";
      const spo2 = num(spo2Str);
      if (spo2 && spo2 < 88) add(red, `Hypoxia SpO2 ${spo2}%`, "b_spo2", "red");
      const temp = num(s.e_temp);
      if (temp) {
        if (temp > 38.5) add(red, `Pyrexia Temp ${temp}`, "e_temp", "red");
        else if (temp < 35.5) add(red, `Hypothermia Temp ${temp}`, "e_temp", "red");
      }
      const oxDevInput = $("b_device");
      if (oxDevInput && oxDevInput.dataset.manual !== "true") {
        let devStr = "";
        const mode = s.oxMod;
        if (mode === "RA") devStr = "RA";
        else if (mode === "NP") devStr = `NP ${s.npFlow || ""}L`;
        else if (mode === "HFNP") devStr = `HFNP ${s.hfnpFio2 || ""}%/${s.hfnpFlow || ""}L`;
        else if (mode === "NIV") devStr = `NIV ${s.nivFio2 || ""}%`;
        else if (mode === "Trache") devStr = `Trache (${s.tracheStatus || ""})`;
        if (devStr) oxDevInput.value = devStr;
      }
      if (s.resp_concern === true) {
        let parts = [], hasRed = false;
        if (s.oxMod === "NP") {
          const flow = num(s.npFlow);
          if (flow >= 3) {
            parts.push(`high flow NP ${flow}L`);
            flagged.red.push("npFlow");
            hasRed = true;
          } else if (flow >= 2) {
            parts.push(`NP ${flow}L`);
            flagged.amber.push("npFlow");
          }
        } else if (s.oxMod === "HFNP") {
          const fio2 = num(s.hfnpFio2);
          if (fio2 >= 60) {
            parts.push(`HFNP - high FiO2 ${fio2}%`);
            flagged.red.push("oxMod");
            hasRed = true;
          } else {
            parts.push(`HFNP requirement`);
            flagged.red.push("oxMod");
            hasRed = true;
          }
        } else if (s.oxMod === "NIV") {
          const fio2 = num(s.nivFio2);
          if (fio2 >= 60) {
            parts.push(`NIV - high FiO2 ${fio2}%`);
            flagged.red.push("oxMod");
            hasRed = true;
          } else {
            parts.push(`NIV requirement`);
            flagged.red.push("oxMod");
            hasRed = true;
          }
        } else if (s.oxMod === "Trache") {
          if (s.tracheStatus === "New") {
            parts.push(`new or unstable tracheostomy`);
            flagged.red.push("tracheStatus");
            hasRed = true;
          } else {
            parts.push(`tracheostomy`);
            flagged.amber.push("oxMod");
          }
        } else if (s.oxMod === "RA") {
        }
        if (s.resp_dyspnea === true) {
          const dysp = s.dyspneaConcern;
          if (dysp === "severe" || dysp === "moderate") {
            parts.push(`${dysp} dyspnea`);
            flagged.red.push("dyspneaConcern");
            hasRed = true;
          } else if (dysp === "mild") {
            parts.push(`mild dyspnea`);
            flagged.amber.push("dyspneaConcern");
          } else if (!dysp) {
            parts.push(`dyspnea`);
            flagged.amber.push("seg_resp_dyspnea");
          }
        }
        if (s.resp_tachypnea === true) {
          parts.push("tachypnea >20bpm");
          flagged.red.push("seg_resp_tachypnea");
          hasRed = true;
        }
        if (s.resp_rapid_wean === true) {
          parts.push("rapid O2 wean <12hrs");
          flagged.red.push("seg_resp_rapid_wean");
          hasRed = true;
        }
        if (s.resp_poor_cough === true) {
          parts.push("poor cough effort");
          flagged.amber.push("seg_resp_poor_cough");
        }
        if (s.resp_poor_swallow === true) {
          parts.push("poor swallow");
          flagged.amber.push("seg_resp_poor_swallow");
        }
        if (s.hist_o2 === true) {
          parts.push("recent high O2/NIV requirement <12hrs");
          flagged.red.push("seg_hist_o2");
          hasRed = true;
        }
        if (s.intubated === true) {
          const reason = $("intubatedReason")?.querySelector(".active")?.dataset.value;
          if (reason === "concern") {
            parts.push("intubated <24hrs ago");
            flagged.red.push("seg_intubated");
            hasRed = true;
          } else {
            parts.push("intubated <24hrs ago (elective)");
            flagged.amber.push("seg_intubated");
          }
        }
        if (s.dyspneaConcern_note && parts.length > 0) {
          parts[parts.length - 1] += `. Note: ${s.dyspneaConcern_note}`;
        }
        if (parts.length > 0) {
          const joined = joinGrammatically(parts);
          const finalTxt = `Respiratory concern - ${joined}`;
          if (hasRed) red.push(finalTxt);
          else amber.push(finalTxt);
        } else {
          add(amber, "Respiratory concern - details required", "seg_resp_concern", "amber", s.dyspneaConcern_note);
        }
      }
      if (s.after_hours === true) add(amber, "Discharged after-hours", "seg_after_hours", "amber", s.after_hours_note);
      if (s.hac === true) add(amber, "Hospital acquired complication", "seg_hac", "amber", s.hac_note);
      if (s.neuro_gate === true) {
        let txt = "Neurological concern";
        const gcsInput = s.d_alert;
        const type = s.neuroType;
        const severity = s.neuroConcern;
        let details = [];
        if (gcsInput && gcsInput.toLowerCase().includes("gcs")) details.push(gcsInput);
        if (type) details.push(type.toLowerCase());
        if (details.length > 0) txt += ` with ${joinGrammatically(details)}`;
        const isRed = severity === "severe";
        add(isRed ? red : amber, sentenceCase(txt), "neuroConcern", isRed ? "red" : "amber", s.neuroType_note);
      }
      const k = num(s.bl_k);
      if (s.electrolyte_gate === true || k && (k < 3 || k > 6)) {
        let msg = "Electrolyte concern", isRed = false;
        let parts = [];
        if (k) {
          if (k > 6) {
            parts.push(`hyperkalemia K+ ${k}`);
            isRed = true;
          } else if (k < 3) {
            parts.push(`hypokalaemia K+ ${k}`);
            isRed = true;
          }
        }
        const na = num(s.bl_na);
        if (na && (na < 125 || na > 155)) {
          parts.push(`severe Na derangement ${na}`);
          isRed = true;
        }
        const sev = s.electrolyteConcern;
        if (sev === "severe") {
          if (parts.length === 0) parts.push("severe derangement");
          isRed = true;
        } else if (sev === "mild" && parts.length === 0) {
          parts.push("mild/moderate derangement");
        }
        if (parts.length > 0) msg += ` with ${joinGrammatically(parts)}`;
        add(isRed ? red : amber, msg, "electrolyteConcern", isRed ? "red" : "amber", s.electrolyteConcern_note);
      }
      const cr = num(s.bl_cr_review) || num(s.cr_review);
      const renalOpen = s.renal === true || cr && cr > 150;
      if (renalOpen) {
        const fluidFlags = [];
        const renalFlags = [];
        if (s.renal_fluid) fluidFlags.push("fluid overload");
        if (s.renal_oedema) fluidFlags.push("oedema");
        if (s.renal_dehydrated) fluidFlags.push("dehydrated");
        if (s.renal_oliguria) renalFlags.push("oliguria <0.5ml/kg/hr");
        if (s.renal_anuria) renalFlags.push("anuria");
        if (s.renal_dysfunction) renalFlags.push("AKI");
        if (cr > 150) renalFlags.push(`Cr ${cr}`);
        if (s.renal_dialysis) {
          const dType2 = $("dialysis_type")?.querySelector(".active")?.dataset.value;
          if (dType2 === "new") renalFlags.push("acute dialysis");
          else renalFlags.push("chronic dialysis");
        }
        const hasFluid = fluidFlags.length > 0;
        const hasRenal = renalFlags.length > 0;
        let label = "Renal concern";
        if (hasFluid && hasRenal) label = "Renal and fluid concern";
        else if (hasFluid && !hasRenal) label = "Fluid concern";
        const allFlags = [...renalFlags, ...fluidFlags];
        if (allFlags.length > 0) label += ` with ${joinGrammatically(allFlags)}`;
        const overrideChips = [
          s.renal_oliguria,
          s.renal_anuria,
          s.renal_dysfunction,
          s.renal_fluid,
          s.renal_oedema,
          s.renal_dehydrated
        ];
        const dType = $("dialysis_type")?.querySelector(".active")?.dataset.value;
        if (s.renal_dialysis && dType === "new") overrideChips.push(true);
        const isForceAmber = overrideChips.some((x) => x === true);
        const isMitigated = s.renal_chronic === true;
        if (isMitigated && !isForceAmber) {
          suppressedRisks.push(`${label} (mitigated: known CKD and Cr around baseline)`);
        } else {
          const critical = s.renal_anuria || cr > 200 || hasFluid && hasRenal && s.renal_dysfunction;
          if (critical) add(red, label, "seg_renal", "red", s.renal_note);
          else add(amber, label, "seg_renal", "amber", s.renal_note);
        }
      }
      const wcc = num(s.bl_wcc) || num(s.wcc);
      const crp = num(s.crp) || num(s.bl_crp);
      const nlrVal = neut > 0 && lymph > 0 ? neut / lymph : 0;
      const autoTrigger = wcc && (wcc > 15 || wcc < 2) || temp && temp > 38 || crp && crp > 100 || nlrVal > 10;
      const manualConcern = s.infection === true;
      if (autoTrigger || manualConcern) {
        let markers = [], isRed = false;
        if (crp > 100) isRed = true;
        if (temp > 38.5) isRed = true;
        if (nlrVal > 10) isRed = true;
        if (wcc !== null && (wcc < 3 || wcc > 15)) markers.push(`WCC ${wcc}`);
        else if (wcc !== null && wcc > 11) markers.push(`WCC ${wcc}`);
        if (crp > 100) markers.push(`CRP ${crp}`);
        else if (crp > 50) markers.push(`CRP ${crp}`);
        if (temp > 38.5) markers.push(`Temp ${temp}`);
        else if (temp > 37.8) markers.push(`Temp ${temp}`);
        if (nlrVal > 10) markers.push(`NLR ${nlrVal.toFixed(1)}`);
        let msg = isRed ? "Infection risk" : "Infection risk";
        if (markers.length) msg += ` with ${joinGrammatically(markers)}`;
        const shouldSuppress = s.infection_downtrend === true;
        if (shouldSuppress) {
          suppressedRisks.push("Infection risk (however, infection markers downtrending, ADDS low and the patient is on appropriate antibiotics)");
        } else {
          add(isRed ? red : amber, msg, "seg_infection", isRed ? "red" : "amber", s.infection_note);
        }
      }
      if (s.immobility === true) {
        const icuLos = num(s.icuLos) || 0;
        if (icuLos >= 4) add(red, `Immobility concern - prolonged ICU stay`, "seg_immobility", "red", s.immobility_note);
        else add(amber, "Immobility concern", "seg_immobility", "amber", s.immobility_note);
      }
      const hb = num(s.hb) || num(s.bl_hb);
      if (hb && hb <= 70) add(red, `Hb ${hb}`, "hb_wrapper", "red");
      else if (hb && hb <= 90 && s.hb_dropping) add(amber, `Hb ${hb} and dropping`, "hb_wrapper", "amber");
      const alb = num(s.bl_alb);
      if (alb && alb < 20) add(amber, `Low albumin Alb ${alb}`, "bl_alb", "amber");
      const plts = num(s.bl_plts);
      if (plts && plts < 100) add(amber, `Thrombocytopenia Plts ${plts}`, "bl_plts", "amber");
      const inr = num(s.bl_inr);
      if (inr && inr > 3.5) add(red, `High INR ${inr}`, "bl_inr", "red");
      else if (inr && inr > 2.5) add(amber, `Elevated INR ${inr}`, "bl_inr", "amber");
      const egfr = num(s.bl_egfr);
      if (egfr && egfr < 30) add(amber, `Low eGFR ${egfr}`, "bl_egfr", "amber");
      const bsl = num(s.e_bsl);
      if (bsl) {
        if (bsl < 4) add(red, `Hypoglycemia BSL ${bsl}`, "e_bsl", "red");
        else if (bsl > 20) add(red, `Hyperglycemia BSL ${bsl}`, "e_bsl", "red");
        else if (bsl >= 15) add(amber, `Hyperglycemia BSL ${bsl}`, "e_bsl", "amber");
      }
      const painScore = num(s.d_pain);
      if (painScore >= 7) {
        add(amber, `Pain not well controlled with score of ${painScore} out of 10`, "neuro_section", "amber", null);
      }
      if (window.prevBloods && window.prevBloods.cr_review && !s.renal_worsening_cr) {
        const prevCr = num(window.prevBloods.cr_review);
        const currCr = cr;
        if (currCr && prevCr && currCr > prevCr) {
          const percentChange = (currCr - prevCr) / prevCr * 100;
          if (percentChange > 30 || currCr - prevCr > 30) {
            const chipEl = $("toggle_renal_worsening_cr");
            if (chipEl && chipEl.dataset.value === "false") {
              chipEl.click();
            }
          }
        }
      }
      if (s.renal_worsening_cr && window.prevBloods && window.prevBloods.cr_review) {
        const prevCr = num(window.prevBloods.cr_review);
        const currCr = cr;
        if (currCr && prevCr && currCr > prevCr) {
          const percentChange = (currCr - prevCr) / prevCr * 100;
          if (percentChange > 30 || currCr - prevCr > 30) {
            add(amber, `Worsening Cr ${prevCr}\u2192${currCr}`, "bl_cr_review", "amber");
          }
        }
      }
      if (s.nutrition_adequate === false) {
        add(amber, `Inadequate nutrition`, "diet_section", "amber", s.nutrition_context_note);
      }
      if (s.neuro_psych) {
        add(amber, `Psychological concern`, "neuro_section", "amber", s.neuro_psych_note);
      }
      if (s.pics === "positive") {
        add(amber, `Post ICU Syndrome Positive`, "seg_pics", "amber", s.pics_note);
      }
      const activeComorbsKeys = toggleInputs.filter((k2) => k2.startsWith("comorb_") && s[k2]);
      const countComorbs = activeComorbsKeys.length;
      if (countComorbs >= 3) {
        add(red, sentenceCase("Multiple comorbidities"), null, "red", null);
        flagged.red.push("comorbs_wrapper");
      } else if (countComorbs > 0) {
        const cList = activeComorbsKeys.map((k2) => {
          if (k2 === "comorb_other" && s.comorb_other_note) return s.comorb_other_note.toLowerCase();
          return comorbMap[k2].toLowerCase();
        });
        add(amber, sentenceCase(`Comorbidities including ${joinGrammatically(cList)}`), null, "amber", null);
        flagged.amber.push("comorbs_wrapper");
      }
      const lact = num(s.lactate) || num(s.bl_lac_review);
      if (lact > 4) add(red, `Lactate ${lact}`, "lactate", "red");
      else if (lact >= 2) add(amber, `Lactate ${lact}`, "lactate", "amber");
      if (s.override === "red") {
        const reason = s.overrideNote || "Clinician override: CAT 1";
        add(red, reason, "override_red", "red");
      }
      if (s.override === "amber") {
        const reason = s.overrideNote || "Clinician override: CAT 2";
        add(amber, reason, "override_amber", "amber");
      }
      const age = num(s.ptAge);
      if (age >= 75) add(amber, `Age ${age} (frailty risk)`, "ptAge", "amber");
      const uniqueRed = [...new Set(red)];
      const uniqueAmber = [...new Set(amber)];
      const redCount = uniqueRed.length;
      const amberCount = uniqueAmber.length;
      let cat = { id: "green", text: "CAT 3" };
      if (redCount > 0) cat = { id: "red", text: "CAT 1" };
      else if (amberCount > 0) cat = { id: "amber", text: "CAT 2" };
      const catText = $("catText");
      if (catText) {
        catText.className = `status ${cat.id}`;
        catText.textContent = cat.text;
      }
      const catBox = $("categoryBox");
      if (catBox) catBox.style.borderColor = `var(--${cat.id})`;
      const rc = $("redCount");
      if (rc) {
        rc.textContent = redCount;
        rc.style.color = redCount ? "var(--red)" : "";
      }
      const ac = $("amberCount");
      if (ac) {
        ac.textContent = amberCount;
        ac.style.color = amberCount ? "var(--amber)" : "";
      }
      const stickyScore = $("footerScore");
      if (stickyScore) {
        stickyScore.className = `footer-score tag ${cat.id}`;
        stickyScore.textContent = cat.text;
      }
      updateSidebarRiskBadges(redCount, amberCount);
      if (isQuickReviewMode) {
        if (!quickReviewBaselineCaptured) {
          initialQuickReviewRisks.red = [...uniqueRed];
          initialQuickReviewRisks.amber = [...uniqueAmber];
          setQuickReviewBaselineCaptured(true);
        } else {
          const newRed = uniqueRed.filter((r) => !initialQuickReviewRisks.red.includes(r));
          const newAmber = uniqueAmber.filter((r) => !initialQuickReviewRisks.amber.includes(r));
          if (newRed.length > 0 || newAmber.length > 0) {
            const newRedCount = newRed.length;
            const newAmberCount = newAmber.length;
            exitQuickReviewMode();
            const alertDiv = document.createElement("div");
            alertDiv.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:9999; background:var(--red); color:white; padding:24px 32px; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.3); font-size:1.1rem; font-weight:700; text-align:center; min-width:400px;";
            alertDiv.innerHTML = `
                        <div style="font-size:2rem; margin-bottom:12px;">\u26A0\uFE0F</div>
                        <div style="margin-bottom:8px;">NEW RISK DETECTED</div>
                        <div style="font-size:0.9rem; font-weight:500; opacity:0.95;">Quick Review Mode Exited</div>
                        <div style="font-size:0.85rem; margin-top:12px; opacity:0.9;">${newRedCount > 0 ? newRedCount + " NEW RED" : newAmberCount + " NEW AMBER"} risk factor(s)</div>
                    `;
            document.body.appendChild(alertDiv);
            setTimeout(() => {
              alertDiv.style.transition = "opacity 0.3s";
              alertDiv.style.opacity = "0";
              setTimeout(() => alertDiv.remove(), 300);
            }, 3e3);
            setTimeout(() => {
              const riskSection = $("section-risk");
              if (riskSection) riskSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 500);
          }
        }
      }
      const listEl = $("flagList");
      if (listEl) {
        let html = [
          ...uniqueRed.map((t) => `<div style="color:var(--red); font-weight:700;">${t}</div>`),
          ...uniqueAmber.map((t) => `<div style="color:var(--amber); font-weight:700;">${t}</div>`),
          ...suppressedRisks.map((t) => `<div style="color:var(--muted); font-style:italic; border-left:2px solid var(--muted); padding-left:6px;">${t}</div>`)
        ];
        if (html.length === 0) listEl.innerHTML = '<div style="color:var(--muted)">No risk factors identified</div>';
        else listEl.innerHTML = html.join("");
      }
      document.querySelectorAll(".flag-red, .flag-amber").forEach((e) => e.classList.remove("flag-red", "flag-amber"));
      flagged.red.forEach((id) => {
        const el = $(id);
        if (el) {
          if (id.endsWith("_wrapper")) {
            el.classList.add("flag-red");
          } else {
            el.closest(".toggle-label, .input-box, .question-row")?.classList.add("flag-red");
          }
        }
      });
      flagged.amber.forEach((id) => {
        const el = $(id);
        if (el) {
          if (id.endsWith("_wrapper")) {
            el.classList.add("flag-amber");
          } else {
            el.closest(".toggle-label, .input-box, .question-row")?.classList.add("flag-amber");
          }
        }
      });
      let planHtml = "";
      const hoursSinceStep = timeData.hours;
      const disPrompt = $("discharge_prompt");
      const disMsg = $("discharge_msg");
      const chkDischarge = $("chk_discharge_alert");
      const disWrap = $("chk_discharge_wrapper");
      if (disPrompt) {
        const alreadyChecked = chkDischarge && chkDischarge.checked;
        const dismissed = window.dismissedDischarge === true;
        const isPost = s.reviewType === "post";
        let showPrompt = false;
        if (isPost && !alreadyChecked && !dismissed) {
          if (cat.id === "green" && hoursSinceStep >= 12) {
            showPrompt = true;
          } else if (cat.id === "amber" && hoursSinceStep >= 48) showPrompt = true;
          else if (cat.id === "red" && hoursSinceStep >= 72) showPrompt = true;
        }
        if (showPrompt) {
          disPrompt.style.display = "block";
          disPrompt.style.borderColor = `var(--${cat.id})`;
          if (cat.id === "green") disPrompt.style.borderColor = `var(--green)`;
          let colorName = "Green";
          if (cat.id === "amber") colorName = "Amber";
          if (cat.id === "red") colorName = "Red";
          let hoursTxt = Math.round(hoursSinceStep) + " hours";
          if (cat.id === "green") {
            disMsg.innerHTML = `<span style="color:var(--green)">${cat.text} Green patient.</span> ${hoursTxt} on ward.<br>Can patient be discharged?`;
          } else {
            disMsg.innerHTML = `<span style="color:var(--${cat.id})">${cat.text} ${colorName} patient.</span> ${hoursTxt} on ward.<br>Can patient be discharged?`;
          }
          if (disWrap) disWrap.classList.add("pulse-highlight");
        } else {
          disPrompt.style.display = "none";
          if (disWrap) disWrap.classList.remove("pulse-highlight");
          const continueChk = $("chk_continue_alert");
          if (continueChk && !s.chk_discharge_alert && s.reviewType === "post") {
            continueChk.checked = true;
          }
        }
      }
      if (s.stepdown_suitable === false) planHtml = `<div class="status red">Not suitable for stepdown.</div>`;
      else if (s.chk_discharge_alert) planHtml = `<div class="status" style="color:var(--blue-hint)">Discharge from ALERT nursing outreach list.</div>`;
      else if (s.chk_continue_alert) planHtml = `<div class="status green">Continue ALERT post ICU reviews.</div>`;
      else if (cat.id === "red") planHtml = `<div class="status red">At least daily ALERT review (up to 72h).</div>`;
      else if (cat.id === "amber") planHtml = `<div class="status amber">At least daily ALERT review (up to 48h).</div>`;
      else {
        if (s.reviewType === "pre") planHtml = `<div class="status green">ALERT post ICU review on ward.</div>`;
        else planHtml = `<div class="status green">Continue ALERT reviews \u2014 minimum 2 reviews and 24h post-stepdown required before discharge.</div>`;
      }
      if (s.chk_medical_rounding) planHtml += `<div style="margin-top:2px; font-weight:600; color:var(--accent);">+ Added to ALERT Medical Rounding List</div>`;
      const fu = $("followUpInstructions");
      if (fu) fu.innerHTML = planHtml;
      checkCompleteness(s, countComorbs);
      window._lastRed = uniqueRed;
      window._lastAmber = uniqueAmber;
      window._lastSuppressed = suppressedRisks;
      window._lastState = s;
      window._lastCat = cat;
      window._lastWardTime = timeData.text;
      window._lastActiveComorbsKeys = activeComorbsKeys;
    } catch (err) {
      console.error("Compute Error:", err);
    }
  }
  function checkCompleteness(s, comorbCount) {
    const nudges = document.querySelectorAll("#completeness_nudge");
    if (!nudges.length) return;
    let missing = [];
    if (!s.ptName) missing.push("Patient Name");
    if (!s.ptMrn) missing.push("URN");
    if (!s.ptWard) missing.push("Ward");
    nudges.forEach((nudge) => {
      if (missing.length > 0) {
        nudge.style.display = "block";
        nudge.textContent = "Missing: " + missing.join(", ");
        nudge.style.color = "#7c3aed";
      } else {
        nudge.style.display = "none";
      }
    });
  }

  // src/js/ui.js
  function checkBloodRanges() {
    for (const [key, range] of Object.entries(normalRanges)) {
      const id = `bl_${key}`;
      const input = $(id);
      if (input) {
        const val = parseFloat(input.value);
        const parent = input.closest(".blood-item, .input-box");
        if (!isNaN(val) && (val < range.low || val > range.high)) {
          parent?.classList.add("blood-abnormal");
        } else {
          parent?.classList.remove("blood-abnormal");
        }
      }
    }
  }
  function handleSegmentClick(id, value) {
    const map = {
      "resp_concern": "resp_gate_content",
      "renal": "renal_gate_content",
      "infection": "infection_gate_content",
      "neuro_gate": "neuro_gate_content",
      "nutrition_adequate": "nutrition_context_wrapper",
      "electrolyte_gate": "electrolyte_gate_content",
      "pressors": "pressor_gate_content",
      "immobility": "immobility_note_wrapper",
      "after_hours": "after_hours_note_wrapper",
      "hac": "hac_content",
      "stepdown_suitable": "unsuitable_note_wrapper",
      "comorbs_gate": "comorbs_gate_content",
      "sleep_quality": "sleep_quality_wrapper",
      "pain_control": "pain_context_wrapper",
      "neuro_psych": "neuro_psych_wrapper",
      "pics": "pics_wrapper",
      "resp_dyspnea": "sub_dyspnea_severity",
      "intubated": "sub_intubated_reason"
    };
    if (map[id]) {
      const el = $(map[id]);
      if (el) {
        if (id === "stepdown_suitable" || id === "nutrition_adequate") {
          el.style.display = value === "false" ? "block" : "none";
        } else if (id === "pics") {
          el.style.display = value === "positive" || value === "negative" ? "block" : "none";
        } else {
          el.style.display = value === "true" ? "block" : "none";
        }
      }
    }
    if (id === "resp_dyspnea" && value !== "true") {
      const dyspInput = $("dyspneaConcern");
      if (dyspInput) dyspInput.value = "";
      document.querySelectorAll('.quick-select[data-target="dyspneaConcern"]').forEach((b) => b.classList.remove("active"));
    }
  }
  function updateWardOptions() {
    const type = document.querySelector('input[name="reviewType"]:checked')?.value || "post";
    const sel = $("ptWard");
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="" selected disabled>Select Ward...</option>';
    const opts = type === "pre" ? ["ICU Pod 1", "ICU Pod 2", "ICU Pod 3", "ICU Pod 4"] : ["3A", "3B", "3C", "3D", "4A", "4B", "4C", "4D", "5A", "5B", "5C", "5D", "6A", "6B", "6C", "6D", "7A", "7B", "7C", "7D", "SRS2A", "SRS1A", "SRSA", "SRSB", "Medihotel 5", "Medihotel 6", "Medihotel 7", "Medihotel 8", "Short Stay", "Transit Lounge", "Mental Health", "CCU"];
    [...opts, "Other"].forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      if (currentVal === o) opt.selected = true;
      sel.appendChild(opt);
    });
    updateWardOtherVisibility();
  }
  function updateReviewTypeVisibility() {
    const type = document.querySelector('input[name="reviewType"]:checked')?.value || "post";
    const dis = $("chk_discharge_wrapper");
    if (dis) dis.style.display = type === "post" ? "block" : "none";
    const uns = $("chk_unsuitable_wrapper");
    if (uns) uns.style.display = type === "pre" ? "block" : "none";
    const icu = $("icu_summary_wrapper");
    if (icu) icu.style.display = type === "pre" ? "block" : "none";
    const dateWrapper = $("stepdown_date_wrapper");
    if (dateWrapper) dateWrapper.style.display = type === "post" ? "contents" : "none";
    const medRoundingWrapper = $("chk_medical_rounding_wrapper");
    const medRoundingPre = $("chk_medical_rounding_prestepdown");
    const continueAlertWrapper = $("chk_continue_alert_wrapper");
    if (medRoundingWrapper) medRoundingWrapper.style.display = type === "post" ? "block" : "none";
    if (medRoundingPre) medRoundingPre.style.display = type === "pre" ? "block" : "none";
    if (continueAlertWrapper) continueAlertWrapper.style.display = type === "post" ? "flex" : "none";
    if (type === "pre") {
      const c = $("chk_discharge_alert");
      if (c) c.checked = false;
    }
  }
  function updateWardOtherVisibility() {
    const w = $("ptWardOtherWrapper");
    const v = $("ptWard")?.value;
    if (w) w.style.display = v === "Other" ? "block" : "none";
  }
  function updateDevicesSectionVisibility() {
  }
  function createDeviceEntry(type, val = "", insertionDate = "") {
    const c = $("devices-container");
    if (!c) return;
    const div = document.createElement("div");
    div.className = "device-entry";
    div.dataset.type = type;
    const trackedDevices = ["CVC", "PICC", "PIVC", "Other CVAD", "IDC", "Vascath"];
    const hasDateField = trackedDevices.includes(type);
    let dwellDays = 0;
    let borderColor = "var(--line)";
    let infoText = "";
    let infoColor = "";
    if (hasDateField && insertionDate) {
      const now = /* @__PURE__ */ new Date();
      const deviceDate = /* @__PURE__ */ new Date(insertionDate + "T00:00:00");
      dwellDays = Math.floor((now - deviceDate) / (1e3 * 60 * 60 * 24));
      infoText = `${dwellDays}d dwell`;
      infoColor = "var(--text)";
      if (type === "PIVC") {
        if (dwellDays >= 7) {
          infoText = `${dwellDays}d, very long dwell`;
          infoColor = "var(--red)";
          borderColor = "var(--red)";
        } else if (dwellDays >= 5) {
          infoText = `${dwellDays}d, long dwell`;
          infoColor = "var(--amber)";
          borderColor = "var(--amber)";
        } else if (dwellDays >= 3) {
          infoText = `${dwellDays}d dwell`;
          infoColor = "#9333ea";
          borderColor = "#9333ea";
        }
      } else {
        if (dwellDays >= 14) {
          infoText = `${dwellDays}d, very long dwell`;
          infoColor = "var(--red)";
          borderColor = "var(--red)";
        } else if (dwellDays >= 10) {
          infoText = `${dwellDays}d, very long dwell`;
          infoColor = "var(--amber)";
          borderColor = "var(--amber)";
        } else if (dwellDays >= 7) {
          infoText = `${dwellDays}d, long dwell`;
          infoColor = "#9333ea";
          borderColor = "#9333ea";
        }
      }
    }
    let html = `<div style="display:flex; flex-direction:column; gap:4px; width:100%; box-sizing:border-box;">`;
    html += `<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:8px; background:var(--input-bg); border:1px solid ${borderColor}; border-radius:6px; box-sizing:border-box;">`;
    html += `<div style="flex-shrink:0; font-weight:600; font-size:0.85rem; min-width:80px;">${type}</div>`;
    if (hasDateField) {
      html += `<input class="device-date" type="date" value="${insertionDate}" placeholder="Date" style="padding:4px 6px; border:1px solid var(--line); border-radius:4px; font-size:0.8rem; width:130px;"/>`;
    }
    html += `<input class="device-textarea" type="text" placeholder="details..." value="${val}" style="flex:1; min-width:120px; padding:4px 8px; border:1px solid var(--line); border-radius:4px; font-size:0.85rem; box-sizing:border-box;"/>`;
    html += `<div class="remove-entry" style="cursor:pointer; font-weight:bold; color:var(--accent); font-size:1rem; flex-shrink:0;">\u2715</div>`;
    html += `</div>`;
    if (infoText && infoColor) {
      html += `<div class="device-info-text" style="font-size:0.8rem; font-weight:600; color:${infoColor}; padding-left:8px;">${infoText}</div>`;
    }
    html += `</div>`;
    div.innerHTML = html;
    div.querySelector(".remove-entry").addEventListener("click", () => {
      div.remove();
      window.devicesModifiedSinceLastSummary = true;
      updateDevicesSectionVisibility();
      saveState(true);
      computeAll();
    });
    const textarea = div.querySelector(".device-textarea");
    if (textarea) {
      textarea.addEventListener("input", () => {
        window.devicesModifiedSinceLastSummary = true;
        saveState(true);
        computeAll();
      });
    }
    if (hasDateField) {
      div.querySelector(".device-date").addEventListener("change", () => {
        const newDate = div.querySelector(".device-date").value;
        if (newDate) {
          const deviceDate = /* @__PURE__ */ new Date(newDate + "T00:00:00");
          const dwellDays2 = Math.floor((/* @__PURE__ */ new Date() - deviceDate) / (1e3 * 60 * 60 * 24));
          let newBorderColor = "var(--line)";
          let infoText2 = `${dwellDays2}d dwell`;
          let infoColor2 = "var(--text)";
          if (type === "PIVC") {
            if (dwellDays2 >= 7) {
              newBorderColor = "var(--red)";
              infoText2 = `${dwellDays2}d, very long dwell`;
              infoColor2 = "var(--red)";
            } else if (dwellDays2 >= 5) {
              newBorderColor = "var(--amber)";
              infoText2 = `${dwellDays2}d, long dwell`;
              infoColor2 = "var(--amber)";
            } else if (dwellDays2 >= 3) {
              newBorderColor = "#9333ea";
              infoText2 = `${dwellDays2}d dwell`;
              infoColor2 = "#9333ea";
            }
          } else {
            if (dwellDays2 >= 14) {
              newBorderColor = "var(--red)";
              infoText2 = `${dwellDays2}d, very long dwell`;
              infoColor2 = "var(--red)";
            } else if (dwellDays2 >= 10) {
              newBorderColor = "var(--amber)";
              infoText2 = `${dwellDays2}d, very long dwell`;
              infoColor2 = "var(--amber)";
            } else if (dwellDays2 >= 7) {
              newBorderColor = "#9333ea";
              infoText2 = `${dwellDays2}d, long dwell`;
              infoColor2 = "#9333ea";
            }
          }
          const innerDiv = div.querySelector('div[style*="border"]');
          if (innerDiv) {
            innerDiv.style.borderColor = newBorderColor;
          }
          let infoTextEl = div.querySelector(".device-info-text");
          if (infoText2 && infoColor2) {
            if (!infoTextEl) {
              infoTextEl = document.createElement("div");
              infoTextEl.className = "device-info-text";
              infoTextEl.style.cssText = "font-size:0.8rem; font-weight:600; padding-left:8px;";
              div.querySelector('div[style*="flex-direction"]')?.appendChild(infoTextEl);
            }
            infoTextEl.textContent = infoText2;
            infoTextEl.style.color = infoColor2;
          } else if (infoTextEl) {
            infoTextEl.remove();
          }
        }
        window.devicesModifiedSinceLastSummary = true;
        saveState(true);
        computeAll();
      });
    }
    c.appendChild(div);
  }
  function toggleOxyFields() {
    const mod = $("oxMod")?.querySelector(".select-btn.active")?.dataset.value || "RA";
    const show = (cls) => document.querySelectorAll(cls).forEach((e) => e.style.display = "block");
    const hide = (cls) => document.querySelectorAll(cls).forEach((e) => e.style.display = "none");
    hide(".npOnly");
    hide(".hfnpOnly");
    hide(".nivOnly");
    hide(".tracheOnly");
    if (mod === "NP") show(".npOnly");
    if (mod === "HFNP") show(".hfnpOnly");
    if (mod === "NIV") show(".nivOnly");
    if (mod === "Trache") show(".tracheOnly");
  }
  function toggleInfusionsBox() {
    const w = $("infusions_wrapper");
    if (w) w.style.display = "grid";
  }
  function toggleBowelDate(mode) {
    const w = $("bowel_date_wrapper");
    if (w) w.style.display = mode ? "block" : "none";
    if (mode) {
      const l = $("bowel_date_label");
      if (l) l.textContent = mode === "btn_bno" ? "Date Last Opened" : "Date BO";
      const ap = $("aperients_wrapper");
      if (ap) ap.style.display = mode === "btn_bno" ? "block" : "none";
      handleUnknownBLODate();
    }
  }
  function handleUnknownBLODate() {
    const unknownChk = $("chk_unknown_blo_date");
    const dateInput = $("bowel_date");
    const todayBtn = $("btn_bowel_today");
    const yesterdayBtn = $("btn_bowel_yesterday");
    if (unknownChk && dateInput) {
      const isUnknown = unknownChk.checked;
      dateInput.disabled = isUnknown;
      dateInput.style.opacity = isUnknown ? "0.5" : "1";
      if (todayBtn) {
        todayBtn.disabled = isUnknown;
        todayBtn.style.opacity = isUnknown ? "0.5" : "1";
      }
      if (yesterdayBtn) {
        yesterdayBtn.disabled = isUnknown;
        yesterdayBtn.style.opacity = isUnknown ? "0.5" : "1";
      }
      if (isUnknown) {
        dateInput.value = "";
      }
    }
  }
  function showClearDataModal() {
    const modal = $("clearDataModal");
    if (modal) modal.style.display = "flex";
  }
  function hideClearDataModal() {
    const modal = $("clearDataModal");
    if (modal) modal.style.display = "none";
  }
  var _syncingPMH = false;
  function syncComorbsToPMH() {
    if (_syncingPMH) return;
    _syncingPMH = true;
    const noteEl = $("pmh_note");
    if (!noteEl) {
      _syncingPMH = false;
      return;
    }
    const activeKeys = toggleInputs.filter((k) => k.startsWith("comorb_") && $(`toggle_${k}`)?.dataset.value === "true");
    const chipLines = [];
    activeKeys.forEach((k) => {
      if (k === "comorb_other") {
        const specVal = $("comorb_other_note")?.value.trim();
        if (specVal) chipLines.push(specVal);
      } else {
        chipLines.push(comorbMap[k]);
      }
    });
    const filterLower = Object.values(comorbMap).map((n) => n.toLowerCase());
    const otherVal = $("comorb_other_note")?.value.trim();
    if (otherVal) filterLower.push(otherVal.toLowerCase());
    const userLines = noteEl.value.split("\\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed && !filterLower.includes(trimmed.toLowerCase());
    });
    noteEl.value = [...chipLines, ...userLines].join("\\n");
    _syncingPMH = false;
  }
  function clearData() {
    hideClearDataModal();
    if (isQuickReviewMode) {
      exitQuickReviewMode();
    }
    pushUndo(getState());
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelectorAll(".panel").forEach((p2) => p2.style.display = "none");
    document.querySelectorAll(".accordion").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
      const icon = btn.querySelector(".icon");
      if (icon) icon.textContent = "[+]";
    });
    sessionStorage.removeItem(ACCORDION_KEY);
    staticInputs.forEach((id) => {
      if ($(id)) {
        $(id).value = "";
        $(id).classList.remove("scraped-data");
      }
    });
    const impTxt = $("importText");
    if (impTxt) impTxt.value = "";
    document.querySelectorAll(".active").forEach((e) => e.classList.remove("active"));
    document.querySelectorAll('input[type="checkbox"]').forEach((e) => e.checked = false);
    document.querySelectorAll(".toggle-label").forEach((e) => e.dataset.value = "false");
    document.querySelectorAll(".blood-abnormal").forEach((e) => e.classList.remove("blood-abnormal"));
    const dc = $("devices-container");
    if (dc) dc.innerHTML = "";
    const sc = $("selected_comorbs_display");
    if (sc) {
      sc.innerHTML = "";
      sc.style.display = "none";
    }
    document.querySelectorAll(".prev-datum").forEach((el) => el.textContent = "");
    const pb = $("prevRisksBox");
    if (pb) pb.style.display = "none";
    const gatesToHide = [
      "#resp_gate_content",
      "#renal_gate_content",
      "#neuro_gate_content",
      "#electrolyte_gate_content",
      "#infection_gate_content",
      "#pressor_gate_content",
      "#hac_content",
      "#immobility_note_wrapper",
      "#after_hours_note_wrapper",
      "#comorb_other_note_wrapper",
      "#unsuitable_note_wrapper",
      "#override_reason_box",
      "#sub_intubated_reason",
      "#sub_dyspnea_severity",
      "#pressor_recent_other_note_wrapper",
      "#dialysis_type_wrapper",
      "#anticoag_note_wrapper",
      "#vte_prophylaxis_note_wrapper",
      "#pics_wrapper",
      "#sleep_quality_wrapper",
      "#neuro_psych_wrapper",
      "#pain_context_wrapper",
      "#nutrition_context_wrapper"
    ];
    gatesToHide.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.style.display = "none";
    });
    document.querySelectorAll(".concern-note").forEach((e) => {
      if (!["immobility_note_wrapper", "after_hours_note_wrapper", "comorb_other_note_wrapper", "unsuitable_note_wrapper", "pressor_recent_other_note_wrapper"].includes(e.id)) {
        e.style.display = "block";
      }
    });
    const summaryActions = $("summary_actions");
    if (summaryActions) summaryActions.style.display = "none";
    const badge = $("manual_edit_badge");
    if (badge) badge.style.display = "none";
    const btnGen = $("btn_generate_summary");
    if (btnGen) btnGen.innerHTML = "\u2728 Click here to generate DMR summary";
    const summaryEl = $("summary");
    if (summaryEl) {
      summaryEl.value = "";
      summaryEl.style.height = "";
    }
    window.dismissedDischarge = false;
    const now = /* @__PURE__ */ new Date();
    const m = now.getMinutes();
    const rounded = Math.round(m / 15) * 15;
    now.setMinutes(rounded);
    const tb = $("reviewTime");
    if (tb) tb.value = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const p = document.querySelector('input[value="post"]');
    if (p) p.checked = true;
    updateWardOptions();
    updateReviewTypeVisibility();
    const listEl = $("flagList");
    if (listEl) listEl.innerHTML = "";
    const sum = $("summary");
    if (sum) sum.value = "";
    const orReason = $("override_reason_box");
    if (orReason) orReason.style.display = "none";
    $("override_amber")?.classList.remove("active");
    $("override_red")?.classList.remove("active");
    const resetEv = new CustomEvent("resetAddsCalc");
    document.dispatchEvent(resetEv);
    computeAll();
    saveState(true);
    showToast("Data cleared", 2e3);
  }
  function openAccordion(panelId, btnSelector) {
    const panel = $(panelId);
    const btn = document.querySelector(btnSelector);
    if (panel && btn) {
      panel.style.display = "block";
      btn.setAttribute("aria-expanded", "true");
      const icon = btn.querySelector(".icon");
      if (icon) icon.textContent = "[-]";
    }
  }
  function enableQuickReviewMode() {
    setQuickReviewMode(true);
    const s = getState();
    setInitialQuickReviewRisks({ red: [], amber: [] });
    setQuickReviewBaselineCaptured(false);
    computeAll();
    const banner = $("quickReviewBanner");
    if (banner) banner.style.display = "block";
    const prompt = $("quickReviewPrompt");
    if (prompt) prompt.style.display = "none";
    const previousRisks = previousCategoryData?.previousRisks || [];
    const riskSectionMap = {
      "respiratory": "resp_wrapper",
      "neuro": "neuro_wrapper",
      "renal": "renal_wrapper",
      "infection": "infection_wrapper",
      "vasoactive": "pressor_wrapper",
      "immobility": "immobility_wrapper",
      "nutrition": "nutrition_wrapper",
      "electrolyte": "elec_wrapper"
    };
    const allRiskSections = [...Object.values(riskSectionMap), "hac_wrapper", "ah_wrapper", "comorbs_wrapper", "after_hours_note_wrapper"];
    const sectionsToShow = previousRisks.map((risk) => riskSectionMap[risk]).filter(Boolean);
    const sectionsToHide = allRiskSections.filter((id) => !sectionsToShow.includes(id));
    sectionsToHide.forEach((id) => {
      const section = $(id);
      if (section) {
        section.style.display = "none";
        section.setAttribute("data-hidden-by-quick-review", "true");
      }
    });
    sectionsToShow.forEach((id) => {
      const section = $(id);
      if (section) {
        const heading = section.querySelector(".bold-heading");
        if (heading && !heading.querySelector(".review-badge")) {
          const badge = document.createElement("span");
          badge.className = "review-badge";
          badge.style.cssText = "display:inline-block; margin-left:8px; padding:2px 8px; background:var(--amber); color:white; font-size:0.75rem; border-radius:4px; font-weight:600;";
          badge.textContent = "\u21BB Re-assess";
          heading.appendChild(badge);
        }
      }
    });
    const otherSectionsToHide = ["section-psychosocial"];
    otherSectionsToHide.forEach((id) => {
      const section = $(id);
      if (section) {
        section.style.display = "none";
        section.setAttribute("data-hidden-by-quick-review", "true");
      }
    });
    const accordionsToClose = ["panel_devices", "panel_other"];
    accordionsToClose.forEach((panelId) => {
      if (panelId === "panel_devices") {
        const hasDevices = Object.values(s.devices || {}).some((arr) => Array.isArray(arr) && arr.length > 0);
        if (hasDevices) {
          openAccordion("panel_devices", '[aria-controls="panel_devices"]');
          return;
        }
      }
      const btnSelector = `[aria-controls="${panelId}"]`;
      const btn = document.querySelector(btnSelector);
      const panel = $(panelId);
      if (btn && panel) {
        panel.style.display = "none";
        btn.setAttribute("aria-expanded", "false");
        const icon = btn.querySelector(".icon");
        if (icon) icon.textContent = "[+]";
      }
    });
    openAccordion("panel_ae", '[aria-controls="panel_ae"]');
    openAccordion("panel_bloods", '[aria-controls="panel_bloods"]');
    const riskSection = $("section-risk");
    if (riskSection) {
      riskSection.style.display = "";
    }
    document.querySelectorAll(".nav-item").forEach((item) => {
      const href = item.getAttribute("href");
      if (href && otherSectionsToHide.includes(href.substring(1))) {
        item.style.opacity = "0.3";
        item.style.pointerEvents = "none";
      }
    });
    setTimeout(() => {
      const aeSection = $("section-ae");
      if (aeSection) aeSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    const riskNames = previousRisks.join(", ");
    showToast(`\u26A1 Quick Review - Re-assessing: ${riskNames}`, 3e3);
  }
  function exitQuickReviewMode() {
    setQuickReviewMode(false);
    setInitialQuickReviewRisks({ red: [], amber: [] });
    setQuickReviewBaselineCaptured(false);
    const banner = $("quickReviewBanner");
    if (banner) banner.style.display = "none";
    document.querySelectorAll("[data-hidden-by-quick-review]").forEach((section) => {
      section.style.display = "";
      section.removeAttribute("data-hidden-by-quick-review");
    });
    document.querySelectorAll(".review-badge").forEach((badge) => badge.remove());
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.style.opacity = "";
      item.style.pointerEvents = "";
    });
    showToast("Full review mode restored", 2e3);
  }
  function showQuickReviewPrompt(categoryText, hoursOnWard, previousRisks = []) {
    const prompt = $("quickReviewPrompt");
    if (!prompt) return;
    const prevCatText = $("prevCategoryText");
    const timeText = $("timeOnWardText");
    if (prevCatText) {
      const riskList = previousRisks.length > 0 ? ` (${previousRisks.join(", ")})` : "";
      prevCatText.textContent = categoryText + riskList;
    }
    if (timeText) timeText.textContent = `${Math.round(hoursOnWard)}h`;
    prompt.style.display = "block";
    setTimeout(() => {
      prompt.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  }
  function updateSidebarRiskBadges(redCount, amberCount) {
    const badgeContainer = document.getElementById("sidebar-risk-badges");
    const mobileBadgeContainer = document.getElementById("mobile-risk-badges");
    let html = "";
    if (redCount > 0) html += `<span class="badge" style="color:var(--red);">\u{1F534}${redCount}</span>`;
    if (amberCount > 0) html += `<span class="badge" style="color:var(--amber);">\u{1F7E1}${amberCount}</span>`;
    if (badgeContainer) badgeContainer.innerHTML = html;
    if (mobileBadgeContainer) mobileBadgeContainer.innerHTML = html;
  }
  function openMobileNav() {
    const overlay = $("mobileNavOverlay");
    if (overlay) overlay.classList.add("active");
  }
  function closeMobileNav() {
    const overlay = $("mobileNavOverlay");
    if (overlay) overlay.classList.remove("active");
  }

  // src/js/state.js
  window.prevBloods = {};
  var isQuickReviewMode = false;
  function setQuickReviewMode(v) {
    isQuickReviewMode = v;
  }
  var previousCategoryData = null;
  var initialQuickReviewRisks = { red: [], amber: [] };
  function setInitialQuickReviewRisks(v) {
    initialQuickReviewRisks = v;
  }
  var quickReviewBaselineCaptured = false;
  function setQuickReviewBaselineCaptured(v) {
    quickReviewBaselineCaptured = v;
  }
  function saveState(instantly = false) {
    const state = getState();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    sessionStorage.setItem("alertToolLastSaved_v7_7", (/* @__PURE__ */ new Date()).toISOString());
    updateLastSaved();
  }
  function loadState() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return null;
    }
  }
  function updateLastSaved() {
    const iso = sessionStorage.getItem("alertToolLastSaved_v7_7");
    const el = $("lastSaved");
    if (el) el.textContent = iso ? "Last saved: " + new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Last saved: --:--";
  }
  function pushUndo(snapshot) {
    sessionStorage.setItem(UNDO_KEY, JSON.stringify({ snapshot, created: Date.now() }));
  }
  function getState() {
    const state = {};
    staticInputs.forEach((id) => {
      const el = $(id);
      if (el) state[id] = el.value;
    });
    segmentedInputs.forEach((id) => {
      const group = $(`seg_${id}`);
      const active = group?.querySelector(".seg-btn.active");
      if (!active) {
        state[id] = null;
      } else if (active.dataset.value === "true" || active.dataset.value === "false") {
        state[id] = active.dataset.value === "true";
      } else {
        state[id] = active.dataset.value;
      }
    });
    toggleInputs.forEach((id) => {
      if ([
        "resp_tachypnea",
        "resp_rapid_wean",
        "resp_poor_cough",
        "resp_poor_swallow",
        "lactate_trend"
      ].includes(id)) return;
      const el = $(`toggle_${id}`);
      if (!el && id === "chk_aperients") {
        const chk = $("chk_aperients");
        if (chk) state[id] = chk.checked;
        return;
      }
      if (!el && id === "chk_unknown_blo_date") {
        const chk = $("chk_unknown_blo_date");
        if (chk) state[id] = chk.checked;
        return;
      }
      state[id] = el ? el.dataset.value === "true" : false;
    });
    selectInputs.forEach((id) => {
      const group = $(id);
      state[id] = group?.querySelector(".select-btn.active")?.dataset.value || "";
    });
    state["reviewType"] = document.querySelector('input[name="reviewType"]:checked')?.value || "post";
    state["clinicianRole"] = document.querySelector('input[name="clinicianRole"]:checked')?.value || "ALERT CNS";
    ["chk_medical_rounding", "chk_discharge_alert", "chk_continue_alert", "chk_use_mods"].forEach((id) => {
      const el = $(id);
      if (el) state[id] = el.checked;
    });
    state["bowel_mode"] = document.querySelector("#panel_ae .quick-select.active")?.id || null;
    state.devices = {};
    deviceTypes.forEach((type) => {
      state.devices[type] = Array.from(document.querySelectorAll(`.device-entry[data-type="${type}"]`)).map((entry) => {
        const detailsInput = entry.querySelector(".device-textarea");
        const dateInput = entry.querySelector(".device-date");
        return {
          details: detailsInput ? detailsInput.value : "",
          insertionDate: dateInput ? dateInput.value : ""
        };
      });
    });
    document.querySelectorAll(".trend-buttons").forEach((group) => {
      state[group.id] = group.querySelector(".trend-btn.active")?.dataset.value || "";
    });
    return state;
  }
  function restoreState(state) {
    if (!state) return;
    if (state.initials && !state.ptName) state.ptName = state.initials;
    if (state.ptName && !state.initials) state.initials = state.ptName;
    staticInputs.forEach((id) => {
      const el = $(id);
      if (el && state[id] !== void 0) el.value = state[id];
    });
    segmentedInputs.forEach((id) => {
      const group = $(`seg_${id}`);
      if (!group) return;
      group.querySelectorAll(".seg-btn").forEach((btn) => btn.classList.remove("active"));
      let valStr = String(state[id]);
      if (state[id] === true) valStr = "true";
      if (state[id] === false) valStr = "false";
      const target = group.querySelector(`.seg-btn[data-value="${valStr}"]`);
      if (target) target.classList.add("active");
      handleSegmentClick(id, valStr);
    });
    toggleInputs.forEach((id) => {
      if (id === "chk_aperients") {
        const chk = $("chk_aperients");
        if (chk) chk.checked = state[id];
        return;
      }
      if (id === "chk_unknown_blo_date") {
        const chk = $("chk_unknown_blo_date");
        if (chk) chk.checked = state[id];
        return;
      }
      const el = $(`toggle_${id}`);
      if (el) {
        el.dataset.value = state[id] ? "true" : "false";
        el.classList.toggle("active", !!state[id]);
        if (id === "comorb_other") $("comorb_other_note_wrapper").style.display = state[id] ? "block" : "none";
        if (id === "pressor_recent_other") $("pressor_recent_other_note_wrapper").style.display = state[id] ? "block" : "none";
        if (id === "pressor_current_other") $("pressor_current_other_note_wrapper").style.display = state[id] ? "block" : "none";
        if (id === "anticoag_active") $("anticoag_note_wrapper").style.display = state[id] ? "block" : "none";
        if (id === "vte_prophylaxis_active") $("vte_prophylaxis_note_wrapper").style.display = state[id] ? "block" : "none";
        if (id === "renal_dialysis") $("dialysis_type_wrapper").style.display = state[id] ? "block" : "none";
      }
    });
    if (state["comorbs_gate"] === void 0) {
      const anyComorb = toggleInputs.filter((k) => k.startsWith("comorb_") && state[k]).length > 0;
      if (anyComorb) {
        const group = $("seg_comorbs_gate");
        group?.querySelectorAll(".seg-btn").forEach((btn) => btn.classList.remove("active"));
        const yesBtn = group?.querySelector('.seg-btn[data-value="true"]');
        if (yesBtn) yesBtn.classList.add("active");
        handleSegmentClick("comorbs_gate", "true");
      }
    }
    selectInputs.forEach((id) => {
      const group = $(id);
      if (group) {
        group.querySelectorAll(".select-btn").forEach((b) => b.classList.remove("active"));
        if (state[id]) {
          group.querySelector(`.select-btn[data-value="${state[id]}"]`)?.classList.add("active");
        }
        if (id === "neuroType") $("neuro_gate_content").style.display = "block";
      }
    });
    if (state["reviewType"]) {
      const r = document.querySelector(`input[name="reviewType"][value="${state["reviewType"]}"]`);
      if (r) r.checked = true;
      updateWardOptions();
      updateReviewTypeVisibility();
    }
    if (state["clinicianRole"]) {
      const r = document.querySelector(`input[name="clinicianRole"][value="${state["clinicianRole"]}"]`);
      if (r) r.checked = true;
    }
    ["chk_medical_rounding", "chk_discharge_alert", "chk_continue_alert", "chk_use_mods"].forEach((id) => {
      const el = $(id);
      if (el && state[id] !== void 0) el.checked = state[id];
    });
    if (state["chk_use_mods"]) $("mods_inputs").style.display = "block";
    if (state["bowel_mode"]) {
      $(state["bowel_mode"])?.classList.add("active");
      toggleBowelDate(state["bowel_mode"]);
    }
    if (state.ptWard) {
      updateWardOptions();
      const sel = $("ptWard");
      if (sel) sel.value = state.ptWard;
    }
    updateWardOtherVisibility();
    const devCont = $("devices-container");
    if (devCont) {
      devCont.innerHTML = "";
      if (state.devices) {
        deviceTypes.forEach((type) => {
          state.devices[type]?.forEach((item) => {
            if (typeof item === "string") {
              createDeviceEntry(type, item, "");
            } else {
              createDeviceEntry(type, item.details || "", item.insertionDate || "");
            }
          });
        });
      }
    }
    updateDevicesSectionVisibility();
    document.querySelectorAll(".trend-buttons").forEach((group) => {
      if (state[group.id]) group.querySelector(`.trend-btn[data-value="${state[group.id]}"]`)?.classList.add("active");
    });
    toggleOxyFields();
    toggleInfusionsBox();
  }

  // src/js/summary.js
  function generateSummary(s, cat, wardTimeTxt, red, amber, suppressed, activeComorbsKeys) {
    const sum = $("summary");
    window.devicesModifiedSinceLastSummary = false;
    const lines = [];
    const addLine = (txt) => {
      if (txt) lines.push(txt);
    };
    const role = s.clinicianRole;
    const reviewName = s.reviewType === "pre" ? "Pre-Stepdown" : "post ICU review";
    if (s.reviewType === "pre") {
      lines.push(`${role} Pre-Stepdown Review`);
    } else {
      lines.push(`${role} ${reviewName}`);
    }
    lines.push(`Patient: ${s.ptName || "--"} | URN: ...${s.ptMrn || ""} | Location: ${s.ptWard || "--"}, Room: ${s.ptBed || "--"}`);
    let demo = [];
    if (s.ptAge) demo.push(`Age: ${s.ptAge}`);
    if (s.ptWeight) demo.push(`Weight: ${s.ptWeight}kg`);
    if (demo.length) lines.push(demo.join(", "));
    lines.push(`Time of review: ${s.reviewTime || nowTimeStr()}`);
    if (s.reviewType === "pre") {
      lines.push(`Stepdown Date: Today (${todayDateStr()})`);
    } else if (s.stepdownDate) {
      lines.push(`ICU Discharge Date: ${formatDateDDMMYYYY(s.stepdownDate)}`);
    }
    lines.push("");
    if (wardTimeTxt && s.reviewType !== "pre") lines.push(`Time since stepdown: ${wardTimeTxt}`);
    if (s.icuLos) lines.push(`ICU LOS: ${s.icuLos} days`);
    lines.push(`Reason for ICU Admission: ${s.ptAdmissionReason || "--"}`);
    if (s.reviewType === "pre" && s.icuSummary) {
      lines.push("");
      lines.push(`ICU Course Summary: ${s.icuSummary}`);
    }
    lines.push("");
    if (s.stepdown_suitable === false) {
      lines.push(`ALERT Nursing Review Category - Not suitable for stepdown`);
      lines.push("");
      lines.push("Assessed as not presently suitable for ward stepdown.");
      lines.push(`Reason: ${s.unsuitable_note || "Clinical concerns (see notes)"}`);
      lines.push("Plan: ICU Senior Review requested. Please contact ALERT for re-review when appropriate.");
      lines.push("");
      lines.push("--- FULL ASSESSMENT BELOW ---");
      lines.push("");
    } else {
      lines.push(`ALERT Nursing Review Category - ${cat.text}`);
      if (s.stepdown_suitable === true && s.reviewType === "pre") {
        lines.push("Patient is suitable for ward stepdown.");
      }
      lines.push("");
    }
    const pmhItems = [];
    const pmhSeen = /* @__PURE__ */ new Set();
    activeComorbsKeys.forEach((k) => {
      let name;
      if (k === "comorb_other" && s.comorb_other_note) {
        name = s.comorb_other_note.trim();
      } else if (k === "comorb_other") {
        return;
      } else {
        name = comorbMap[k];
      }
      if (name && !pmhSeen.has(name.toLowerCase())) {
        pmhSeen.add(name.toLowerCase());
        pmhItems.push(name);
      }
    });
    if (s.pmh_note) {
      s.pmh_note.split("\n").forEach((p) => {
        const trimmed = p.trim().replace(/^-/, "").trim();
        if (trimmed && !pmhSeen.has(trimmed.toLowerCase())) {
          pmhSeen.add(trimmed.toLowerCase());
          pmhItems.push(trimmed);
        }
      });
    }
    if (pmhItems.length > 0) {
      lines.push("PMH:");
      pmhItems.forEach((item) => lines.push(`-${item}`));
      lines.push("");
    }
    if (s.allergies_note) {
      lines.push(`Allergies: ${s.allergies_note}`);
      lines.push("");
    }
    if (s.goc_note) {
      lines.push(`GOC: ${s.goc_note}`);
      lines.push("");
    }
    lines.push("A-E ASSESSMENT:");
    if (s.chk_use_mods) addLine(`MODS: ${s.mods_score} ${s.mods_details ? `(${s.mods_details})` : ""}`);
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
    if (b.length) addLine(`B: ${b.join(", ")}`);
    else if (s.b_comment) addLine(`B:`);
    if (s.b_comment) addLine(`  - ${s.b_comment}`);
    let c = [];
    if (s.c_hr) c.push(`HR ${s.c_hr} ${s.c_hr_rhythm ? `(${s.c_hr_rhythm})` : ""}`);
    if (s.c_nibp) c.push(`NIBP ${s.c_nibp}`);
    if (s.c_cr) c.push(`CR ${s.c_cr}`);
    if (s.c_perf) c.push(`Perf ${s.c_perf}`);
    if (c.length) addLine(`C: ${c.join(", ")}`);
    else if (s.c_comment) addLine(`C:`);
    if (s.c_comment) addLine(`  - ${s.c_comment}`);
    let d = [];
    if (s.d_alert) d.push(s.d_alert);
    if (s.d_pain) {
      if (s.d_pain.toLowerCase() === "no pain") {
        d.push("No pain");
      } else {
        d.push(`Pain: ${s.d_pain}`);
      }
    }
    if (d.length) addLine(`D: ${d.join(", ")}`);
    else if (s.d_comment) addLine(`D:`);
    if (s.d_comment) addLine(`  - ${s.d_comment}`);
    let e = [];
    if (s.e_temp) e.push(`Temp ${s.e_temp}`);
    if (s.e_uop) e.push(`UOP ${s.e_uop}`);
    if (s.e_bsl) e.push(`BSL ${s.e_bsl}`);
    if (e.length) addLine(`E: ${e.join(", ")}`);
    else if (s.e_comment) addLine(`E:`);
    if (s.e_comment) addLine(`  - ${s.e_comment}`);
    lines.push("");
    if (s.ae_mobility) addLine(`Mobility: ${s.ae_mobility}`);
    let bowelTxt = "";
    if (s.bowel_mode === "btn_bo") bowelTxt = "BO";
    else if (s.bowel_mode === "btn_bno") bowelTxt = "BNO";
    if (s.chk_unknown_blo_date && s.bowel_mode === "btn_bno") {
      bowelTxt += ", unknown when BLO";
    } else if (s.bowel_date) {
      const bd = new Date(s.bowel_date);
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      bd.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - bd) / (1e3 * 60 * 60 * 24));
      if (s.bowel_mode === "btn_bo") {
        if (daysDiff === 0) {
          bowelTxt += `, today (${bd.getDate()}/${bd.getMonth() + 1})`;
        } else if (daysDiff === 1) {
          bowelTxt += `, yesterday (${bd.getDate()}/${bd.getMonth() + 1})`;
        } else {
          bowelTxt += `, ${daysDiff} days ago (${bd.getDate()}/${bd.getMonth() + 1})`;
        }
      } else if (s.bowel_mode === "btn_bno") {
        if (daysDiff === 0) {
          bowelTxt += `. Last opened today (${bd.getDate()}/${bd.getMonth() + 1})`;
        } else if (daysDiff === 1) {
          bowelTxt += `. Last opened yesterday on ${bd.getDate()}/${bd.getMonth() + 1}`;
        } else {
          bowelTxt += `. Last opened ${daysDiff} days ago on ${bd.getDate()}/${bd.getMonth() + 1}`;
        }
      }
    }
    if (s.chk_aperients && s.bowel_mode === "btn_bno") bowelTxt += ". On aperients";
    if (s.ae_bowels) {
      if (s.bowel_mode === "btn_bo") {
        bowelTxt += `, type ${s.ae_bowels}`;
      } else {
        bowelTxt += `. ${s.ae_bowels}`;
      }
    }
    if (bowelTxt) addLine(`Bowels: ${bowelTxt} `);
    if (s.ae_diet) addLine(`Diet: ${s.ae_diet} `);
    if (s.nutrition_adequate === false) addLine(`Nutrition: Inadequate${s.nutrition_context_note ? ` - ${s.nutrition_context_note}` : ""}`);
    else if (s.nutrition_adequate === true) addLine(`Nutrition: Adequate`);
    if (s.pics) {
      const picsStatus = s.pics === "positive" ? "Positive" : "Negative";
      addLine(`Post ICU Syndrome: ${picsStatus}${s.pics_note ? ` - ${s.pics_note}` : ""}`);
    }
    if (s.sleep_quality === true) addLine(`Sleep: Poor${s.sleep_quality_note ? ` - ${s.sleep_quality_note}` : ""}`);
    else if (s.sleep_quality === false) addLine(`Sleep: No sleep issues identified`);
    if (s.neuro_psych === true) addLine(`Psychological issues: ${s.neuro_psych_note || "Concerns identified"}`);
    else if (s.neuro_psych === false) addLine(`Psychological issues: Nil identified`);
    if (s.anticoag_note) addLine(`Anticoagulation: ${s.anticoag_note}`);
    if (s.vte_prophylaxis_note) addLine(`VTE Prophylaxis: ${s.vte_prophylaxis_note}`);
    if (s.infusions_note) addLine(`Infusions: ${s.infusions_note}`);
    lines.push("");
    const blMap = { "lac_review": "Lac", "hb": "Hb", "wcc": "WCC", "cr_review": "Cr", "egfr": "eGFR", "k": "K", "na": "Na", "mg": "Mg", "phos": "PO4", "plts": "Plts", "alb": "Alb", "neut": "Neut", "lymph": "Lymph", "bili": "Bili", "alt": "ALT", "inr": "INR", "aptt": "APTT" };
    const blLines = [];
    Object.keys(blMap).forEach((key) => {
      const currentVal = s[`bl_${key}`];
      const prevVal = window.prevBloods ? window.prevBloods[key] : null;
      if (currentVal) {
        let str = `${blMap[key]} ${currentVal}`;
        if (prevVal && prevVal !== currentVal) str += ` (${prevVal})`;
        blLines.push(str);
      }
    });
    if (blLines.length) addLine(`Bloods: ${blLines.join(", ")}`);
    if (s.new_bloods_ordered === "ordered") addLine("New bloods ordered for next round");
    if (s.new_bloods_ordered === "requested") addLine("New bloods requested (not yet ordered)");
    if (s.new_bloods_ordered === "not_required") addLine("New bloods not required");
    if (s.elec_replace_note) addLine(`Electrolyte Plan: ${s.elec_replace_note}`);
    lines.push("");
    const hasAnyDevices = Object.values(s.devices || {}).some((arr) => arr.length);
    if (hasAnyDevices) {
      lines.push("LINES, DRAINS, DEVICES & WOUNDS:");
      const trackedDevices = ["CVC", "PICC", "PIVC", "Other CVAD", "IDC", "Vascath"];
      Object.entries(s.devices).forEach(([k, v]) => {
        v.forEach((item) => {
          let deviceLine = `- ${k}`;
          if (item.insertionDate && trackedDevices.includes(k)) {
            const deviceDate = /* @__PURE__ */ new Date(item.insertionDate + "T00:00:00");
            const dwellDays = Math.floor((/* @__PURE__ */ new Date() - deviceDate) / (1e3 * 60 * 60 * 24));
            if (item.details) deviceLine += ` - ${item.details}`;
            const threshold = k === "PIVC" ? 5 : 7;
            if (k === "PIVC") {
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
    lines.push("");
    if (s.context_other_note) lines.push(`Other: ${s.context_other_note}`);
    lines.push("");
    lines.push("IDENTIFIED ICU READMISSION RISK FACTORS:");
    const risks = [...red, ...amber];
    if (risks.length) {
      risks.forEach((r) => lines.push(`- ${r}`));
    }
    if (suppressed.length) {
      suppressed.forEach((r) => lines.push(`- ${r}`));
    }
    if (risks.length === 0 && suppressed.length === 0) {
      lines.push("- None identified");
    }
    lines.push("");
    lines.push("PLAN:");
    if (s.stepdown_suitable === false) {
      lines.push("- ICU Senior Review requested due to unsuitability for ward stepdown.");
      lines.push("- Please re-contact ALERT for re-review when appropriate.");
    } else if (s.chk_discharge_alert) {
      lines.push("- Discharge from ALERT nursing post-ICU list. Please re-contact ALERT if further support required.");
    } else if (s.chk_continue_alert) {
      lines.push("- Continue ALERT post ICU reviews.");
    } else if (cat.id === "red") {
      lines.push("- At least daily ALERT review for up to 72h post-ICU stepdown.");
    } else if (cat.id === "amber") {
      lines.push("- At least daily ALERT review for up to 48h post-ICU stepdown.");
    } else {
      if (s.reviewType === "pre") {
        lines.push("- At least single ALERT nursing follow up on ward.");
      } else if (s.chk_discharge_alert) {
        lines.push("- Discharge from ALERT post ICU list. Please re-contact ALERT if further support required.");
      } else {
        lines.push("- Continued ALERT nursing reviews for up to 24h post stepdown (minimum 2 reviews required before discharge).");
      }
    }
    if (s.chk_medical_rounding) {
      lines.push("- Patient added to ALERT medical rounding list for further review.");
    }
    if (sum) {
      sum.classList.add("script-updating");
      sum.value = lines.join("\n");
      sum.classList.remove("script-updating");
      const badge = $("manual_edit_badge");
      if (badge) badge.style.display = "none";
    }
  }

  // src/js/main.js
  function initialize() {
    updateLastSaved();
    document.querySelectorAll(".quick-select, .select-btn, .detail-toggle, .accordion, .trend-btn").forEach((btn) => {
      btn.setAttribute("tabindex", "-1");
    });
    document.addEventListener("focusin", (e) => {
      if (e.target && e.target.tagName && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
        const footer = document.querySelector("footer");
        if (footer) {
          const rect = e.target.getBoundingClientRect();
          const footerRect = footer.getBoundingClientRect();
          if (rect.bottom > footerRect.top - 20) {
            window.scrollBy({
              top: rect.bottom - footerRect.top + 40,
              behavior: "smooth"
            });
          }
        }
      }
    });
    const compute = debounce(() => {
      computeAll();
      checkBloodRanges();
      saveState(true);
    }, 350);
    window.addDevice = (type, val, insertionDate = "") => {
      createDeviceEntry(type, val, insertionDate);
      compute();
    };
    window.compute = compute;
    window.showQuickReviewPrompt = showQuickReviewPrompt;
    window.previousCategoryData = previousCategoryData;
    function triggerGenerate() {
      const summaryEl = $("summary");
      const actions = $("summary_actions");
      syncComorbsToPMH();
      computeAll();
      summaryEl.value = "";
      generateSummary(
        window._lastState || getState(),
        window._lastCat || { id: "green", text: "CAT 3" },
        window._lastWardTime || "",
        window._lastRed || [],
        window._lastAmber || [],
        window._lastSuppressed || [],
        window._lastActiveComorbsKeys || []
      );
      summaryEl.style.height = "auto";
      summaryEl.style.height = summaryEl.scrollHeight + "px";
      if (actions) actions.style.display = "block";
      const btn = $("btn_generate_summary");
      if (btn) btn.innerHTML = '\u{1F504} Click again to regenerate DMR summary <span style="font-size:0.9em; font-weight:normal; opacity:0.9;">(will overwrite any manual edits)</span>';
      saveState(true);
    }
    $("btn_generate_summary")?.addEventListener("click", triggerGenerate);
    const summaryInputEl = $("summary");
    if (summaryInputEl) {
      summaryInputEl.addEventListener("input", () => {
        if (!summaryInputEl.classList.contains("script-updating")) {
          const badge = $("manual_edit_badge");
          if (badge) badge.style.display = "block";
        }
      });
    }
    const btnYes = $("btn_discharge_yes");
    if (btnYes) {
      btnYes.addEventListener("click", (e) => {
        e.preventDefault();
        const catScoreText = $("catText")?.textContent || "";
        if (catScoreText.includes("CAT 3") || catScoreText.includes("Green")) {
          const modal = $("greenDischargeConfirmModal");
          if (modal) modal.style.display = "flex";
          return;
        }
        const chk = $("chk_discharge_alert");
        if (chk) {
          chk.checked = true;
          compute();
          showToast("Patient marked for discharge", 1500);
        }
      });
    }
    const btnConfirmGreenYes = $("btn_green_confirm_yes");
    if (btnConfirmGreenYes) {
      btnConfirmGreenYes.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = $("greenDischargeConfirmModal");
        if (modal) modal.style.display = "none";
        const chk = $("chk_discharge_alert");
        if (chk) {
          chk.checked = true;
          compute();
          showToast("Patient marked for discharge (criteria confirmed)", 1500);
        }
      });
    }
    const btnConfirmGreenNo = $("btn_green_confirm_no");
    if (btnConfirmGreenNo) {
      btnConfirmGreenNo.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = $("greenDischargeConfirmModal");
        if (modal) modal.style.display = "none";
      });
    }
    const btnNo = $("btn_discharge_no");
    if (btnNo) {
      btnNo.addEventListener("click", (e) => {
        e.preventDefault();
        window.dismissedDischarge = true;
        const continueChk = $("chk_continue_alert");
        if (continueChk) continueChk.checked = true;
        compute();
      });
    }
    const btnRevPlus = $("btn_review_plus");
    const btnRevMinus = $("btn_review_minus");
    const revCountEl = $("wardReviewCount");
    if (btnRevPlus && revCountEl) {
      btnRevPlus.addEventListener("click", () => {
        const cur = parseInt(revCountEl.value) || 0;
        revCountEl.value = cur + 1;
        compute();
      });
    }
    if (btnRevMinus && revCountEl) {
      btnRevMinus.addEventListener("click", () => {
        const cur = parseInt(revCountEl.value) || 0;
        revCountEl.value = Math.max(0, cur - 1);
        compute();
      });
    }
    function syncSegments(id1, id2, type) {
      const g1 = $(id1);
      const g2 = $(id2);
      if (!g1 || !g2) return;
      [g1, g2].forEach((group) => {
        group.querySelectorAll(".seg-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            setTimeout(() => {
              const val = btn.dataset.value;
              const otherGroup = group === g1 ? g2 : g1;
              otherGroup.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
              otherGroup.querySelector(`.seg-btn[data-value="${val}"]`)?.classList.add("active");
              if (val === "true") {
                if (type === "renal") showToast("Mitigation applied", 1500);
                if (type === "infection") showToast("Mitigation applied", 1500);
              }
              compute();
            }, 50);
          });
        });
      });
    }
    syncSegments("seg_renal_chronic", "seg_renal_chronic_bloods", "renal");
    syncSegments("seg_infection_downtrend", "seg_infection_downtrend_bloods", "infection");
    function setDetailToggleState(targetEl, show) {
      if (!targetEl) return;
      targetEl.style.display = show ? "block" : "none";
      const btn = document.querySelector(`.detail-toggle[data-target="${targetEl.id}"]`);
      if (btn) btn.textContent = show ? "Hide details" : "Add details";
    }
    function refreshDetailToggleState() {
      document.querySelectorAll(".detail-toggle").forEach((btn) => {
        const targetId = btn.dataset.target;
        const targetEl = $(targetId);
        if (!targetEl) return;
        const inputEl = targetEl.querySelector("textarea, input");
        const hasVal = !!(inputEl && inputEl.value && inputEl.value.trim());
        setDetailToggleState(targetEl, hasVal);
      });
    }
    document.querySelectorAll(".detail-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetEl = $(btn.dataset.target);
        if (!targetEl) return;
        const isHidden = targetEl.style.display === "none" || !targetEl.style.display;
        setDetailToggleState(targetEl, isHidden);
      });
    });
    document.addEventListener("input", (e) => {
      if (e.target && e.target.classList.contains("scraped-data")) {
        e.target.classList.remove("scraped-data");
      }
      const wrapper = e.target?.closest?.(".detail-wrapper");
      if (wrapper && wrapper.id) {
        setDetailToggleState(wrapper, true);
      }
    });
    const timeBox = $("reviewTime");
    if (timeBox && !timeBox.value) {
      const now = /* @__PURE__ */ new Date();
      const m = now.getMinutes();
      const rounded = Math.round(m / 15) * 15;
      now.setMinutes(rounded);
      timeBox.value = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    function syncInputs(id1, id2) {
      const el1 = $(id1), el2 = $(id2);
      if (!el1 || !el2) return;
      el1.addEventListener("input", () => {
        el2.value = el1.value;
        compute();
      });
      el2.addEventListener("input", () => {
        el1.value = el2.value;
        compute();
      });
    }
    syncInputs("adds", "atoe_adds");
    syncInputs("lactate", "bl_lac_review");
    syncInputs("hb", "bl_hb");
    syncInputs("wcc", "bl_wcc");
    syncInputs("crp", "bl_crp");
    syncInputs("neut", "bl_neut");
    syncInputs("lymph", "bl_lymph");
    const rrInput = $("b_rr");
    if (rrInput) {
      rrInput.addEventListener("input", debounce(() => {
        const val = parseFloat(rrInput.value);
        if (!isNaN(val) && val > 20) {
          const respSeg = $("seg_resp_concern");
          const respYes = respSeg?.querySelector('.seg-btn[data-value="true"]');
          if (respYes && !respYes.classList.contains("active")) respYes.click();
          const tachSeg = $("seg_resp_tachypnea");
          const yesBtn = tachSeg?.querySelector('.seg-btn[data-value="true"]');
          if (yesBtn && !yesBtn.classList.contains("active")) {
            yesBtn.click();
            showToast("Auto-selected Resp Concern + Tachypnea (>20)", 1500);
          }
        }
      }, 500));
    }
    document.querySelectorAll('.risk-trigger[data-risk="renal"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const renalSeg = $("seg_renal");
        const yesBtn = renalSeg.querySelector('.seg-btn[data-value="true"]');
        if (yesBtn && !yesBtn.classList.contains("active")) yesBtn.click();
        const btnVal = btn.dataset.value;
        if ((btnVal === "Oliguric" || btnVal.includes("<0.5")) && $("toggle_renal_oliguria").dataset.value === "false") $("toggle_renal_oliguria").click();
        if (btnVal === "Anuric" && $("toggle_renal_anuria").dataset.value === "false") $("toggle_renal_anuria").click();
        if (btnVal === "Dialysis" && $("toggle_renal_dialysis").dataset.value === "false") $("toggle_renal_dialysis").click();
      });
    });
    const tempInput = $("e_temp");
    if (tempInput) {
      tempInput.addEventListener("input", debounce(() => {
        const t = parseFloat(tempInput.value);
        if (!isNaN(t) && t > 38) {
          const infSeg = $("seg_infection");
          const yesBtn = infSeg.querySelector('.seg-btn[data-value="true"]');
          if (yesBtn && !yesBtn.classList.contains("active")) yesBtn.click();
        }
      }, 600));
    }
    const neuroInput = $("d_alert");
    if (neuroInput) {
      neuroInput.addEventListener("input", debounce((e) => {
        const val = e.target.value.toLowerCase();
        const keywords = ["confus", "drows", "agitat", "delirium", "somnolent", "gcs 14", "gcs 13", "gcs 12", "gcs 11", "gcs 10", "gcs 9", "gcs 8"];
        const isGcsLow = (val.match(/gcs\\s*(\\d+)/i)?.[1] || 15) < 15;
        if (keywords.some((k) => val.includes(k)) || isGcsLow) {
          const neuroSeg = $("seg_neuro_gate");
          const yesBtn = neuroSeg.querySelector('.seg-btn[data-value="true"]');
          if (yesBtn && !yesBtn.classList.contains("active")) yesBtn.click();
        }
      }, 800));
    }
    const coughInput = $("b_cough");
    if (coughInput) {
      coughInput.addEventListener("input", debounce(() => {
        const val = coughInput.value.toLowerCase();
        if (val.includes("weak") || val.includes("poor") || val.includes("ineffective")) {
          const respSeg = $("seg_resp_concern");
          const respYes = respSeg?.querySelector('.seg-btn[data-value="true"]');
          if (respYes && !respYes.classList.contains("active")) respYes.click();
          const seg = $("seg_resp_poor_cough");
          const yesBtn = seg?.querySelector('.seg-btn[data-value="true"]');
          if (yesBtn && !yesBtn.classList.contains("active")) {
            yesBtn.click();
            showToast("Auto-selected Resp Concern + Poor Cough (B)", 1500);
          }
        }
      }, 600));
    }
    const poorCoughSeg = $("seg_resp_poor_cough");
    if (poorCoughSeg) {
      poorCoughSeg.querySelectorAll(".seg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const coughEl = $("b_cough");
          if (coughEl && !coughEl.value && btn.dataset.value === "true") {
            coughEl.value = "Weak";
            coughEl.dispatchEvent(new Event("input"));
          }
        });
      });
    }
    const uopInput = $("e_uop");
    if (uopInput) {
      uopInput.addEventListener("input", debounce(() => {
        const val = uopInput.value.toLowerCase();
        if (val.includes("oligur") || val.includes("<0.5") || val.includes("low") || val.includes("decreas")) {
          const renalSeg = $("seg_renal");
          const yesBtn = renalSeg?.querySelector('.seg-btn[data-value="true"]');
          if (yesBtn && !yesBtn.classList.contains("active")) {
            yesBtn.click();
            showToast("Auto-selected Renal Concern (UOP)", 1500);
          }
          const oliguToggle = $("toggle_renal_oliguria");
          if (oliguToggle && oliguToggle.dataset.value === "false") oliguToggle.click();
        }
      }, 600));
    }
    const oliguToggleEl = $("toggle_renal_oliguria");
    if (oliguToggleEl) {
      oliguToggleEl.addEventListener("click", () => {
        setTimeout(() => {
          const uopEl = $("e_uop");
          if (uopEl && !uopEl.value.trim() && oliguToggleEl.dataset.value === "true") {
            uopEl.value = "Oliguric (<0.5ml/kg)";
            uopEl.dispatchEvent(new Event("input"));
          }
        }, 50);
      });
    }
    const anuriaToggleEl = $("toggle_renal_anuria");
    if (anuriaToggleEl) {
      anuriaToggleEl.addEventListener("click", () => {
        setTimeout(() => {
          const uopEl = $("e_uop");
          if (uopEl && !uopEl.value.trim() && anuriaToggleEl.dataset.value === "true") {
            uopEl.value = "Anuric";
            uopEl.dispatchEvent(new Event("input"));
          }
        }, 50);
      });
    }
    document.querySelectorAll(".nav-item").forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          const targetId = href.substring(1);
          const targetEl = document.getElementById(targetId);
          if (targetEl && targetEl.classList.contains("accordion-wrapper")) {
            const panel = targetEl.querySelector(".panel");
            if (panel && panel.style.display !== "block") {
              panel.style.display = "block";
              targetEl.querySelector(".icon").textContent = "[-]";
            }
          }
        }
      });
    });
    const weightInput = $("ptWeight");
    if (weightInput) {
      weightInput.addEventListener("input", () => {
        const w = parseFloat(weightInput.value);
        const targetEl = $("target_uop_display");
        if (w && !isNaN(w)) {
          const target = (w * 0.5).toFixed(1);
          targetEl.textContent = `Target: >${target} ml/hr`;
          targetEl.style.display = "block";
        } else {
          targetEl.style.display = "none";
        }
      });
    }
    document.querySelectorAll(".time-set-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const time = btn.dataset.time;
        const input = $("pressor_ceased_time");
        if (input) {
          input.value = time;
          input.dispatchEvent(new Event("input"));
        }
      });
    });
    $("pressor_ceased_time")?.addEventListener("input", compute);
    $("pressor_recent_other_note")?.addEventListener("input", compute);
    $("pressor_current_other_note")?.addEventListener("input", compute);
    const fluidInput = $("e_fluid");
    const oedemaToggle = $("toggle_renal_oedema");
    const dehydratedToggle = $("toggle_renal_dehydrated");
    if (fluidInput && oedemaToggle && dehydratedToggle) {
      fluidInput.addEventListener("input", () => {
        const val = fluidInput.value.toLowerCase();
        if (val.includes("oedema") && oedemaToggle.dataset.value === "false") {
          oedemaToggle.click();
        } else if (!val.includes("oedema") && oedemaToggle.dataset.value === "true") {
          oedemaToggle.click();
        }
        if (val.includes("dehydrated") && dehydratedToggle.dataset.value === "false") {
          dehydratedToggle.click();
        } else if (!val.includes("dehydrated") && dehydratedToggle.dataset.value === "true") {
          dehydratedToggle.click();
        }
      });
      [oedemaToggle, dehydratedToggle].forEach((toggle) => {
        toggle.addEventListener("click", () => {
          setTimeout(() => {
            const oedema = oedemaToggle.dataset.value === "true";
            const dehydrated = dehydratedToggle.dataset.value === "true";
            if (oedema && dehydrated) {
              fluidInput.value = "Oedema + Dehydrated";
            } else if (oedema) {
              fluidInput.value = "Oedema";
            } else if (dehydrated) {
              fluidInput.value = "Dehydrated";
            } else {
              fluidInput.value = "Euvolaemic";
            }
            fluidInput.dispatchEvent(new Event("input"));
          }, 50);
        });
      });
    }
    document.querySelectorAll(".quick-select").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (btn.classList.contains("risk-trigger") || btn.classList.contains("safe-trigger")) {
          const targetId2 = btn.dataset.target;
          const target = $(targetId2);
          if (target) {
            if (btn.dataset.stack === "true") {
              const current = target.value;
              if (!current.includes(btn.dataset.value)) target.value = current ? `${current}, ${btn.dataset.value}` : btn.dataset.value;
            } else {
              target.value = btn.dataset.value;
            }
            target.dispatchEvent(new Event("input"));
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
            } else {
              target.value = val;
            }
            target.dispatchEvent(new Event("input"));
            if (targetId === "lactate_trend") {
              document.querySelectorAll('.quick-select[data-target="lactate_trend"]').forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");
            }
            if (targetId === "dyspneaConcern") {
              document.querySelectorAll('.quick-select[data-target="dyspneaConcern"]').forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");
            }
            if (btn.id === "btn_fluid_restrict") {
              const frWrapper = $("fluid_restriction_wrapper");
              if (frWrapper) {
                frWrapper.style.display = target.value.includes("Fluid Restriction") ? "block" : "none";
              }
            }
            compute();
          }
        } else if (btn.id === "btn_bo" || btn.id === "btn_bno") {
          const other = btn.id === "btn_bno" ? $("btn_bo") : $("btn_bno");
          const isActive = btn.classList.contains("active");
          if (isActive) {
            btn.classList.remove("active");
            toggleBowelDate(null);
          } else {
            btn.classList.add("active");
            other.classList.remove("active");
            toggleBowelDate(btn.id);
          }
          compute();
        }
      });
    });
    function setDateInput(id, offsetDays) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() + offsetDays);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const val = `${year}-${month}-${day}`;
      const el = $(id);
      if (el) {
        el.value = val;
        el.dispatchEvent(new Event("input"));
        compute();
      }
    }
    $("btn_stepdown_today")?.addEventListener("click", () => setDateInput("stepdownDate", 0));
    $("btn_stepdown_yesterday")?.addEventListener("click", () => setDateInput("stepdownDate", -1));
    $("btn_bowel_today")?.addEventListener("click", () => setDateInput("bowel_date", 0));
    $("btn_bowel_yesterday")?.addEventListener("click", () => setDateInput("bowel_date", -1));
    document.querySelectorAll(".segmented-group").forEach((group) => {
      group.querySelectorAll(".seg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const val = btn.dataset.value;
          const id = group.id.replace("seg_", "");
          const wasActive = btn.classList.contains("active");
          group.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
          if (wasActive) {
            handleSegmentClick(id, null);
          } else {
            btn.classList.add("active");
            handleSegmentClick(id, val);
          }
          saveState(true);
          computeAll();
          checkBloodRanges();
        });
      });
    });
    document.querySelectorAll(".toggle-label").forEach((el) => {
      if ([
        "toggle_resp_tachypnea",
        "toggle_resp_rapid_wean",
        "toggle_resp_poor_cough",
        "toggle_resp_poor_swallow"
      ].includes(el.id)) return;
      el.addEventListener("click", () => {
        const isOn = el.dataset.value === "true";
        el.dataset.value = isOn ? "false" : "true";
        el.classList.toggle("active", !isOn);
        if (el.id === "toggle_comorb_other") $("comorb_other_note_wrapper").style.display = !isOn ? "block" : "none";
        if (el.id === "toggle_pressor_recent_other") $("pressor_recent_other_note_wrapper").style.display = !isOn ? "block" : "none";
        if (el.id === "toggle_pressor_current_other") $("pressor_current_other_note_wrapper").style.display = !isOn ? "block" : "none";
        if (el.id === "toggle_renal_dialysis") {
          $("dialysis_type_wrapper").style.display = !isOn ? "block" : "none";
        }
        if (el.id === "toggle_renal_dialysis") {
          const comorb = $("toggle_comorb_dialysis");
          if (comorb && comorb.dataset.value !== el.dataset.value) {
            comorb.click();
          }
        }
        if (el.id === "toggle_comorb_dialysis") {
          const renal = $("toggle_renal_dialysis");
          if (renal && renal.dataset.value !== el.dataset.value) {
            renal.click();
          }
        }
        if (el.id.startsWith("toggle_comorb_")) {
          syncComorbsToPMH();
        }
        saveState(true);
        computeAll();
        checkBloodRanges();
      });
    });
    document.querySelectorAll(".button-group").forEach((group) => {
      group.querySelectorAll(".select-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          group.querySelectorAll(".select-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          if (group.id === "oxMod") {
            const devEl = $("b_device");
            if (devEl) devEl.dataset.manual = "false";
            toggleOxyFields();
          }
          if (group.id === "neuroType") $("neuro_gate_content").style.display = "block";
          saveState(true);
          computeAll();
          checkBloodRanges();
        });
      });
    });
    staticInputs.forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener("input", compute);
    });
    $("bowel_date")?.addEventListener("change", compute);
    $("stepdownDate")?.addEventListener("change", compute);
    $("chk_use_mods")?.addEventListener("change", () => {
      $("mods_inputs").style.display = $("chk_use_mods").checked ? "block" : "none";
      compute();
    });
    $("chk_aperients")?.addEventListener("change", compute);
    $("chk_unknown_blo_date")?.addEventListener("change", () => {
      handleUnknownBLODate();
      compute();
    });
    $("comorb_other_note")?.addEventListener("input", compute);
    $("comorb_other_note")?.addEventListener("blur", () => {
      const toggle = $("toggle_comorb_other");
      if (toggle && toggle.dataset.value === "true") syncComorbsToPMH();
    });
    $("chk_discharge_alert")?.addEventListener("change", () => {
      const dischargeChk = $("chk_discharge_alert");
      const continueChk = $("chk_continue_alert");
      if (dischargeChk && dischargeChk.checked) {
        const catScoreText = $("catText")?.textContent || "";
        if (catScoreText.includes("CAT 3") || catScoreText.includes("Green")) {
          dischargeChk.checked = false;
          const modal = $("greenDischargeConfirmModal");
          if (modal) modal.style.display = "flex";
          return;
        }
        if (continueChk) {
          continueChk.checked = false;
        }
      }
      compute();
    });
    $("chk_continue_alert")?.addEventListener("change", () => {
      const continueChk = $("chk_continue_alert");
      const dischargeChk = $("chk_discharge_alert");
      const disPrompt = $("discharge_prompt");
      if (continueChk && continueChk.checked) {
        if (dischargeChk) dischargeChk.checked = false;
        if (disPrompt && disPrompt.style.display !== "none") {
          window.dismissedDischarge = true;
        }
      }
      compute();
    });
    $("chk_medical_rounding")?.addEventListener("change", () => {
      const preCheckbox = $("chk_medical_rounding_pre");
      if (preCheckbox) preCheckbox.checked = $("chk_medical_rounding").checked;
      compute();
    });
    $("chk_medical_rounding_pre")?.addEventListener("change", () => {
      const mainCheckbox = $("chk_medical_rounding");
      if (mainCheckbox) mainCheckbox.checked = $("chk_medical_rounding_pre").checked;
      compute();
    });
    document.querySelectorAll('input[name="reviewType"]').forEach((r) => r.addEventListener("change", () => {
      updateWardOptions();
      toggleInfusionsBox();
      updateReviewTypeVisibility();
      compute();
    }));
    $("ptWard")?.addEventListener("change", () => {
      updateWardOtherVisibility();
      compute();
    });
    $("clearDataBtnTop")?.addEventListener("click", () => showClearDataModal());
    $("footerClear")?.addEventListener("click", () => showClearDataModal());
    $("closeClearModal")?.addEventListener("click", hideClearDataModal);
    $("confirmClearData")?.addEventListener("click", () => {
      hideClearDataModal();
      clearData();
    });
    $("btnQuickCopySummary")?.addEventListener("click", () => {
      const text = $("summary").value;
      if (!text) {
        showToast("Summary is empty", 1500);
        return;
      }
      navigator.clipboard.writeText(text).then(() => showToast("\u2713 Copied to clipboard", 1500));
    });
    $("btnQuickReview")?.addEventListener("click", enableQuickReviewMode);
    $("btnFullReview")?.addEventListener("click", () => {
      const prompt = $("quickReviewPrompt");
      if (prompt) prompt.style.display = "none";
    });
    $("btnExitQuickReview")?.addEventListener("click", exitQuickReviewMode);
    $("floatingNavBtn")?.addEventListener("click", openMobileNav);
    $("closeMobileNav")?.addEventListener("click", closeMobileNav);
    $("mobileNavOverlay")?.addEventListener("click", (e) => {
      if (e.target.id === "mobileNavOverlay") closeMobileNav();
    });
    document.querySelectorAll(".mobile-nav-link").forEach((link) => {
      link.addEventListener("click", closeMobileNav);
    });
    $("footerCopy")?.addEventListener("click", () => {
      const text = $("summary").value;
      if (!text) {
        showToast("Nothing to copy", 1500);
        return;
      }
      navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard", 1500));
    });
    $("btnCopySummaryMain")?.addEventListener("click", () => {
      const text = $("summary").value;
      if (!text) {
        showToast("Nothing to copy", 1500);
        return;
      }
      navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard", 1500));
    });
    $("btnUseSameBloods")?.addEventListener("click", () => {
      const blMap = {
        "lac_review": "bl_lac_review",
        "hb": "bl_hb",
        "wcc": "bl_wcc",
        "cr_review": "bl_cr_review",
        "k": "bl_k",
        "na": "bl_na",
        "mg": "bl_mg",
        "phos": "bl_phos",
        "plts": "bl_plts",
        "alb": "bl_alb",
        "neut": "bl_neut",
        "lymph": "bl_lymph",
        "crp": "bl_crp",
        "bili": "bl_bili",
        "alt": "bl_alt",
        "inr": "bl_inr",
        "aptt": "bl_aptt"
      };
      if (window.prevBloods) {
        let count = 0;
        Object.keys(window.prevBloods).forEach((key) => {
          const targetId = blMap[key];
          const val = window.prevBloods[key];
          if (targetId && val && $(targetId)) {
            $(targetId).value = val;
            $(targetId).classList.add("scraped-data");
            count++;
          }
        });
        if (count > 0) {
          const ev = new Event("input");
          Object.values(blMap).forEach((id) => $(id)?.dispatchEvent(ev));
          showToast(`Filled ${count} fields`, 1500);
        } else {
          showToast("No previous bloods found", 1500);
        }
      }
    });
    $("btnClearCurrentBloods")?.addEventListener("click", () => {
      const bloodFields = [
        "bl_lac_review",
        "bl_hb",
        "bl_wcc",
        "bl_crp",
        "bl_cr_review",
        "bl_egfr",
        "bl_k",
        "bl_na",
        "bl_mg",
        "bl_phos",
        "bl_plts",
        "bl_alb",
        "bl_neut",
        "bl_lymph",
        "bl_bili",
        "bl_alt",
        "bl_inr",
        "bl_aptt"
      ];
      let count = 0;
      bloodFields.forEach((id) => {
        const field = $(id);
        if (field && field.value) {
          field.value = "";
          field.classList.remove("scraped-data");
          count++;
        }
      });
      document.querySelectorAll(".trend-buttons .trend-btn.active").forEach((btn) => {
        btn.classList.remove("active");
      });
      if (count > 0) {
        compute();
        showToast(`Cleared ${count} blood result${count > 1 ? "s" : ""}`, 1500);
      } else {
        showToast("No blood results to clear", 1500);
      }
    });
    $("btnClearPreviousBloods")?.addEventListener("click", () => {
      const prevLabels = [
        "prev_bl_lac_review",
        "prev_bl_hb",
        "prev_bl_wcc",
        "prev_bl_crp",
        "prev_bl_cr_review",
        "prev_bl_egfr",
        "prev_bl_k",
        "prev_bl_na",
        "prev_bl_mg",
        "prev_bl_phos",
        "prev_bl_plts",
        "prev_bl_alb",
        "prev_bl_neut",
        "prev_bl_lymph",
        "prev_bl_bili",
        "prev_bl_alt",
        "prev_bl_inr",
        "prev_bl_aptt"
      ];
      let count = 0;
      prevLabels.forEach((id) => {
        const label = $(id);
        if (label && label.textContent.trim()) {
          label.textContent = "";
          count++;
        }
      });
      window.prevBloods = {};
      if (count > 0) {
        compute();
        showToast(`Cleared ${count} previous blood result${count > 1 ? "s" : ""}`, 1500);
      } else {
        showToast("No previous blood results to clear", 1500);
      }
    });
    document.querySelectorAll(".trend-buttons").forEach((group) => {
      ["\u2191", "\u2193", "\u2192"].forEach((t) => {
        const btn = document.createElement("button");
        btn.className = "trend-btn";
        btn.textContent = t;
        btn.dataset.value = t;
        btn.setAttribute("tabindex", "-1");
        btn.addEventListener("click", () => {
          const was = btn.classList.contains("active");
          group.querySelectorAll(".trend-btn").forEach((b) => b.classList.remove("active"));
          if (!was) btn.classList.add("active");
          compute();
        });
        group.appendChild(btn);
      });
    });
    document.querySelectorAll(".accordion-wrapper").forEach((w) => {
      w.querySelector(".accordion").addEventListener("click", () => {
        const panel = w.querySelector(".panel");
        const isOpen = panel.style.display === "block";
        panel.style.display = isOpen ? "none" : "block";
        w.querySelector(".icon").textContent = isOpen ? "[+]" : "[-]";
        const map = JSON.parse(localStorage.getItem(ACCORDION_KEY) || "{}");
        map[w.dataset.accordionId] = !isOpen;
        localStorage.setItem(ACCORDION_KEY, JSON.stringify(map));
      });
    });
    document.querySelectorAll(".btn[data-device-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        createDeviceEntry(btn.dataset.deviceType);
        updateDevicesSectionVisibility();
        computeAll();
      });
    });
    ["red", "amber"].forEach((t) => {
      const btn = $(`override_${t}`);
      if (btn) btn.addEventListener("click", () => {
        const isActive = btn.classList.contains("active");
        if (isActive) {
          $("override").value = "none";
          $("override_reason_box").style.display = "none";
          $("override_amber").classList.remove("active");
          $("override_red").classList.remove("active");
        } else {
          $("override").value = t;
          $("override_reason_box").style.display = "block";
          $("override_amber").classList.toggle("active", t === "amber");
          $("override_red").classList.toggle("active", t === "red");
        }
        compute();
      });
    });
    updateWardOptions();
    const journeyDataRaw = sessionStorage.getItem("alert_form_data");
    if (journeyDataRaw) {
      try {
        const parsed = JSON.parse(journeyDataRaw);
        restoreState(parsed);
        sessionStorage.removeItem("alert_form_data");
      } catch (e) {
        console.error(e);
      }
    } else {
      const saved = loadState();
      if (saved) restoreState(saved);
    }
    refreshDetailToggleState();
    updateReviewTypeVisibility();
    const accMap = JSON.parse(sessionStorage.getItem(ACCORDION_KEY) || "{}");
    document.querySelectorAll(".accordion-wrapper").forEach((w) => {
      if (accMap[w.dataset.accordionId]) {
        w.querySelector(".panel").style.display = "block";
        w.querySelector(".icon").textContent = "[-]";
      }
    });
    compute();
    checkBloodRanges();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
