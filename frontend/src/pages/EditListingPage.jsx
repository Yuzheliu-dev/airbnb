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

  return null;
}
