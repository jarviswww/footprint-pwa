import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';
import { currentPosition, todayPoints, todayCheckins, isFollowingMap } from '../../store/signals';
import { getGapSegments } from '../../services/gapFill';

const osmLayer = () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, minZoom: 12 });
const satelliteLayer = () => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, minZoom: 12 });

const CATEGORY_COLORS = {
  attraction: '#FF8C42',
  restaurant: '#FF4D6D',
  hotel: '#2B7A78',
  transport: '#9CA3AF',
  shop: '#4A9EFF',
  other: '#8A8A8A'
};

export function MapView() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineGroupRef = useRef(null);
  const posMarkerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const gapLinesRef = useRef([]);
  const checkinMarkersRef = useRef([]);
  const currentLayerRef = useRef(null);
  const layerTypeRef = useRef('osm');

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([39.9, 116.4], 15);

    currentLayerRef.current = osmLayer().addTo(map);
    map.on('dragstart', () => { isFollowingMap.value = false; });

    mapInstance.current = map;
    polylineGroupRef.current = L.layerGroup().addTo(map);

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

      // Pulse animation on first location
      if (!localStorage.getItem('fp_pulse_shown')) {
        localStorage.setItem('fp_pulse_shown', '1');
        const pulse = L.circleMarker([pos.lat, pos.lng], {
          radius: 8,
          fillColor: '#FF8C42',
          fillOpacity: 0.4,
          color: '#FF8C42',
          weight: 1
        }).addTo(mapInstance.current);
        let r = 8;
        const anim = setInterval(() => {
          r += 2;
          pulse.setRadius(r);
          pulse.setStyle({ fillOpacity: Math.max(0, 0.4 - (r - 8) / 60) });
          if (r > 40) { clearInterval(anim); pulse.remove(); }
        }, 50);
      }
    } else {
      posMarkerRef.current.setLatLng([pos.lat, pos.lng]);
    }

    if (isFollowingMap.value) {
      mapInstance.current.setView([pos.lat, pos.lng]);
    }
  }, [currentPosition.value]);

  useEffect(() => {
    const points = todayPoints.value;
    if (!polylineGroupRef.current || !mapInstance.current) return;

    polylineGroupRef.current.clearLayers();
    if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null; }
    if (endMarkerRef.current) { endMarkerRef.current.remove(); endMarkerRef.current = null; }

    if (points.length < 2) return;

    const segmentCount = Math.max(1, Math.floor(points.length / 10));
    for (let i = 0; i < segmentCount; i++) {
      const startIdx = Math.floor(i * points.length / segmentCount);
      const endIdx = Math.floor((i + 1) * points.length / segmentCount);
      const segPoints = points.slice(startIdx, endIdx + 1).map(p => [p.lat, p.lng]);
      const opacity = 0.4 + (0.5 * (i / (segmentCount - 1 || 1)));
      L.polyline(segPoints, {
        color: '#FF8C42',
        weight: 4,
        opacity
      }).addTo(polylineGroupRef.current);
    }

    const first = points[0];
    startMarkerRef.current = L.circleMarker([first.lat, first.lng], {
      radius: 6,
      fillColor: '#FFFFFF',
      fillOpacity: 1,
      color: '#FF8C42',
      weight: 3
    }).addTo(mapInstance.current);

    const last = points[points.length - 1];
    endMarkerRef.current = L.circleMarker([last.lat, last.lng], {
      radius: 6,
      fillColor: '#FF8C42',
      fillOpacity: 1,
      color: '#FFFFFF',
      weight: 3
    }).addTo(mapInstance.current);

    // Gap lines
    gapLinesRef.current.forEach(l => l.remove());
    gapLinesRef.current = [];
    const gaps = getGapSegments();
    gaps.forEach(gap => {
      const line = L.polyline(
        [[gap.from.lat, gap.from.lng], [gap.to.lat, gap.to.lng]],
        { color: '#9CA3AF', weight: 2, dashArray: '8, 8', opacity: 0.6 }
      ).addTo(mapInstance.current);
      gapLinesRef.current.push(line);
    });
  }, [todayPoints.value]);

  useEffect(() => {
    const checkins = todayCheckins.value;
    if (!mapInstance.current) return;

    checkinMarkersRef.current.forEach(m => m.remove());
    checkinMarkersRef.current = [];

    checkins.forEach((c, idx) => {
      const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.other;
      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="width:24px;height:24px;border-radius:50%;background:${color};color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(255,140,66,0.25);">${idx + 1}</div>
          <div style="width:2px;height:10px;background:${color};"></div>
        </div>`,
        iconSize: [24, 36],
        iconAnchor: [12, 36]
      });
      const marker = L.marker([c.lat, c.lng], { icon })
        .bindPopup(`<b>${c.name || '打卡点'}</b>`)
        .addTo(mapInstance.current);
      checkinMarkersRef.current.push(marker);
    });
  }, [todayCheckins.value]);

  const toggleLayer = () => {
    if (!mapInstance.current || !currentLayerRef.current) return;
    mapInstance.current.removeLayer(currentLayerRef.current);
    if (layerTypeRef.current === 'osm') {
      currentLayerRef.current = satelliteLayer().addTo(mapInstance.current);
      layerTypeRef.current = 'satellite';
    } else {
      currentLayerRef.current = osmLayer().addTo(mapInstance.current);
      layerTypeRef.current = 'osm';
    }
  };

  const recenter = () => {
    const pos = currentPosition.value;
    if (!pos || !mapInstance.current) return;
    isFollowingMap.value = true;
    mapInstance.current.setView([pos.lat, pos.lng], 16);
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />
      <button onClick={recenter} style={{
        position: 'absolute',
        bottom: '24px',
        right: '16px',
        zIndex: 1000,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'none',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        ◎
      </button>
      <button onClick={toggleLayer} style={{
        position: 'absolute',
        top: 'calc(120px + env(safe-area-inset-top))',
        right: '16px',
        zIndex: 1000,
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: 'none',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        🗺
      </button>
    </div>
  );
}
