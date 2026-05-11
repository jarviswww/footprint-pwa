import { useState, useEffect, useRef } from 'preact/hooks';
import { getDatesWithData } from '../../db/queries';

export function Calendar({ onSelectDate }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [datesWithData, setDatesWithData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const touchStartX = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    getDatesWithData().then(setDatesWithData);
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

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
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div style={{ padding: '16px' }} ref={containerRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={navBtn}>&lt;</button>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>{year}年{month + 1}月</span>
        <button onClick={nextMonth} style={navBtn}>&gt;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px' }}>{d}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasData = datesWithData.includes(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={i}
              onClick={() => handleClick(day)}
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto',
                borderRadius: '50%',
                border: isToday ? '2px solid var(--color-primary)' : 'none',
                background: isSelected ? 'var(--color-primary)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {day}
              {hasData && !isSelected && (
                <span style={{
                  position: 'absolute',
                  bottom: '2px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)'
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const navBtn = {
  border: 'none',
  background: 'none',
  fontSize: '18px',
  cursor: 'pointer',
  padding: '8px 12px',
  color: 'var(--text-primary)'
};
