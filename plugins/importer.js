/* =========================================
   ALERT Tool Plugin: DMR Importer (Smart)
   v7.6 - Updated for Vasoactive & Mitigation Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    const modal = document.getElementById('importModal');
    const openBtn = document.getElementById('btnOpenImport');
    const closeBtn = document.getElementById('closeImport');
    const runBtn = document.getElementById('runImport');
    const txt = document.getElementById('importText');

    if(openBtn && modal) {
        openBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    if(runBtn) {
        runBtn.addEventListener('click', () => {
            const data = txt.value;
            if(!data) return;
            processDMR(data);
            modal.style.display = 'none';
            // Trigger generic input event to update calculations
            const ptName = document.getElementById('ptName');
            if(ptName) ptName.dispatchEvent(new Event('input'));
        });
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if(el && val) {
            el.value = val.trim();
            el.classList.add('scraped-data'); 
            el.dispatchEvent(new Event('input'));
        }
    }

    function setPrev(id, val) {
        const el = document.getElementById(id);
        if(el && val) {
            let text = val.trim();
            text = text.replace(/%/, ''); 
            if(!id.includes('risk') && text.length > 25) {
                text = text.substring(0, 23) + '..';
            }
            el.textContent = `(Prev: ${text})`;
        }
    }

    function setRiskText(id, val) {
        const el = document.getElementById(id);
        if(el && val) {
            el.textContent = ` (Prev: ${val.trim()})`;
        }
    }
    
    function clickToggle(id) {
        const el = document.getElementById(id);
        if(el && el.dataset.value === 'false') {
            el.click();
        }
    }

    function clickSegment(groupId, value) {
        const group = document.getElementById(groupId);
        if(group) {
            const btn = group.querySelector(`.seg-btn[data-value="${value}"]`);
            if(btn && !btn.classList.contains('active')) btn.click();
        }
    }

    function openAccordion(panelId, iconBtnSelector) {
        const panel = document.getElementById(panelId);
        const btn = document.querySelector(iconBtnSelector);
        if(panel) {
            panel.style.display = 'block';
            if(btn) {
                const icon = btn.querySelector('.icon');
                if(icon) icon.textContent = '[-]';
            }
        }
    }

    function processDMR(text) {
        // --- 0. RESET ---
        window.prevBloods = {}; 
        const carryForward = true; // Always carry forward stable sections

        // --- 1. DEMOGRAPHICS ---
        const ptMatch = text.match(/Patient:\s*([A-Za-z\s]+?)\s*\|/i);
        if(ptMatch) setVal('ptName', ptMatch[1]);

        const urnMatch = text.match(/URN:.*?(\d+)/i);
        if(urnMatch) setVal('ptMrn', urnMatch[1].slice(-3));
        
        const ageMatch = text.match(/Age:\s*(\d+)/i);
        if(ageMatch) setVal('ptAge', ageMatch[1]);

        const weightMatch = text.match(/Weight:\s*(\d+)/i);
        if(weightMatch) setVal('ptWeight', weightMatch[1]);

        const locMatch = text.match(/Location:\s*([A-Z0-9]+)\s+(\d+)/i);
        if(locMatch) {
            const ward = locMatch[1];
            const wardSelect = document.getElementById('ptWard');
            let found = false;
            for(let i=0; i<wardSelect.options.length; i++) {
                if(wardSelect.options[i].value === ward) {
                    wardSelect.selectedIndex = i;
                    wardSelect.classList.add('scraped-data');
                    found = true;
                    break;
                }
            }
            if(!found) {
                wardSelect.value = "Other";
                const otherWrapper = document.getElementById('ptWardOtherWrapper');
                if(otherWrapper) otherWrapper.style.display = 'block';
                setVal('ptWardOther', ward);
            }
            setVal('ptBed', locMatch[2]);
        }

        const losMatch = text.match(/ICU LOS:\s*(\d+)/i);
        if(losMatch) setVal('icuLos', losMatch[1]);

        const reasonMatch = text.match(/Reason for ICU Admission:\s*(.*)/i);
        if(reasonMatch) setVal('ptAdmissionReason', reasonMatch[1]);

        // Fix: Date parsing handles DD/MM/YYYY and converts to YYYY-MM-DD for input
        const dateMatch = text.match(/(?:Discharge|Stepdown) Date:\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/i);
        if(dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            let year = dateMatch[3];
            if(year.length === 2) year = "20" + year;
            const isoDate = `${year}-${month}-${day}`;
            setVal('stepdownDate', isoDate); 
        }

        // --- 2. CONTEXT ---
        if (carryForward) {
            let contextFound = false;
            const gocMatch = text.match(/GOC:\s*[\(]?(.*?)[\)]?$/m) || text.match(/GOC:\s*(.*)/i);
            if(gocMatch) { setVal('goc_note', gocMatch[1].replace(/^\(|\)$/g, '')); contextFound = true; }

            const allergiesMatch = text.match(/Allergies:\s*(.*)/i);
            if(allergiesMatch) { setVal('allergies_note', allergiesMatch[1]); contextFound = true; }

            const picsMatch = text.match(/PICS Assessment:\s*[\(]?(.*?)[\)]?$/m) || text.match(/PICS Assessment:\s*(.*)/i);
            if(picsMatch) { setVal('pics_note', picsMatch[1].replace(/^\(|\)$/g, '')); contextFound = true; }

            // Regex Improvement: PMH (captures lines starting with - until next section)
            const pmhSection = text.match(/(?:PMH|Significant Past Medical History):([\s\S]*?)(?:A-E ASSESSMENT|PICS|GOC)/i);
            if(pmhSection && pmhSection[1]) {
                const rawPmh = pmhSection[1].split('\n')
                    .map(l => l.trim())
                    .filter(l => l.startsWith('-'))
                    .map(l => l.substring(1).trim())
                    .join('\n');
                if(rawPmh) { setVal('pmh_note', rawPmh); contextFound = true; }
            }

            if(contextFound) openAccordion('panel_context', '[aria-controls="panel_context"]');
        }

        // --- 3. PREVIOUS DATA (A-E) ---
        const aeBlock = text.match(/A-E ASSESSMENT([\s\S]*?)(?:Bloods:|DEVICES:)/i) || [null, text];
        const aeText = aeBlock[1];
        if(aeBlock[1]) openAccordion('panel_ae', '[aria-controls="panel_ae"]');

        if(aeText) {
            const addsMatch = aeText.match(/ADDS\s*[:]?\s*(\d+)/i);
            if(addsMatch) setPrev('prev_adds', addsMatch[1]);

            const airwayMatch = aeText.match(/A[:\s]\s*(.*?)(?=\n|B[:\s])/i);
            if(airwayMatch) setPrev('prev_airway', airwayMatch[1]);

            const rrMatch = aeText.match(/RR\s*(\d+(?:\s*to\s*\d+|\s*-\s*\d+)?)/i);
            if(rrMatch) setPrev('prev_rr', rrMatch[1]);

            const spo2Match = aeText.match(/SpO2\s*(?:above\s*|>)?\s*(\d+%?)/i) || aeText.match(/(\d+%?)\s*SpO2/i);
            if(spo2Match) setPrev('prev_spo2', spo2Match[1]);

            const o2Match = aeText.match(/(RA|(?:\d+L)?NP|HFNP|NIV|Trache)/i);
            if(o2Match) setPrev('prev_o2_dev', o2Match[1]);

            const hrMatch = aeText.match(/HR\s*(\d+s?)/i);
            if(hrMatch) setPrev('prev_hr', hrMatch[1]);

            const bpMatch = aeText.match(/NIBP\s*(\d+\/\d+)/i);
            if(bpMatch) setPrev('prev_bp', bpMatch[1]);

            const tempMatch = aeText.match(/E[:\s]\s*(Afebrile|[\d\.]+)/i);
            if(tempMatch) setPrev('prev_temp', tempMatch[1]);

            const alertMatch = aeText.match(/D[:\s]\s*(.*?)(?=\n|E[:\s])/i);
            if(alertMatch) setPrev('prev_alert', alertMatch[1]);
        }

        if (carryForward) {
            const mobMatch = text.match(/Mobility:\s*(.*)/i);
            if(mobMatch) setVal('ae_mobility', mobMatch[1]);

            const dietMatch = text.match(/Diet:\s*(.*)/i);
            if(dietMatch) setVal('ae_diet', dietMatch[1]);

            const bowelMatch = text.match(/Bowels:\s*(.*)/i);
            if(bowelMatch) setVal('ae_bowels', bowelMatch[1]);
        }

        // --- 4. BLOODS ---
        const bloodsBlock = text.match(/Bloods:\s*([\s\S]*?)(?:DEVICES:|IDENTIFIED ICU READMISSION|IDENTIFIED RISK FACTORS|$)/i);
        if(bloodsBlock) {
            openAccordion('panel_bloods', '[aria-controls="panel_bloods"]');
            const bText = bloodsBlock[1];
            
            const getB = (regex, id, key) => {
                const m = bText.match(regex);
                if(m) {
                    setPrev(id, m[1]);
                    if(window.prevBloods) window.prevBloods[key] = m[1];
                }
            };

            getB(/Hb\s*(\d+)/i, 'prev_bl_hb', 'hb');
            getB(/WCC\s*([\d\.]+)/i, 'prev_bl_wcc', 'wcc');
            getB(/CRP\s*(\d+)/i, 'prev_bl_crp', 'crp');
            getB(/Cr\s*(\d+)/i, 'prev_bl_cr_review', 'cr_review');
            getB(/eGFR\s*(\d+)/i, 'prev_bl_egfr', 'egfr');
            getB(/Lac\s*([\d\.]+)/i, 'prev_bl_lac_review', 'lac_review');
            getB(/K\s*([\d\.]+)/i, 'prev_bl_k', 'k');
            getB(/Na\s*(\d+)/i, 'prev_bl_na', 'na');
            getB(/Mg\s*([\d\.]+)/i, 'prev_bl_mg', 'mg');
            getB(/PO4\s*([\d\.]+)/i, 'prev_bl_phos', 'phos');
            getB(/Plts\s*(\d+)/i, 'prev_bl_plts', 'plts');
            getB(/Alb\s*(\d+)/i, 'prev_bl_alb', 'alb');
            getB(/Neut\s*([\d\.]+)/i, 'prev_bl_neut', 'neut');
            getB(/Lymph\s*([\d\.]+)/i, 'prev_bl_lymph', 'lymph');
            getB(/Bili\s*(\d+)/i, 'prev_bl_bili', 'bili');
            getB(/ALT\s*(\d+)/i, 'prev_bl_alt', 'alt');
            getB(/INR\s*([\d\.]+)/i, 'prev_bl_inr', 'inr');
            getB(/APTT\s*(\d+)/i, 'prev_bl_aptt', 'aptt');

            // --- Auto-detect worsening Cr ---
            const crMatch = text.match(/Cr\s*(\d+)/i);
            if (crMatch && window.prevBloods && window.prevBloods.cr_review) {
                const prevCr = parseFloat(window.prevBloods.cr_review);
                // Don't auto-click, just set the chip to ready for manual selection
                // Clinician will see prev Cr in the summary and can decide
            }
        }

        // --- 5. RISKS ---
        const risksSection = text.match(/(?:IDENTIFIED ICU READMISSION RISK FACTORS|IDENTIFIED RISK FACTORS):([\s\S]*?)PLAN:/i);
        const risksBox = document.getElementById('prevRisksBox');
        const risksList = document.getElementById('prevRisksList');
        
        ['resp','neuro','renal','elec','ah','pressors','immob','inf'].forEach(k => {
            const el = document.getElementById(`prev_risk_${k}`);
            if(el) el.textContent = '';
        });

        if(risksSection && risksSection[1]) {
            const riskLines = risksSection[1].split('\n').map(l => l.trim()).filter(l => l.startsWith('-'));
            if(riskLines.length > 0 && !riskLines[0].toLowerCase().includes('none identified')) {
                risksBox.style.display = 'block';
                risksList.innerHTML = '';
                riskLines.forEach(line => {
                    const rawTxt = line.substring(1).trim(); 
                    const li = document.createElement('li');
                    li.textContent = rawTxt;
                    risksList.appendChild(li);
                    
                    const lower = rawTxt.toLowerCase();
                    
                    // --- PREV TEXT UPDATES ---
                    if(lower.includes('oxygen') || lower.includes('wean') || lower.includes('tachypnea') || lower.includes('respiratory')) setRiskText('prev_risk_resp', rawTxt);
                    if(lower.includes('neuro') || lower.includes('gcs') || lower.includes('delirium')) setRiskText('prev_risk_neuro', rawTxt);
                    if(lower.includes('renal') || lower.includes('aki') || lower.includes('creatinine')) setRiskText('prev_risk_renal', rawTxt);
                    if(lower.includes('infection') || lower.includes('sepsis') || lower.includes('wcc')) setRiskText('prev_risk_inf', rawTxt);
                    if(lower.includes('electrolyte') || lower.includes('potassium')) setRiskText('prev_risk_elec', rawTxt);
                    if(lower.includes('after-hours')) setRiskText('prev_risk_ah', rawTxt);
                    if(lower.includes('vaso') || lower.includes('pressor')) setRiskText('prev_risk_pressors', rawTxt);
                    if(lower.includes('immobility')) setRiskText('prev_risk_immob', rawTxt);

                    // Note: Scraped risks are shown as FYI only, not auto-highlighted
                    // Clinicians should review and manually select concerns

                });
            } else { risksBox.style.display = 'none'; }
        } else { risksBox.style.display = 'none'; }

        // --- 6. DEVICES ---
        if (carryForward) {
            const devSection = text.match(/DEVICES:([\s\S]*?)(?:IDENTIFIED|GOC:|PICS:|$)/i);
            if(devSection && devSection[1]) {
                openAccordion('panel_devices', '[aria-controls="panel_devices"]');
                const devLines = devSection[1].split('\n').map(l => l.trim()).filter(l => l.startsWith('-'));
                devLines.forEach(line => {
                    const txt = line.substring(1).trim();
                    if(txt.toLowerCase().includes('nil')) return;
                    
                    let type = "Other Device";
                    let det = txt;
                    let insertionDate = '';

                    const insertedMatch = txt.match(/inserted\s*[:]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
                    if (insertedMatch) {
                        const rawDate = insertedMatch[1];
                        if (rawDate.includes('-') && rawDate.split('-')[0].length === 4) {
                            insertionDate = rawDate;
                        } else {
                            const parts = rawDate.split(/[\/\-]/);
                            const day = parts[0].padStart(2, '0');
                            const month = parts[1].padStart(2, '0');
                            let year = parts[2];
                            if (year.length === 2) year = '20' + year;
                            insertionDate = `${year}-${month}-${day}`;
                        }
                    }

                    const dwellMatch = txt.match(/dwell\s*(\d+)\s*days?/i) || txt.match(/(\d+)\s*days?\s*dwell/i);
                    if (!insertionDate && dwellMatch) {
                        const dwellDays = parseInt(dwellMatch[1], 10);
                        if (!isNaN(dwellDays)) {
                            const now = new Date();
                            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dwellDays);
                            const yyyy = d.getFullYear();
                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                            const dd = String(d.getDate()).padStart(2, '0');
                            insertionDate = `${yyyy}-${mm}-${dd}`;
                        }
                    }
                    
                    const known = ['CVC', 'PICC', 'Other CVAD', 'PIVC', 'Arterial Line', 'Enteral Tube', 'IDC', 'Drain', 'Wound', 'Pacing Wire', 'Vascath'];
                    for(let k of known) {
                        if(txt.startsWith(k)) {
                            type = k;
                            det = txt.substring(k.length).trim().replace(/^\(|\)$/g, '').replace(/^-/, '').trim(); 
                            break;
                        }
                    }
                    if (det) {
                        det = det
                            .replace(/\(.*?inserted\s*[:]?.*?\)/i, '')
                            .replace(/inserted\s*[:]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i, '')
                            .replace(/dwell\s*\d+\s*days?/i, '')
                            .replace(/\d+\s*days?\s*dwell/i, '')
                            .replace(/^\(|\)$/g, '')
                            .trim();
                    }

                    if(window.addDevice) window.addDevice(type, det, insertionDate);
                });
            }
        }
        
        // --- QUICK REVIEW DETECTION FOR CAT 2 FOLLOW-UPS ---
        // Extract category and time info from imported data
        const catMatch = text.match(/ALERT Nursing Review Category - (CAT \d+)/i);
        
        // Match both hours and days formats
        let hoursOnWard = null;
        const hourMatch = text.match(/Time since stepdown:\s*([\d.]+)\s*hour/i);
        const dayMatch = text.match(/Time since stepdown:\s*([\d.]+)\s*day/i);
        
        if (hourMatch) {
            hoursOnWard = parseFloat(hourMatch[1]);
        } else if (dayMatch) {
            hoursOnWard = parseFloat(dayMatch[1]) * 24; // Convert days to hours
        }
        
        if (catMatch && hoursOnWard !== null) {
            const categoryText = catMatch[1]; // e.g., "CAT 2"
            
            let category = 'green';
            if (categoryText.includes('CAT 1')) category = 'red';
            else if (categoryText.includes('CAT 2')) category = 'amber';
            
            // Parse which specific risks were flagged in the imported note
            const identifiedRisks = text.match(/IDENTIFIED ICU READMISSION RISK FACTORS:([\s\S]*?)(?=PLAN:|$)/i);
            const previousRisks = [];
            if (identifiedRisks && identifiedRisks[1]) {
                const riskText = identifiedRisks[1].toLowerCase();
                if (riskText.includes('respiratory') || riskText.includes('oxygen') || riskText.includes('o2')) previousRisks.push('respiratory');
                if (riskText.includes('confusion') || riskText.includes('delirium') || riskText.includes('neuro')) previousRisks.push('neuro');
                if (riskText.includes('renal') || riskText.includes('aki') || riskText.includes('kidney')) previousRisks.push('renal');
                if (riskText.includes('infection') || riskText.includes('sepsis')) previousRisks.push('infection');
                if (riskText.includes('vasoactive') || riskText.includes('pressor') || riskText.includes('inotrope')) previousRisks.push('vasoactive');
                if (riskText.includes('immobility') || riskText.includes('mobility')) previousRisks.push('immobility');
                if (riskText.includes('nutrition') || riskText.includes('feeding')) previousRisks.push('nutrition');
                if (riskText.includes('electrolyte')) previousRisks.push('electrolyte');
            }
            
            // Store for later use
            if (window.previousCategoryData !== undefined) {
                window.previousCategoryData = { category, hoursOnWard, categoryText, previousRisks };
            }
            
            // Only offer Quick Review for CAT 2 patients on day 2+ with known risks
            const shouldOfferQuickReview = 
                (category === 'amber' && hoursOnWard >= 24 && previousRisks.length > 0);
            
            if (shouldOfferQuickReview && window.showQuickReviewPrompt) {
                setTimeout(() => {
                    window.showQuickReviewPrompt(categoryText, hoursOnWard, previousRisks);
                }, 1000);
            }
        }
        
        const t = document.getElementById('toast');
        if(t) { t.textContent = "Data Imported Successfully"; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2000); }
    }
});