import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('lexadvisor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const userStr = localStorage.getItem('lexadvisor_user');
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u?.role) {
        config.headers['X-Portal-Role'] = u.role;
      }
    } catch (e) {}
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('lexadvisor_token');
    }
    return Promise.reject(error);
  }
);

// Deadlines API namespace
export const deadlinesApi = {
  getAll: (params = {}) => client.get('/deadlines', { params }),
  create: (data) => client.post('/deadlines', data),
  updateStatus: (id, status) => client.patch(`/deadlines/${id}`, { status }),
  delete: (id) => client.delete(`/deadlines/${id}`),
  extract: (data) => client.post('/deadlines/extract', data),
};

// Advocates API namespace
export const advocatesApi = {
  getNearby: (params = {}) => client.get('/advocates/nearby', { params }),
  getAppointments: (status = null) => client.get('/advocates/appointments', { params: status ? { status } : {} }),
  bookAppointment: (data) => client.post('/advocates/appointments', data),
  bookForAdvocate: (advocateId, data) => client.post(`/advocates/${advocateId}/book`, data),
  updateStatus: (id, status) => client.patch(`/advocates/appointments/${id}/status`, { status }),
  deleteAppointment: (id) => client.delete(`/advocates/appointments/${id}`),
};

// Chat API namespace
export const chatApi = {
  askQuestion: (payload) => client.post('/chat/ask', payload),
  getProactiveBrief: (payload) => client.post('/chat/proactive-brief', payload),
  getProactiveBriefById: (docId) => client.get(`/chat/proactive-brief/${docId}`),
  getHistory: (docId) => client.get(`/chat/history/${docId}`),
};

// Analysis API namespace
export const analysisApi = {
  runFull: (formData) => client.post('/analysis/full', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  runForDoc: (docId) => client.post(`/analysis/${docId}/run`),
  getReport: (docId) => client.get(`/analysis/${docId}/report`),
  analyzeStamp: (formData) => client.post('/stamp/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyzeRisk: (formData) => client.post('/risk/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  recommendActions: (formData) => client.post('/actions/recommend', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: () => client.get('/analysis/history'),
};

export default client;
