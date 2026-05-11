import { useState, useEffect } from 'preact/hooks';
import { FilterBar } from './FilterBar';
import { StatsCards } from './StatsCards';
import { Charts } from './Charts';
import { TravelCharts } from './TravelCharts';
import { getTracksInRange } from '../../db/queries';

export function AnalysisPage() {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;

  const [filter, setFilter] = useState({ mode: 'month', start: defaultStart, end: defaultEnd });
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    getTracksInRange(filter.start, filter.end).then(setTracks);
  }, [filter]);

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg-warm-white)', paddingTop: 'env(safe-area-inset-top)' }}>
      <div style={{ padding: '16px 16px 8px', fontSize: '20px', fontWeight: 700 }}>分析</div>
      <FilterBar onFilter={setFilter} />
      <StatsCards tracks={tracks} />
      <Charts tracks={tracks} filter={filter} />
      <TravelCharts tracks={tracks} filter={filter} />
    </div>
  );
}
