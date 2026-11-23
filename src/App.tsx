import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Droplets, MapPin, Search, Wind } from 'lucide-react'
import WeatherBackground from './components/WeatherBackground'
import WeatherIcon from './components/WeatherIcon'
import {
  findCity,
  formatLocation,
  getAirIcon,
  getCityWeather,
  getContinent,
  getTemperature,
  getWeatherDetails,
} from './lib/weather'
import type { AirQualityDay, Continent, GeoLocation } from './types/weather'

type WeatherData = Awaited<ReturnType<typeof getCityWeather>>
type SearchStatus = 'idle' | 'loading' | 'error'

const DEFAULT_CITY = 'Baku'

function App() {
  const [query, setQuery] = useState(DEFAULT_CITY)
  const [city, setCity] = useState<GeoLocation | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [status, setStatus] = useState<SearchStatus>('loading')
  const [error, setError] = useState('')

  const continent: Continent = city ? getContinent(city.country_code, city.longitude) : 'asia'
  const weatherDetails = weather ? getWeatherDetails(weather.current) : null
  const backgroundIcons = useMemo(
    () => weatherDetails?.particles ?? ['sun', 'cloud', 'cloud-rain', 'sparkles'],
    [weatherDetails],
  )

  async function loadCity(cityName: string) {
    const trimmed = cityName.trim()
    if (!trimmed) {
      setError('Enter a city name to see its weather.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const nextCity = await findCity(trimmed)
      const nextWeather = await getCityWeather(nextCity.latitude, nextCity.longitude)
      setCity(nextCity)
      setWeather(nextWeather)
      setQuery(nextCity.name)
      setStatus('idle')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  useEffect(() => {
    void loadCity(DEFAULT_CITY)
    // Load the default city once when the app opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadCity(query)
  }

  const updatedTime = weather
    ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: weather.timezone }).format(new Date())
    : null

  return (
    <main className={`app-shell relative isolate min-h-screen continent-${continent}`}>
      <WeatherBackground icons={backgroundIcons} />
      {status === 'loading' && (
        <div className="loading-screen" role="status" aria-live="polite" aria-label="Loading weather">
          <div className="loading-panel">
            <span className="loading-mark"><WeatherIcon name="cloud-sun" size={34} /></span>
            <span className="loading-spinner" aria-hidden="true" />
            <strong>{weather ? 'Updating the forecast' : 'Finding your weather'}</strong>
            <span className="loading-caption">Checking the sky for {query.trim() || 'your city'}…</span>
          </div>
        </div>
      )}
      <div className="page-wrap flex min-h-screen flex-col">
        <header className="topbar flex items-center justify-between">
          <a className="brand" href="#top" aria-label="Atmos home">
            <span className="brand-mark">a.</span>
            <span>atmos</span>
          </a>
          <div className="topbar-note">
            <span className="live-dot" />
            LIVE WEATHER AROUND THE WORLD
          </div>
        </header>

        <section className="hero-copy" id="top">
          <p className="eyebrow">A little closer to the sky</p>
          <h1>Feel the weather.</h1>
          <p className="hero-subtitle">A fresh look at the sky above any city.</p>
        </section>

        <section className="weather-card w-full overflow-hidden" aria-label="City weather dashboard" aria-busy={status === 'loading'}>
          <div className="card-top">
            <form className="search-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="city-search">Search for a city</label>
              <MapPin size={18} strokeWidth={1.8} aria-hidden="true" />
              <input
                id="city-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter a city..."
                autoComplete="off"
                spellCheck={false}
              />
              <button className="search-button" type="submit" aria-label="Search city" disabled={status === 'loading'}>
                <Search size={19} strokeWidth={2.2} />
              </button>
            </form>

            {status === 'error' && <p className="error-message" role="alert">{error}</p>}

            <div className="weather-main">
              <div className="weather-icon-orb">
                <span className="weather-main-icon"><WeatherIcon name={weatherDetails?.icon ?? 'cloud-sun'} size={76} /></span>
              </div>
              <div className="weather-heading">
                <p className="location-label">CURRENT WEATHER</p>
                <h2>{city?.name ?? (status === 'loading' ? 'Finding your city…' : 'Your city')}</h2>
                <p className="location-country">{city ? formatLocation(city) : 'Search for a place to begin'}</p>
                <div className="condition-chip">
                  <span className="condition-dot" />
                  {weatherDetails?.label ?? 'Live conditions'}
                </div>
              </div>
              <div className="temperature-block">
                <span className="temperature-value">
                  {weather ? getTemperature(weather.current.temperature_2m) : '—'}
                </span>
                <span className="temperature-caption">Feels like {weather ? getTemperature(weather.current.apparent_temperature) : '—'}</span>
              </div>
            </div>

            <div className="weather-stats">
              <WeatherStat
                icon={<Droplets size={19} strokeWidth={1.8} />}
                label="Humidity"
                value={weather ? `${weather.current.relative_humidity_2m}%` : '—'}
              />
              <div className="stat-divider" />
              <WeatherStat
                icon={<Wind size={19} strokeWidth={1.8} />}
                label="Wind speed"
                value={weather ? `${Math.round(weather.current.wind_speed_10m)} km/h` : '—'}
              />
              <div className="stat-divider" />
              <WeatherStat
                icon={<WeatherIcon name="sun" size={16} />}
                label="Local time"
                value={updatedTime ?? '—'}
              />
            </div>
          </div>

          <div className="card-bottom">
            <div className="air-copy">
              <div className="section-kicker">BREATHE EASY</div>
              <h3>Air quality</h3>
              <p className="air-description">A quick look at the air around {city?.name ?? 'your city'}.</p>
              <div className="air-readings">
                <AirReading label="TODAY · AVG SO FAR" day={weather?.todayAir} />
                <AirReading label="YESTERDAY · DAILY AVG" day={weather?.yesterdayAir} previous />
              </div>
            </div>
            <div className="air-orb-wrap">
              <div className="air-orb">
                <span className="air-main-icon"><WeatherIcon name={getAirIcon(weather?.todayAir.level ?? 'Unavailable')} size={34} /></span>
              </div>
              <span className="air-orb-label">{weather?.todayAir.level ?? 'Loading'}</span>
              <span className="aqi-caption">EUROPEAN AQI</span>
            </div>
          </div>

          <div className="card-footer">
            <span>{city ? `${city.name}, ${city.country}` : 'Global weather'}</span>
            <span>Weather & air data by Open-Meteo</span>
          </div>
        </section>

        <footer className="page-footer">
          <span>Take a moment. Look up.</span>
          <span>Designed for wherever you are <WeatherIcon name="sparkles" size={14} /></span>
        </footer>
      </div>
    </main>
  )
}

function WeatherStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="weather-stat">
      <span className="stat-icon">{icon}</span>
      <div>
        <span className="stat-label">{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function AirReading({
  label,
  day,
  previous = false,
}: {
  label: string
  day?: AirQualityDay
  previous?: boolean
}) {
  const value = day?.value
  const unavailable = value === null || value === undefined

  return (
    <div className="air-reading">
      <span className="air-reading-icon" aria-hidden="true">
        {previous ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
      </span>
      <div className="air-reading-copy">
        <span className="air-reading-label">{label}</span>
        <strong>{unavailable ? 'No data available' : `${value} · ${day?.level ?? 'AQI'}`}</strong>
      </div>
    </div>
  )
}

export default App
