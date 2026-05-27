/* =========================================
   ALERT Tool Plugin: Local Auditor & Log Exporter
   Copyright © 2026 Casey Bond
   Part of ALERT Nursing Risk Assessment Tool
   MIT License - https://opensource.org/licenses/MIT
   
   CLINICAL IT COMPLIANCE NOTE:
   - This plugin runs 100% locally in the client web browser's Sandbox.
   - It stores audit data exclusively inside browser persistent 'localStorage'.
   - No external APIs, remote web services, fetch/AJAX/WebSockets, or servers are used.
   - Designed to maintain complete patient data privacy and offline integrity.
   ========================================= */

const AUDIT_STORAGE_KEY = 'alert_audit_log_v1';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize auditor triggers
    initAuditorTriggers();
    
    // Attach listener to sidebar logo for admin panel opening (double-click)
    const logo = document.getElementById('sidebarLogo');
    if (logo) {
        logo.addEventListener('dblclick', openAuditDashboard);
        logo.title = "Double-click to open Audit Dashboard";
        console.log('Auditor Plugin loaded: Double-click ALERT logo to audit');
    }
});

/**
 * Attaches event listeners to existing clipboard copy buttons in the ALERT Tool.
 * Logs assessment data silently upon click.
 */
function initAuditorTriggers() {
    const copyButtons = ['footerCopy', 'btnCopySummaryMain', 'btnQuickCopySummary'];
    
    copyButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                // Wait briefly for all latest states to be finalized and captured in DOM
                setTimeout(logCurrentAssessment, 200);
            });
        }
    });
}

/**
 * Gathers active clinical inputs and saves them safely to localStorage.
 * Deduplicates contiguous clicks on the same patient to keep log clean.
 */
function logCurrentAssessment() {
    try {
        const urn = document.getElementById('ptMrn')?.value || '';
        const initials = document.getElementById('ptName')?.value || '';
        
        // Skip logging if the key clinical identity fields are empty
        if (!urn && !initials) {
            return;
        }

        const ward = document.getElementById('ptWard')?.value || 'Other';
        const bed = document.getElementById('ptBed')?.value || '';
        const age = document.getElementById('ptAge')?.value || '';
        const los = document.getElementById('icuLos')?.value || '';
        const reason = document.getElementById('ptAdmissionReason')?.value || '';
        
        const reviewType = document.querySelector('input[name="reviewType"]:checked')?.value || 'post';
        const role = document.querySelector('input[name="clinicianRole"]:checked')?.value || 'ALERT CNS';
        const adds = document.getElementById('adds')?.value || '0';
        
        // Gather Assessed Category from UI
        const catText = document.getElementById('footerScore')?.innerText || 
                        document.getElementById('catText')?.innerText || 'CAT 3';
        
        const redFlags = document.getElementById('redCount')?.innerText || '0';
        const amberFlags = document.getElementById('amberCount')?.innerText || '0';
        
        // Gather selected outcome actions
        const continueAlert = document.getElementById('chk_continue_alert')?.checked || false;
        const discharge = document.getElementById('chk_discharge_alert')?.checked || false;
        const dischargePendingBloods = document.getElementById('chk_discharge_pending_bloods')?.checked || false;
        const medicalRounding = document.getElementById('chk_medical_rounding')?.checked || false;

        const record = {
            timestamp: new Date().toISOString(),
            urn: urn.trim(),
            initials: initials.trim(),
            ward: ward,
            bed: bed,
            age: age,
            los: los,
            reason: reason,
            reviewType: reviewType,
            role: role,
            adds: adds,
            category: catText.replace(/\s+/g, ' ').trim(),
            redFlags: redFlags,
            amberFlags: amberFlags,
            continueAlert: continueAlert,
            discharge: discharge,
            dischargePendingBloods: dischargePendingBloods,
            medicalRounding: medicalRounding
        };

        // Load existing logs
        let currentLogs = [];
        try {
            const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
            if (raw) currentLogs = JSON.parse(raw);
        } catch (e) {
            currentLogs = [];
        }

        // Deduplication: Avoid logging duplicate submissions for the same patient in a 5 minute window
        if (currentLogs.length > 0) {
            const lastLog = currentLogs[currentLogs.length - 1];
            const timeDiff = new Date(record.timestamp) - new Date(lastLog.timestamp);
            
            if (lastLog.urn === record.urn && 
                lastLog.adds === record.adds && 
                lastLog.ward === record.ward && 
                timeDiff < 300000) { // 5 minutes (300,000ms)
                console.log('Auditor: Assessment matches last record within 5 mins, skipping duplicate.');
                return;
            }
        }

        currentLogs.push(record);
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(currentLogs));
        console.log('Auditor: Successfully recorded assessment for URN:', record.urn);
        
        // Show a brief subtle confirmation in console (or UI if requested)
    } catch (err) {
        console.error('Auditor Error logging assessment:', err);
    }
}

/**
 * Creates and displays a modal displaying all cached audit entries,
 * summary metrics, and Excel/Clear options.
 */
function openAuditDashboard() {
    // 1. Ensure modal element exists in DOM
    let modal = document.getElementById('auditLogModal');
    if (!modal) {
        modal = createAuditModalMarkup();
        document.body.appendChild(modal);
    }

    // 2. Fetch logs and populate UI
    renderAuditLogsList();

    // 3. Display modal
    modal.style.display = 'flex';
}

/**
 * Generates the Audit Modal structure and styling dynamically
 */
function createAuditModalMarkup() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'auditLogModal';
    
    // Sleek overlay styles mimicking clinical UI theme
    modalDiv.style.cssText = `
        display: none;
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 10000;
        align-items: center;
        justify-content: center;
        font-family: inherit;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        background: var(--card, white);
        color: var(--text, #1e293b);
        border: 1px solid var(--line, #e2e8f0);
        padding: 24px;
        border-radius: 16px;
        max-width: 800px;
        width: 92%;
        max-height: 85vh;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow: hidden;
    `;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line, #e2e8f0); padding-bottom: 12px;">
            <h3 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--accent, #0f172a);">
                📊 Clinical Audit Log Dashboard
            </h3>
            <span style="font-size: 0.75rem; background: var(--input-bg, #f1f5f9); padding: 4px 8px; border-radius: 12px; font-weight: 600; color: var(--muted, #64748b);">
                Local Standalone Log (Offline)
            </span>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: var(--bg, #f8fafc); padding: 12px; border-radius: 8px; border: 1px solid var(--line, #e2e8f0);">
            <div style="text-align: center;">
                <small style="display: block; color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600;">TOTAL AUDITS</small>
                <strong id="auditStatTotal" style="font-size: 1.4rem; color: var(--accent, #0f172a);">0</strong>
            </div>
            <div style="text-align: center; border-left: 1px solid var(--line, #e2e8f0); border-right: 1px solid var(--line, #e2e8f0);">
                <small style="display: block; color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600;">CAT 1 (RED)</small>
                <strong id="auditStatRed" style="font-size: 1.4rem; color: #ef4444;">0</strong>
            </div>
            <div style="text-align: center;">
                <small style="display: block; color: var(--muted, #64748b); font-size: 0.75rem; font-weight: 600;">CAT 2 (AMBER)</small>
                <strong id="auditStatAmber" style="font-size: 1.4rem; color: #f59e0b;">0</strong>
            </div>
        </div>

        <div style="flex: 1; overflow-y: auto; margin: 4px 0; border: 1px solid var(--line, #e2e8f0); border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                <thead>
                    <tr style="background: var(--input-bg, #f1f5f9); border-bottom: 1px solid var(--line, #e2e8f0); position: sticky; top: 0;">
                        <th style="padding: 10px 12px; font-weight: 600; color: var(--muted, #64748b);">Date/Time</th>
                        <th style="padding: 10px 12px; font-weight: 600; color: var(--muted, #64748b);">URN</th>
                        <th style="padding: 10px 12px; font-weight: 600; color: var(--muted, #64748b);">Ward</th>
                        <th style="padding: 10px 12px; font-weight: 600; color: var(--muted, #64748b);">ADDS</th>
                        <th style="padding: 10px 12px; font-weight: 600; color: var(--muted, #64748b);">Category</th>
                        <th style="padding: 10px 12px; font-weight: 600; color: var(--muted, #64748b);">Role</th>
                    </tr>
                </thead>
                <tbody id="auditLogTableBody">
                    <tr>
                        <td colspan="6" style="padding: 32px; text-align: center; color: var(--muted, #64748b);">
                            No assessments logged yet. Copy a patient assessment to begin auditing.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="display: flex; gap: 10px; justify-content: space-between; align-items: center; border-top: 1px solid var(--line, #e2e8f0); padding-top: 12px;">
            <div>
                <button id="btnAuditClear" class="btn danger small" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; padding: 8px 16px;">
                    🗑️ Clear Log
                </button>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="btnAuditClose" class="btn small" style="background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px;">
                    Close
                </button>
                <button id="btnAuditExport" class="btn small" style="background: var(--accent, #0f172a); color: white; padding: 8px 20px; font-weight: 600;">
                    📥 Export to Excel (CSV)
                </button>
            </div>
        </div>
    `;

    modalDiv.appendChild(container);

    // Event listeners
    modalDiv.querySelector('#btnAuditClose').addEventListener('click', () => {
        modalDiv.style.display = 'none';
    });
    
    modalDiv.querySelector('#btnAuditClear').addEventListener('click', clearAuditLogWithConfirm);
    modalDiv.querySelector('#btnAuditExport').addEventListener('click', exportAuditLogToCSV);

    return modalDiv;
}

/**
 * Reads logs from localStorage and updates the dashboard UI counts and table.
 */
function renderAuditLogsList() {
    let logs = [];
    try {
        const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (raw) logs = JSON.parse(raw);
    } catch (e) {
        logs = [];
    }

    // Sort logs descending (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Stats calculations
    const total = logs.length;
    const redCount = logs.filter(log => String(log.category).toUpperCase().includes('CAT 1')).length;
    const amberCount = logs.filter(log => String(log.category).toUpperCase().includes('CAT 2')).length;

    // Update Stats DOM
    const statTotal = document.getElementById('auditStatTotal');
    const statRed = document.getElementById('auditStatRed');
    const statAmber = document.getElementById('auditStatAmber');
    
    if (statTotal) statTotal.textContent = total;
    if (statRed) statRed.textContent = redCount;
    if (statAmber) statAmber.textContent = amberCount;

    // Populate Table DOM
    const tBody = document.getElementById('auditLogTableBody');
    if (!tBody) return;

    if (logs.length === 0) {
        tBody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 32px; text-align: center; color: var(--muted, #64748b);">
                    No assessments logged yet. Fill the calculator and click "Copy to Clipboard" to record data!
                </td>
            </tr>
        `;
        return;
    }

    tBody.innerHTML = logs.map(log => {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
                              date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let catBadgeStyle = 'font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;';
        let catText = log.category || 'CAT 3';
        if (catText.includes('CAT 1')) {
            catBadgeStyle += ' background: #fee2e2; color: #b91c1c;';
        } else if (catText.includes('CAT 2')) {
            catBadgeStyle += ' background: #ffedd5; color: #c2410c;';
        } else {
            catBadgeStyle += ' background: #dcfce7; color: #15803d;';
        }

        return `
            <tr style="border-bottom: 1px solid var(--line, #e2e8f0); hover:background:#f8fafc;">
                <td style="padding: 10px 12px; white-space: nowrap; color: var(--text, #1e293b);">${formattedDate}</td>
                <td style="padding: 10px 12px; font-weight: 600; color: var(--accent, #0f172a);">${escapeHTML(log.urn)}</td>
                <td style="padding: 10px 12px; color: var(--text, #1e293b);">${escapeHTML(log.ward)}</td>
                <td style="padding: 10px 12px; font-weight: 600; text-align: center; color: var(--text, #1e293b);">${escapeHTML(log.adds)}</td>
                <td style="padding: 10px 12px;"><span style="${catBadgeStyle}">${escapeHTML(catText)}</span></td>
                <td style="padding: 10px 12px; color: var(--muted, #64748b); font-size: 0.8rem;">${escapeHTML(log.role)}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Downloads the accumulated audit records as a Microsoft Excel-compatible CSV file.
 */
function exportAuditLogToCSV() {
    let logs = [];
    try {
        const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (raw) logs = JSON.parse(raw);
    } catch (e) {
        logs = [];
    }

    if (logs.length === 0) {
        alert("The audit log is currently empty.");
        return;
    }

    const headers = [
        "Date Captured", "Clinician Initials", "Patient URN", "Age", "Ward", "Bed", 
        "ICU LOS (Days)", "Review Type", "Clinician Role", "ADDS Score", "Assessed Category", 
        "Red Flags", "Amber Flags", "Outcome: Continue ALERT", "Outcome: Discharge", 
        "Outcome: Pending Next Bloods", "Outcome: Add to Rounding"
    ];

    let csvRows = [headers.join(",")];

    logs.forEach(log => {
        // Date formatting in Local ISO style
        const date = new Date(log.timestamp);
        const dateStr = date.getFullYear() + "-" + 
                        String(date.getMonth() + 1).padStart(2, '0') + "-" + 
                        String(date.getDate()).padStart(2, '0') + " " + 
                        String(date.getHours()).padStart(2, '0') + ":" + 
                        String(date.getMinutes()).padStart(2, '0');

        const values = [
            dateStr,
            log.initials || "",
            log.urn || "",
            log.age || "",
            log.ward || "",
            log.bed || "",
            log.los || "",
            log.reviewType || "",
            log.role || "",
            log.adds || "0",
            log.category || "",
            log.redFlags || "0",
            log.amberFlags || "0",
            log.continueAlert ? "Yes" : "No",
            log.discharge ? "Yes" : "No",
            log.dischargePendingBloods ? "Yes" : "No",
            log.medicalRounding ? "Yes" : "No"
        ];

        const escaped = values.map(val => {
            const cleanStr = String(val).replace(/"/g, '""');
            return `"${cleanStr}"`;
        });
        csvRows.push(escaped.join(","));
    });

    const csvContent = csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    const today = new Date().toISOString().split('T')[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `ALERT_Clinical_AuditLog_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Prompts double-confirmation before safely purging local log array.
 */
function clearAuditLogWithConfirm() {
    if (confirm("⚠️ WARNING: This will permanently delete all records currently stored in this workstation's audit log.\n\nAre you sure you wish to proceed? This cannot be undone.")) {
        localStorage.removeItem(AUDIT_STORAGE_KEY);
        renderAuditLogsList();
        
        // Show confirmation toast if function exists, else simple alert
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = "🗑️ Audit log cleared successfully";
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        } else {
            alert("Audit log cleared.");
        }
    }
}

/**
 * Micro utility to escape HTML content to protect DOM from XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
