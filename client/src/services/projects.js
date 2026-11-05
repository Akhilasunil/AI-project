import api from './api.js';

export async function listProjects(q = '') {
  const { data } = await api.get('/projects', { params: { q } });
  return data.projects;
}

export async function getProject(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function createProject(formData) {
  const { data } = await api.post('/projects', formData);
  return data.project;
}

export async function updateProject(id, payload) {
  const { data } = await api.patch(`/projects/${id}`, payload);
  return data.project;
}

export async function deleteProject(id) {
  await api.delete(`/projects/${id}`);
}

export async function reprocessProject(id) {
  const { data } = await api.post(`/projects/${id}/reprocess`);
  return data.project;
}

export async function downloadProjectDocument(id, filename) {
  const response = await api.get(`/projects/${id}/file`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'project-documentation';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
