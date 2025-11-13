import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
  ErrorNotification,
  SuccessNotification,
} from '../components/Common/Notification';
