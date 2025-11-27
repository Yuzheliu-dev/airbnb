import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as bookingsApi from '../api/bookings';
import * as listingsApi from '../api/listings';
import { useAuthContext } from './AuthContext';

const NotificationsContext = createContext(null);

const POLL_INTERVAL_MS = 6000;
const HOST_REFRESH_INTERVAL_MS = 60000;
const MAX_NOTIFICATIONS = 30;
const STORAGE_PREFIX = 'airbrb_notifications_';

const buildNotification = (partial) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  createdAt: new Date().toISOString(),
  read: false,
  ...partial,
});

export function NotificationsProvider({ children }) {
  const { token, email, isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState([]);

  const bookingsSnapshotRef = useRef(new Map());
  const initializedRef = useRef(false);
  const pollTimerRef = useRef(null);
  const hostListingsRef = useRef(new Map());
  const hostRefreshTimestampRef = useRef(0);
  const listingTitleCacheRef = useRef(new Map());

  const loadStoredNotifications = useCallback(() => {
    if (!email) {
      setNotifications([]);
      return;
    }
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${email}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to read notifications from storage', err);
    }
    setNotifications([]);
  }, [email]);

  useEffect(() => {
    loadStoredNotifications();
  }, [loadStoredNotifications]);

  useEffect(() => {
    if (!email) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${email}`, JSON.stringify(notifications));
    } catch (err) {
      console.error('Failed to persist notifications', err);
    }
  }, [notifications, email]);

  const addNotification = useCallback((partial) => {
    setNotifications((prev) => {
      const next = [buildNotification(partial), ...prev];
      if (next.length > MAX_NOTIFICATIONS) {
        next.length = MAX_NOTIFICATIONS;
      }
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
  }, []);

  const dismissNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const refreshHostListings = useCallback(async () => {
    if (!email) {
      hostListingsRef.current = new Map();
      return;
    }
    try {
      const { listings } = await listingsApi.getAllListings();
      const mine = listings.filter((listing) => listing.owner === email);
      const nextMap = new Map();
      mine.forEach((listing) => {
        nextMap.set(Number(listing.id), listing.title || `Listing #${listing.id}`);
        listingTitleCacheRef.current.set(Number(listing.id), listing.title || `Listing #${listing.id}`);
      });
      hostListingsRef.current = nextMap;
      hostRefreshTimestampRef.current = Date.now();
    } catch (err) {
      console.error('Failed to refresh host listings for notifications', err);
    }
  }, [email]);

  const resolveListingTitle = useCallback(async (listingId) => {
    const idNumber = Number(listingId);
    if (hostListingsRef.current.has(idNumber)) {
      return hostListingsRef.current.get(idNumber);
    }
    if (listingTitleCacheRef.current.has(idNumber)) {
      return listingTitleCacheRef.current.get(idNumber);
    }
    try {
      const { listing } = await listingsApi.getListingById(idNumber);
      const title = listing.title || `房源 #${idNumber}`;
      listingTitleCacheRef.current.set(idNumber, title);
      return title;
    } catch (err) {
      console.error('Failed to resolve listing title', err);
      return `房源 #${idNumber}`;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token || !email) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      bookingsSnapshotRef.current = new Map();
      initializedRef.current = false;
      hostListingsRef.current = new Map();
      listingTitleCacheRef.current = new Map();
      hostRefreshTimestampRef.current = 0;
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const now = Date.now();
        if (now - hostRefreshTimestampRef.current > HOST_REFRESH_INTERVAL_MS) {
          await refreshHostListings();
        }

        const { bookings } = await bookingsApi.getAllBookings(token);
        const previous = bookingsSnapshotRef.current;
        const nextSnapshot = new Map();

        for (const booking of bookings) {
          nextSnapshot.set(booking.id, booking);
          const prevEntry = previous.get(booking.id);
          const isHostListing = hostListingsRef.current.has(Number(booking.listingId));

          if (!initializedRef.current) {
            continue;
          }

          if (!prevEntry && isHostListing && booking.status === 'pending') {
            const listingTitle = hostListingsRef.current.get(Number(booking.listingId));
            addNotification({
              type: 'host',
              message: `新的预订请求 - ${listingTitle || `房源 #${booking.listingId}`}`,
              detail: `${booking.owner} 请求 ${booking.dateRange?.start} → ${booking.dateRange?.end}`,
            });
          }

          if (
            booking.owner === email &&
            prevEntry &&
            prevEntry.status !== booking.status &&
            (booking.status === 'accepted' || booking.status === 'declined')
          ) {
            const listingTitle = await resolveListingTitle(booking.listingId);
            addNotification({
              type: 'guest',
              message:
                booking.status === 'accepted'
                  ? `预订已被房东接受 - ${listingTitle}`
                  : `抱歉，预订被拒绝 - ${listingTitle}`,
              detail: `${booking.dateRange?.start} → ${booking.dateRange?.end}`,
            });
          }
        }

        bookingsSnapshotRef.current = nextSnapshot;
        if (!initializedRef.current) {
          initializedRef.current = true;
        }
      } catch (err) {
        console.error('Notification polling failed', err);
      }
    };

    refreshHostListings();
    poll();
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isAuthenticated, token, email, refreshHostListings, addNotification, resolveListingTitle]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllAsRead,
      markAsRead,
      dismissNotification,
    }),
    [notifications, unreadCount, markAllAsRead, markAsRead, dismissNotification],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}

