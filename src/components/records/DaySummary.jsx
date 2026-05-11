import { useState, useEffect } from 'preact/hooks';
import { getTracksByDate } from '../../db/queries';
import { formatDistance, formatTime } from '../../utils/format';
import { weatherData, homeLocation } from '../../store/signals';
import { db } from '../../db/index';
import { haversineDistance } from '../../utils/geo';

const HOME_RADIUS_KM = 0.05;
const DEBOUNCE_MS = 2 * 60 * 1000;

export function DaySummary({ date, onViewTrack }) {
  const [track, setTrack] = useState(null);
  const [tripCount, setTripCount] = useState(0);
  const [straightDist, setStraightDist] = useState(0);
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    if (!date) return;
    getTracksByDate(date).then(async (tracks) => {
      if (tracks.length === 0) { setTrack(null); setTripCount(0); setStraightDist(0); setSteps(0); return; }
      const t = tracks[0];
      setTrack(t);

      const points = await db.trackPoints.where('trackId').equals(t.id).sortBy('timestamp');

      const home = homeLocation.value;
      setTripCount(home ? calcTrips(points, home) : 0);

      if (points.length >= 2) {
        setStraightDist(haversineDistance(points[0].lat, points[0].lng, points[points.length - 1].lat, points[points.length - 1].lng));
        setSteps(calcSteps(points));
      } else {
        setStraightDist(0);
        setSteps(0);
      }
    });
  }, [date]);

  if (!date) return null;
  if (!track) {
    return (
      <div style={cardStyle}>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>尚无足迹记录</p>
      </div>
    );
  }

  const weather = weatherData.value;

  return (
    <div>
      <div style={cardStyle}>
        <div style={sectionTitle}>运动摘要</div>
        <div style={statsGrid}>
          <StatItem label="实际距离" value={formatDistance(track.distance || 0)} />
          <StatItem label="直线距离" value={formatDistance(straightDist)} />
          <StatItem label="时长" value={formatDuration(track.totalDuration)} />
          <StatItem label="步数" value={steps.toLocaleString()} />
          <StatItem label="出行次数" value={`${tripCount} 次`} />
          <StatItem label="轨迹点" value={`${track.pointCount || 0}`} />
        </div>
        {track.startTime && track.endTime && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            活跃时段：{formatTime(track.startTime)} - {formatTime(track.endTime)}
          </div>
        )}
        <div style={{ marginTop: '12px' }}>
          <div style={trackRow}>
            <span style={{ fontSize: '13px' }}>
              {formatTime(track.startTime)} - {formatTime(track.endTime)}
            </span>
            <button onClick={() => onViewTrack(track)} style={viewBtn}>查看轨迹</button>
          </div>
        </div>
      </div>

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
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>暂无天气数据</div>
        )}
      </div>
    </div>
  );
}

function calcTrips(points, home) {
  let trips = 0;
  let away = false;
  let awayStart = 0;
  for (const p of points) {
    const d = haversineDistance(home.lat, home.lng, p.lat, p.lng);
    if (d > HOME_RADIUS_KM) {
      if (!away) {
        if (awayStart === 0) { awayStart = p.timestamp; }
        else if (p.timestamp - awayStart >= DEBOUNCE_MS) { away = true; trips++; }
      }
    } else {
      away = false;
      awayStart = 0;
    }
  }
  return trips;
}

function calcSteps(points) {
  let totalSteps = 0;
  for (let i = 1; i < points.length; i++) {
    const dist = haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng) * 1000;
    const timeDiffH = (points[i].timestamp - points[i - 1].timestamp) / 3600000;
    if (timeDiffH > 0) {
      const speedKmh = (dist / 1000) / timeDiffH;
      if (speedKmh >= 0.8 && speedKmh <= 7.0) {
        totalSteps += Math.round(dist * 1.4);
      }
    }
  }
  return totalSteps;
}

function formatDuration(seconds) {
  if (!seconds) return '0 分';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} 分`;
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

const cardStyle = { background: 'var(--bg-card)', borderRadius: '16px', padding: '16px', margin: '0 16px', boxShadow: 'var(--shadow-card)' };
const sectionTitle = { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' };
const trackRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--divider-color)' };
const viewBtn = { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' };
