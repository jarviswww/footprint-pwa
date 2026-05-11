import { db } from '../db/index';
import { showToast } from '../components/common/Toast';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const MIN_AVAILABLE_MB = 10;

export async function checkAndCompress() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      const availableMB = (quota - usage) / 1024 / 1024;
      if (availableMB > MIN_AVAILABLE_MB) return false;
    }
  } catch {
    return false;
  }

  return compressOldTracks();
}

export async function compressOldTracks() {
  const cutoff = Date.now() - THIRTY_DAYS;
  const oldTracks = await db.tracks.where('startTime').below(cutoff).toArray();

  if (oldTracks.length === 0) return false;

  let compressed = 0;
  for (const track of oldTracks) {
    const points = await db.trackPoints.where('trackId').equals(track.id).sortBy('timestamp');
    if (points.length <= 10) continue;

    const keep = [];
    for (let i = 0; i < points.length; i++) {
      if (i % 5 === 0 || i === points.length - 1) {
        keep.push(points[i].id);
      }
    }

    const toDelete = points.filter(p => !keep.includes(p.id)).map(p => p.id);
    await db.trackPoints.bulkDelete(toDelete);

    await db.tracks.update(track.id, { pointCount: keep.length });
    compressed++;
  }

  if (compressed > 0) {
    showToast('已自动优化存储空间');
  }
  return compressed > 0;
}

export async function handleWriteError() {
  const didCompress = await compressOldTracks();
  if (!didCompress) {
    showToast('存储空间不足，建议导出后清理数据');
  }
}
