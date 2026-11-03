import client from './client';

export const getDeadlines = async (params = {}) => {
  const response = await client.get('/deadlines', { params });
  return response.data;
};

export const createDeadline = async (data) => {
  const response = await client.post('/deadlines', data);
  return response.data;
};

export const updateDeadlineStatus = async (id, status) => {
  const response = await client.patch(`/deadlines/${id}`, { status });
  return response.data;
};

export const deleteDeadline = async (id) => {
  const response = await client.delete(`/deadlines/${id}`);
  return response.data;
};

export const extractDeadlines = async (data) => {
  const response = await client.post('/deadlines/extract', data);
  return response.data;
};
