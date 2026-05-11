import { useEffect, useRef } from 'preact/hooks';
import { getPointsForTrack } from '../../db/queries';
import { formatTime } from '../../utils/format';

const CATEGORY_COLORS = {
  attraction: '#FF8C42', restaurant: '#FF4D6D', hotel: '#2B7A78',
  transport: '#9CA3AF', shop: '#4A9EFF', other: '#8A8A8A'
};

export function ShareCard({ track, checkins, date, totalDist, totalDuration }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    getPointsForTrack(track.id).then(points => {
      drawMap(canvasRef.current, points, checkins);
    });
  }, [track, checkins]);

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
      <div style={{ position: 'absolute', top: '60px', left: '60px', fontSize: '42px', opacity: 0.8, zIndex: 10 }}>
        {date}{city ? ` · ${city}` : ''}
      </div>

      <canvas ref={canvasRef} width={1000} height={1150} style={{
        position: 'absolute',
        top: '150px',
        left: '40px',
        width: '1000px',
        height: '1150px',
        borderRadius: '24px'
      }} />

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

      <div style={{ position: 'absolute', bottom: '80px', left: '60px', right: '60px', display: 'flex', justifyContent: 'space-between', fontSize: '32px', opacity: 0.7 }}>
        <span>总 {totalDist} · {totalDuration}</span>
        <span style={{ fontSize: '28px' }}>🥾 足迹 × Footprint</span>
      </div>
    </div>
  );
}

function drawMap(canvas, points, checkins) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, w, h);

  if (points.length === 0) return;

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const pad = 80;
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const toX = (lng) => pad + ((lng - minLng) / lngRange) * (w - 2 * pad);
  const toY = (lat) => h - pad - ((lat - minLat) / latRange) * (h - 2 * pad);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + (i / 4) * (h - 2 * pad);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    const x = pad + (i / 4) * (w - 2 * pad);
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); ctx.stroke();
  }

  // Draw polyline with gradient
  for (let i = 1; i < points.length; i++) {
    const progress = i / (points.length - 1);
    const alpha = 0.4 + 0.6 * progress;
    ctx.strokeStyle = `rgba(255, 140, 66, ${alpha})`;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(toX(points[i - 1].lng), toY(points[i - 1].lat));
    ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
    ctx.stroke();
  }

  // Start marker
  ctx.beginPath();
  ctx.arc(toX(points[0].lng), toY(points[0].lat), 10, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#FF8C42';
  ctx.lineWidth = 4;
  ctx.stroke();

  // End marker
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(toX(last.lng), toY(last.lat), 10, 0, Math.PI * 2);
  ctx.fillStyle = '#FF8C42';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Checkin markers
  checkins.slice(0, 5).forEach((c, idx) => {
    const x = toX(c.lng);
    const y = toY(c.lat);
    const color = CATEGORY_COLORS[c.category] || '#8A8A8A';
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${idx + 1}`, x, y);
  });
}
