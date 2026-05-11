# 足迹·Footprint Phase 2 (P1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Records tab (calendar + track detail), Analysis tab (charts + stats), APP tab (export/import/goals), stay detection with auto-checkin, and share card generation.

**Architecture:** Builds on Phase 1's Preact + signals + Dexie foundation. New services (stayDetector, weather, nominatim) feed data into existing signals. New page components consume DB queries.

**Tech Stack:** Chart.js 4 (charts), html2canvas (share card), Open-Meteo API (weather), Nominatim API (geocoding)

---

## File Structure (Phase 2 additions)

```
src/
├── components/
│   ├── records/
│   │   ├── RecordsPage.jsx      — Records tab container
│   │   ├── Calendar.jsx         — Month view calendar
│   │   ├── DaySummary.jsx       — Day detail card
│   │   └── TrackDetail.jsx      — Full-screen track viewer
│   ├── analysis/
│   │   ├── AnalysisPage.jsx     — Analysis tab container
│   │   ├── FilterBar.jsx        — Year/month/week filter
│   │   ├── StatsCards.jsx       — 4 metric cards
│   │   └── Charts.jsx           — Chart.js visualizations
│   ├── app-settings/
│   │   ├── AppPage.jsx          — APP tab container
│   │   ├── ExportImport.jsx     — Data export/import
│   │   └── GoalSetting.jsx      — Daily goal setting
│   ├── share/
│   │   ├── SharePreview.jsx     — Share editing overlay
│   │   └── ShareCard.jsx        — 1080x1920 card template
│   └── common/
│       └── Toast.jsx            — Toast notification
├── services/
│   ├── stayDetector.js          — Stay detection algorithm
│   ├── weather.js               — Open-Meteo API
│   └── nominatim.js             — Reverse geocoding + cache
├── db/
│   └── queries.js               — Common DB query helpers
└── utils/
    ├── format.js                — Time/distance formatting
    └── export.js                — JSON/GPX/KML serialization
```

---

## Task 1: DB Queries Helper

**Files:**
- Create: `src/db/queries.js`

- [ ] **Step 1: Create src/db/queries.js**

```js
import { db } from './index';

export async function getTracksByDate(date) {
  return db.tracks.where('date').equals(date).toArray();
}

export async function getPointsForTrack(trackId) {
  return db.trackPoints.where('trackId').equals(trackId).sortBy('timestamp');
}

export async function getCheckinsForTrack(trackId) {
  return db.checkinPoints.where('trackId').equals(trackId).toArray();
}

export async function getDatesWithData() {
  const tracks = await db.tracks.toArray();
  return [...new Set(tracks.map(t => t.date))];
}

export async function getTracksInRange(startDate, endDate) {
  return db.tracks.where('date').between(startDate, endDate, true, true).toArray();
}

export async function getAllCheckins() {
  return db.checkinPoints.toArray();
}

export async function getGoal() {
  return db.goals.toCollection().first();
}

export async function setGoal(goal) {
  const existing = await getGoal();
  if (existing) {
    return db.goals.update(existing.id, goal);
  }
  return db.goals.add(goal);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/db/queries.js
git commit -m "feat: add DB query helpers"
```

---

## Task 2: Format + Export Utilities

**Files:**
- Create: `src/utils/format.js`
- Create: `src/utils/export.js`

- [ ] **Step 1: Create src/utils/format.js**

```js
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(ms) {
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hours === 0) return `${mins} 分钟`;
  return `${hours} 小时 ${remainMins} 分钟`;
}

export function formatTime(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}
```

- [ ] **Step 2: Create src/utils/export.js**

```js
import { db } from '../db/index';

export async function exportJSON() {
  const data = {
    tracks: await db.tracks.toArray(),
    trackPoints: await db.trackPoints.toArray(),
    checkinPoints: await db.checkinPoints.toArray(),
    goals: await db.goals.toArray(),
    exportDate: new Date().toISOString()
  };
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

export async function exportGPX() {
  const tracks = await db.tracks.toArray();
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1">\n`;
  for (const track of tracks) {
    const points = await db.trackPoints.where('trackId').equals(track.id).sortBy('timestamp');
    gpx += `  <trk><name>${track.date}</name><trkseg>\n`;
    for (const p of points) {
      gpx += `    <trkpt lat="${p.lat}" lon="${p.lng}"><time>${new Date(p.timestamp).toISOString()}</time></trkpt>\n`;
    }
    gpx += `  </trkseg></trk>\n`;
  }
  gpx += `</gpx>`;
  return new Blob([gpx], { type: 'application/gpx+xml' });
}

export async function importJSON(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  let imported = 0;
  if (data.tracks) {
    for (const track of data.tracks) {
      const exists = await db.tracks.where('date').equals(track.date)
        .and(t => t.startTime === track.startTime).first();
      if (!exists) {
        const oldId = track.id;
        delete track.id;
        const newId = await db.tracks.add(track);
        if (data.trackPoints) {
          const points = data.trackPoints.filter(p => p.trackId === oldId);
          for (const p of points) { p.trackId = newId; delete p.id; }
          await db.trackPoints.bulkAdd(points);
        }
        if (data.checkinPoints) {
          const checkins = data.checkinPoints.filter(c => c.trackId === oldId);
          for (const c of checkins) { c.trackId = newId; delete c.id; }
          await db.checkinPoints.bulkAdd(checkins);
        }
        imported++;
      }
    }
  }
  return imported;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/format.js src/utils/export.js
git commit -m "feat: format utilities and JSON/GPX export/import"
```

---

## Task 3: Weather Service

**Files:**
- Create: `src/services/weather.js`

- [ ] **Step 1: Create src/services/weather.js**

```js
import { weatherData, currentPosition } from '../store/signals';

let lastFetchTime = 0;
const FETCH_INTERVAL = 5 * 60 * 1000;

export async function fetchWeather() {
  const pos = currentPosition.value;
  if (!pos) return;

  const now = Date.now();
  if (now - lastFetchTime < FETCH_INTERVAL) return;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();

    weatherData.value = {
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      code: data.current.weather_code,
      wind: data.current.wind_speed_10m,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      city: null
    };
    lastFetchTime = now;
  } catch (e) {
    // offline — keep existing data
  }
}

export function startWeatherPolling() {
  fetchWeather();
  return setInterval(fetchWeather, FETCH_INTERVAL);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/weather.js
git commit -m "feat: Open-Meteo weather service with 5min polling"
```

---

## Task 4: Nominatim Service

**Files:**
- Create: `src/services/nominatim.js`

- [ ] **Step 1: Create src/services/nominatim.js**

```js
import { db } from '../db/index';

let lastRequestTime = 0;
const MIN_INTERVAL = 1100;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export async function reverseGeocode(lat, lng) {
  const latKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;

  const cached = await db.nominatimCache.where('latKey').equals(latKey).first();
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  const now = Date.now();
  const wait = MIN_INTERVAL - (now - lastRequestTime);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=zh`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FootprintPWA/1.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    lastRequestTime = Date.now();

    const result = {
      name: data.name || data.display_name?.split(',')[0] || '',
      city: data.address?.city || data.address?.town || data.address?.county || '',
      district: data.address?.suburb || data.address?.district || '',
      road: data.address?.road || ''
    };

    if (cached) {
      await db.nominatimCache.update(cached.id, { result, expiresAt: Date.now() + CACHE_TTL });
    } else {
      await db.nominatimCache.add({ latKey, result, expiresAt: Date.now() + CACHE_TTL });
    }

    return result;
  } catch (e) {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/nominatim.js
git commit -m "feat: Nominatim reverse geocoding with 7-day cache"
```

---

## Task 5: Stay Detector Service

**Files:**
- Create: `src/services/stayDetector.js`

- [ ] **Step 1: Create src/services/stayDetector.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/services/stayDetector.js
git commit -m "feat: stay detection with auto-checkin and place classification"
```

---

## Task 6: Toast Component

**Files:**
- Create: `src/components/common/Toast.jsx`

- [ ] **Step 1: Create src/components/common/Toast.jsx**

```jsx
import { signal } from '@preact/signals';

export const toastMessage = signal(null);

export function showToast(msg, duration = 2000) {
  toastMessage.value = msg;
  setTimeout(() => { toastMessage.value = null; }, duration);
}

export function Toast() {
  const msg = toastMessage.value;
  if (!msg) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(44,44,44,0.9)',
      color: '#fff',
      padding: '8px 20px',
      borderRadius: '20px',
      fontSize: '14px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {msg}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/Toast.jsx
git commit -m "feat: toast notification component"
```

---

## Task 7: Records Page — Calendar

**Files:**
- Create: `src/components/records/RecordsPage.jsx`
- Create: `src/components/records/Calendar.jsx`

