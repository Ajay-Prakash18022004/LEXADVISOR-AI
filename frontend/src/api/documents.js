import client from './client';

export const uploadDocument = async (formData) => {
  const response = await client.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getDocuments = async () => {
  const response = await client.get('/documents');
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await client.get(`/documents/${id}`);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await client.delete(`/documents/${id}`);
  return response.data;
};

export const downloadDocumentFile = async (id, filename = 'document.pdf') => {
  const response = await client.get(`/documents/${id}/download`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
