import api from './api.js';

export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function meRequest() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function logoutRequest() {
  const { data } = await api.post('/auth/logout');
  return data;
}
