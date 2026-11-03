// LexAdvisor AI Client Application — Plain-Language Legal Decision Support for Everyday Citizens
const API_BASE = "/api/v1";

// Application State
let currentTab = "tab-stamp";
let currentDocId = null;
let currentAdvSubTab = "directory";
window.advocatesData = [];
window.appointmentsData = [];
window.deadlinesData = [];
window.historyData = [];

// Sample Documents for one-click testing
const SAMPLES = {
  ts_stamp_ok: {
    title: "Telangana Residential Tenancy (Valid E-Stamp)",
    state: "TS",
    doc_type: "rental_agreement",
    text: `GOVERNMENT OF TELANGANA
e-Stamp Certificate No: IN-TS20268894103251
Certificate Issued Date: 12/03/2026
Purchased By: Sri Suresh Thakur
Vendor: Stock Holding Corporation of India Ltd (SHCIL Hyderabad)
Description of Document: Article 49 Tenancy Agreement
Stamp Duty Amount: Rs. 100/-

RESIDENTIAL RENTAL AGREEMENT
This Rental Agreement is made on 15th March 2026 at Hyderabad, Telangana between:
1. Sri K. V. Raman, residing at Plot 45, Jubilee Hills, Hyderabad (hereinafter called the LESSOR); and
2. Sri Suresh Thakur, residing at Hyderabad (hereinafter called the LESSEE).

1. PREMISES: The Lessor agrees to let out Residential Flat No. 302, Green Meadows, Gachibowli, Hyderabad.
2. TERM & RENT: Tenure of 11 months commencing 15/03/2026. Monthly rent of Rs. 35,000/- payable on or before 5th of each calendar month.
3. SECURITY DEPOSIT: Lessee has deposited interest-free refundable deposit of Rs. 1,00,000/- to be returned within 7 days of peaceful handover.
4. TERMINATION: Either party may terminate by giving 1 month prior written notice.
5. MAINTENANCE & UTILITIES: Minor repairs up to Rs. 1,000 borne by Lessee; structural repairs borne by Lessor.
6. JURISDICTION: Subject to exclusive jurisdiction of civil courts at Hyderabad, Telangana.`
  },

  deficient_stamp: {
    title: "Commercial Lease (Deficient Stamp Duty & High Risk)",
    state: "TS",
    doc_type: "commercial_lease",
    text: `GOVERNMENT OF TELANGANA
Non-Judicial Stamp Paper
Serial No: TS-2026-004128
Denomination: Rs. 20/-
Purchased By: Unknown Third Party Broker
Purchase Date: 20/04/2026

COMMERCIAL LEASE AGREEMENT
Executed at Hyderabad on 10th January 2026 (Backdated Execution).
Between Prime Properties Ltd (Lessor) and Zenith Logistics (Lessee).

1. PREMISES & TERM: Commercial warehouse at Shamshabad for 3 years.
2. RENT: Rs. 1,50,000/- per month payable in advance on 1st of each month.
3. LOCK-IN PERIOD: 36 months strict lock-in. If Lessee vacates early, entire 36 months rent is immediately forfeited as penalty.
4. UNILATERAL INDEMNITY: Lessee shall unconditionally indemnify, protect, defend, and hold harmless Lessor from any claims, disputes, tax liabilities, and attorney fees without any limitation or monetary ceiling.
5. TERMINATION: Lessor reserves the sole right to terminate immediately without notice or assigning reasons. Lessee has no right of early exit.
6. SECURITY DEPOSIT: Non-refundable deposit of Rs. 5,00,000/- retained by Lessor for arbitrary renovation costs.
7. DISPUTE RESOLUTION: All disputes shall be litigated exclusively before the High Court of Delhi.`
  },

  ap_agreement: {
    title: "Andhra Pradesh Master Service Agreement",
    state: "AP",
    doc_type: "service_agreement",
    text: `GOVERNMENT OF ANDHRA PRADESH
e-Stamp Certificate No: IN-AP20267710923418
Certificate Issued Date: 05/02/2026
Purchased By: Amaravati Tech Innovations Pvt Ltd
Vendor: AP Stamps & Registration Department / SHCIL Visakhapatnam
Denomination: Rs. 100/-

MASTER SERVICES AGREEMENT
This Agreement executed on 10/02/2026 at Visakhapatnam, Andhra Pradesh between:
1. Amaravati Tech Innovations Pvt Ltd, Visakhapatnam (Client); and
2. Coastal Cloud Solutions LLP, Vijayawada (Service Provider).

1. SCOPE OF SERVICES: Cloud application development and automated data ingestion pipelines.
2. PAYMENT TERMS: Monthly milestones against GST invoice payable within 30 days.
3. INTELLECTUAL PROPERTY: All custom code shall be work-for-hire assigned to Client.
4. LIMITATION OF LIABILITY: Aggregate liability capped at 6 months fees paid.
5. DISPUTE RESOLUTION: Arbitration seated in Visakhapatnam under Arbitration & Conciliation Act 1996.
6. GOVERNING LAW: Governed by the laws of India and courts at Visakhapatnam, Andhra Pradesh.`
  }
};

// INITIALIZATION ON DOM READY
document.addEventListener("DOMContentLoaded", () => {
  initGoogleAuth();
  setupTabs();
  loadAdvocates();
  loadAppointments();
  loadDeadlines();
  loadCustomerHistory();
  setDefaultBookingDate();
});

function setDefaultBookingDate() {
  const dateInput = document.getElementById("book-date");
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split("T")[0];
  }
}

// ============================================================================
// 1. GOOGLE AUTHENTICATION SYSTEM
// ============================================================================
function initGoogleAuth() {
  const savedUser = localStorage.getItem("lex_user");
  const savedToken = localStorage.getItem("lex_token");

  if (savedUser && savedToken) {
    try {
      const user = JSON.parse(savedUser);
      renderUserProfile(user);
      return;
    } catch (e) {
      console.warn("Failed to parse saved user", e);
    }
  }

  // Fallback demo profile for immediate usability
  const demoUser = {
    name: "Suresh Thakur",
    email: "sureshtakur194@gmail.com"
  };
  localStorage.setItem("lex_user", JSON.stringify(demoUser));
  localStorage.setItem("lex_token", "demo-token-active");
  renderUserProfile(demoUser);
}

function renderUserProfile(user) {
  const container = document.getElementById("header-auth-container");
  if (!container) return;

  const initial = (user.name || "U").charAt(0).toUpperCase();
  container.innerHTML = `
    <div class="user-profile-badge">
      <div class="user-avatar-circle" title="Google Account: ${escapeHtml(user.email)}">${initial}</div>
      <div style="display:flex;flex-direction:column;line-height:1.15;">
        <span class="user-name-text">${escapeHtml(user.name || 'User')}</span>
        <span class="user-email-text">${escapeHtml(user.email || 'sureshtakur194@gmail.com')}</span>
      </div>
      <button type="button" class="btn-signout" onclick="signOutGoogle()" title="Sign Out">Sign Out</button>
    </div>
  `;
}

function signOutGoogle() {
  localStorage.removeItem("lex_user");
  localStorage.removeItem("lex_token");
  window.location.href = "/login";
}

// ============================================================================
// 2. TAB NAVIGATION
// ============================================================================
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-item");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");
      currentTab = targetId;

      // Lazy refresh for dynamic views
      if (targetId === "tab-deadlines") loadDeadlines();
      if (targetId === "tab-history") loadCustomerHistory();
      if (targetId === "tab-advocates") {
        loadAdvocates();
        loadAppointments();
      }
    });
  });
}

function switchTabDirectly(tabId) {
  const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (tabBtn) tabBtn.click();
}

function loadSampleToModule(sampleKey, moduleType) {
  const sample = SAMPLES[sampleKey];
  if (!sample) return;

  if (moduleType === "stamp") {
    const textEl = document.getElementById("stamp-direct-text");
    if (textEl) textEl.value = sample.text;
    const stateEl = document.getElementById("stamp-state-select");
    if (stateEl) stateEl.value = sample.state;
    const docEl = document.getElementById("stamp-doctype-select");
    if (docEl) docEl.value = sample.doc_type;
    runDirectStamp();
  } else if (moduleType === "risk") {
    const textEl = document.getElementById("risk-direct-text");
    if (textEl) textEl.value = sample.text;
    const docEl = document.getElementById("risk-doctype-select");
    if (docEl) docEl.value = sample.doc_type;
    runDirectRisk();
  } else if (moduleType === "actions") {
    const textEl = document.getElementById("action-direct-text");
    if (textEl) textEl.value = sample.text;
    runDirectActions();
  }
}

// ============================================================================
// 3. MODULE PDF UPLOAD HANDLERS
// ============================================================================
async function handleModulePdfUpload(event, moduleType) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById(`${moduleType}-upload-status`);
  if (statusEl) {
    statusEl.textContent = `Uploading and scanning ${file.name}...`;
    statusEl.style.color = "var(--ink)";
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", moduleType === "stamp" ? "rental_agreement" : "rental_agreement");
  formData.append("state", "TS");

  try {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Document upload failed");
    const docData = await res.json();
    currentDocId = docData.id;

    if (statusEl) {
      statusEl.textContent = `✓ Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      statusEl.style.color = "var(--green)";
    }

    const extracted = docData.extracted_text || `Uploaded scan: ${file.name}`;
    if (moduleType === "stamp") {
      const textEl = document.getElementById("stamp-direct-text");
      if (textEl) textEl.value = extracted;
      runDirectStamp();
    } else if (moduleType === "risk") {
      const textEl = document.getElementById("risk-direct-text");
      if (textEl) textEl.value = extracted;
      runDirectRisk();
    } else if (moduleType === "actions") {
      const textEl = document.getElementById("action-direct-text");
      if (textEl) textEl.value = extracted;
      runDirectActions();
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = `Upload error: ${err.message}`;
      statusEl.style.color = "var(--red)";
    }
  }
}

// ============================================================================
// 4. EXACT STAMP PAPER ANALYZER
// ============================================================================
async function runDirectStamp() {
  const text = document.getElementById("stamp-direct-text").value.trim() || SAMPLES.ts_stamp_ok.text;
  const stateVal = document.getElementById("stamp-state-select")?.value || "TS";
  const docTypeVal = document.getElementById("stamp-doctype-select")?.value || "rental_agreement";

  const resDiv = document.getElementById("stamp-direct-result");
  const btn = document.getElementById("btn-run-stamp");
  if (btn) btn.disabled = true;
  resDiv.innerHTML = "<div class='note'>Calculating exact statutory duty, verifying UIN, and auditing Section 35 penalties...</div>";

  try {
    const formData = new FormData();
    formData.append("text_content", text);
    formData.append("doc_type", docTypeVal);

    const res = await fetch("/stamp/analyze", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Stamp analysis failed");
    const data = await res.json();
    resDiv.innerHTML = "";
    resDiv.appendChild(createStampCard(data));
  } catch (err) {
    resDiv.innerHTML = `<div class="note" style="color:var(--red);">Error: ${err.message}</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

function createStampCard(stamp) {
  const card = document.createElement("article");
  card.className = "stamp-card";

  const markLevel = (stamp.risk_level || "low").toLowerCase();
  const markText = markLevel === "low" ? "AUTHENTIC" : markLevel === "medium" ? "SUSPECT" : "DEFICIENT";

  const scoreVal = stamp.score !== undefined ? stamp.score : (stamp.confidence_score !== undefined ? stamp.confidence_score : 100);
  const metadata = stamp.metadata || {};
  const fields = stamp.fields || {};

  const stateName = metadata.state || fields.state || "Telangana";
  const certNumber = metadata.certificate_number || fields.serial_or_uin || "N/A";
  const dutyPaid = metadata.duty_amount_paid !== undefined ? metadata.duty_amount_paid : (fields.denomination || 0);
  const minRequired = metadata.minimum_duty_required !== undefined ? metadata.minimum_duty_required : (stamp.minimum_duty_required || 100);
  const deficit = stamp.deficit_cure_amount || metadata.shortfall_deficit || Math.max(0, minRequired - dutyPaid);
  const penalty = stamp.statutory_penalty_estimate || metadata.section_35_penalty || (deficit * 10);

  let checksHtml = "";
  (stamp.checks || []).forEach(c => {
    const badgeClass = `badge-${c.status}`;
    checksHtml += `
      <div class="check">
        <span class="badge ${badgeClass}">${c.status.replace("_", " ")}</span>
        <strong>${escapeHtml(c.name)}</strong>: ${escapeHtml(c.detail)}
      </div>
    `;
  });

  const isDeficient = deficit > 0 || markLevel === "high";

  let plainVerdict = stamp.plain_english_verdict || (
    isDeficient ?
    `⚠️ DEFICIENT STAMP PAPER! You paid Rs. ${dutyPaid}/-, but ${stateName} statutory schedule mandates Rs. ${minRequired}/-. Shortfall of Rs. ${deficit}/-. Under Section 35 of the Indian Stamp Act, this agreement is inadmissible in court and cannot be enforced until deficit + 10x penalty (Rs. ${penalty}/-) is paid.` :
    `✅ FULLY VALID STAMP PAPER! Stamped at Rs. ${dutyPaid}/-, satisfying the statutory minimum of Rs. ${minRequired}/- for ${stateName}. This agreement is legally admissible and enforceable in civil court.`
  );

  let stepsHtml = "";
  const steps = stamp.what_steps_to_take || [];
  if (steps.length > 0) {
    stepsHtml = `
      <div style="margin-top:12px;background:#f8fafc;border:1px solid var(--line);border-radius:6px;padding:10px 12px;">
        <strong style="color:var(--ink);font-size:0.88rem;">🛠️ What Step You Should Take Right Now:</strong>
        <ol style="margin:6px 0 0;padding-left:18px;font-size:0.85rem;color:var(--ink);line-height:1.45;">
          ${steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
        </ol>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="mark ${markLevel}">${markText}</div>
    <h2>1. Stamp Verification &amp; Statutory Duty Report</h2>
    <div class="score">
      <b>${scoreVal}</b>
      <span class="note">/ 100 Authenticity Index</span>
    </div>

    <!-- Plain English Verdict for Normal People -->
    <div class="plain-english-verdict-box ${isDeficient ? 'deficient' : ''}">
      <strong>💡 Plain-English Summary:</strong><br>
      ${escapeHtml(plainVerdict)}
    </div>

    <!-- Exact Duty Calculation Grid -->
    <div class="meta-grid">
      <div class="meta-item"><span>State Schedule</span>${escapeHtml(stateName)}</div>
      <div class="meta-item"><span>Certificate / UIN</span>${escapeHtml(certNumber)}</div>
      <div class="meta-item"><span>Duty Paid on Stamp</span>Rs. ${dutyPaid}</div>
      <div class="meta-item"><span>Statutory Min Required</span>Rs. ${minRequired}</div>
      <div class="meta-item"><span>Shortfall Deficit</span><strong style="color:${deficit > 0 ? 'var(--red)' : 'var(--green)'};">Rs. ${deficit}</strong></div>
      <div class="meta-item"><span>Sec 35 (10x) Penalty</span><strong style="color:${penalty > 0 ? 'var(--red)' : 'var(--muted)'};">Rs. ${penalty}</strong></div>
    </div>

    <!-- Step by Step Actions to Cure -->
    ${stepsHtml}

    <div style="margin-top:14px;">
      <strong style="font-size:0.88rem;color:var(--ink);text-transform:uppercase;">Detailed Verification Checks:</strong>
      ${checksHtml}
    </div>
  `;

  return card;
}

// ============================================================================
// 5. EXACT CONTRACT RISK ANALYZER
// ============================================================================
async function runDirectRisk() {
  const text = document.getElementById("risk-direct-text").value.trim() || SAMPLES.deficient_stamp.text;
  const docTypeVal = document.getElementById("risk-doctype-select")?.value || "rental_agreement";

  const resDiv = document.getElementById("risk-direct-result");
  const btn = document.getElementById("btn-run-risk");
  if (btn) btn.disabled = true;
  resDiv.innerHTML = "<div class='note'>Scanning against statutory checklists for missing rules, unfair indemnities, and lock-in traps...</div>";

  try {
    const formData = new FormData();
    formData.append("text_content", text);
    formData.append("doc_type", docTypeVal);

    const res = await fetch("/risk/analyze", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Risk analysis failed");
    const data = await res.json();
    resDiv.innerHTML = "";
    resDiv.appendChild(createRiskCard(data));
  } catch (err) {
    resDiv.innerHTML = `<div class="note" style="color:var(--red);">Error: ${err.message}</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

function createRiskCard(risk) {
  const card = document.createElement("article");
  const overallClass = (risk.overall_risk_level || risk.overall_risk || "medium").toLowerCase();
  const overallLabel = (risk.overall_risk_level || risk.overall_risk || "medium").toUpperCase();
  const riskScore = risk.risk_score !== undefined ? risk.risk_score : 50;

  // Identified dangerous clauses
  let risksHtml = "";
  (risk.identified_risks || []).forEach(r => {
    const sevClass = (r.severity || "medium").toLowerCase();
    const title = r.title || r.clause_name || "Unfavorable Covenant";
    const danger = r.plain_english_danger || r.explanation || "";
    const grounds = r.statutory_reference || "Indian Contract Act, 1872";
    const remedy = r.suggested_revision || r.remedy || "";

    risksHtml += `
      <div class="risk">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${escapeHtml(title)}</strong>
          <span class="badge badge-${sevClass}">${r.severity} severity</span>
        </div>
        ${r.clause_excerpt && r.clause_excerpt !== "N/A" ? `
          <div style="font-size:0.8rem;background:rgba(0,0,0,0.03);padding:4px 8px;border-left:2px solid var(--muted);margin:4px 0;font-style:italic;">
            "${escapeHtml(r.clause_excerpt)}"
          </div>
        ` : ''}
        <p style="margin:4px 0;font-size:0.9rem;color:var(--red);"><strong>⚠️ Why This Hurts You:</strong> ${escapeHtml(danger)}</p>
        <div class="note"><strong>Statutory Ground:</strong> ${escapeHtml(grounds)}</div>
        <div class="note" style="color:var(--green);margin-top:2px;"><strong>Demand Safe Revision:</strong> "${escapeHtml(remedy)}"</div>
      </div>
    `;
  });

  // Missing clauses
  let missingHtml = "";
  const missing = risk.missing_clauses || [];
  if (missing.length > 0) {
    missingHtml = `
      <div class="missing-rules-container">
        <strong style="color:#78350f;font-size:0.9rem;display:block;margin-bottom:6px;">⚠️ Missing Protective Rules in This Agreement:</strong>
        <p class="note" style="margin:0 0 8px;color:#92400e;">Common people get trapped because these essential protections were left out of the contract:</p>
        ${missing.map(m => `
          <div class="missing-rule-item">
            <span>&bull;</span> <strong>${escapeHtml(m.clause_name)}</strong> (${m.criticality} priority)
            <span class="missing-rule-why">${escapeHtml(m.why_needed_in_plain_words || m.impact)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Steps to take
  let stepsHtml = "";
  const steps = risk.what_steps_to_take || [];
  if (steps.length > 0) {
    stepsHtml = `
      <div style="margin-top:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 12px;">
        <strong style="color:#14532d;font-size:0.9rem;">🛠️ What Step You Should Take Right Now:</strong>
        <ol style="margin:6px 0 0;padding-left:18px;font-size:0.85rem;color:#14532d;line-height:1.45;">
          ${steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
        </ol>
      </div>
    `;
  }

  card.innerHTML = `
    <h2>2. Contract Risk Assessment &amp; Missing Rules</h2>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <span class="badge ${overallClass}" style="font-size:0.9rem;padding:4px 12px;font-weight:700;">${overallLabel} RISK (${riskScore}/100)</span>
      <span class="note">${missing.length} missing protective clauses &bull; ${(risk.identified_risks || []).length} dangerous traps</span>
    </div>

    <!-- Plain English Summary -->
    <div style="background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:10px 12px;font-size:0.88rem;color:var(--ink);line-height:1.45;margin-bottom:12px;">
      ${escapeHtml(risk.plain_english_summary || risk.summary)}
    </div>

    <!-- Missing Clauses -->
    ${missingHtml}

    <!-- Steps to take -->
    ${stepsHtml}

    <!-- Identified Traps -->
    <div style="margin-top:16px;">
      <strong style="font-size:0.88rem;text-transform:uppercase;color:var(--ink);">Identified Dangerous Clauses &amp; Traps</strong>
      ${risksHtml || "<p class='note'>No severe one-sided traps detected.</p>"}
    </div>
  `;

  return card;
}

// ============================================================================
// 6. ACTION ROADMAP ("WHAT STEP SHOULD WE TAKE")
// ============================================================================
async function runDirectActions() {
  const text = document.getElementById("action-direct-text").value.trim() || SAMPLES.deficient_stamp.text;
  const resDiv = document.getElementById("action-direct-result");
  const btn = document.getElementById("btn-run-actions");
  if (btn) btn.disabled = true;
  resDiv.innerHTML = "<div class='note'>Synthesizing prioritized legal action roadmap and step-by-step remedies...</div>";

  try {
    const formData = new FormData();
    formData.append("text_content", text);
    const res = await fetch("/actions/recommend", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Action engine failed");
    const data = await res.json();
    resDiv.innerHTML = "";
    resDiv.appendChild(createActionPlanCard(data));
  } catch (err) {
    resDiv.innerHTML = `<div class="note" style="color:var(--red);">Error: ${err.message}</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

function createActionPlanCard(plan) {
  const card = document.createElement("article");
  const urgencyClass = (plan.action_urgency || "medium").toLowerCase();

  let stepsHtml = "";
  (plan.steps || []).forEach(s => {
    stepsHtml += `
      <div class="step">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <strong>Step ${s.step_number}: ${escapeHtml(s.title)}</strong>
          <span class="badge badge-${s.priority}">${s.priority} priority</span>
        </div>
        <div style="font-size:0.82rem;color:var(--muted);margin-bottom:4px;">
          <strong>Timeframe:</strong> ${escapeHtml(s.timeframe)} &bull; <strong>Statutory Basis:</strong> ${escapeHtml(s.legal_basis)}
        </div>
        <p style="margin:4px 0;font-size:0.9rem;">${escapeHtml(s.description)}</p>
        <div class="note"><strong>Expected Deliverable:</strong> ${escapeHtml(s.deliverable)}</div>
      </div>
    `;
  });

  card.innerHTML = `
    <h2>3. Prioritized Legal Action Roadmap</h2>
    <div style="margin-bottom:12px;">
      <span class="badge ${urgencyClass}" style="font-size:0.88rem;padding:3px 12px;font-weight:700;">${plan.action_urgency.toUpperCase()} ACTION REQUIRED</span>
      <p style="margin:8px 0;color:var(--ink);font-size:0.9rem;line-height:1.45;">${escapeHtml(plan.summary)}</p>
    </div>
    <div>${stepsHtml}</div>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
      <button type="button" class="secondary" onclick="switchTabDirectly('tab-drafting')">✍️ Draft Formal Notice (RPAD) &rarr;</button>
      <button type="button" class="secondary" onclick="switchTabDirectly('tab-advocates')">👨‍⚖️ Book Advocate Consultation &rarr;</button>
    </div>
  `;

  return card;
}

// ============================================================================
// 7. DEADLINE TRACKER TO PAY RENT AS BOND RULES
// ============================================================================
async function loadDeadlines() {
  const container = document.getElementById("deadlines-container");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/deadlines`);
    if (!res.ok) throw new Error("Could not load deadlines");
    const deadlines = await res.json();
    window.deadlinesData = deadlines;

    // Update Hero Banner with nearest rent payment
    const rentDl = deadlines.find(d => d.category === "rent_payment" && d.status !== "completed");
    if (rentDl) {
      const heroAmount = document.getElementById("hero-rent-amount");
      const heroDate = document.getElementById("hero-due-date");
      const heroBadge = document.getElementById("hero-due-badge");
      const heroPill = document.getElementById("hero-countdown-pill");

      if (heroAmount) heroAmount.textContent = rentDl.amount ? `Rs. ${rentDl.amount.toLocaleString()}/-` : "Rs. 35,000/-";
      if (heroDate) heroDate.textContent = `Due on or before ${rentDl.due_date}`;
      if (heroBadge) heroBadge.textContent = rentDl.status.replace("_", " ").toUpperCase();
      if (heroPill) {
        if (rentDl.days_left < 0) {
          heroPill.textContent = `⚠️ Overdue by ${Math.abs(rentDl.days_left)} Days!`;
          heroPill.className = "deadline-countdown-pill";
          heroPill.style.background = "#fee2e2";
          heroPill.style.color = "#991b1b";
        } else if (rentDl.days_left <= 3) {
          heroPill.textContent = `🔔 Due in ${rentDl.days_left} Days`;
          heroPill.className = "deadline-countdown-pill";
          heroPill.style.background = "#fef3c7";
          heroPill.style.color = "#92400e";
        } else {
          heroPill.textContent = `⏳ Due in ${rentDl.days_left} Days`;
          heroPill.className = "deadline-countdown-pill safe";
        }
      }
    }

    if (deadlines.length === 0) {
      container.innerHTML = "<p class='note'>No active deadline reminders. Click below to add one or auto-extract from your agreement.</p>";
      return;
    }

    container.innerHTML = deadlines.map(d => {
      const isCompleted = d.status === "completed";
      const daysText = isCompleted ? "Completed" : (d.days_left < 0 ? `${Math.abs(d.days_left)}d Overdue` : `${d.days_left}d Left`);
      const statusClass = `status-${d.status}`;
      const badgeClass = `badge-${d.status}`;

      return `
        <div class="deadline-card ${statusClass}">
          <div class="deadline-top-row">
            <div>
              <span class="deadline-title">${escapeHtml(d.title)}</span>
              ${d.amount ? `<strong style="margin-left:8px;color:var(--ink);">Rs. ${d.amount.toLocaleString()}</strong>` : ''}
            </div>
            <span class="deadline-days-badge ${badgeClass}">${daysText}</span>
          </div>

          <div class="deadline-meta">
            <span>📅 Due: <strong>${d.due_date}</strong></span>
            <span>🔁 Recurrence: ${d.recurrence}</span>
            <span>🏷️ Category: ${d.category.replace('_', ' ')}</span>
          </div>

          ${d.plain_warning && !isCompleted ? `
            <div class="deadline-warning-text">
              ${escapeHtml(d.plain_warning)}
            </div>
          ` : ''}

          ${d.notes ? `<p class="note" style="margin:4px 0;">${escapeHtml(d.notes)}</p>` : ''}

          <div class="deadline-actions-bar">
            ${!isCompleted ? `
              <button type="button" class="btn-deadline-action primary" onclick="updateDeadlineStatus(${d.id}, 'completed')">
                ✓ Mark Paid / Done
              </button>
            ` : `
              <button type="button" class="btn-deadline-action" onclick="updateDeadlineStatus(${d.id}, 'upcoming')">
                ↻ Mark Unpaid
              </button>
            `}
            <button type="button" class="btn-deadline-action danger" onclick="deleteDeadline(${d.id})">
              🗑️ Delete
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<p class="note" style="color:var(--red);">Could not load deadlines: ${err.message}</p>`;
  }
}

async function updateDeadlineStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/deadlines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error("Could not update deadline status");
    loadDeadlines();
  } catch (err) {
    alert("Error updating deadline: " + err.message);
  }
}

async function deleteDeadline(id) {
  if (!confirm("Are you sure you want to delete this reminder?")) return;
  try {
    const res = await fetch(`${API_BASE}/deadlines/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Could not delete deadline");
    loadDeadlines();
  } catch (err) {
    alert("Error deleting deadline: " + err.message);
  }
}

async function submitNewDeadline() {
  const title = document.getElementById("new-dl-title")?.value?.trim();
  const dateVal = document.getElementById("new-dl-date")?.value;
  const amountVal = parseFloat(document.getElementById("new-dl-amount")?.value) || 0;
  const catVal = document.getElementById("new-dl-cat")?.value || "rent_payment";
  const notesVal = document.getElementById("new-dl-notes")?.value?.trim() || "";

  if (!title || !dateVal) {
    alert("Please provide a title and due date.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/deadlines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        due_date: dateVal,
        amount: amountVal,
        category: catVal,
        notes: notesVal
      })
    });
    if (!res.ok) throw new Error("Failed to create deadline");
    document.getElementById("new-dl-title").value = "";
    document.getElementById("new-dl-notes").value = "";
    loadDeadlines();
  } catch (err) {
    alert("Error creating deadline: " + err.message);
  }
}

async function autoExtractDeadlines() {
  const text = document.getElementById("risk-direct-text")?.value?.trim() || 
               document.getElementById("stamp-direct-text")?.value?.trim() || 
               SAMPLES.ts_stamp_ok.text;

  try {
    const res = await fetch(`${API_BASE}/deadlines/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, document_id: currentDocId })
    });
    if (!res.ok) throw new Error("Could not extract deadlines");
    alert("✓ Deadlines successfully parsed from agreement and added to your tracker!");
    loadDeadlines();
  } catch (err) {
    alert("Extraction error: " + err.message);
  }
}

// ============================================================================
// 8. NEARBY ADVOCATES & APPOINTMENTS (WITH PENDING APPOINTMENTS)
// ============================================================================
const PROJECT_DEMO_MAIL = "sureshtakur194@gmail.com";

async function loadAdvocates() {
  const listEl = document.getElementById("advocates-list");
  if (!listEl) return;

  const city = document.getElementById("adv-city") ? document.getElementById("adv-city").value : "";
  const spec = document.getElementById("adv-spec") ? document.getElementById("adv-spec").value : "";

  let url = `${API_BASE}/advocates/nearby?`;
  if (city) url += `city=${encodeURIComponent(city)}&`;
  if (spec) url += `specialization=${encodeURIComponent(spec)}&`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load advocates");
    const data = await res.json();

    data.forEach(adv => { adv.email = PROJECT_DEMO_MAIL; });
    window.advocatesData = data;

    if (data.length === 0) {
      listEl.innerHTML = "<p class='note'>No advocates found matching your filter criteria.</p>";
      return;
    }

    listEl.innerHTML = data.map(adv => `
      <div class="advocate-item" id="advocate-item-${adv.id}">
        <div class="advocate-card">
          <div class="advocate-info">
            <h3 style="margin:0 0 4px;font-size:1.05rem;color:var(--ink);">${escapeHtml(adv.name)}</h3>
            <p style="margin:2px 0 4px;"><strong>${escapeHtml(adv.specialization)}</strong> &bull; ${escapeHtml(adv.city)}, ${escapeHtml(adv.state)}</p>
            <p class="note" style="margin:2px 0;">${escapeHtml(adv.address || '')}</p>
            <p class="note" style="margin:2px 0;">Bar ID: ${escapeHtml(adv.bar_council_id || 'Verified')} &bull; Experience: ${adv.experience_years} yrs &bull; Rating: ⭐ ${adv.rating}</p>
          </div>
          <div class="advocate-action" style="text-align:right;">
            <div class="advocate-fee">Rs. ${adv.consultation_fee.toFixed(0)}</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px;">Consultation</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <button type="button" onclick="openBookingModal(${adv.id})" style="padding:6px 12px;font-size:0.82rem;margin:0;font-weight:600;">
                📅 Book Appointment
              </button>
              <button type="button" class="secondary" id="btn-call-chamber-${adv.id}" onclick="handleCallChamber(${adv.id})" style="padding:5px 12px;font-size:0.8rem;margin:0;">
                Call Chamber
              </button>
            </div>
          </div>
        </div>

        <div id="adv-mail-box-${adv.id}" class="adv-chamber-mail-panel" style="display:none;"></div>
      </div>
    `).join("");
  } catch (err) {
    listEl.innerHTML = `<p class="note">Advocate directory ready. ${err.message}</p>`;
  }
}

function switchAdvSubTab(subTab) {
  currentAdvSubTab = subTab;
  const btnDir = document.getElementById("btn-subtab-directory");
  const btnApp = document.getElementById("btn-subtab-appointments");
  const btnPen = document.getElementById("btn-subtab-pending");

  if (btnDir) btnDir.classList.remove("active");
  if (btnApp) btnApp.classList.remove("active");
  if (btnPen) btnPen.classList.remove("active");

  const viewDir = document.getElementById("adv-view-directory");
  const viewApp = document.getElementById("adv-view-appointments");

  if (subTab === "directory") {
    if (btnDir) btnDir.classList.add("active");
    if (viewDir) viewDir.style.display = "block";
    if (viewApp) viewApp.style.display = "none";
  } else if (subTab === "appointments") {
    if (btnApp) btnApp.classList.add("active");
    if (viewDir) viewDir.style.display = "none";
    if (viewApp) viewApp.style.display = "block";
    document.getElementById("appointments-sub-header").textContent = "All Chamber Appointments";
    loadAppointments();
  } else if (subTab === "pending") {
    if (btnPen) btnPen.classList.add("active");
    if (viewDir) viewDir.style.display = "none";
    if (viewApp) viewApp.style.display = "block";
    document.getElementById("appointments-sub-header").textContent = "⏳ Pending Appointments Awaiting Confirmation";
    loadAppointments("pending");
  }
}

async function loadAppointments(filterStatus = null) {
  const container = document.getElementById("appointments-list-container");
  if (!container) return;

  try {
    let url = `${API_BASE}/advocates/appointments`;
    if (filterStatus) url += `?status=${filterStatus}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load appointments");
    const data = await res.json();
    window.appointmentsData = data;

    // Update pending badge count
    const pendingList = data.filter(a => a.status === "pending");
    const badge = document.getElementById("pending-badge-count");
    if (badge) badge.textContent = pendingList.length;

    if (data.length === 0) {
      container.innerHTML = `<p class='note'>No appointments found ${filterStatus ? 'with status ' + filterStatus : ''}. Book one with an advocate above!</p>`;
      return;
    }

    container.innerHTML = data.map(app => {
      const statusClass = `status-${app.status}`;
      const statusBadgeClass = app.status === "pending" ? "badge-due_soon" : (app.status === "confirmed" ? "badge-completed" : "badge-upcoming");
      const statusText = app.status === "pending" ? "⏳ Pending Approval" : (app.status === "confirmed" ? "✅ Confirmed" : app.status.toUpperCase());

      return `
        <div class="appointment-card ${statusClass}">
          <div class="appointment-header">
            <div>
              <div class="appointment-advocate-name">${escapeHtml(app.advocate_name || 'Advocate')}</div>
              <div class="note">${escapeHtml(app.advocate_specialization || 'Contract Law')} &bull; ${escapeHtml(app.advocate_city || '')}</div>
            </div>
            <span class="deadline-days-badge ${statusBadgeClass}">${statusText}</span>
          </div>

          <div class="appointment-subject">Topic: ${escapeHtml(app.case_subject)}</div>
          <div class="appointment-meta-row">
            <span>📅 <strong>${escapeHtml(app.appointment_date)}</strong> at <strong>${escapeHtml(app.time_slot)}</strong></span>
            <span>📍 ${escapeHtml(app.consultation_type)}</span>
            <span>💰 Fee: Rs. ${app.fee}</span>
          </div>

          ${app.case_notes ? `<p class="note" style="margin:4px 0;"><strong>Case Facts:</strong> ${escapeHtml(app.case_notes)}</p>` : ''}
          <div class="note"><strong>Client Contact:</strong> ${escapeHtml(app.client_name)} &bull; ${escapeHtml(app.client_phone)} &bull; ${escapeHtml(app.client_email)}</div>

          <div class="appointment-controls-row">
            <div style="display:flex;gap:6px;">
              ${app.status === "pending" ? `
                <button type="button" class="btn-deadline-action primary" onclick="updateAppointmentStatus(${app.id}, 'confirmed')">
                  ✓ Confirm Booking
                </button>
              ` : ''}
              ${app.status !== "completed" ? `
                <button type="button" class="btn-deadline-action" onclick="updateAppointmentStatus(${app.id}, 'completed')">
                  🏁 Mark Completed
                </button>
              ` : ''}
              <button type="button" class="btn-deadline-action danger" onclick="updateAppointmentStatus(${app.id}, 'cancelled')">
                ✕ Cancel
              </button>
            </div>
            <a href="tel:${app.advocate_phone || '+919848022338'}" style="text-decoration:none;">
              <button type="button" class="btn-deadline-action" style="padding:3px 8px;">
                📞 Call Advocate
              </button>
            </a>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<p class="note" style="color:var(--red);">Error loading appointments: ${err.message}</p>`;
  }
}

async function updateAppointmentStatus(appId, status) {
  try {
    const res = await fetch(`${API_BASE}/advocates/appointments/${appId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status })
    });
    if (!res.ok) throw new Error("Could not update appointment status");
    loadAppointments(currentAdvSubTab === "pending" ? "pending" : null);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function openBookingModal(advId) {
  const adv = (window.advocatesData || []).find(a => a.id === advId);
  const modal = document.getElementById("booking-modal-overlay");
  if (!modal) return;

  document.getElementById("book-adv-id").value = advId;
  if (adv) {
    document.getElementById("modal-advocate-name").textContent = `Book Consultation with ${adv.name}`;
    document.getElementById("modal-advocate-sub").textContent = `${adv.specialization} &bull; ${adv.city} &bull; Fee: Rs. ${adv.consultation_fee}`;
  }

  // Pre-fill subject if active
  const subjectInput = document.getElementById("book-subject");
  if (subjectInput && !subjectInput.value) {
    subjectInput.value = "Rental Agreement Review & Stamp Duty Verification";
  }

  modal.style.display = "flex";
}

function closeBookingModal() {
  const modal = document.getElementById("booking-modal-overlay");
  if (modal) modal.style.display = "none";
}

async function submitAppointmentBooking(e) {
  e.preventDefault();
  const advId = parseInt(document.getElementById("book-adv-id").value);
  const clientName = document.getElementById("book-client-name").value.trim();
  const clientPhone = document.getElementById("book-client-phone").value.trim();
  const clientEmail = document.getElementById("book-client-email").value.trim();
  const consultType = document.getElementById("book-consult-type").value;
  const dateVal = document.getElementById("book-date").value;
  const timeSlot = document.getElementById("book-time-slot").value;
  const subjectVal = document.getElementById("book-subject").value.trim();
  const notesVal = document.getElementById("book-notes").value.trim();

  try {
    const res = await fetch(`${API_BASE}/advocates/${advId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        advocate_id: advId,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        consultation_type: consultType,
        appointment_date: dateVal,
        time_slot: timeSlot,
        case_subject: subjectVal,
        case_notes: notesVal
      })
    });

    if (!res.ok) throw new Error("Could not book appointment");
    const data = await res.json();
    closeBookingModal();
    alert(`✓ Consultation appointment request booked successfully for ${dateVal} at ${timeSlot}! It is now listed under Pending Appointments.`);

    // Switch to pending appointments view to show user their booking
    switchAdvSubTab("pending");

  } catch (err) {
    alert("Booking error: " + err.message);
  }
}

function handleCallChamber(advId) {
  const adv = (window.advocatesData || []).find(a => a.id === advId);
  if (!adv) return;

  const mailBox = document.getElementById(`adv-mail-box-${advId}`);
  if (!mailBox) return;

  if (mailBox.style.display === "block") {
    mailBox.style.display = "none";
    return;
  }

  document.querySelectorAll(".adv-chamber-mail-panel").forEach(p => p.style.display = "none");

  const clientName = document.getElementById("notice-sender")?.value?.trim() || "Sri Suresh Thakur, Hyderabad";
  const recipientName = document.getElementById("notice-recipient")?.value?.trim() || "M/s Cloud Matrix Pvt Ltd";
  const disputeName = document.getElementById("notice-dispute")?.value?.trim() || "Breach of Tenancy & Unpaid Rent";
  const amountVal = document.getElementById("notice-amount")?.value?.trim() || "Rs. 1,80,000/-";
  const factsVal = document.getElementById("notice-facts")?.value?.trim() || "Tenant defaulted on monthly rent for 3 consecutive months.";

  const mailSubject = `Urgent Legal Consultation: ${disputeName} - ${clientName}`;
  const mailBody = `Respected ${adv.name},

I would like to engage your chamber for legal consultation regarding a matter in ${adv.city}, ${adv.state}.

CASE DETAILS:
• Client: ${clientName}
• Counterparty: ${recipientName}
• Dispute: ${disputeName}
• Claim: ${amountVal}

FACTS:
${factsVal}

I have prepared the draft formal legal notice / case file via LexAdvisor AI and would appreciate your advice and court representation.

Sincerely,
${clientName}
Phone: +91 98490 11223
Email: ${PROJECT_DEMO_MAIL}`;

  mailBox.innerHTML = `
    <div class="mail-panel-header">
      <strong style="color:var(--ink);font-size:0.95rem;">Consultation Brief &mdash; ${escapeHtml(adv.name)}</strong>
      <button type="button" onclick="closeChamberMail(${adv.id})" style="background:transparent;border:none;cursor:pointer;font-size:1.2rem;color:var(--muted);padding:0 4px;margin:0;">&times;</button>
    </div>

    <div class="mail-field-row">
      <label>To Chamber Mail</label>
      <input type="email" id="adv-mail-to-${adv.id}" value="${escapeHtml(PROJECT_DEMO_MAIL)}" readonly style="background:#f1f5f9;font-weight:600;color:var(--ink);">
    </div>

    <div class="mail-field-row">
      <label>Subject</label>
      <input type="text" id="adv-mail-sub-${adv.id}" value="${escapeHtml(mailSubject)}">
    </div>

    <div class="mail-field-row">
      <label>Consultation Message</label>
      <textarea id="adv-mail-body-${adv.id}" rows="7" style="font-family:inherit;font-size:0.86rem;line-height:1.45;">${escapeHtml(mailBody)}</textarea>
    </div>

    <div class="mail-action-buttons">
      <button type="button" class="btn-launch-mail" onclick="sendChamberMailto(${adv.id})">
        🚀 Launch Mail App
      </button>
      <button type="button" class="secondary" onclick="copyChamberMail(${adv.id})" style="margin:0;padding:8px 12px;font-size:0.82rem;">
        📋 Copy Text
      </button>
      <a href="tel:${adv.phone}" style="text-decoration:none;">
        <button type="button" class="secondary" style="margin:0;padding:8px 12px;font-size:0.82rem;">
          📞 Dial ${escapeHtml(adv.phone)}
        </button>
      </a>
      <span id="adv-mail-toast-${adv.id}" style="font-size:0.82rem;color:#15803d;font-weight:600;"></span>
    </div>
  `;

  mailBox.style.display = "block";
  mailBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeChamberMail(advId) {
  const mailBox = document.getElementById(`adv-mail-box-${advId}`);
  if (mailBox) mailBox.style.display = "none";
}

function sendChamberMailto(advId) {
  const to = PROJECT_DEMO_MAIL;
  const sub = document.getElementById(`adv-mail-sub-${advId}`)?.value || "";
  const body = document.getElementById(`adv-mail-body-${advId}`)?.value || "";

  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;

  const toast = document.getElementById(`adv-mail-toast-${advId}`);
  if (toast) {
    toast.textContent = "✓ Mail client triggered!";
    setTimeout(() => { if (toast) toast.textContent = ""; }, 3000);
  }
}

function copyChamberMail(advId) {
  const to = PROJECT_DEMO_MAIL;
  const sub = document.getElementById(`adv-mail-sub-${advId}`)?.value || "";
  const body = document.getElementById(`adv-mail-body-${advId}`)?.value || "";
  const fullText = `TO: ${to}\nSUBJECT: ${sub}\n\n${body}`;

  navigator.clipboard.writeText(fullText).then(() => {
    const toast = document.getElementById(`adv-mail-toast-${advId}`);
    if (toast) {
      toast.textContent = "✓ Copied to clipboard!";
      setTimeout(() => { if (toast) toast.textContent = ""; }, 3000);
    }
  });
}

// ============================================================================
// 9. CUSTOMER DOCUMENT ANALYSIS HISTORY
// ============================================================================
async function loadCustomerHistory() {
  const container = document.getElementById("customer-history-container");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/analysis/history`);
    if (!res.ok) throw new Error("Could not load history");
    const history = await res.json();
    window.historyData = history;

    if (history.length === 0) {
      container.innerHTML = "<p class='note'>No previously analyzed documents found. Analyze an agreement in the Stamp or Risk tabs to view it here.</p>";
      return;
    }

    container.innerHTML = history.map(item => {
      const riskScore = item.risk ? (item.risk.score ?? 50) : 50;
      const riskLevel = item.risk ? String(item.risk.overall_risk || "MEDIUM").toUpperCase() : "MEDIUM";
      const riskBadgeClass = riskLevel === "HIGH" ? "badge-overdue" : (riskLevel === "LOW" ? "badge-completed" : "badge-due_soon");

      const stampStatus = item.stamp ? (item.stamp.status || "Pending Audit") : "Pending Audit";
      const stampBadgeClass = item.stamp && (item.stamp.score ?? 0) >= 75 ? "badge-completed" : "badge-overdue";

      return `
        <div class="history-item-card" id="history-item-${item.document_id}">
          <div class="history-item-header">
            <div>
              <h3 class="history-doc-title">📄 ${escapeHtml(item.filename || 'Document')}</h3>
              <div class="note" style="margin-top:2px;">Category: ${escapeHtml((item.doc_type || 'agreement').replace(/_/g, ' '))} &bull; State: ${escapeHtml(item.state || 'TS')} &bull; ${escapeHtml(item.uploaded_at || '')}</div>
            </div>
            <span class="deadline-days-badge ${riskBadgeClass}">${riskLevel} RISK (${riskScore}/100)</span>
          </div>

          <div class="history-badges-row">
            <span class="deadline-days-badge ${stampBadgeClass}">Stamp: ${escapeHtml(stampStatus)}</span>
            ${item.risk ? `<span class="deadline-days-badge badge-upcoming">${item.risk.identified_risks_count} Traps Found</span>` : ''}
            ${item.risk ? `<span class="deadline-days-badge badge-due_soon">${item.risk.missing_clauses_count} Missing Rules</span>` : ''}
          </div>

          ${item.risk && item.risk.summary ? `
            <div class="history-summary-text">${escapeHtml(item.risk.summary)}</div>
          ` : ''}

          <div class="history-actions-row">
            <button type="button" class="btn-deadline-action primary" onclick="reloadHistoryDocument(${item.document_id})">
              👁️ View Full Analysis &amp; Action Plan
            </button>
            <button type="button" class="btn-deadline-action danger" onclick="deleteHistoryDocument(${item.document_id})">
              🗑️ Delete
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    container.innerHTML = `<p class="note" style="color:var(--red);">Error loading history: ${err.message}</p>`;
  }
}

async function reloadHistoryDocument(docId) {
  try {
    const res = await fetch(`${API_BASE}/analysis/history/${docId}`);
    if (!res.ok) throw new Error("Could not load report");
    const data = await res.json();

    // Render into Stamp Tab
    if (data.stamp) {
      const stampRes = document.getElementById("stamp-direct-result");
      if (stampRes) {
        stampRes.innerHTML = "";
        stampRes.appendChild(createStampCard(data.stamp));
      }
    }

    // Render into Risk Tab
    if (data.risk) {
      const riskRes = document.getElementById("risk-direct-result");
      if (riskRes) {
        riskRes.innerHTML = "";
        riskRes.appendChild(createRiskCard(data.risk));
      }
    }

    // Render into Actions Tab
    if (data.plan) {
      const actionRes = document.getElementById("action-direct-result");
      if (actionRes) {
        actionRes.innerHTML = "";
        actionRes.appendChild(createActionPlanCard(data.plan));
      }
    }

    // Set current document id
    currentDocId = docId;

    // Switch to Stamp Tab for immediate viewing
    switchTabDirectly("tab-stamp");
    alert(`✓ Reloaded complete analysis report for "${data.filename}"! Switch between Stamp, Risk, and Action Roadmap tabs to inspect.`);

  } catch (err) {
    alert("Error reloading report: " + err.message);
  }
}

async function deleteHistoryDocument(docId) {
  if (!confirm("Delete this analysis record from customer history?")) return;
  try {
    const res = await fetch(`${API_BASE}/analysis/history/${docId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Could not delete history record");
    loadCustomerHistory();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// ============================================================================
// 10. LEGAL NOTICE GENERATOR & REPORTLAB PDF DOWNLOAD
// ============================================================================
async function generateDocument(type) {
  const resultDiv = document.getElementById("gen-result");
  if (!resultDiv) return;
  resultDiv.innerHTML = `
    <div style="padding:12px;background:rgba(0,0,0,0.03);border-radius:6px;margin-top:14px;">
      <strong style="color:var(--ink);">Drafting formal notice under Indian legal standards...</strong>
      <div class="note" style="margin-top:4px;">Compiling statutory recitals, Section 106 TP Act cure period, and generating court-ready ReportLab PDF...</div>
    </div>
  `;

  try {
    const senderVal = document.getElementById("notice-sender")?.value?.trim() || "Sri Suresh Thakur, Hyderabad";
    const recipientVal = document.getElementById("notice-recipient")?.value?.trim() || "M/s Cloud Matrix Pvt Ltd";
    const disputeVal = document.getElementById("notice-dispute")?.value?.trim() || "Breach of Tenancy & Unpaid Rent";
    const factsVal = document.getElementById("notice-facts")?.value?.trim() || "Tenant defaulted on monthly rent for 3 consecutive months.";
    const amountVal = document.getElementById("notice-amount")?.value?.trim() || "Rs. 1,80,000/-";
    const daysVal = parseInt(document.getElementById("notice-days")?.value) || 15;
    const stateVal = document.getElementById("notice-state")?.value || "TS";

    const payload = {
      sender: senderVal,
      recipient: recipientVal,
      dispute_type: disputeVal,
      facts: factsVal,
      amount: amountVal,
      deadline_days: daysVal,
      state: stateVal
    };

    const res = await fetch(`${API_BASE}/generate/notice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Notice generation failed: ${res.statusText}`);
    const doc = await res.json();

    // Auto-download PDF
    try {
      const autoLink = document.createElement("a");
      autoLink.href = doc.pdf_download_url;
      autoLink.download = `Legal_Notice_${doc.id}.pdf`;
      autoLink.target = "_blank";
      document.body.appendChild(autoLink);
      autoLink.click();
      document.body.removeChild(autoLink);
    } catch (dlErr) {
      console.warn("Auto download triggered link:", dlErr);
    }

    resultDiv.innerHTML = `
      <div class="notice-result-card">
        <div class="download-callout-bar">
          <div>
            <span class="badge badge-pass" style="font-size:0.8rem;padding:3px 8px;">✓ Legal Notice Ready</span>
            <strong style="color:var(--ink);display:block;margin-top:4px;">Official Court-Ready PDF Generated &amp; Downloading</strong>
            <span class="note" style="font-size:0.8rem;">Includes Chamber Letterhead, RPAD dispatch tag, Ref No., and dual signatures.</span>
          </div>
          <div>
            <a href="${doc.pdf_download_url}" download="Legal_Demand_Notice_${doc.id}.pdf" class="btn-pdf-download">
              📥 Download Court-Ready PDF
            </a>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h3 style="margin:0;font-size:1.05rem;color:var(--ink);">${escapeHtml(doc.title)}</h3>
          <div style="display:flex;gap:6px;">
            <button type="button" class="secondary" onclick="window.open('${doc.pdf_download_url}', '_blank')" style="padding:5px 10px;font-size:0.8rem;margin:0;">
              👁️ View PDF
            </button>
            <button type="button" class="secondary" id="btn-copy-notice" onclick="copyNoticeText()" style="padding:5px 10px;font-size:0.8rem;margin:0;">
              📋 Copy Text
            </button>
          </div>
        </div>

        <pre id="notice-text-content" style="white-space:pre-wrap;background:#fafbfc;border:1px solid var(--line);padding:14px;border-radius:6px;max-height:260px;overflow-y:auto;font-family:inherit;font-size:0.88rem;line-height:1.5;color:var(--ink);">${escapeHtml(doc.content)}</pre>

        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <a href="${doc.pdf_download_url}" download="Legal_Demand_Notice_${doc.id}.pdf" style="text-decoration:none;">
            <button type="button" class="btn-pdf-download">📥 Download Official PDF</button>
          </a>
          <button type="button" class="secondary" onclick="switchTabDirectly('tab-advocates')" style="padding:9px 14px;font-size:0.88rem;margin:0;">
            👨‍⚖️ Book Consultation with Advocate &rarr;
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `
      <div style="padding:14px;background:rgba(179,38,30,0.08);border:1px solid var(--red);border-radius:6px;margin-top:14px;">
        <strong style="color:var(--red);">Drafting Error:</strong>
        <p style="margin:4px 0 0;font-size:0.88rem;color:var(--ink);">${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function copyNoticeText() {
  const textEl = document.getElementById("notice-text-content");
  if (!textEl) return;
  navigator.clipboard.writeText(textEl.textContent).then(() => {
    const btn = document.getElementById("btn-copy-notice");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "✓ Copied!";
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  });
}

// ============================================================================
// 11. LEGAL AI COUNSEL CHATBOT FOR COMMON CITIZENS
// ============================================================================
async function handleChatDocumentUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const chatBox = document.getElementById("chat-messages");

  // User upload badge in chat
  const userDiv = document.createElement("div");
  userDiv.className = "chat-msg user";
  userDiv.innerHTML = `📄 <strong>Uploaded Document:</strong> ${escapeHtml(file.name)} (${(file.size / 1024).toFixed(1)} KB)`;
  chatBox.appendChild(userDiv);

  // Assistant working message
  const aiDiv = document.createElement("div");
  aiDiv.className = "chat-msg assistant";
  aiDiv.innerHTML = `<em>Translating "${escapeHtml(file.name)}" into simple, plain-English chunks, checking missing rules, and extracting action steps for you...</em>`;
  chatBox.appendChild(aiDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", "rental_agreement");
  formData.append("state", "TS");

  try {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Document upload failed");
    const data = await res.json();
    currentDocId = data.id;

    const ctxBadge = document.getElementById("chat-context-status");
    if (ctxBadge) ctxBadge.textContent = `Doc: ${file.name}`;

    // Render plain-English simplified chunks for common citizens
    const chunks = data.simplified_chunks || [];
    let chunksHtml = `
      <div style="margin-bottom:8px;">
        <span class="badge badge-pass" style="font-size:0.8rem;padding:3px 8px;">✓ Document Simplified for Everyday Citizens</span>
        <strong style="color:var(--ink);display:block;margin-top:6px;font-size:1.05rem;">Here is what your document actually means in simple everyday words:</strong>
        <p class="note" style="margin:4px 0 10px;">We broke down the complex legal jargon into easy-to-understand chunks so you know exactly where you stand.</p>
      </div>
    `;

    if (chunks.length === 0) {
      chunksHtml += `
        <div class="plain-chunk-card chunk-safe">
          <div class="chunk-title">
            <span>📄 Document Received &amp; Ready</span>
          </div>
          <div class="chunk-text">
            Your document has been uploaded and indexed. You can ask any question below (e.g., about rent deadlines, missing clauses, or deposit refund rules).
          </div>
        </div>
      `;
    }

    chunks.forEach(chunk => {
      const summaryText = String(chunk.plain_summary || chunk.plain_explanation || chunk.text || "");
      const summaryLower = summaryText.toLowerCase();
      const chunkId = String(chunk.id || chunk.chunk_id || "").toLowerCase();
      const chunkTitle = String(chunk.title || chunk.badge || "Agreement Section");
      const takeaway = chunk.key_takeaway || "";

      const isRisk = summaryLower.includes("penalty") || 
                     summaryLower.includes("risk") || 
                     summaryLower.includes("forfeited") ||
                     summaryLower.includes("breach") ||
                     chunkId.includes("risk");
      const isMoney = chunkId.includes("money") || 
                      chunkId.includes("deposit") || 
                      summaryLower.includes("deposit") || 
                      summaryLower.includes("rent");
      const cardType = isRisk ? "chunk-risk" : isMoney ? "chunk-money" : "chunk-safe";

      chunksHtml += `
        <div class="plain-chunk-card ${cardType}">
          <div class="chunk-title">
            <span>${escapeHtml(chunkTitle)}</span>
            ${chunk.badge ? `<span class="badge" style="font-size:0.75rem;">${escapeHtml(chunk.badge)}</span>` : ''}
          </div>
          <div class="chunk-text">
            ${formatMarkdown(summaryText)}
          </div>
          ${takeaway ? `
            <div class="${isRisk ? 'chunk-box-warning' : 'chunk-box-takeaway'}">
              <strong>💡 What you need to know:</strong> ${escapeHtml(takeaway)}
            </div>
          ` : ''}
        </div>
      `;
    });

    // Add callout for Missing Rules & What Steps to Take
    chunksHtml += `
      <div style="margin-top:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;">
        <strong style="color:#78350f;font-size:0.95rem;">⚠️ Missing Rules &amp; What Steps Should You Take?</strong>
        <p style="margin:4px 0 10px;font-size:0.86rem;color:#92400e;">
          Common people often get trapped by rules that are missing from their contract (like 24-hr landlord visit notice, grace period, and deposit refund receipts).
        </p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="chip-btn" onclick="sendPromptChip('What missing rules should I check for in this document?')">
            🔍 Check Missing Rules
          </button>
          <button type="button" class="chip-btn" onclick="sendPromptChip('What step should we take for this agreement?')">
            🛠️ What Steps Should I Take?
          </button>
          <button type="button" class="chip-btn" onclick="sendPromptChip('What is the deadline to pay rent and bond rules?')">
            ⏰ Rent &amp; Bond Rules
          </button>
        </div>
      </div>
    `;

    aiDiv.innerHTML = chunksHtml;

    // Refresh history and deadlines in background
    loadCustomerHistory();
    loadDeadlines();

  } catch (err) {
    aiDiv.innerHTML = `<span style="color:var(--red);">⚠️ Could not process document: ${escapeHtml(err.message)}</span>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const query = input.value.trim();
  if (!query) return;

  const chatBox = document.getElementById("chat-messages");

  // User message
  const userDiv = document.createElement("div");
  userDiv.className = "chat-msg user";
  userDiv.textContent = query;
  chatBox.appendChild(userDiv);
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Assistant placeholder
  const aiDiv = document.createElement("div");
  aiDiv.className = "chat-msg assistant";
  aiDiv.textContent = "Analyzing query in plain-English legal context...";
  chatBox.appendChild(aiDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, document_id: currentDocId })
    });
    if (!res.ok) throw new Error("Chat request failed");
    const data = await res.json();
    aiDiv.innerHTML = formatMarkdown(data.content);
  } catch (err) {
    aiDiv.textContent = `Error: ${err.message}`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendPromptChip(text) {
  const input = document.getElementById("chat-input");
  if (input) {
    input.value = text;
    sendChatMessage();
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMarkdown(text) {
  if (!text) return "";
  let formatted = escapeHtml(text)
    .replace(/^### (.*$)/gim, '<h4 style="margin:8px 0 4px;color:var(--ink);font-size:0.98rem;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="margin:10px 0 4px;color:var(--ink);font-size:1.05rem;">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="margin:12px 0 6px;color:var(--ink);font-size:1.15rem;">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\* (.*$)/gim, '<div style="margin-left:12px;margin-bottom:3px;display:flex;gap:6px;"><span>&bull;</span><span>$1</span></div>')
    .replace(/^- (.*$)/gim, '<div style="margin-left:12px;margin-bottom:3px;display:flex;gap:6px;"><span>&bull;</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return formatted;
}
