import client from './client';

export const generateAgreementDraft = async (data) => {
  const response = await client.post('/generate/document', data);
  return response.data;
};

export const generateNoticeDraft = async (data) => {
  const response = await client.post('/generate/notice', data);
  return response.data;
};

export const generateEmailDraft = async (data) => {
  const response = await client.post('/generate/email', data);
  return response.data;
};

export const getUserDrafts = async () => {
  const response = await client.get('/generate/drafts');
  return response.data;
};

export const getUserDraftById = async (id) => {
  const response = await client.get(`/generate/drafts/${id}`);
  return response.data;
};

export const updateUserDraft = async (id, data) => {
  const response = await client.put(`/generate/drafts/${id}`, data);
  return response.data;
};

export const deleteUserDraft = async (id) => {
  const response = await client.delete(`/generate/drafts/${id}`);
  return response.data;
};

export const downloadDraftPdf = async (id, filename = 'legal_draft.pdf') => {
  const response = await client.get(`/generate/drafts/${id}/download`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  link.setAttribute('download', cleanName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadDraftDocx = async (id, filename = 'legal_draft.docx') => {
  const response = await client.get(`/generate/drafts/${id}/docx`, {
    responseType: 'blob'
  });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  link.setAttribute('download', cleanName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

