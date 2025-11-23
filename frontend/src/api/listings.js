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

/**
 * Get all listings (summary data)
 * @returns {Promise<{listings: Array}>}
 */
export function getAllListings() {
  return request('/listings', {
    method: 'GET',
  });
}

/**
 * Get detailed information about a specific listing
 * @param {number} listingId - The ID of the listing
 * @returns {Promise<{listing: Object}>}
 */
export function getListingById(listingId) {
  return request(`/listings/${listingId}`, {
    method: 'GET',
  });
}

/**
 * Create a new listing
 * @param {Object} listingData - The listing data
 * @param {string} listingData.title - Listing title
 * @param {Object} listingData.address - Address object
 * @param {number} listingData.price - Price per night
 * @param {string} listingData.thumbnail - Thumbnail image URL or base64
 * @param {Object} listingData.metadata - Metadata object (propertyType, bedrooms, beds, bathrooms, amenities, etc.)
 * @param {string} token - Authorization token
 * @returns {Promise<{listingId: number}>}
 */
export function createListing(listingData, token) {
  return request('/listings/new', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(listingData),
  });
}

/**
 * Update an existing listing
 * @param {number} listingId - The ID of the listing to update
 * @param {Object} listingData - The updated listing data
 * @param {string} token - Authorization token
 * @returns {Promise<void>}
 */
export function updateListing(listingId, listingData, token) {
  return request(`/listings/${listingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(listingData),
  });
}

/**
 * Delete a listing
 * @param {number} listingId - The ID of the listing to delete
 * @param {string} token - Authorization token
 * @returns {Promise<void>}
 */
export function deleteListing(listingId, token) {
  return request(`/listings/${listingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Publish a listing with availability ranges
 * @param {number} listingId - The ID of the listing to publish
 * @param {Array<{start: string, end: string}>} availability - Array of availability date ranges
 * @param {string} token - Authorization token
 * @returns {Promise<void>}
 */
export function publishListing(listingId, availability, token) {
  return request(`/listings/publish/${listingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ availability }),
  });
}

/**
 * Unpublish a listing
 * @param {number} listingId - The ID of the listing to unpublish
 * @param {string} token - Authorization token
 * @returns {Promise<void>}
 */
export function unpublishListing(listingId, token) {
  return request(`/listings/unpublish/${listingId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

