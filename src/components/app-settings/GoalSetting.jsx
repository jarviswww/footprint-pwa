import { useState, useEffect } from 'preact/hooks';
import { getGoal, setGoal } from '../../db/queries';
import { showToast } from '../common/Toast';

export function GoalSetting() {
  const [goalType, setGoalType] = useState('daily_distance');
  const [target, setTarget] = useState(3);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    getGoal().then(g => {
      if (g) {
        setGoalType(g.type || 'daily_distance');
        setTarget(g.target || g.dailyKm || 3);
      }
    });
  }, []);

  const save = async () => {
    await setGoal({ type: goalType, target, dailyKm: goalType === 'daily_distance' ? target : undefined });
    showToast('目标已保存');
    setEditing(false);
  };

  const displayValue = goalType === 'daily_distance' ? `${target} km` : `${target} 天`;
  const displayLabel = goalType === 'daily_distance' ? '日均距离' : '周活跃天数';

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>运动目标</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {displayLabel}：{displayValue}
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} style={editBtn}>
          {editing ? '取消' : '编辑'}
        </button>
      </div>

      {editing && (
        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-warm-white)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => { setGoalType('daily_distance'); setTarget(3); }}
              style={goalType === 'daily_distance' ? activeTab : inactiveTab}
            >日均距离</button>
            <button
              onClick={() => { setGoalType('weekly_active_days'); setTarget(5); }}
              style={goalType === 'weekly_active_days' ? activeTab : inactiveTab}
            >周活跃天数</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="range"
              min={goalType === 'daily_distance' ? 1 : 1}
              max={goalType === 'daily_distance' ? 50 : 7}
              value={target}
              onInput={e => setTarget(+e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '15px', fontWeight: 600, minWidth: '50px', textAlign: 'center' }}>
              {target} {goalType === 'daily_distance' ? 'km' : '天'}
            </span>
          </div>
          <button onClick={save} style={{ ...saveBtn, marginTop: '12px' }}>保存</button>
        </div>
      )}
    </div>
  );
}

const sectionStyle = { padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' };
const editBtn = { border: '1px solid var(--border-color)', background: 'none', borderRadius: '8px', padding: '4px 12px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' };
const saveBtn = { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', padding: '8px', fontSize: '13px', cursor: 'pointer', width: '100%' };
const activeTab = { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' };
const inactiveTab = { border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' };
