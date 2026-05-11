import { useState, useEffect } from 'preact/hooks';
import { getTracksByDate, getCheckinsForTrack } from '../../db/queries';
import { formatDistance, formatTime } from '../../utils/format';
import { weatherData } from '../../store/signals';

export function DaySummary({ date, onViewTrack }) {
  const [tracks, setTracks] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [regions, setRegions] = useState(0);

  useEffect(() => {
    if (!date) return;
    getTracksByDate(date).then(async (t) => {
      setTracks(t);
      const allCheckins = [];
      for (const track of t) {
        const c = await getCheckinsForTrack(track.id);
        allCheckins.push(...c);
      }
      setCheckins(allCheckins);
      const uniqueCities = new Set(allCheckins.map(c => c.city).filter(Boolean));
      setRegions(uniqueCities.size);
    });
  }, [date]);

  if (!date) return null;
  if (tracks.length === 0) {
    return (
      <div style={cardStyle}>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>尚无足迹记录</p>
      </div>
    );
  }

  const totalDist = tracks.reduce((s, t) => s + (t.distance || 0), 0);
  const activePeriods = tracks
    .filter(t => t.startTime && t.endTime)
    .map(t => `${formatTime(t.startTime)}-${formatTime(t.endTime)}`)
    .join(', ');

  const weather = weatherData.value;

  return (
    <div>
      {/* 运动摘要 card */}
      <div style={cardStyle}>
        <div style={sectionTitle}>运动摘要</div>
        <div style={statsGrid}>
          <StatItem label="总距离" value={formatDistance(totalDist)} />
          <StatItem label="打卡点" value={`${checkins.length} 个`} />
          <StatItem label="区域数" value={`${regions || tracks.length} 个`} />
        </div>
        {activePeriods && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            活跃时段：{activePeriods}
          </div>
        )}
        <div style={{ marginTop: '12px' }}>
          {tracks.map(track => (
            <div key={track.id} style={trackRow}>
              <span style={{ fontSize: '13px' }}>
                {formatTime(track.startTime)} - {formatTime(track.endTime)}
              </span>
              <button onClick={() => onViewTrack(track)} style={viewBtn}>查看轨迹</button>
            </div>
          ))}
        </div>
      </div>

      {/* 环境上下文 card */}
      <div style={{ ...cardStyle, marginTop: '12px' }}>
        <div style={sectionTitle}>环境上下文</div>
        {weather ? (
          <div style={statsGrid}>
            <StatItem label="天气" value={getWeatherDesc(weather.code)} />
            <StatItem label="最高/最低" value={`${weather.high}°/${weather.low}°`} />
            <StatItem label="日出" value={formatSunTime(weather.sunrise)} />
            <StatItem label="日落" value={formatSunTime(weather.sunset)} />
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            暂无天气数据
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function formatSunTime(isoStr) {
  if (!isoStr) return '--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function getWeatherDesc(code) {
  if (code === undefined || code === null) return '--';
  if (code === 0) return '晴';
  if (code <= 3) return '多云';
  if (code <= 49) return '雾';
  if (code <= 59) return '小雨';
  if (code <= 69) return '雨';
  if (code <= 79) return '雪';
  if (code <= 99) return '雷雨';
  return '未知';
}

const cardStyle = {
  background: 'var(--bg-card)',
  borderRadius: '16px',
  padding: '16px',
  margin: '0 16px',
  boxShadow: 'var(--shadow-card)'
};

const sectionTitle = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '12px'
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px'
};

const trackRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  borderTop: '1px solid var(--divider-color)'
};

const viewBtn = {
  border: 'none',
  background: 'var(--color-primary)',
  color: '#fff',
  borderRadius: '12px',
  padding: '4px 12px',
  fontSize: '12px',
  cursor: 'pointer'
};
