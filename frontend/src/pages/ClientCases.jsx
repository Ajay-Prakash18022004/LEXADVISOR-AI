import React, { useState, useEffect } from 'react';
import { getCases, getCaseDetail } from '../api/advocate';
import { useAuth } from '../context/AuthContext';

export default function ClientCases() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchMyCases = async () => {
      try {
        setLoading(true);
        const data = await getCases();
        setCases(data);
        if (data.length > 0) {
          openCase(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCases();
  }, []);

  const openCase = async (id) => {
    setSelectedCaseId(id);
    try {
      setDetailLoading(true);
      const detail = await getCaseDetail(id);
      setCaseDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'New': 'bg-blue-50 text-blue-700 border-blue-200',
      'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
      'In Progress': 'bg-purple-50 text-purple-700 border-purple-200',
      'Awaiting Client Information': 'bg-orange-50 text-orange-700 border-orange-200',
      'Awaiting Hearing': 'bg-rose-50 text-rose-700 border-rose-200',
      'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Closed': 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">My Legal Cases &amp; Litigation</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Track the status of your ongoing legal representations, hearing dates, and court milestones shared by your advocate.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
            Active Legal Matters ({cases.length})
          </div>

          {loading ? (
            <div className="py-16 text-center text-on-surface-variant text-sm">Loading your cases...</div>
          ) : cases.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest border border-surface-container-high rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">folder_open</span>
              <h3 className="text-sm font-bold text-on-surface">No Active Cases</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                When an advocate accepts your consultation request, your case file will appear here.
              </p>
            </div>
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                onClick={() => openCase(c.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedCaseId === c.id
                    ? 'bg-surface-container-lowest border-primary shadow-md ring-1 ring-primary/20'
                    : 'bg-surface-container-lowest border-surface-container-high hover:border-surface-container-highest'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-primary">{c.case_number}</span>
                  {getStatusBadge(c.status)}
                </div>

                <h3 className="text-sm font-bold text-on-surface line-clamp-1">{c.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{c.description || 'Representation under progress.'}</p>

                <div className="flex items-center justify-between text-xs text-on-surface-variant mt-3 pt-2 border-t border-surface-container-high/60">
                  <span>Advocate: <strong className="text-on-surface">{c.advocate_name}</strong></span>
                  {c.next_hearing_date ? (
                    <span className="text-rose-600 font-semibold">Hearing: {c.next_hearing_date}</span>
                  ) : (
                    <span>Filed: {c.created_at}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Workspace */}
        <div className="lg:col-span-7">
          {!selectedCaseId ? (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center p-8 bg-surface-container-low border border-surface-container-high rounded-2xl text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">find_in_page</span>
              <h3 className="text-sm font-bold text-on-surface">Select a Case</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mt-1">
                Choose a case from the list on the left to review advocate updates, next court hearings, and action items.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="h-full min-h-[360px] flex items-center justify-center bg-surface-container-lowest border border-surface-container-high rounded-2xl text-on-surface-variant text-sm">
              Loading case file...
            </div>
          ) : caseDetail ? (
            <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-6 space-y-6 shadow-sm">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-surface-container-high">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary bg-primary-container px-2 py-0.5 rounded">
                      {caseDetail.case_number}
                    </span>
                    <span className="text-xs text-on-surface-variant">· {caseDetail.category}</span>
                  </div>
                  <h2 className="text-lg font-bold text-on-surface">{caseDetail.title}</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">{caseDetail.description}</p>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(caseDetail.status)}
                </div>
              </div>

              {/* Counsel & Court Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    Your Appointed Advocate
                  </span>
                  <div className="font-bold text-on-surface text-sm">{caseDetail.advocate?.name}</div>
                  <div className="text-on-surface-variant text-xs">{caseDetail.advocate?.specialization}</div>
                  <div className="font-mono text-[11px] text-primary mt-0.5">{caseDetail.advocate?.bar_council_id}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    Next Court Hearing / Listing
                  </span>
                  <div className="font-bold text-rose-600 text-sm">
                    {caseDetail.next_hearing_date ? `📅 ${caseDetail.next_hearing_date}` : 'Not scheduled'}
                  </div>
                  <div className="text-on-surface-variant text-xs mt-0.5">
                    {caseDetail.court_name ? `Court: ${caseDetail.court_name}` : 'Forum to be assigned'}
                  </div>
                </div>
              </div>

              {/* Case Milestones & Public Timeline */}
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">timeline</span>
                  <span>Case Updates &amp; Legal Milestones</span>
                </h3>

                {caseDetail.activities?.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">No status updates logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {caseDetail.activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high text-xs text-on-surface space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">{act.author_name}</span>
                          <span className="text-[10px] text-on-surface-variant">{act.created_at}</span>
                        </div>
                        <p className="leading-relaxed text-on-surface">{act.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

