import { activeTab } from './store/signals';

export function App() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab.value === 'home' && <div>Home</div>}
        {activeTab.value === 'records' && <div>Records</div>}
        {activeTab.value === 'analysis' && <div>Analysis</div>}
        {activeTab.value === 'app' && <div>App</div>}
      </div>
    </div>
  );
}
