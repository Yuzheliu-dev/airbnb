import configData from '../backend.config.json';

const BACKEND_URL = `http://localhost:${configData.BACKEND_PORT}`;

async function request(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error || data.message || 'Request failed';
    throw new Error(message);
  }

  return data;
}

export function login(email, password) {
  return request('/user/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(email, password, name) {
  return request('/user/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export function logout(token) {
  return request('/user/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}