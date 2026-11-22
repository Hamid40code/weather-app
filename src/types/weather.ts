export interface GeoLocation {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  country_code: string
  admin1?: string
  timezone: string
}

export interface CurrentWeather {
  time: string
  interval: number
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  is_day: number
  precipitation: number
  rain: number
  showers: number
  snowfall: number
  weather_code: number
  wind_speed_10m: number
}

export interface WeatherResponse {
  current: CurrentWeather
  timezone: string
  timezone_abbreviation: string
}

export interface AirQualityResponse {
  timezone: string
  current?: {
    time: string
    european_aqi?: number
    us_aqi?: number
  }
  hourly: {
    time: string[]
    european_aqi: Array<number | null>
    pm2_5: Array<number | null>
  }
}

export type AirQualityLevel =
  | 'Good'
  | 'Fair'
  | 'Moderate'
  | 'Poor'
  | 'Very poor'
  | 'Extremely poor'

export interface AirQualityDay {
  value: number | null
  level: AirQualityLevel | 'Unavailable'
}

export type Continent =
  | 'asia'
  | 'europe'
  | 'africa'
  | 'north-america'
  | 'south-america'
  | 'oceania'
  | 'antarctica'
