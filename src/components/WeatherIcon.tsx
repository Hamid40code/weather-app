import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun,
  Cloudy, Leaf, Meh, Moon, ShieldAlert, Snowflake, Smile, Sparkles, Sun, Wind,
} from 'lucide-react'
import type { AirQualityIcon, WeatherIconName } from '../lib/weather'

const weatherIcons = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  cloudy: Cloudy,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
  moon: Moon,
  sparkles: Sparkles,
  wind: Wind,
}

const airIcons = {
  leaf: Leaf,
  smile: Smile,
  meh: Meh,
  'cloud-fog': CloudFog,
  'shield-alert': ShieldAlert,
}

export default function WeatherIcon({
  name,
  size = 24,
  className,
}: {
  name: WeatherIconName | AirQualityIcon
  size?: number
  className?: string
}) {
  const Icon = name in weatherIcons
    ? weatherIcons[name as WeatherIconName]
    : airIcons[name as AirQualityIcon]

  return <Icon size={size} strokeWidth={1.7} className={className} aria-hidden="true" />
}
