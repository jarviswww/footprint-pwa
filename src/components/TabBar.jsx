import { activeTab } from '../store/signals';

const tabs = [
  { id: 'home', label: '首页', icon: '🏠' },
  { id: 'records', label: '记录', icon: '📅' },
  { id: 'analysis', label: '分析', icon: '📊' },
  { id: 'app', label: 'APP', icon: '⚙️' }
];

export function TabBar() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      minHeight: '50px',
      borderTop: '1px solid var(--divider-color)',
      background: 'var(--bg-card)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      flexShrink: 0
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => { activeTab.value = tab.id; }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            border: 'none',
            background: 'none',
            color: activeTab.value === tab.id ? 'var(--color-primary)' : 'var(--color-tab-inactive)',
            fontSize: '10px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <span style={{ fontSize: '20px' }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
