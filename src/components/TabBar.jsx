import { activeTab } from '../store/signals';

const tabs = [
  { id: 'home', label: '首页', icon: '🏠' },
  { id: 'records', label: '记录', icon: '📅' },
  { id: 'analysis', label: '分析', icon: '📊' },
  { id: 'app', label: 'APP', icon: '⚙️' }
];

export function TabBar() {
  const activeIdx = tabs.findIndex(t => t.id === activeTab.value);

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      minHeight: '50px',
      borderTop: '1px solid var(--divider-color)',
      background: 'var(--bg-card)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      flexShrink: 0,
      position: 'relative'
    }}>
      {/* Sliding glass indicator */}
      <div style={{
        position: 'absolute',
        top: '4px',
        left: `calc(${activeIdx} * 25% + 12.5% - 24px)`,
        width: '48px',
        height: '42px',
        borderRadius: '14px',
        background: 'rgba(255, 140, 66, 0.12)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 140, 66, 0.15)',
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none'
      }} />

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
            padding: '4px 12px',
            position: 'relative',
            zIndex: 1,
            transition: 'color 0.2s ease'
          }}
        >
          <span style={{ fontSize: '20px' }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
