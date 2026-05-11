import { homeLocation, currentPosition } from '../../store/signals';
import { showToast } from '../common/Toast';

export function HomeSetting() {
  const home = homeLocation.value;
  const pos = currentPosition.value;

  const setHome = () => {
    if (!pos) {
      showToast('等待GPS定位...');
      return;
    }
    const loc = { lat: pos.lat, lng: pos.lng };
    localStorage.setItem('fp_home_location', JSON.stringify(loc));
    homeLocation.value = loc;
    showToast('Home 已设置');
  };

  const clearHome = () => {
    localStorage.removeItem('fp_home_location');
    homeLocation.value = null;
    showToast('Home 已清除');
  };

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Home 位置</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {home
              ? `${home.lat.toFixed(5)}, ${home.lng.toFixed(5)}`
              : '未设置 — 用于计算出行次数'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {home && (
            <button onClick={clearHome} style={clearBtn}>清除</button>
          )}
          <button onClick={setHome} style={setBtn}>
            {home ? '重新定位' : '定位为 Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

const sectionStyle = { padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' };
const setBtn = { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' };
const clearBtn = { border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' };
