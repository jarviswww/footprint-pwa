import { db } from '../db/index';

let lastRequestTime = 0;
const MIN_INTERVAL = 1100;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export async function reverseGeocode(lat, lng) {
  const latKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;

  const cached = await db.nominatimCache.where('latKey').equals(latKey).first();
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  const now = Date.now();
  const wait = MIN_INTERVAL - (now - lastRequestTime);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=zh`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FootprintPWA/1.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    lastRequestTime = Date.now();

    const result = {
      name: data.name || data.display_name?.split(',')[0] || '',
      city: data.address?.city || data.address?.town || data.address?.county || '',
      district: data.address?.suburb || data.address?.district || '',
      road: data.address?.road || ''
    };

    if (cached) {
      await db.nominatimCache.update(cached.id, { result, expiresAt: Date.now() + CACHE_TTL });
    } else {
      await db.nominatimCache.add({ latKey, result, expiresAt: Date.now() + CACHE_TTL });
    }

    return result;
  } catch (e) {
    return null;
  }
}
