import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorNotification, SuccessNotification } from '../Common/Notification';
import { useAuthContext } from '../context/AuthContext';
import * as listingsApi from '../api/listings';

const DEFAULT_THUMBNAIL =
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80';

const initialFormState = {
  title: '',
  addressLine1: '',
  city: '',
  state: '',
  country: '',
  price: '',
  thumbnail: '',
  propertyType: '',
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: '',
  description: '',
  gallery: '',
  youtubeUrl: '',
};

const formatAddress = (address = {}) => {
  const parts = [address.line1, address.city, address.state, address.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Address not set';
};

const calculateRating = (reviews = []) => {
  if (!reviews.length) return null;
  const scoredReviews = reviews.filter((review) => typeof review.rating === 'number');
  if (!scoredReviews.length) return null;
  const average =
    scoredReviews.reduce((total, review) => total + review.rating, 0) / scoredReviews.length;
  return Math.round(average * 10) / 10;
};

const formatAvailabilityRange = (range) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const start = range.start ? new Date(range.start).toLocaleDateString(undefined, options) : '';
  const end = range.end ? new Date(range.end).toLocaleDateString(undefined, options) : '';
  if (!start || !end) return '';
  return `${start} → ${end}`;
};

const parseAmenities = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseGallery = (value) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

export default function HostedListingsPage({ mode = 'list' }) {
  const { email, token } = useAuthContext();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyListingId, setBusyListingId] = useState(null);
  const [availabilityEditor, setAvailabilityEditor] = useState(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);

  const summary = useMemo(() => {
    const publishedCount = listings.filter((listing) => listing.published).length;
    return {
      total: listings.length,
      published: publishedCount,
      draft: listings.length - publishedCount,
    };
  }, [listings]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { listings: allListings } = await listingsApi.getAllListings();
      const mine = allListings.filter((listing) => listing.owner === email);
      const detailed = await Promise.all(
        mine.map(async (summaryItem) => {
          const { listing } = await listingsApi.getListingById(summaryItem.id);
          return {
            id: summaryItem.id,
            ...listing,
          };
        }),
      );
      setListings(detailed);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load hosted listings.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (email) {
      loadListings();
    }
  }, [email, loadListings]);

  const handleDelete = async (listingId) => {
    setBusyListingId(listingId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await listingsApi.deleteListing(listingId, token);
      setSuccessMsg('Listing removed successfully.');
      await loadListings();
    } catch (err) {
      setErrorMsg(err.message || 'Unable to delete listing.');
    } finally {
      setBusyListingId(null);
    }
  };

  const validateForm = () => {
    if (!formState.title.trim()) return 'Please provide a listing title.';
    if (!formState.addressLine1.trim() || !formState.city.trim() || !formState.country.trim()) {
      return 'Please complete the address fields.';
    }
    if (!formState.price || Number(formState.price) <= 0) {
      return 'Nightly price must be greater than 0.';
    }
    if (!formState.propertyType.trim()) return 'Please specify a property type.';
    return null;
  };

  const transformFormToPayload = () => {
    const videoUrl = formState.youtubeUrl.trim();
    return {
      title: formState.title.trim(),
      address: {
        line1: formState.addressLine1.trim(),
        city: formState.city.trim(),
        state: formState.state.trim(),
        country: formState.country.trim(),
      },
      price: Number(formState.price),
      thumbnail: formState.thumbnail.trim() || DEFAULT_THUMBNAIL,
      metadata: {
        propertyType: formState.propertyType.trim(),
        bedrooms: Number(formState.bedrooms),
        beds: Number(formState.beds),
        bathrooms: Number(formState.bathrooms),
        amenities: parseAmenities(formState.amenities),
        description: formState.description.trim(),
        gallery: parseGallery(formState.gallery),
        thumbnailVideoUrl: videoUrl || null,
      },
    };
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = transformFormToPayload();
      await listingsApi.createListing(payload, token);
      setSuccessMsg('Listing created successfully.');
      setFormState(initialFormState);
      await loadListings();
      navigate('/host/listings', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openAvailabilityManager = (listing) => {
    setAvailabilityEditor({
      listingId: listing.id,
      title: listing.title,
      published: listing.published,
      ranges: (listing.availability || []).map((range) => ({
        start: range.start ? range.start.slice(0, 10) : '',
        end: range.end ? range.end.slice(0, 10) : '',
      })),
      draftStart: '',
      draftEnd: '',
    });
    setAvailabilityBusy(false);
    setErrorMsg('');
  };

  const handleAvailabilityFieldChange = (field) => (event) => {
    const value = event.target.value;
    setAvailabilityEditor((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddAvailabilityRange = () => {
    if (!availabilityEditor?.draftStart || !availabilityEditor?.draftEnd) {
      setErrorMsg('Please select both start and end dates.');
      return;
    }
    if (new Date(availabilityEditor.draftStart) > new Date(availabilityEditor.draftEnd)) {
      setErrorMsg('Start date must be before end date.');
      return;
    }
    setAvailabilityEditor((prev) => ({
      ...prev,
      ranges: [...prev.ranges, { start: prev.draftStart, end: prev.draftEnd }],
      draftStart: '',
      draftEnd: '',
    }));
  };

  const handleRemoveAvailabilityRange = (index) => {
    setAvailabilityEditor((prev) => ({
      ...prev,
      ranges: prev.ranges.filter((_, idx) => idx !== index),
    }));
  };

  const resetAvailabilityManager = () => {
    setAvailabilityBusy(false);
    setAvailabilityEditor(null);
  };

  const handlePublishListing = async () => {
    if (!availabilityEditor || availabilityEditor.ranges.length === 0) {
      setErrorMsg('Add at least one availability range before publishing.');
      return;
    }
    setAvailabilityBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const availabilityPayload = availabilityEditor.ranges.map((range) => ({
        start: new Date(range.start).toISOString(),
        end: new Date(range.end).toISOString(),
      }));
      await listingsApi.publishListing(availabilityEditor.listingId, availabilityPayload, token);
      setSuccessMsg('Listing published successfully.');
      resetAvailabilityManager();
      await loadListings();
    } catch (err) {
      setErrorMsg(err.message || 'Unable to publish listing.');
      setAvailabilityBusy(false);
    }
  };

  const handleUnpublishListing = async () => {
    if (!availabilityEditor) return;
    setAvailabilityBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await listingsApi.unpublishListing(availabilityEditor.listingId, token);
      setSuccessMsg('Listing unpublished successfully.');
      resetAvailabilityManager();
      await loadListings();
    } catch (err) {
      setErrorMsg(err.message || 'Unable to unpublish listing.');
      setAvailabilityBusy(false);
    }
  };

  const renderListView = () => (
    <section style={cardContainerStyle}>
      {loading ? (
        <p style={mutedTextStyle}>Loading hosted listings...</p>
      ) : listings.length === 0 ? (
        <div style={emptyStateStyle}>
          <h3 style={{ margin: 0 }}>You have no hosted listings yet</h3>
          <p style={{ margin: '0.4rem 0 0' }}>
            Create your first listing to make it visible to guests.
          </p>
          <button
            type="button"
            onClick={() => navigate('/host/listings/new')}
            style={primaryButtonStyle}
          >
            Create listing
          </button>
        </div>
      ) : (
        <div style={gridStyle}>
          {listings.map((listing) => {
            const rating = calculateRating(listing.reviews);
            const amenitiesPreview = (listing.metadata?.amenities || []).slice(0, 3).join(', ');
            const videoUrl = listing.metadata?.thumbnailVideoUrl;
            const hasVideoThumbnail = Boolean(videoUrl);
            return (
              <article key={listing.id} style={listingCardStyle}>
                <div style={thumbnailWrapperStyle}>
                  {hasVideoThumbnail ? (
                    <iframe
                      src={videoUrl}
                      title={`${listing.title} video thumbnail`}
                      style={videoFrameStyle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={listing.thumbnail}
                      alt={`${listing.title} thumbnail`}
                      style={thumbnailStyle}
                    />
                  )}
                  {listing.published ? (
                    <span style={{ ...statusPillStyle, backgroundColor: '#dcfce7', color: '#166534' }}>
                      Live
                    </span>
                  ) : (
                    <span style={{ ...statusPillStyle, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                      Draft
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={cardHeaderStyle}>
                    <h3 style={cardTitleStyle}>{listing.title}</h3>
                    <span style={mutedTextStyle}>{listing.metadata?.propertyType || 'N/A'}</span>
                  </div>
                  <p style={cardAddressStyle}>{formatAddress(listing.address)}</p>
                  <div style={statsRowStyle}>
                    <span>{listing.metadata?.beds ?? 0} beds</span>
                    <span>{listing.metadata?.bathrooms ?? 0} baths</span>
                    <span>{listing.metadata?.bedrooms ?? 0} bedrooms</span>
                    <span>${listing.price} / night</span>
                  </div>
                  <div style={statsRowStyle}>
                    <span>
                      ⭐ {rating ?? 'No rating'}
                      {listing.reviews?.length ? ` (${listing.reviews.length})` : ''}
                    </span>
                    <span>{amenitiesPreview}</span>
                  </div>
                  <div style={cardActionsStyle}>
                    <button
                      type="button"
                      style={linkButtonStyle}
                      onClick={() => navigate(`/host/listings/${listing.id}/edit`)}
                    >
                      Edit details
                    </button>
                    <button
                      type="button"
                      style={linkButtonStyle}
                      onClick={() => openAvailabilityManager(listing)}
                    >
                      Manage availability
                    </button>
                    <button
                      type="button"
                      style={dangerButtonStyle}
                      disabled={busyListingId === listing.id}
                      onClick={() => handleDelete(listing.id)}
                    >
                      {busyListingId === listing.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderCreateView = () => (
    <section style={cardContainerStyle}>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={formGridStyle}>
          <label style={formLabelStyle}>
            <span>Listing title *</span>
            <input
              type="text"
              required
              value={formState.title}
              onChange={handleInputChange('title')}
              style={inputStyle}
              placeholder="e.g. Cozy Coastal Cottage"
            />
          </label>
          <label style={formLabelStyle}>
            <span>Nightly price (AUD) *</span>
            <input
              type="number"
              required
              min="1"
              value={formState.price}
              onChange={handleInputChange('price')}
              style={inputStyle}
            />
          </label>
          <label style={formLabelStyle}>
            <span>Property type *</span>
            <input
              type="text"
              required
              value={formState.propertyType}
              onChange={handleInputChange('propertyType')}
              style={inputStyle}
              placeholder="Apartment / House / Studio"
            />
          </label>
          <label style={formLabelStyle}>
            <span>Thumbnail URL (optional)</span>
            <input
              type="url"
              value={formState.thumbnail}
              onChange={handleInputChange('thumbnail')}
              style={inputStyle}
              placeholder="https://"
            />
          </label>
          <label style={formLabelStyle}>
            <span>YouTube embed URL (optional)</span>
            <input
              type="url"
              value={formState.youtubeUrl}
              onChange={handleInputChange('youtubeUrl')}
              style={inputStyle}
              placeholder="https://www.youtube.com/embed/..."
            />
          </label>
        </div>
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Address *</legend>
          <div style={formGridStyle}>
            <label style={formLabelStyle}>
              <span>Street address</span>
              <input
                type="text"
                required
                value={formState.addressLine1}
                onChange={handleInputChange('addressLine1')}
                style={inputStyle}
                placeholder="123 Sample Street"
              />
            </label>
            <label style={formLabelStyle}>
              <span>City</span>
              <input
                type="text"
                required
                value={formState.city}
                onChange={handleInputChange('city')}
                style={inputStyle}
              />
            </label>
            <label style={formLabelStyle}>
              <span>State / Region</span>
              <input
                type="text"
                value={formState.state}
                onChange={handleInputChange('state')}
                style={inputStyle}
              />
            </label>
            <label style={formLabelStyle}>
              <span>Country</span>
              <input
                type="text"
                required
                value={formState.country}
                onChange={handleInputChange('country')}
                style={inputStyle}
              />
            </label>
          </div>
        </fieldset>
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Property details</legend>
          <div style={formGridStyle}>
            <label style={formLabelStyle}>
              <span>Bedrooms</span>
              <input
                type="number"
                min="0"
                value={formState.bedrooms}
                onChange={handleInputChange('bedrooms')}
                style={inputStyle}
              />
            </label>
            <label style={formLabelStyle}>
              <span>Total beds</span>
              <input
                type="number"
                min="0"
                value={formState.beds}
                onChange={handleInputChange('beds')}
                style={inputStyle}
              />
            </label>
            <label style={formLabelStyle}>
              <span>Bathrooms</span>
              <input
                type="number"
                min="0"
                value={formState.bathrooms}
                onChange={handleInputChange('bathrooms')}
                style={inputStyle}
              />
            </label>
          </div>
        </fieldset>
        <label style={formLabelStyle}>
          <span>Amenities (comma separated)</span>
          <input
            type="text"
            value={formState.amenities}
            onChange={handleInputChange('amenities')}
            style={inputStyle}
            placeholder="WiFi, Parking, Pool"
          />
        </label>
        <label style={formLabelStyle}>
          <span>Description</span>
          <textarea
            value={formState.description}
            onChange={handleInputChange('description')}
            style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
            placeholder="Share what makes your place memorable..."
          />
        </label>
        <label style={formLabelStyle}>
          <span>Gallery image URLs (one per line)</span>
          <textarea
            value={formState.gallery}
            onChange={handleInputChange('gallery')}
            style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
            placeholder="https://example.com/image-1.jpg"
          />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button
            type="button"
            style={linkButtonStyle}
            onClick={() => navigate('/host/listings')}
          >
            Cancel
          </button>
          <button type="submit" style={primaryButtonStyle} disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create listing'}
          </button>
        </div>
      </form>
    </section>
  );

  const renderAvailabilityManager = () => {
    if (!availabilityEditor || mode !== 'list') return null;
    return (
      <section style={cardContainerStyle}>
        <div style={availabilityHeaderStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              Manage availability — {availabilityEditor.title}
            </h2>
            <p style={{ ...mutedTextStyle, margin: '0.2rem 0 0' }}>
              Add availability ranges before publishing this listing.
            </p>
          </div>
          <button type="button" style={linkButtonStyle} onClick={resetAvailabilityManager}>
            Close
          </button>
        </div>

        <div style={availabilityFormRowStyle}>
          <label style={formLabelStyle}>
            <span>Start date</span>
            <input
              type="date"
              value={availabilityEditor.draftStart}
              onChange={handleAvailabilityFieldChange('draftStart')}
              style={inputStyle}
            />
          </label>
          <label style={formLabelStyle}>
            <span>End date</span>
            <input
              type="date"
              value={availabilityEditor.draftEnd}
              onChange={handleAvailabilityFieldChange('draftEnd')}
              style={inputStyle}
            />
          </label>
          <button
            type="button"
            style={primaryButtonStyle}
            onClick={handleAddAvailabilityRange}
            disabled={availabilityBusy}
          >
            Add range
          </button>
        </div>

        {availabilityEditor.ranges.length ? (
          <ul style={availabilityRangesListStyle}>
            {availabilityEditor.ranges.map((range, index) => (
              <li key={`${range.start}-${range.end}-${index}`} style={rangeItemStyle}>
                <span>{formatAvailabilityRange(range)}</span>
                <button
                  type="button"
                  style={smallLinkButtonStyle}
                  onClick={() => handleRemoveAvailabilityRange(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ ...mutedTextStyle, margin: 0 }}>No availability ranges added yet.</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={linkButtonStyle}
            onClick={resetAvailabilityManager}
            disabled={availabilityBusy}
          >
            Done
          </button>
          <button
            type="button"
            style={primaryButtonStyle}
            onClick={handlePublishListing}
            disabled={availabilityBusy}
          >
            {availabilityBusy ? 'Publishing…' : 'Publish listing'}
          </button>
          {availabilityEditor.published && (
            <button
              type="button"
              style={dangerButtonStyle}
              onClick={handleUnpublishListing}
              disabled={availabilityBusy}
            >
              {availabilityBusy ? 'Updating…' : 'Unpublish listing'}
            </button>
          )}
        </div>
      </section>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <header style={cardContainerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <h1 style={{ margin: 0 }}>
            {mode === 'create' ? 'Create a hosted listing' : 'Hosted listings'}
          </h1>
          <p style={{ ...mutedTextStyle, margin: 0 }}>
            Manage the stays you host on Airbrb and keep their details up to date.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            style={mode === 'list' ? primaryButtonStyle : navGhostButtonStyle}
            onClick={() => navigate('/host/listings')}
          >
            Listings overview
          </button>
          <button
            type="button"
            style={mode === 'create' ? primaryButtonStyle : navGhostButtonStyle}
            onClick={() => navigate('/host/listings/new')}
          >
            Add new listing
          </button>
        </div>
      </header>

      <section style={{ ...cardContainerStyle, flexDirection: 'row', gap: '1.2rem' }}>
        <div style={summaryCardStyle}>
          <span style={mutedTextStyle}>Total</span>
          <strong style={summaryNumberStyle}>{summary.total}</strong>
        </div>
        <div style={summaryCardStyle}>
          <span style={mutedTextStyle}>Live</span>
          <strong style={summaryNumberStyle}>{summary.published}</strong>
        </div>
        <div style={summaryCardStyle}>
          <span style={mutedTextStyle}>Drafts</span>
          <strong style={summaryNumberStyle}>{summary.draft}</strong>
        </div>
      </section>

      <ErrorNotification message={errorMsg} onClose={() => setErrorMsg('')} />
      <SuccessNotification message={successMsg} onClose={() => setSuccessMsg('')} />

      {mode === 'create' ? renderCreateView() : renderListView()}
      {renderAvailabilityManager()}
    </div>
  );
}

const cardContainerStyle = {
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
  fontSize: '0.85rem',
};

const emptyStateStyle = {
  border: '1px dashed rgba(148,163,184,0.6)',
  borderRadius: '14px',
  padding: '1.8rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.7rem',
  alignItems: 'center',
};

const gridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const listingCardStyle = {
  display: 'flex',
  gap: '1rem',
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '16px',
  padding: '1rem',
  background: '#fff',
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};

const thumbnailWrapperStyle = {
  width: 160,
  height: 120,
  borderRadius: '14px',
  overflow: 'hidden',
  position: 'relative',
  flexShrink: 0,
};

const thumbnailStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const videoFrameStyle = {
  width: '100%',
  height: '100%',
  border: 'none',
};

const statusPillStyle = {
  position: 'absolute',
  top: 8,
  left: 8,
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: '0.6rem',
};

const cardTitleStyle = {
  margin: 0,
  fontSize: '1.1rem',
};

const cardAddressStyle = {
  ...mutedTextStyle,
  margin: 0,
};

const statsRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.8rem',
  fontSize: '0.85rem',
  color: '#111827',
};

const cardActionsStyle = {
  marginTop: '0.8rem',
  display: 'flex',
  gap: '0.6rem',
};

const primaryButtonStyle = {
  padding: '0.55rem 1rem',
  borderRadius: '999px',
  border: 'none',
  background: 'linear-gradient(135deg, #4f46e5, #6366f1, #ec4899)',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
  boxShadow: '0 10px 25px rgba(79,70,229,0.35)',
};

const navGhostButtonStyle = {
  padding: '0.55rem 1rem',
  borderRadius: '999px',
  border: '1px solid rgba(148,163,184,0.6)',
  backgroundColor: '#fff',
  color: '#374151',
  cursor: 'pointer',
};

const linkButtonStyle = {
  padding: '0.5rem 0.8rem',
  borderRadius: '10px',
  border: '1px solid rgba(148,163,184,0.5)',
  background: '#fff',
  cursor: 'pointer',
  color: '#4f46e5',
  fontWeight: 500,
};

const dangerButtonStyle = {
  ...linkButtonStyle,
  borderColor: 'rgba(248,113,113,0.6)',
  color: '#b91c1c',
};

const summaryCardStyle = {
  flex: 1,
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '14px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const summaryNumberStyle = {
  fontSize: '1.6rem',
  color: '#111827',
};

const availabilityHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const availabilityFormRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '0.8rem',
  alignItems: 'end',
};

const availabilityRangesListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const rangeItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '10px',
  padding: '0.6rem 0.8rem',
  gap: '0.6rem',
};

const smallLinkButtonStyle = {
  ...linkButtonStyle,
  padding: '0.35rem 0.6rem',
};

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '0.8rem',
};

const formLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  fontSize: '0.85rem',
  color: '#374151',
};

const inputStyle = {
  padding: '0.65rem 0.8rem',
  borderRadius: '12px',
  border: '1px solid rgba(148,163,184,0.7)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const fieldsetStyle = {
  border: '1px solid rgba(226,232,240,0.9)',
  borderRadius: '16px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const legendStyle = {
  padding: '0 0.4rem',
  fontWeight: 600,
};

