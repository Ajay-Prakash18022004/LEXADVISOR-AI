import React from 'react';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center space-y-8">
        {/* Main Title Centered on Page */}
        <div className="space-y-3">
          <h1 className="font-cinzel text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface">
            LEXADVISOR AI
          </h1>
          <p className="font-headline-sm text-base sm:text-lg text-on-surface-variant font-medium max-w-2xl mx-auto leading-relaxed">
            AI-Powered Legal Document Intelligence, Statutory Risk Auditing &amp; Advocate Assistance
          </p>
        </div>

        {/* Project Overview Card with distinct box bordering */}
        <div className="max-w-3xl mx-auto rounded-2xl bg-white border-2 border-slate-300 p-7 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center text-sm sm:text-base text-slate-700 leading-relaxed transition-all">
          <p>
            <strong className="text-slate-900 font-bold">LexAdvisor AI</strong> is an intelligent legal decision support platform engineered to demystify complex legal instruments and empower citizens, tenants, property buyers, and legal practitioners under Indian jurisprudence. By fusing advanced natural language understanding with statutory validation rules under Telangana and Andhra Pradesh legal frameworks, LexAdvisor AI automates end-to-end legal document vetting, fiscal stamp duty compliance auditing, unfair contractual risk detection, actionable remediation roadmaps, and verified advocate chamber collaboration.
          </p>
        </div>
      </div>
    </div>
  );
}
