import { vi } from 'vitest';

const users = new Map();
const listings = new Map();
const bookings = new Map();
const tokens = new Map();
let listingIdCounter = 1;
let bookingIdCounter = 1;

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const issueToken = (email) => {
  const token = `${email}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  tokens.set(token, email);
  return token;
};

const getOwner = (token) => {
  const email = tokens.get(token);
  if (!email) throw new Error('Invalid token');
  return email;
};

export const resetStores = () => {
  users.clear();
  listings.clear();
  bookings.clear();
  tokens.clear();
  listingIdCounter = 1;
  bookingIdCounter = 1;
  localStorage.clear();
};

vi.mock('../context/NotificationsContext', () => ({
  NotificationsProvider: ({ children }) => children,
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAllAsRead: vi.fn(),
    dismissNotification: vi.fn(),
  }),
}));

vi.mock('../api/auth', () => ({
  login: vi.fn(async (email, password) => {
    const record = users.get(email);
    if (!record || record.password !== password) {
      throw new Error('Invalid email or password');
    }
    const token = issueToken(email);
    return { token, name: record.name };
  }),
  register: vi.fn(async (email, password, name) => {
    if (users.has(email)) throw new Error('User already exists');
    users.set(email, { password, name });
    const token = issueToken(email);
    return { token, name };
  }),
  logout: vi.fn(async (token) => {
    tokens.delete(token);
    return {};
  }),
}));

vi.mock('../api/listings', () => ({
  getAllListings: vi.fn(async () => ({
    listings: Array.from(listings.values()).map((listing) => ({
      id: listing.id,
      owner: listing.owner,
      postedOn: listing.postedOn,
      title: listing.title,
    })),
  })),
  getListingById: vi.fn(async (listingId) => {
    const listing = listings.get(String(listingId));
    if (!listing) throw new Error('Listing not found');
    return { listing: clone(listing) };
  }),
  createListing: vi.fn(async (payload, token) => {
    const owner = getOwner(token);
    const id = String(listingIdCounter++);
    listings.set(id, {
      id,
      owner,
      postedOn: new Date().toISOString(),
      published: false,
      availability: [],
      reviews: [],
      ...clone(payload),
      metadata: {
        amenities: payload.metadata.amenities || [],
        description: payload.metadata.description || '',
        gallery: payload.metadata.gallery || [],
        thumbnailVideoUrl: payload.metadata.thumbnailVideoUrl,
        propertyType: payload.metadata.propertyType,
        bedrooms: payload.metadata.bedrooms,
        beds: payload.metadata.beds,
        bathrooms: payload.metadata.bathrooms,
      },
    });
    return { listingId: id };
  }),
  updateListing: vi.fn(async (listingId, payload, token) => {
    const owner = getOwner(token);
    const listing = listings.get(String(listingId));
    if (!listing || listing.owner !== owner) throw new Error('Listing not found');
    listing.title = payload.title;
    listing.address = payload.address;
    listing.price = payload.price;
    listing.thumbnail = payload.thumbnail;
    listing.metadata = { ...listing.metadata, ...payload.metadata };
    listings.set(String(listingId), listing);
    return {};
  }),
  publishListing: vi.fn(async (listingId, availability, token) => {
    const owner = getOwner(token);
    const listing = listings.get(String(listingId));
    if (!listing || listing.owner !== owner) throw new Error('Listing not found');
    listing.published = true;
    listing.availability = clone(availability);
    listings.set(String(listingId), listing);
    return {};
  }),
  unpublishListing: vi.fn(async (listingId, token) => {
    const owner = getOwner(token);
    const listing = listings.get(String(listingId));
    if (!listing || listing.owner !== owner) throw new Error('Listing not found');
    listing.published = false;
    listing.availability = [];
    listings.set(String(listingId), listing);
    return {};
  }),
  deleteListing: vi.fn(async () => ({})),
  leaveReview: vi.fn(async () => ({})),
}));

vi.mock('../api/bookings', () => ({
  getAllBookings: vi.fn(async () => ({
    bookings: Array.from(bookings.values()).map((booking) => clone(booking)),
  })),
  createBooking: vi.fn(async (listingId, dateRange, totalPrice, token) => {
    const owner = getOwner(token);
    const listing = listings.get(String(listingId));
    if (!listing || !listing.published) throw new Error('Listing not available');
    const id = String(bookingIdCounter++);
    bookings.set(id, {
      id,
      listingId: String(listingId),
      owner,
      status: 'pending',
      dateRange: clone(dateRange),
      totalPrice,
    });
    return { bookingId: id };
  }),
  acceptBooking: vi.fn(async () => ({})),
  declineBooking: vi.fn(async () => ({})),
  deleteBooking: vi.fn(async () => ({})),
}));

