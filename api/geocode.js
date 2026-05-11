export default async function handler(req, res) {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=zh`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FootprintPWA/1.0' }
    });
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: 'geocode fetch failed' });
  }
}
