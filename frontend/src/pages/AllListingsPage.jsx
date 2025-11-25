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
  return parts.length ? parts.join(', ') : '地点待更新';
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

  const validateFilters = (filters) => {
    if (filters.bedroomsEnabled) {
      const min = ensureNumber(filters.bedroomsMin);
      const max = ensureNumber(filters.bedroomsMax);
      if (min !== null && max !== null && min > max) {
        return '卧室数量的最小值不能大于最大值';
      }
    }
    if (filters.priceEnabled) {
      const min = ensureNumber(filters.priceMin);
      const max = ensureNumber(filters.priceMax);
      if (min !== null && max !== null && min > max) {
        return '价格区间的最小值不能大于最大值';
      }
    }
    if (filters.dateEnabled) {
      if (filters.dateStart && filters.dateEnd && filters.dateStart > filters.dateEnd) {
        return '请选择有效的起止日期';
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

  return (
    <div style={basicContainerStyle}>
      <h1 style={titleStyle}>Explore stays</h1>
      {isAuthenticated && (
        <p style={infoTextStyle}>你预订过的房源会被优先展示。</p>
      )}
      <form onSubmit={handleSearch} style={simpleFormStyle}>
        <label style={simpleLabelStyle}>
          搜索标题 / 城市
          <input
            type="text"
            value={filterDraft.searchTerm}
            onChange={handleDraftChange('searchTerm')}
            placeholder="Sydney / 海景 / Loft..."
          />
        </label>
        <fieldset style={filterFieldsetStyle}>
          <label style={filterToggleStyle}>
            <input
              type="checkbox"
              checked={filterDraft.bedroomsEnabled}
              onChange={handleToggleChange('bedroomsEnabled')}
            />
            按卧室数量
          </label>
          <div style={filterGridStyle}>
            <label style={filterGroupLabelStyle}>
              最少
              <input
                type="number"
                min="0"
                value={filterDraft.bedroomsMin}
                onChange={handleDraftChange('bedroomsMin')}
                disabled={!filterDraft.bedroomsEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              最多
              <input
                type="number"
                min="0"
                value={filterDraft.bedroomsMax}
                onChange={handleDraftChange('bedroomsMax')}
                disabled={!filterDraft.bedroomsEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              排序
              <select
                value={filterDraft.bedroomsOrder}
                onChange={handleDraftChange('bedroomsOrder')}
                disabled={!filterDraft.bedroomsEnabled}
              >
                <option value="asc">少 → 多</option>
                <option value="desc">多 → 少</option>
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
            按价格区间
          </label>
          <div style={filterGridStyle}>
            <label style={filterGroupLabelStyle}>
              最低 (AUD)
              <input
                type="number"
                min="0"
                value={filterDraft.priceMin}
                onChange={handleDraftChange('priceMin')}
                disabled={!filterDraft.priceEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              最高 (AUD)
              <input
                type="number"
                min="0"
                value={filterDraft.priceMax}
                onChange={handleDraftChange('priceMax')}
                disabled={!filterDraft.priceEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              排序
              <select
                value={filterDraft.priceOrder}
                onChange={handleDraftChange('priceOrder')}
                disabled={!filterDraft.priceEnabled}
              >
                <option value="asc">低 → 高</option>
                <option value="desc">高 → 低</option>
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
            按可入住日期
          </label>
          <div style={filterGridStyle}>
            <label style={filterGroupLabelStyle}>
              起始日期
              <input
                type="date"
                value={filterDraft.dateStart}
                onChange={handleDraftChange('dateStart')}
                disabled={!filterDraft.dateEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              结束日期
              <input
                type="date"
                value={filterDraft.dateEnd}
                onChange={handleDraftChange('dateEnd')}
                disabled={!filterDraft.dateEnabled}
              />
            </label>
            <label style={filterGroupLabelStyle}>
              排序
              <select
                value={filterDraft.dateOrder}
                onChange={handleDraftChange('dateOrder')}
                disabled={!filterDraft.dateEnabled}
              >
                <option value="asc">最近上线优先</option>
                <option value="desc">最远上线优先</option>
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
            按评分排序
          </label>
          <div style={filterGridStyle}>
            <label style={filterGroupLabelStyle}>
              排序
              <select
                value={filterDraft.ratingOrder}
                onChange={handleDraftChange('ratingOrder')}
                disabled={!filterDraft.ratingEnabled}
              >
                <option value="desc">高 → 低</option>
                <option value="asc">低 → 高</option>
              </select>
            </label>
          </div>
        </fieldset>

        <div style={simpleButtonRowStyle}>
          <button type="submit">搜索</button>
          <button type="button" onClick={handleReset}>
            重置
          </button>
        </div>
      </form>
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

const infoTextStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  marginTop: 0,
};

const simpleFormStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
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
