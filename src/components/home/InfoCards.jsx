import { useState, useEffect } from 'preact/hooks';
import { todayDistance, weatherData, currentPosition, locationDenied, todayCheckins } from '../../store/signals';
import { getGoal } from '../../db/queries';

export function InfoCards() {
  const denied = locationDenied.value;
  const weather = weatherData.value;
  const dist = todayDistance.value;
  const checkins = todayCheckins.value;
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    getGoal().then(setGoal);
  }, []);

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
        <div style={{ ...cardStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {goal ? (
            <div style={{ textAlign: 'center' }}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--divider-color)" stroke-width="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-primary)" stroke-width="4"
                  stroke-dasharray={`${Math.min(1, dist / goal.dailyKm) * 113} 113`}
                  stroke-linecap="round"
                  transform="rotate(-90 22 22)" />
              </svg>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {Math.round((dist / goal.dailyKm) * 100)}%
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {currentPosition.value ? '记录中...' : '等待定位'}
            </div>
          )}
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
