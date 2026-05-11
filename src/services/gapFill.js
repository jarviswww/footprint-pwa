import { todayPoints } from '../store/signals';

const GAP_THRESHOLD_MS = 5 * 60 * 1000;

export function getGapSegments() {
  const points = todayPoints.value;
  const gaps = [];

  for (let i = 1; i < points.length; i++) {
    const timeDiff = points[i].timestamp - points[i - 1].timestamp;
    if (timeDiff >= GAP_THRESHOLD_MS) {
      gaps.push({
        from: { lat: points[i - 1].lat, lng: points[i - 1].lng },
        to: { lat: points[i].lat, lng: points[i].lng }
      });
    }
  }

  return gaps;
}
