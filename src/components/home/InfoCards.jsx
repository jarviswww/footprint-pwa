import { useState, useEffect, useRef } from 'preact/hooks';
import { todayDistance, straightLineDistance, weatherData, weatherOffline, currentPosition, locationDenied, todayTrips, todaySteps, isTracking } from '../../store/signals';
import { reverseGeocode } from '../../services/nominatim';

function getWeatherIcon(code) {
  if (code === undefined || code === null) return '🌡';
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 49) return '🌫';
  if (code <= 59) return '🌦';
  if (code <= 69) return '🌧';
  if (code <= 79) return '❄️';
  if (code <= 99) return '⛈';
  return '🌡';
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 周${['日','一','二','三','四','五','六'][d.getDay()]}`;
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function InfoCards() {
  const denied = locationDenied.value;
  const weather = weatherData.value;
  const offline = weatherOffline.value;
  const dist = todayDistance.value;
  const tracking = isTracking.value;
  const pos = currentPosition.value;
  const [clock, setClock] = useState(formatTime(Date.now()));
  const [dateStr, setDateStr] = useState(formatDate(Date.now()));
  const [streetName, setStreetName] = useState('');
  const clockRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setClock(formatTime(now));
      setDateStr(formatDate(now));
    };
    tick();
    clockRef.current = setInterval(tick, 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  useEffect(() => {
    if (!pos) return;
    reverseGeocode(pos.lat, pos.lng).then(result => {
      if (result) {
        setStreetName(result.name || result.road || result.district || '');
      }
    });
  }, [pos]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Pulsing recording dot */}
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: tracking ? '#FF4D6D' : '#ccc',
            display: 'inline-block',
            boxShadow: tracking ? '0 0 0 0 rgba(255,77,109,0.4)' : 'none',
            animation: tracking ? 'ping 1.5s ease-out infinite' : 'none',
            flexShrink: 0
          }} />
          <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
            足迹 · Footprint
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {clock}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {dateStr}
          </span>
        </div>
      </div>

      {/* Main card - city + weather icon + temp (current/high/low) */}
      <div style={cardStyle}>
        {denied ? (
          <span style={{ color: 'var(--text-secondary)' }}>位置未授权</span>
        ) : weather ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px' }}>{weather.city || '定位中...'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {offline && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'var(--bg-warm-white)', borderRadius: '4px', padding: '1px 4px' }}>离线</span>}
              <span style={{ fontSize: '20px' }}>{getWeatherIcon(weather.code)}</span>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{weather.temp}°</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {weather.high}°/{weather.low}°
              </span>
            </div>
          </div>
        ) : offline ? (
          <span style={{ color: 'var(--text-tertiary)' }}>离线模式</span>
        ) : pos ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-tertiary)' }}>加载天气中...</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>等待定位</span>
        )}
      </div>

      {/* Secondary cards row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Sub card 1: distances + trips */}
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{dist.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: 400 }}>km</span></div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            直线 {straightLineDistance.value.toFixed(1)} km · {todayTrips.value} 次出行
          </div>
        </div>
        {/* Sub card 2: steps + location */}
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{todaySteps.value.toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            步 · {streetName || (pos ? '解析中...' : '等待定位')}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
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