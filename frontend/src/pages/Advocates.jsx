import React, { useState, useEffect } from 'react';
import { getNearbyAdvocates, getAppointments, updateAppointmentStatus, bookAppointment } from '../api/advocates';
import AdvocateCard from '../components/AdvocateCard';

export default function Advocates() {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'appointments', 'pending'
  const [advocates, setAdvocates] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Booking Modal State
  const [selectedAdv, setSelectedAdv] = useState(null);
  const [bookForm, setBookForm] = useState({
    client_name: 'Sri Suresh Thakur',
    client_phone: '+91 98490 11223',
    client_email: 'sureshtakur194@gmail.com',
    appointment_date: '2026-11-05',
    time_slot: '10:30 AM',
    consultation_type: 'In-Chamber',
    case_subject: 'Rental Agreement Stamp Shortfall & Notice Consultation',
    case_notes: ''
  });

  const fetchAdvocates = async () => {
    setLoading(true);
    try {
      const data = await getNearbyAdvocates({ city, specialization });
      setAdvocates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdvocates();
    fetchAppointments();
  }, [city, specialization]);

  const handleStatusChange = async (appId, status) => {
    try {
      await updateAppointmentStatus(appId, status);
      fetchAppointments();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdv) return;
    try {
      await bookAppointment(selectedAdv.id, {
        ...bookForm,
        advocate_id: selectedAdv.id,
        fee: selectedAdv.consultation_fee
      });
      setSelectedAdv(null);
      alert('✓ Consultation booked successfully! Listed under Pending Appointments.');
      setActiveTab('pending');
      fetchAppointments();
    } catch (err) {
      alert('Booking error: ' + err.message);
    }
  };

  const pendingAppointments = appointments.filter((a) => a.status === 'pending');

  return (
    <div>
      <article>
        <h2>Nearby Licensed Advocates &amp; Appointments</h2>
        <p className="note">
          Consult Bar Council certified advocates, book in-chamber appointments, and track your pending consultation requests.
        </p>

        {/* Sub Navigation Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--bg)', padding: '4px', borderRadius: '6px' }}>
          <button
            type="button"
            className={activeTab === 'directory' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('directory')}
            style={{ margin: 0, flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
          >
            👨‍⚖️ Advocates Directory
          </button>
          <button
            type="button"
            className={activeTab === 'appointments' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('appointments')}
            style={{ margin: 0, flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
          >
            📅 My Appointments ({appointments.length})
          </button>
          <button
            type="button"
            className={activeTab === 'pending' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('pending')}
            style={{ margin: 0, flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
          >
            ⏳ Pending Requests ({pendingAppointments.length})
          </button>
        </div>

        {activeTab === 'directory' && (
          <div>
            <div className="form-row" style={{ marginBottom: '16px' }}>
              <div>
                <label className="note">City Filter</label>
                <select value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">All Cities</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Visakhapatnam">Visakhapatnam</option>
                  <option value="Vijayawada">Vijayawada</option>
                  <option value="Warangal">Warangal</option>
                </select>
              </div>
              <div>
                <label className="note">Specialization</label>
                <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                  <option value="">All Fields</option>
                  <option value="Contract">Contract Law &amp; Corporate</option>
                  <option value="Stamp">Stamp Duty &amp; Property</option>
                  <option value="Civil">Civil Disputes &amp; Recovery</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="note">Searching advocate registry...</p>
            ) : advocates.length === 0 ? (
              <p className="note">No advocates found matching filter criteria.</p>
            ) : (
              <div>
                {advocates.map((adv) => (
                  <div key={adv.id} style={{ position: 'relative' }}>
                    <AdvocateCard advocate={adv} />
                    <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '14px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedAdv(adv)}
                        style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        📅 Book Consultation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'appointments' || activeTab === 'pending') && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.95rem' }}>
                {activeTab === 'pending' ? '⏳ Pending Appointments Awaiting Chamber Approval' : 'All Consultations'}
              </strong>
              <button type="button" className="secondary" onClick={fetchAppointments} style={{ margin: 0, padding: '4px 8px', fontSize: '0.8rem' }}>
                ↻ Refresh
              </button>
            </div>

            {(activeTab === 'pending' ? pendingAppointments : appointments).length === 0 ? (
              <p className="note">No appointments found.</p>
            ) : (
              (activeTab === 'pending' ? pendingAppointments : appointments).map((app) => (
                <div key={app.id} className="risk" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{app.advocate_name || 'Advocate Chamber'}</strong>
                      <div className="note">{app.advocate_specialization} &bull; {app.advocate_city}</div>
                    </div>
                    <span className={`badge ${app.status === 'pending' ? 'badge-due_soon' : app.status === 'confirmed' ? 'badge-pass' : 'badge-upcoming'}`}>
                      {app.status === 'pending' ? '⏳ Pending' : app.status === 'confirmed' ? '✅ Confirmed' : app.status}
                    </span>
                  </div>

                  <p style={{ margin: '6px 0 2px', fontSize: '0.92rem' }}><strong>Topic:</strong> {app.case_subject}</p>
                  <div className="note" style={{ margin: '4px 0' }}>
                    📅 {app.appointment_date} at {app.time_slot} &bull; 📍 {app.consultation_type} &bull; 💰 Fee: Rs. {app.fee}
                  </div>
                  {app.case_notes && <p className="note" style={{ margin: '4px 0' }}>Facts: {app.case_notes}</p>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {app.status === 'pending' && (
                        <button type="button" onClick={() => handleStatusChange(app.id, 'confirmed')} style={{ padding: '4px 10px', fontSize: '0.8rem', margin: 0 }}>
                          ✓ Confirm
                        </button>
                      )}
                      {app.status !== 'completed' && (
                        <button type="button" className="secondary" onClick={() => handleStatusChange(app.id, 'completed')} style={{ padding: '4px 10px', fontSize: '0.8rem', margin: 0 }}>
                          🏁 Mark Completed
                        </button>
                      )}
                      <button type="button" className="secondary" onClick={() => handleStatusChange(app.id, 'cancelled')} style={{ padding: '4px 10px', fontSize: '0.8rem', margin: 0, color: 'var(--red)' }}>
                        ✕ Cancel
                      </button>
                    </div>
                    <a href={`tel:${app.advocate_phone || '+919848022338'}`} style={{ textDecoration: 'none' }}>
                      <button type="button" className="secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', margin: 0 }}>
                        📞 Call Advocate
                      </button>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Booking Modal */}
        {selectedAdv && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
          }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '10px', maxWidth: '500px', width: '100%', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>Book Consultation with {selectedAdv.name}</h3>
                <button type="button" onClick={() => setSelectedAdv(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', margin: 0 }}>&times;</button>
              </div>
              <p className="note" style={{ margin: '0 0 12px' }}>{selectedAdv.specialization} &bull; Consultation Fee: Rs. {selectedAdv.consultation_fee}</p>

              <form onSubmit={handleBookSubmit}>
                <div className="form-row">
                  <div>
                    <label className="note">Your Name</label>
                    <input type="text" value={bookForm.client_name} onChange={(e) => setBookForm({ ...bookForm, client_name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="note">Phone Number</label>
                    <input type="tel" value={bookForm.client_phone} onChange={(e) => setBookForm({ ...bookForm, client_phone: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label className="note">Date</label>
                    <input type="date" value={bookForm.appointment_date} onChange={(e) => setBookForm({ ...bookForm, appointment_date: e.target.value })} required />
                  </div>
                  <div>
                    <label className="note">Time Slot</label>
                    <select value={bookForm.time_slot} onChange={(e) => setBookForm({ ...bookForm, time_slot: e.target.value })}>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label className="note">Subject</label>
                  <input type="text" value={bookForm.case_subject} onChange={(e) => setBookForm({ ...bookForm, case_subject: e.target.value })} required />
                </div>
                <div>
                  <label className="note">Case Facts / Brief</label>
                  <textarea rows="3" value={bookForm.case_notes} onChange={(e) => setBookForm({ ...bookForm, case_notes: e.target.value })}></textarea>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                  <button type="button" className="secondary" onClick={() => setSelectedAdv(null)} style={{ margin: 0 }}>Cancel</button>
                  <button type="submit" style={{ margin: 0 }}>Confirm &amp; Book</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
