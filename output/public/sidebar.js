/**
 * Sidebar UI Controller
 * This is the main entry point for the sidebar panel
 */

import { WidgetAPIs } from "../src/api/notifications.js";

console.log("[Widget] Sidebar loaded");

// API Configuration
const API_CONFIG = {
  notifications: "https://api.example.com/notifications",
  weather: "https://api.example.com/weather",
  stocks: "https://api.example.com/stocks",
  time: "https://api.example.com/time",
  videos: "https://api.example.com/videos",
  images: "https://api.example.com/images",
};

// Global sidebar state
const sidebarState = {
  currentTab: "widgets",
  settings: null,
  notifications: [],
  bookmarks: [],
  activeMedia: null,
  feedItems: [],
  widgetOrder: ["notifications", "weather", "stocks", "videos", "images"],
  widgetSettings: {
    notifications: true,
    weather: true,
    stocks: true,
    videos: true,
    images: true,
  },
};

const WIDGET_DEFS = {
  notifications: { label: "📬 알림" },
  weather: { label: "🌤️ 날씨" },
  stocks: { label: "📈 주식" },
  videos: { label: "▶️ 비디오" },
  images: { label: "🖼️ 이미지" },
};

function normalizeWidgetOrder(order) {
  const defaultOrder = Object.keys(WIDGET_DEFS);
  if (!Array.isArray(order)) return [...defaultOrder];

  const seen = new Set();
  const normalized = [];
  for (const key of order) {
    if (defaultOrder.includes(key) && !seen.has(key)) {
      seen.add(key);
      normalized.push(key);
    }
  }
  for (const key of defaultOrder) {
    if (!seen.has(key)) normalized.push(key);
  }
  return normalized;
}

function renderWidgetSettingsList() {
  const listEl = document.getElementById("widgetSettingsList");
  if (!listEl) return;

  const order = normalizeWidgetOrder(sidebarState.widgetOrder);
  sidebarState.widgetOrder = order;

  listEl.innerHTML = order
    .map((key, index) => {
      const def = WIDGET_DEFS[key];
      if (!def) return "";
      const checkboxId = `toggle-${key}`;
      const isFirst = index === 0;
      const isLast = index === order.length - 1;
      return `
        <div class="widget-checkbox" data-widget-key="${key}">
          <input type="checkbox" data-widget-key="${key}" id="${checkboxId}" ${
        sidebarState.widgetSettings[key] ? "checked" : ""
      }>
          <label for="${checkboxId}">${def.label}</label>
          <div class="widget-order-controls">
            <button type="button" class="widget-order-btn" data-widget-key="${key}" data-move="up" ${
        isFirst ? "disabled" : ""
      } aria-label="위로 이동">▲</button>
            <button type="button" class="widget-order-btn" data-widget-key="${key}" data-move="down" ${
        isLast ? "disabled" : ""
      } aria-label="아래로 이동">▼</button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function persistWidgetOrder() {
  try {
    await chrome.storage.sync.set({ widgetOrder: sidebarState.widgetOrder });
  } catch (e) {
    console.warn("[Widget] Failed to persist widgetOrder", e);
  }
}

// Initialize sidebar
async function initSidebar() {
  try {
    console.log("[Widget] Initializing sidebar...");

    // Load settings from storage
    const result = await chrome.storage.sync.get([
      "settings",
      "widgetSettings",
      "widgetOrder",
    ]);
    sidebarState.settings = result.settings;

    // Load widget settings
    if (result.widgetSettings) {
      sidebarState.widgetSettings = result.widgetSettings;
    }

    // Load widget order
    if (result.widgetOrder) {
      sidebarState.widgetOrder = normalizeWidgetOrder(result.widgetOrder);
    } else {
      sidebarState.widgetOrder = normalizeWidgetOrder(sidebarState.widgetOrder);
      await persistWidgetOrder();
    }

    // Initialize UI
    renderSidebar();

    // Setup tab navigation
    setupTabNavigation();

    console.log("[Widget] Sidebar initialized successfully");
  } catch (error) {
    console.error("[Widget] Sidebar init error:", error);
  }
}

/**
 * Render main sidebar UI
 */
function renderSidebar() {
  const root = document.getElementById("root");
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, ".");

  root.innerHTML = `
    <div class="sidebar-container">
      <div class="sidebar-header">
        <span class="header-date">${dateStr}</span>
        <button id="setting" class="setting-btn">⚙️</button>
      </div>

      <div class="sidebar-content">
        <div id="feedContainer" class="feed-container"></div>
      </div>

      <div id="settingsModal" class="settings-modal">
        <div class="settings-modal-content">
          <div class="settings-header">
            <h3>위젯 설정</h3>
            <button id="closeSettings" class="close-btn">✕</button>
          </div>
          <div id="settingsBody" class="settings-body">
            <div id="widgetSettingsList"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  renderWidgetSettingsList();

  // Load feed items
  loadFeed();
}

/**
 * Load and render feed items
 */
async function loadFeed() {
  const container = document.getElementById("feedContainer");
  if (!container) return;

  try {
    const widgetFetchers = {
      notifications: fetchNotifications,
      weather: fetchWeather,
      stocks: fetchStocks,
      videos: fetchVideos,
      images: fetchImages,
    };

    const order = normalizeWidgetOrder(sidebarState.widgetOrder);
    const results = await Promise.all(
      order.map((key) => {
        const fetcher = widgetFetchers[key];
        if (!fetcher) return Promise.resolve([]);
        return sidebarState.widgetSettings[key]
          ? fetcher()
          : Promise.resolve([]);
      })
    );

    const allItems = results.flat();

    sidebarState.feedItems = allItems;

    // Render all items
    container.innerHTML = allItems.map((item) => renderFeedItem(item)).join("");
  } catch (error) {
    console.error("[Widget] Error loading feed:", error);
    container.innerHTML =
      '<div style="padding: 16px; color: #666;">데이터를 불러오는 중에 오류가 발생했습니다.</div>';
  }
}

/**
 * Render individual feed item
 */
function renderFeedItem(item) {
  switch (item.type) {
    case "notification":
      return `
        <div class="feed-card notification-card">
          <div class="card-header">
            <span class="card-icon">${item.icon}</span>
            <div class="card-info">
              <h4>${item.title}</h4>
              <p>${item.subtitle}</p>
            </div>
          </div>
          <div class="card-time">${item.time}</div>
        </div>
      `;
    case "time":
      return `
        <div class="feed-card time-card">
          <h4>${item.title}</h4>
          <p class="time-display">${new Date().toLocaleTimeString("ko-KR")}</p>
          <p class="time-date">${new Date().toLocaleDateString("ko-KR")}</p>
          <span class="card-time">${item.time}</span>
        </div>
      `;
    case "weather":
      return `
        <div class="feed-card weather-card">
          <div class="weather-header">
            <h4>${item.title}</h4>
            <span class="card-icon">${item.icon}</span>
            <h4>${item.title}</h4>
          </div>
          <div class="stock-price">
            <span class="price">${item.price}</span>
            <span class="change">${item.change}</span>
          </div>
          ${
            item.hasChart
              ? '<div class="stock-chart" style="height: 40px; background: #f0f0f0; border-radius: 4px;"></div>'
              : ""
          }
        </div>
      `;
    case "image":
      return `
        <div class="feed-card image-card">
          <img src="${item.imageUrl}" alt="Random" onerror="this.src='https://via.placeholder.com/100?text=Image'" />
        </div>
      `;
    case "video":
      return `
        <div class="feed-card video-card">
          <div class="video-header">
            <span class="card-icon">${item.icon}</span>
            <h4>${item.title}</h4>
          </div>
          <div class="video-thumbnail">
            <img src="${item.thumbnail}" alt="Video" />
          </div>
        </div>
      `;
    default:
      return "";
  }
}
/**
 * API Fetch Functions
 */

// Fetch notifications from API
/** */
async function fetchNotifications() {
  try {
    const response = await fetch(API_CONFIG.notifications);
    if (!response.ok) throw new Error("Notifications API failed");
    return await response.json();
  } catch (error) {
    console.warn("[Widget] Notifications API error:", error);
    // Return sample data as fallback
    return [
      {
        id: "github",
        type: "notification",
        icon: "□",
        title: "Git Hub",
        subtitle:
          "New Pull Request !wantoshome!서서 Pull Request 정하고있습니다.",
        time: "3일 전",
      },
      {
        id: "gmail",
        type: "notification",
        icon: "✉️",
        title: "Gmail",
        subtitle: "Google서비스에서 [편 밀림 알림]을 받으셨습니다.",
        time: "3시간 전",
      },
    ];
  }
}

// Fetch weather from API
async function fetchWeather() {
  try {
    const data = await WidgetAPIs.getWeather();
    if (!data) throw new Error("Weather API failed");

    const temp = Math.round(data.temperature);
    const humid = data.humidity;
    const code = data.weatherCode;

    return [
      {
        id: "weather-ip",
        type: "weather",
        icon: getWeatherIcon(code),
        title: "현재위치날씨",
        temp: `${temp}°C`,
        tempRange: `습도: ${humid}%`,
      },
    ];
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Fetch stocks from API
async function fetchStocks() {
  try {
    const response = await fetch(API_CONFIG.stocks);
    if (!response.ok) throw new Error("Stocks API failed");
    return await response.json();
  } catch (error) {
    console.warn("[Widget] Stocks API error:", error);
    // Return sample data as fallback
    return [
      {
        id: "kakao",
        type: "stock",
        icon: "📈",
        title: "카카오",
        price: "60,900",
        change: "△700",
        hasChart: true,
      },
    ];
  }
}

// Fetch images from API
async function fetchImages() {
  try {
    const response = await fetch(API_CONFIG.images);
    if (!response.ok) throw new Error("Images API failed");
    return await response.json();
  } catch (error) {
    console.warn("[Widget] Images API error:", error);
    // Return sample data as fallback
    return [
      {
        id: "cat",
        type: "image",
        icon: "🐱",
        imageUrl: "https://api.thecatapi.com/v1/images/search",
      },
    ];
  }
}

function setupTabNavigation() {
  const settingBtn = document.getElementById("setting");
  const settingsModal = document.getElementById("settingsModal");
  const closeBtn = document.getElementById("closeSettings");
  const settingsBody = document.getElementById("settingsBody");

  // Open settings modal
  if (settingBtn) {
    settingBtn.addEventListener("click", () => {
      settingsModal.classList.add("active");
    });
  }

  // Close settings modal
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      settingsModal.classList.remove("active");
    });
  }

  // Close modal when clicking outside
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove("active");
      }
    });
  }

  if (settingsBody) {
    settingsBody.addEventListener("change", async (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "checkbox") return;
      const key = target.dataset.widgetKey;
      if (!key || !(key in sidebarState.widgetSettings)) return;

      sidebarState.widgetSettings[key] = target.checked;
      await chrome.storage.sync.set({
        widgetSettings: sidebarState.widgetSettings,
      });
      loadFeed();
    });

    settingsBody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-move][data-widget-key]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const key = btn.dataset.widgetKey;
      const move = btn.dataset.move;
      if (!key || (move !== "up" && move !== "down")) return;

      const order = normalizeWidgetOrder(sidebarState.widgetOrder);
      const index = order.indexOf(key);
      if (index === -1) return;

      const delta = move === "up" ? -1 : 1;
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= order.length) return;

      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      sidebarState.widgetOrder = order;
      await persistWidgetOrder();
      renderWidgetSettingsList();
      loadFeed();
    });
  }
}

/**
 * Helper: Get widget title
 */
function getWidgetTitle(type) {
  const titles = {
    weather: "날씨",
    stocks: "주식",
    clock: "시계",
    todo: "할 일",
    random_image: "이미지",
    media_control: "미디어 제어",
  };
  return titles[type] || type;
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 99) return "⛈️";
  return "❓";
}

// Initialize sidebar when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSidebar);
} else {
  initSidebar();
}
