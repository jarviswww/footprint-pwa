import { useState } from 'preact/hooks';
import { Calendar } from './Calendar';
import { DaySummary } from './DaySummary';
import { TrackDetail } from './TrackDetail';

export function RecordsPage({ onShare }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewingTrack, setViewingTrack] = useState(null);

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg-warm-white)', paddingTop: 'env(safe-area-inset-top)' }}>
      <div style={{ padding: '16px 16px 0', fontSize: '20px', fontWeight: 700 }}>记录</div>
      <Calendar onSelectDate={setSelectedDate} />
      <DaySummary date={selectedDate} onViewTrack={setViewingTrack} />
      {viewingTrack && (
        <TrackDetail
          track={viewingTrack}
          onClose={() => setViewingTrack(null)}
          onShare={onShare}
        />
      )}
    </div>
  );
}
