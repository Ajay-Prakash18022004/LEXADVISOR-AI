import client from './client';

export const askLegalQuestion = async (query, documentId = null, documentText = null) => {
  const response = await client.post('/chat/ask', {
    query,
    document_id: documentId,
    document_text: documentText
  });
  return response.data;
};

export const getProactiveBrief = async ({ documentId = null, documentText = '' } = {}) => {
  const response = await client.post('/chat/proactive-brief', {
    document_id: documentId,
    document_text: documentText
  });
  return response.data;
};

export const getChatHistory = async (documentId) => {
  const response = await client.get(`/chat/history/${documentId}`);
  return response.data;
};

