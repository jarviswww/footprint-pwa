import { weatherData, currentPosition } from '../store/signals';

let lastFetchTime = 0;
const FETCH_INTERVAL = 5 * 60 * 1000;

export async function fetchWeather() {
  const pos = currentPosition.value;
  if (!pos) return;

  const now = Date.now();
  if (now - lastFetchTime < FETCH_INTERVAL) return;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
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
    lastFetchTime = now;
  } catch (e) {
    // offline — keep existing data
  }
}

export function startWeatherPolling() {
  fetchWeather();
  return setInterval(fetchWeather, FETCH_INTERVAL);
}
