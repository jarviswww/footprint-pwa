import { db } from '../db/index';
import { currentPosition, isTracking, locationDenied, todayPoints, currentTrackId } from '../store/signals';
import { haversineDistance, isValidCoord } from '../utils/geo';
import { checkSegmentGap } from './trackSegment';

let watchId = null;
let lastPoint = null;

const ACCURACY_THRESHOLD = 100;
const MIN_DISTANCE_M = 3;

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
  }

  currentPosition.value = { lat, lng, accuracy };
  locationDenied.value = false;

  await checkSegmentGap(timestamp);
  let trackId = currentTrackId.value;

  if (!trackId) {
    trackId = await db.tracks.add({
      date: new Date(timestamp).toISOString().slice(0, 10),
      startTime: timestamp,
      endTime: timestamp,
      distance: 0,
      pointCount: 0
    });
    currentTrackId.value = trackId;
  }

  const point = { trackId, lat, lng, accuracy, timestamp };
  await db.trackPoints.add(point);

  lastPoint = { lat, lng, timestamp };
  todayPoints.value = [...todayPoints.value, point];

  await db.tracks.update(trackId, {
    endTime: timestamp,
    pointCount: todayPoints.value.length
  });
}

function onError(err) {
  if (err.code === err.PERMISSION_DENIED) {
    locationDenied.value = true;
    stopTracking();
  }
}
