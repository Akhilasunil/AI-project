import api from './api.js';

export async function listDocuments(q = '', library = 'company') {
  const { data } = await api.get('/documents', { params: { q, library } });
  return data.documents;
}

export async function uploadDocuments(formData) {
  const { data } = await api.post('/documents', formData);
  return data.documents;
}

export async function updateDocument(id, payload) {
  const { data } = await api.patch(`/documents/${id}`, payload);
  return data.document;
}

export async function reprocessDocument(id) {
  const { data } = await api.post(`/documents/${id}/reprocess`);
  return data.document;
}

export async function deleteDocument(id) {
  await api.delete(`/documents/${id}`);
}

export async function downloadDocument(id, filename) {
  const response = await api.get(`/documents/${id}/file`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'document';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
