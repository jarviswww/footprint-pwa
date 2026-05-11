import { activeTab } from './store/signals';
import { TabBar } from './components/TabBar';
import { HomePage } from './components/home/HomePage';

export function App() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab.value === 'home' && <HomePage />}
        {activeTab.value === 'records' && <div style={placeholderStyle}>记录</div>}
        {activeTab.value === 'analysis' && <div style={placeholderStyle}>分析</div>}
        {activeTab.value === 'app' && <div style={placeholderStyle}>APP</div>}
      </div>
      <TabBar />
    </div>
  );
}

const placeholderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  fontSize: '20px',
  color: 'var(--text-secondary)'
};
