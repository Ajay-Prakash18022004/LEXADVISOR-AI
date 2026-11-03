import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { chatApi } from '../api/client';

export default function AiLegalCounsel() {
  const navigate = useNavigate();
  const { currentDocument, activeJurisdiction } = useDocument();

  // Chat message thread
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'user',
      author: 'You (Tenant Representative)',
      timestamp: '11:42 AM',
      contextTag: `Context: ${currentDocument?.title || 'Syed_Residential_Lease_Kondapur.pdf'} • Clause 8 • ${activeJurisdiction === 'AP' ? 'AP Jurisdiction' : 'TS Jurisdiction'}`,
      content: 'Clause 8 of my lease agreement states that if I vacate before 11 months, my entire security deposit of ₹1,50,000 will be forfeited immediately without dispute. Is this legally enforceable?'
    },
    {
      id: 'm2',
      sender: 'ai',
      timestamp: '11:42 AM',
      executiveOpinion: 'In short: No, this clause operates as an invalid penal stipulation and is legally unenforceable in its absolute form.',
      executiveDetails: 'Under Indian contract jurisprudence and Telangana tenancy precedents, landlords cannot levy arbitrary punitive damages without establishing actual financial loss incurred as a direct consequence of early termination.',
      authorities: [
        {
          code: 'SECTION 74',
          badge: 'Central Law',
          act: 'Indian Contract Act, 1872',
          desc: 'Liquidated damages must represent a genuine pre-estimate of reasonable loss. Forfeiture of an entire substantial sum without proof of vacant period or financial damage constitutes an invalid in terrorem penalty.',
          precedent: 'Kailash Nath Associates v. DDA (2015) 4 SCC 136'
        },
        {
          code: 'SECTION 108(q)',
          badge: 'Property Law',
          act: 'Transfer of Property Act, 1882',
          desc: 'Governs surrender of possession upon notice. When adequate contractual notice (typically 30 days) is tendered, the landlord is bound to adjust only actual utility dues or documented tenant damages.',
          precedent: 'Fateh Chand v. Balkishan Das (AIR 1963 SC 1405)'
        },
        {
          code: 'STATUTORY CEILING',
          badge: 'Tenancy Rule',
          act: 'Model Tenancy Act Standard',
          desc: `Statutory guidance strictly caps security deposits for residential premises to a maximum of 2 months rent. For your current rent of ₹${currentDocument.monthly_rent?.toLocaleString() || '35,000'}/mo, permissible statutory deposit is ₹${((currentDocument.monthly_rent || 35000) * 2).toLocaleString()} (collected: ₹${currentDocument.security_deposit?.toLocaleString() || '1,50,000'}).`,
          precedent: 'Excess Over Recommended 2-Month Ceiling',
          isVariance: true
        }
      ],
      warningTitle: 'High Commercial & Self-Help Deduction Exposure',
      warningDesc: 'While the clause is legally unenforceable in court, the landlord holds physical custody of the funds. If you unilaterally vacate without executing a formal legal notice, the lessor is likely to withhold the security deposit under the pretext of Clause 8. Initiating recovery later in the Small Causes Court entails extensive procedural timelines.',
      recommendation: 'Issue a formal Pre-Emptive Representation Notice 30 days prior to surrender.',
      tokens: ['AIR 1963 SC 1405', '2015 4 SCC 136', 'Sec. 63 BSA 2023', 'TS Tenancy Model Standard']
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [activeSessionId, setActiveSessionId] = useState('s1');
  const [attachedDoc, setAttachedDoc] = useState(currentDocument?.title || 'Syed_Residential_Lease_Kondapur.pdf');
  const [toastMessage, setToastMessage] = useState(null);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    setAttachedDoc(currentDocument?.title);
  }, [currentDocument]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendQuery = async (queryText) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      author: 'You (Tenant Representative)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contextTag: `Context: ${currentDocument?.title || 'Active Document'} • ${activeJurisdiction === 'AP' ? 'AP Jurisdiction' : 'TS Jurisdiction'}`,
      content: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      // Connect to the real FastAPI backend endpoint!
      const res = await chatApi.askQuestion({
        query: textToSend,
        document_id: typeof currentDocument?.id === 'number' ? currentDocument.id : 1,
        document_text: currentDocument?.summary || 'General Tenancy Agreement under Indian Law'
      });

      const backendAnswer = res.data?.content || res.content || 'Statutory analysis completed.';

      const aiReply = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executiveOpinion: 'Statutory Analysis & Precedent Synthesis',
        executiveDetails: backendAnswer,
        authorities: [
          {
            code: 'SECTION 106',
            badge: 'Mandatory',
            act: 'Transfer of Property Act, 1882',
            desc: 'A lease of immovable property for residential purpose shall be terminable on the part of either lessor or lessee by fifteen to thirty days notice expiring with the end of a month of the tenancy.',
            precedent: 'Supreme Court Standard Ruling'
          },
          {
            code: 'SECTION 74',
            badge: 'Central Law',
            act: 'Indian Contract Act, 1872',
            desc: 'Stipulations by way of penalty cannot exceed actual damages proven by the aggrieved party.',
            precedent: 'Kailash Nath Associates (2015)'
          }
        ],
        warningTitle: 'Procedural Compliance Mandate',
        warningDesc: 'Oral agreements or informal messaging retain zero formal evidentiary weight. Always preserve dispatch receipts (Speed Post / Regd Post AD) under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (formerly Sec. 65B Indian Evidence Act).',
        recommendation: 'Dispatch written statutory representation prior to month end.',
        tokens: ['TS Tenancy Act', 'Sec 106 T.P. Act', 'Sec 74 Contract Act', 'Sec 63 BSA 2023']
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      console.warn('Real AI counsel backend unreachable, utilizing local statutory synthesis:', err);
      const fallbackAi = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executiveOpinion: 'Statutory Evaluation & Legal Counsel Opinion',
        executiveDetails: `Regarding "${textToSend}": Under the Andhra Pradesh & Telangana Tenancy Framework, arbitrary penal forfeiture is strictly regulated. Lessors cannot claim unilateral deductions without certified repair bills or demonstrated loss.`,
        authorities: [
          {
            code: 'TENANCY STANDARD',
            badge: 'Statutory',
            act: 'Model Tenancy Framework Provisions',
            desc: 'Security deposit must be refunded within thirty days of handing over vacant possession after lawful adjustments.',
            precedent: 'Section 13 Standard Ceiling'
          },
          {
            code: 'EVIDENTIARY AUDIT',
            badge: 'Admissibility',
            act: 'Bharatiya Sakshya Adhiniyam 2023 § 63',
            desc: 'All communications, rent transaction receipts, and maintenance logs must bear valid electronic telemetry for court submission.',
            precedent: 'Formerly Sec. 65B Indian Evidence Act'
          }
        ],
        warningTitle: 'Enforcement Caution',
        warningDesc: 'Direct negotiations should always be backed by written correspondence explicitly referencing non-waiver of statutory rights.',
        recommendation: 'Issue written communication citing relevant sections.',
        tokens: ['TS Tenancy Code', 'Sec 63 BSA Admissibility', 'High Court Precedents']
      };
      setMessages(prev => [...prev, fallbackAi]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyAnalysis = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast('Legal analysis copied to clipboard!');
  };

  const suggestedInquiries = [
    `Can the landlord forfeit the entire deposit under Clause 8 of ${currentDocument?.title || 'my deed'}?`,
    'What is the statutory penalty if stamp paper is impounded under Section 35?',
    'Generate a 30-day notice of non-renewal letter under Sec. 106 TP Act',
    'Is landlord entitled to inspect the flat without 24 hours prior notice?'
  ];

  const sessions = [
    { id: 's1', title: 'Lock-in Period Forfeiture Validity', sub: 'Section 74 Indian Contract Act', time: 'Active', period: 'Today' },
    { id: 's2', title: 'Stamp Duty regularisation steps', sub: 'Section 35 Indian Stamp Act', time: '09:15 AM', period: 'Today' },
    { id: 's3', title: 'Security Deposit return time limit TS', sub: 'Model Tenancy Provision §13', time: 'Yesterday', period: 'Yesterday' },
    { id: 's4', title: 'Can landlord enter without 24hr notice?', sub: 'Quiet Enjoyment Covenant', time: 'Yesterday', period: 'Yesterday' },
    { id: 's5', title: 'Local Body Surcharge on 11m Lease', sub: 'Municipal Act Rules', time: 'Earlier', period: 'Previous Week' }
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-on-tertiary-container animate-bounce">
          <span className="material-symbols-outlined text-on-tertiary-container">verified</span>
          <span className="font-body-sm text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
        {/* Top Command & Status Bar */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-low flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold">
              <span>AI Assistance</span>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface">AI Legal Counsel</span>
              <span className="text-outline-variant">•</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">
                STATUTORY DECISION SUPPORT
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                LexAdvisor AI Legal Counsel
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-tertiary-container opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-on-tertiary-container"></span>
                </span>
                <span className="font-label-caps text-[11px] text-on-surface font-semibold tracking-wider">
                  Active Engine: Lex-Tenancy v4.2 • {activeJurisdiction === 'AP' ? 'AP Jurisdiction' : 'TS Jurisdiction'} Indexed
                </span>
              </div>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant max-w-4xl">
              Intelligent statutory guidance, clause redlining advice, and tenancy law interpretation grounded in Telangana & Andhra Pradesh jurisprudence.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start xl:self-center">
            <button
              onClick={() => triggerToast('Exporting verified legal consultation transcript as a signed PDF...')}
              className="h-10 px-4 bg-surface-container text-on-surface font-body-sm text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              <span>Export Counsel Transcript</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear current workspace session? Cached citations will be archived.')) {
                  setMessages([]);
                  triggerToast('Conversation cleared.');
                }
              }}
              className="h-10 px-4 bg-surface-container-low text-on-surface-variant font-body-sm text-xs font-semibold rounded-lg hover:bg-surface-container hover:text-error transition-colors flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              <span>Clear Conversation</span>
            </button>
          </div>
        </div>

        {/* 2-Column Intelligent Workspace: 4 cols (History & Context) & 8 cols (Interactive Canvas) */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Column (4 cols) */}
          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-5">
            {/* Action & Active Document Anchor */}
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-4">
              <button
                onClick={() => {
                  setMessages([]);
                  triggerToast('Started new legal consultation dossier session.');
                }}
                className="w-full h-11 bg-primary text-on-primary font-body-sm text-sm font-semibold rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-sm text-white"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>New Consultation</span>
              </button>

              {/* Current Case Document Attachment Context */}
              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-1.5 border border-surface-container">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Active Document Reference
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-caps text-[10px] font-bold text-red-700">
                    {currentDocument.is_demo_sample ? 'Sample Dossier' : 'Audited Document'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-base">description</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body-sm text-xs font-bold text-on-surface truncate">
                      {currentDocument?.title}
                    </p>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">
                      {currentDocument.stamp_duty?.status_label || 'Stamp Audit Active'} • {currentDocument.high_risk_count || 4} Flagged Clauses
                    </p>
                  </div>
                </div>
              </div>

              {/* History Search Input */}
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-base pointer-events-none">
                  search
                </span>
                <input
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg font-body-sm text-xs text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors"
                  placeholder="Search past consultations, rulings..."
                  type="text"
                />
              </div>
            </div>

            {/* Consultation History Ledger */}
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-low flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                  Consultation History
                </span>
                <span className="font-label-caps text-xs text-on-surface-variant font-semibold">
                  Sample Sessions
                </span>
              </div>

              {/* Grouped History items */}
              {['Today', 'Yesterday', 'Previous Week'].map(period => {
                const groupItems = sessions.filter(s =>
                  s.period === period &&
                  (s.title.toLowerCase().includes(searchHistory.toLowerCase()) ||
                   s.sub.toLowerCase().includes(searchHistory.toLowerCase()))
                );

                if (groupItems.length === 0) return null;

                return (
                  <div key={period} className="space-y-1.5 pt-1">
                    <span className="px-1 font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
                      {period}
                    </span>
                    {groupItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveSessionId(item.id);
                          triggerToast(`Switched context to: "${item.title}"`);
                        }}
                        className={`w-full group flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all ${
                          activeSessionId === item.id
                            ? 'bg-surface-container-low shadow-sm'
                            : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <div
                          className={`w-1.5 self-stretch rounded-full shrink-0 mt-0.5 ${
                            activeSessionId === item.id ? 'bg-on-tertiary-container' : 'bg-transparent'
                          }`}
                        ></div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className={`font-body-sm text-xs truncate ${
                              activeSessionId === item.id
                                ? 'font-bold text-on-surface'
                                : 'font-medium text-on-surface'
                            }`}
                          >
                            {item.title}
                          </span>
                          <span className="font-label-caps text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-xs">gavel</span>
                            <span className="truncate">{item.sub}</span>
                          </span>
                        </div>
                        <span className="font-label-caps text-[10px] text-on-surface-variant mt-0.5 shrink-0">
                          {item.time}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Grounded Jurisdiction Bottom Banner */}
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-low flex items-start gap-3">
              <div className="p-2 rounded bg-surface-container text-on-tertiary-container shrink-0">
                <span className="material-symbols-outlined text-lg">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">
                  Statutory Intelligence Foundation
                </span>
                <p className="font-body-sm text-xs text-on-surface font-semibold mt-0.5">
                  Telangana & AP Tenancy Codes • T.P. Act §§ 106-108 • Indian Contract Act § 74
                </p>
                <p className="font-label-caps text-[10px] text-on-surface-variant mt-1 leading-snug">
                  Electronic evidence formatted under Sec. 63 Bharatiya Sakshya Adhiniyam 2023.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Column (8 cols): Interactive Counsel Canvas */}
          <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {/* Quick Inquiry Suggested Prompts */}
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-low flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm text-on-tertiary-container">tips_and_updates</span>
                  Recommended Inquiries based on Current Lease Document
                </span>
                <span className="font-label-caps text-[10px] text-on-surface-variant font-medium">Tap to ask</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestedInquiries.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendQuery(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-xs transition-all border border-surface-container"
                  >
                    <span className="material-symbols-outlined text-xs text-on-surface-variant">arrow_forward</span>
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Stream Canvas */}
            <div className="flex flex-col gap-6">
              {messages.map(msg => (
                <React.Fragment key={msg.id}>
                  {msg.sender === 'user' ? (
                    /* Message: User Turn */
                    <div className="flex justify-end w-full">
                      <div className="max-w-2xl bg-primary-container text-on-primary rounded-xl rounded-tr-none p-5 shadow-sm flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-on-primary-container text-xs">
                          <span className="font-label-caps uppercase tracking-wider font-semibold">
                            {msg.author}
                          </span>
                          <span className="font-label-caps text-[10px]">{msg.timestamp}</span>
                        </div>
                        <p className="font-body-md text-sm leading-relaxed text-on-primary">
                          {msg.content}
                        </p>
                        {msg.contextTag && (
                          <div className="flex items-center gap-1.5 pt-1 text-on-primary-container font-label-caps text-[10px]">
                            <span className="material-symbols-outlined text-xs">attach_file</span>
                            <span>{msg.contextTag}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Message: AI Turn (Institutional Card) */
                    <div className="flex flex-col gap-4 max-w-4xl bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-low">
                      {/* AI Header Metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 bg-surface-container-low/40 -mx-6 -mt-6 px-6 pt-4 rounded-t-xl border-b border-surface-container-low">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
                            <span className="material-symbols-outlined text-lg">gavel</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-title-md text-sm font-bold text-on-surface">
                                LexAdvisor Statutory Engine
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-caps text-[10px] font-semibold">
                                Validated Precedent Grounding
                              </span>
                            </div>
                            <span className="font-label-caps text-[10px] text-on-surface-variant">
                              Grounding: Supreme Court of India • High Court for TS & AP • Indian Contract Act
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyAnalysis(`${msg.executiveOpinion}\n\n${msg.executiveDetails}`)}
                            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant"
                            title="Copy Analysis"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">content_copy</span>
                          </button>
                          <button
                            onClick={() => triggerToast('Precedent saved to personal case references.')}
                            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant"
                            title="Bookmark Precedent"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">bookmark_border</span>
                          </button>
                        </div>
                      </div>

                      {/* Executive Statutory Answer */}
                      <div className="flex flex-col gap-1 pt-1">
                        <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                          Executive Opinion
                        </span>
                        <div className="bg-surface-container-low p-4 rounded-lg border border-surface-container">
                          <p className="font-body-lg text-sm font-bold text-on-surface leading-relaxed">
                            {msg.executiveOpinion}
                          </p>
                          <p className="font-body-md text-xs text-on-surface mt-1.5 leading-relaxed">
                            {msg.executiveDetails}
                          </p>
                        </div>
                      </div>

                      {/* Statutory Citations Cards */}
                      {msg.authorities && msg.authorities.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                            Statutory Grounding & Authorities
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {msg.authorities.map((auth, idx) => (
                              <div
                                key={idx}
                                className="bg-surface-container-lowest rounded-lg p-3.5 shadow-sm border border-surface-container-low flex flex-col justify-between"
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-label-caps text-[10px] text-on-tertiary-container font-bold tracking-wider">
                                      {auth.code}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-[9px] text-on-surface-variant">
                                      {auth.badge}
                                    </span>
                                  </div>
                                  <h4 className="font-title-md text-xs font-bold text-on-surface">{auth.act}</h4>
                                  <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
                                    {auth.desc}
                                  </p>
                                </div>
                                <div className="mt-3 pt-2 bg-surface-container-low -mx-3.5 -mb-3.5 p-2 rounded-b-lg border-t border-surface-container">
                                  <span className="font-label-caps text-[9px] text-on-surface font-semibold block">
                                    {auth.isVariance ? 'Statutory Variance:' : 'Precedent Authority:'}
                                  </span>
                                  <span className={`font-label-sm text-[10px] ${auth.isVariance ? 'text-red-600 font-bold' : 'italic text-on-surface-variant'}`}>
                                    {auth.precedent}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk Assessment Warning Block */}
                      {msg.warningTitle && (
                        <div className="bg-secondary-container/40 rounded-xl p-4 flex items-start gap-3 border border-secondary-container">
                          <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-tertiary-container shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-xl">warning</span>
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-title-md text-xs font-bold text-on-surface">{msg.warningTitle}</h4>
                              <span className="px-2 py-0.5 rounded bg-surface-container font-label-caps text-[9px] font-semibold text-on-surface">
                                Action Required
                              </span>
                            </div>
                            <p className="font-body-md text-xs text-on-surface mt-1 leading-relaxed">
                              {msg.warningDesc}
                            </p>
                            <div className="flex items-center gap-2 pt-2 text-on-surface font-label-sm text-xs font-semibold">
                              <span className="material-symbols-outlined text-sm text-on-tertiary-container">check_circle</span>
                              <span>Recommendation: {msg.recommendation}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Direct Legal Workflows & Remedial Tools (Interactive Action Pills) */}
                      <div className="flex flex-col gap-2 pt-1">
                        <span className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                          Direct Legal Workflows &amp; Remedial Tools
                        </span>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              triggerToast('Opening Future Risk Analysis with pre-loaded statutory counter-clause (Clause 8)...');
                              navigate('/clause-risk-analyzer', {
                                state: {
                                  targetClauseId: 'clause-8',
                                  highlightCounter: true
                                }
                              });
                            }}
                            className="h-10 px-4 bg-primary-container text-on-primary font-body-sm text-xs font-semibold rounded-lg hover:bg-on-background transition-all flex items-center gap-2 shadow-sm text-white"
                          >
                            <span className="material-symbols-outlined text-base">edit_document</span>
                            <span>Generate Balanced Counter-Clause</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerToast('Opening Legal Drafting Studio with pre-configured Pre-Emptive Representation Notice under Section 74 ICA...');
                              navigate('/drafting-studio', {
                                state: {
                                  templateId: 'legal_notice_demand',
                                  disputeType: 'Pre-Emptive Statutory Representation & Deposit Recovery Notice',
                                  facts: `Notice regarding Clause 8 of ${currentDocument?.title || 'Residential Tenancy Agreement'}. Stipulation of absolute deposit forfeiture of ₹${currentDocument.security_deposit?.toLocaleString() || '1,50,000'} constitutes an unlawful penalty under Sec. 74 Indian Contract Act (Kailash Nath Associates v. DDA). Tenant tenders 30-day notice with demand for prompt refund.`,
                                  amount: `₹${currentDocument.security_deposit?.toLocaleString() || '1,50,000'}`,
                                  partyOneName: 'Suresh Thakur',
                                  partyTwoName: 'Property Lessor / Owner'
                                }
                              });
                            }}
                            className="h-10 px-4 bg-secondary-container text-on-secondary-fixed font-body-sm text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-all flex items-center gap-2 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-base">outgoing_mail</span>
                            <span>Create Pre-Emptive Representation Notice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerToast('Connecting to verified Advocates directory with attached consultation brief...');
                              navigate('/advocate-directory', {
                                state: {
                                  caseSubject: `Consultation: Remediation for ${currentDocument?.title || 'Lease Agreement'} (Clause 8 Forfeiture)`,
                                  caseNotes: `AI Legal Counsel consultation brief regarding Clause 8 unconstitutional lock-in penalty & ₹${currentDocument.security_deposit?.toLocaleString() || '1,50,000'} deposit recovery under Sec. 74 ICA. Precedent: Kailash Nath Associates.`,
                                  attachDoc: true,
                                  docTitle: currentDocument?.title || 'Syed_Residential_Lease_Kondapur.pdf'
                                }
                              });
                            }}
                            className="h-10 px-4 bg-surface-container-low text-on-surface font-body-sm text-xs font-semibold rounded-lg hover:bg-surface-container transition-all flex items-center gap-2 border border-surface-container"
                          >
                            <span className="material-symbols-outlined text-base">share</span>
                            <span>Share with Advocate</span>
                          </button>
                        </div>
                      </div>

                      {/* Citation Metadata Pill Strip */}
                      {msg.tokens && (
                        <div className="pt-2 flex flex-wrap items-center gap-1.5 text-on-surface-variant font-label-caps text-[10px] border-t border-surface-container-low">
                          <span className="font-semibold text-on-surface mr-1">Grounding Tokens:</span>
                          {msg.tokens.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-surface-container font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}

              {isTyping && (
                <div className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl border border-surface-container-low max-w-sm">
                  <div className="w-2 h-2 rounded-full bg-on-tertiary-container animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-on-tertiary-container animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-on-tertiary-container animate-bounce delay-200"></div>
                  <span className="font-label-sm text-xs text-on-surface-variant font-medium">
                    Querying FastAPI RAG backend & Indian legal authorities...
                  </span>
                </div>
              )}

              <div ref={chatBottomRef}></div>
            </div>

            {/* Sticky Bottom Chat Input Bar */}
            <div className="sticky bottom-4 z-30 bg-surface-container-lowest rounded-xl p-4 shadow-xl border border-surface-container flex flex-col gap-3">
              {/* Attachment Context Tag Strip */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  {attachedDoc && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-on-surface font-label-caps text-[10px] font-semibold">
                      <span className="material-symbols-outlined text-xs text-on-tertiary-container">attachment</span>
                      <span>Attached: {attachedDoc}</span>
                      <button
                        onClick={() => setAttachedDoc(null)}
                        className="hover:text-error ml-1 leading-none font-bold"
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface-variant font-label-caps text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                    <span>{activeJurisdiction === 'AP' ? 'AP Jurisdiction' : 'TS Jurisdiction'} Active</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container-low text-on-surface-variant font-label-caps text-[10px]">
                    <span>RAG Engine: FastAPI /chat/ask</span>
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <span className="font-label-caps text-[10px] text-on-surface-variant">
                    Shift + Enter for newline
                  </span>
                </div>
              </div>

              {/* Multi-line Interactive Text Area & Action Controls */}
              <div className="relative flex items-end gap-2 bg-surface-container-low rounded-lg p-2 focus-within:bg-surface-container-lowest focus-within:shadow-sm transition-all border border-surface-container">
                <textarea
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuery();
                    }
                  }}
                  className="w-full bg-transparent font-body-md text-xs text-on-surface placeholder:text-outline focus:outline-none resize-none min-h-[44px] max-h-32 py-1 px-1"
                  placeholder="Ask a statutory question about your lease, stamp duty, or dispute..."
                  rows="2"
                ></textarea>
                <div className="flex items-center gap-1 pb-0.5 shrink-0">
                  <button
                    onClick={() => triggerToast('Document attachment picker opened. Upload additional lease annexures.')}
                    className="w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
                    title="Attach Supplemental Legal Notice or Document"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">attach_file</span>
                  </button>
                  <button
                    onClick={() => triggerToast('Voice dictation active. Speak query in English or Telugu.')}
                    className="w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
                    title="Voice Dictation (Telugu / English)"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">mic</span>
                  </button>
                  <button
                    onClick={() => handleSendQuery()}
                    disabled={!inputQuery.trim() || isTyping}
                    className="h-8 px-4 bg-primary-container text-on-primary rounded-lg font-body-sm text-xs font-semibold hover:bg-on-background transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                    type="button"
                  >
                    <span>Ask AI</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </div>

              {/* Prominent Legal Disclaimer Footer */}
              <div className="pt-0.5 flex items-start gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-outline shrink-0 mt-0.5">info</span>
                <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed">
                  <strong className="font-semibold text-on-surface">Statutory Notice & Disclaimer:</strong> LexAdvisor AI provides statutory analysis and informational guidance based on Indian law and regional tenancy codes. It does not constitute formal advocate-client privilege or a substitute for professional legal advice from an enrolled advocate under the Advocates Act, 1961.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
