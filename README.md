# EnvironmentReader 🌤️
### Feel the Weather
EnvironmentReader is an immersive 3D weather application that transforms real-time meteorological data into stunning animations, giving you an interactive and engaging way to experience weather conditions worldwide.

[![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=environment-reader)](https://environmentreader.vercel.app/)  
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📍 Live Demo
👉 **Try it here:** https://environmentreader.vercel.app/  
*(For the best experience, use a desktop browser. Fully responsive on mobile as well.)*

---

## ✨ Key Features
- **Immersive 3D Weather Effects** – Rain, snow, fog, thunderstorms, and wind animations that reflect real conditions.
- **Dynamic Day/Night Cycle** – Sky gradients, sun, moon, and stars update with actual time.
- **Accurate Global Forecasts** – Real-time weather, 24-hour hourly forecast, and 7-day daily forecast.
- **"Time Travel" Mode** – Explore past and future weather conditions with an interactive timeline.
- **Advanced Location Search** – Street-level accuracy with Geoapify & Nominatim.
- **Actionable Insights** – Get advice based on UV index, wind speed, and visibility.
- **Automatic & GPS Detection** – Uses IP and optional GPS to find your location.
- **Personalization** – Switch between Celsius/°F and Light/Dark themes.

---

## 🛠️ Tech Stack
**Frontend**  
- HTML5  
- CSS3 (Animations, Responsive Design)  
- JavaScript (ES6+, Async/Await)

**APIs**  
- Weather Data: Open-Meteo (https://open-meteo.com/)  
- Geocoding & Search: Geoapify (https://www.geoapify.com/) & Nominatim (https://nominatim.org/)  
- IP Geolocation: ipapi.co (https://ipapi.co/) & ip-api.com (https://ip-api.com/)

---

## 🚀 Getting Started
### Prerequisites
- A free API key from Geoapify (https://www.geoapify.com/) (for location search).

### Installation
1. Clone the repository
    git clone https://github.com/DMHACKERZ/EnvironmentReader.git

2. Navigate to the project folder
    cd EnvironmentReader

3. Configure your API Key  
   Open app.js and replace the placeholder with your Geoapify API key (example shown):
    const apiKey = "YOUR_GEOAPIFY_API_KEY_HERE";

4. Run the app  
   - Open index.html in a browser, or  
   - Use a live server (recommended to avoid CORS issues).

---

## 📂 Project Structure
    EnvironmentReader/
    ├── index.html      # Main application page
    ├── style.css       # Styles, animations, responsive design
    └── app.js          # Core logic, API calls, DOM handling

---

## 📜 License
This project is licensed under the **MIT License** — free for personal and commercial use.  
See LICENSE or https://opensource.org/licenses/MIT for details.

---

## 📞 Contact
**Debraj Mistry**  
Portfolio: https://dm-portfolio17.vercel.app  
Email: debrajmistryofficial@gmail.com  
GitHub Repo: https://github.com/DMHACKERZ/EnvironmentReader
