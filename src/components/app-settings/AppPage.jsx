import { useState, useEffect } from 'preact/hooks';
import { ExportImport } from './ExportImport';
import { GoalSetting } from './GoalSetting';
import { db } from '../../db/index';
import { showToast } from '../common/Toast';

export function AppPage() {
  const [stats, setStats] = useState({ tracks: 0, days: 0, sizeMB: 0 });
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const tracks = await db.tracks.count();
    const allTracks = await db.tracks.toArray();
    const days = new Set(allTracks.map(t => t.date)).size;
    const pointCount = await db.trackPoints.count();
    const sizeMB = ((pointCount * 50 + tracks * 200) / 1024 / 1024).toFixed(1);
    setStats({ tracks, days, sizeMB });
  };

  const handleClear = async () => {
    await db.tracks.clear();
    await db.trackPoints.clear();
    await db.checkinPoints.clear();
    await db.goals.clear();
    await db.nominatimCache.clear();
    localStorage.clear();
    setShowClearModal(false);
    showToast('数据已清除');
    loadStats();
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg-warm-white)', padding: 'calc(16px + env(safe-area-inset-top)) 16px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700 }}>足迹 · Footprint</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>v1.0.0</div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>记录你的旅行足迹</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ExportImport />

        {/* Data stats */}
        <div style={cardStyle}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>当前数据量</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {stats.tracks} 条轨迹 · {stats.days} 天 · 约 {stats.sizeMB} MB
          </div>
        </div>

        <GoalSetting />

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--divider-color)', paddingTop: '16px', marginTop: '8px' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
            v1.0.0 · 2026-05
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '4px' }}>
            隐私声明 · 开源许可
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={() => setShowClearModal(true)} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
              清除所有数据
            </button>
          </div>
        </div>
      </div>

      {/* Clear confirmation modal */}
      {showClearModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>清除所有数据</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              这将删除所有轨迹数据，不可恢复。建议先导出备份。
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowClearModal(false); document.querySelector('[data-export-json]')?.click(); }} style={primaryBtnStyle}>
                先导出
              </button>
              <button onClick={handleClear} style={dangerBtnStyle}>
                直接清除
              </button>
            </div>
            <button onClick={() => setShowClearModal(false)} style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '12px', cursor: 'pointer' }}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = { padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalStyle = { background: '#fff', borderRadius: '16px', padding: '24px', margin: '0 24px', textAlign: 'center', maxWidth: '320px', width: '100%' };
const primaryBtnStyle = { flex: 1, border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };
const dangerBtnStyle = { flex: 1, border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-secondary)', borderRadius: '12px', padding: '10px', fontSize: '14px', cursor: 'pointer' };
