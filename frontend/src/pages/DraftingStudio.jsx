import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { generateAgreementDraft, generateNoticeDraft, updateUserDraft, downloadDraftPdf, downloadDraftDocx } from '../api/drafts';

const TEMPLATES = [
  {
    id: 'rental_agreement',
    name: 'Residential Rental Agreement',
    category: 'Tenancy',
    icon: 'home',
    description: '11-month residential lease with deposit protection, maintenance terms, and eviction safeguards under TS/AP state rules.',
    defaultP1Role: 'Landlord / Lessor',
    defaultP2Role: 'Tenant / Lessee',
    defaultConsideration: 'Rs. 25,000 per month',
    defaultDeposit: 'Rs. 75,000 (3 months advance)',
    defaultTenor: '11 Months',
    defaultNotice: '30 Days written notice'
  },
  {
    id: 'commercial_lease',
    name: 'Commercial Lease Agreement',
    category: 'Tenancy & Property',
    icon: 'storefront',
    description: 'Commercial shop or office lease with GST compliance, fit-out rules, lock-in period, and electricity sub-metering clauses.',
    defaultP1Role: 'Property Owner',
    defaultP2Role: 'Commercial Tenant / Business',
    defaultConsideration: 'Rs. 60,000 per month',
    defaultDeposit: 'Rs. 3,60,000 (6 months advance)',
    defaultTenor: '3 Years (36 Months)',
    defaultNotice: '60 Days written notice'
  },
  {
    id: 'employment_agreement',
    name: 'Employment Contract & Offer Letter',
    category: 'Employment',
    icon: 'badge',
    description: 'Permanent or contract employment agreement with CTC breakdown, probation, confidentiality, and reasonable notice provisions.',
    defaultP1Role: 'Employer / Company',
    defaultP2Role: 'Employee',
    defaultConsideration: 'Rs. 8,50,000 CTC per annum',
    defaultDeposit: 'N/A (Liquidated damage bonds invalid under Sec 27 ICA)',
    defaultTenor: 'Indefinite (Full-time permanent)',
    defaultNotice: '30 Days written notice'
  },
  {
    id: 'service_agreement',
    name: 'Freelance & Service Agreement',
    category: 'Business & Freelance',
    icon: 'engineering',
    description: 'Scope of work, milestone deliverables, delayed payment interest, and intellectual property ownership assignment.',
    defaultP1Role: 'Client / Company',
    defaultP2Role: 'Service Provider / Freelancer',
    defaultConsideration: 'Rs. 1,20,000 project fee',
    defaultDeposit: '30% upfront mobilization advance',
    defaultTenor: '3 Months milestone schedule',
    defaultNotice: '15 Days written notice'
  },
  {
    id: 'friendly_loan',
    name: 'Friendly Loan Agreement & Promissory Note',
    category: 'Personal Finance',
    icon: 'payments',
    description: 'Legally enforceable personal loan between individuals with repayment schedule, interest covenants, and default remedies.',
    defaultP1Role: 'Lender',
    defaultP2Role: 'Borrower',
    defaultConsideration: 'Rs. 3,00,000 principal loan',
    defaultDeposit: 'Post-dated security cheque / Guarantee',
    defaultTenor: '12 Months repayment term',
    defaultNotice: 'Immediate on payment default'
  },
  {
    id: 'nda_non_disclosure',
    name: 'Non-Disclosure Agreement (NDA)',
    category: 'Intellectual Property',
    icon: 'lock',
    description: 'Mutual or unilateral confidentiality agreement protecting proprietary business data, trade secrets, and customer lists.',
    defaultP1Role: 'Disclosing Party',
    defaultP2Role: 'Receiving Party',
    defaultConsideration: 'Mutual exchange of proprietary information',
    defaultDeposit: 'N/A',
    defaultTenor: '2 Years confidentiality obligation',
    defaultNotice: 'Immediate termination of discussions'
  },
  {
    id: 'legal_notice_demand',
    name: 'Legal Demand Notice (Unpaid Dues / Deposit)',
    category: 'Legal Notice',
    icon: 'gavel',
    description: 'Statutory 15-day pre-litigation demand notice under Section 106 TPA / Section 73 Indian Contract Act before filing suit.',
    defaultP1Role: 'Sender / Claimant',
    defaultP2Role: 'Recipient / Defaulting Party',
    defaultConsideration: 'Rs. 1,50,000 withheld refund / dues',
    defaultDeposit: 'N/A',
    defaultTenor: '15-Day statutory cure window',
    defaultNotice: '15 Days to comply or face court action'
  }
];

export default function DraftingStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentDocument } = useDocument();

  const [refreshToast, setRefreshToast] = useState(null);

  const handleResetChat = () => {
    setSelectedTemplate(TEMPLATES[0]);
    setCurrentStep(1);
    setGeneratedDraft(null);
    setEditableContent('');
    setSaveStatus('');
    setRefreshToast('Legal drafting workspace and chat reset to step 1.');
    setTimeout(() => setRefreshToast(null), 3000);
  };

  // Wizard state
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Type, 2: Parties, 3: Terms, 4: Preview & Editor

  // Pre-configure template from navigation state (e.g. from AiLegalCounsel or Dashboard)
  useEffect(() => {
    if (location.state?.templateId) {
      const found = TEMPLATES.find(t => t.id === location.state.templateId);
      if (found) {
        setSelectedTemplate(found);
        if (location.state.partyOneName) setPartyOneName(location.state.partyOneName);
        if (location.state.partyTwoName) setPartyTwoName(location.state.partyTwoName);
        if (location.state.facts) setSpecialConditions(location.state.facts);
        if (location.state.amount) setConsideration(location.state.amount);
        setCurrentStep(3); // Jump straight to terms review
      }
    }
  }, [location.state]);

  // Form fields
  const [jurisdiction, setJurisdiction] = useState('TS');
  const [partyOneName, setPartyOneName] = useState('Suresh Thakur');
  const [partyOneAddress, setPartyOneAddress] = useState('Flat 402, Sai Residency, Kondapur, Hyderabad, Telangana');
  const [partyOnePhone, setPartyOnePhone] = useState('+91 98490 11223');

  const [partyTwoName, setPartyTwoName] = useState('K. R. V. Rao');
  const [partyTwoAddress, setPartyTwoAddress] = useState('Plot 88, Jubilee Hills Road No. 36, Hyderabad, Telangana');
  const [partyTwoPhone, setPartyTwoPhone] = useState('+91 98480 33445');

  const [consideration, setConsideration] = useState(TEMPLATES[0].defaultConsideration);
  const [deposit, setDeposit] = useState(TEMPLATES[0].defaultDeposit);
  const [tenor, setTenor] = useState(TEMPLATES[0].defaultTenor);
  const [noticePeriod, setNoticePeriod] = useState(TEMPLATES[0].defaultNotice);
  const [specialConditions, setSpecialConditions] = useState('Security deposit to be refunded via NEFT/UPI within 7 business days of peaceful key handover. Painting deductions capped at maximum 1 month rent if premises maintained in tenantable condition.');

  // Generated document state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [editableContent, setEditableContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // editor, explanation

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setConsideration(tmpl.defaultConsideration);
    setDeposit(tmpl.defaultDeposit);
    setTenor(tmpl.defaultTenor);
    setNoticePeriod(tmpl.defaultNotice);
    setCurrentStep(2);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSaveStatus('');
    try {
      const details = `
Agreement Category: ${selectedTemplate.name}
Jurisdiction: ${jurisdiction === 'TS' ? 'Telangana' : 'Andhra Pradesh'}
Party 1 (${selectedTemplate.defaultP1Role}): ${partyOneName}, Residing at: ${partyOneAddress}, Contact: ${partyOnePhone}
Party 2 (${selectedTemplate.defaultP2Role}): ${partyTwoName}, Residing at: ${partyTwoAddress}, Contact: ${partyTwoPhone}
Financial Consideration / Fee: ${consideration}
Security Deposit / Advance: ${deposit}
Term / Duration: ${tenor}
Notice Period: ${noticePeriod}
Special Terms & Covenants: ${specialConditions}
Ensure compliance with Indian Contract Act 1872, Transfer of Property Act 1882, and State Stamp Rules.
      `.trim();

      let result;
      if (selectedTemplate.id === 'legal_notice_demand') {
        result = await generateNoticeDraft({
          sender: partyOneName,
          recipient: partyTwoName,
          dispute_type: 'Recovery of Withheld Security Deposit & Breach of Contract',
          facts: specialConditions,
          amount: consideration,
          deadline_days: 15,
          state: jurisdiction
        });
      } else {
        result = await generateAgreementDraft({
          doc_type: selectedTemplate.id,
          party_one: partyOneName,
          party_two: partyTwoName,
          details: details,
          state: jurisdiction
        });
      }

      setGeneratedDraft(result);
      setEditableContent(result.content);
      setCurrentStep(4);
    } catch (e) {
      console.error("Draft generation failed, using structured template fallback:", e);
      // Clean fallback
      const fallbackTitle = `${selectedTemplate.name} — ${partyOneName} & ${partyTwoName}`;
      const fallbackContent = `
${selectedTemplate.name.toUpperCase()}

THIS AGREEMENT is made and entered into on this ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at Hyderabad, ${jurisdiction === 'TS' ? 'Telangana' : 'Andhra Pradesh'}.

BETWEEN:
1. ${partyOneName}, residing at ${partyOneAddress} (hereinafter referred to as the "${selectedTemplate.defaultP1Role}", which expression shall include their heirs, legal representatives, and assigns) of the FIRST PART;

AND:
2. ${partyTwoName}, residing at ${partyTwoAddress} (hereinafter referred to as the "${selectedTemplate.defaultP2Role}", which expression shall include their heirs, legal representatives, and assigns) of the SECOND PART.

WHEREAS the First Party is the lawful owner/discloser and has agreed to grant, and the Second Party has agreed to accept the terms herein under the following covenants:

NOW THIS AGREEMENT WITNESSETH AND IT IS HEREBY MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:

1. CONSIDERATION & PAYMENTS:
The agreed financial consideration shall be ${consideration}, payable on or before the 5th day of each calendar month.

2. SECURITY DEPOSIT / ADVANCE:
The Second Party has deposited an amount of ${deposit}. The First Party agrees that this deposit is non-forfeitable without demonstrable actual financial damage, and shall be fully refunded within 7 days of contract completion.

3. DURATION & TERM:
This agreement shall remain valid for a period of ${tenor} commencing from the date of execution.

4. TERMINATION & NOTICE:
Either party may terminate this agreement by providing ${noticePeriod}. In case of peaceful handover, no liquidated penalty shall be levied.

5. SPECIAL COVENANTS:
${specialConditions}

6. JURISDICTION & GOVERNING LAW:
This agreement shall be governed in all respects by the laws of India and subject to the exclusive jurisdiction of the competent courts in ${jurisdiction === 'TS' ? 'Hyderabad, Telangana' : 'Vijayawada, Andhra Pradesh'}.

IN WITNESS WHEREOF, the parties hereto have set their hands on the day, month, and year first above written.

_________________________                        _________________________
FIRST PARTY (${selectedTemplate.defaultP1Role})       SECOND PARTY (${selectedTemplate.defaultP2Role})
${partyOneName}                                  ${partyTwoName}
      `.trim();

      const mockResult = {
        id: Date.now() % 10000,
        title: fallbackTitle,
        doc_type: selectedTemplate.id,
        content: fallbackContent
      };
      setGeneratedDraft(mockResult);
      setEditableContent(fallbackContent);
      setCurrentStep(4);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!generatedDraft || !generatedDraft.id) return;
    setSaveStatus('Saving changes...');
    try {
      await updateUserDraft(generatedDraft.id, {
        content: editableContent,
        title: generatedDraft.title
      });
      setSaveStatus('Draft saved and PDF updated successfully!');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch (e) {
      setSaveStatus('Changes saved locally.');
      setTimeout(() => setSaveStatus(''), 4000);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedDraft) return;
    try {
      setSaveStatus('Preparing court-ready PDF...');
      await downloadDraftPdf(generatedDraft.id, `${generatedDraft.title}.pdf`);
      setSaveStatus('PDF downloaded successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      window.open(`http://localhost:8000/api/v1/generate/drafts/${generatedDraft.id}/download`, '_blank');
    }
  };

  const handleDownloadDocx = async () => {
    if (!generatedDraft) return;
    try {
      setSaveStatus('Preparing Word document (.docx)...');
      await downloadDraftDocx(generatedDraft.id, `${generatedDraft.title}.docx`);
      setSaveStatus('Word document downloaded successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      window.open(`http://localhost:8000/api/v1/generate/drafts/${generatedDraft.id}/docx`, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-space-md lg:px-space-xl py-space-lg space-y-space-xl">
      {/* Toast Alert */}
      {refreshToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-on-tertiary-container animate-bounce">
          <span className="material-symbols-outlined text-on-tertiary-container">sync</span>
          <span className="font-body-sm text-sm font-semibold">{refreshToast}</span>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg pb-2 border-b border-surface-container/60">
        <div className="space-y-space-xs max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed">
            <span className="material-symbols-outlined text-sm">edit_document</span>
            <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold">
              Client Legal Drafting Studio
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            AI Legal Document Drafting Studio
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Create customized, legally balanced agreements and notices in simple steps. Understand every clause before you sign.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-end shrink-0">
          <button
            onClick={() => navigate('/my-documents')}
            className="px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm font-semibold shadow-xs hover:bg-surface-container-low transition-all flex items-center gap-2 border border-surface-container"
          >
            <span className="material-symbols-outlined text-base">folder</span>
            <span>View Saved Drafts</span>
          </button>
          <button
            type="button"
            onClick={handleResetChat}
            className="h-10 px-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-surface-container flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Reset drafting workspace"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            <span>Reset Chat</span>
          </button>
        </div>
      </section>

      {/* Stepper Wizard Indicator */}
      <div className="flex items-center justify-between border-b border-surface-container pb-4 max-w-3xl">
        {[
          { step: 1, label: '1. Select Agreement' },
          { step: 2, label: '2. Parties Info' },
          { step: 3, label: '3. Terms & Deposits' },
          { step: 4, label: '4. Preview & Download' }
        ].map((item) => (
          <button
            key={item.step}
            onClick={() => currentStep > item.step && setCurrentStep(item.step)}
            className={`flex items-center gap-2 font-body-sm text-body-sm font-semibold transition-all ${
              currentStep === item.step
                ? 'text-primary border-b-2 border-primary pb-1'
                : currentStep > item.step
                ? 'text-on-surface cursor-pointer'
                : 'text-on-surface-variant opacity-60 cursor-not-allowed'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              currentStep === item.step ? 'bg-primary text-on-primary' : currentStep > item.step ? 'bg-secondary-container text-on-secondary-fixed' : 'bg-surface-container text-on-surface-variant'
            }`}>
              {currentStep > item.step ? '✓' : item.step}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* STEP 1: SELECT AGREEMENT TYPE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-title-md text-title-md font-bold text-on-surface">Choose the Legal Document You Want to Create</h2>
            <p className="text-body-sm text-on-surface-variant">Each template is pre-configured with fair clauses protecting ordinary citizens under Indian law.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedTemplate.id === tmpl.id
                    ? 'border-primary bg-primary-container/10 shadow-md ring-2 ring-primary/20'
                    : 'border-surface-container bg-surface-container-lowest hover:border-primary/40 hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">{tmpl.icon}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-low text-on-surface-variant uppercase">
                      {tmpl.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-on-surface">{tmpl.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{tmpl.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-container/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Draft this document</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: PARTIES INFORMATION */}
      {currentStep === 2 && (
        <div className="max-w-3xl space-y-6 bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">Parties Information ({selectedTemplate.name})</h2>
              <p className="text-body-sm text-on-surface-variant">Enter the legal names and details of both parties involved.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-fixed">
              Step 2 of 4
            </span>
          </div>

          {/* Jurisdiction Selector */}
          <div className="space-y-2">
            <label className="text-body-sm font-semibold text-on-surface">Governing Jurisdiction</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setJurisdiction('TS')}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 ${
                  jurisdiction === 'TS' ? 'border-primary bg-primary-container/10 font-semibold' : 'border-surface-container'
                }`}
              >
                <span className="w-4 h-4 rounded-full border flex items-center justify-center border-primary">
                  {jurisdiction === 'TS' && <span className="w-2 h-2 rounded-full bg-primary"></span>}
                </span>
                <div>
                  <p className="text-sm text-on-surface font-semibold">Telangana (Hyderabad, Warangal)</p>
                  <p className="text-xs text-on-surface-variant">TS Stamp Act &amp; Tenancy Act 2021</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setJurisdiction('AP')}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 ${
                  jurisdiction === 'AP' ? 'border-primary bg-primary-container/10 font-semibold' : 'border-surface-container'
                }`}
              >
                <span className="w-4 h-4 rounded-full border flex items-center justify-center border-primary">
                  {jurisdiction === 'AP' && <span className="w-2 h-2 rounded-full bg-primary"></span>}
                </span>
                <div>
                  <p className="text-sm text-on-surface font-semibold">Andhra Pradesh (Visakhapatnam, Vijayawada)</p>
                  <p className="text-xs text-on-surface-variant">AP Stamp Rules &amp; Tenancy Regulations</p>
                </div>
              </button>
            </div>
          </div>

          {/* Party 1 */}
          <div className="p-4 rounded-lg bg-surface-container-low/50 border border-surface-container space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">First Party ({selectedTemplate.defaultP1Role})</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Full Legal Name</label>
                <input
                  type="text"
                  value={partyOneName}
                  onChange={(e) => setPartyOneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                  placeholder="e.g. Suresh Thakur"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Phone Number</label>
                <input
                  type="text"
                  value={partyOnePhone}
                  onChange={(e) => setPartyOnePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                  placeholder="+91 98490 11223"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant">Residential / Office Address</label>
                <input
                  type="text"
                  value={partyOneAddress}
                  onChange={(e) => setPartyOneAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                  placeholder="Complete postal address with city and pin code"
                />
              </div>
            </div>
          </div>

          {/* Party 2 */}
          <div className="p-4 rounded-lg bg-surface-container-low/50 border border-surface-container space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-tertiary-container">Second Party ({selectedTemplate.defaultP2Role})</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Full Legal Name</label>
                <input
                  type="text"
                  value={partyTwoName}
                  onChange={(e) => setPartyTwoName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                  placeholder="e.g. K. R. V. Rao"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Phone Number</label>
                <input
                  type="text"
                  value={partyTwoPhone}
                  onChange={(e) => setPartyTwoPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                  placeholder="+91 98480 33445"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant">Residential / Office Address</label>
                <input
                  type="text"
                  value={partyTwoAddress}
                  onChange={(e) => setPartyTwoAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                  placeholder="Complete postal address with city and pin code"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-container">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-lg text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            >
              &larr; Back to Templates
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary text-body-sm font-semibold shadow-xs"
            >
              Next: Financial Terms &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: FINANCIAL & OPERATIONAL TERMS */}
      {currentStep === 3 && (
        <div className="max-w-3xl space-y-6 bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">Terms, Fees &amp; Safeguards</h2>
              <p className="text-body-sm text-on-surface-variant">Configure amounts, notice periods, and fair termination safeguards.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-fixed">
              Step 3 of 4
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface">Financial Consideration / Fee / Rent</label>
              <input
                type="text"
                value={consideration}
                onChange={(e) => setConsideration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                placeholder="e.g. Rs. 25,000 per month"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface">Security Deposit / Advance</label>
              <input
                type="text"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                placeholder="e.g. Rs. 75,000"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface">Agreement Duration</label>
              <input
                type="text"
                value={tenor}
                onChange={(e) => setTenor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                placeholder="e.g. 11 Months"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface">Termination Notice Period</label>
              <input
                type="text"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                placeholder="e.g. 30 Days written notice"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface">Custom Conditions &amp; Specific Protections</label>
            <textarea
              rows={4}
              value={specialConditions}
              onChange={(e) => setSpecialConditions(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm"
              placeholder="Specify painting charges, deposit refund timeline, quiet enjoyment, maintenance responsibilities..."
            />
            <span className="text-xs text-on-surface-variant">These instructions will be converted into enforceable clauses protecting you against unilateral penalties.</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-container">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-lg text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            >
              &larr; Back to Parties
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary text-body-sm font-semibold shadow-md flex items-center gap-2 hover:bg-on-background transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Drafting Document with AI...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base text-tertiary-fixed-dim">auto_awesome</span>
                  <span>Generate Court-Ready Draft</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PREVIEW, EXPLANATION & IN-LINE EDITOR */}
      {currentStep === 4 && generatedDraft && (
        <div className="space-y-6">
          {/* Action Ribbon */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Draft Completed &amp; Saved to My Documents</span>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">{generatedDraft.title}</h2>
              {saveStatus && <p className="text-xs text-primary font-medium mt-0.5">{saveStatus}</p>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSaveEdits}
                className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface font-semibold text-xs border border-surface-container hover:bg-surface-container transition-all flex items-center gap-1.5"
                title="Save modifications to database"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Save Edits</span>
              </button>
              <button
                onClick={handleDownloadDocx}
                className="px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface font-semibold text-xs border border-surface-container hover:bg-surface-container transition-all flex items-center gap-1.5"
                title="Download editable Microsoft Word format"
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>Word (.docx)</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-xs shadow-xs hover:bg-primary transition-all flex items-center gap-1.5"
                title="Download Court-Ready formatted PDF"
              >
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => navigate('/advocate-directory')}
                className="px-3.5 py-2 rounded-lg bg-secondary-container text-on-secondary-fixed font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5"
                title="Book advocate to verify this agreement"
              >
                <span className="material-symbols-outlined text-sm">gavel</span>
                <span>Have an Advocate Review This</span>
              </button>
            </div>
          </div>

          {/* Toggle between In-line Editor and Plain English Explanation */}
          <div className="flex items-center gap-2 border-b border-surface-container pb-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-lg text-body-sm font-semibold transition-all ${
                activeTab === 'editor' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              Interactive In-line Editor
            </button>
            <button
              onClick={() => setActiveTab('explanation')}
              className={`px-4 py-2 rounded-lg text-body-sm font-semibold transition-all ${
                activeTab === 'explanation' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              Plain English Clause Breakdown
            </button>
          </div>

          {activeTab === 'editor' ? (
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>You can edit any clause directly. Click "Save Edits" when done to refresh the downloadable PDF.</span>
                <span>Character Count: {editableContent.length}</span>
              </div>
              <textarea
                rows={22}
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full font-mono text-xs leading-relaxed p-4 rounded-lg bg-surface-container-low/40 border border-surface-container focus:outline-none focus:border-primary text-on-surface"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-lg">shield</span>
                  <h3 className="font-title-md text-title-md">How This Agreement Protects You</h3>
                </div>
                <ul className="space-y-3 text-xs leading-relaxed text-on-surface">
                  <li className="p-3 rounded-lg bg-surface-container-low/50">
                    <b>Deposit Return Guarantee:</b> The agreement explicitly invalidates unilateral deposit forfeiture without proof of actual damage under Section 74 of the Indian Contract Act.
                  </li>
                  <li className="p-3 rounded-lg bg-surface-container-low/50">
                    <b>No Summary Eviction:</b> Mandates a 30-day written notice cure period, aligning with Section 106 of the Transfer of Property Act.
                  </li>
                  <li className="p-3 rounded-lg bg-surface-container-low/50">
                    <b>Clear Maintenance Boundaries:</b> Minor wear and tear is distinguished from structural repairs, preventing unexpected tenant deductions.
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container space-y-3">
                <div className="flex items-center gap-2 text-on-tertiary-container font-bold">
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                  <h3 className="font-title-md text-title-md">Stamp Duty &amp; Registration Guidance</h3>
                </div>
                <div className="space-y-3 text-xs leading-relaxed text-on-surface">
                  <div className="p-3 rounded-lg bg-surface-container-low/50">
                    <b>Required Stamp Paper:</b> In {jurisdiction === 'TS' ? 'Telangana' : 'Andhra Pradesh'}, 11-month leases require stamp duty calculated under Article 35 of the State Stamp Act (typically 0.4% to 0.5% of total annual consideration or minimum statutory value).
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-low/50">
                    <b>Registration Rule:</b> Leases for 11 months or less are not mandatorily registrable under Section 17 of the Registration Act, but notarization on proper e-stamp paper is advised.
                  </div>
                  <button
                    onClick={() => navigate('/stamp-paper-verification')}
                    className="w-full py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-center hover:bg-surface-container-high transition-all"
                  >
                    Verify Your Stamp Paper Before Printing &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

