import api from './api.js';

export async function askQuestion(question) {
  const { data } = await api.post('/ask', { question });
  return data;
}

export async function listVisibleDocuments(q = '', library) {
  const { data } = await api.get('/knowledge/documents', { params: { q, library } });
  return data.documents;
}

export async function getVisibleDocument(id) {
  const { data } = await api.get(`/knowledge/documents/${id}`);
  return data;
}

export async function getAdminSummary() {
  const { data } = await api.get('/admin/summary');
  return data.summary;
}

export async function listKnowledgeGaps() {
  const { data } = await api.get('/admin/gaps');
  return data.gaps;
}

export async function getKnowledgeCounts() {
  const { data } = await api.get('/admin/knowledge-counts');
  return data.counts;
}
