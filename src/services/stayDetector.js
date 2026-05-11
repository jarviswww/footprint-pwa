import { db } from '../db/index';
import { todayPoints, todayCheckins, currentTrackId } from '../store/signals';
import { haversineDistance } from '../utils/geo';
import { reverseGeocode } from './nominatim';

const CHECK_INTERVAL = 60 * 1000;
const STAY_DURATION = 8 * 60 * 1000;
const SPEED_THRESHOLD = 1;
const DEDUP_RADIUS = 0.5;
const DEDUP_HOURS = 24;

let intervalId = null;

export function startStayDetection() {
  intervalId = setInterval(detectStay, CHECK_INTERVAL);
}

export function stopStayDetection() {
  if (intervalId) clearInterval(intervalId);
}

async function detectStay() {
  const points = todayPoints.value;
  if (points.length < 5) return;

  const slowSegment = [];
  for (let i = points.length - 1; i > 0; i--) {
    const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000 / 3600;
    if (dt === 0) continue;
    const dist = haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
    const speed = dist / dt;
    if (speed < SPEED_THRESHOLD) {
      slowSegment.unshift(points[i]);
    } else {
      break;
    }
  }

  if (slowSegment.length < 3) return;
  const duration = slowSegment[slowSegment.length - 1].timestamp - slowSegment[0].timestamp;
  if (duration < STAY_DURATION) return;

  const midIdx = Math.floor(slowSegment.length / 2);
  const lat = slowSegment[midIdx].lat;
  const lng = slowSegment[midIdx].lng;

  const isDuplicate = await checkDuplicate(lat, lng);
  if (isDuplicate) return;

  const geo = await reverseGeocode(lat, lng);
  const category = classifyPlace(geo);

  const checkin = {
    trackId: currentTrackId.value,
    lat,
    lng,
    timestamp: slowSegment[midIdx].timestamp,
    name: geo?.name || geo?.road || '未知地点',
    city: geo?.city || '',
    category,
    stayDuration: duration
  };

  await db.checkinPoints.add(checkin);
  todayCheckins.value = [...todayCheckins.value, checkin];
}

async function checkDuplicate(lat, lng) {
  const cutoff = Date.now() - DEDUP_HOURS * 60 * 60 * 1000;
  const recent = await db.checkinPoints.where('timestamp').above(cutoff).toArray();
  return recent.some(c => haversineDistance(c.lat, c.lng, lat, lng) < DEDUP_RADIUS);
}

function classifyPlace(geo) {
  if (!geo || !geo.name) return 'other';
  const name = geo.name;
  if (/公园|博物馆|景区|古迹|广场/.test(name)) return 'attraction';
  if (/餐厅|馆|店|咖啡|小吃/.test(name)) return 'restaurant';
  if (/酒店|客栈|民宿|青旅/.test(name)) return 'hotel';
  if (/站|机场|出口|停车场/.test(name)) return 'transport';
  if (/商场|超市|商店/.test(name)) return 'shop';
  return 'other';
}
