import { exportJSON, exportGPX, importJSON } from '../../utils/export';
import { showToast } from '../common/Toast';

export function ExportImport() {
  const handleExport = async (format) => {
    try {
      const blob = format === 'json' ? await exportJSON() : await exportGPX();
      const filename = `footprint-${new Date().toISOString().slice(0, 10)}.${format}`;

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
      showToast('导出失败');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const count = await importJSON(file);
      showToast(`导入成功，新增 ${count} 条轨迹`);
    } catch (err) {
      showToast('导入失败，请检查文件格式');
    }
    e.target.value = '';
  };

  return (
    <div style={sectionStyle}>
      <h3 style={titleStyle}>数据管理</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => handleExport('json')} style={btnStyle}>导出 JSON</button>
        <button onClick={() => handleExport('gpx')} style={btnStyle}>导出 GPX</button>
        <label style={{ ...btnStyle, cursor: 'pointer' }}>
          导入数据
          <input type="file" accept=".json,.gpx" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}

const sectionStyle = { padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' };
const titleStyle = { fontSize: '15px', fontWeight: 600, marginBottom: '12px' };
const btnStyle = { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', padding: '8px 16px', fontSize: '13px' };
