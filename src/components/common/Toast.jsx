import { signal } from '@preact/signals';

export const toastMessage = signal(null);

export function showToast(msg, duration = 2000) {
  toastMessage.value = msg;
  setTimeout(() => { toastMessage.value = null; }, duration);
}

export function Toast() {
  const msg = toastMessage.value;
  if (!msg) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(44,44,44,0.9)',
      color: '#fff',
      padding: '8px 20px',
      borderRadius: '20px',
      fontSize: '14px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {msg}
    </div>
  );
}
