import { weatherData, weatherOffline, currentPosition } from '../store/signals';

let lastFetchTime = 0;
const FETCH_INTERVAL = 5 * 60 * 1000;

export async function fetchWeather() {
  let pos = currentPosition.value;

  if (!pos) {
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        pos = { lat: ipData.latitude, lng: ipData.longitude };
      }
    } catch {}
  }

  if (!pos) return;

  const now = Date.now();
  if (now - lastFetchTime < FETCH_INTERVAL) return;

  try {
    const url = `/api/weather?lat=${pos.lat}&lng=${pos.lng}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();

    weatherData.value = {
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      code: data.current.weather_code,
      wind: data.current.wind_speed_10m,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      city: null
    };
    weatherOffline.value = false;
    lastFetchTime = now;
  } catch (e) {
    weatherOffline.value = true;
  }
}

export function startWeatherPolling() {
  fetchWeather();
  return setInterval(fetchWeather, FETCH_INTERVAL);
}
