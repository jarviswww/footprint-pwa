import { useState, useEffect, useRef } from 'preact/hooks';
import { getTracksInRange } from '../../db/queries';

function getHeatLevel(distance) {
  if (!distance || distance <= 0) return 0;
  if (distance < 1) return 1;
  if (distance < 3) return 2;
  if (distance < 6) return 3;
  return 4;
}

const HEAT_COLORS = [
  'transparent',
  'rgba(255, 140, 66, 0.2)',
  'rgba(255, 140, 66, 0.45)',
  'rgba(255, 140, 66, 0.7)',
  'rgba(255, 140, 66, 1.0)'
];

export function Calendar({ onSelectDate }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [distanceMap, setDistanceMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
    getTracksInRange(firstDay, lastDay).then(tracks => {
      const map = {};
      tracks.forEach(t => {
        const dist = t.totalDistance || t.distance || 0;
        map[t.date] = (map[t.date] || 0) + dist;
      });
      setDistanceMap(map);
    });
  }, [year, month]);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const monthTotal = Object.values(distanceMap).reduce((s, d) => s + d, 0);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const handleClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    onSelectDate(dateStr);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 60) prevMonth();
    else if (diff < -60) nextMonth();
  };

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div style={{ padding: '16px' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <button onClick={prevMonth} style={navBtn}>&lt;</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{year}年{month + 1}月</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            本月 {monthTotal.toFixed(1)} km
          </div>
        </div>
        <button onClick={nextMonth} style={navBtn}>&gt;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginTop: '12px' }}>
        {weekdays.map((d, i) => (
          <div key={d} style={{
            fontSize: '12px',
            color: (i === 0 || i === 6) ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            padding: '4px',
            fontWeight: 500
          }}>{d}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dist = distanceMap[dateStr] || 0;
          const level = getHeatLevel(dist);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={i}
              onClick={() => handleClick(day)}
              style={{
                width: '38px',
                height: '38px',
                margin: '0 auto',
                borderRadius: '8px',
                border: isToday ? '2px solid #fff' : 'none',
                background: isSelected
                  ? 'var(--color-primary)'
                  : HEAT_COLORS[level],
                color: isSelected ? '#fff' : (level >= 3 ? '#fff' : 'var(--text-primary)'),
                fontSize: '14px',
                fontWeight: isToday ? 700 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s, box-shadow 0.15s',
                transform: isSelected ? 'scale(1.05)' : 'none',
                boxShadow: isToday
                  ? '0 0 8px rgba(255,140,66,0.4)'
                  : isSelected
                    ? '0 2px 8px rgba(255,140,66,0.3)'
                    : 'none'
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <span>少</span>
        {HEAT_COLORS.slice(1).map((c, i) => (
          <span key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c, display: 'inline-block' }} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}

const navBtn = {
  border: 'none',
  background: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '8px 14px',
  color: 'var(--text-primary)',
  fontWeight: 600
};
