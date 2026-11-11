import { useQuery } from '@tanstack/react-query';
import { tx } from '@/lib/i18n';
import { SERVICES } from '@/constants/app.constants';

/**
 * Current weather from Open-Meteo (free, no API key). Cached 30 minutes per
 * ~1 km cell so moving around does not trigger new requests.
 */
export type Weather = {
  temperature: number;
  humidity: number;
  wind: number;
  visibility: number | null;
  uv: number | null;
  code: number;
  isDay: boolean;
};

const DESCRIPTIONS: Record<number, string> = {
  0: tx('Clear sky'),
  1: tx('Mainly clear'),
  2: tx('Partly cloudy'),
  3: tx('Overcast'),
  45: tx('Fog'),
  48: tx('Freezing fog'),
  51: tx('Light drizzle'),
  53: tx('Drizzle'),
  55: tx('Heavy drizzle'),
  61: tx('Light rain'),
  63: tx('Rain'),
  65: tx('Heavy rain'),
  71: tx('Light snow'),
  73: tx('Snow'),
  75: tx('Heavy snow'),
  80: tx('Rain showers'),
  81: tx('Rain showers'),
  82: tx('Violent showers'),
  95: tx('Thunderstorm'),
  96: tx('Thunderstorm with hail'),
  99: tx('Thunderstorm with hail'),
};

export function describeWeather(code: number) {
  return DESCRIPTIONS[code] ?? 'Weather';
}

export async function fetchWeather(lat: number, lng: number): Promise<Weather> {
  const url =
    `${SERVICES.weather}?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility,uv_index,weather_code,is_day&timezone=auto';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Weather unavailable');
  const json = await res.json();
  const c = json?.current;
  if (!c) throw new Error('Weather unavailable');
  return {
    temperature: c.temperature_2m,
    humidity: c.relative_humidity_2m,
    wind: c.wind_speed_10m,
    visibility: typeof c.visibility === 'number' ? c.visibility : null,
    uv: typeof c.uv_index === 'number' ? c.uv_index : null,
    code: c.weather_code,
    isDay: c.is_day === 1,
  };
}

export function useWeather(point: { latitude: number; longitude: number } | null | undefined) {
  const lat = point ? Math.round(point.latitude * 100) / 100 : null;
  const lng = point ? Math.round(point.longitude * 100) / 100 : null;
  return useQuery({
    queryKey: ['weather', lat, lng],
    enabled: lat != null && lng != null,
    queryFn: () => fetchWeather(lat!, lng!),
    staleTime: 30 * 60_000,
    retry: 1,
  });
}
