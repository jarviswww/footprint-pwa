import { signal, computed } from '@preact/signals';
import { haversineDistance } from '../utils/geo';

// Location state
export const currentPosition = signal(null);
export const isTracking = signal(false);
export const locationDenied = signal(false);

// Today's data
export const todayPoints = signal([]);
export const currentTrackId = signal(null);
export const todayCheckins = signal([]);

// Computed
export const todayDistance = computed(() => {
  const points = todayPoints.value;
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }
  return total;
});

// Home & trips
const savedHome = localStorage.getItem('fp_home_location');
export const homeLocation = signal(savedHome ? JSON.parse(savedHome) : null);
export const todayTrips = signal(0);

// Weather
export const weatherData = signal(null);
export const weatherOffline = signal(false);

// UI state
export const activeTab = signal('home');
export const isFollowingMap = signal(true);
