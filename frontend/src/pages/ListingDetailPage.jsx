import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ErrorNotification, SuccessNotification } from '../Common/Notification';
import { useAuthContext } from '../context/AuthContext';
import * as listingsApi from '../api/listings';
import * as bookingsApi from '../api/bookings';

const initialBookingForm = {
  start: '',
  end: '',
};

const initialReviewForm = {
  bookingId: '',
  rating: 5,
  comment: '',
};

const formatAddress = (address = {}) => {
  const parts = [address.line1, address.city, address.state, address.country].filter(Boolean);
  return parts.join(', ');
};

const nightsBetween = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate) || Number.isNaN(endDate) || startDate >= endDate) {
    return 0;
  }
  const diff = endDate.getTime() - startDate.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const calculateRating = (reviews = []) => {
  const scored = reviews.filter((review) => typeof review.rating === 'number');
  if (!scored.length) return null;
  const avg = scored.reduce((total, review) => total + review.rating, 0) / scored.length;
  return Math.round(avg * 10) / 10;
};

const isRangeWithinAvailability = (listing, start, end) => {
  if (!listing || !listing.availability?.length) return false;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate) || Number.isNaN(endDate)) return false;
  return listing.availability.some((range) => {
    if (!range.start || !range.end) return false;
    const rangeStart = new Date(range.start);
    const rangeEnd = new Date(range.end);
    return startDate >= rangeStart && endDate <= rangeEnd;
  });
};

export default function ListingDetailPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, email, isAuthenticated } = useAuthContext();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);
  const [ratingModal, setRatingModal] = useState({ open: false, rating: null });

  const searchFilters = location.state?.searchFilters;
  const searchDateRange =
    searchFilters?.dateEnabled && searchFilters.dateStart && searchFilters.dateEnd
      ? { start: searchFilters.dateStart, end: searchFilters.dateEnd }
      : null;
  const searchNights = searchDateRange ? nightsBetween(searchDateRange.start, searchDateRange.end) : 0;

  const loadListing = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { listing: data } = await listingsApi.getListingById(listingId);
      setListing(data);
    } catch (err) {
      setErrorMsg(err.message || '无法加载房源详情');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const loadUserBookings = useCallback(async () => {
    if (!token || !email) {
      setUserBookings([]);
      return;
    }
    try {
      const { bookings } = await bookingsApi.getAllBookings(token);
      const filtered = bookings.filter(
        (booking) => String(booking.listingId) === String(listingId) && booking.owner === email,
      );
      setUserBookings(filtered);
      if (filtered.length && !reviewForm.bookingId) {
        const accepted = filtered.find((booking) => booking.status === 'accepted');
        if (accepted) {
          setReviewForm((prev) => ({ ...prev, bookingId: accepted.id }));
        }
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
    }
  }, [token, email, listingId, reviewForm.bookingId]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  useEffect(() => {
    loadUserBookings();
  }, [loadUserBookings]);

  const totalNights = useMemo(
    () => nightsBetween(bookingForm.start, bookingForm.end),
    [bookingForm.start, bookingForm.end],
  );

  const totalPrice = useMemo(() => {
    if (!listing) return 0;
    return totalNights * (listing.price || 0);
  }, [listing, totalNights]);

  const rating = useMemo(() => calculateRating(listing?.reviews), [listing]);
  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const reviews = listing?.reviews || [];
    reviews.forEach((review) => {
      const value = Math.round(review.rating);
      if (counts[value] !== undefined) {
        counts[value] += 1;
      }
    });
    const total = reviews.length || 1;
    return Object.entries(counts).map(([score, count]) => ({
      score: Number(score),
      count,
      percent: Math.round((count / total) * 100),
    }));
  }, [listing]);

  const filteredModalReviews = useMemo(() => {
    if (!ratingModal.open || !listing?.reviews?.length) return [];
    return listing.reviews.filter(
      (review) => Math.round(review.rating) === ratingModal.rating,
    );
  }, [ratingModal, listing]);

  const handleBookingFieldChange = (field) => (event) => {
    setBookingForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setErrorMsg('请先登录再进行预订。');
      return;
    }
    if (!bookingForm.start || !bookingForm.end) {
      setErrorMsg('请选择完整的入住日期。');
      return;
    }
    if (!isRangeWithinAvailability(listing, bookingForm.start, bookingForm.end)) {
      setErrorMsg('选定日期不在可预订范围内。');
      return;
    }
    if (!totalNights) {
      setErrorMsg('请选择至少一晚。');
      return;
    }
    setBookingBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await bookingsApi.createBooking(
        listingId,
        {
          start: new Date(bookingForm.start).toISOString(),
          end: new Date(bookingForm.end).toISOString(),
        },
        totalPrice,
        token,
      );
      setSuccessMsg('预订请求已发送，等待房东处理。');
      setBookingForm(initialBookingForm);
      loadUserBookings();
    } catch (err) {
      setErrorMsg(err.message || '预订失败，请稍后重试。');
    } finally {
      setBookingBusy(false);
    }
  };

  const acceptedBookings = useMemo(
    () => userBookings.filter((booking) => booking.status === 'accepted'),
    [userBookings],
  );

  const handleReviewFieldChange = (field) => (event) => {
    setReviewForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!reviewForm.bookingId) {
      setErrorMsg('请选择一条已完成的订单来点评。');
      return;
    }
    if (!reviewForm.comment.trim()) {
      setErrorMsg('请填写点评内容。');
      return;
    }
    setReviewBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await listingsApi.leaveReview(
        listingId,
        reviewForm.bookingId,
        {
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
          createdBy: email,
          createdAt: new Date().toISOString(),
        },
        token,
      );
      setSuccessMsg('感谢你的点评！');
      setReviewForm((prev) => ({ ...prev, comment: '' }));
      loadListing();
    } catch (err) {
      setErrorMsg(err.message || '无法提交点评。');
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) {
    return <p style={{ marginTop: '2rem' }}>正在加载房源...</p>;
  }

  if (!listing) {
    return <p style={{ marginTop: '2rem' }}>未找到该房源。</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <button type="button" onClick={() => navigate(-1)} style={linkButtonStyle}>
        ← 返回
      </button>

      <header style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative' }}>
          <h1 style={{ margin: 0 }}>{listing.title}</h1>
          <p style={mutedTextStyle}>{formatAddress(listing.address)}</p>
          {searchDateRange && searchNights > 0 && (
            <p style={{ ...mutedTextStyle, margin: 0 }}>
              当前搜索：{searchDateRange.start} → {searchDateRange.end}（{searchNights} 晚）
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>类型：{listing.metadata?.propertyType || '未设置'}</span>
            <span>卧室：{listing.metadata?.bedrooms ?? 0}</span>
            <span>床位：{listing.metadata?.beds ?? 0}</span>
            <span>卫浴：{listing.metadata?.bathrooms ?? 0}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end', position: 'relative' }}>
          <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
            {searchDateRange && searchNights > 0
              ? `整段价格：$${searchNights * (listing.price || 0)}`
              : `$${listing.price} / 晚`}
          </p>
          {searchDateRange && searchNights > 0 && (
            <p style={{ margin: 0, color: '#6b7280' }}>（含每晚 ${listing.price}）</p>
          )}
          <button
            type="button"
            onMouseEnter={() => setShowRatingTooltip(true)}
            onMouseLeave={() => setShowRatingTooltip(false)}
            onFocus={() => setShowRatingTooltip(true)}
            onBlur={() => setShowRatingTooltip(false)}
            style={ratingSummaryButtonStyle}
          >
            ⭐ {rating ?? '暂无评分'}（{listing.reviews?.length ?? 0} 条点评）
          </button>
          {showRatingTooltip && (
            <div style={ratingTooltipStyle} role="tooltip">
              <p style={{ margin: 0, fontWeight: 600 }}>评分分布</p>
              <ul style={ratingTooltipListStyle}>
                {ratingBreakdown.map((item) => (
                  <li key={item.score}>
                    <button
                      type="button"
                      style={ratingTooltipItemButtonStyle}
                      onClick={() =>
                        setRatingModal({
                          open: true,
                          rating: item.score,
                        })
                      }
                    >
                      {item.score} 星 · {item.percent}% ({item.count})
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      <section style={{ ...cardStyle, gap: '1rem' }}>
        <div style={mediaGridStyle}>
          {listing.metadata?.gallery?.length ? (
            listing.metadata.gallery.map((image) => (
              <img key={image} src={image} alt="房源图片" style={galleryImageStyle} />
            ))
          ) : (
            <img src={listing.thumbnail} alt="房源缩略图" style={galleryImageStyle} />
          )}
        </div>
        {listing.metadata?.description && <p>{listing.metadata.description}</p>}
        {!!listing.metadata?.amenities?.length && (
          <div>
            <h3 style={{ margin: '0 0 0.4rem' }}>设施</h3>
            <ul style={pillListStyle}>
              {listing.metadata.amenities.map((item) => (
                <li key={item} style={pillItemStyle}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <SuccessNotification message={successMsg} onClose={() => setSuccessMsg('')} />
      <ErrorNotification message={errorMsg} onClose={() => setErrorMsg('')} />

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>立即预订</h2>
        <form onSubmit={handleBookingSubmit} style={bookingFormStyle}>
          <label style={formLabelStyle}>
            入住日期
            <input type="date" value={bookingForm.start} onChange={handleBookingFieldChange('start')} />
          </label>
          <label style={formLabelStyle}>
            退房日期
            <input type="date" value={bookingForm.end} onChange={handleBookingFieldChange('end')} />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>共 {totalNights} 晚</span>
            <strong>预计总价：${totalPrice}</strong>
          </div>
          <button type="submit" style={primaryButtonStyle} disabled={bookingBusy}>
            {bookingBusy ? '提交中...' : '发送预订请求'}
          </button>
        </form>
        {!listing.availability?.length && (
          <p style={mutedTextStyle}>房源暂未发布可用日期，无法预订。</p>
        )}
      </section>

      {userBookings.length > 0 && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>我的订单</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {userBookings.map((booking) => (
              <li key={booking.id} style={bookingChipStyle}>
                <div>
                  <strong>
                    {new Date(booking.dateRange.start).toLocaleDateString()} →{' '}
                    {new Date(booking.dateRange.end).toLocaleDateString()}
                  </strong>
                  <p style={{ margin: 0, color: '#6b7280' }}>状态：{booking.status}</p>
                </div>
                <span>总价：${booking.totalPrice}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {acceptedBookings.length > 0 && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>留下点评</h2>
          <form onSubmit={handleReviewSubmit} style={reviewFormStyle}>
            <label style={formLabelStyle}>
              选择订单
              <select value={reviewForm.bookingId} onChange={handleReviewFieldChange('bookingId')}>
                <option value="">请选择</option>
                {acceptedBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    #{booking.id} · {new Date(booking.dateRange.start).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>
            <label style={formLabelStyle}>
              评分
              <input
                type="number"
                min="1"
                max="5"
                value={reviewForm.rating}
                onChange={handleReviewFieldChange('rating')}
              />
            </label>
            <label style={{ ...formLabelStyle, gridColumn: 'span 2' }}>
              点评
              <textarea
                value={reviewForm.comment}
                onChange={handleReviewFieldChange('comment')}
                rows={3}
                placeholder="分享你的入住体验..."
              />
            </label>
            <button type="submit" style={primaryButtonStyle} disabled={reviewBusy}>
              {reviewBusy ? '提交中...' : '提交点评'}
            </button>
          </form>
        </section>
      )}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>住客点评</h2>
        {listing.reviews?.length ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {listing.reviews.map((review, index) => (
              <li key={`${review.comment}-${index}`} style={reviewCardStyle}>
                <strong>⭐ {review.rating ?? 'N/A'}</strong>
                <p style={{ margin: '0.2rem 0' }}>{review.comment || '无文字评论'}</p>
                <small style={mutedTextStyle}>
                  {review.createdBy || '匿名'} ·{' '}
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '刚刚'}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p style={mutedTextStyle}>暂无点评。</p>
        )}
      </section>

      {ratingModal.open && (
        <div style={modalOverlayStyle} role="dialog" aria-modal="true">
          <div style={modalContentStyle}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{ratingModal.rating} 星点评</h3>
                <p style={{ ...mutedTextStyle, margin: 0 }}>
                  共 {filteredModalReviews.length} 条
                </p>
              </div>
              <button
                type="button"
                style={linkButtonStyle}
                onClick={() => setRatingModal({ open: false, rating: null })}
              >
                关闭
              </button>
            </header>
            <div style={{ maxHeight: 320, overflow: 'auto', marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {filteredModalReviews.length ? (
                filteredModalReviews.map((review, index) => (
                  <article key={`modal-review-${index}`} style={reviewCardStyle}>
                    <strong>⭐ {review.rating ?? 'N/A'}</strong>
                    <p style={{ margin: '0.2rem 0' }}>{review.comment || '无文字评论'}</p>
                    <small style={mutedTextStyle}>
                      {review.createdBy || '匿名'} ·{' '}
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '刚刚'}
                    </small>
                  </article>
                ))
              ) : (
                <p style={mutedTextStyle}>暂无该评分的点评。</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

const mutedTextStyle = {
  color: '#6b7280',
};

const primaryButtonStyle = {
  padding: '0.65rem 1.2rem',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(135deg, #4f46e5, #6366f1, #ec4899)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
  alignSelf: 'flex-start',
};

const linkButtonStyle = {
  alignSelf: 'flex-start',
  border: '1px solid rgba(148,163,184,0.5)',
  backgroundColor: '#fff',
  padding: '0.4rem 0.8rem',
  borderRadius: '999px',
  cursor: 'pointer',
};

const mediaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '0.8rem',
};

const galleryImageStyle = {
  width: '100%',
  height: 180,
  objectFit: 'cover',
  borderRadius: '14px',
};

const pillListStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const pillItemStyle = {
  padding: '0.3rem 0.8rem',
  borderRadius: '999px',
  backgroundColor: '#eef2ff',
  color: '#3730a3',
  fontSize: '0.8rem',
};

const bookingFormStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem',
  alignItems: 'flex-end',
};

const formLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  fontSize: '0.85rem',
  color: '#374151',
};

const bookingChipStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.9rem 1rem',
  borderRadius: '14px',
  border: '1px solid rgba(226,232,240,0.9)',
  backgroundColor: '#fff',
};

const reviewFormStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
};

const reviewCardStyle = {
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '14px',
  padding: '0.9rem 1rem',
  backgroundColor: '#fff',
};

const ratingSummaryButtonStyle = {
  border: 'none',
  background: 'none',
  padding: 0,
  color: '#6b7280',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontSize: '0.9rem',
  position: 'relative',
};

const ratingTooltipStyle = {
  position: 'absolute',
  top: '110%',
  right: 0,
  backgroundColor: '#fff',
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '12px',
  padding: '0.6rem 0.8rem',
  boxShadow: '0 12px 30px rgba(15,23,42,0.15)',
  zIndex: 10,
  minWidth: 200,
};

const ratingTooltipListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: '0.4rem 0 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const ratingTooltipItemButtonStyle = {
  border: 'none',
  background: 'none',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
  color: '#1d4ed8',
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15,23,42,0.35)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '1.5rem',
  zIndex: 20,
};

const modalContentStyle = {
  width: '100%',
  maxWidth: 480,
  backgroundColor: '#fff',
  borderRadius: '18px',
  padding: '1.2rem',
  boxShadow: '0 25px 50px rgba(15,23,42,0.3)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};
