import { currentPosition, locationDenied, isTracking } from '../../store/signals';

export function StatusBar() {
  if (locationDenied.value) {
    return <Bar color="#FF4D6D" text="位置未授权 — 无法记录轨迹" />;
  }

  if (isTracking.value && currentPosition.value && currentPosition.value.accuracy > 50) {
    return <Bar color="var(--color-warning)" text="定位信号弱" />;
  }

  return null;
}

function Bar({ color, text }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1500,
      background: color,
      color: '#fff',
      textAlign: 'center',
      fontSize: '12px',
      padding: '4px 0',
      fontWeight: 500
    }}>
      {text}
    </div>
  );
}
