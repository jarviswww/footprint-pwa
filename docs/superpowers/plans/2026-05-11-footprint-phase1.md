# 足迹·Footprint Phase 1 (P0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working PWA that tracks GPS location, displays a real-time map with polyline trail, stores data locally, and works offline.

**Architecture:** Vite + Preact SPA with 4-tab layout. GPS tracker service writes points to Dexie.js IndexedDB. Leaflet map renders polyline from signals. Workbox handles offline caching.

**Tech Stack:** Vite 6, Preact 10, @preact/signals, Dexie.js 4, Leaflet 1.9, vite-plugin-pwa (Workbox)

---

## File Structure (Phase 1)

```
src/
├── main.jsx                    — Mount App to #root
├── app.jsx                     — Root component, tab routing
├── components/
│   ├── TabBar.jsx              — Bottom 4-tab navigation
│   └── home/
│       ├── HomePage.jsx        — Home tab container
│       ├── MapView.jsx         — Leaflet map wrapper
│       └── InfoCards.jsx       — Weather + distance + location cards
├── services/
│   ├── tracker.js              — GPS watchPosition manager
│   └── trackSegment.js         — 30min gap detection, track lifecycle
├── db/
│   └── index.js                — Dexie database definition (5 tables)
├── store/
│   └── signals.js              — Global reactive state
├── utils/
│   └── geo.js                  — Haversine distance calculation
└── styles/
    └── global.css              — CSS variables + base styles
index.html                      — SPA shell with meta tags
vite.config.js                  — Vite + PWA plugin config
package.json                    — Dependencies
public/
├── manifest.json               — PWA manifest
└── icons/
    ├── icon-192.png            — App icon 192x192
    └── icon-512.png            — App icon 512x512
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/app.jsx`
- Create: `src/styles/global.css`
- Create: `public/manifest.json`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "footprint",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "preact": "^10.25.0",
    "@preact/signals": "^1.3.0",
    "dexie": "^4.0.0",
    "leaflet": "^1.9.4",
    "chart.js": "^4.4.0",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "@preact/preset-vite": "^2.9.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.20.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 }
            }
          }
        ]
      },
      manifest: false
    })
  ]
});
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#FAFAF8" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <title>足迹 · Footprint</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 4: Create public/manifest.json**

```json
{
  "name": "足迹 · Footprint",
  "short_name": "足迹",
  "description": "旅行打卡路线记录",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAFAF8",
  "theme_color": "#FF8C42",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 5: Create src/styles/global.css**

```css
:root {
  --bg-warm-white: #FAFAF8;
  --bg-card: #FFFFFF;
  --color-primary: #FF8C42;
  --color-stats: #4A9EFF;
  --color-restaurant: #FF4D6D;
  --color-hotel: #2B7A78;
  --color-transport: #9CA3AF;
  --color-shop: #4A9EFF;
  --color-other: #8A8A8A;
  --text-primary: #2C2C2C;
  --text-secondary: #8A8A8A;
  --text-tertiary: #B0B0B0;
  --border-color: #E5E5EA;
  --divider-color: #E8E8E8;
  --shadow-card: 0 2px 16px rgba(0,0,0,0.06);
  --shadow-glow: 0 0 10px rgba(255,140,66,0.25);
  --color-warning: #FFC107;
  --color-tab-inactive: #C4C4C4;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  background: var(--bg-warm-white);
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.5;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

#root {
  height: 100%;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}
```

- [ ] **Step 6: Create src/main.jsx**

```jsx
import { render } from 'preact';
import { App } from './app';
import './styles/global.css';

render(<App />, document.getElementById('root'));
```

- [ ] **Step 7: Create src/app.jsx (minimal shell)**

```jsx
import { signal } from '@preact/signals';

export const activeTab = signal('home');

export function App() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab.value === 'home' && <div>Home</div>}
        {activeTab.value === 'records' && <div>Records</div>}
        {activeTab.value === 'analysis' && <div>Analysis</div>}
        {activeTab.value === 'app' && <div>App</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Install dependencies and verify dev server starts**

Run: `npm install && npm run dev`
Expected: Vite dev server starts on localhost, page shows "Home" text.

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: project scaffold with Vite + Preact + PWA config"
```

---

## Task 2: Database Layer (Dexie)

**Files:**
- Create: `src/db/index.js`

- [ ] **Step 1: Create src/db/index.js**

```js
import Dexie from 'dexie';

export const db = new Dexie('FootprintDB');

db.version(1).stores({
  tracks: '++id, date, startTime, endTime',
  trackPoints: '++id, trackId, timestamp',
  checkinPoints: '++id, trackId, category',
  goals: '++id',
  nominatimCache: '++id, latKey, expiresAt'
});
```

- [ ] **Step 2: Verify database initializes**

Add a temporary test in `src/main.jsx`:
```jsx
import { db } from './db/index.js';
db.open().then(() => console.log('DB ready, tables:', db.tables.map(t => t.name)));
```

Run: `npm run dev`, open browser console.
Expected: `DB ready, tables: tracks,trackPoints,checkinPoints,goals,nominatimCache`

Remove the temporary test line after verification.

- [ ] **Step 3: Commit**

```bash
git add src/db/index.js
git commit -m "feat: add Dexie database with 5 tables"
```

---

## Task 3: Global Signals Store

**Files:**
- Create: `src/store/signals.js`

- [ ] **Step 1: Create src/store/signals.js**

```js
import { signal, computed } from '@preact/signals';

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

// Weather
export const weatherData = signal(null);

// UI state
export const activeTab = signal('home');
export const isFollowingMap = signal(true);

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

- [ ] **Step 2: Update src/app.jsx to use shared activeTab signal**

```jsx
import { activeTab } from './store/signals';

export function App() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab.value === 'home' && <div>Home</div>}
        {activeTab.value === 'records' && <div>Records</div>}
        {activeTab.value === 'analysis' && <div>Analysis</div>}
        {activeTab.value === 'app' && <div>App</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/store/signals.js src/app.jsx
git commit -m "feat: add global signals store with location, weather, UI state"
```

---

## Task 4: Geo Utility

**Files:**
- Create: `src/utils/geo.js`

- [ ] **Step 1: Create src/utils/geo.js**

```js
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isValidCoord(lat, lng) {
  return lat != null && lng != null && !(lat === 0 && lng === 0);
}
```

- [ ] **Step 2: Update signals.js to import from geo.js**

Replace the inline `haversineDistance` in `src/store/signals.js` with:
```js
import { haversineDistance } from '../utils/geo';
```
Remove the local `haversineDistance` function definition from signals.js.

- [ ] **Step 3: Commit**

```bash
git add src/utils/geo.js src/store/signals.js
git commit -m "feat: extract haversine distance to geo utility"
```

---

## Task 5: GPS Tracker Service

**Files:**
- Create: `src/services/tracker.js`

- [ ] **Step 1: Create src/services/tracker.js**

```js
import { db } from '../db/index';
import { currentPosition, isTracking, locationDenied, todayPoints, currentTrackId } from '../store/signals';
import { haversineDistance, isValidCoord } from '../utils/geo';

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
```

- [ ] **Step 2: Verify tracker starts in browser**

Temporarily add to `src/main.jsx`:
```jsx
import { startTracking } from './services/tracker';
startTracking();
```

Run: `npm run dev`, allow location permission in browser.
Expected: Console shows no errors. In DevTools Application > IndexedDB > FootprintDB > trackPoints, rows appear as you move (or use Chrome DevTools sensor override to simulate movement).

Remove the temporary import after verification.

- [ ] **Step 3: Commit**

```bash
git add src/services/tracker.js
git commit -m "feat: GPS tracker service with filtering and DB writes"
```

---

## Task 6: Track Segment Service

**Files:**
- Create: `src/services/trackSegment.js`

- [ ] **Step 1: Create src/services/trackSegment.js**

```js
import { db } from '../db/index';
import { currentTrackId, todayPoints } from '../store/signals';

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
      const { haversineDistance } = await import('../utils/geo');
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
```

- [ ] **Step 2: Integrate segment check into tracker.js**

Add to the top of `src/services/tracker.js`:
```js
import { checkSegmentGap } from './trackSegment';
```

In the `onPosition` function, add before the `if (!trackId)` block:
```js
  await checkSegmentGap(timestamp);
  trackId = currentTrackId.value;
```

- [ ] **Step 3: Commit**

```bash
git add src/services/trackSegment.js src/services/tracker.js
git commit -m "feat: track segmentation on 30min GPS gaps"
```

---

## Task 7: TabBar Component

**Files:**
- Create: `src/components/TabBar.jsx`

- [ ] **Step 1: Create src/components/TabBar.jsx**

```jsx
import { activeTab } from '../../store/signals';

const tabs = [
  { id: 'home', label: '首页', icon: '🏠' },
  { id: 'records', label: '记录', icon: '📅' },
  { id: 'analysis', label: '分析', icon: '📊' },
  { id: 'app', label: 'APP', icon: '⚙️' }
];

export function TabBar() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '50px',
      borderTop: '1px solid var(--divider-color)',
      background: 'var(--bg-card)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => { activeTab.value = tab.id; }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            border: 'none',
            background: 'none',
            color: activeTab.value === tab.id ? 'var(--color-primary)' : 'var(--color-tab-inactive)',
            fontSize: '10px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <span style={{ fontSize: '20px' }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Add TabBar to App**

Update `src/app.jsx`:
```jsx
import { activeTab } from './store/signals';
import { TabBar } from './components/TabBar';

export function App() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab.value === 'home' && <div>Home</div>}
        {activeTab.value === 'records' && <div>Records</div>}
        {activeTab.value === 'analysis' && <div>Analysis</div>}
        {activeTab.value === 'app' && <div>App</div>}
      </div>
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 3: Verify tabs switch in browser**

Run: `npm run dev`
Expected: 4 tabs at bottom, clicking each shows corresponding text. Active tab is orange.

- [ ] **Step 4: Commit**

```bash
git add src/components/TabBar.jsx src/app.jsx
git commit -m "feat: bottom tab bar with 4 tabs"
```

---

## Task 8: MapView Component

**Files:**
- Create: `src/components/home/MapView.jsx`

- [ ] **Step 1: Create src/components/home/MapView.jsx**

```jsx
import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';
import { currentPosition, todayPoints, isFollowingMap } from '../../store/signals';

export function MapView() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineRef = useRef(null);
  const posMarkerRef = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([39.9, 116.4], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 12
    }).addTo(map);

    map.on('dragstart', () => { isFollowingMap.value = false; });

    mapInstance.current = map;
    polylineRef.current = L.polyline([], {
      color: '#FF8C42',
      weight: 4,
      opacity: 0.8
    }).addTo(map);

    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    const pos = currentPosition.value;
    if (!pos || !mapInstance.current) return;

    if (!posMarkerRef.current) {
      posMarkerRef.current = L.circleMarker([pos.lat, pos.lng], {
        radius: 8,
        fillColor: '#FF8C42',
        fillOpacity: 1,
        color: '#FFFFFF',
        weight: 3
      }).addTo(mapInstance.current);
    } else {
      posMarkerRef.current.setLatLng([pos.lat, pos.lng]);
    }

    if (isFollowingMap.value) {
      mapInstance.current.setView([pos.lat, pos.lng]);
    }
  }, [currentPosition.value]);

  useEffect(() => {
    const points = todayPoints.value;
    if (!polylineRef.current) return;
    const latlngs = points.map(p => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latlngs);
  }, [todayPoints.value]);

  return (
    <div ref={mapRef} style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0
    }} />
  );
}
```

- [ ] **Step 2: Verify map renders**

Run: `npm run dev`
Expected: Full-screen map visible on Home tab with OSM tiles loading.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/MapView.jsx
git commit -m "feat: Leaflet map with polyline and position marker"
```

---

## Task 9: InfoCards Component

**Files:**
- Create: `src/components/home/InfoCards.jsx`

- [ ] **Step 1: Create src/components/home/InfoCards.jsx**

```jsx
import { todayDistance, weatherData, currentPosition, locationDenied, todayCheckins } from '../../store/signals';

export function InfoCards() {
  const denied = locationDenied.value;
  const weather = weatherData.value;
  const dist = todayDistance.value;
  const checkins = todayCheckins.value;

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(16px + env(safe-area-inset-top))',
      left: '16px',
      right: '16px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
          足迹 · Footprint
        </span>
        <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          {dist.toFixed(1)} km
        </span>
      </div>

      {/* Main card - weather + city */}
      <div style={cardStyle}>
        {denied ? (
          <span style={{ color: 'var(--text-secondary)' }}>位置未授权</span>
        ) : weather ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px' }}>{weather.city || '定位中...'}</span>
            <span style={{ fontSize: '20px', fontWeight: 700 }}>{weather.temp}°</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>加载天气中...</span>
        )}
      </div>

      {/* Secondary cards row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{dist.toFixed(1)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>公里 · {checkins.length} 打卡</div>
        </div>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {currentPosition.value ? '记录中...' : '等待定位'}
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: 'var(--bg-card)',
  borderRadius: '16px',
  padding: '12px',
  boxShadow: 'var(--shadow-card)',
  pointerEvents: 'auto'
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/InfoCards.jsx
git commit -m "feat: info cards overlay with weather, distance, checkins"
```

---

## Task 10: HomePage Assembly + Follow Button

**Files:**
- Create: `src/components/home/HomePage.jsx`
- Modify: `src/app.jsx`

- [ ] **Step 1: Create src/components/home/HomePage.jsx**

```jsx
import { MapView } from './MapView';
import { InfoCards } from './InfoCards';
import { isFollowingMap, currentPosition } from '../../store/signals';

export function HomePage() {
  const handleFollow = () => {
    isFollowingMap.value = true;
    const pos = currentPosition.value;
    if (pos) {
      isFollowingMap.value = true;
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView />
      <InfoCards />
      {!isFollowingMap.value && (
        <button
          onClick={handleFollow}
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            zIndex: 1000,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ◎
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update src/app.jsx to use HomePage**

```jsx
import { activeTab } from './store/signals';
import { TabBar } from './components/TabBar';
import { HomePage } from './components/home/HomePage';

export function App() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab.value === 'home' && <HomePage />}
        {activeTab.value === 'records' && <div style={placeholderStyle}>记录</div>}
        {activeTab.value === 'analysis' && <div style={placeholderStyle}>分析</div>}
        {activeTab.value === 'app' && <div style={placeholderStyle}>APP</div>}
      </div>
      <TabBar />
    </div>
  );
}

const placeholderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  fontSize: '20px',
  color: 'var(--text-secondary)'
};
```

- [ ] **Step 3: Verify full home page**

Run: `npm run dev`
Expected: Map fills screen, info cards float on top, follow button appears after dragging map.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HomePage.jsx src/app.jsx
git commit -m "feat: assemble home page with map, cards, follow button"
```

---

## Task 11: App Initialization + Auto-Start Tracking

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: Update src/main.jsx to initialize app**

```jsx
import { render } from 'preact';
import { App } from './app';
import { startTracking } from './services/tracker';
import { initTrackOnColdStart } from './services/trackSegment';
import { db } from './db/index';
import './styles/global.css';

async function init() {
  await db.open();
  await initTrackOnColdStart();
  startTracking();
}

render(<App />, document.getElementById('root'));
init();
```

- [ ] **Step 2: Verify end-to-end flow**

Run: `npm run dev`
Expected:
1. Browser asks for location permission
2. After granting, blue dot appears on map at current location
3. Moving (or simulating via DevTools Sensors) draws orange polyline
4. Info cards show distance updating
5. IndexedDB has trackPoints entries

- [ ] **Step 3: Commit**

```bash
git add src/main.jsx
git commit -m "feat: auto-start GPS tracking on app init"
```

---

## Task 12: PWA Icons + Build Verification

**Files:**
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`

- [ ] **Step 1: Generate placeholder icons**

Create simple orange circle icons using a canvas script or any tool. For now, create minimal valid PNGs. You can use this Node script:

```bash
node -e "
const { createCanvas } = require('canvas');
[192, 512].forEach(size => {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FF8C42';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size*0.4, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold ' + (size*0.3) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('足', size/2, size/2);
  require('fs').writeFileSync('public/icons/icon-' + size + '.png', c.toBuffer());
});
"
```

If `canvas` npm package is not available, use any image editor to create 192x192 and 512x512 orange circle PNGs with "足" character.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds, `dist/` folder created with service worker file.

- [ ] **Step 3: Test PWA with preview**

Run: `npm run preview`
Expected: App loads at preview URL. In Chrome DevTools > Application > Manifest, manifest is detected. Service Worker is registered.

- [ ] **Step 4: Commit**

```bash
git add public/icons/ dist/
git commit -m "feat: PWA icons and verified production build"
```

---

## Phase 1 Complete

At this point you have a working PWA that:
- Tracks GPS location in real-time
- Draws polyline trail on Leaflet map
- Stores all data in IndexedDB via Dexie
- Shows distance and weather card overlays
- Has 4-tab navigation (only Home is functional)
- Works offline via Workbox service worker
- Handles 30-minute GPS gaps with track segmentation
- Installable as PWA on mobile devices
