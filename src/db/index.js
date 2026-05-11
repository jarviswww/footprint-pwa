import Dexie from 'dexie';

export const db = new Dexie('FootprintDB');

db.version(1).stores({
  tracks: '++id, date, startTime, endTime',
  trackPoints: '++id, trackId, timestamp',
  checkinPoints: '++id, trackId, category',
  goals: '++id',
  nominatimCache: '++id, latKey, expiresAt'
});
