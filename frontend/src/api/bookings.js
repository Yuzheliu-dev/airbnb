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

export function createBooking(listingId, dateRange, totalPrice, token) {
  return request(`/bookings/new/${listingId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dateRange, totalPrice }),
  });
}

export function deleteBooking(bookingId, token) {
  return request(`/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function acceptBooking(bookingId, token) {
  return request(`/bookings/accept/${bookingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function declineBooking(bookingId, token) {
  return request(`/bookings/decline/${bookingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
