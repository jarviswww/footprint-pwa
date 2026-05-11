import { MapView } from './MapView';
import { InfoCards } from './InfoCards';
import { isFollowingMap, currentPosition } from '../../store/signals';

export function HomePage() {
  const handleFollow = () => {
    isFollowingMap.value = true;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView />
      <InfoCards />
      {!isFollowingMap.value && (
        <button
          onClick={handleFollow}
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            zIndex: 1000,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ◎
        </button>
      )}
    </div>
  );
}
