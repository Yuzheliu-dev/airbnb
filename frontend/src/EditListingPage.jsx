import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
  createListing,
  getListingDetail,
  updateListing,
} from '../api/listings';
import { ErrorNotification, SuccessNotification } from '../components/Common/Notification';
