import { db } from './index';

export async function getTracksByDate(date) {
  return db.tracks.where('date').equals(date).toArray();
}

export async function getPointsForTrack(trackId) {
  return db.trackPoints.where('trackId').equals(trackId).sortBy('timestamp');
}

export async function getCheckinsForTrack(trackId) {
  return db.checkinPoints.where('trackId').equals(trackId).toArray();
}

export async function getDatesWithData() {
  const tracks = await db.tracks.toArray();
  return [...new Set(tracks.map(t => t.date))];
}

export async function getTracksInRange(startDate, endDate) {
  return db.tracks.where('date').between(startDate, endDate, true, true).toArray();
}

export async function getAllCheckins() {
  return db.checkinPoints.toArray();
}

export async function getGoal() {
  return db.goals.toCollection().first();
}

export async function setGoal(goal) {
  const existing = await getGoal();
  if (existing) {
    return db.goals.update(existing.id, goal);
  }
  return db.goals.add(goal);
}
