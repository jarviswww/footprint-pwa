export function StatsCards({ tracks }) {
  const totalDist = tracks.reduce((s, t) => s + (t.distance || 0), 0);
  const activeDays = new Set(tracks.map(t => t.date)).size;
  const avgDist = activeDays > 0 ? totalDist / activeDays : 0;
  const cities = new Set(tracks.map(t => t.date)).size;

  const stats = [
    { label: '总行程', value: `${totalDist.toFixed(1)}`, unit: 'km' },
    { label: '活跃天数', value: `${activeDays}`, unit: '天' },
    { label: '日均距离', value: `${avgDist.toFixed(1)}`, unit: 'km' },
    { label: '轨迹数', value: `${tracks.length}`, unit: '条' }
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', padding: '16px', overflowX: 'auto' }}>
      {stats.map(s => (
        <div key={s.label} style={{
          flex: '1',
          minWidth: '70px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '12px 8px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-stats)' }}>{s.value}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.unit}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
