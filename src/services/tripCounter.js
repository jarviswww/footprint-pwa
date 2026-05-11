import { homeLocation, todayTrips, todayPoints } from '../store/signals';
import { haversineDistance } from '../utils/geo';

const HOME_RADIUS_KM = 0.05;
const DEBOUNCE_MS = 2 * 60 * 1000;

let isAway = false;
let firstAwayTime = 0;
let debounced = false;

export function onNewPoint(lat, lng, timestamp) {
  const home = homeLocation.value;
  if (!home) return;

  const distKm = haversineDistance(home.lat, home.lng, lat, lng);

  if (distKm > HOME_RADIUS_KM) {
    if (!isAway && !debounced) {
      if (firstAwayTime === 0) {
        firstAwayTime = timestamp;
      } else if (timestamp - firstAwayTime >= DEBOUNCE_MS) {
        isAway = true;
        debounced = true;
        todayTrips.value = todayTrips.value + 1;
      }
    }
  } else {
    if (isAway) {
      isAway = false;
      debounced = false;
      firstAwayTime = 0;
    } else {
      firstAwayTime = 0;
    }
  }
}

export function recalcTripsFromPoints() {
  const home = homeLocation.value;
  if (!home) { todayTrips.value = 0; return; }

  const points = todayPoints.value;
  if (points.length === 0) { todayTrips.value = 0; return; }

  let trips = 0;
  let away = false;
  let awayStart = 0;

  for (const p of points) {
    const distKm = haversineDistance(home.lat, home.lng, p.lat, p.lng);
    if (distKm > HOME_RADIUS_KM) {
      if (!away) {
        if (awayStart === 0) {
          awayStart = p.timestamp;
        } else if (p.timestamp - awayStart >= DEBOUNCE_MS) {
          away = true;
          trips++;
        }
      }
    } else {
      if (away) {
        away = false;
        awayStart = 0;
      } else {
        awayStart = 0;
      }
    }
  }

  todayTrips.value = trips;
  isAway = away;
  debounced = away;
  firstAwayTime = away ? points[points.length - 1].timestamp : 0;
}
