import client from './client';

export const runFullAnalysis = async (formData) => {
  const response = await client.post('/analysis/full', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const runAnalysisForDocId = async (docId) => {
  const response = await client.post(`/analysis/${docId}/run`);
  return response.data;
};

export const getAnalysisReport = async (docId) => {
  const response = await client.get(`/analysis/${docId}/report`);
  return response.data;
};

export const analyzeStamp = async (formData) => {
  const response = await client.post('/stamp/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const analyzeRisk = async (formData) => {
  const response = await client.post('/risk/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const recommendActions = async (formData) => {
  const response = await client.post('/actions/recommend', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getCustomerHistory = async () => {
  const response = await client.get('/analysis/history');
  return response.data;
};

export const getHistoryDocReport = async (docId) => {
  const response = await client.get(`/analysis/history/${docId}`);
  return response.data;
};

export const deleteHistoryDoc = async (docId) => {
  const response = await client.delete(`/analysis/history/${docId}`);
  return response.data;
};

export const downloadRiskReportPdf = async ({ docId, riskData, documentTitle, state, docType }) => {
  let response;
  if (docId) {
    response = await client.get(`/risk/${docId}/pdf`, { responseType: 'blob' });
  } else {
    response = await client.post('/risk/pdf', {
      risk: riskData,
      document_title: documentTitle || 'Contract Risk Audit Report',
      state: state || 'Telangana',
      doc_type: docType || 'Legal Agreement'
    }, { responseType: 'blob' });
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = (documentTitle || 'Contract_Risk_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `${cleanName}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadActionPlanPdf = async ({ docId, planData, documentTitle, clientName }) => {
  let response;
  if (docId) {
    response = await client.get(`/actions/${docId}/pdf`, { responseType: 'blob' });
  } else {
    response = await client.post('/actions/pdf', {
      plan: planData,
      document_title: documentTitle || 'Legal Action Roadmap',
      client_name: clientName || 'Valued Client'
    }, { responseType: 'blob' });
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = (documentTitle || 'Legal_Action_Roadmap').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `${cleanName}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

