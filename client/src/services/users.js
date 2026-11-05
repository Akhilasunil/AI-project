import api from './api.js';

export async function listUsers() {
  const { data } = await api.get('/admin/users');
  return data.users;
}

export async function createUser(payload) {
  const { data } = await api.post('/admin/users', payload);
  return data.user;
}

export async function deleteUser(id) {
  await api.delete(`/admin/users/${id}`);
}

export async function updateUser(id, payload) {
  const { data } = await api.patch(`/admin/users/${id}`, payload);
  return data.user;
}
