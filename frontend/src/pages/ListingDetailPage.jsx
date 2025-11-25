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
