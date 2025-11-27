import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorNotification } from '../Common/Notification';
import { useAuthContext } from '../context/AuthContext';
import * as listingsApi from '../api/listings';
import * as bookingsApi from '../api/bookings';

const filterDefaults = {
  searchTerm: '',
  bedroomsMin: '',
  bedroomsMax: '',
  bedroomsOrder: 'asc',
  bedroomsEnabled: false,
  priceMin: '',
  priceMax: '',
  priceOrder: 'asc',
  priceEnabled: false,
  dateStart: '',
  dateEnd: '',
  dateOrder: 'asc',
  dateEnabled: false,
  ratingOrder: 'desc',
  ratingEnabled: false,
};

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

const matchesSearch = (listing, term) => {
  if (!term) return true;
  const target = term.toLowerCase();
  const title = listing.title?.toLowerCase() ?? '';
  const city = listing.address?.city?.toLowerCase() ?? '';
  return title.includes(target) || city.includes(target);
};

const hasAvailabilityForRange = (listing, startDate, endDate) => {
  if (!startDate || !endDate) return true;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return false;
  return (listing.availability || []).some((range) => {
    const rangeStart = new Date(range.start);
    const rangeEnd = new Date(range.end);
    return start >= rangeStart && end <= rangeEnd;
  });
};

const ensureNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatAddress = (address = {}) => {
  const parts = [address.city, address.state, address.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location to be confirmed';
};

export default function AllListingsPage() {
  const navigate = useNavigate();
  const { token, email, isAuthenticated } = useAuthContext();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filterDraft, setFilterDraft] = useState({ ...filterDefaults });
  const [appliedFilters, setAppliedFilters] = useState({ ...filterDefaults });
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
      setErrorMsg(err.message || 'Unable to load listings.');
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

  const validateFilters = (filters) => {
    if (filters.bedroomsEnabled) {
      const min = ensureNumber(filters.bedroomsMin);
      const max = ensureNumber(filters.bedroomsMax);
      if (min !== null && max !== null && min > max) {
        return 'Minimum bedrooms cannot exceed maximum.';
      }
    }
    if (filters.priceEnabled) {
      const min = ensureNumber(filters.priceMin);
      const max = ensureNumber(filters.priceMax);
      if (min !== null && max !== null && min > max) {
        return 'Minimum price cannot exceed maximum.';
      }
    }
    if (filters.dateEnabled) {
      if (filters.dateStart && filters.dateEnd && filters.dateStart > filters.dateEnd) {
        return 'Please choose a valid date range.';
      }
    }
    return '';
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const validationMsg = validateFilters(filterDraft);
    if (validationMsg) {
      setErrorMsg(validationMsg);
      return;
    }
    setErrorMsg('');
    const nextFilters = {
      ...filterDraft,
      searchTerm: filterDraft.searchTerm.trim(),
    };
    setFilterDraft(nextFilters);
    setAppliedFilters(nextFilters);
  };

  const handleReset = () => {
    setFilterDraft({ ...filterDefaults });
    setAppliedFilters({ ...filterDefaults });
    setErrorMsg('');
  };

  const handleDraftChange = (field) => (event) => {
    const value = event.target.value;
    setFilterDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleChange = (field) => (event) => {
    const checked = event.target.checked;
    setFilterDraft((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const derivedListings = useMemo(() => {
    if (!listings.length) return [];
    const appliedTerm = appliedFilters.searchTerm?.toLowerCase() ?? '';
    let pool = listings.filter((listing) => {
      if (!matchesSearch(listing, appliedTerm)) return false;
      if (appliedFilters.bedroomsEnabled) {
        const min = ensureNumber(appliedFilters.bedroomsMin);
        const max = ensureNumber(appliedFilters.bedroomsMax);
        const count = listing.metadata?.bedrooms ?? 0;
        if (min !== null && count < min) return false;
        if (max !== null && count > max) return false;
      }
      if (appliedFilters.priceEnabled) {
        const min = ensureNumber(appliedFilters.priceMin);
        const max = ensureNumber(appliedFilters.priceMax);
        if (min !== null && listing.price < min) return false;
        if (max !== null && listing.price > max) return false;
      }
      if (appliedFilters.dateEnabled) {
        if (!hasAvailabilityForRange(listing, appliedFilters.dateStart, appliedFilters.dateEnd)) {
          return false;
        }
      }
      return true;
    });

    const sortAsc = (a, b) => a - b;
    const sortDesc = (a, b) => b - a;

    if (appliedFilters.type === 'bedrooms') {
      const order = appliedFilters.data.bedroomsOrder === 'desc' ? sortDesc : sortAsc;
      pool = [...pool].sort((a, b) =>
        order(a.metadata?.bedrooms ?? 0, b.metadata?.bedrooms ?? 0),
      );
    } else if (appliedFilters.type === 'price') {
      const order = appliedFilters.data.priceOrder === 'desc' ? sortDesc : sortAsc;
      pool = [...pool].sort((a, b) => order(a.price, b.price));
    } else if (appliedFilters.type === 'date') {
      const order = appliedFilters.data.dateOrder === 'desc' ? sortDesc : sortAsc;
      pool = [...pool].sort((a, b) => {
        const firstA = new Date(a.availability?.[0]?.start || 0).getTime();
        const firstB = new Date(b.availability?.[0]?.start || 0).getTime();
        return order(firstA, firstB);
      });
    } else {
      pool = [...pool].sort((a, b) => a.title.localeCompare(b.title));
    }

    const prioritized = [];
    const rest = [];
    pool.forEach((listing) => {
      if (bookingMeta[listing.id]) {
        prioritized.push(listing);
      } else {
        rest.push(listing);
      }
    });
    return [...prioritized, ...rest];
  }, [listings, bookingMeta, appliedFilters]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (appliedFilters.bedroomsEnabled) {
      const min = appliedFilters.bedroomsMin || 'Any';
      const max = appliedFilters.bedroomsMax || 'Any';
      const order = appliedFilters.bedroomsOrder === 'desc' ? 'High → Low' : 'Low → High';
      chips.push(`Bedrooms ${min}-${max} (${order})`);
    }
    if (appliedFilters.priceEnabled) {
      const min = appliedFilters.priceMin || 'Any';
      const max = appliedFilters.priceMax || 'Any';
      const order = appliedFilters.priceOrder === 'desc' ? 'High → Low' : 'Low → High';
      chips.push(`Price ${min}-${max} (${order})`);
    }
    if (appliedFilters.dateEnabled && appliedFilters.dateStart && appliedFilters.dateEnd) {
      chips.push(`Dates ${appliedFilters.dateStart} → ${appliedFilters.dateEnd}`);
    }
    if (appliedFilters.ratingEnabled) {
      const order = appliedFilters.ratingOrder === 'desc' ? 'High → Low' : 'Low → High';
      chips.push(`Rating (${order})`);
    }
    return chips;
  }, [appliedFilters]);

  return (
    <div style={basicContainerStyle}>
      <h1 style={titleStyle}>Explore stays</h1>
      {isAuthenticated && (
        <p style={infoTextStyle}>Listings you have booked appear at the top.</p>
      )}
      <form onSubmit={handleSearch} style={simpleFormStyle}>
        <label style={simpleLabelStyle}>
          Search title / city
          <input
            type="text"
            value={filterDraft.searchTerm}
            onChange={handleDraftChange('searchTerm')}
            placeholder="Sydney / Seaview / Loft..."
          />
        </label>
        <fieldset style={filterFieldsetStyle}>
          <label style={filterToggleStyle}>
            <input
              type="checkbox"
              checked={filterDraft.bedroomsEnabled}
              onChange={handleToggleChange('bedroomsEnabled')}
            />
            Filter by bedrooms
          </label>
          <div style={filterGridStyle}>
            <label style={filterGroupLabelStyle}>
              Min
              <input
                type="number"
                min="0"
                value={filterDraft.bedroomsMin}
                onChange={handleDraftChange('bedroomsMin')}
                disabled={!filterDraft.bedroomsEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              Max
              <input
                type="number"
                min="0"
                value={filterDraft.bedroomsMax}
                onChange={handleDraftChange('bedroomsMax')}
                disabled={!filterDraft.bedroomsEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              Sort order
              <select
                value={filterDraft.bedroomsOrder}
                onChange={handleDraftChange('bedroomsOrder')}
                disabled={!filterDraft.bedroomsEnabled}
              >
                <option value="asc">Low → High</option>
                <option value="desc">High → Low</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset style={filterFieldsetStyle}>
          <label style={filterToggleStyle}>
            <input
              type="checkbox"
              checked={filterDraft.priceEnabled}
              onChange={handleToggleChange('priceEnabled')}
            />
            Filter by price range
          </label>
          <div style={filterGridStyle}>
            <label style={filterGroupLabelStyle}>
              Min (AUD)
              <input
                type="number"
                min="0"
                value={filterDraft.priceMin}
                onChange={handleDraftChange('priceMin')}
                disabled={!filterDraft.priceEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              Max (AUD)
              <input
                type="number"
                min="0"
                value={filterDraft.priceMax}
                onChange={handleDraftChange('priceMax')}
                disabled={!filterDraft.priceEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              Sort order
              <select
                value={filterDraft.priceOrder}
                onChange={handleDraftChange('priceOrder')}
                disabled={!filterDraft.priceEnabled}
              >
                <option value="asc">Low → High</option>
                <option value="desc">High → Low</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset style={filterFieldsetStyle}>
          <label style={filterToggleStyle}>
            <input
              type="checkbox"
              checked={filterDraft.dateEnabled}
              onChange={handleToggleChange('dateEnabled')}
            />
            Filter by availability dates
          </label>
          <div style={filterGridStyle}>
            <label style={filterGroupLabelStyle}>
              Start date
              <input
                type="date"
                value={filterDraft.dateStart}
                onChange={handleDraftChange('dateStart')}
                disabled={!filterDraft.dateEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              End date
              <input
                type="date"
                value={filterDraft.dateEnd}
                onChange={handleDraftChange('dateEnd')}
                disabled={!filterDraft.dateEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              Sort order
              <select
                value={filterDraft.dateOrder}
                onChange={handleDraftChange('dateOrder')}
                disabled={!filterDraft.dateEnabled}
              >
                <option value="asc">Soonest availability first</option>
                <option value="desc">Latest availability first</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset style={filterFieldsetStyle}>
          <label style={filterToggleStyle}>
            <input
              type="checkbox"
              checked={filterDraft.ratingEnabled}
              onChange={handleToggleChange('ratingEnabled')}
            />
            Sort by rating
          </label>
          <div style={filterGridStyle}>
            <label style={filterGroupLabelStyle}>
              Sort order
              <select
                value={filterDraft.ratingOrder}
                onChange={handleDraftChange('ratingOrder')}
                disabled={!filterDraft.ratingEnabled}
              >
                <option value="desc">High → Low</option>
                <option value="asc">Low → High</option>
              </select>
            </label>
          </div>
        </fieldset>

        <div style={simpleButtonRowStyle}>
          <button type="submit">Apply filters</button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
      <ErrorNotification message={errorMsg} onClose={() => setErrorMsg('')} />
      {activeFilterChips.length > 0 && (
        <ul style={activeChipsStyle}>
          {activeFilterChips.map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
        </ul>
      )}
      {loading ? (
        <p>Loading published listings...</p>
      ) : derivedListings.length ? (
        <div style={listingsGridStyle}>
          {derivedListings.map((listing) => (
            <article key={listing.id} style={listingCardStyle}>
              <div style={thumbnailWrapperStyle}>
                <img
                  src={listing.thumbnail}
                  alt={`${listing.title} thumbnail`}
                  style={listingThumbnailStyle}
                />
                {bookingMeta[listing.id] && (
                  <span style={statusPillStyle}>
                    {bookingMeta[listing.id].status === 'accepted' ? 'Accepted booking' : 'Pending'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <div style={cardHeaderStyle}>
                  <h3 style={cardTitleStyle}>{listing.title}</h3>
                  <span style={ratingStyle}>
                    ⭐ {listing.rating ?? 'N/A'}
                    {listing.reviewCount ? ` (${listing.reviewCount})` : ''}
                  </span>
                </div>
                <p style={addressStyle}>{formatAddress(listing.address)}</p>
                <div style={cardStatsRowStyle}>
                  <span>{listing.metadata?.bedrooms ?? 0} bedrooms</span>
                  <span>{listing.metadata?.beds ?? 0} beds</span>
                  <span>{listing.metadata?.bathrooms ?? 0} baths</span>
                </div>
                <div style={cardFooterRowStyle}>
                  <strong>${listing.price} / night</strong>
                  <button
                    type="button"
                    style={detailButtonStyle}
                    onClick={() =>
                      navigate(`/listings/${listing.id}`, {
                        state: {
                          searchFilters: appliedFilters,
                        },
                      })
                    }
                  >
                    View details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>No listings match your filters.</p>
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
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const titleStyle = {
  fontSize: '1.4rem',
  marginTop: 0,
  marginBottom: '0.3rem',
};

const infoTextStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  marginTop: 0,
};

const simpleFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  margin: '0 0 1rem 0',
};

const simpleLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  fontSize: '0.85rem',
  color: '#374151',
};

const simpleButtonRowStyle = {
  display: 'flex',
  gap: '0.5rem',
};

const filterFieldsetStyle = {
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '16px',
  padding: '0.9rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const filterToggleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: '#111827',
};

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '0.6rem',
};

const filterGroupLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.8rem',
  color: '#4b5563',
};

const activeChipsStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  gap: '0.4rem',
  flexWrap: 'wrap',
};

const listingsGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const listingCardStyle = {
  display: 'flex',
  gap: '1rem',
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '18px',
  padding: '1rem',
  backgroundColor: '#fff',
  boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
};

const thumbnailWrapperStyle = {
  width: 160,
  height: 120,
  borderRadius: '14px',
  overflow: 'hidden',
  position: 'relative',
  flexShrink: 0,
};

const listingThumbnailStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const statusPillStyle = {
  position: 'absolute',
  top: 8,
  left: 8,
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontSize: '0.7rem',
  fontWeight: 600,
};

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
};

const cardTitleStyle = {
  margin: 0,
  fontSize: '1rem',
};

const ratingStyle = {
  fontSize: '0.85rem',
  color: '#f97316',
};

const addressStyle = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#6b7280',
};

const cardStatsRowStyle = {
  display: 'flex',
  gap: '0.8rem',
  flexWrap: 'wrap',
  fontSize: '0.85rem',
};

const cardFooterRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const detailButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '0.45rem 0.9rem',
  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};
