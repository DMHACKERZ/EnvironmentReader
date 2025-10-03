//Class Definition
class EnvironmentReader {
  constructor() {
    // Core state
    this.currentLocation = null;
    this.weatherData = null;
    this.detectedCountryCode = null;

    // Selection state (full context switching across date/hour)
    this.selectedHourIndex = 0;
    this.selectedDayIndex = 0;
    this.selectedDate = null;
    this.calendarDate = new Date();

    // UX state
    this.theme = this.getStoredTheme();
    this.soundEnabled = this.getStoredSoundSetting();
    this.isLoading = false;
    this.locationPermissionRequested = false;
    this.hasGPSLocation = false;
    this.tempUnit = this.getStoredTempUnit();

    // Search state
    this.searchTimeout = null;
    this.searchSuggestionTimeout = null;
    this.selectedSuggestionIndex = -1;
    

    // Effect timers
    this.rainInterval = null;
    this.lightningInterval = null;
    this.thunderInterval = null;

    // Performance/particles
    this.activeAnimations = new Set();
    this.particlePools = { raindrops: [], snowflakes: [], windParticles: [] };
    this.intersectionObserver = null;

    // Cache
    this.cache = {
      weatherData: null,
      locationData: null,
      timestamp: 0,
      searchResults: new Map()
    };

    // Weather code mapping 
    this.weatherCodes = {
      0:  { icon: "☀️", desc: "Clear sky",                      bg: "clear",         effects: ["sun-rays"],                     sunVisible: true },
      1:  { icon: "🌤️", desc: "Mainly clear",                  bg: "clear",         effects: ["sun-rays"],                     sunVisible: true },
      2:  { icon: "⛅",  desc: "Partly cloudy",                 bg: "partly-cloudy", effects: ["moving-clouds"],                 sunVisible: "intermittent" },
      3:  { icon: "☁️",  desc: "Overcast",                      bg: "cloudy",        effects: ["dense-clouds"],                 sunVisible: false },
      45: { icon: "🌫️", desc: "Fog",                           bg: "foggy",         effects: ["fog"],                           sunVisible: "dimmed" },
      48: { icon: "🌫️", desc: "Depositing rime fog",           bg: "foggy",         effects: ["fog","frost"],                  sunVisible: "dimmed" },
      51: { icon: "🌦️", desc: "Light drizzle",                 bg: "rainy",         effects: ["moderate-rain"],                   sunVisible: false },
      53: { icon: "🌦️", desc: "Moderate drizzle",              bg: "rainy",         effects: ["moderate-rain"],                sunVisible: false },
      55: { icon: "🌧️", desc: "Dense drizzle",                 bg: "rainy",         effects: ["heavy-rain"],                   sunVisible: false },
      56: { icon: "🌧️", desc: "Light freezing drizzle",        bg: "snowy",         effects: ["light-snow","frost"],           sunVisible: "dimmed" },
      57: { icon: "🌨️", desc: "Dense freezing drizzle",        bg: "snowy",         effects: ["heavy-snow","frost"],           sunVisible: false },
      61: { icon: "🌦️", desc: "Slight rain",                   bg: "rainy",         effects: ["moderate-rain"],                   sunVisible: false },
      63: { icon: "🌧️", desc: "Moderate rain",                 bg: "rainy",         effects: ["moderate-rain"],                sunVisible: false },
      65: { icon: "🌧️", desc: "Heavy rain",                    bg: "rainy",         effects: ["heavy-rain"],                   sunVisible: false },
      66: { icon: "🌨️", desc: "Light freezing rain",           bg: "snowy",         effects: ["light-snow","frost"],           sunVisible: false },
      67: { icon: "❄️",  desc: "Heavy freezing rain",          bg: "snowy",         effects: ["heavy-snow","frost"],           sunVisible: false },
      71: { icon: "🌨️", desc: "Slight snow",                   bg: "snowy",         effects: ["light-snow"],                   sunVisible: "dimmed" },
      73: { icon: "🌨️", desc: "Moderate snow",                 bg: "snowy",         effects: ["moderate-snow"],                sunVisible: false },
      75: { icon: "❄️",  desc: "Heavy snow",                   bg: "snowy",         effects: ["heavy-snow"],                   sunVisible: false },
      77: { icon: "❄️",  desc: "Snow grains",                  bg: "snowy",         effects: ["moderate-snow"],                sunVisible: false },
      80: { icon: "🌦️", desc: "Slight rain showers",           bg: "rainy",         effects: ["moderate-rain"],                   sunVisible: false },
      81: { icon: "🌧️", desc: "Moderate rain showers",         bg: "rainy",         effects: ["moderate-rain"],                sunVisible: false },
      82: { icon: "⛈️",  desc: "Violent rain showers",          bg: "rainy",         effects: ["heavy-rain"],                   sunVisible: false },
      85: { icon: "🌨️", desc: "Slight snow showers",           bg: "snowy",         effects: ["light-snow"],                   sunVisible: "dimmed" },
      86: { icon: "❄️",  desc: "Heavy snow showers",           bg: "snowy",         effects: ["heavy-snow"],                   sunVisible: false },
      95: { icon: "⛈️",  desc: "Thunderstorm",                 bg: "thunderstorm",  effects: ["heavy-rain","lightning","thunder","stormy-rain"], sunVisible: false },
      96: { icon: "⛈️",  desc: "Thunderstorm slight hail",     bg: "thunderstorm",  effects: ["heavy-rain","lightning","thunder","stormy-rain"], sunVisible: false },
      99: { icon: "⛈️",  desc: "Thunderstorm heavy hail",      bg: "thunderstorm",  effects: ["heavy-rain","lightning","thunder","stormy-rain"], sunVisible: false }
    };
  }

  //Init
  async init() {
    console.log("Initializing EnvironmentReader.....");
    this.applyTheme();
    this.bindEvents();
    this.updateTime();
    this.initializeParticlePools();
    this.setupIntersectionObserver();
    this.enableRequestIdleCallback();
    await this.detectLocationWithIPFirst();
    setInterval(() => this.updateTime(), 60000);
    setInterval(() => this.refreshWeatherData(), 600000);
    console.log("EnvironmentReader initialized.");
  }

  //Persistence
  getStoredTheme() {
    try {
      const stored = localStorage.getItem("environmentreader-theme");
      if (stored) return stored;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }
  getStoredSoundSetting() {
    try {
      const stored = localStorage.getItem("environmentreader-sound");
      if (stored != null) return stored !== "false";
    } catch {}
    return true;
  }
    getStoredTempUnit() {
    try {
      const stored = localStorage.getItem("environmentreader-temp-unit");
      if (stored === 'F' || stored === 'C') return stored;
    } catch {}
    return "C"; // Default to Celsius
  }

  //Theme/Sound
  applyTheme() {
    document.documentElement.setAttribute("data-color-scheme", this.theme);
    const icon = document.querySelector(".theme-icon");
    if (icon) icon.textContent = this.theme === "dark" ? "🌙" : "🌞";
  }

  //arrow function to bind `this`
  toggleTheme = () => {
    this.theme = this.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("environmentreader-theme", this.theme); } catch {}
    document.body.style.transition = "background-color 0.5s ease";
    this.applyTheme();
    setTimeout(() => (document.body.style.transition = ""), 500);
    // this.simulateHapticFeedback("light");
  };

  //arrow function to bind `this`
  // toggleSound = () => {
  //   this.soundEnabled = !this.soundEnabled;
  //   try { localStorage.setItem("environmentreader-sound", this.soundEnabled); } catch {}
  //   const icon = document.querySelector(".sound-icon");
  //   if (icon) icon.textContent = this.soundEnabled ? "🔊" : "🔇";
  //   if (!this.soundEnabled) this.stopAllSounds(); else this.updateSoundEffects();
  //   this.simulateHapticFeedback("medium");
  // };

  //Time/UI
  updateTime() {
    if (this.selectedDate) {
      return;
    }
    const now = new Date();
    const timeString = now.toLocaleString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
    const timeEl = document.getElementById("currentTime");
    if (timeEl) timeEl.textContent = timeString;
  }

  updateMainDateDisplay() {
    const timeEl = document.getElementById("currentTime");
    if (!timeEl || !this.weatherData?.hourly?.time) return;

    // Get the date and time for the currently selected hour
    const selectedTime = this.weatherData.hourly.time[this.selectedHourIndex];
    if (!selectedTime) return;

    const date = new Date(selectedTime);
    const timeString = date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
    
    // main display with the selected time
    timeEl.textContent = timeString;
  }

  //Events Binding
  bindEvents() {
    // Header controls
     document.getElementById("locationBtn")?.addEventListener("click", () => this.showLocationPermissionNotification(true));
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) themeToggle.addEventListener("click", this.toggleTheme);
    // const soundToggle = document.getElementById("soundToggle");
    // if (soundToggle) soundToggle.addEventListener("click", this.toggleSound);


    const tempUnitToggle = document.getElementById("tempUnitToggle");
    if (tempUnitToggle) {
        tempUnitToggle.textContent = `°${this.tempUnit}`;
        tempUnitToggle.addEventListener("click", this.toggleTempUnit);
    }

    // Logo as "Home"/Today
    const logo = document.getElementById("logoClick");
    if (logo) logo.addEventListener("click", this.goToCurrentWeather);

    // Search
    const searchInput = document.getElementById("locationSearch");
    const searchBtn = document.getElementById("searchBtn");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => this.handleSearchInput(e.target.value));
      searchInput.addEventListener("keydown", (e) => this.handleSearchKeydown(e));
      searchInput.addEventListener("blur", () => setTimeout(() => this.hideSearchSuggestions(), 200));
    }
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const q = searchInput ? searchInput.value : "";
        this.performSearch(q);
      });
    }

    // Time navigation
    const map = {
      prevDay: () => this.navigateDay(-1),
      prevHour: () => this.navigateHour(-1),
      nextHour: () => this.navigateHour(1),
      nextDay: () => this.navigateDay(1),
      backToToday: () => this.goToCurrentWeather()
    };
    Object.entries(map).forEach(([id, handler]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("click", handler);
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); }
        });
      }
    });

     // Calendar events
    document.getElementById("calendarToggleBtn")?.addEventListener("click", this.toggleCalendar);
    document.getElementById("prevMonthBtn")?.addEventListener("click", () => this.navigateCalendar(-1));
    document.getElementById("nextMonthBtn")?.addEventListener("click", () => this.navigateCalendar(1));
    document.getElementById("calendarGrid")?.addEventListener("click", this.handleCalendarDayClick);

    // Location permission bar
    const allow = document.getElementById("allowLocation");
    const dismiss = document.getElementById("dismissLocation");
    if (allow) allow.addEventListener("click", this.requestGPSPermission);
    if (dismiss) dismiss.addEventListener("click", this.dismissLocationNotification);

    // Modal close/backdrop and error actions
    this.bindModalEvents();

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleGlobalKeydown(e));

    // Touch gestures
    this.initializeEnhancedTouchGestures();

    // Online/visibility
    window.addEventListener("online", () => this.handleOnlineStatus(true));
    window.addEventListener("offline", () => this.handleOnlineStatus(false));
    window.addEventListener("visibilitychange", () => this.handleVisibilityChange());

    // Performance adaptation
    this.bindPerformanceEvents();
  }

  bindModalEvents() {
    const modalClose = document.getElementById("modalClose");
    const modalBackdrop = document.getElementById("modalBackdrop");
    const retryBtn = document.getElementById("retryBtn");
    const useDefaultBtn = document.getElementById("useDefaultBtn");

    if (modalClose) modalClose.addEventListener("click", () => this.closeModal("search"));
    if (modalBackdrop) modalBackdrop.addEventListener("click", () => this.closeModal("search"));
    if (retryBtn) retryBtn.addEventListener("click", () => this.detectLocationWithIPFirst());
    if (useDefaultBtn) useDefaultBtn.addEventListener("click", () => this.useDefaultLocation());

    // Footer link modals (about/privacy/terms/data/contact/help/credits)
    const footerLinks = document.querySelectorAll(".footer-link[data-modal]");
    footerLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const type = link.getAttribute("data-modal");
        this.openModal(type);
      });
    });

    const modalCloseButtons = document.querySelectorAll(".modal-close");
    modalCloseButtons.forEach((btn) => btn.addEventListener("click", () => this.closeAllModals()));
    const modalBackdrops = document.querySelectorAll(".modal-backdrop");
    modalBackdrops.forEach((bd) => bd.addEventListener("click", () => this.closeAllModals()));
  }

  toggleCalendar = () => {
    const container = document.getElementById("calendarContainer");
    if (container) {
      container.classList.toggle("hidden");
      if (!container.classList.contains("hidden")) {
        this.renderCalendar();
      }
    }
  };

  navigateCalendar = (monthOffset) => {
    this.calendarDate.setMonth(this.calendarDate.getMonth() + monthOffset);
    this.renderCalendar();
  };

  handleCalendarDayClick = (e) => {
    const target = e.target.closest(".calendar-day");
    if (target && !target.classList.contains("empty")) {
      const day = parseInt(target.dataset.day);
      const newDate = new Date(this.calendarDate);
      newDate.setDate(day);
      this.fetchDataForDate(newDate);
      this.toggleCalendar(); // Close calendar after selection
    }
  };

  renderCalendar = () => {
    const grid = document.getElementById("calendarGrid");
    const display = document.getElementById("monthYearDisplay");
    if (!grid || !display) return;

    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    
    display.textContent = this.calendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    grid.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        grid.insertAdjacentHTML("beforeend", `<div class="calendar-day empty"></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day";
        dayEl.textContent = day;
        dayEl.dataset.day = day;

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayEl.classList.add("today");
        }
        
        const selected = new Date(this.selectedDate);
        if (this.selectedDate && year === selected.getFullYear() && month === selected.getMonth() && day === selected.getDate()) {
            dayEl.classList.add("selected");
        }
        
        grid.appendChild(dayEl);
    }
  };

  toggleTempUnit = () => {
    this.tempUnit = this.tempUnit === "C" ? "F" : "C";
    try { localStorage.setItem("environmentreader-temp-unit", this.tempUnit); } catch {}
    
    const icon = document.getElementById("tempUnitToggle");
    if (icon) icon.textContent = `°${this.tempUnit}`;

    if (this.weatherData) {
        this.renderWeatherData(); // Re-render all data with the new unit
    }
    // this.simulateHapticFeedback("light");
  };

  formatTemperature(tempC) {
    if (tempC === null || typeof tempC === 'undefined') return '--°';
    let temp = tempC;
    if (this.tempUnit === 'F') {
      temp = (tempC * 9/5) + 32;
    }
    return `${Math.round(temp)}°`;
  }

  async fetchDataForDate(date) {
    if (!this.currentLocation) {
      this.showError("Cannot fetch data without a location.");
      return;
    }
    this.showLoading(`Fetching weather for ${date.toLocaleDateString()}`);

    try {
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.currentLocation.latitude}&longitude=${this.currentLocation.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility,uv_index` +
        `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,uv_index_max` +
        `&start_date=${formattedDate}&end_date=${formattedDate}` +
        `&timezone=auto`;
      
      const res = await this.fetchWithTimeout(url, 15000);
      if (!res.ok) throw new Error(`Weather API failed ${res.status}`);
      
      this.weatherData = await res.json();
      
      this.selectedDate = new Date(this.weatherData.daily.time[0]).toISOString().split('T')[0] + 'T00:00:00.000Z';
      this.selectedDayIndex = 0;
      this.selectedHourIndex = 12; // Default to noon for the selected day

      this.renderWeatherData();
      this.updateMainDateDisplay(); // Ensure main date display updates
      this.hideLoading();
    } catch (e) {
      console.error("Historical fetch failed", e);
      this.showError("Failed to fetch weather data for the selected date.");
    }
  }

  openModal(type) {
    this.closeAllModals();
    const map = {
      about: "aboutModal",
      privacy: "privacyModal",
      terms: "termsModal",
      data: "dataModal",
      contact: "contactModal",
      help: "helpModal",
      credits: "creditsModal",
      search: "searchModal"
    };
    const id = map[type];
    if (!id) return;
    const m = document.getElementById(id);
    if (m) {
      m.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
  }
  closeModal(type) {
    if (type === "search") {
      const modal = document.getElementById("searchModal");
      if (modal) modal.classList.add("hidden");
    } else {
      this.closeAllModals();
    }
    document.body.style.overflow = "";
  }
  closeAllModals() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((m) => m.classList.add("hidden"));
    document.body.style.overflow = "";
  }

  //Touch/Keyboard/Performance
  initializeEnhancedTouchGestures() {
    let sx = 0, sy = 0, st = 0;
    const main = document.getElementById("mainContent");
    if (!main) return;
    main.addEventListener("touchstart", (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      st = Date.now();
    }, { passive: true });
    main.addEventListener("touchend", (e) => {
      if (!sx && !sy) return;
      const ex = e.changedTouches[0].clientX;
      const ey = e.changedTouches[0].clientY;
      const dt = Date.now() - st;
      const dx = sx - ex;
      const dy = sy - ey;
      if (dt > 500 || (Math.abs(dx) < 50 && Math.abs(dy) < 50)) { sx = sy = st = 0; return; }
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) this.navigateHour(1); else this.navigateHour(-1);
        // this.simulateHapticFeedback("light");
      } else {
        if (dy > 0) this.navigateDay(1); else this.navigateDay(-1);
      }
      sx = sy = st = 0;
    }, { passive: true });
  }

  handleGlobalKeydown(e) {
    if (e.key === "Escape") { this.closeAllModals(); this.hideSearchSuggestions(); return; }
    const typing = e.target.matches("input, textarea, [contenteditable]");
    if (typing) {
      return;
    }
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); this.navigateHour(-1); break;
      case "ArrowRight": e.preventDefault(); this.navigateHour(1); break;
      case "ArrowUp": e.preventDefault(); this.navigateDay(-1); break;
      case "ArrowDown": e.preventDefault(); this.navigateDay(1); break;
      case "Home": e.preventDefault(); this.goToCurrentWeather(); break;
      case "/": e.preventDefault(); this.focusSearch(); break;
      case "r": if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.refreshWeatherData(); } break;
    }
  }

  bindPerformanceEvents() {
    const connection = navigator.connection;
    if (connection) {
      this.adjustQualityForConnection(connection.effectiveType);
      connection.addEventListener("change", () => this.adjustQualityForConnection(connection.effectiveType));
    }
    if ("PerformanceObserver" in window) {
      const perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 100) console.warn("Slow operation:", entry.name, entry.duration, "ms");
        });
      });
      perfObserver.observe({ entryTypes: ["measure", "navigation"] });
    }
  }
  adjustQualityForConnection(type) {
    const slow = type === "slow-2g" || type === "2g";
    if (slow) this.reduceAnimationQuality(); else this.restoreAnimationQuality();
  }
  reduceAnimationQuality() { document.body.classList.add("reduced-animations"); }
  restoreAnimationQuality() { document.body.classList.remove("reduced-animations"); }

  //Intersection/Particles
  initializeParticlePools() {
    const max = 50;
    ["raindrops", "snowflakes", "windParticles"].forEach((key) => {
      for (let i = 0; i < max; i++) {
        const el = document.createElement("div");
        el.style.display = "none";
        this.particlePools[key].push(el);
      }
    });
  }
  setupIntersectionObserver() {
    if (!("IntersectionObserver" in window)) return;
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const anims = entry.target.getAnimations?.() || [];
        anims.forEach((a) => entry.isIntersecting ? a.play() : a.pause());
      });
    });
  }
  scheduleIdleTasks = () => {
    this.cleanupUnusedParticles();
    this.optimizeMemoryUsage();
    this.enableRequestIdleCallback();
  };
  enableRequestIdleCallback() {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => this.scheduleIdleTasks());
    }
  }
  cleanupUnusedParticles() {
    ["precipitationLayer", "windLayer", "atmosphericEffects"].forEach((id) => {
      const layer = document.getElementById(id);
      if (!layer) return;
      Array.from(layer.children).forEach((child) => {
        const rect = child.getBoundingClientRect?.();
        if (!rect) return;
        if (rect.top > window.innerHeight + 100 || rect.bottom < -100) child.remove();
      });
    });
  }
  optimizeMemoryUsage() {
    const now = Date.now();
    const age = now - (this.cache.timestamp || 0);
    if (age > 30 * 60 * 1000) this.cache.searchResults.clear();
    if (this.cache.searchResults.size > 50) {
      const entries = Array.from(this.cache.searchResults.entries());
      entries.slice(0, 25).forEach(([k]) => this.cache.searchResults.delete(k));
    }
  }

  //Search (Nominatim + Open‑Meteo)
  focusSearch() {
    const input = document.getElementById("locationSearch");
    if (input) { input.focus(); input.select(); }
  }
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  handleSearchKeydown(e) {
    const container = document.getElementById("searchSuggestions");
    const suggestions = container ? container.querySelectorAll(".search-suggestion-item") : [];
    if (!container || container.classList.contains("hidden")) {
      if (e.key === "Enter") { e.preventDefault(); this.performSearch(e.target.value); }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
        this.updateSuggestionSelection(suggestions);
        break;
      case "ArrowUp":
        e.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        this.updateSuggestionSelection(suggestions);
        break;
      case "Enter":
        e.preventDefault();
        if (this.selectedSuggestionIndex >= 0 && suggestions[this.selectedSuggestionIndex]) {
          suggestions[this.selectedSuggestionIndex].click();
        } else {
          this.performSearch(e.target.value);
        }
        break;
      case "Escape":
        this.hideSearchSuggestions();
        e.target.blur();
        break;
    }
  }
  updateSuggestionSelection(suggestions) {
    suggestions.forEach((el, idx) => el.classList.toggle("selected", idx === this.selectedSuggestionIndex));
  }
  async handleSearchInput(query) {
    if (this.searchSuggestionTimeout) clearTimeout(this.searchSuggestionTimeout);

    if (!query || query.trim().length === 0) {
      this.hideSearchSuggestions();
      return;
    }

    this.searchSuggestionTimeout = setTimeout(async () => {
      await this.showSearchSuggestions(query);
    }, 300);
  }

  async showSearchSuggestions(query) {
    try {
      const key = query.toLowerCase().trim();
      if (this.cache.searchResults.has(key)) {
        this.displaySearchSuggestions(this.cache.searchResults.get(key));
        return;
      }

      let results = await this.searchWithGeoapify(query);
      if (!results || results.length === 0) results = await this.searchWithNominatim(query);

      this.cache.searchResults.set(key, results);
      this.displaySearchSuggestions(results);
    } catch (e) {
      console.error("Search suggestions failed", e);
      this.hideSearchSuggestions();
    }
  }

  displaySearchSuggestions(results) {
    const box = document.getElementById("searchSuggestions");
    if (!box) return;

    if (!results || results.length === 0) {
      this.hideSearchSuggestions();
      return;
    }

    box.innerHTML = "";
    this.selectedSuggestionIndex = -1;

    results.forEach(r => {
      const div = document.createElement("div");
      div.className = "search-suggestion-item";
      div.setAttribute("role", "option");
      div.addEventListener("mousedown", () => this.selectLocation(r));

      const parts = [];
      if (r.city && r.city !== r.name) parts.push(r.city);
      if (r.state) parts.push(r.state);
      if (r.country) parts.push(r.country);

      div.innerHTML = `
        <div class="suggestion-name">${this.escapeHtml(r.name)}</div>
        <div class="suggestion-details">${parts.filter(Boolean).join(", ")}</div>
      `;
      box.appendChild(div);
    });

    box.classList.remove("hidden");
  }

  hideSearchSuggestions() {
    const box = document.getElementById("searchSuggestions");
    if (box) {
      box.classList.add("hidden");
    }
    this.selectedSuggestionIndex = -1;
  }

  async performSearch(query) {
    if (!query || !query.trim()) return;

    this.hideSearchSuggestions();
    this.showLoading(`Searching for "${this.escapeHtml(query)}"...`);
    
    try {
      let results = await this.searchWithGeoapify(query);
      if (!results || results.length === 0) results = await this.searchWithNominatim(query);

      this.hideLoading();

      if (results && results.length > 0) {
        console.log("Search complete. Automatically selecting first result:", results[0]);
        this.selectLocation(results[0]); 
      } else {
        console.warn("No locations found for query:", query);
        this.showError(`Could not find any locations matching "${this.escapeHtml(query)}". Please try again.`);
      }
    } catch (e) {
      console.error("Search failed:", e);
      this.hideLoading();
      this.showError("The search request failed. Please check your connection.");
    }
  }

  async searchWithNominatim(query) {
    try {
      const paramsConfig = {
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "8",
        "accept-language": "en"
      };

      if (this.detectedCountryCode) {
        paramsConfig.countrycodes = this.detectedCountryCode;
      }

      const params = new URLSearchParams(paramsConfig);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "User-Agent": "EnvironmentReader/1.0" }
      });

      if (!res.ok) throw new Error(`Nominatim API error ${res.status}`);
      const data = await res.json();
      
      return (data || []).map((item) => ({
        name: item.display_name?.split(",")[0] || item.name || "Unknown",
        displayname: item.display_name || item.name || "Unknown",
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        country: item.address?.country_code || "",
        state: item.address?.state || item.address?.region || "",
        city: item.address?.city || item.address?.town || item.address?.village || "",
        type: item.type || "location",
        source: "nominatim"
      }));
    } catch (e) {
      console.warn("Nominatim search failed", e);
      return [];
    }
  }
 
  async searchWithGeoapify(query) {
    try {
      const apiKey = API_KEY; 

      const paramsConfig = {
        text: query,
        format: "json",
        limit: 8,
        apiKey,
      };

      if (this.detectedCountryCode) {
        paramsConfig.filter = `countrycode:${this.detectedCountryCode}`;
      }

      const params = new URLSearchParams(paramsConfig);
      const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`);
      
      if (!res.ok) throw new Error("Geoapify API error " + res.status);
      const data = await res.json();

      console.groupCollapsed(`[Geoapify] Found ${data.features?.length || 0} results for "${query}"`);
      console.log("API Parameters:", paramsConfig);
      console.log("Raw API Response:", data);
      console.groupEnd();

      return (data.features || []).map(item => {
        const props = item.properties;
        let primaryName = props.city || props.town || props.village || props.name || props.street;
        let state = props.state;
        const nameParts = [primaryName, state].filter(Boolean);
        const cleanName = [...new Set(nameParts)].join(', ');

        return {
          name: cleanName,
          displayname: props.formatted,
          latitude: item.geometry.coordinates[1],
          longitude: item.geometry.coordinates[0],
          country: props.country,
          state: props.state,
          city: props.city || props.town || props.village,
          postcode: props.postcode,
        };
      });
    } catch (e) {
      console.warn("Geoapify search failed", e);
      return [];
    }
  }

  selectLocation(loc) {
    if (!loc || typeof loc.latitude === 'undefined' || typeof loc.longitude === 'undefined') {
        console.error("Invalid location object passed to selectLocation:", loc);
        this.showError("Could not select the location due to invalid data.");
        return;
    }
    
    let displayName = loc.name;
    const isPostalCode = /^\d+$/.test(loc.name.split(',')[0].trim());

    if (isPostalCode) {
        displayName = loc.displayname || loc.name;
    }

    this.currentLocation = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      name: displayName,
      source: "search"
    };

    this.hideSearchSuggestions();
    const input = document.getElementById("locationSearch");
    if (input) input.value = this.currentLocation.name;

    this.updateLocationDisplay();
    this.fetchWeatherData();

    // this.simulateHapticFeedback("light");
  }

  //Location Detection
  async detectLocationWithIPFirst() {
    if (this.isLoading) return;
    this.showLoading("Detecting your location...");
    console.log("Starting IP-first location detection...");
    try {
      await this.getIPBasedLocation();
      if (!this.locationPermissionRequested && !this.hasGPSLocation) {
        setTimeout(() => this.showLocationPermissionNotification(), 2000);
      }
    } catch (e) {
      console.error("Location detection failed", e);
      this.showError("Location detection failed: " + e.message);
    }
  }

  async getIPBasedLocation() {
    console.log("Fetching IP-based location...");
    this.updateLoadingMessage("Getting your approximate location...");
    try {
      let response = await this.fetchWithTimeout("https://ipapi.co/json", 10000);
      if (!response.ok) {
        console.log("Trying backup IP service...");
        response = await this.fetchWithTimeout("https://ip-api.com/json", 10000);
      }
      if (!response.ok) throw new Error("IP location services unavailable");
      const data = await response.json();

      const countryCode = data.country_code || data.countryCode; 
      if (countryCode && typeof countryCode === 'string') {
          this.detectedCountryCode = countryCode.toLowerCase();
          console.log(`✅ Country detected and set to: ${this.detectedCountryCode}`);
      }

      const lat = data.latitude ?? data.lat;
      const lon = data.longitude ?? data.lon;
      if (typeof lat === "number" && typeof lon === "number") {
        this.currentLocation = {
          latitude: lat,
          longitude: lon,
          name: this.formatLocationName(data),
          source: "ip"
        };
        this.updateLocationDisplay();
        await this.fetchWeatherData();
      } else {
        throw new Error("Invalid location data received");
      }
    } catch (e) {
      console.error("IP location failed", e);
      this.useDefaultLocation();
    }
  }


  async reverseGeocode(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;
      const res = await this.fetchWithTimeout(url, 10000);
      if (!res.ok) throw new Error(`Reverse geocoding failed: ${res.status}`);
      const data = await res.json();
      
      if (data && data.address) {
        return this.formatLocationName(data.address);
      } else if (data && data.display_name) {
        return data.display_name; 
      } else {
        throw new Error("No address found for coordinates");
      }
    } catch (e) {
      console.error("Reverse geocoding failed:", e);
      return "Current Location"; 
    }
  }

  formatLocationName(data) {
    const parts = [];
    const city = data.city || data.city_name;
    const region = data.region || data.region_name || data.state;
    const country = data.country || data.country_name;
    if (city) parts.push(city);
    if (region && region !== city) parts.push(region);
    if (country) parts.push(country);
    return parts.join(", ") || "Current Location";
  }
  fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
  }

  showLocationPermissionNotification(force = false) {
    if (this.hasGPSLocation) return;
    if (!force && this.locationPermissionRequested) return;
  
    if (force) {
        this.locationPermissionRequested = false;
    }

    const bar = document.getElementById("locationNotification");
    if (bar) bar.classList.remove("hidden");
    console.log("Showing location permission notification (Forced:", force, ")");
  }


  dismissLocationNotification = () => {
    const bar = document.getElementById("locationNotification");
    if (bar) bar.classList.add("hidden");
    this.locationPermissionRequested = true;
  };

  requestGPSPermission = async () => {
    this.dismissLocationNotification();
    this.locationPermissionRequested = true;
    console.log("Requesting GPS permission...");
    this.showLoading("Getting precise location...");
    try {
      const pos = await this.getCurrentPosition();
      this.updateLoadingMessage("Resolving location name...");
      
      const locationName = await this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);

      this.currentLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        name: locationName,
        source: "gps",
        accuracy: pos.coords.accuracy
      };
      this.hasGPSLocation = true;
      this.updateLocationDisplay();
      await this.fetchWeatherData();
    } catch (e) {
      console.error("GPS permission or reverse geocoding failed", e);
      this.showError("Could not get your precise location. Please check your device's location settings and permissions.");
    }
  };
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("Geolocation not supported")); return; }
      navigator.geolocation.getCurrentPosition(
        resolve, reject,
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 300000 }
      );
    });
  }
  useDefaultLocation() {
    console.log("Using default location Kolkata...");
    this.currentLocation = { latitude: 22.5744, longitude: 88.3629, name: "Kolkata, West Bengal", source: "default" };
    this.updateLocationDisplay();
    this.fetchWeatherData();
  }
  updateLocationDisplay() {
    const locationName = document.getElementById("locationName");
    const locationDetails = document.getElementById("locationDetails");
    const locationType = document.getElementById("locationType");
    if (locationName && this.currentLocation) locationName.textContent = this.currentLocation.name;
    if (locationDetails && this.currentLocation) {
      const coords = `${this.currentLocation.latitude.toFixed(2)}, ${this.currentLocation.longitude.toFixed(2)}`;
      const acc = this.currentLocation.accuracy ? ` • ±${Math.round(this.currentLocation.accuracy)}m` : "";
      locationDetails.textContent = `${coords}${acc}`;
    }
    if (locationType && this.currentLocation) {
      const map = { gps: "Exact Location", ip: "IP Location", search: "Search Result", default: "Default Location" };
      locationType.textContent = map[this.currentLocation.source] || "";
    }
    this.updateHeaderLocationDisplay();
  }

  updateHeaderLocationDisplay() {
    const nameEl = document.getElementById("headerLocationName");
    const wrapperEl = document.getElementById("headerLocationControl");
    if (!nameEl || !wrapperEl) return;

    if (this.currentLocation && this.currentLocation.name) {
        const shortName = this.currentLocation.name.split(',')[0].trim();
        
        nameEl.textContent = shortName;
        nameEl.classList.remove("hidden");
        wrapperEl.classList.add("location-set");
    }
  }

  /* ====== Weather Data ====== */
  async fetchWeatherData() {
    if (!this.currentLocation) { console.error("No location for weather fetch"); return; }
    if (this.isCacheValid()) {
      console.log("Using cached weather data");
      this.weatherData = this.cache.weatherData;
      this.renderWeatherData();
      this.hideLoading();
      return;
    }
    console.log("Fetching weather data for", this.currentLocation);
    this.showLoading("Loading weather data...");
    try {
      const { latitude, longitude } = this.currentLocation;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility,uv_index` +
        `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,uv_index_max` +
        `&timezone=auto&forecast_days=14`;
      const res = await this.fetchWithTimeout(url, 15000);
      if (!res.ok) throw new Error(`Weather API failed ${res.status} ${res.statusText}`);
      this.weatherData = await res.json();
      this.cache.weatherData = this.weatherData;
      this.cache.locationData = this.currentLocation;
      this.cache.timestamp = Date.now();
      if (!this.selectedDate) {
        this.selectedHourIndex = this.getCurrentHourIndex();
        this.selectedDayIndex = 0;
      }
      this.renderWeatherData();
      this.hideLoading();
      this.updateLastUpdated();
    } catch (e) {
      console.error("Weather fetch failed", e);
      this.showError("Failed to fetch weather data: " + e.message);
    }
  }

  isCacheValid() {
    if (!this.cache.weatherData || !this.cache.locationData) return false;

    const isSameLocation =
      this.cache.locationData.latitude.toFixed(4) === this.currentLocation.latitude.toFixed(4) &&
      this.cache.locationData.longitude.toFixed(4) === this.currentLocation.longitude.toFixed(4);
    if (!isSameLocation) return false;

    const age = Date.now() - (this.cache.timestamp || 0);
    return age < 5 * 60 * 1000;
  }
  async refreshWeatherData() {
    if (!this.currentLocation || this.isLoading) return;
    console.log("Refreshing weather data...");
    this.cache.timestamp = 0; // force
    await this.fetchWeatherData();
    // this.simulateHapticFeedback("medium");
  }
  getCurrentHourIndex() {
    if (!this.weatherData || !this.weatherData.hourly) return 0;
    const now = new Date();
    const currentHour = now.getHours();
    const d = now.getDate(), m = now.getMonth(), y = now.getFullYear();
    const times = this.weatherData.hourly.time;
    for (let i = 0; i < times.length; i++) {
      const t = new Date(times[i]);
      if (t.getHours() === currentHour && t.getDate() === d && t.getMonth() === m && t.getFullYear() === y) return i;
    }
    return 0;
  }

  //Rendering
  renderWeatherData() {
    if (!this.weatherData) { console.error("No weather data to render"); return; }
    this.renderCurrentWeather();
    this.renderHourlyForecast(); 
    this.renderDailyForecast();
    this.renderWeatherInsights();
    this.updateBackground();
    this.updateSelectedTimeDisplay();
  }

  getSelectedHourData() {
    if (!this.weatherData || !this.weatherData.hourly) return this.weatherData?.current || {};
    const h = this.weatherData.hourly;
    const idx = Math.min(Math.max(this.selectedHourIndex, 0), h.time.length - 1);
    
    return {
      temperature_2m: h.temperature_2m?.[idx],
      apparent_temperature: h.apparent_temperature?.[idx],
      relative_humidity_2m: h.relative_humidity_2m?.[idx],
      weather_code: h.weather_code?.[idx],
      pressure_msl: h.pressure_msl?.[idx],
      wind_speed_10m: h.wind_speed_10m?.[idx],
      wind_direction_10m: h.wind_direction_10m?.[idx],
      visibility: h.visibility?.[idx],
      uv_index: h.uv_index?.[idx],
      cloud_cover: h.cloud_cover?.[idx],
      is_day: h.is_day?.[idx],
      time: h.time?.[idx]
    };
  }

  renderCurrentWeather() {
    const selected = this.getSelectedHourData();
    const current = this.weatherData.current || {};
    const daily = this.weatherData.daily || {}; 
    const info = this.weatherCodes[selected.weather_code] || this.weatherCodes[0];

    // Find the min/max temperature for the selected day
    let dailyHigh, dailyLow;
    if (daily.temperature_2m_max && this.selectedDayIndex < daily.temperature_2m_max.length) {
        dailyHigh = daily.temperature_2m_max[this.selectedDayIndex];
        dailyLow = daily.temperature_2m_min[this.selectedDayIndex];
    }

    // Location
    const locationName = document.getElementById("locationName");
    const locationDetails = document.getElementById("locationDetails");
    if (locationName && this.currentLocation) locationName.textContent = this.currentLocation.name;
    if (locationDetails && this.currentLocation) {
      const coords = `${this.currentLocation.latitude.toFixed(2)}, ${this.currentLocation.longitude.toFixed(2)}`;
      const acc = this.currentLocation.accuracy ? ` • ±${Math.round(this.currentLocation.accuracy)}m` : "";
      locationDetails.textContent = `${coords}${acc}`;
    }

    // Metrics
    const els = {
      currentTemp: document.getElementById("currentTemp"),
      feelsLike: document.getElementById("feelsLike"),
      mainTempExtremesTag: document.getElementById("mainTempExtremesTag"),
      weatherIcon: document.getElementById("weatherIcon"),
      weatherCondition: document.getElementById("weatherCondition"),
      humidity: document.getElementById("humidity"),
      windSpeed: document.getElementById("windSpeed"),
      pressure: document.getElementById("pressure"),
      visibility: document.getElementById("visibility"),
      uvIndex: document.getElementById("uvIndex"),
      cloudCover: document.getElementById("cloudCover")
    };
    
    const temp = selected.temperature_2m ?? current.temperature_2m;
    const feels = selected.apparent_temperature ?? current.apparent_temperature;
    
    if (els.currentTemp) els.currentTemp.textContent = this.formatTemperature(temp);
    if (els.feelsLike) els.feelsLike.textContent = `Feels like ${this.formatTemperature(feels)}`;
    
    // Logic for the main high/low tag
    if (els.mainTempExtremesTag && dailyHigh !== undefined && temp !== null) {
        if (Math.round(temp) === Math.round(dailyHigh)) {
            els.mainTempExtremesTag.textContent = `🔥 Day's High`;
            els.mainTempExtremesTag.classList.remove("hidden");
        } else if (Math.round(temp) === Math.round(dailyLow)) {
            els.mainTempExtremesTag.textContent = `❄️ Day's Low`;
            els.mainTempExtremesTag.classList.remove("hidden");
        } else {
            els.mainTempExtremesTag.classList.add("hidden");
        }
    }
    if (els.weatherIcon) els.weatherIcon.textContent = info.icon;
    if (els.weatherCondition) els.weatherCondition.textContent = info.desc;
    
    const rh = Math.round(selected.relative_humidity_2m ?? current.relative_humidity_2m ?? 0);
    if (els.humidity) els.humidity.textContent = `${rh}%`;
    
    const ws = Math.round(selected.wind_speed_10m ?? current.wind_speed_10m ?? 0);
    if (els.windSpeed) els.windSpeed.textContent = `${ws} km/h`;
    
    const p = Math.round(selected.pressure_msl ?? current.pressure_msl ?? 0);
    if (els.pressure) els.pressure.textContent = `${p} hPa`;
    
    const visKm = ((selected.visibility ?? current.visibility) || 0) / 1000;
    if (els.visibility) els.visibility.textContent = `${Math.round(visKm)} km`;
    
    const uvi = Math.round(selected.uv_index ?? current.uv_index ?? 0);
    if (els.uvIndex) els.uvIndex.textContent = `${uvi}`;
    
    const cc = Math.round(selected.cloud_cover ?? current.cloud_cover ?? 0);
    if (els.cloudCover) els.cloudCover.textContent = `${cc}%`;
  }

renderHourlyForecast() {
    const container = document.getElementById("hourlyForecast");
    if (!container || !this.weatherData || !this.weatherData.hourly) { if (container) container.innerHTML = ""; return; }
    container.innerHTML = "";
    const hourly = this.weatherData.hourly;

    let startIndex, endIndex;
    if (this.selectedDate) {
      const target = new Date(this.selectedDate);
      const times = hourly.time;
      startIndex = 0;
      for (let i = 0; i < times.length; i++) {
        const t = new Date(times[i]);
        if (t.getDate() === target.getDate() && t.getMonth() === target.getMonth() && t.getFullYear() === target.getFullYear()) {
          startIndex = i; break;
        }
      }
      endIndex = Math.min(startIndex + 24, times.length);
    } else {
      startIndex = Math.max(0, this.getCurrentHourIndex());
      endIndex = Math.min(startIndex + 24, hourly.time.length);
    }
        // Find the min/max temperature for the 24-hour period being displayed
    const dayTemps = hourly.temperature_2m.slice(startIndex, endIndex);
    const dailyHigh = Math.max(...dayTemps);
    const dailyLow = Math.min(...dayTemps);

    for (let i = startIndex; i < endIndex; i++) {
      const time = new Date(hourly.time[i]);
      const info = this.weatherCodes[hourly.weather_code?.[i]] || this.weatherCodes[0];
      const card = document.createElement("div");
      card.className = `hourly-card ${i === this.selectedHourIndex ? "selected" : ""}`;
      card.setAttribute("role", "listitem");
      card.addEventListener("click", () => this.selectHour(i));

      const now = new Date();
      const isCurrent = !this.selectedDate &&
        time.getHours() === now.getHours() &&
        time.getDate() === now.getDate() &&
        time.getMonth() === now.getMonth() &&
        time.getFullYear() === now.getFullYear();
      
      let label;
      if (isCurrent) {
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        label = `Now ${timeFormatter.format(now)}`;
      } else {
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        label = timeFormatter.format(time);
      }

        const temp = hourly.temperature_2m?.[i];
        let extremesTag = '';
        if (Math.round(temp) === Math.round(dailyHigh)) {
            extremesTag = `<span class="hourly-extremes-tag">🔥</span>`;
        } else if (Math.round(temp) === Math.round(dailyLow)) {
            extremesTag = `<span class="hourly-extremes-tag">❄️</span>`;
        }
      const pop = Math.round(hourly.precipitation_probability?.[i] ?? 0);

      card.innerHTML = `
        <div class="hourly-time">${label}</div>
        <div class="hourly-icon" role="img" aria-label="${info.desc}">${info.icon}</div>
        <div class="hourly-temp">${this.formatTemperature(temp)}${extremesTag}</div>
        <div class="hourly-desc">${pop}%</div>
      `;
      container.appendChild(card);
    }
  }

  renderDailyForecast() {
    const container = document.getElementById("dailyForecast");
    if (!container || !this.weatherData || !this.weatherData.daily) { if (container) container.innerHTML = ""; return; }
    container.innerHTML = "";
    const daily = this.weatherData.daily;
    const len = Math.min(7, daily.time.length);
    for (let i = 0; i < len; i++) {
      const date = new Date(daily.time[i]);
      const info = this.weatherCodes[daily.weather_code?.[i]] || this.weatherCodes[0];

      const card = document.createElement("div");
      card.className = `daily-card ${i === this.selectedDayIndex ? "selected" : ""}`;
      card.setAttribute("role", "listitem");
      card.addEventListener("click", () => this.selectDay(i));

      const today = new Date();
      
      const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const isTomorrow = date.getDate() === tomorrow.getDate() && date.getMonth() === tomorrow.getMonth() && date.getFullYear() === tomorrow.getFullYear();
      const dayName = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

       const tHigh = daily.temperature_2m_max?.[i];
       const tLow  = daily.temperature_2m_min?.[i];
      const uvMax = Math.round(daily.uv_index_max?.[i] ?? 0);
      const rainMm = Math.round(daily.precipitation_sum?.[i] ?? 0);

      const uvLevel = this.getUVLevel(uvMax);
      card.innerHTML = `
        <div class="daily-header">
          <span class="daily-date">${dayName}</span>
          <span class="daily-icon" role="img" aria-label="${info.desc}">${info.icon}</span>
        </div>
        <div class="daily-temps">
          <span class="temp-high">${this.formatTemperature(tHigh)}</span>
          <span class="temp-low">${this.formatTemperature(tLow)}</span>
        </div>
        <div class="daily-desc">${info.desc}</div>
        ${rainMm > 0 ? `<div class="daily-rain">${rainMm}mm</div>` : ``}
        <div class="daily-uv">UV ${uvLevel}</div>
      `;
      container.appendChild(card);
    }
  }

  renderWeatherInsights() {
    const container = document.getElementById("weatherInsights");
    if (!container || !this.weatherData) return;
    const insights = this.generateWeatherInsights();
    container.innerHTML = "";
    insights.forEach((ins) => {
      const card = document.createElement("div");
      card.className = "insight-card";
      card.setAttribute("role", "listitem");
      card.innerHTML = `
        <div class="insight-title">${ins.icon} ${ins.title}</div>
        <div class="insight-content">${ins.content}</div>
      `;
      container.appendChild(card);
    });
  }

  generateWeatherInsights() {
    const sel = this.getSelectedHourData();
    const cur = this.weatherData.current || {};
    const daily = this.weatherData.daily || {};
    const insights = [];

    const temp = (sel.temperature_2m ?? cur.temperature_2m) || 0;
    const feels = (sel.apparent_temperature ?? cur.apparent_temperature) || 0;
    if (Math.abs(temp - feels) >= 3) {
      insights.push({ icon: "🌡️", title: "Temperature Feel", content: `It feels ${this.formatTemperature(feels)} but actual is ${this.formatTemperature(temp)} due to ${feels > temp ? "humidity/heat index" : "wind chill"}.` });
    }

    const uvi = (sel.uv_index ?? cur.uv_index) || 0;
    if (uvi >= 6) {
      insights.push({ icon: "🧴", title: "UV Protection", content: `High UV index of ${Math.round(uvi)}. Wear SPF 30+, sunglasses, and protective clothing.` });
    }

    const wind = (sel.wind_speed_10m ?? cur.wind_speed_10m) || 0;
    if (wind >= 25) {
      insights.push({ icon: "💨", title: "Strong Winds", content: `Winds at ${Math.round(wind)} km/h. Secure loose items and be cautious outdoors.` });
    } else if (wind >= 15) {
      insights.push({ icon: "🍃", title: "Breezy Conditions", content: `Winds at ${Math.round(wind)} km/h. Good for kites; secure lightweight items.` });
    }

    const visKm = ((sel.visibility ?? cur.visibility) || 10000) / 1000;
    if (visKm < 1) {
      insights.push({ icon: "🚗", title: "Very Poor Visibility", content: `Visibility ~${Math.round(visKm * 100) / 100} km. Use fog lights and drive slowly.` });
    } else if (visKm < 5) {
      insights.push({ icon: "⚠️", title: "Reduced Visibility", content: `Visibility ~${Math.round(visKm)} km. Drive carefully with headlights on.` });
    }

    const code = sel.weather_code || 0;
    if (code === 95 || code === 96 || code === 99) {
      insights.push({ icon: "⛈️", title: "Thunderstorm Safety", content: `Stay indoors, avoid windows/electronics, and wait 30 minutes after last thunder.` });
    } else if (code >= 71 && code <= 77) {
      insights.push({ icon: "🧣", title: "Winter Conditions", content: `Dress warmly in layers; roads can be slippery. Allow extra travel time.` });
    } else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
      insights.push({ icon: "☔", title: "Rainy Weather", content: `Carry an umbrella and wear waterproof clothing. Roads may be wet and visibility reduced.` });
    }

    const maxs = daily.temperature_2m_max || [];
    const mins = daily.temperature_2m_min || [];
    if (maxs.length && mins.length) {
      const weekMax = Math.max(...Array.from(maxs).slice(0, 7));
      const weekMin = Math.min(...Array.from(mins).slice(0, 7));
      const range = weekMax - weekMin;
      let msg = `This week’s temperature range ${this.formatTemperature(weekMin)} to ${this.formatTemperature(weekMax)}.`;
      if (range >= 20) msg += " Highly variable conditions; dress in layers.";
      else if (range <= 10) msg += " Stable pattern with consistent temperatures.";
      else msg += " Moderate variations expected.";
      insights.push({ icon: "📅", title: "Week Ahead", content: msg });
    }

    return insights.slice(0, 4);
  }
  getUVLevel(uvi) {
    if (uvi <= 2) return "Low";
    if (uvi <= 5) return "Moderate";
    if (uvi <= 7) return "High";
    if (uvi <= 10) return "Very High";
    return "Extreme";
  }

  //Selection/Navigation
  selectHour(index) {
    console.log("Selecting hour", index);
    this.selectedHourIndex = index;

    if (this.weatherData?.hourly?.time?.[index]) {
      const selectedTime = new Date(this.weatherData.hourly.time[index]);
      this.selectedDate = selectedTime.toISOString().split("T")[0];
      const daily = this.weatherData.daily;
      if (daily) {
        for (let i = 0; i < daily.time.length; i++) {
          const d = new Date(daily.time[i]);
          if (d.getFullYear() === selectedTime.getFullYear() &&
              d.getMonth() === selectedTime.getMonth() &&
              d.getDate() === selectedTime.getDate()) {
            this.selectedDayIndex = i;
            break;
          }
        }
      }
    }
    this.updateMainDateDisplay();
    this.renderCurrentWeather();
    this.renderHourlyForecast();
    this.updateBackground();
    this.updateSelectedTimeDisplay();
    // this.simulateHapticFeedback("light");
  }
  selectDay(index) {
    console.log("Selecting day", index);
    this.selectedDayIndex = index;
    if (this.weatherData?.daily?.time?.[index] && this.weatherData?.hourly?.time) {
      this.selectedDate = this.weatherData.daily.time[index];
      const target = new Date(this.selectedDate);
      const times = this.weatherData.hourly.time;
      let targetHour = -1;
      for (let i = 0; i < times.length; i++) {
        const t = new Date(times[i]);
        if (t.getFullYear() === target.getFullYear() &&
            t.getMonth() === target.getMonth() &&
            t.getDate() === target.getDate()) {
          if (targetHour === -1) targetHour = i;
          if (t.getHours() === 12) { targetHour = i; break; }
        }
      }
      if (targetHour !== -1) this.selectedHourIndex = targetHour;
    }
    this.updateMainDateDisplay();
    this.renderCurrentWeather();
    this.renderHourlyForecast();
    this.renderDailyForecast();
    this.renderWeatherInsights();
    this.updateBackground();
    this.updateSelectedTimeDisplay();
    // this.simulateHapticFeedback("medium");
  }
  navigateHour(direction) {
    if (!this.weatherData?.hourly?.time) return;
    let idx = this.selectedHourIndex + direction;
    if (idx < 0) idx = this.weatherData.hourly.time.length - 1;
    if (idx >= this.weatherData.hourly.time.length) idx = 0;
    this.selectHour(idx);
  }
  navigateDay(direction) {
    if (!this.weatherData?.daily?.time) return;
    let idx = this.selectedDayIndex + direction;
    if (idx < 0) idx = this.weatherData.daily.time.length - 1;
    if (idx >= this.weatherData.daily.time.length) idx = 0;
    this.selectDay(idx);
  }

  goToCurrentWeather = () => {
    console.log("Logo clicked - Going to current weather...");
    this.selectedDate = null;
    this.selectedHourIndex = this.getCurrentHourIndex();
    this.selectedDayIndex = 0;
    if (this.weatherData) {
      this.renderCurrentWeather();
      this.renderHourlyForecast();
      this.renderDailyForecast();
      this.updateBackground();
      this.updateSelectedTimeDisplay();
      // this.simulateHapticFeedback("medium");
    }
    const input = document.getElementById("locationSearch");
    if (input) input.value = "";
    this.updateTime(); 
  };

  updateSelectedTimeDisplay() {
    const display = document.getElementById("selectedTimeDisplay");
    const dateInfo = document.getElementById("selectedDateInfo");
    if (!display || !this.weatherData) return;
    const s = this.getSelectedHourData();
    if (s.time) {
      const d = new Date(s.time);
      const now = new Date();
      const isCurrentHour =
        !this.selectedDate &&
        d.getHours() === now.getHours() &&
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      if (isCurrentHour) {
        display.textContent = "Current Time";
        if (dateInfo) dateInfo.textContent = "Live weather conditions";
      } else {
        const isToday = d.toDateString() === now.toDateString();
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
        if (isToday) {
          display.textContent = `Today, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
          if (dateInfo) dateInfo.textContent = "Today's weather conditions";
        } else if (d.toDateString() === tomorrow.toDateString()) {
          display.textContent = `Tomorrow, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
          if (dateInfo) dateInfo.textContent = "Tomorrow's weather forecast";
        } else if (d.toDateString() === yesterday.toDateString()) {
          display.textContent = `Yesterday, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
          if (dateInfo) dateInfo.textContent = "Yesterday's weather conditions";
        } else {
          display.textContent = d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
          if (dateInfo) dateInfo.textContent = this.selectedDate ? "Forecast conditions" : "Historical/forecast conditions";
        }
      }
    } else {
      display.textContent = "Current Time";
      if (dateInfo) dateInfo.textContent = "Live weather conditions";
    }
  }

  //Background & Effects


updateBackground() {

    const s = this.getSelectedHourData(); 

    const code = s.weather_code || 0;
    const selectedTime = s.time ? new Date(s.time) : new Date();
    const isDay = (typeof s.is_day !== "undefined") ? !!s.is_day : (selectedTime.getHours() >= 6 && selectedTime.getHours() < 20);
    const temp = s.temperature_2m ?? this.weatherData?.current?.temperature_2m ?? 20;
    const cloud = s.cloud_cover ?? this.weatherData?.current?.cloud_cover ?? 0;
    const wind = s.wind_speed_10m ?? this.weatherData?.current?.wind_speed_10m ?? 0;
    const humidity = s.relative_humidity_2m ?? this.weatherData?.current?.relative_humidity_2m ?? 50;

    const windDirection = s.wind_direction_10m ?? 0;
    const windEffect = (wind / 50) * (windDirection > 180 ? -1 : 1);
    document.documentElement.style.setProperty('--wind-skew', `${windEffect * 5}deg`);

    this.updateSkyLayer(code, selectedTime, isDay, temp, cloud);
    this.updateCelestialBodies(code, isDay, selectedTime, cloud);
    this.updateClouds(code, cloud, wind);
    this.updateWeatherEffects(code, wind, humidity);
    // this.updateSoundEffects(code, wind);
    this.updateTemperatureTheming(temp);
  }


  updateSkyLayer(weatherCode, time, isDay /*temperature, cloudCover*/) {
    const skyLayer = document.getElementById("skyLayer");
    if (!skyLayer) return;
    skyLayer.className = "sky-layer";
    const info = this.weatherCodes[weatherCode] || this.weatherCodes[0];
    switch (info.bg) {
      case "clear": skyLayer.classList.add(isDay ? "clear" : "night"); break;
      case "partly-cloudy": skyLayer.classList.add("partly-cloudy"); break;
      case "cloudy": skyLayer.classList.add("cloudy"); break;
      case "rainy": skyLayer.classList.add("rainy"); break;
      case "thunderstorm": skyLayer.classList.add("thunderstorm"); break;
      case "foggy": skyLayer.classList.add("foggy"); break;
      case "snowy": skyLayer.classList.add("snowy"); break;
      default: {
        const h = time.getHours();
        if (!isDay) skyLayer.classList.add("night");
        else if (h < 8) skyLayer.classList.add("dawn");
        else if (h < 11) skyLayer.classList.add("morning");
        else if (h < 14) skyLayer.classList.add("noon");
        else if (h < 18) skyLayer.classList.add("afternoon");
        else skyLayer.classList.add("evening");
      }
    }
    skyLayer.style.transition = "all 2s cubic-bezier(0.4,0,0.2,1)";
  }

  updateCelestialBodies(weatherCode, isDay, time, cloudCover) {
    const sun = document.getElementById("sun");
    const moon = document.getElementById("moon");
    const stars = document.getElementById("stars");
    const info = this.weatherCodes[weatherCode] || this.weatherCodes[0];
    const sunVisible = info.sunVisible;

    if (isDay) {
      if (sun) {
        let opacity = 1;
        switch (sunVisible) {
          case false: opacity = 0; break;
          case "dimmed": opacity = 0.3; sun.style.filter = "blur(2px)"; break;
          case "intermittent": opacity = cloudCover > 70 ? 0.2 : 0.8; sun.style.filter = "none"; break;
          case true:
          default: opacity = 1; sun.style.filter = "none";
        }
        sun.style.opacity = `${opacity}`;
        sun.style.transform = this.calculateSunPosition(time);
        const sunRays = sun.querySelector(".sun-rays");
        if (sunRays) sunRays.style.opacity = sunVisible === true ? "1" : "0";
      }
      if (moon) moon.classList.remove("visible");
      if (stars) { stars.classList.remove("visible"); stars.innerHTML = ""; }
    } else {
      if (sun) sun.style.opacity = "0";
      if (moon) {
        moon.classList.add("visible");
        moon.style.transform = this.calculateMoonPosition(time);
        moon.style.opacity = cloudCover > 80 ? "0.3" : "1";
      }
      if (stars) this.createStars(cloudCover);
    }
  }
 
calculateSunPosition(time) {
    const h = time.getHours(), m = time.getMinutes();
    const totalMinutes = h * 60 + m;
    const sunrise = 6 * 60, sunset = 18 * 60; // 6 AM and 6 PM

    if (totalMinutes < sunrise || totalMinutes > sunset) return "scale(0)";

    const progress = (totalMinutes - sunrise) / (sunset - sunrise);

    // Color Logic:
    const sunCore = document.getElementById('sun')?.querySelector('.sun-core');
    if (sunCore) {
        let color;
        if (progress < 0.1 || progress > 0.9) {
            color = '#FF8C00'; // Deep Orange for sunrise/sunset
        } else if (progress < 0.25 || progress > 0.75) {
            color = '#FFA500'; // Lighter Orange for morning/afternoon
        } else {
            color = '#FFD700'; // Yellow for midday
        }
        sunCore.style.background = `radial-gradient(circle, ${color} 20%, #FF7F00 100%)`;
    }
    
    const angle = progress * 180 - 90;
    return `rotate(${angle}deg) translateY(-200px)`;
}
  calculateMoonPosition(time) {
    const h = time.getHours();
    const angle = (h / 24) * 360;
    return `rotate(${angle}deg) translateY(-180px)`;
  }

  updateClouds(weatherCode, cloudCover, windSpeed) {
    const clouds = document.querySelectorAll(".cloud");
    const info = this.weatherCodes[weatherCode] || this.weatherCodes[0];
    const dark = ["rainy", "thunderstorm", "stormy"].includes(info.bg);
    const windMult = Math.max(1, windSpeed / 10);
    clouds.forEach((cloud, idx) => {
      const baseOpacity = dark ? 0.95 : 0.8;
      const opacity = (cloudCover > idx * 15) ? baseOpacity : 0.3;
      cloud.style.opacity = `${opacity}`;
      cloud.style.animationDuration = `${25 / windMult}s`;
      if (dark) cloud.style.backgroundColor = "rgba(64,64,64,0.95)";
      else if (info.bg === "foggy") cloud.style.backgroundColor = "rgba(200,200,200,0.9)";
      else cloud.style.backgroundColor = "rgba(255,255,255,0.9)";
    });
  }

  clearAllWeatherEffects() {
    const effectsContainer = document.getElementById("weatherEffects");
    if (effectsContainer) {
      effectsContainer.innerHTML = `
        <div class="precipitation-layer" id="precipitationLayer"></div>
        <div class="wind-layer" id="windLayer"></div>
        <div class="atmospheric-effects" id="atmosphericEffects"></div>
        <div class="lightning-layer" id="lightningLayer"></div>
      `;
    }

    if (this.rainInterval) { clearInterval(this.rainInterval); this.rainInterval = null; }
    if (this.lightningInterval) { clearInterval(this.lightningInterval); this.lightningInterval = null; }
    if (this.thunderInterval) { clearInterval(this.thunderInterval); this.thunderInterval = null; }
    this.activeAnimations.clear();
  }

  updateWeatherEffects(weatherCode, windSpeed, humidity) {
    this.clearAllWeatherEffects();
    const info = this.weatherCodes[weatherCode] || this.weatherCodes[0];
    const effects = info.effects || [];

    effects.forEach((eff) => {
      switch (eff) {
        case "moderate-rain": this.createEnhancedRainEffect("moderate"); break;
        case "heavy-rain": this.createEnhancedRainEffect("heavy"); break;
        case "stormy-rain": this.createStormyRainEffect(); break;
        case "light-snow": this.createEnhancedSnowEffect("light"); break;
        case "moderate-snow": this.createEnhancedSnowEffect("moderate"); break;
        case "heavy-snow": this.createEnhancedSnowEffect("heavy"); break;
        case "fog": this.createEnhancedFogEffect(); break;
        case "lightning": this.createEnhancedLightningEffect(); break;
        case "thunder": this.createThunderEffect(); break;
        case "dense-clouds": this.createDenseCloudEffect(); break;
        case "moving-clouds": this.createMovingCloudEffect(); break;
        case "sun-rays": this.createSunRayEffect(); break;
        case "frost": this.createFrostEffect(); break;
      }
    });
    if (windSpeed >= 15) this.createEnhancedWindEffect(windSpeed);

    if (humidity >= 85 && !effects.includes("fog")) this.createMistEffect();
  }



createEnhancedRainEffect(intensity) {
    const container = document.getElementById("precipitationLayer");
    if (!container) return;

    const rates = {
        moderate: { count: 3, interval: 40 },
        heavy: { count: 5, interval: 30 }
    };
    const { count, interval } = rates[intensity] || rates.light;

    this.rainInterval = setInterval(() => {
        for (let i = 0; i < count; i++) {
            const drop = this.getOrCreateParticle("rain-drop", container);
            drop.className = `rain-drop ${intensity}`;
            drop.style.left = `${Math.random() * 110 - 5}%`;
            drop.style.animationDelay = `${Math.random() * 0.5}s`;
            drop.style.animationDuration = `${1 + Math.random() * 0.5}s`;
            drop.style.display = "block";
            
            setTimeout(() => {
                const splash = document.createElement('div');
                splash.className = 'rain-splash';
                splash.style.left = drop.style.left;
                container.appendChild(splash);
                setTimeout(() => splash.remove(), 500); 
            }, 1500);

            setTimeout(() => {
                this.returnParticleToPool(drop);
            }, 2000); 
        }
    }, interval);
  }
  createStormyRainEffect() {
    this.createEnhancedRainEffect("heavy");
    this.createEnhancedLightningEffect();
    this.createThunderEffect();
  }
  createEnhancedSnowEffect(intensity) {
    const container = document.getElementById("precipitationLayer");
    if (!container) return;
    const counts = { light: 40, moderate: 60, heavy: 100 };
    const n = counts[intensity] || 40;
    const chars = ["❄", "✼", "✻", "✽"];
    for (let i = 0; i < n; i++) {
      const flake = document.createElement("div");
      flake.className = `snowflake ${intensity === "light" ? "small" : intensity === "heavy" ? "large" : "medium"}`;
      flake.textContent = chars[Math.floor(Math.random() * chars.length)];
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.animationDelay = `${Math.random() * 8}s`;
      container.appendChild(flake);
    }
  }
  createEnhancedFogEffect() {
    const container = document.getElementById("atmosphericEffects");
    if (!container) return;
    const fog = document.createElement("div");
    fog.className = "fog-layer";
    fog.style.opacity = "0.8";
    container.appendChild(fog);
  }
  createEnhancedLightningEffect() {
    const layer = document.getElementById("lightningLayer");
    if (!layer) return;
    const flash = document.createElement("div");
    flash.className = "lightning";
    layer.appendChild(flash);

    this.lightningInterval = setInterval(() => {
      if (Math.random() < 0.4) {
        flash.classList.add("flash");
        setTimeout(() => flash.classList.remove("flash"), 150);
      }
      if (Math.random() < 0.3) this.createLightningBolt();
    }, 2000 + Math.random() * 3000);
  }
  createLightningBolt() {
    const layer = document.getElementById("lightningLayer");
    if (!layer) return;
    const bolt = document.createElement("div");
    bolt.className = "lightning-bolt";
    bolt.style.left = `${20 + Math.random() * 60}%`;
    bolt.style.top = "0";
    bolt.style.height = `${30 + Math.random() * 40}%`;
    layer.appendChild(bolt);
    setTimeout(() => { if (bolt.parentNode) bolt.parentNode.removeChild(bolt); }, 200);
  }
  createThunderEffect() {
    const layer = document.getElementById("lightningLayer");
    if (!layer) return;
    this.thunderInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        const thunder = document.createElement("div");
        thunder.className = "lightning thunder-flash";
        layer.appendChild(thunder);
        setTimeout(() => { if (thunder.parentNode) thunder.parentNode.removeChild(thunder); }, 300);
        // setTimeout(() => this.simulateHapticFeedback("strong"), 1000 + Math.random() * 3000);
      }
    }, 4000);
  }
  createDenseCloudEffect() {
    const clouds = document.querySelectorAll(".cloud");
    clouds.forEach((c) => { c.style.opacity = "0.9"; c.style.filter = "blur(2px)"; });
  }
  createMovingCloudEffect() {
    const clouds = document.querySelectorAll(".cloud");
    clouds.forEach((c) => { c.style.animationDuration = "15s"; c.style.opacity = "0.7"; });
  }
  createEnhancedWindEffect(windSpeed) {
    const layer = document.getElementById("windLayer");
    if (!layer) return;
    const count = Math.min(30, Math.floor(windSpeed / 2));
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = windSpeed >= 30 ? "wind-particle strong" : "wind-particle";
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDuration = `${Math.max(1, 3 - windSpeed / 20)}s`;
      p.style.animationDelay = `${Math.random() * 2}s`;
      layer.appendChild(p);
    }
  }
  createMistEffect() {
    const layer = document.getElementById("atmosphericEffects");
    if (!layer) return;
    const mist = document.createElement("div");
    mist.style.cssText = `
      position:absolute;top:0;left:0;width:100%;height:100%;
      background:linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0.05) 100%);
      pointer-events:none;animation:mistDrift 15s ease-in-out infinite;
    `;
    layer.appendChild(mist);
  }
  createSunRayEffect() {
    const sun = document.getElementById("sun");
    if (!sun) return;
    const rays = sun.querySelector(".sun-rays");
    if (rays) {
      rays.style.opacity = "1";
      rays.style.animation = "sunRays 12s linear infinite";
    }
  }
  createFrostEffect() {
    const layer = document.getElementById("atmosphericEffects");
    if (!layer) return;
    for (let i = 0; i < 15; i++) {
      const frost = document.createElement("div");
      frost.style.cssText = `
        position:absolute;width:3px;height:3px;background:rgba(255,255,255,0.8);
        border-radius:50%;top:${Math.random() * 100}%;left:${Math.random() * 100}%;
        animation:twinkle 3s ease-in-out infinite;animation-delay:${Math.random() * 3}s;
      `;
      layer.appendChild(frost);
    }
  }
  createStars(cloudCover = 0) {
    const stars = document.getElementById("stars");
    if (!stars) return;
    stars.classList.add("visible");
    stars.innerHTML = "";
    const count = Math.max(50, 150 - cloudCover / 1.5);
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      const b = Math.random();
      star.className = `star ${b > 0.8 ? "bright" : b > 0.4 ? "normal" : "dim"}`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 60}%`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      if (this.intersectionObserver) this.intersectionObserver.observe(star);
      stars.appendChild(star);
    }
  }
  getOrCreateParticle(type, container) {
    const key = type.replace("-", "") + "s";
    const pool = this.particlePools[key];
    if (pool && pool.length) {
      const el = pool.pop();
      container.appendChild(el);
      return el;
    }
    const el = document.createElement("div");
    container.appendChild(el);
    return el;
  }
  returnParticleToPool(particle) {
    particle.style.display = "none";
    particle.className = "";
    const keys = Object.keys(this.particlePools);
    const key = keys.find((k) => this.particlePools[k].length < 50);
    if (key) this.particlePools[key].push(particle);
    else if (particle.parentNode) particle.parentNode.removeChild(particle);
  }

  updateTemperatureTheming(temperature) {
    const root = document.documentElement;
    if (temperature >= 30) {
      root.style.setProperty("--weather-primary", "#FF6B35");
      root.style.setProperty("--weather-secondary", "#F7931E");
    } else if (temperature >= 20) {
      root.style.setProperty("--weather-primary", "#87CEEB");
      root.style.setProperty("--weather-secondary", "#98D8E8");
    } else if (temperature >= 10) {
      root.style.setProperty("--weather-primary", "#87CEEB");
      root.style.setProperty("--weather-secondary", "#B0C4DE");
    } else {
      root.style.setProperty("--weather-primary", "#B0E0E6");
      root.style.setProperty("--weather-secondary", "#ADD8E6");
    }
  }

  //Sound/Haptics
  // updateSoundEffects(weatherCode, windSpeed = 0) {
  //   if (!this.soundEnabled) return;
  //   const info = this.weatherCodes[weatherCode] || this.weatherCodes[0];
  //   const effects = info.effects || [];
  //   // this.stopAllSounds();
  //   if (effects.includes("moderate-rain") || effects.includes("heavy-rain") || effects.includes("stormy-rain")) {
  //     console.log("Playing enhanced rain sound");
  //   }
  //   if (effects.includes("lightning") || effects.includes("thunder")) {
  //     console.log("Playing thunder/lightning sound");
  //   }
  //   if (windSpeed >= 15) {
  //     console.log("Playing wind sound");
  //   }
  //   if (effects.includes("fog")) {
  //     console.log("Playing ambient fog sound");
  //   }
  // }
  // stopAllSounds() {
  //   console.log("Stopping all sound effects");
  // }
  // simulateHapticFeedback(intensity) {
  //   if (!("vibrate" in navigator)) return;
  //   const patterns = {
  //     medium: [100, 50, 100],
  //     strong: [200, 100, 400]
  //   };
  //   navigator.vibrate(patterns[intensity] || patterns.medium);
  // }

  createGodRays() {
    const sun = document.getElementById("sun");
    if (!sun) return;

    let container = document.getElementById("godRayContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "godRayContainer";
        container.className = "god-ray-container";
        document.getElementById("backgroundContainer").appendChild(container);
    }
    container.innerHTML = "";

    const sunRect = sun.getBoundingClientRect();
    const sunX = sunRect.left + sunRect.width / 2;
    const sunY = sunRect.top + sunRect.height / 2;

    for (let i = 0; i < 12; i++) {
        const ray = document.createElement("div");
        ray.className = "ray";
        ray.style.left = `${sunX}px`;
        ray.style.top = `${sunY}px`;
        ray.style.transform = `rotate(${(i - 6) * 8}deg) scaleY(1)`;
        ray.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(ray);
    }
}

  showLoading(message = "Loading...") {
    this.isLoading = true;
    const lc = document.getElementById("loadingContainer");
    const mc = document.getElementById("mainContent");
    const ec = document.getElementById("errorContainer");
    if (lc) lc.classList.remove("hidden");
    if (mc) mc.classList.add("hidden");
    if (ec) ec.classList.add("hidden");
    this.updateLoadingMessage(message);
  }
  updateLoadingMessage(message) {
    const m = document.getElementById("loadingMessage");
    if (m) m.textContent = message;
  }
  hideLoading() {
    this.isLoading = false;
    const lc = document.getElementById("loadingContainer");
    const mc = document.getElementById("mainContent");
    if (lc) lc.classList.add("hidden");
    if (mc) mc.classList.remove("hidden");
  }
  showError(message) {
    this.isLoading = false;
    console.error("Showing error:", message);
    const em = document.getElementById("errorMessage");
    const ec = document.getElementById("errorContainer");
    const lc = document.getElementById("loadingContainer");
    const mc = document.getElementById("mainContent");
    if (em) em.textContent = message;
    if (ec) ec.classList.remove("hidden");
    if (lc) lc.classList.add("hidden");
    if (mc) mc.classList.add("hidden");
  }
  updateLastUpdated() {
    const el = document.getElementById("lastUpdated");
    if (el) {
      const now = new Date();
      el.textContent = `Updated ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    }
  }

//Connectivity/Visibiliy
  handleOnlineStatus(isOnline) {
    if (isOnline) {
      this.weatherData = null;
      console.log("Connection restored, fetching weather data...");
      this.detectLocationWithIPFirst();
    } else {
      console.log("Device is offline");
    }
  }
  handleVisibilityChange() {
    if (!document.hidden && this.weatherData) {
      const last = this.cache.timestamp || 0;
      if (Date.now() - last > 10 * 60 * 1000) this.refreshWeatherData();
    }
  }
}

//Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing EnvironmentReader...");
  try {
    window.environmentReader = new EnvironmentReader();
    window.environmentReader.init();
  } catch (e) {
    console.error("Failed to initialize EnvironmentReader", e);
  }
  document.addEventListener("submit", (e) => e.preventDefault());

  const dynamicStyles = document.createElement("style");
  dynamicStyles.textContent = `
    @keyframes mistDrift { 0%,100% { transform: translateX(-5%) translateY(0); opacity: 0.7; } 50% { transform: translateX(5%) translateY(-5px); opacity: 0.9; } }
    @keyframes twinkle { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
    @keyframes sunRays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(dynamicStyles);
});

window.addEventListener("error", (e) => console.error("Global error:", e.error));
window.addEventListener("unhandledrejection", (e) => console.error("Unhandled promise rejection:", e.reason));