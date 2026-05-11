import Dexie from 'dexie';

export const db = new Dexie('FootprintDB');

db.version(1).stores({
  tracks: '++id, date, startTime, endTime',
  trackPoints: '++id, trackId, timestamp',
  checkinPoints: '++id, trackId, category, timestamp',
  goals: '++id',
  nominatimCache: '++id, latKey, expiresAt'
});

db.version(2).stores({
  tracks: '++id, date, startTime, endTime',
  trackPoints: '++id, trackId, timestamp',
  checkinPoints: '++id, trackId, category, timestamp',
  goals: '++id',
  nominatimCache: '++id, latKey, expiresAt'
}).upgrade(tx => {
  return tx.table('tracks').toCollection().modify(track => {
    if (track.distance !== undefined && track.totalDistance === undefined) {
      track.totalDistance = track.distance;
    }
    if (!track.totalDuration && track.startTime && track.endTime) {
      track.totalDuration = Math.floor((track.endTime - track.startTime) / 1000);
    }
    if (!track.cityDetected) track.cityDetected = '';
    if (!track.region) track.region = '';
    if (!track.routeType) track.routeType = 'unknown';
    if (track.isManual === undefined) track.isManual = false;
    if (!track.createdAt) track.createdAt = track.startTime || Date.now();
  });
});
