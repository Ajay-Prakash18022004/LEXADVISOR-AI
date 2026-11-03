import React, { useState, useEffect } from 'react';
import { getDeadlines, createDeadline, updateDeadlineStatus, deleteDeadline, extractDeadlines } from '../api/deadlines';

export default function Deadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('rent');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newRecurrence, setNewRecurrence] = useState('monthly');
  const [newRemindDays, setNewRemindDays] = useState(3);
  const [newNotes, setNewNotes] = useState('');

  // Extract State
  const [extractText, setExtractText] = useState('');
  const [extracting, setExtracting] = useState(false);

  const fetchDeadlinesList = async () => {
    try {
      setLoading(true);
      const data = await getDeadlines();
      setDeadlines(data);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to load deadlines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlinesList();
  }, []);

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateDeadlineStatus(item.id, nextStatus);
      fetchDeadlinesList();
      setStatusMsg(`Updated "${item.title}" to ${nextStatus}.`);
    } catch (err) {
      alert(`Error updating deadline: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deadline tracker entry?')) return;
    try {
      await deleteDeadline(id);
      fetchDeadlinesList();
      setStatusMsg('Deadline deleted successfully.');
    } catch (err) {
      alert(`Error deleting deadline: ${err.message}`);
    }
  };

  const handleCreateDeadline = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) {
      alert('Please enter a title and due date.');
      return;
    }

    try {
      await createDeadline({
        title: newTitle.trim(),
        category: newCategory,
        due_date: newDueDate,
        amount: newAmount ? parseFloat(newAmount) : null,
        recurrence: newRecurrence,
        remind_days_before: parseInt(newRemindDays, 10) || 3,
        notes: newNotes.trim() || null,
        status: 'pending'
      });
      setShowAddModal(false);
      resetForm();
      fetchDeadlinesList();
      setStatusMsg('New deadline tracked successfully.');
    } catch (err) {
      alert(`Error creating deadline: ${err.message}`);
    }
  };

  const handleAutoExtract = async (e) => {
    e.preventDefault();
    if (!extractText.trim()) {
      alert('Please paste agreement or bond text to extract deadlines.');
      return;
    }

    try {
      setExtracting(true);
      const res = await extractDeadlines({ text: extractText.trim() });
      setShowExtractModal(false);
      setExtractText('');
      fetchDeadlinesList();
      setStatusMsg(`Auto-extracted and scheduled ${res.deadlines?.length || 0} statutory & contract deadlines!`);
    } catch (err) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setExtracting(false);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewCategory('rent');
    setNewDueDate('');
    setNewAmount('');
    setNewRecurrence('monthly');
    setNewRemindDays(3);
    setNewNotes('');
  };

  const filtered = deadlines.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'completed') return d.status === 'completed';
    return d.category === filter;
  });

  const pendingCount = deadlines.filter((d) => d.status === 'pending').length;
  const completedCount = deadlines.filter((d) => d.status === 'completed').length;

  return (
    <div>
      <article>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>⏳ Deadline & Bond Rules Tracker</h2>
            <p className="note" style={{ maxWidth: '720px' }}>
              Never miss a monthly rent deadline, lease renewal notice window, or statutory 4-month Sub-Registrar registration deadline. Tracks penalty bond conditions under Section 74 of the Indian Contract Act.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setShowAddModal(true)} style={{ marginTop: 0 }}>
              + Add Deadline
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setShowExtractModal(true)}
              style={{ marginTop: 0 }}
            >
              ⚡ Auto-Extract from Agreement
            </button>
          </div>
        </div>

        {statusMsg && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '6px', fontSize: '0.85rem', color: '#166534' }}>
            {statusMsg}
          </div>
        )}

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '20px' }}>
          <div style={{ padding: '16px', border: '1px solid var(--line)', borderRadius: '8px', background: '#fafafa' }}>
            <div className="note">Total Tracked</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>{deadlines.length}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Rent, Lease, Bond & Statutory</div>
          </div>
          <div style={{ padding: '16px', border: '1px solid #fed7aa', borderRadius: '8px', background: '#fffbeb' }}>
            <div className="note" style={{ color: '#b45309' }}>Pending / Action Due</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#b45309' }}>Immediate action required</div>
          </div>
          <div style={{ padding: '16px', border: '1px solid #bbf7d0', borderRadius: '8px', background: '#f0fdf4' }}>
            <div className="note" style={{ color: '#15803d' }}>Completed / Settled</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#16a34a' }}>{completedCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#15803d' }}>Paid on time & compliant</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'rent', 'lease_notice', 'bond_rule', 'statutory', 'completed'].map((f) => (
            <button
              key={f}
              type="button"
              className={`sample-btn ${filter === f ? 'active' : ''}`}
              style={{
                background: filter === f ? '#0284c7' : '#f1f5f9',
                color: filter === f ? '#ffffff' : '#475569',
                borderColor: filter === f ? '#0284c7' : '#cbd5e1',
                padding: '5px 12px',
                fontSize: '0.8rem'
              }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' && 'All Deadlines'}
              {f === 'pending' && '⏳ Pending Only'}
              {f === 'rent' && '🏠 Monthly Rent'}
              {f === 'lease_notice' && '📄 Lease Renewal Notice'}
              {f === 'bond_rule' && '⚖️ Bond / Forfeiture Rule'}
              {f === 'statutory' && '🏛️ Statutory Registration'}
              {f === 'completed' && '✅ Completed'}
            </button>
          ))}
        </div>

        {/* Deadline Items */}
        <div style={{ marginTop: '20px' }}>
          {loading ? (
            <p className="note">Loading deadline schedule...</p>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
              <p className="note">No deadlines found for this filter.</p>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowAddModal(true)}
                style={{ marginTop: '8px' }}
              >
                + Add First Deadline
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filtered.map((item) => {
                const isPending = item.status === 'pending';
                const isOverdue = isPending && item.days_remaining !== null && item.days_remaining < 0;
                const isDueSoon = isPending && item.days_remaining !== null && item.days_remaining >= 0 && item.days_remaining <= 5;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '8px',
                      border: isOverdue
                        ? '1px solid #fca5a5'
                        : isDueSoon
                        ? '1px solid #fcd34d'
                        : '1px solid var(--line)',
                      background: isOverdue ? '#fff5f5' : isDueSoon ? '#fffdf0' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{item.title}</strong>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background:
                              item.category === 'rent'
                                ? '#dbeafe'
                                : item.category === 'bond_rule'
                                ? '#fee2e2'
                                : item.category === 'statutory'
                                ? '#fef3c7'
                                : '#e0e7ff',
                            color:
                              item.category === 'rent'
                                ? '#1e40af'
                                : item.category === 'bond_rule'
                                ? '#991b1b'
                                : item.category === 'statutory'
                                ? '#92400e'
                                : '#3730a3',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          {item.category.replace('_', ' ')}
                        </span>

                        {isOverdue && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: '#dc2626', color: '#ffffff', fontWeight: 700 }}>
                            ⚠️ OVERDUE ({Math.abs(item.days_remaining)} days ago)
                          </span>
                        )}
                        {isDueSoon && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: '#d97706', color: '#ffffff', fontWeight: 700 }}>
                            ⏰ DUE IN {item.days_remaining} DAYS
                          </span>
                        )}
                        {!isOverdue && !isDueSoon && isPending && item.days_remaining !== null && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: '#0284c7', color: '#ffffff', fontWeight: 600 }}>
                            {item.days_remaining} days remaining
                          </span>
                        )}
                        {!isPending && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: '#16a34a', color: '#ffffff', fontWeight: 700 }}>
                            ✓ COMPLETED
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
                        <div>
                          <strong>Due Date:</strong> {new Date(item.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {item.amount && (
                          <div>
                            <strong>Amount:</strong> ₹{item.amount.toLocaleString('en-IN')}
                          </div>
                        )}
                        <div>
                          <strong>Recurrence:</strong> {item.recurrence || 'Once'}
                        </div>
                      </div>

                      {item.notes && (
                        <div style={{ marginTop: '8px', fontSize: '0.83rem', color: '#334155', background: 'rgba(0,0,0,0.02)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #0284c7' }}>
                          <strong>Bond Rule / Note:</strong> {item.notes}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        style={{
                          marginTop: 0,
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          background: isPending ? '#16a34a' : '#64748b',
                          borderColor: isPending ? '#16a34a' : '#64748b',
                          color: '#fff',
                          minWidth: '130px'
                        }}
                      >
                        {isPending ? '✓ Mark as Paid / Settled' : '↺ Mark Pending'}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleDelete(item.id)}
                        style={{
                          marginTop: 0,
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          color: '#dc2626',
                          borderColor: '#fca5a5'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </article>

      {/* Manual Add Deadline Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0 }}>Add New Deadline / Bond Rule</h3>
            <p className="note" style={{ fontSize: '0.82rem' }}>
              Track rent payment dates, grace periods, or security bond conditions under Indian tenancy laws.
            </p>

            <form onSubmit={handleCreateDeadline} style={{ marginTop: '14px', display: 'grid', gap: '12px' }}>
              <div>
                <label className="note">Title / Obligation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Rent Payment (Flat 302)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="note">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                    <option value="rent">Monthly Rent</option>
                    <option value="lease_notice">Lease Renewal / Exit Notice</option>
                    <option value="bond_rule">Bond Rule / Forfeiture</option>
                    <option value="statutory">Registration (Section 23)</option>
                    <option value="compliance">General Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="note">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="note">Amount (₹, optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 35000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="note">Recurrence</label>
                  <select value={newRecurrence} onChange={(e) => setNewRecurrence(e.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="once">One-time</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="note">Bond Rule & Penalty Notes (Plain English)</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Payable on or before 5th. 3-day grace period. Late fee Rs. 200/day capped under Section 74 Contract Act."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowAddModal(false)}
                  style={{ marginTop: 0 }}
                >
                  Cancel
                </button>
                <button type="submit" style={{ marginTop: 0 }}>
                  Save Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Extract Modal */}
      {showExtractModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', maxWidth: '580px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0 }}>⚡ Auto-Extract Deadlines & Bond Rules</h3>
            <p className="note" style={{ fontSize: '0.82rem' }}>
              Paste your agreement clause or contract text. The AI extracts monthly rent payment days (e.g., 5th of each month), grace periods, lease expiry notice windows, and statutory registration deadlines.
            </p>

            <form onSubmit={handleAutoExtract} style={{ marginTop: '14px' }}>
              <textarea
                rows="6"
                required
                placeholder="Paste agreement text here, e.g.: 'Tenure of 11 months commencing 15/03/2026. Monthly rent of Rs. 35,000/- payable on or before 5th of each calendar month. Either party may terminate with 1 month notice...'"
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowExtractModal(false)}
                  style={{ marginTop: 0 }}
                  disabled={extracting}
                >
                  Cancel
                </button>
                <button type="submit" style={{ marginTop: 0 }} disabled={extracting}>
                  {extracting ? 'Analyzing Dates & Rules...' : 'Extract & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
