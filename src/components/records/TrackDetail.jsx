import { useEffect, useRef, useState } from 'preact/hooks';
import L from 'leaflet';
import { getPointsForTrack, getCheckinsForTrack } from '../../db/queries';
import { formatTime } from '../../utils/format';
import { todayPoints, currentTrackId } from '../../store/signals';

const CATEGORY_COLORS = {
  attraction: '#FF8C42',
  restaurant: '#FF4D6D',
  hotel: '#2B7A78',
  transport: '#9CA3AF',
  shop: '#4A9EFF',
  other: '#8A8A8A'
};

export function TrackDetail({ track, onClose, onShare }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    if (!track || mapInstance.current) return;

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([39.9, 116.4], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    mapInstance.current = map;

    const isToday = track.id === currentTrackId.value;

    const loadPoints = isToday
      ? Promise.resolve(todayPoints.value)
      : getPointsForTrack(track.id);

    loadPoints.then(points => {
      if (points.length === 0) return;
      const latlngs = points.map(p => [p.lat, p.lng]);

      const segCount = Math.max(1, Math.floor(points.length / 8));
      for (let i = 0; i < segCount; i++) {
        const s = Math.floor(i * points.length / segCount);
        const e = Math.floor((i + 1) * points.length / segCount);
        const seg = latlngs.slice(s, e + 1);
        const opacity = 0.3 + (0.6 * (i / (segCount - 1 || 1)));
        L.polyline(seg, { color: '#FF8C42', weight: 4, opacity, smoothFactor: 1.5, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      }

      L.circleMarker(latlngs[0], { radius: 6, fillColor: '#FFFFFF', fillOpacity: 1, color: '#FF8C42', weight: 3 }).addTo(map);
      L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, fillColor: '#FF8C42', fillOpacity: 1, color: '#FFFFFF', weight: 3 }).addTo(map);

      map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
    });

    getCheckinsForTrack(track.id).then(c => {
      setCheckins(c);
      c.forEach((checkin, idx) => {
        const color = CATEGORY_COLORS[checkin.category] || '#8A8A8A';
        const icon = L.divIcon({
          className: '',
          html: `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:26px;height:26px;border-radius:50%;background:${color};color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(255,140,66,0.25);">${idx + 1}</div>
            <div style="width:2px;height:12px;background:${color};"></div>
          </div>`,
          iconSize: [26, 40],
          iconAnchor: [13, 40]
        });
        L.marker([checkin.lat, checkin.lng], { icon }).addTo(map)
          .bindPopup(`<div style="min-width:120px;"><b>${checkin.name || '打卡点'}</b><br/><span style="color:#8A8A8A;font-size:12px;">${formatTime(checkin.timestamp)}</span>${checkin.note ? `<br/><span style="font-size:12px;">${checkin.note}</span>` : ''}</div>`);
      });
    });

    return () => { map.remove(); mapInstance.current = null; };
  }, [track]);

  if (!track) return null;

  const handleZoomIn = () => { if (mapInstance.current) mapInstance.current.zoomIn(); };
  const handleZoomOut = () => { if (mapInstance.current) mapInstance.current.zoomOut(); };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: '#fff' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {/* Close button top-right */}
      <button onClick={onClose} style={closeBtnStyle}>&#x2715;</button>
      {/* Zoom controls bottom-right */}
      <div style={{ position: 'absolute', bottom: '80px', right: '16px', zIndex: 2001, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button onClick={handleZoomIn} style={zoomBtnStyle}>+</button>
        <button onClick={handleZoomOut} style={zoomBtnStyle}>−</button>
      </div>
      {/* Share button bottom center */}
      <button onClick={() => onShare(track, checkins)} style={shareBtnStyle}>分享</button>
    </div>
  );
}

const closeBtnStyle = {
  position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', right: '16px', zIndex: 2001,
  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
  background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer', fontSize: '16px'
};

const zoomBtnStyle = {
  width: '36px', height: '36px', borderRadius: '8px', border: 'none',
  background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer',
  fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const shareBtnStyle = {
  position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 2001,
  background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '24px',
  padding: '12px 32px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-card)'
};
