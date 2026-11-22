import type { CSSProperties } from 'react'

interface WeatherBackgroundProps {
  icons: string[]
}

const positions = [
  { left: '4%', top: '11%', duration: '26s', delay: '-4s', size: '2.1rem', sway: '-3deg' },
  { left: '18%', top: '70%', duration: '31s', delay: '-17s', size: '1.6rem', sway: '4deg' },
  { left: '31%', top: '22%', duration: '28s', delay: '-12s', size: '2.5rem', sway: '2deg' },
  { left: '48%', top: '83%', duration: '33s', delay: '-21s', size: '1.7rem', sway: '-4deg' },
  { left: '64%', top: '13%', duration: '29s', delay: '-7s', size: '2rem', sway: '3deg' },
  { left: '79%', top: '67%', duration: '35s', delay: '-26s', size: '2.3rem', sway: '-2deg' },
  { left: '91%', top: '31%', duration: '30s', delay: '-15s', size: '1.5rem', sway: '5deg' },
  { left: '7%', top: '48%', duration: '38s', delay: '-31s', size: '1.4rem', sway: '2deg' },
  { left: '57%', top: '49%', duration: '34s', delay: '-24s', size: '1.8rem', sway: '-3deg' },
]

export default function WeatherBackground({ icons }: WeatherBackgroundProps) {
  return (
    <div className="weather-background" aria-hidden="true">
      <div className="weather-glow weather-glow-one" />
      <div className="weather-glow weather-glow-two" />
      {positions.map((position, index) => (
        <span
          className="weather-particle"
          key={`${position.left}-${index}`}
          style={{
            left: position.left,
            top: position.top,
            animationDuration: position.duration,
            animationDelay: position.delay,
            fontSize: position.size,
            '--sway': position.sway,
          } as CSSProperties}
        >
          {icons[index % icons.length] ?? '☁️'}
        </span>
      ))}
    </div>
  )
}
