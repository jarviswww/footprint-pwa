import { currentTrackId, todayPoints, todayCheckins, todayTrips, todaySteps } from '../store/signals';
import { db } from '../db/index';
import { showToast } from '../components/common/Toast';

let intervalId = null;
let lastCheckedDate = null;

function getLocalDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  // Use local date by constructing from local year/month/day
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function handleMidnightReset() {
  const today = getLocalDateString();
  if (today === lastCheckedDate) return;
  lastCheckedDate = today;

  // Sync today's track stats to DB before resetting
  const trackId = currentTrackId.value;
  if (trackId) {
    await syncTrackFinalStats(trackId);
  }

  // Reset signals for new day
  currentTrackId.value = null;
  todayPoints.value = [];
  todayCheckins.value = [];
  todayTrips.value = 0;
  todaySteps.value = 0;
  localStorage.setItem('fp_today_steps', '0');
  localStorage.setItem('fp_today_steps_date', today);

  // Clear accuracy warning flag so it can show again
  localStorage.removeItem('fp_accuracy_warn_shown');

  showToast('新一天开始啦，记录下新的足迹吧');

  // Start tracking the new day
  const { startTracking } = await import('./tracker');
  startTracking();
}

async function syncTrackFinalStats(trackId) {
  const existing = await db.tracks.get(trackId);
  // Don't overwrite if track already has meaningful data (preserve raw record)
  if (!existing || (existing.totalDistance && existing.totalDistance > 0)) return;

  const points = await db.trackPoints.where('trackId').equals(trackId).sortBy('timestamp');
  if (points.length < 2) return;

  const { haversineDistance } = await import('../utils/geo');
  let totalDist = 0;
  for (let i = 1; i < points.length; i++) {
    totalDist += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }
  const totalDuration = Math.floor((points[points.length - 1].timestamp - points[0].timestamp) / 1000);

  await db.tracks.update(trackId, {
    distance: totalDist,
    totalDistance: totalDist,
    totalDuration,
    pointCount: points.length,
    startTime: points[0].timestamp,
    endTime: points[points.length - 1].timestamp
  });
}

export function startMidnightTimer() {
  // Check immediately
  lastCheckedDate = getLocalDateString();

  // Check every minute
  intervalId = setInterval(handleMidnightReset, 60 * 1000);

  return intervalId;
}

export function stopMidnightTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}