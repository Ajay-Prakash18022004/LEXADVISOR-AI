import React, { useState, useEffect } from 'react';
import { getUpcomingConsultations, completeConsultation, rescheduleConsultation } from '../../api/advocate';

export default function AdvocateUpcoming() {
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [feedback, setFeedback] = useState({ text: '', type: 'success' });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, id: null, newDate: '', newTime: '11:30 AM', reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUpcoming = async () => {
    try {
      setLoading(true);
      const data = await getUpcomingConsultations();
      setUpcoming(data);
    } catch (err) {
      console.error(err);
      setFeedback({ text: 'Failed to load upcoming consultations.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const handleComplete = async (id) => {
    try {
      setActionLoading(true);
      await completeConsultation(id);
      setFeedback({ text: 'Consultation marked as completed!', type: 'success' });
      await fetchUpcoming();
    } catch (err) {
      setFeedback({ text: err.response?.data?.detail || 'Error completing consultation.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModal.newDate) {
      alert('Please select a new date.');
      return;
    }
    try {
      setActionLoading(true);
      await rescheduleConsultation(
        rescheduleModal.id,
        rescheduleModal.newDate,
        rescheduleModal.newTime,
        rescheduleModal.reason
      );
      setFeedback({ text: `Consultation rescheduled to ${rescheduleModal.newDate} at ${rescheduleModal.newTime}.`, type: 'success' });
      setRescheduleModal({ open: false, id: null, newDate: '', newTime: '11:30 AM', reason: '' });
      await fetchUpcoming();
    } catch (err) {
      setFeedback({ text: err.response?.data?.detail || 'Scheduling conflict or error.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest border border-surface-container p-space-lg rounded-2xl shadow-sm">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_month</span>
            <span>Upcoming Consultations</span>
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1">
            Confirmed client consultation appointments. Prepare case briefing, conduct sessions, and record completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-surface-container-low border border-surface-container p-1 rounded-xl flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-primary-container text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar' ? 'bg-primary-container text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">calendar_view_week</span>
              <span>Schedule View</span>
            </button>
          </div>
        </div>
      </div>

      {feedback.text && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium shadow-xs ${
          feedback.type === 'error'
            ? 'bg-rose-50 border border-rose-200 text-rose-800'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback({ text: '', type: 'success' })} className="text-on-surface-variant hover:text-on-surface font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm">Loading upcoming consultations...</div>
      ) : upcoming.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-surface-container rounded-2xl flex flex-col items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">event_available</span>
          <h3 className="font-title-md text-base font-bold text-on-surface">No Upcoming Consultations</h3>
          <p className="text-xs text-on-surface-variant mt-1">Confirmed appointments will appear here once accepted.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-4">
          {upcoming.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 hover:shadow-md transition-all shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-on-surface">{item.client_name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Confirmed
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-fixed">
                      {item.consultation_type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300">
                      Fee: ₹{item.fee}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-on-surface">{item.case_subject}</h4>
                  {item.case_notes && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 bg-surface-container-low p-2.5 rounded-lg border border-surface-container">
                      "{item.case_notes}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-1">
                    <span className="flex items-center gap-1.5 text-primary font-semibold bg-primary-container/10 px-2.5 py-1 rounded-md">
                      <span className="material-symbols-outlined text-sm">event</span>
                      {item.appointment_date} · {item.time_slot}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-sm">phone</span>
                      {item.client_phone}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      {item.client_email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleComplete(item.id)}
                    disabled={actionLoading}
                    className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">task_alt</span>
                    <span>Mark Completed</span>
                  </button>

                  <button
                    onClick={() => setRescheduleModal({
                      open: true,
                      id: item.id,
                      newDate: item.appointment_date,
                      newTime: item.time_slot,
                      reason: ''
                    })}
                    disabled={actionLoading}
                    className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">edit_calendar</span>
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Calendar / Schedule View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed font-semibold">{item.appointment_date}</span>
                  <span className="font-mono text-on-tertiary-container font-bold">{item.time_slot}</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface mb-1 truncate">{item.client_name}</h4>
                <p className="text-xs text-on-surface-variant line-clamp-2">{item.case_subject}</p>
                <div className="mt-2 text-[11px] text-on-surface-variant flex items-center gap-2">
                  <span>Mode: {item.consultation_type}</span>
                  <span>· Tel: {item.client_phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-surface-container">
                <button
                  onClick={() => handleComplete(item.id)}
                  disabled={actionLoading}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Complete
                </button>
                <button
                  onClick={() => setRescheduleModal({
                    open: true,
                    id: item.id,
                    newDate: item.appointment_date,
                    newTime: item.time_slot,
                    reason: ''
                  })}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container shadow-xs cursor-pointer"
                >
                  Reschedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal.open && (
        <div className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-2">Reschedule Consultation</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Select a new date and time slot for this consultation.
            </p>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">New Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleModal.newDate}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">New Time Slot *</label>
                <select
                  value={rescheduleModal.newTime}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, newTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-sm focus:outline-none"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:30 PM">05:30 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule clash with High Court matter"
                  value={rescheduleModal.reason}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModal({ open: false, id: null, newDate: '', newTime: '', reason: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-container text-on-primary hover:bg-on-background shadow-sm"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
