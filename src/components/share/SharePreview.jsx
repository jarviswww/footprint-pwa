import { useState } from 'preact/hooks';
import { ShareCard } from './ShareCard';
import { formatDistance, formatDuration, formatTime } from '../../utils/format';
import { showToast } from '../common/Toast';

export function SharePreview({ track, checkins: initialCheckins, onClose }) {
  const [checkins, setCheckins] = useState(initialCheckins || []);

  const removeCheckin = (idx) => {
    setCheckins(checkins.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('share-card');
      if (!el) return;
      el.style.transform = 'none';
      const canvas = await html2canvas(el, { scale: 1, backgroundColor: '#1a1a2e' });
      el.style.transform = 'scale(0.3)';

      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'footprint-share.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
            return;
          }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'footprint-share.png';
        a.click();
        URL.revokeObjectURL(url);
        showToast('卡片已保存');
      }, 'image/png');
    } catch (e) {
      showToast('生成失败');
    }
  };

  const totalDist = formatDistance(track.distance || 0);
  const totalDuration = formatDuration((track.endTime || 0) - (track.startTime || 0));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto', padding: '20px' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>

      {/* Editable checkin list */}
      <div style={{ width: '100%', maxWidth: '360px', marginBottom: '16px' }}>
        <div style={{ color: '#fff', fontSize: '14px', marginBottom: '8px' }}>编辑打卡点：</div>
        {checkins.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ color: '#FF8C42', fontSize: '13px' }}>{i + 1}.</span>
            <span style={{ color: '#fff', fontSize: '13px', flex: 1 }}>{c.name}</span>
            <button onClick={() => removeCheckin(i)} style={{ background: 'none', border: 'none', color: '#FF4D6D', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        ))}
      </div>

      {/* Card preview */}
      <div style={{ width: '324px', height: '576px', overflow: 'hidden', borderRadius: '12px', marginBottom: '16px' }}>
        <ShareCard track={track} checkins={checkins} date={track.date} totalDist={totalDist} totalDuration={totalDuration} />
      </div>

      <button onClick={handleGenerate} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '24px', padding: '12px 40px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
        生成分享卡片
      </button>
    </div>
  );
}
