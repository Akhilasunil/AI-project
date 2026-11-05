import api from './api.js';

export async function listLearningResources(params = {}) {
  const { data } = await api.get('/learning-resources', { params });
  return data.resources;
}

export async function saveLearningResource(formData, id) {
  const response = id
    ? await api.patch(`/learning-resources/${id}`, formData)
    : await api.post('/learning-resources', formData);
  return response.data.resource;
}

export async function deleteLearningResource(id) {
  await api.delete(`/learning-resources/${id}`);
}

export async function listVisibleResources(params = {}) {
  const { data } = await api.get('/knowledge/resources', { params });
  return data.resources;
}
