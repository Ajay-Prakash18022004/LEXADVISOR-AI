import React, { useState, useEffect } from 'react';
import { getAdvocateProfile, updateAdvocateAvailability } from '../../api/advocate';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdvocateAvailability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: 'success' });

  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [timeSlots, setTimeSlots] = useState(['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:30 PM']);
  const [newSlotInput, setNewSlotInput] = useState('06:30 PM');
  const [slotDuration, setSlotDuration] = useState(30);
  const [modes, setModes] = useState(['In-Chamber', 'Phone Consultation', 'Video Call']);

  useEffect(() => {
    const fetchAvail = async () => {
      try {
        setLoading(true);
        const data = await getAdvocateProfile();
        if (data.available_days) {
          setSelectedDays(data.available_days.split(',').map((d) => d.trim()));
        }
        if (data.available_time_slots && Array.isArray(data.available_time_slots) && data.available_time_slots.length > 0) {
          setTimeSlots(data.available_time_slots);
        }
        if (data.slot_duration_mins) {
          setSlotDuration(data.slot_duration_mins);
        }
        if (data.consultation_modes) {
          setModes(data.consultation_modes.split(',').map((m) => m.trim()));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvail();
  }, []);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) {
        alert('You must have at least one active consultation day.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleMode = (mode) => {
    if (modes.includes(mode)) {
      if (modes.length === 1) {
        alert('Please select at least one consultation mode.');
        return;
      }
      setModes(modes.filter((m) => m !== mode));
    } else {
      setModes([...modes, mode]);
    }
  };

  const addSlot = () => {
    if (!newSlotInput.trim()) return;
    if (timeSlots.includes(newSlotInput.trim())) {
      alert('This slot is already added.');
      return;
    }
    setTimeSlots([...timeSlots, newSlotInput.trim()]);
    setNewSlotInput('');
  };

  const removeSlot = (slot) => {
    if (timeSlots.length <= 1) {
      alert('At least one available time slot is required.');
      return;
    }
    setTimeSlots(timeSlots.filter((s) => s !== slot));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateAdvocateAvailability({
        available_days: selectedDays.join(','),
        available_time_slots: timeSlots,
        slot_duration_mins: Number(slotDuration),
        consultation_modes: modes.join(', ')
      });
      setFeedback({ text: 'Availability schedule updated! Only these slots will be visible to clients booking appointments.', type: 'success' });
    } catch (err) {
      setFeedback({ text: err.response?.data?.detail || 'Error saving availability schedule.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-surface-container-lowest border border-surface-container p-6 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-on-tertiary-container text-2xl">event_available</span>
          <h1 className="font-serif text-2xl font-bold text-on-surface">Availability &amp; Appointment Slots</h1>
        </div>
        <p className="text-xs text-on-surface-variant">
          Configure your chamber working schedule. The Advocate Directory booking engine queries these exact days and slots in real-time.
        </p>
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

      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm bg-surface-container-lowest border border-surface-container rounded-2xl">
          Loading availability settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Working Days */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 space-y-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div>
              <h2 className="font-serif text-base font-bold text-on-surface">1. Weekly Working Days</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Toggle days your chamber accepts client consultation bookings.</p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {ALL_DAYS.map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:bg-surface-container'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 space-y-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div>
              <h2 className="font-serif text-base font-bold text-on-surface">2. Consultation Time Slots</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Clients can only select among these active appointment slots.</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono font-bold text-on-surface"
                >
                  <span>{slot}</span>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot)}
                    className="text-on-surface-variant hover:text-rose-600 text-xs ml-1"
                    title="Remove slot"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add Slot */}
            <div className="flex items-center gap-2 pt-2 max-w-sm">
              <input
                type="text"
                placeholder="e.g. 06:30 PM"
                value={newSlotInput}
                onChange={(e) => setNewSlotInput(e.target.value)}
                className="flex-1 p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container"
              />
              <button
                type="button"
                onClick={addSlot}
                className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold border border-surface-container transition-all"
              >
                + Add Slot
              </button>
            </div>
          </div>

          {/* Slot Duration & Consultation Modes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 space-y-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <h2 className="font-serif text-base font-bold text-on-surface">3. Slot Duration</h2>
              <p className="text-xs text-on-surface-variant">Duration allocated per consultation.</p>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container font-medium"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
              </select>
            </div>

            <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 space-y-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <h2 className="font-serif text-base font-bold text-on-surface">4. Consultation Modes</h2>
              <p className="text-xs text-on-surface-variant">Select formats offered to clients.</p>
              <div className="space-y-2 pt-1">
                {['In-Chamber', 'Phone Consultation', 'Video Call'].map((m) => (
                  <label key={m} className="flex items-center gap-2.5 text-xs text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modes.includes(m)}
                      onChange={() => toggleMode(m)}
                      className="rounded border-surface-container text-primary-container focus:ring-0"
                    />
                    <span className="font-medium">{m}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-on-background text-on-primary text-xs font-bold transition-all shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Availability Schedule'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
