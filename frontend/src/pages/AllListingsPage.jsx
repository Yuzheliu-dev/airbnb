import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import * as listingsApi from '../api/listings';
import * as bookingsApi from '../api/bookings';

const bookingPriority = {
  accepted: 2,
  pending: 1,
};

const calculateRating = (reviews = []) => {
  if (!reviews.length) return null;
  const scored = reviews.filter((review) => typeof review.rating === 'number');
  if (!scored.length) return null;
  const avg = scored.reduce((total, review) => total + review.rating, 0) / scored.length;
  return Math.round(avg * 10) / 10;
};

export default function AllListingsPage() {
  const { token, email } = useAuthContext();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingMeta, setBookingMeta] = useState({});

  const loadListings = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { listings: summaries } = await listingsApi.getAllListings();
      const detailed = await Promise.all(
        summaries.map(async (summary) => {
          const { listing } = await listingsApi.getListingById(summary.id);
          return {
            id: summary.id,
            ...listing,
            rating: calculateRating(listing.reviews),
            reviewCount: listing.reviews?.length ?? 0,
          };
        }),
      );
      setListings(detailed.filter((listing) => listing.published));
    } catch (err) {
      setErrorMsg(err.message || '无法加载房源列表');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    if (!token) {
      setBookingMeta({});
      return;
    }
    try {
      const { bookings } = await bookingsApi.getAllBookings(token);
      const relevant = bookings.filter(
        (booking) =>
          booking.owner === email && bookingPriority[booking.status],
      );
      const meta = {};
      relevant.forEach((booking) => {
        const listingId = Number(booking.listingId);
        const current = meta[listingId];
        if (!current || bookingPriority[booking.status] > bookingPriority[current.status]) {
          meta[listingId] = { status: booking.status };
        }
      });
      setBookingMeta(meta);
    } catch (err) {
      console.error('Failed to load bookings for ordering', err);
    }
  }, [token, email]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const derivedListings = useMemo(() => {
    if (!listings.length) return [];
    const sorted = [...listings].sort((a, b) => a.title.localeCompare(b.title));
    const prioritized = [];
    const rest = [];
    sorted.forEach((listing) => {
      if (bookingMeta[listing.id]) {
        prioritized.push(listing);
      } else {
        rest.push(listing);
      }
    });
    return [...prioritized, ...rest];
  }, [listings, bookingMeta]);

  return (
    <div style={basicContainerStyle}>
      <h1 style={titleStyle}>Explore stays</h1>
      {errorMsg && (
        <p style={{ color: '#b91c1c', marginBottom: '0.75rem' }} role="alert">
          {errorMsg}
        </p>
      )}
      {loading ? (
        <p>Loading published listings...</p>
      ) : derivedListings.length ? (
        <ul style={{ paddingLeft: '1rem' }}>
          {derivedListings.map((listing) => (
            <li key={listing.id}>
              {listing.title}
              {bookingMeta[listing.id] ? ' — 已预订' : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p>No published listings yet.</p>
      )}
    </div>
  );
}

const basicContainerStyle = {
  marginTop: '0.5rem',
  padding: '1.25rem 1.35rem',
  borderRadius: '18px',
  backgroundColor: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(148,163,184,0.38)',
  boxShadow: '0 16px 40px rgba(15,23,42,0.16)',
};

const titleStyle = {
  fontSize: '1.4rem',
  marginTop: 0,
  marginBottom: '0.8rem',
};
