import { ExportImport } from './ExportImport';
import { GoalSetting } from './GoalSetting';
import { db } from '../../db/index';
import { showToast } from '../common/Toast';

export function AppPage() {
  const handleClear = async () => {
    if (!confirm('确定清除所有数据？此操作不可恢复。')) return;
    await db.tracks.clear();
    await db.trackPoints.clear();
    await db.checkinPoints.clear();
    await db.nominatimCache.clear();
    showToast('数据已清除');
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg-warm-white)', padding: '16px' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>APP</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <GoalSetting />
        <ExportImport />
        <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
          <button onClick={handleClear} style={{ border: 'none', background: '#FF4D6D', color: '#fff', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
            清除所有数据
          </button>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '16px' }}>
          足迹 · Footprint v1.0.0
        </div>
      </div>
    </div>
  );
}
