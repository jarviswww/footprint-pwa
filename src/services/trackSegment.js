import { db } from '../db/index';
import { currentTrackId, todayPoints } from '../store/signals';
import { haversineDistance } from '../utils/geo';

const GAP_THRESHOLD_MS = 30 * 60 * 1000;

export async function checkSegmentGap(newTimestamp) {
  const points = todayPoints.value;
  if (points.length === 0) return;

  const lastTimestamp = points[points.length - 1].timestamp;
  const gap = newTimestamp - lastTimestamp;

  if (gap >= GAP_THRESHOLD_MS) {
    await finalizeCurrentTrack();
  }
}

async function finalizeCurrentTrack() {
  const trackId = currentTrackId.value;
  if (!trackId) return;

  const points = await db.trackPoints.where('trackId').equals(trackId).toArray();
  if (points.length > 0) {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      distance += haversineDistance(
        points[i - 1].lat, points[i - 1].lng,
        points[i].lat, points[i].lng
      );
    }
    await db.tracks.update(trackId, { distance, pointCount: points.length });
  }

  currentTrackId.value = null;
  todayPoints.value = [];
}

export async function initTrackOnColdStart() {
  const lastPoint = await db.trackPoints.orderBy('timestamp').last();
  if (!lastPoint) return;

  const gap = Date.now() - lastPoint.timestamp;
  if (gap >= GAP_THRESHOLD_MS) {
    currentTrackId.value = null;
    todayPoints.value = [];
  } else {
    currentTrackId.value = lastPoint.trackId;
    const today = new Date().toISOString().slice(0, 10);
    const points = await db.trackPoints
      .where('trackId').equals(lastPoint.trackId)
      .toArray();
    todayPoints.value = points.filter(p =>
      new Date(p.timestamp).toISOString().slice(0, 10) === today
    );
  }
}
