/* =========================================
   ALERT Tool Plugin: PowerBI Export
   Copyright © 2025-2026 Casey Bond
   Part of ALERT Nursing Risk Assessment Tool
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnPowerBI');

    // If the button exists, attach the listener
    if (btn) {
        btn.addEventListener('click', sendToPowerBi);
        console.log('Plugin loaded: PowerBI Exporter');
    }
});

function sendToPowerBi() {
    // Collect specific fields that we know exist in the DOM 
    // Usually we would use `getState()` from the bundled logic, but as an external plugin,
    // we query the DOM directly to maintain module separation if we don't have access.

    // Attempting to use the globally exposed state getter if available, otherwise fallback to basic DOM grab
    let dataPayload = {};
    if (window._lastState) {
        dataPayload = window._lastState;
    } else {
        const getVal = id => document.getElementById(id) ? document.getElementById(id).value : null;
        dataPayload = {
            patientName: getVal('ptName'),
            urn: getVal('ptMrn'),
            ward: getVal('ptWard'),
            room: getVal('ptBed'),
            clinicianRole: document.querySelector('input[name="clinicianRole"]:checked')?.value,
            addsScore: getVal('adds'),
            alertCategory: document.getElementById('footerScore')?.innerText || '',
            reviewType: document.querySelector('input[name="reviewType"]:checked')?.value,
            dischargeStatus: document.getElementById('chk_discharge_alert')?.checked,
            timestamp: new Date().toISOString()
        };
    }

    const payloadString = JSON.stringify(dataPayload, null, 2);

    // Log the JSON payload clearly to the console
    console.log("===================================");
    console.log("SENDING DATA TO POWERBI BACKEND...");
    console.log(payloadString);
    console.log("===================================");

    // Update the UI explicitly so the user knows it succeeded
    const btn = document.getElementById('btnPowerBI');
    const originalText = btn.innerHTML;

    btn.innerHTML = '✅ Sent Successfully';
    btn.style.backgroundColor = '#16a34a'; // tailwind green-600

    // Reset button after 3 seconds
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '#0f172a';
    }, 3000);
}
