import { useState } from 'preact/hooks';

export function FilterBar({ onFilter }) {
  const now = new Date();
  const [mode, setMode] = useState('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const apply = () => {
    let start, end;
    if (mode === 'year') {
      start = `${year}-01-01`;
      end = `${year}-12-31`;
    } else if (mode === 'month') {
      start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    } else {
      const d = new Date();
      const dayOfWeek = d.getDay();
      const startD = new Date(d);
      startD.setDate(d.getDate() - dayOfWeek);
      const endD = new Date(startD);
      endD.setDate(startD.getDate() + 6);
      start = startD.toISOString().slice(0, 10);
      end = endD.toISOString().slice(0, 10);
    }
    onFilter({ mode, start, end });
  };

  return (
    <div style={{ display: 'flex', gap: '8px', padding: '0 16px', alignItems: 'center', flexWrap: 'wrap' }}>
      {['week', 'month', 'year'].map(m => (
        <button key={m} onClick={() => setMode(m)} style={{
          border: 'none',
          borderRadius: '12px',
          padding: '6px 12px',
          fontSize: '13px',
          cursor: 'pointer',
          background: mode === m ? 'var(--color-primary)' : 'var(--bg-card)',
          color: mode === m ? '#fff' : 'var(--text-primary)',
          boxShadow: 'var(--shadow-card)'
        }}>
          {{ week: '本周', month: '月', year: '年' }[m]}
        </button>
      ))}
      {mode !== 'week' && (
        <select value={year} onChange={e => setYear(+e.target.value)} style={selectStyle}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}
      {mode === 'month' && (
        <select value={month} onChange={e => setMonth(+e.target.value)} style={selectStyle}>
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}月</option>)}
        </select>
      )}
      <button onClick={apply} style={{ border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer' }}>确定</button>
    </div>
  );
}

const selectStyle = {
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '4px 8px',
  fontSize: '13px',
  background: 'var(--bg-card)'
};
