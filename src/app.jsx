import { useState } from 'preact/hooks';
import { activeTab } from './store/signals';
import { TabBar } from './components/TabBar';
import { HomePage } from './components/home/HomePage';
import { RecordsPage } from './components/records/RecordsPage';
import { AnalysisPage } from './components/analysis/AnalysisPage';
import { AppPage } from './components/app-settings/AppPage';
import { SharePreview } from './components/share/SharePreview';
import { Toast } from './components/common/Toast';

export function App() {
  const [shareData, setShareData] = useState(null);

  const handleShare = (track, checkins) => {
    setShareData({ track, checkins });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab.value === 'home' && <HomePage />}
        {activeTab.value === 'records' && <RecordsPage onShare={handleShare} />}
        {activeTab.value === 'analysis' && <AnalysisPage />}
        {activeTab.value === 'app' && <AppPage />}
      </div>
      <TabBar />
      <Toast />
      {shareData && (
        <SharePreview
          track={shareData.track}
          checkins={shareData.checkins}
          onClose={() => setShareData(null)}
        />
      )}
    </div>
  );
}
