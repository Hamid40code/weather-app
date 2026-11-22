import type {
  AirQualityDay,
  AirQualityLevel,
  AirQualityResponse,
  Continent,
  CurrentWeather,
  GeoLocation,
  WeatherResponse,
} from '../types/weather'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

async function requestJson<T>(url: URL): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Weather service returned an error (${response.status}). Please try again.`)
  }

  return (await response.json()) as T
}

export async function findCity(query: string): Promise<GeoLocation> {
  const url = new URL(GEOCODING_URL)
  url.search = new URLSearchParams({
    name: query.trim(),
    count: '1',
    language: 'en',
    format: 'json',
  }).toString()

  const data = await requestJson<{ results?: GeoLocation[] }>(url)
  const city = data.results?.[0]

  if (!city) {
    throw new Error(`We couldn't find “${query.trim()}”. Try another city name.`)
  }

  return city
}

export async function getCityWeather(latitude: number, longitude: number) {
  const common = {
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: 'auto',
  }

  const weatherUrl = new URL(WEATHER_URL)
  weatherUrl.search = new URLSearchParams({
    ...common,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'weather_code',
      'wind_speed_10m',
    ].join(','),
    forecast_days: '1',
  }).toString()

  const airUrl = new URL(AIR_QUALITY_URL)
  airUrl.search = new URLSearchParams({
    ...common,
    current: 'european_aqi,us_aqi',
    hourly: 'european_aqi,pm2_5',
    past_days: '1',
    forecast_days: '1',
  }).toString()

  const [weather, air] = await Promise.all([
    requestJson<WeatherResponse>(weatherUrl),
    requestJson<AirQualityResponse>(airUrl).catch(() => null),
  ])

  const todayAir = air
    ? getDailyAirQuality(air, weather.current.time.slice(0, 16), false)
    : { value: null, level: 'Unavailable' as const }
  const yesterdayAir = air
    ? getDailyAirQuality(air, weather.current.time.slice(0, 16), true)
    : { value: null, level: 'Unavailable' as const }

  // Fall back to the API's current AQI when an hourly series is unavailable.
  if (todayAir.value === null && typeof air?.current?.european_aqi === 'number') {
    todayAir.value = Math.round(air.current.european_aqi)
    todayAir.level = getAirQualityLevel(todayAir.value)
  }

  return {
    current: weather.current,
    timezone: weather.timezone,
    timezoneAbbreviation: weather.timezone_abbreviation,
    todayAir,
    yesterdayAir,
  }
}

function dateOffset(date: string, amount: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(Date.UTC(year, month - 1, day + amount))
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, '0'),
    String(value.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function getDailyAirQuality(
  data: AirQualityResponse,
  currentLocalTime: string,
  yesterday: boolean,
): AirQualityDay {
  const today = currentLocalTime.slice(0, 10)
  const targetDate = yesterday ? dateOffset(today, -1) : today
  const values = data.hourly.time.reduce<number[]>((collected, timestamp, index) => {
    const value = data.hourly.european_aqi[index]
    const isTargetDay = timestamp.startsWith(targetDate)
    const hasHappened = yesterday || timestamp.slice(0, 16) <= currentLocalTime

    if (isTargetDay && hasHappened && typeof value === 'number' && Number.isFinite(value)) {
      collected.push(value)
    }

    return collected
  }, [])

  if (values.length === 0) {
    return { value: null, level: 'Unavailable' }
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  const rounded = Math.round(average)
  return { value: rounded, level: getAirQualityLevel(rounded) }
}

export function getAirQualityLevel(value: number): AirQualityLevel {
  if (value < 20) return 'Good'
  if (value < 40) return 'Fair'
  if (value < 60) return 'Moderate'
  if (value < 80) return 'Poor'
  if (value <= 100) return 'Very poor'
  return 'Extremely poor'
}

export function getAirEmoji(level: AirQualityDay['level']): string {
  switch (level) {
    case 'Good':
      return '🌿'
    case 'Fair':
      return '🙂'
    case 'Moderate':
      return '😐'
    case 'Poor':
      return '🌫️'
    case 'Very poor':
      return '😷'
    case 'Extremely poor':
      return '🫧'
    default:
      return '🍃'
  }
}

export function getWeatherDescription(code: number): { label: string; emoji: string; particles: string[] } {
  if (code === 0) return { label: 'Clear sky', emoji: '☀️', particles: ['☀️', '✨', '🌤️', '☁️'] }
  if (code === 1) return { label: 'Mainly clear', emoji: '🌤️', particles: ['🌤️', '☀️', '☁️', '✨'] }
  if (code === 2) return { label: 'Partly cloudy', emoji: '⛅', particles: ['⛅', '☁️', '🌤️', '✨'] }
  if (code === 3) return { label: 'Overcast', emoji: '☁️', particles: ['☁️', '🌥️', '☁️', '💨'] }
  if (code === 45 || code === 48) return { label: 'Foggy', emoji: '🌫️', particles: ['🌫️', '☁️', '💨', '🌥️'] }
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', emoji: '🌦️', particles: ['🌦️', '💧', '☁️', '🌧️'] }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rainy', emoji: '🌧️', particles: ['🌧️', '💧', '☁️', '🌦️'] }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snowy', emoji: '❄️', particles: ['❄️', '🌨️', '☁️', '✨'] }
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', emoji: '⛈️', particles: ['⛈️', '🌧️', '⚡', '☁️'] }
  return { label: 'Changing conditions', emoji: '🌤️', particles: ['🌤️', '☁️', '✨', '💨'] }
}

export function getWeatherDetails(current: CurrentWeather) {
  const description = getWeatherDescription(current.weather_code)
  if (current.is_day === 0 && current.weather_code === 0) {
    return { ...description, emoji: '🌙', label: 'Clear night', particles: ['🌙', '✨', '☁️', '⭐'] }
  }
  return description
}

const CONTINENT_COUNTRIES: Record<Continent, string[]> = {
  asia: [
    'AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'IN', 'ID', 'IR', 'IQ',
    'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM',
    'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM',
    'AE', 'UZ', 'VN', 'YE',
  ],
  europe: [
    'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IS', 'IE', 'IT', 'XK', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK',
    'NO', 'PL', 'PT', 'RO', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA',
  ],
  africa: [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ',
    'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG',
    'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO',
    'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
  ],
  'north-america': [
    'AG', 'BS', 'BB', 'BZ', 'CA', 'CR', 'CU', 'DM', 'DO', 'SV', 'GD', 'GT', 'HT', 'HN', 'JM',
    'MX', 'NI', 'PA', 'KN', 'LC', 'VC', 'TT', 'US', 'GL', 'PM', 'BM',
  ],
  'south-america': ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],
  oceania: ['AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU'],
  antarctica: ['AQ'],
}

export function getContinent(countryCode: string, longitude: number): Continent {
  if (countryCode === 'RU') return longitude < 60 ? 'europe' : 'asia'

  for (const [continent, countries] of Object.entries(CONTINENT_COUNTRIES) as [Continent, string[]][]) {
    if (countries.includes(countryCode.toUpperCase())) return continent
  }

  return 'europe'
}

export function formatLocation(city: GeoLocation): string {
  return [city.admin1, city.country].filter(Boolean).join(', ')
}

export function getTemperature(value: number): string {
  return `${Math.round(value)}°`
}
