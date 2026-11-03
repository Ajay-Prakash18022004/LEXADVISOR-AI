import React, { useState, useEffect } from 'react';
import { getPendingConsultations, acceptConsultation, rejectConsultation, rescheduleConsultation, getAdvocateProfiles } from '../../api/advocate';

export default function AdvocatePending() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: 'success' });
  const [advocateProfiles, setAdvocateProfiles] = useState([]);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState(() => {
    const saved = localStorage.getItem('active_advocate_id');
    return saved !== null && saved !== undefined ? Number(saved) : 0;
  });

  // Modal states
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });
  const [rescheduleModal, setRescheduleModal] = useState({
    open: false,
    id: null,
    newDate: '',
    newTime: '11:30 AM',
    reason: ''
  });

  const fetchPending = async (silent = false, advId) => {
    const targetId = advId !== undefined ? advId : selectedAdvocateId;
    try {
      if (!silent) setLoading(true);
      const data = await getPendingConsultations(targetId);
      setRequests(data);
    } catch (err) {
      console.error(err);
      if (!silent) setFeedback({ text: 'Failed to load pending consultations.', type: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    getAdvocateProfiles()
      .then(res => {
        if (res && res.length > 0) setAdvocateProfiles(res);
      })
      .catch(() => {});

    fetchPending(false, selectedAdvocateId);
    const timer = setInterval(() => fetchPending(true, selectedAdvocateId), 4000);
    const onFocus = () => fetchPending(true, selectedAdvocateId);
    window.addEventListener('focus', onFocus);

    const onProfileChanged = (e) => {
      if (e.detail?.id !== undefined) {
        const newId = Number(e.detail.id);
        setSelectedAdvocateId(newId);
        fetchPending(false, newId);
      }
    };

    const onConsultationBooked = (e) => {
      const advId = e.detail?.advocate_id;
      if (advId) {
        setSelectedAdvocateId(Number(advId));
        fetchPending(false, Number(advId));
      } else {
        fetchPending(false, selectedAdvocateId);
      }
    };

    window.addEventListener('advocate_profile_changed', onProfileChanged);
    window.addEventListener('consultation_booked', onConsultationBooked);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('advocate_profile_changed', onProfileChanged);
      window.removeEventListener('consultation_booked', onConsultationBooked);
    };
  }, [selectedAdvocateId]);

  const handleFilterChange = (val) => {
    const num = Number(val);
    setSelectedAdvocateId(num);
    localStorage.setItem('active_advocate_id', String(num));
    fetchPending(false, num);
  };

  const handleAccept = async (id) => {
    try {
      setActionLoading(true);
      await acceptConsultation(id);
      setFeedback({ text: 'Consultation confirmed! Status updated, email notification dispatched to sureshtakur194@gmail.com, and litigation case file opened.', type: 'success' });
      window.dispatchEvent(new CustomEvent('consultation_accepted', { detail: { id } }));
      await fetchPending(true);
    } catch (err) {
      setFeedback({ text: err.response?.data?.detail || 'Error accepting consultation.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason || rejectModal.reason.length < 5) {
      alert('Please state a valid reason (min 5 characters).');
      return;
    }
    try {
      setActionLoading(true);
      await rejectConsultation(rejectModal.id, rejectModal.reason);
      setFeedback({ text: 'Consultation request rejected with explanation sent to client.', type: 'success' });
      setRejectModal({ open: false, id: null, reason: '' });
      await fetchPending();
    } catch (err) {
      setFeedback({ text: err.response?.data?.detail || 'Error rejecting consultation.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModal.newDate) {
      alert('Please select a new consultation date.');
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
      await fetchPending();
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
            <span className="material-symbols-outlined text-amber-600">mark_email_unread</span>
            <span>Pending Consultation Requests</span>
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1">
            Review incoming consultation bookings from clients, verify subject matter, and confirm appointment slots.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span className="material-symbols-outlined text-sm text-emerald-600">notifications_active</span>
            <span>Email Alerts Active</span>
          </div>
          <div className="font-label-caps text-xs font-bold text-on-surface bg-surface-container-low border border-surface-container px-3 py-1.5 rounded-lg">
            Queue: <strong className="text-amber-800">{requests.length} Requests</strong>
          </div>
        </div>
      </div>

      {/* Chamber Filter Selector */}
      <div className="bg-surface-container-lowest border border-surface-container p-3 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-lg">filter_alt</span>
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-label-caps">Filter by Chamber Profile:</span>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <select
            value={selectedAdvocateId}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full text-xs font-semibold bg-surface-container-low text-on-surface border border-surface-container-high rounded-lg px-3 py-2 cursor-pointer focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="0">⚡ All Chambers (Master Queue — All Requests)</option>
            {advocateProfiles.map(adv => (
              <option key={adv.id} value={adv.id}>
                ⚖️ {adv.name} ({adv.bar_council_id || adv.roll}) — {adv.city}
              </option>
            ))}
          </select>
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

      {/* Main List */}
      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm">Loading consultation queue...</div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-surface-container rounded-2xl flex flex-col items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">task_alt</span>
          <h3 className="font-title-md text-base font-bold text-on-surface">All clear!</h3>
          <p className="text-xs text-on-surface-variant mt-1">There are no pending consultation requests waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 hover:shadow-md transition-all shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-on-surface">{req.client_name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-fixed">
                      {req.consultation_type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300">
                      Fee: ₹{req.fee}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-on-surface">{req.case_subject}</h4>
                  {req.case_notes && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 bg-surface-container-low p-2.5 rounded-lg border border-surface-container">
                      "{req.case_notes}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-1">
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-sm text-primary">event</span>
                      Requested: {req.appointment_date}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                      Time: {req.time_slot}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">phone</span>
                      {req.client_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      {req.client_email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={actionLoading}
                    className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">check</span>
                    <span>Accept &amp; Open File</span>
                  </button>

                  <button
                    onClick={() => setRescheduleModal({
                      open: true,
                      id: req.id,
                      newDate: req.appointment_date,
                      newTime: req.time_slot,
                      reason: ''
                    })}
                    disabled={actionLoading}
                    className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">event_repeat</span>
                    <span>Reschedule</span>
                  </button>

                  <button
                    onClick={() => setRejectModal({ open: true, id: req.id, reason: '' })}
                    disabled={actionLoading}
                    className="flex-1 lg:flex-none px-4 py-2 rounded-xl bg-surface-container-lowest hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                    <span>Decline Request</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-2">Decline Consultation</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Enter the reason for declining this request. The client will be automatically informed via email notification.
            </p>
            <form onSubmit={handleRejectSubmit}>
              <textarea
                rows={3}
                required
                placeholder="State reason: e.g. Schedule clash with High Court hearing / Matter outside specialization..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-sm focus:outline-none focus:bg-surface-container-lowest mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, id: null, reason: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-error text-on-error hover:bg-error/90 shadow-sm"
                >
                  {actionLoading ? 'Declining...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal.open && (
        <div className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-2">Propose Rescheduled Date &amp; Slot</h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Specify the alternative date and time slot. The system checks against your existing confirmed commitments.
            </p>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Proposed Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleModal.newDate}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Proposed Time Slot *</label>
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
                  <option value="06:30 PM">06:30 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Reason for Reschedule</label>
                <input
                  type="text"
                  placeholder="e.g. Urgent court appearance / Chamber adjustment"
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
