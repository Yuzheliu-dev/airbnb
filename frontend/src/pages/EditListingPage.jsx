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

  return null;
}
