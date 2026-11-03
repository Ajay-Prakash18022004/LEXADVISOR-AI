import React, { useState, useEffect } from 'react';
import { getCases, getCaseDetail, createCase, updateCaseStatus, addCaseNote, scheduleCaseHearing } from '../../api/advocate';

export default function AdvocateCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all_notes'); // 'all_notes', 'private_notes', 'client_updates'

  // Modals & Forms
  const [newCaseModal, setNewCaseModal] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({ title: '', category: 'Civil / Property', description: '' });
  const [noteText, setNoteText] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(true);
  const [hearingModal, setHearingModal] = useState({ open: false, date: '', court: '', notes: '' });
  const [resolutionModal, setResolutionModal] = useState({ open: false, summary: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: 'success' });

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await getCases();
      setCases(data);
    } catch (err) {
      console.error(err);
      setFeedback({ text: 'Failed to load litigation cases.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const openCase = async (id) => {
    setSelectedCaseId(id);
    try {
      setDetailLoading(true);
      const detail = await getCaseDetail(id);
      setCaseDetail(detail);
    } catch (err) {
      console.error(err);
      alert('Error fetching case detail: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newCaseForm.title) return;
    try {
      setActionLoading(true);
      const res = await createCase(newCaseForm);
      setFeedback({ text: `Case ${res.case_number} registered successfully!`, type: 'success' });
      setNewCaseModal(false);
      setNewCaseForm({ title: '', category: 'Civil / Property', description: '' });
      await fetchCases();
    } catch (err) {
      alert('Error creating case: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setActionLoading(true);
      await addCaseNote(selectedCaseId, noteText.trim(), isPrivateNote);
      setNoteText('');
      const updated = await getCaseDetail(selectedCaseId);
      setCaseDetail(updated);
      setFeedback({
        text: isPrivateNote
          ? 'Private internal strategy note logged (strictly hidden from client).'
          : 'Public case milestone logged (visible to client).',
        type: 'success'
      });
    } catch (err) {
      alert('Error adding note: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Resolved') {
      setResolutionModal({ open: true, summary: '' });
      return;
    }
    try {
      setActionLoading(true);
      await updateCaseStatus(selectedCaseId, newStatus);
      const updated = await getCaseDetail(selectedCaseId);
      setCaseDetail(updated);
      await fetchCases();
      setFeedback({ text: `Case status transitioned to ${newStatus}.`, type: 'success' });
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleHearing = async (e) => {
    e.preventDefault();
    if (!hearingModal.date) return;
    try {
      setActionLoading(true);
      await scheduleCaseHearing(selectedCaseId, hearingModal.date, hearingModal.court, hearingModal.notes);
      setHearingModal({ open: false, date: '', court: '', notes: '' });
      const updated = await getCaseDetail(selectedCaseId);
      setCaseDetail(updated);
      await fetchCases();
      setFeedback({ text: `Court hearing scheduled for ${hearingModal.date}.`, type: 'success' });
    } catch (err) {
      alert('Error scheduling hearing: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await updateCaseStatus(selectedCaseId, 'Resolved', resolutionModal.summary);
      setResolutionModal({ open: false, summary: '' });
      const updated = await getCaseDetail(selectedCaseId);
      setCaseDetail(updated);
      await fetchCases();
      setFeedback({ text: 'Case marked as Resolved and archived.', type: 'success' });
    } catch (err) {
      alert('Error resolving case: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'New': 'bg-blue-50 text-blue-700 border-blue-200',
      'Under Review': 'bg-amber-50 text-amber-800 border-amber-200',
      'In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Awaiting Client Information': 'bg-orange-50 text-orange-700 border-orange-200',
      'Awaiting Hearing': 'bg-rose-50 text-rose-700 border-rose-200',
      'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Closed': 'bg-surface-container text-on-surface-variant border-surface-container-high'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] || 'bg-surface-container-low text-on-surface-variant border-surface-container'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest border border-surface-container p-6 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-on-tertiary-container text-2xl">folder_managed</span>
            <h1 className="font-serif text-2xl font-bold text-on-surface">Litigation &amp; Case Management</h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            Track client litigation dockets, court hearing dates, statutory filings, and private internal chamber strategy notes.
          </p>
        </div>

        <button
          onClick={() => setNewCaseModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container hover:bg-on-background text-on-primary text-xs font-bold transition-all shadow-sm self-start shrink-0"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>New Case File</span>
        </button>
      </div>

      {feedback.text && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
          feedback.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback({ text: '', type: 'success' })} className="text-on-surface-variant hover:text-on-surface ml-3">✕</button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cases List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant px-1">
            <span>Active Case Files ({cases.length})</span>
            <span>Sorted by Recent Activity</span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-on-surface-variant text-sm bg-surface-container-lowest border border-surface-container rounded-2xl">
              Loading litigation cases...
            </div>
          ) : cases.length === 0 ? (
            <div className="p-10 text-center bg-surface-container-lowest border border-surface-container rounded-2xl shadow-sm">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">folder_off</span>
              <p className="text-xs text-on-surface-variant">No active cases registered yet. Accept a consultation or create a new case file.</p>
            </div>
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                onClick={() => openCase(c.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedCaseId === c.id
                    ? 'bg-surface-container-lowest border-2 border-on-tertiary-container shadow-md'
                    : 'bg-surface-container-lowest border-surface-container hover:border-surface-container-high hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-on-tertiary-container bg-tertiary-fixed/40 px-2 py-0.5 rounded">
                    {c.case_number}
                  </span>
                  {getStatusBadge(c.status)}
                </div>

                <h3 className="text-sm font-bold text-on-surface line-clamp-1">{c.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{c.description || 'No description provided.'}</p>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-3 pt-2.5 border-t border-surface-container">
                  <span className="flex items-center gap-1 text-on-surface font-medium">
                    <span className="material-symbols-outlined text-xs text-on-surface-variant">person</span>
                    {c.client_name}
                  </span>
                  {c.next_hearing_date ? (
                    <span className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      <span className="material-symbols-outlined text-xs">gavel</span>
                      Hearing: {c.next_hearing_date}
                    </span>
                  ) : (
                    <span>Filed: {c.created_at}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Case Workspace Detail */}
        <div className="lg:col-span-7">
          {!selectedCaseId ? (
            <div className="h-full min-h-[440px] flex flex-col items-center justify-center p-8 bg-surface-container-lowest border border-surface-container rounded-2xl text-center shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">find_in_page</span>
              <h3 className="font-serif text-base font-bold text-on-surface">Select a Case File</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mt-1">
                Click on any case from the left docket to view client files, court hearing schedules, and record private chamber notes.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="h-full min-h-[440px] flex items-center justify-center bg-surface-container-lowest border border-surface-container rounded-2xl text-on-surface-variant text-sm">
              Loading case file dossier...
            </div>
          ) : caseDetail ? (
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 space-y-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surface-container">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-on-tertiary-container bg-tertiary-fixed/50 px-2.5 py-0.5 rounded">
                      {caseDetail.case_number}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">· {caseDetail.category}</span>
                  </div>
                  <h2 className="font-serif text-xl font-bold text-on-surface">{caseDetail.title}</h2>
                  <p className="text-xs text-on-surface-variant">{caseDetail.description}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant font-semibold">Status:</span>
                    <select
                      value={caseDetail.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container text-on-surface outline-none focus:border-primary-container"
                    >
                      <option value="New">New</option>
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Awaiting Client Information">Awaiting Client Info</option>
                      <option value="Awaiting Hearing">Awaiting Hearing</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setHearingModal({
                      open: true,
                      date: caseDetail.next_hearing_date || '',
                      court: caseDetail.court_name || '',
                      notes: ''
                    })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">event</span>
                    <span>{caseDetail.next_hearing_date ? `Hearing: ${caseDetail.next_hearing_date}` : 'Schedule Hearing'}</span>
                  </button>
                </div>
              </div>

              {/* Client & Chamber Information Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-container-low border border-surface-container text-xs">
                <div>
                  <span className="text-on-surface-variant font-semibold uppercase text-[10px] tracking-wider block mb-0.5">Representing Client</span>
                  <div className="font-bold text-on-surface">{caseDetail.client?.name}</div>
                  <div className="text-on-surface-variant text-[11px]">{caseDetail.client?.phone} · {caseDetail.client?.email}</div>
                </div>
                <div>
                  <span className="text-on-surface-variant font-semibold uppercase text-[10px] tracking-wider block mb-0.5">Court / Forum</span>
                  <div className="font-bold text-on-surface">{caseDetail.court_name || 'Not yet listed'}</div>
                  <div className="text-on-surface-variant text-[11px]">Next Listing: {caseDetail.next_hearing_date || 'Awaiting date'}</div>
                </div>
              </div>

              {/* Tabs: Internal Notes vs Client Updates */}
              <div>
                <div className="flex border-b border-surface-container mb-4 gap-1">
                  <button
                    onClick={() => setActiveTab('all_notes')}
                    className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'all_notes'
                        ? 'border-on-tertiary-container text-on-tertiary-container'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">history</span>
                    <span>Complete Timeline ({caseDetail.activities?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('private_notes')}
                    className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'private_notes'
                        ? 'border-on-tertiary-container text-on-tertiary-container'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>Private Internal Notes</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('client_updates')}
                    className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'client_updates'
                        ? 'border-on-tertiary-container text-on-tertiary-container'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>Client-Facing Milestones</span>
                  </button>
                </div>

                {/* Note Composer with Private Flag */}
                <form onSubmit={handleAddNote} className="space-y-3 mb-6 bg-surface-container-low p-4 rounded-xl border border-surface-container">
                  <textarea
                    rows={2}
                    required
                    placeholder={
                      isPrivateNote
                        ? "🔒 Enter private internal legal strategy, defect memos, or chamber observations (Client will NEVER see this)..."
                        : "📢 Enter client-facing milestone, notice delivery confirmation, or procedural update (Client WILL see this)..."
                    }
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface text-xs focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isPrivateNote}
                        onChange={(e) => setIsPrivateNote(e.target.checked)}
                        className="rounded border-surface-container text-primary-container focus:ring-0"
                      />
                      <span className={isPrivateNote ? 'text-on-tertiary-container font-bold' : 'text-on-surface-variant'}>
                        {isPrivateNote ? '🔒 Private Advocate Note (Hidden from Client)' : '📢 Public Milestone (Visible to Client)'}
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={actionLoading || !noteText.trim()}
                      className="px-5 py-2 rounded-xl bg-primary-container hover:bg-on-background text-on-primary text-xs font-bold transition-all shadow-sm self-end"
                    >
                      {actionLoading ? 'Recording...' : 'Log Entry'}
                    </button>
                  </div>
                </form>

                {/* Activity Entries */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {caseDetail.activities
                    ?.filter((act) => {
                      if (activeTab === 'private_notes') return act.is_private_to_advocate;
                      if (activeTab === 'client_updates') return !act.is_private_to_advocate;
                      return true;
                    })
                    .map((act) => (
                      <div
                        key={act.id}
                        className={`p-4 rounded-xl border text-xs ${
                          act.is_private_to_advocate
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-surface-container-lowest border-surface-container text-on-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {act.is_private_to_advocate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <span className="material-symbols-outlined text-[11px]">lock</span>
                                Advocate Private Note
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="material-symbols-outlined text-[11px]">public</span>
                                Client Update
                              </span>
                            )}
                            <span className="font-semibold text-on-surface-variant">by {act.author_name}</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant">{act.created_at}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{act.message}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* New Case Modal */}
      {newCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-on-surface mb-1">Register New Case File</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Create an official case docket for representation, statutory filing, or legal notice tracking.
            </p>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Case Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Injunction against Illegal Encroachment on Survey 142/A"
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Category</label>
                <select
                  value={newCaseForm.category}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface text-sm outline-none focus:border-primary-container"
                >
                  <option value="Civil / Property">Civil / Property</option>
                  <option value="Tenancy &amp; Rent Control">Tenancy &amp; Rent Control</option>
                  <option value="Commercial &amp; Contracts">Commercial &amp; Contracts</option>
                  <option value="Consumer Protection">Consumer Protection</option>
                  <option value="Criminal Defense">Criminal Defense</option>
                  <option value="Corporate &amp; Employment">Corporate &amp; Employment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Description / Relief Sought</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of dispute facts, parties involved, and statutory relief sought..."
                  value={newCaseForm.description}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-container hover:bg-on-background text-on-primary shadow-sm"
                >
                  {actionLoading ? 'Creating...' : 'Register Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hearing Scheduler Modal */}
      {hearingModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-on-surface mb-1">Schedule Court Hearing</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Record the next court listing date and court name. This automatically adds a milestone in the case timeline.
            </p>
            <form onSubmit={handleScheduleHearing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Hearing Date *</label>
                <input
                  type="date"
                  required
                  value={hearingModal.date}
                  onChange={(e) => setHearingModal({ ...hearingModal, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Court Name / Forum</label>
                <input
                  type="text"
                  placeholder="e.g. City Civil Court Hyderabad, Court Hall 4"
                  value={hearingModal.court}
                  onChange={(e) => setHearingModal({ ...hearingModal, court: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Hearing Notes / Order Stage</label>
                <input
                  type="text"
                  placeholder="e.g. Arguments on Section 63 BSA certificate / Framing of issues"
                  value={hearingModal.notes}
                  onChange={(e) => setHearingModal({ ...hearingModal, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface text-sm outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setHearingModal({ open: false, date: '', court: '', notes: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-container hover:bg-on-background text-on-primary shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Set Hearing Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {resolutionModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-on-surface mb-1">Mark Case as Resolved</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Enter the final outcome, decree details, or settlement terms. This will archive the case under Resolved Cases.
            </p>
            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                placeholder="e.g. Consent terms signed before Lok Adalat; security deposit of Rs. 1,00,000 refunded in full..."
                value={resolutionModal.summary}
                onChange={(e) => setResolutionModal({ ...resolutionModal, summary: e.target.value })}
                className="w-full p-3 rounded-xl bg-surface-container-lowest border border-surface-container text-on-surface text-sm outline-none focus:border-primary-container"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolutionModal({ open: false, summary: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                >
                  {actionLoading ? 'Closing Case...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
