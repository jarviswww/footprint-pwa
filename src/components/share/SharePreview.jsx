import { useState, useRef } from 'preact/hooks';
import { ShareCard } from './ShareCard';
import { formatDistance, formatDuration } from '../../utils/format';
import { showToast } from '../common/Toast';

export function SharePreview({ track, checkins: initialCheckins, onClose }) {
  const [checkins, setCheckins] = useState(
    (initialCheckins || []).map(c => ({ ...c, note: c.note || '' }))
  );
  const dragIdx = useRef(null);

  const removeCheckin = (idx) => {
    setCheckins(checkins.filter((_, i) => i !== idx));
  };

  const updateNote = (idx, note) => {
    const updated = [...checkins];
    updated[idx] = { ...updated[idx], note };
    setCheckins(updated);
  };

  const handleDragStart = (idx) => { dragIdx.current = idx; };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const items = [...checkins];
    const [moved] = items.splice(dragIdx.current, 1);
    items.splice(idx, 0, moved);
    setCheckins(items);
    dragIdx.current = idx;
  };
  const handleDragEnd = () => { dragIdx.current = null; };

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
      if (e.name !== 'AbortError') showToast('生成失败');
    }
  };

  const totalDist = formatDistance(track.distance || track.totalDistance || 0);
  const totalDuration = formatDuration((track.endTime || 0) - (track.startTime || 0));

  return (
    <div style={overlayStyle}>
      <button onClick={onClose} style={closeBtn}>✕</button>

      {/* Editable checkin list with drag reorder and note editing */}
      <div style={{ width: '100%', maxWidth: '360px', marginBottom: '16px' }}>
        <div style={{ color: '#fff', fontSize: '14px', marginBottom: '8px' }}>编辑打卡点（长按拖拽排序）：</div>
        {checkins.map((c, i) => (
          <div
            key={`${c.lat}-${c.lng}-${i}`}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            style={checkinRow}
          >
            <span style={{ color: '#FF8C42', fontSize: '13px', cursor: 'grab' }}>☰ {i + 1}.</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: '13px' }}>{c.name}</div>
              <input
                type="text"
                placeholder="添加备注..."
                value={c.note}
                onInput={(e) => updateNote(i, e.target.value)}
                style={noteInput}
              />
            </div>
            <button onClick={() => removeCheckin(i)} style={removeBtn}>✕</button>
          </div>
        ))}
      </div>

      {/* Card preview */}
      <div style={{ width: '324px', height: '576px', overflow: 'hidden', borderRadius: '12px', marginBottom: '16px' }}>
        <ShareCard track={track} checkins={checkins} date={track.date} totalDist={totalDist} totalDuration={totalDuration} />
      </div>

      <button onClick={handleGenerate} style={generateBtn}>
        生成分享卡片
      </button>
    </div>
  );
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto', padding: '20px' };
const closeBtn = { position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' };
const checkinRow = { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' };
const noteInput = { width: '100%', marginTop: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: '#fff', outline: 'none' };
const removeBtn = { background: 'none', border: 'none', color: '#FF4D6D', cursor: 'pointer', fontSize: '16px', padding: '4px' };
const generateBtn = { background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '24px', padding: '12px 40px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' };
