import client from './client';

// Advocate Dashboard & Consultations
export const getAdvocateDashboardStats = async (advocateId) => {
  const response = await client.get('/advocate/dashboard/stats', {
    params: advocateId !== undefined && advocateId !== null ? { advocate_id: advocateId } : {}
  });
  return response.data;
};

export const getPendingConsultations = async (advocateId) => {
  const response = await client.get('/advocate/consultations/pending', {
    params: advocateId !== undefined && advocateId !== null ? { advocate_id: advocateId } : {}
  });
  return response.data;
};

export const getUpcomingConsultations = async (advocateId) => {
  const response = await client.get('/advocate/consultations/upcoming', {
    params: advocateId !== undefined && advocateId !== null ? { advocate_id: advocateId } : {}
  });
  return response.data;
};

export const getAdvocateProfiles = async () => {
  const response = await client.get('/advocate/profiles');
  return response.data;
};

export const acceptConsultation = async (appointmentId) => {
  const response = await client.post(`/advocate/consultations/${appointmentId}/accept`);
  return response.data;
};

export const rejectConsultation = async (appointmentId, reason) => {
  const response = await client.post(`/advocate/consultations/${appointmentId}/reject`, { reason });
  return response.data;
};

export const rescheduleConsultation = async (appointmentId, newDate, newTime, reason = '') => {
  const response = await client.post(`/advocate/consultations/${appointmentId}/reschedule`, {
    new_date: newDate,
    new_time: newTime,
    reason
  });
  return response.data;
};

export const completeConsultation = async (appointmentId) => {
  const response = await client.post(`/advocate/consultations/${appointmentId}/complete`);
  return response.data;
};

export const getAdvocateProfile = async () => {
  const response = await client.get('/advocate/profile');
  return response.data;
};

export const updateAdvocateAvailability = async (payload) => {
  const response = await client.put('/advocate/availability', payload);
  return response.data;
};

// Case Management
export const getCases = async () => {
  const response = await client.get('/cases');
  return response.data;
};

export const getResolvedCases = async () => {
  const response = await client.get('/cases/resolved');
  return response.data;
};

export const getCaseDetail = async (caseId) => {
  const response = await client.get(`/cases/${caseId}`);
  return response.data;
};

export const createCase = async (casePayload) => {
  const response = await client.post('/cases', casePayload);
  return response.data;
};

export const updateCaseStatus = async (caseId, status, resolutionSummary = '') => {
  const response = await client.patch(`/cases/${caseId}/status`, {
    status,
    resolution_summary: resolutionSummary
  });
  return response.data;
};

export const addCaseNote = async (caseId, message, isPrivate = false, activityType = 'note') => {
  const response = await client.post(`/cases/${caseId}/notes`, {
    message,
    is_private_to_advocate: isPrivate,
    activity_type: activityType
  });
  return response.data;
};

export const scheduleCaseHearing = async (caseId, nextHearingDate, courtName = '', notes = '') => {
  const response = await client.post(`/cases/${caseId}/hearing`, {
    next_hearing_date: nextHearingDate,
    court_name: courtName,
    notes
  });
  return response.data;
};

// Dynamic slots query
export const getAdvocateSlots = async (advocateId, date) => {
  const response = await client.get(`/advocates/${advocateId}/slots`, {
    params: { date }
  });
  return response.data;
};

