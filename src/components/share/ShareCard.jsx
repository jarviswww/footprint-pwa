import { useEffect, useRef } from 'preact/hooks';
import { getPointsForTrack } from '../../db/queries';
import { formatTime } from '../../utils/format';

const CATEGORY_COLORS = {
  attraction: '#FF8C42', restaurant: '#FF4D6D', hotel: '#2B7A78',
  transport: '#9CA3AF', shop: '#4A9EFF', other: '#8A8A8A'
};

const TILE_SIZE = 256;

export function ShareCard({ track, checkins, date, totalDist, totalDuration }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    getPointsForTrack(track.id).then(points => {
      drawMapWithTiles(canvasRef.current, points, checkins);
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

function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  return { x, y };
}

function tileToLatLng(tx, ty, zoom) {
  const n = Math.pow(2, zoom);
  const lng = (tx / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

function getBoundsZoom(minLat, maxLat, minLng, maxLng, w, h) {
  for (let z = 18; z >= 1; z--) {
    const tl = latLngToTile(maxLat, minLng, z);
    const br = latLngToTile(minLat, maxLng, z);
    const tilesX = (br.x - tl.x) * TILE_SIZE;
    const tilesY = (br.y - tl.y) * TILE_SIZE;
    if (tilesX <= w * 0.8 && tilesY <= h * 0.8) return z;
  }
  return 1;
}

async function drawMapWithTiles(canvas, points, checkins) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  if (points.length === 0) return;

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const padLat = (maxLat - minLat) * 0.15 || 0.002;
  const padLng = (maxLng - minLng) * 0.15 || 0.002;

  const zoom = getBoundsZoom(minLat - padLat, maxLat + padLat, minLng - padLng, maxLng + padLng, w, h);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const centerTile = latLngToTile(centerLat, centerLng, zoom);

  const offsetX = w / 2 - (centerTile.x % 1) * TILE_SIZE;
  const offsetY = h / 2 - (centerTile.y % 1) * TILE_SIZE;
  const baseTileX = Math.floor(centerTile.x);
  const baseTileY = Math.floor(centerTile.y);

  const tilesH = Math.ceil(w / TILE_SIZE) + 2;
  const tilesV = Math.ceil(h / TILE_SIZE) + 2;

  const tilePromises = [];
  for (let dy = -Math.floor(tilesV / 2); dy <= Math.floor(tilesV / 2); dy++) {
    for (let dx = -Math.floor(tilesH / 2); dx <= Math.floor(tilesH / 2); dx++) {
      const tx = baseTileX + dx;
      const ty = baseTileY + dy;
      const px = offsetX + dx * TILE_SIZE;
      const py = offsetY + dy * TILE_SIZE;
      tilePromises.push(loadTile(tx, ty, zoom, px, py));
    }
  }

  const tiles = await Promise.allSettled(tilePromises);
  tiles.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      const { img, px, py } = result.value;
      ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
    }
  });

  const toPixel = (lat, lng) => {
    const t = latLngToTile(lat, lng, zoom);
    const px = offsetX + (t.x - centerTile.x) * TILE_SIZE + (centerTile.x % 1) * TILE_SIZE;
    const py = offsetY + (t.y - centerTile.y) * TILE_SIZE + (centerTile.y % 1) * TILE_SIZE;
    return { x: px, y: py };
  };

  // Draw polyline
  ctx.strokeStyle = '#FF8C42';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const { x, y } = toPixel(points[i].lat, points[i].lng);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Glow effect
  ctx.strokeStyle = 'rgba(255, 140, 66, 0.3)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const { x, y } = toPixel(points[i].lat, points[i].lng);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Start marker
  const start = toPixel(points[0].lat, points[0].lng);
  ctx.beginPath();
  ctx.arc(start.x, start.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#FF8C42';
  ctx.lineWidth = 4;
  ctx.stroke();

  // End marker
  const end = toPixel(points[points.length - 1].lat, points[points.length - 1].lng);
  ctx.beginPath();
  ctx.arc(end.x, end.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#FF8C42';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Checkin markers
  checkins.slice(0, 5).forEach((c, idx) => {
    const { x, y } = toPixel(c.lat, c.lng);
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

function loadTile(tx, ty, zoom, px, py) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ img, px, py });
    img.onerror = () => resolve(null);
    const s = ['a', 'b', 'c'][Math.abs(tx + ty) % 3];
    img.src = `https://${s}.tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
  });
}
