import { db } from '../db/index';
import { currentTrackId, todayPoints } from '../store/signals';

export async function initTrackOnColdStart() {
  const today = new Date().toISOString().slice(0, 10);
  const todayTracks = await db.tracks.where('date').equals(today).toArray();

  if (todayTracks.length > 0) {
    const track = todayTracks[0];
    currentTrackId.value = track.id;
    const points = await db.trackPoints.where('trackId').equals(track.id).toArray();
    todayPoints.value = points;
  } else {
    currentTrackId.value = null;
    todayPoints.value = [];
  }
}
