import { useState, useEffect } from 'preact/hooks';
import { getGoal, setGoal } from '../../db/queries';
import { showToast } from '../common/Toast';

export function GoalSetting() {
  const [dailyKm, setDailyKm] = useState(5);

  useEffect(() => {
    getGoal().then(g => { if (g) setDailyKm(g.dailyKm); });
  }, []);

  const save = async () => {
    await setGoal({ dailyKm });
    showToast('目标已保存');
  };

  return (
    <div style={sectionStyle}>
      <h3 style={titleStyle}>运动目标</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>每日目标</span>
        <input
          type="number"
          min="1"
          max="100"
          value={dailyKm}
          onInput={e => setDailyKm(+e.target.value)}
          style={{ width: '60px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 8px', fontSize: '15px', textAlign: 'center' }}
        />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>km</span>
        <button onClick={save} style={btnStyle}>保存</button>
      </div>
    </div>
  );
}

const sectionStyle = { padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' };
const titleStyle = { fontSize: '15px', fontWeight: 600, marginBottom: '12px' };
const btnStyle = { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer' };
