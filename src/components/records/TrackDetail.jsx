import { useEffect, useRef, useState } from 'preact/hooks';
import L from 'leaflet';
import { getPointsForTrack, getCheckinsForTrack } from '../../db/queries';
import { formatTime } from '../../utils/format';

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

    getPointsForTrack(track.id).then(points => {
      if (points.length === 0) return;
      const latlngs = points.map(p => [p.lat, p.lng]);

      L.polyline(latlngs, { color: '#FF8C42', weight: 4, opacity: 0.8 }).addTo(map);

      L.circleMarker(latlngs[0], { radius: 6, fillColor: '#FF8C42', fillOpacity: 0.4, color: '#FFF', weight: 2 }).addTo(map);
      L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, fillColor: '#FF8C42', fillOpacity: 1, color: '#FFF', weight: 2 }).addTo(map);

      map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
    });

    getCheckinsForTrack(track.id).then(c => {
      setCheckins(c);
      c.forEach((checkin, idx) => {
        const color = CATEGORY_COLORS[checkin.category] || '#8A8A8A';
        L.circleMarker([checkin.lat, checkin.lng], {
          radius: 12, fillColor: color, fillOpacity: 0.9, color: '#FFF', weight: 2
        }).addTo(map).bindPopup(`<b>${idx + 1}. ${checkin.name}</b><br/>${formatTime(checkin.timestamp)}`);
      });
    });

    return () => { map.remove(); mapInstance.current = null; };
  }, [track]);

  if (!track) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: '#fff' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2001, width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer', fontSize: '16px' }}>&#x2715;</button>
      <button onClick={() => onShare(track, checkins)} style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 2001, background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '24px', padding: '12px 32px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}>分享</button>
    </div>
  );
}
