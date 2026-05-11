import { useState, useEffect } from 'preact/hooks';
import { todayDistance, weatherData, weatherOffline, currentPosition, locationDenied, todayCheckins } from '../../store/signals';
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

export function InfoCards() {
  const denied = locationDenied.value;
  const weather = weatherData.value;
  const offline = weatherOffline.value;
  const dist = todayDistance.value;
  const checkins = todayCheckins.value;
  const [streetName, setStreetName] = useState('');

  useEffect(() => {
    const pos = currentPosition.value;
    if (!pos) return;
    reverseGeocode(pos.lat, pos.lng).then(result => {
      if (result) {
        setStreetName(result.name || result.road || result.district || '');
      }
    });
  }, [currentPosition.value]);

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
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>加载天气中...</span>
        )}
      </div>

      {/* Secondary cards row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Sub card 1: today distance + checkin count */}
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{dist.toFixed(1)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>公里 · {checkins.length} 打卡</div>
        </div>
        {/* Sub card 2: current street/POI name */}
        <div style={{ ...cardStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              {streetName || (currentPosition.value ? '解析中...' : '等待定位')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>当前位置</div>
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
