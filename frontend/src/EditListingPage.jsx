import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

const STORAGE_KEY = 'airbrb_auth';
