import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorNotification, SuccessNotification } from '../Common/Notification';
import { useAuthContext } from '../context/AuthContext';
import * as listingsApi from '../api/listings';

const parseAmenities = (amenities = []) => {
  if (Array.isArray(amenities)) {
    return amenities.join(', ');
  }
  return '';
};

const parseGallery = (gallery = []) => {
  if (Array.isArray(gallery)) {
    return gallery.join('\n');
  }
  return '';
};

export default function EditListingPage() {
  const { token } = useAuthContext();
  const navigate = useNavigate();
  const { listingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState({
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
  });

  useEffect(() => {
    const loadListing = async () => {
      if (!listingId || !token) return;
      setLoading(true);
      setErrorMsg('');
      try {
        const { listing } = await listingsApi.getListingById(Number(listingId));
        setFormState({
          title: listing.title || '',
          addressLine1: listing.address?.line1 || '',
          city: listing.address?.city || '',
          state: listing.address?.state || '',
          country: listing.address?.country || '',
          price: listing.price?.toString() || '',
          thumbnail: listing.thumbnail || '',
          propertyType: listing.metadata?.propertyType || '',
          bedrooms: listing.metadata?.bedrooms || 1,
          beds: listing.metadata?.beds || 1,
          bathrooms: listing.metadata?.bathrooms || 1,
          amenities: parseAmenities(listing.metadata?.amenities),
          description: listing.metadata?.description || '',
          gallery: parseGallery(listing.metadata?.gallery),
          youtubeUrl: listing.metadata?.thumbnailVideoUrl || '',
        });
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId, token]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberChange = (field) => (event) => {
    const value = parseInt(event.target.value, 10) || 0;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      thumbnail: formState.thumbnail.trim() || '',
      metadata: {
        propertyType: formState.propertyType.trim(),
        bedrooms: Number(formState.bedrooms),
        beds: Number(formState.beds),
        bathrooms: Number(formState.bathrooms),
        amenities: formState.amenities
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        description: formState.description.trim(),
        gallery: formState.gallery
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        thumbnailVideoUrl: videoUrl || null,
      },
    };
  };

  const handleSubmit = async (event) => {
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
      await listingsApi.updateListing(Number(listingId), payload, token);
      setSuccessMsg('Listing updated successfully.');
      setTimeout(() => {
        navigate('/host/listings', { replace: true });
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={pageWrapperStyle}>
        <p style={mutedTextStyle}>Loading listing details...</p>
      </div>
    );
  }

  return (
    <div style={pageWrapperStyle}>
      <header style={cardContainerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <h1 style={{ margin: 0 }}>Edit listing</h1>
          <p style={{ ...mutedTextStyle, margin: 0 }}>
            Update your listing details and keep them current.
          </p>
        </div>
      </header>

      <ErrorNotification message={errorMsg} onClose={() => setErrorMsg('')} />
      <SuccessNotification message={successMsg} onClose={() => setSuccessMsg('')} />

      <section style={cardContainerStyle}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <span>Thumbnail URL</span>
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
                  onChange={handleNumberChange('bedrooms')}
                  style={inputStyle}
                />
              </label>
              <label style={formLabelStyle}>
                <span>Total beds</span>
                <input
                  type="number"
                  min="0"
                  value={formState.beds}
                  onChange={handleNumberChange('beds')}
                  style={inputStyle}
                />
              </label>
              <label style={formLabelStyle}>
                <span>Bathrooms</span>
                <input
                  type="number"
                  min="0"
                  value={formState.bathrooms}
                  onChange={handleNumberChange('bathrooms')}
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
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
