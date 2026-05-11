import { useState, useEffect } from 'preact/hooks';
import { getTracksByDate, getCheckinsForTrack } from '../../db/queries';
import { formatDistance, formatDuration, formatTime } from '../../utils/format';

export function DaySummary({ date, onViewTrack }) {
  const [tracks, setTracks] = useState([]);
  const [checkins, setCheckins] = useState([]);

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
  const totalDuration = tracks.reduce((s, t) => s + ((t.endTime || 0) - (t.startTime || 0)), 0);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>{formatDistance(totalDist)}</span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDuration(totalDuration)}</span>
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        {tracks.length} 段轨迹 · {checkins.length} 个打卡点
      </div>
      {tracks.map(track => (
        <div key={track.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--divider-color)' }}>
          <span style={{ fontSize: '13px' }}>{formatTime(track.startTime)} - {formatTime(track.endTime)}</span>
          <button onClick={() => onViewTrack(track)} style={viewBtn}>查看轨迹</button>
        </div>
      ))}
    </div>
  );
}

const cardStyle = {
  background: 'var(--bg-card)',
  borderRadius: '16px',
  padding: '16px',
  margin: '0 16px',
  boxShadow: 'var(--shadow-card)'
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
