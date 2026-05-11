import { MapView } from './MapView';
import { InfoCards } from './InfoCards';

export function HomePage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView />
      <InfoCards />
    </div>
  );
}
