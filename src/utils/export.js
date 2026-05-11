import { db } from '../db/index';

export async function exportJSON() {
  const data = {
    tracks: await db.tracks.toArray(),
    trackPoints: await db.trackPoints.toArray(),
    checkinPoints: await db.checkinPoints.toArray(),
    goals: await db.goals.toArray(),
    exportDate: new Date().toISOString()
  };
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

export async function exportGPX() {
  const tracks = await db.tracks.toArray();
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1">\n`;
  for (const track of tracks) {
    const points = await db.trackPoints.where('trackId').equals(track.id).sortBy('timestamp');
    gpx += `  <trk><name>${track.date}</name><trkseg>\n`;
    for (const p of points) {
      gpx += `    <trkpt lat="${p.lat}" lon="${p.lng}"><time>${new Date(p.timestamp).toISOString()}</time></trkpt>\n`;
    }
    gpx += `  </trkseg></trk>\n`;
  }
  gpx += `</gpx>`;
  return new Blob([gpx], { type: 'application/gpx+xml' });
}

export async function importJSON(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  let imported = 0;
  if (data.tracks) {
    for (const track of data.tracks) {
      const exists = await db.tracks.where('date').equals(track.date)
        .and(t => t.startTime === track.startTime).first();
      if (!exists) {
        const oldId = track.id;
        delete track.id;
        const newId = await db.tracks.add(track);
        if (data.trackPoints) {
          const points = data.trackPoints.filter(p => p.trackId === oldId);
          for (const p of points) { p.trackId = newId; delete p.id; }
          await db.trackPoints.bulkAdd(points);
        }
        if (data.checkinPoints) {
          const checkins = data.checkinPoints.filter(c => c.trackId === oldId);
          for (const c of checkins) { c.trackId = newId; delete c.id; }
          await db.checkinPoints.bulkAdd(checkins);
        }
        imported++;
      }
    }
  }
  return imported;
}
