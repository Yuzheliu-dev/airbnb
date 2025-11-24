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

export function getAllBookings(token) {
  return request('/bookings', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

