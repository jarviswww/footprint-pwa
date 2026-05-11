import { db } from '../db/index';
import { currentTrackId, todayPoints } from '../store/signals';
import { haversineDistance } from '../utils/geo';

const UPDATE_INTERVAL = 30 * 60 * 1000;

let intervalId = null;

export function startTrackUpdater() {
  updateTrackStats();
  intervalId = setInterval(updateTrackStats, UPDATE_INTERVAL);
  return intervalId;
}

async function updateTrackStats() {
  const trackId = currentTrackId.value;
  if (!trackId) return;

  const points = await db.trackPoints.where('trackId').equals(trackId).sortBy('timestamp');
  if (points.length < 2) return;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }

  const totalDuration = Math.floor((points[points.length - 1].timestamp - points[0].timestamp) / 1000);

  await db.tracks.update(trackId, {
    distance: totalDistance,
    totalDistance,
    totalDuration,
    pointCount: points.length,
    startTime: points[0].timestamp,
    endTime: points[points.length - 1].timestamp
  });

  todayPoints.value = points;
}
