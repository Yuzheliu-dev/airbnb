import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorNotification, SuccessNotification } from '../Common/Notification';
import * as listingsApi from '../api/listings';
import * as bookingsApi from '../api/bookings';
import { useAuthContext } from '../context/AuthContext';

const cardStyle = {
  backgroundColor: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(148,163,184,0.38)',
  borderRadius: '18px',
  padding: '1.4rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
};

const statsCardStyle = {
  flex: 1,
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '16px',
  padding: '0.9rem 1rem',
  backgroundColor: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const statusColors = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  accepted: { bg: '#dcfce7', color: '#166534', label: 'Accepted' },
  declined: { bg: '#fee2e2', color: '#b91c1c', label: 'Declined' },
};

const calculateNights = (range) => {
  if (!range?.start || !range?.end) return 0;
  const start = new Date(range.start);
  const end = new Date(range.end);
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const isWithinYear = (range, year) => {
  if (!range?.start || !range?.end) return false;
  const startYear = new Date(range.start).getFullYear();
  const endYear = new Date(range.end).getFullYear();
  return startYear === year || endYear === year;
};

export default function HostedBookingManagementPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { token, email } = useAuthContext();

  const [listing, setListing] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busyMap, setBusyMap] = useState({});

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [{ listing: listingData }, { bookings: bookingData }] = await Promise.all([
        listingsApi.getListingById(listingId),
        bookingsApi.getAllBookings(token),
      ]);
      if (listingData.owner !== email) {
        throw new Error('Only the listing owner can view bookings.');
      }
      setListing(listingData);
      const relevant = bookingData
        .filter((booking) => String(booking.listingId) === String(listingId))
        .sort(
          (a, b) =>
            new Date(b.dateRange?.start || 0).getTime() - new Date(a.dateRange?.start || 0).getTime(),
        );
      setBookings(relevant);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [listingId, token, email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBookingAction = async (bookingId, action) => {
    if (!token) return;
    setBusyMap((prev) => ({ ...prev, [bookingId]: true }));
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (action === 'accept') {
        await bookingsApi.acceptBooking(bookingId, token);
        setSuccessMsg('Booking request accepted.');
      } else {
        await bookingsApi.declineBooking(bookingId, token);
        setSuccessMsg('Booking request declined.');
      }
      await fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Action failed. Please try again later.');
    } finally {
      setBusyMap((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending'),
    [bookings],
  );

  const historyBookings = bookings;

  const stats = useMemo(() => {
    if (!listing) return { onlineDays: 0, acceptedCount: 0, bookedDays: 0, profit: 0 };
    const now = new Date();
    const posted = listing.postedOn ? new Date(listing.postedOn) : null;
    const onlineDays = posted ? Math.max(0, Math.round((now - posted) / (1000 * 60 * 60 * 24))) : 0;
    const currentYear = now.getFullYear();
    const accepted = bookings.filter((booking) => booking.status === 'accepted');
    const acceptedCount = accepted.length;
    const thisYearBookings = accepted.filter((booking) => isWithinYear(booking.dateRange, currentYear));
    const bookedDays = thisYearBookings.reduce(
      (total, booking) => total + calculateNights(booking.dateRange),
      0,
    );
    const profit = thisYearBookings.reduce((total, booking) => total + (booking.totalPrice || 0), 0);
    return { onlineDays, acceptedCount, bookedDays, profit };
  }, [listing, bookings]);

  if (!token) {
    return <p style={{ marginTop: '2rem' }}>Please log in to view booking details.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <button type="button" style={linkButtonStyle} onClick={() => navigate('/host/listings')}>
        ← Back to hosted listings
      </button>

      <header style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <h1 style={{ margin: 0 }}>Booking management</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>{listing?.title || 'Loading...'}</p>
        </div>
      </header>

      <section style={{ ...cardStyle, gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Overview</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={statsCardStyle}>
            <span style={{ color: '#6b7280' }}>Days online</span>
            <strong style={{ fontSize: '1.4rem' }}>{stats.onlineDays}</strong>
          </div>
          <div style={statsCardStyle}>
            <span style={{ color: '#6b7280' }}>Accepted bookings</span>
            <strong style={{ fontSize: '1.4rem' }}>{stats.acceptedCount}</strong>
          </div>
          <div style={statsCardStyle}>
            <span style={{ color: '#6b7280' }}>Booked days this year</span>
            <strong style={{ fontSize: '1.4rem' }}>{stats.bookedDays}</strong>
          </div>
          <div style={statsCardStyle}>
            <span style={{ color: '#6b7280' }}>Earnings this year (AUD)</span>
            <strong style={{ fontSize: '1.4rem' }}>${stats.profit}</strong>
          </div>
        </div>
      </section>

      <SuccessNotification message={successMsg} onClose={() => setSuccessMsg('')} />
      <ErrorNotification message={errorMsg} onClose={() => setErrorMsg('')} />

      <section style={cardStyle}>
        <h2 style={{ margin: 0 }}>Pending requests</h2>
        {loading ? (
          <p>Loading...</p>
        ) : pendingBookings.length ? (
          <ul style={bookingListStyle}>
            {pendingBookings.map((booking) => (
              <li key={booking.id} style={bookingCardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <strong>
                    {new Date(booking.dateRange?.start || 0).toLocaleDateString()} →{' '}
                    {new Date(booking.dateRange?.end || 0).toLocaleDateString()}
                  </strong>
                  <span>Guest: {booking.owner}</span>
                  <span>Total: ${booking.totalPrice}</span>
                  <span>Total {calculateNights(booking.dateRange)} night{calculateNights(booking.dateRange) === 1 ? '' : 's'}</span>
                </div>
                <div style={bookingActionsStyle}>
                  <button
                    type="button"
                    style={primaryButtonStyle}
                    disabled={busyMap[booking.id]}
                    onClick={() => handleBookingAction(booking.id, 'accept')}
                  >
                    {busyMap[booking.id] ? 'Submitting...' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    style={dangerButtonStyle}
                    disabled={busyMap[booking.id]}
                    onClick={() => handleBookingAction(booking.id, 'decline')}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#6b7280' }}>No pending requests.</p>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: 0 }}>All bookings</h2>
        {loading ? (
          <p>Loading...</p>
        ) : historyBookings.length ? (
          <ul style={bookingListStyle}>
            {historyBookings.map((booking) => {
              const colorSet = statusColors[booking.status] ?? statusColors.pending;
              return (
                <li key={`history-${booking.id}`} style={bookingCardStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <strong>
                      {new Date(booking.dateRange?.start || 0).toLocaleDateString()} →{' '}
                      {new Date(booking.dateRange?.end || 0).toLocaleDateString()}
                    </strong>
                    <span>Guest: {booking.owner}</span>
                    <span>Total: ${booking.totalPrice}</span>
                  </div>
                  <span
                    style={{
                      padding: '0.2rem 0.7rem',
                      borderRadius: '999px',
                      backgroundColor: colorSet.bg,
                      color: colorSet.color,
                      fontWeight: 600,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {colorSet.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ color: '#6b7280' }}>No booking history yet.</p>
        )}
      </section>
    </div>
  );
}

const linkButtonStyle = {
  alignSelf: 'flex-start',
  border: '1px solid rgba(148,163,184,0.5)',
  backgroundColor: '#fff',
  padding: '0.4rem 0.8rem',
  borderRadius: '999px',
  cursor: 'pointer',
};

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '0.45rem 0.9rem',
  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const dangerButtonStyle = {
  border: '1px solid rgba(248,113,113,0.8)',
  borderRadius: '999px',
  padding: '0.4rem 0.9rem',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const bookingListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.9rem',
};

const bookingCardStyle = {
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '16px',
  padding: '1rem',
  backgroundColor: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
};

const bookingActionsStyle = {
  display: 'flex',
  gap: '0.6rem',
  flexWrap: 'wrap',
};

