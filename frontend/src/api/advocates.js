import client from './client';

export const getNearbyAdvocates = async (params = {}) => {
  const response = await client.get('/advocates/nearby', { params });
  return response.data;
};

export const getAppointments = async (status = null) => {
  const params = status ? { status } : {};
  const response = await client.get('/advocates/appointments', { params });
  return response.data;
};

export const getPendingAppointments = async () => {
  const response = await client.get('/advocates/appointments/pending');
  return response.data;
};

export const bookAppointment = async (advocateId, data) => {
  const response = await client.post(`/advocates/${advocateId}/book`, data);
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await client.patch(`/advocates/appointments/${appointmentId}/status`, { status });
  return response.data;
};

export const deleteAppointment = async (appointmentId) => {
  const response = await client.delete(`/advocates/appointments/${appointmentId}`);
  return response.data;
};
