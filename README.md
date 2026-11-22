# Atmos — Weather App

A responsive city weather dashboard built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS 4**. The interface follows the uploaded sketch: city search at the top, a large current-weather emoji, city/condition/temperature/humidity details, and a lower air-quality section with today's and yesterday's readings.

## Features

- Search for cities around the world using live geocoding.
- Show current temperature, feels-like temperature, weather condition, humidity, wind speed, and local time.
- Show today's average European Air Quality Index (AQI) so far and yesterday's daily average.
- Change the soft background palette based on the searched city's continent.
- Animate weather emojis along gently curved diagonal paths in the background.
- Responsive layout, keyboard-accessible search, clear loading/error feedback, and reduced-motion support.
- No API key or backend required for normal, non-commercial use.

## Run locally

Use Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The default city is Baku. Search for another city in the field at the top of the card.

## Production build

```bash
npm run build
npm run preview
```

## Data sources and attribution

This project uses the public Open-Meteo APIs:

- [Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — city name and coordinates.
- [Weather Forecast API](https://open-meteo.com/en/docs) — current weather, temperature, humidity, and wind.
- [Air Quality API](https://open-meteo.com/en/docs/air-quality-api) — European AQI readings.

The AQI display uses the European AQI scale described in the Open-Meteo documentation. Today's value is an average of available hourly readings up to the current local time. Yesterday's value is an average of the available hourly readings for the previous local calendar day. These are modelled estimates, not measurements from a street-level sensor. Air-quality model coverage and update frequency vary by region.

Please keep the Open-Meteo attribution visible when adapting this project. Review [Open-Meteo's usage terms](https://open-meteo.com/en/pricing) before deploying the app commercially.

## Project structure

```text
weather-app/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── src/
    ├── components/
    │   └── WeatherBackground.tsx
    ├── lib/
    │   └── weather.ts
    ├── types/
    │   └── weather.ts
    ├── App.tsx
    ├── index.css
    └── main.tsx
```

## Upload to GitHub (Windows PowerShell)

1. Create a **new empty repository** on GitHub. Do not initialize it with a README, license, or `.gitignore` because this project already contains those files.
2. Open PowerShell in this project folder (the folder containing `package.json`).
3. Run:

   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\Upload-To-GitHub.ps1
   ```

4. Paste the GitHub repository URL when prompted, for example `https://github.com/your-username/atmos-weather-app.git`.
5. If GitHub asks you to authenticate, complete the browser sign-in or use your configured Git Credential Manager / SSH key. Never put a password or personal access token directly in the script.

The script initializes Git if needed, checks whether an `origin` remote exists before querying it, adds `origin` when it is missing, uses the `main` branch, stages the project while respecting `.gitignore`, creates a commit when there are changes, and pushes to `origin`. It never force-pushes. If the remote repository already has its own commits, resolve that history mismatch before retrying.