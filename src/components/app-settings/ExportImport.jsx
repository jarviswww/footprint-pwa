import { useState } from 'preact/hooks';
import { exportJSON, exportGPX, importJSON } from '../../utils/export';
import { showToast } from '../common/Toast';
import { db } from '../../db/index';

export function ExportImport() {
  const [importPreview, setImportPreview] = useState(null);
  const [importFile, setImportFile] = useState(null);

  const handleExport = async (format) => {
    try {
      let blob, filename;
      if (format === 'json') {
        blob = await exportJSON();
        filename = `footprint-${new Date().toISOString().slice(0, 10)}.json`;
      } else if (format === 'gpx') {
        blob = await exportGPX();
        filename = `footprint-${new Date().toISOString().slice(0, 10)}.gpx`;
      } else {
        blob = await exportKML();
        filename = `footprint-${new Date().toISOString().slice(0, 10)}.kml`;
      }

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('导出成功');
    } catch (e) {
      if (e.name !== 'AbortError') showToast('导出失败');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const trackCount = data.tracks?.length || 0;
      const dates = data.tracks?.map(t => t.date).filter(Boolean) || [];
      const dateRange = dates.length > 0
        ? `${dates.sort()[0]} ~ ${dates.sort()[dates.length - 1]}`
        : '无日期信息';
      setImportPreview({ trackCount, dateRange });
      setImportFile(file);
    } catch {
      showToast('无法解析文件，请检查格式');
    }
  };

  const confirmImport = async () => {
    if (!importFile) return;
    try {
      const count = await importJSON(importFile);
      showToast(`导入成功，新增 ${count} 条轨迹`);
    } catch {
      showToast('导入失败');
    }
    setImportPreview(null);
    setImportFile(null);
  };

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button data-export-json onClick={() => handleExport('json')} style={primaryBtn}>导出数据</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleExport('gpx')} style={outlineBtn}>GPX</button>
          <button onClick={() => handleExport('kml')} style={outlineBtn}>KML</button>
        </div>
        <label style={{ ...outlineBtn, textAlign: 'center', cursor: 'pointer', display: 'block' }}>
          导入数据
          <input type="file" accept=".json,.gpx,.kml" onChange={handleFileSelect} style={{ display: 'none' }} />
        </label>
      </div>

      {importPreview && (
        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-warm-white)', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>导入预览</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {importPreview.trackCount} 条轨迹 · {importPreview.dateRange}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={confirmImport} style={{ ...primaryBtn, flex: 1, padding: '6px' }}>确认导入</button>
            <button onClick={() => { setImportPreview(null); setImportFile(null); }} style={{ ...outlineBtn, flex: 1 }}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

async function exportKML() {
  const tracks = await db.tracks.toArray();
  let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n<name>足迹导出</name>\n`;

  for (const track of tracks) {
    const points = await db.trackPoints.where('trackId').equals(track.id).sortBy('timestamp');
    kml += `<Placemark>\n<name>${track.date}</name>\n<LineString><coordinates>\n`;
    for (const p of points) {
      kml += `${p.lng},${p.lat},0\n`;
    }
    kml += `</coordinates></LineString>\n</Placemark>\n`;
  }

  kml += `</Document>\n</kml>`;
  return new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
}

const sectionStyle = { padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' };
const primaryBtn = { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%' };
const outlineBtn = { border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-primary)', borderRadius: '12px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', flex: 1 };
