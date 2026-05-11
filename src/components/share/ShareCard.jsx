import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';
import { getPointsForTrack } from '../../db/queries';
import { formatTime } from '../../utils/format';

const CATEGORY_COLORS = {
  attraction: '#FF8C42', restaurant: '#FF4D6D', hotel: '#2B7A78',
  transport: '#9CA3AF', shop: '#4A9EFF', other: '#8A8A8A'
};

export function ShareCard({ track, checkins, date, totalDist, totalDuration }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false
    }).setView([39.9, 116.4], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map);
    mapInstance.current = map;

    getPointsForTrack(track.id).then(points => {
      if (points.length === 0) return;
      const latlngs = points.map(p => [p.lat, p.lng]);
      L.polyline(latlngs, { color: '#FF8C42', weight: 6, opacity: 0.9 }).addTo(map);

      checkins.slice(0, 5).forEach((c, idx) => {
        const color = CATEGORY_COLORS[c.category] || '#8A8A8A';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">${idx + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        L.marker([c.lat, c.lng], { icon }).addTo(map);
      });

      map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
    });

    return () => { map.remove(); mapInstance.current = null; };
  }, [track]);

  const city = checkins[0]?.city || track.cityDetected || '';

  return (
    <div id="share-card" style={{
      width: '1080px',
      height: '1920px',
      background: '#1a1a2e',
      color: '#fff',
      fontFamily: '-apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      transform: 'scale(0.3)',
      transformOrigin: 'top left'
    }}>
      {/* Top: date + city */}
      <div style={{ position: 'absolute', top: '60px', left: '60px', fontSize: '42px', opacity: 0.8, zIndex: 10 }}>
        {date}{city ? ` · ${city}` : ''}
      </div>

      {/* Middle: real map (60% height) */}
      <div ref={mapRef} style={{
        position: 'absolute',
        top: '150px',
        left: '40px',
        right: '40px',
        height: '1150px',
        borderRadius: '24px',
        overflow: 'hidden'
      }} />

      {/* Bottom: checkin list */}
      <div style={{ position: 'absolute', bottom: '200px', left: '60px', right: '60px' }}>
        {checkins.slice(0, 5).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '20px', marginBottom: '16px', alignItems: 'baseline' }}>
            <span style={{ color: '#FF8C42', fontSize: '36px' }}>{i + 1}.</span>
            <div>
              <span style={{ fontSize: '36px' }}>{formatTime(c.timestamp)} {c.name}</span>
              {c.note && <div style={{ fontSize: '28px', opacity: 0.6, marginTop: '4px' }}>{c.note}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '80px', left: '60px', right: '60px', display: 'flex', justifyContent: 'space-between', fontSize: '32px', opacity: 0.7 }}>
        <span>总 {totalDist} · {totalDuration}</span>
        <span style={{ fontSize: '28px' }}>🥾 足迹 × Footprint</span>
      </div>
    </div>
  );
}
