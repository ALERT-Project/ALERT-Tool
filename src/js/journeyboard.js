// ALERT Journeyboard Logic
document.addEventListener('DOMContentLoaded', () => {

    // Automatically fetch data on load
    window.fetchData = function () {
        const loadingState = document.getElementById('loadingState');
        const dashboardSection = document.getElementById('dashboardSection');

        if (loadingState) loadingState.classList.remove('hidden');
        if (dashboardSection) dashboardSection.classList.add('hidden');

        const fallbackCSV = `PatientName,URN,Age,Weight,Location,Room,ICUAdmissionReason,StepdownDate,StepdownTime,RR,SpO2,O2Device,O2Flow,SBP,DBP,HR,Temp,Consciousness,GOC,Allergies,Lac,Hb,Cr,K,WCC,CRP,Mg
Christopher Roberts,123456,65,80,3A,12,Pneumonia,2026-03-06,Afternoon,,,,,,,,,,Full,Penicillin,1.2,115,85,3.5,8.5,12,0.8
Donna Ramirez,789012,45,65,4B,05,DKA,2026-03-06,Morning,,,,,,,,,,Full,None,0.9,130,70,5.2,6.2,5,0.6
William Thomas,345678,72,90,5C,18,Sepsis,2026-03-07,Evening,,,,,,,,,,Ward Med Tx,Sulfa,4.2,95,145,5.2,26.4,185,1.1
Kenneth Ramirez,901234,30,55,3A,14,Trauma,2026-03-06,Morning,,,,,,,,,,Full,None,1.5,105,65,3.9,9.2,22,0.6
Nancy Walker,567890,80,75,ICU,02,Post-op CABG,2026-03-07,,18,95,NP,1,140,85,90,37.5,Alert,Full,Morphine,1.1,110,120,3.3,11.0,45,0.8
Karen Garcia,112233,55,68,ICU,08,Septic Shock,2026-03-08,,32,88,HFNP,50,85,45,135,39.2,Voice,ICU Tx,None,5.8,82,190,5.5,32.0,240,1.0
Paul Rivera,445566,42,85,ICU,04,Overdose,2026-03-06,,12,98,RA,,110,70,60,36.5,Alert,Full,None,0.8,145,80,5.7,7.5,8,0.7
Kimberly Smith,223344,28,60,3B,10,Asthma,2026-03-06,Morning,,,,,,,,,,Full,Latex,1.0,125,75,5.1,8.0,15,1.2
Dorothy White,556677,75,82,4A,22,Post-op Hernia,2026-03-08,Afternoon,,,,,,,,,,Full,None,1.4,118,95,4.8,10.5,30,0.7
Donna King,889900,60,78,5B,15,GI Bleed,2026-03-08,Night,,,,,,,,,,Full,Aspirin,2.5,68,110,4.4,14.2,55,1.1
Kimberly Lopez,334455,35,62,3C,08,Anaphylaxis,2026-03-07,Evening,,,,,,,,,,Full,Peanuts,1.2,122,70,3.7,7.8,10,0.6
Margaret Jones,667788,52,74,4C,04,Cellulitis,2026-03-06,Morning,,,,,,,,,,Full,None,1.8,128,85,4.2,18.5,120,1.1
Michelle Mitchell,990011,48,68,5A,11,Pancreatitis,2026-03-08,Evening,,,,,,,,,,Full,Codeine,3.1,112,130,4.3,22.0,195,0.8
Brian Garcia,112244,54,88,3A,16,COPD Exac,2026-03-08,Afternoon,,,,,,,,,,DNR/DNI,None,1.6,135,90,4.0,9.5,40,1.2
Lisa Martin,445577,24,58,4B,09,Seizure,2026-03-06,Morning,,,,,,,,,,Full,None,1.1,118,72,3.4,6.5,12,0.6
Michelle Thomas,778899,62,85,5C,20,Post-op Knee,2026-03-06,Night,,,,,,,,,,Full,None,1.3,108,105,3.1,12.5,65,0.9
Susan Wright,001122,38,64,3B,12,Appendicitis,2026-03-07,Morning,,,,,,,,,,Full,None,0.9,132,78,4.7,9.2,25,0.6
Jessica Williams,223355,44,76,4A,06,Pneumonia,2026-03-06,Evening,,,,,,,,,,Full,Penicillin,2.2,105,115,4.9,15.8,85,0.8
Anthony Allen,556688,32,56,5B,14,OD - intentional,2026-03-07,Afternoon,,,,,,,,,,Full,None,0.7,126,68,5.5,5.2,8,0.9
William Lopez,889911,40,70,3C,02,Endocarditis,2026-03-06,Morning,,,,,,,,,,Full,None,2.8,110,135,4.7,28.2,210,0.7
Kimberly Martin,112255,22,54,4C,18,Anorexia,2026-03-06,Night,,,,,,,,,,Full,None,1.5,92,62,4.6,4.8,15,0.6
Anthony Walker,445588,46,84,5A,07,Post-op Bowel,2026-03-06,Morning,,,,,,,,,,Full,None,1.9,102,125,4.2,16.5,110,0.9
Barbara Smith,778800,28,72,3A,24,Spider Bite,2026-03-08,Evening,,,,,,,,,,Full,None,4.5,118,90,4.1,14.5,95,0.5
Brian Sanchez,001133,58,80,4B,15,MI - Stented,2026-03-06,Afternoon,,,,,,,,,,Full,None,1.4,124,110,5.8,10.2,35,1.1
Patricia Flores,223366,30,58,5C,03,Viral Myocarditis,2026-03-06,Morning,,,,,,,,,,Full,None,3.2,98,95,5.7,8.8,125,0.8
Carol Gonzalez,556699,95,78,3B,01,Old Age/Failure,2026-03-07,Night,,,,,,,,,,End of Life,None,2.4,105,180,3.4,12.2,50,0.7
Mary Garcia,889922,50,82,4A,10,Arrhythmia,2026-03-07,Morning,,,,,,,,,,Full,None,1.1,138,105,5.7,7.5,12,0.7
Michelle Lewis,112266,34,66,5B,12,Post-op Thyroid,2026-03-06,Evening,,,,,,,,,,Full,None,0.8,122,88,4.8,9.0,18,1.1
Elizabeth Roberts,445599,68,90,3C,05,Encephalitis,2026-03-06,Afternoon,,,,,,,,,,Full,None,2.1,114,155,5.6,18.8,145,0.7
Patricia Torres,778811,32,60,4C,22,Post-op Neurosurg,2026-03-07,Morning,,,,,,,,,,Full,None,1.3,126,92,4.8,10.5,32,0.7
Ronald Anderson,001144,26,75,5A,16,Accidental OD,2026-03-06,Night,,,,,,,,,,Full,None,1.6,132,84,4.9,11.2,28,0.9
Michelle Rodriguez,223377,24,55,3A,09,Hypothermia,2026-03-08,Morning,,,,,,,,,,Full,None,3.5,108,125,3.3,13.5,88,0.8
Jessica Miller,556600,42,68,4B,04,Post-op Lung,2026-03-08,Evening,,,,,,,,,,Full,None,1.2,118,102,5.8,14.8,75,1.1
Jessica Walker,889933,45,85,5C,19,Alcohol WD,2026-03-06,Afternoon,,,,,,,,,,Full,None,1.8,135,95,5.0,9.5,42,0.9
David Brown,112277,26,52,3B,11,Overdose,2026-03-08,Morning,,,,,,,,,,Full,None,1.0,112,75,3.7,8.2,15,1.2
Margaret Nelson,445600,44,78,4A,08,Post-op Skin,2026-03-08,Night,,,,,,,,,,Full,None,0.9,128,82,5.3,7.2,10,0.5
Lisa Nguyen,778822,48,88,5B,25,GI Bleed,2026-03-06,Morning,,,,,,,,,,Full,None,2.6,65,118,4.1,15.2,68,1.1
Andrew Smith,001155,14,45,3C,01,Seizure,2026-03-07,Evening,,,,,,,,,,Full,None,0.8,115,62,5.2,6.8,12,1.0
Linda Wright,223388,45,74,4C,14,Aspiration Pneumonia,2026-03-07,Afternoon,,,,,,,,,,Full,None,2.9,102,145,3.9,28.5,220,0.7
Jennifer Lewis,556611,55,80,5A,03,Post-op Whipple,2026-03-06,Morning,,,,,,,,,,Full,None,1.7,110,165,3.7,14.2,115,0.5
Timothy Taylor,889944,42,120,3A,17,Bariatric Surgery,2026-03-08,Night,,,,,,,,,,Full,None,1.4,142,105,5.8,12.5,45,0.9
Timothy Thomas,112288,70,82,4B,20,Trauma (Fall),2026-03-06,Morning,,,,,,,,,,Full,None,1.5,108,135,5.7,18.8,135,0.7
Sandra Nguyen,445611,35,76,5C,02,Drug Overdose,2026-03-06,Evening,,,,,,,,,,Full,None,1.1,122,88,4.5,7.5,10,0.7
Melissa Roberts,778833,22,58,3B,14,Trauma (Laceration),2026-03-08,Afternoon,,,,,,,,,,Full,None,1.9,105,92,5.0,12.8,48,0.7
Ashley Moore,001166,25,72,4A,05,Hand Surgery,2026-03-07,Morning,,,,,,,,,,Full,None,1.0,132,74,5.6,5.5,5,1.0
Elizabeth Thomas,223399,40,65,5B,08,Surgical Complication,2026-03-07,Night,,,,,,,,,,Full,None,2.3,115,142,5.6,22.4,182,0.7
Nancy Hill,556622,50,88,3C,22,Post-op Spine,2026-03-06,Morning,,,,,,,,,,Full,None,1.2,126,115,4.4,9.2,25,0.7
Richard Allen,889955,38,62,4C,10,Stress-induced Syncope,2026-03-07,Evening,,,,,,,,,,Full,None,0.7,118,68,4.6,6.2,10,0.7
Paul Green,112299,44,92,5A,14,Seizure Disorder,2026-03-07,Afternoon,,,,,,,,,,Full,None,1.6,138,98,4.7,11.5,35,0.6
John Roberts,445622,96,64,3A,01,General Frailty,2026-03-06,Morning,,,,,,,,,,End of Life,None,2.8,95,210,4.4,14.5,55,1.3
Kevin Thompson,778844,48,90,4B,07,Urosepsis,2026-03-07,Night,,,,,,,,,,Full,None,4.8,88,175,5.1,34.0,285,0.7
Michelle Lee,001177,40,75,5C,21,Drug Overdose,2026-03-07,Morning,,,,,,,,,,Full,None,1.4,128,82,4.0,8.5,15,0.7
Sarah Rodriguez,223400,46,82,3B,16,Alcohol Withdrawal,2026-03-07,Evening,,,,,,,,,,Full,None,2.1,105,105,4.9,10.2,42,0.8
Sarah Nguyen,556633,52,68,4A,12,Post-op Fracture Fix,2026-03-07,Afternoon,,,,,,,,,,Full,None,1.1,122,95,3.4,9.8,22,0.7
Patricia Nguyen,889966,75,85,5B,04,Myocardial Infarction,2026-03-08,Morning,,,,,,,,,,Full,None,1.5,112,125,3.1,14.2,65,0.6
Anthony Lewis,112300,52,72,3C,11,Cancer/Febrile Neutropenia,2026-03-06,Night,,,,,,,,,,Full,None,3.4,92,148,3.5,24.5,195,0.9
Jennifer Martin,445633,35,70,4C,08,Trauma,2026-03-06,Morning,,,,,,,,,,Full,None,1.2,115,88,4.3,10.5,30,0.6
Richard Rivera,778855,90,15,5A,01,End Stage Frailty,2026-03-07,Evening,,,,,,,,,,End of Life,None,1.0,150,55,4.8,1.2,1,0.9
Thomas Martin,001188,42,88,3A,42,Urosepsis,2026-03-06,Afternoon,,,,,,,,,,Full,None,4.1,72,210,5.5,42.0,320,0.9
Daniel Scott,223411,17,65,4B,07,Laceration Fix,2026-03-06,Morning,,,,,,,,,,Full,None,1.8,110,88,3.6,12.5,50,0.6
Joshua Taylor,556644,17,60,5C,08,Dehydration,2026-03-08,Evening,,,,,,,,,,Full,None,0.9,135,75,5.3,6.5,8,0.9
Robert Adams,889977,17,70,3B,09,Post-op Fracture,2026-03-07,Afternoon,,,,,,,,,,Full,None,1.2,122,82,5.1,9.2,25,1.2`;

        function parseCSV(csvText) {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    // Small timeout to show the cool loading animation briefly
                    setTimeout(() => {
                        processData(results.data);
                        if (loadingState) loadingState.classList.add('hidden');
                        if (dashboardSection) dashboardSection.classList.remove('hidden');
                    }, 800);
                }
            });
        }

        // Try fetch first, fallback to string if file:// protocol causes error
        fetch('./dummy_patients.csv')
            .then(response => {
                if (!response.ok) throw new Error("Could not load CSV file.");
                return response.text();
            })
            .then(csvText => parseCSV(csvText))
            .catch(err => {
                console.warn("Fetch Error (likely file:// protocol). Falling back to local data.", err);
                parseCSV(fallbackCSV);
            });
    };

    // Kickoff the fetch on load
    fetchData();

    let icuPatients = [];
    let wardPatients = [];

    function processData(data) {
        let allProcessed = data.map(row => {
            const isICU = row.Location && row.Location.toLowerCase().includes('icu');
            const hasObs = row.RR || row.HR || row.SBP;

            const mappedState = mapRowToState(row);
            // If they are on the ward and don't have typical obs because they only have bloods, we set score to 0 or treat differently
            const { score: addsScore, isMet } = hasObs ? calculateAdds(row) : { score: 0, isMet: false };
            const { category, flags, isUncategorised } = determineCategory(row, addsScore, isMet, isICU, hasObs);
            const hoursOnWard = isICU ? 0 : calculateHoursOnWard(row.StepdownDate, row.StepdownTime);

            return {
                raw: row,
                state: mappedState,
                adds: addsScore,
                isMet: isMet,
                category: category,
                isUncategorised: isUncategorised,
                flags: flags,
                hoursOnWard: hoursOnWard,
                isICU: isICU,
                hasObs: hasObs
            };
        });

        icuPatients = allProcessed.filter(p => p.isICU);
        wardPatients = allProcessed.filter(p => !p.isICU);

        // Sort patients by risk
        const sortFunc = (a, b) => {
            const catA = a.category === 0 ? 99 : a.category;
            const catB = b.category === 0 ? 99 : b.category;
            if (catA !== catB) return catA - catB;
            if (b.flags.length !== a.flags.length) return b.flags.length - a.flags.length;
            // Shorter time on ward = fresher stepdown = higher priority display
            return a.hoursOnWard - b.hoursOnWard;
        };

        icuPatients.sort(sortFunc);
        wardPatients.sort(sortFunc);

        renderDashboard();
    }

    function mapRowToState(row) {
        const state = {};

        const urnStr = row.URN ? String(row.URN) : '';
        state['ptName'] = row.PatientName || '';
        state['initials'] = row.PatientName || ''; // Add for fallback compatibility
        state['ptMrn'] = urnStr.slice(-3);
        state['ptAge'] = row.Age || '';
        state['ptWeight'] = row.Weight || '';
        state['ptWard'] = row.Location || '';
        state['ptBed'] = row.Room || '';
        state['ptAdmissionReason'] = row.ICUAdmissionReason || '';
        state['stepdownDate'] = row.StepdownDate || '';
        state['goc_note'] = row.GOC || '';
        state['allergies_note'] = row.Allergies || '';
        state['b_rr'] = row.RR || '';
        state['b_spo2'] = row.SpO2 ? row.SpO2 + '%' : '';
        state['b_device'] = row.O2Device === 'NP' ? `${row.O2Flow}L NP` : (row.O2Device === 'HFNP' ? `HFNP ${row.O2Flow}%` : (row.O2Device || 'RA'));
        state['c_nibp'] = (row.SBP && row.DBP) ? `${row.SBP}/${row.DBP}` : '';
        state['c_hr'] = row.HR || '';
        state['e_temp'] = row.Temp || '';
        state['d_alert'] = row.Consciousness || '';

        // Add blood results for prepopulation
        state['bl_lac_review'] = row.Lac || '';
        state['bl_hb'] = row.Hb || '';
        state['bl_cr_review'] = row.Cr || '';
        state['bl_mg'] = row.Mg || '';
        state['bl_k'] = row.K || '';
        state['bl_wcc'] = row.WCC || '';
        state['bl_crp'] = row.CRP || '';

        return state;
    }

    function calculateAdds(row) {
        let score = 0;
        let isMet = false;

        const rr = parseFloat(row.RR);
        if (!isNaN(rr)) {
            if (rr >= 36 || rr <= 4) isMet = true; // MET Criteria

            if (rr >= 30 || rr <= 9) score += 3;
            else if (rr >= 25) score += 2;
            else if (rr >= 21) score += 1;
        }

        const spo2 = parseFloat(row.SpO2);
        if (!isNaN(spo2)) {
            if (spo2 < 85) isMet = true; // MET Criteria

            if (spo2 <= 84) score += 3;
            else if (spo2 <= 90) score += 2;
            else if (spo2 <= 93) score += 1;
        }

        const sbp = parseFloat(row.SBP);
        if (!isNaN(sbp)) {
            if (sbp <= 89) isMet = true; // MET Criteria

            if (sbp >= 200 || sbp <= 89) score += 3;
            else if (sbp >= 180 || sbp <= 99) score += 2;
            else if (sbp >= 160 || sbp <= 109) score += 1;
        }

        const hr = parseFloat(row.HR);
        if (!isNaN(hr)) {
            if (hr >= 140 || hr <= 39) isMet = true; // MET Criteria

            if (hr >= 130 || hr <= 39) score += 3;
            else if (hr >= 110) score += 2;
            else if (hr >= 100 || hr <= 49) score += 1;
        }

        if (row.Consciousness === 'U') isMet = true; // AVPU 'U' is MET

        return { score, isMet };
    }

    function determineCategory(row, adds, isMet, isICU, hasObs) {
        let flags = [];
        let category = 3; // Baseline

        if (isMet || adds >= 8) {
            category = 1;
            flags.push({ type: 'red', label: isICU ? 'Ward MET Criteria' : 'High qALERT' });
        } else if (adds >= 4) {
            category = 2;
            flags.push({ type: 'amber', label: 'Elevated qALERT' });
        }

        if (row.O2Device === 'HFNP' || row.O2Device === 'NIV') {
            category = Math.min(category, 2);
            flags.push({ type: 'amber', label: 'High O2 Support' });
        }

        if (row.ICUAdmissionReason && row.ICUAdmissionReason.toLowerCase().includes('sepsis')) {
            category = Math.min(category, 2);
            flags.push({ type: 'amber', label: 'Sepsis Admission' });
        }

        // --- K and Mg TRIGGERS ---
        const kVal = parseFloat(row.K);
        if (!isNaN(kVal)) {
            if (kVal > 5.5 || kVal < 3.0) {
                category = Math.min(category, 1);
                flags.push({ type: 'red', label: `Critical K: ${kVal}` });
            } else if (kVal > 5.2 || kVal < 3.5) {
                category = Math.min(category, 2);
                flags.push({ type: 'amber', label: `Abnormal K: ${kVal}` });
            }
        }

        const mgVal = parseFloat(row.Mg);
        if (!isNaN(mgVal)) {
            if (mgVal > 1.2 || mgVal < 0.5) {
                category = Math.min(category, 1);
                flags.push({ type: 'red', label: `Critical Mg: ${mgVal}` });
            } else if (mgVal > 1.1 || mgVal < 0.7) {
                category = Math.min(category, 2);
                flags.push({ type: 'amber', label: `Abnormal Mg: ${mgVal}` });
            }
        }

        // --- NEW LOINC/BLOOD TRIGGERS (Cat 1) ---
        const lacVal = parseFloat(row.Lac);
        if (!isNaN(lacVal) && lacVal >= 4.0) {
            category = 1;
            flags.push({ type: 'red', label: 'Critical Lactate' });
        }

        const hbVal = parseFloat(row.Hb);
        if (!isNaN(hbVal) && hbVal > 0 && hbVal < 70) {
            category = 1;
            flags.push({ type: 'red', label: 'Critical Anaemia' });
        }

        const wccVal = parseFloat(row.WCC);
        if (!isNaN(wccVal) && (wccVal > 25 || wccVal < 2)) {
            category = 1;
            flags.push({ type: 'red', label: 'Abnormal WCC' });
        }

        let isUncategorised = false;

        if (!isICU) {
            // qALERT applies pre ICU stepdown or cat 1 via bloods on ward. No one else.
            if (category !== 1) {
                category = 0; // Strip category to remove colour coding
                isUncategorised = true;
                flags.push({ type: 'muted', label: 'Data insufficient, needs ward review' });
            }
        } else {
            // ICU specific insufficient data triggers if they simply miss obs somehow
            if (!hasObs && category > 1) {
                isUncategorised = true;
                category = 0;
                flags.push({ type: 'muted', label: 'Data insufficient, needs review' });
            }
        }

        return { category, flags, isUncategorised };
    }

    function calculateHoursOnWard(dateStr, timeStr) {
        if (!dateStr || dateStr === 'Pending') return 0;
        try {
            const timeMap = { 'Morning': 9, 'Afternoon': 15, 'Evening': 18, 'Night': 21 };
            const parts = dateStr.split('-');
            if (parts.length !== 3) return 0;
            const [y, m, d] = parts;
            const hour = timeMap[timeStr] || 12;
            const stepdownDateTime = new Date(y, m - 1, d, hour);
            const now = new Date();
            const diffMs = now - stepdownDateTime;
            return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        } catch (e) { return 0; }
    }

    function renderDashboard() {
        const icuTableBody = document.getElementById('icuTableBody');
        const wardTableBody = document.getElementById('wardTableBody');
        const statTotal = document.getElementById('statTotal');

        if (!icuTableBody || !wardTableBody) return;

        // Use only ward patients for the "Total Stepped Down" stat
        if (statTotal) statTotal.textContent = wardPatients.length;

        icuTableBody.innerHTML = '';
        wardTableBody.innerHTML = '';

        const allPatients = [...icuPatients, ...wardPatients];

        function createRow(p) {
            const tr = document.createElement('tr');
            let rowClasses = [`jb-row`, `cat-${p.category}`];
            if (p.isICU && (p.isMet || p.adds >= 8)) rowClasses.push('met-alert');
            tr.className = rowClasses.join(' ');

            let flagHtml = `<div style="display: flex; flex-wrap: wrap; gap: 6px;">` + p.flags.map(f => {
                if (f.type === 'muted') return `<span style="color: var(--muted); font-weight: 500; font-size: 0.8rem; border: 1px dashed var(--border); padding: 2px 6px; border-radius: 4px;">${f.label}</span>`;
                return `<span class="flag-pill flag-${f.type}">${f.label}</span>`
            }).join('') + `</div>`;
            if (p.flags.length === 0) flagHtml = '<span style="color:var(--muted); font-size:0.85rem;">None</span>';

            const addsBadgeDisplay = p.hasObs ? `<div class="adds-badge">${p.adds}</div>` : `<div style="color: var(--muted); font-size: 0.85rem; padding-left: 4px;">Check<br>Charts</div>`;

            let qCatDisplay = `<span style="font-weight: 800; font-size: 1.1rem; color: var(--green-text);">Cat 3</span>`;
            if (p.isUncategorised || p.category === 0) {
                qCatDisplay = `<span style="font-weight: 600; font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Check Ward<br>Charts</span>`;
            } else if (p.category === 1) {
                qCatDisplay = `<span style="font-weight: 800; font-size: 1.1rem; color: var(--red-text);">Cat 1</span>`;
            } else if (p.category === 2) {
                qCatDisplay = `<span style="font-weight: 800; font-size: 1.1rem; color: var(--amber-text);">Cat 2</span>`;
            }

            const timeDisplay = p.isICU ? `<span style="color:var(--muted); font-size:0.85rem;">Pending</span>` : `<span class="time-ward">${p.hoursOnWard} hrs</span>`;

            if (p.isICU) {
                tr.innerHTML = `
                    <td style="padding-left: 1.5rem;">${qCatDisplay}</td>
                    <td>${addsBadgeDisplay}</td>
                    <td>
                        <span class="patient-name">${p.raw.PatientName}</span>
                        <span class="patient-urn">URN: ...${p.raw.URN ? String(p.raw.URN).slice(-3) : ''}</span>
                        <span style="font-size:0.8rem; color:var(--muted); display:block; margin-top:4px;">K: ${p.raw.K || '--'} | Mg: ${p.raw.Mg || '--'}</span>
                    </td>
                    <td><span style="font-size: 0.9rem; color: var(--muted); display: block; max-width: 200px; line-height: 1.3;">${p.raw.ICUAdmissionReason}</span></td>
                    <td><span class="location-bubble">${p.raw.Location} / ${p.raw.Room}</span></td>
                    <td>${flagHtml}</td>
                    <td>${timeDisplay}</td>
                    <td style="padding-right: 1.5rem;"><button class="btn btn-outline" style="font-size: 0.85rem; padding: 8px 16px;">Full Review</button></td>
                `;
            } else {
                tr.innerHTML = `
                    <td style="padding-left: 1.5rem;">${qCatDisplay}</td>
                    <td>
                        <span class="patient-name">${p.raw.PatientName}</span>
                        <span class="patient-urn">URN: ...${p.raw.URN ? String(p.raw.URN).slice(-3) : ''}</span>
                        <span style="font-size:0.8rem; color:var(--muted); display:block; margin-top:4px;">K: ${p.raw.K || '--'} | Mg: ${p.raw.Mg || '--'}</span>
                    </td>
                    <td><span style="font-size: 0.9rem; color: var(--muted); display: block; max-width: 200px; line-height: 1.3;">${p.raw.ICUAdmissionReason}</span></td>
                    <td><span class="location-bubble">${p.raw.Location} / ${p.raw.Room}</span></td>
                    <td>${flagHtml}</td>
                    <td>${timeDisplay}</td>
                    <td style="padding-right: 1.5rem;"><button class="btn btn-outline" style="font-size: 0.85rem; padding: 8px 16px;">Full Review</button></td>
                `;
            }

            tr.addEventListener('click', () => {
                // Save state to sessionStorage so index.html can pick it up
                const stateToSave = { ...p.state };
                if (p.isICU) stateToSave.reviewType = 'pre';
                sessionStorage.setItem('alert_form_data', JSON.stringify(stateToSave));
                window.location.href = 'assessment.html';
            });

            return tr;
        }

        if (icuPatients.length === 0) {
            icuTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 3rem; color: var(--muted);">No ICU patients listed for stepdown.</td></tr>';
        } else {
            icuPatients.forEach(p => icuTableBody.appendChild(createRow(p)));
        }

        if (wardPatients.length === 0) {
            wardTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 3rem; color: var(--muted);">No active ward patients found.</td></tr>';
        } else {
            wardPatients.forEach(p => wardTableBody.appendChild(createRow(p)));
        }

        // statTotal updated at start of render
    }

    // --- SEARCH FUNCTIONALITY ---
    const searchInput = document.getElementById('wardSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const wardTableBody = document.getElementById('wardTableBody');
            if (!wardTableBody) return;

            const rows = wardTableBody.querySelectorAll('.jb-row');
            rows.forEach(r => {
                const text = r.innerText.toLowerCase();
                r.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
});
