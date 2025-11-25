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

export function getAllListings() {
  return request('/listings', {
    method: 'GET',
  });
}

export function getListingById(listingId) {
  return request(`/listings/${listingId}`, {
    method: 'GET',
  });
}

export function createListing(listingData, token) {
  return request('/listings/new', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(listingData),
  });
}

export function updateListing(listingId, listingData, token) {
  return request(`/listings/${listingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(listingData),
  });
}

export function deleteListing(listingId, token) {
  return request(`/listings/${listingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function publishListing(listingId, availability, token) {
  return request(`/listings/publish/${listingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ availability }),
  });
}

export function unpublishListing(listingId, token) {
  return request(`/listings/unpublish/${listingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function leaveReview(listingId, bookingId, review, token) {
  return request(`/listings/${listingId}/review/${bookingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ review }),
  });
}
