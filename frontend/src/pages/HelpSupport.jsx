import React, { useState } from 'react';

export default function HelpSupport() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'Why is an agreement executed on ₹100 stamp paper legally deficient in Telangana?',
      a: 'Under Schedule I-A (Article 35) of the Telangana Stamp Act, stamp duty for residential tenancy agreements is assessed at 0.4% to 0.5% of the total average annual rent (AAR) plus advance deposit. For an agreement with ₹35,000/month rent (₹4,20,000 annual rent + ₹1,50,000 deposit), statutory applicable stamp duty is ₹2,400. Stamping on ₹100 paper creates a ₹2,300 deficit, rendering the instrument inadmissible under Section 35 of the Indian Stamp Act until regularized with a 10x maximum deficit penalty.'
    },
    {
      q: 'Can a landlord legally forfeit the entire security deposit under a 1-year lock-in clause?',
      a: 'No. Under Section 74 of the Indian Contract Act, 1872 and the landmark Supreme Court ruling in Kailash Nath Associates v. DDA (2015) 4 SCC 136, stipulations by way of penalty cannot be arbitrarily enforced without proof of actual financial damage or vacant property period. Total forfeiture of ₹1,50,000 without evidence of loss constitutes an illegal in terrorem penalty.'
    },
    {
      q: 'What is the mandatory notice period required before tenancy termination?',
      a: 'Under Section 106 of the Transfer of Property Act, 1882, residential tenancies require a mandatory written notice of at least 15 days expiring with the end of a tenancy month (or 30 days under the Model Tenancy Act). Oral intimations, WhatsApp texts, or informal notices lack primary evidentiary standing in civil courts unless properly certified under Section 65B of the Indian Evidence Act.'
    },
    {
      q: 'What does "Section 65B Admissible" mean in LexAdvisor AI exports?',
      a: 'Section 65B of the Indian Evidence Act, 1872 governs the admissibility of electronic records. LexAdvisor AI automatically computes cryptographic SHA-256 hashes, timestamps, and metadata certs on all exported payment logs, notices, and audit reports, ensuring they satisfy strict evidentiary thresholds for submission in Civil Courts, Rent Tribunals, or TSRERA.'
    },
    {
      q: 'How does advocate consultation booking work on the platform?',
      a: 'You can browse verified advocates licensed by the Bar Council of Telangana and Andhra Pradesh, filter by court seniority and practice area, and instantly reserve a video call or chamber visit. You can also securely attach your LexAdvisor AI document intelligence brief so counsel has an immediate, privileged dossier of flagged clauses and stamp deficits.'
    }
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Main Container */}
      <div className="px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold">
            <span>Platform</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface">Help & Support</span>
          </div>
          <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
            Statutory Guidance & Knowledge Base
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Official statutory references, tenancy dispute resolutions, and platform support resources.
          </p>
        </div>

        {/* Quick Contact & Helpline Banner */}
        <div className="bg-primary-container text-on-primary rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-on-tertiary-container text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h3 className="font-title-md text-base font-bold text-on-primary">
                Urgent Statutory Inquiry or Court Filing?
              </h3>
              <p className="font-body-sm text-xs text-on-primary-container mt-0.5">
                Our panel of senior legal researchers and technical liaisons are available Mon–Sat, 9:00 AM – 7:00 PM IST.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="mailto:support@lexadvisor.ai"
              className="px-4 py-2 bg-secondary-container text-on-secondary-fixed rounded-lg text-xs font-bold hover:bg-secondary-fixed-dim transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span>support@lexadvisor.ai</span>
            </a>
            <a
              href="#/advocate-directory"
              className="px-4 py-2 bg-on-tertiary-container text-white rounded-lg text-xs font-bold hover:opacity-95 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              <span>Find Panel Advocate</span>
            </a>
          </div>
        </div>

        {/* Statutory References Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-low flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-[10px] text-on-tertiary-container font-bold uppercase">
                Revenue & Stamps
              </span>
              <h4 className="font-title-md text-sm font-bold text-on-surface">
                TS Stamp Act Schedule I-A
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                Governs ad-valorem stamp tariffs across Telangana. Article 35 dictates mandatory 0.4%–0.5% calculation on lease agreements.
              </p>
            </div>
            <a
              href="#/stamp-duty-auditor"
              className="mt-4 pt-2 border-t border-surface-container-low text-xs font-bold text-on-tertiary-container hover:underline flex items-center gap-1"
            >
              Audit Your Certificate
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-low flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-[10px] text-on-tertiary-container font-bold uppercase">
                Property Rights
              </span>
              <h4 className="font-title-md text-sm font-bold text-on-surface">
                Transfer of Property Act §§ 106–108
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                Defines statutory notice thresholds, tenant rights of quiet enjoyment, and lessor obligations for structural maintenance.
              </p>
            </div>
            <a
              href="#/clause-risk-analyzer"
              className="mt-4 pt-2 border-t border-surface-container-low text-xs font-bold text-on-tertiary-container hover:underline flex items-center gap-1"
            >
              Analyze Risky Clauses
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-low flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-[10px] text-on-tertiary-container font-bold uppercase">
                Contractual Penalties
              </span>
              <h4 className="font-title-md text-sm font-bold text-on-surface">
                Indian Contract Act § 74
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                Bars punitive or exorbitant damages without substantiated proof of financial loss. Essential defense against arbitrary deposit forfeiture.
              </p>
            </div>
            <a
              href="#/legal-action-roadmap"
              className="mt-4 pt-2 border-t border-surface-container-low text-xs font-bold text-on-tertiary-container hover:underline flex items-center gap-1"
            >
              View Defense Roadmap
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Accordion FAQ */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-low flex flex-col gap-4">
          <div className="border-b border-surface-container-low pb-3">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">
              Frequently Addressed Statutory Questions
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Clarifications on Indian tenancy jurisprudence, stamping rules, and court admissibility.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-surface-container-low">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 hover:text-on-tertiary-container transition-colors"
                >
                  <span className="font-title-md text-sm font-bold text-on-surface">
                    {faq.q}
                  </span>
                  <span className="material-symbols-outlined text-lg text-on-surface-variant shrink-0">
                    {openFaq === idx ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {openFaq === idx && (
                  <p className="font-body-md text-xs text-on-surface-variant mt-2.5 leading-relaxed bg-surface-container-low p-3.5 rounded-lg border border-surface-container">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Prominent Legal Disclaimer Footer */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container flex items-start gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-base text-outline shrink-0 mt-0.5">info</span>
          <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed">
            <strong className="font-semibold text-on-surface">Statutory Notice & Disclaimer:</strong> LexAdvisor AI is an intelligent legal analysis platform designed to assist citizens, property managers, and legal professionals in auditing agreement compliance under Indian law. It does not establish advocate-client privilege or constitute formal legal counsel under the Advocates Act, 1961. Always consult an enrolled advocate before serving statutory notices or filing legal petitions.
          </p>
        </div>
      </div>
    </div>
  );
}

