import { db } from '../db/index';
import { currentPosition, isTracking, locationDenied, todayPoints, currentTrackId, todaySteps } from '../store/signals';
import { haversineDistance, isValidCoord } from '../utils/geo';
import { showToast } from '../components/common/Toast';
import { handleWriteError } from './storageCompression';
import { onNewPoint as tripOnNewPoint } from './tripCounter';
import { countStep } from './stepCounter';

let watchId = null;
let lastPoint = null;

const ACCURACY_THRESHOLD = 100;
const MIN_DISTANCE_M = 20;
const WALK_SPEED_MIN = 0.8;
const WALK_SPEED_MAX = 7.0;

export function startTracking() {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    onPosition,
    onError,
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
  isTracking.value = true;
}

export function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  isTracking.value = false;
}

async function onPosition(pos) {
  const { latitude: lat, longitude: lng, accuracy } = pos.coords;
  const timestamp = pos.timestamp;

  if (!isValidCoord(lat, lng)) return;
  if (accuracy > ACCURACY_THRESHOLD) return;

  if (lastPoint) {
    const dist = haversineDistance(lastPoint.lat, lastPoint.lng, lat, lng) * 1000;
    if (dist < MIN_DISTANCE_M) return;

    const timeDiffH = (timestamp - lastPoint.timestamp) / 3600000;
    if (timeDiffH > 0) {
      const speedKmh = (dist / 1000) / timeDiffH;
      if (speedKmh >= WALK_SPEED_MIN && speedKmh <= WALK_SPEED_MAX) {
        countStep(dist);
      }
    }
  }

  currentPosition.value = { lat, lng, accuracy };
  locationDenied.value = false;

  if (accuracy > ACCURACY_THRESHOLD * 0.5 && !localStorage.getItem('fp_accuracy_warn_shown')) {
    localStorage.setItem('fp_accuracy_warn_shown', '1');
    showToast('GPS信号较弱，请在空旷处尝试');
  }

  if (!localStorage.getItem('fp_first_location')) {
    localStorage.setItem('fp_first_location', '1');
    showToast('足迹追踪已开始');
  }

  let trackId = currentTrackId.value;
  const today = new Date(timestamp).toISOString().slice(0, 10);

  if (!trackId) {
    const existing = await db.tracks.where('date').equals(today).first();
    if (existing) {
      trackId = existing.id;
    } else {
      trackId = await db.tracks.add({
        date: today,
        startTime: timestamp,
        endTime: timestamp,
        distance: 0,
        pointCount: 0,
        totalDistance: 0,
        totalDuration: 0,
        cityDetected: '',
        region: '',
        routeType: 'unknown',
        isManual: false,
        createdAt: timestamp
      });
    }
    currentTrackId.value = trackId;

    const trackCount = await db.tracks.count();
    if (trackCount === 1 && !localStorage.getItem('fp_first_track')) {
      localStorage.setItem('fp_first_track', '1');
      setTimeout(() => showToast('1 条轨迹已保存，可在记录 Tab 中查看'), 3000);
    }
  }

  const prevPoint = todayPoints.value[todayPoints.value.length - 1];
  let addedDist = 0;
  if (prevPoint) {
    addedDist = haversineDistance(prevPoint.lat, prevPoint.lng, lat, lng);
  }

  const point = { trackId, lat, lng, accuracy, timestamp };
  try {
    await db.trackPoints.add(point);
  } catch (e) {
    await handleWriteError();
    return;
  }

  lastPoint = { lat, lng, timestamp };
  todayPoints.value = [...todayPoints.value, point];

  const current = await db.tracks.get(trackId);
  const newDist = (current.totalDistance || 0) + addedDist;
  const newDur = current.endTime ? timestamp - current.startTime : 0;
  await db.tracks.update(trackId, {
    endTime: timestamp,
    pointCount: todayPoints.value.length,
    totalDistance: newDist,
    distance: newDist,
    totalDuration: Math.floor(newDur / 1000)
  });

  tripOnNewPoint(lat, lng, timestamp);
}

function onError(err) {
  if (err.code === err.PERMISSION_DENIED) {
    locationDenied.value = true;
    stopTracking();
  }
}
