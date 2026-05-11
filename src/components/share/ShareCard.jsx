export function ShareCard({ track, checkins, date, totalDist, totalDuration }) {
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
      <div style={{ position: 'absolute', top: '60px', left: '60px', fontSize: '42px', opacity: 0.8 }}>
        {date}
      </div>

      {/* Middle: map placeholder */}
      <div style={{
        position: 'absolute',
        top: '150px',
        left: '40px',
        right: '40px',
        height: '1150px',
        background: '#16213e',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        color: 'rgba(255,255,255,0.3)'
      }}>
        轨迹地图
      </div>

      {/* Bottom: checkin list */}
      <div style={{ position: 'absolute', bottom: '200px', left: '60px', right: '60px' }}>
        {checkins.slice(0, 5).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '36px' }}>
            <span style={{ color: '#FF8C42' }}>{i + 1}.</span>
            <span>{c.name}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '80px', left: '60px', right: '60px', display: 'flex', justifyContent: 'space-between', fontSize: '32px', opacity: 0.7 }}>
        <span>{totalDist} · {totalDuration}</span>
        <span>🥾 足迹 × Footprint</span>
      </div>
    </div>
  );
}
