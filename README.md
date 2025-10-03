# EnvironmentReader 🌤️

### Feel the Weather

[cite_start]An immersive 3D weather application that brings real-time meteorological data to life with stunning animations and a premium user experience[cite: 1, 2]. EnvironmentReader goes beyond static numbers, allowing you to visualize and feel the weather conditions for any location worldwide.

[![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=environment-reader)](https://environmentreader.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📍 Live Demo

**Experience it live:** **[https://environmentreader.vercel.app/](https://environmentreader.vercel.app/)**

*(For the best experience, view on a desktop browser. The site is fully responsive for mobile devices as well.)*

---

## ✨ Key Features

* [cite_start]**Immersive 3D Weather Effects**: Realistic, full-screen animations for rain, snow, fog, thunderstorms, and wind that dynamically reflect the current conditions[cite: 1, 2, 3].
* [cite_start]**Dynamic Day/Night Cycle**: The background, sky gradients, and celestial bodies (sun, moon, stars) change based on the actual time of day and cloud coverage[cite: 1, 2, 3].
* **Accurate Global Forecasts**:
    * [cite_start]Real-time weather data[cite: 2].
    * [cite_start]Detailed 24-hour hourly forecast[cite: 1, 2].
    * [cite_start]Extended 7-day daily forecast[cite: 1, 2].
* [cite_start]**"Time Travel" Feature**: An interactive timeline lets you seamlessly navigate through past and future weather conditions, updating the entire UI to match[cite: 1, 2].
* [cite_start]**Advanced Location Search**: Pinpoint, street-level accuracy for any address, city, or landmark worldwide, powered by Geoapify and Nominatim[cite: 1, 2].
* [cite_start]**Actionable Insights**: Get helpful, generated advice based on conditions like UV index, wind speed, and visibility[cite: 1, 2].
* [cite_start]**Automatic & GPS Location**: Automatically detects your location via IP and offers precise GPS-based weather with user permission[cite: 2].
* **Personalization**:
    * [cite_start]Toggle temperature units between Celsius (°C) and Fahrenheit (°F)[cite: 1, 2].
    * [cite_start]Switch between a sleek Dark Mode and a vibrant Light Mode[cite: 1, 2, 3].

---

## 🛠️ Tech Stack

[cite_start]This project was built from the ground up using vanilla web technologies, with a focus on performance and maintainability without relying on external frameworks[cite: 52, 53, 54].

* **Frontend**:
    * [cite_start]HTML5 [cite: 20]
    * [cite_start]CSS3 (Advanced Animations, Responsive Design) [cite: 21]
    * [cite_start]JavaScript (ES6+, Async/Await) [cite: 22]

* **APIs**:
    * [cite_start]**Weather Data**: Open-Meteo API [cite: 1]
    * [cite_start]**Geocoding & Search**: Geoapify API & Nominatim [cite: 1, 2]
    * [cite_start]**IP Geolocation**: ipapi.co & ip-api.com [cite: 1, 2]

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need a free API key from [Geoapify](https://www.geoapify.com/) to enable the location search functionality.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/DMHACKERZ/EnvironmentReader.git](https://github.com/DMHACKERZ/EnvironmentReader.git)
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd EnvironmentReader
    ```

3.  **Configure your API Key:**
    * [cite_start]The application looks for a variable named `API_KEY` in `app.js` for the Geoapify service[cite: 2]. [cite_start]In the `app.js` file, find the line[cite: 2]:
        ```javascript
        const apiKey = API_KEY; 
        ```
    * Replace `API_KEY` with your actual Geoapify API key string:
        ```javascript
        const apiKey = "YOUR_GEOAPIFY_API_KEY_HERE";
        ```

4.  **Run the application:**
    * Simply open the `index.html` file in your web browser.
    * For the best experience (to avoid any potential CORS issues with local files), use a live server. If you are using VS Code, the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension is a great option.

---

## 📂 Project Structure

The project maintains a clean and simple structure for easy maintenance:
EnvironmentReader/
├── 📄 index.html      # Main application page and HTML structure
├── 🎨 style.css       # All styles, animations, and responsive design
└── ⚙️ app.js          # Core application logic, API handling, and DOM manipulation
---

## 📜 License

Distributed under the MIT License. This project is free to be used for personal, non-commercial purposes.

---

## 📞 Contact

**Debraj Mistry**

* [cite_start]**Portfolio**: [dm-portfolio17.vercel.app](https://dm-portfolio17.vercel.app) [cite: 1]
* [cite_start]**Email**: [debrajmistryofficial@gmail.com](mailto:debrajmistryofficial@gmail.com) [cite: 1]
* [cite_start]**Project Link**: [https://github.com/DMHACKERZ/EnvironmentReader](https://github.com/DMHACKERZ/EnvironmentReader) [cite: 1]
