/**
 * Sidebar UI Controller
 * - 날씨: 실제 API 사용 (WidgetAPIs)
 * - 나머지: 테스트용 더미 데이터 사용
 */

console.log("[Widget] Sidebar loaded");

// Global sidebar state
const sidebarState = {
  currentTab: "widgets",
  settings: null,
  notifications: [],
  bookmarks: [],
  activeMedia: null,
  feedItems: [],
  widgetOrder: [
    "notifications",
    "weather",
    "stocks",
    "videos",
    "images",
  ],
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
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.sync
    ) {
      await chrome.storage.sync.set({ widgetOrder: sidebarState.widgetOrder });
    }
  } catch (e) {
    console.warn("[Widget] Failed to persist widgetOrder", e);
  }
}

// Initialize sidebar
async function initSidebar() {
  try {
    console.log("[Widget] Initializing sidebar...");

    // Load settings from storage (에러 방지용 예외처리)
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.sync
    ) {
      const result = await chrome.storage.sync.get([
        "settings",
        "widgetSettings",
        "widgetOrder",
      ]);
      sidebarState.settings = result.settings;

      if (result.widgetSettings) {
        sidebarState.widgetSettings = result.widgetSettings;
      }

      if (result.widgetOrder) {
        sidebarState.widgetOrder = normalizeWidgetOrder(result.widgetOrder);
      } else {
        sidebarState.widgetOrder = normalizeWidgetOrder(
          sidebarState.widgetOrder
        );
        await persistWidgetOrder();
      }
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
  if (!root) return;

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

    if (allItems.length === 0) {
      container.innerHTML =
        '<div style="padding:16px; text-align:center; color:#666">활성화된 위젯이 없습니다.</div>';
    } else {
      container.innerHTML = allItems
        .map((item) => renderFeedItem(item))
        .join("");
    }
  } catch (error) {
    console.error("[Widget] Error loading feed:", error);
    container.innerHTML =
      '<div style="padding: 16px; color: #666;">데이터 로딩 중 오류가 발생했습니다.</div>';
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
    case "weather":
      return `
        <div class="feed-card weather-card">
          <div class="weather-header">
            <h4>${item.title}</h4>
            <span class="card-icon">${item.icon}</span>
          </div>
          <p class="weather-temp">${item.temp}</p>
          <p class="weather-range">${item.tempRange}</p>
        </div>
      `;
    case "stock":
      return `
        <div class="feed-card stock-card">
          <div class="stock-header">
            <span class="card-icon">${item.icon}</span>
            <h4>${item.title}</h4>
          </div>
          <div class="stock-price">
            <span class="price">${item.price}</span>
            <span class="change" style="color:${
              item.change.includes("▲") || item.change.includes("△")
                ? "#d32f2f"
                : "#1976d2"
            }">${item.change}</span>
          </div>
          ${
            item.hasChart
              ? '<div class="stock-chart" style="height: 40px; background: #f0f0f0; border-radius: 4px; margin-top:8px;"></div>'
              : ""
          }
        </div>
      `;
    case "image":
      return `
        <div class="feed-card image-card">
          <img src="${item.imageUrl}" alt="Random" style="width:100%; border-radius:8px;" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
        </div>
      `;
    case "video":
      return `
        <div class="feed-card video-card">
          <div class="video-header">
            <span class="card-icon">${item.icon}</span>
            <h4>${item.title}</h4>
          </div>
          <div class="video-thumbnail" style="margin-top:8px;">
            <img src="${item.thumbnail}" alt="Video" style="width:100%; border-radius:8px;" />
          </div>
        </div>
      `;
    default:
      return "";
  }
}

/**
 * =================================================
 * API Fetch Functions
 * 날씨: 실제 데이터 사용 (WidgetAPIs)
 * 나머지: 더미 데이터 사용 (에러 방지)
 * =================================================
 */

// 1. Weather (실제 로직 유지)
async function fetchWeather() {
  try {
    // notifications.js가 먼저 로드되었는지 확인
    if (typeof WidgetAPIs === "undefined") {
      console.warn("WidgetAPIs not found");
      throw new Error("API not loaded");
    }

    const data = await WidgetAPIs.getWeather();
    if (!data) throw new Error("Weather API failed");

    const temp = Math.round(data.temperature);
    const humid = data.humidity;
    const code = data.weatherCode;
    // const lat = data.locationInfo.lat;
    // const lon = data.locationInfo.lon;

    return [
      {
        id: "weather-real",
        type: "weather",
        icon: getWeatherIcon(code),
        title: "현재 위치 날씨", // 정확한 동이름은 API가 필요하므로 일단 '현재 위치'로 표시
        temp: `${temp}°C`,
        tempRange: `습도: ${humid}%`,
      },
    ];
  } catch (error) {
    console.error("Weather load error:", error);
    // 실패 시 보여줄 기본값
    return [
      {
        id: "weather-fallback",
        type: "weather",
        icon: "🌦️",
        title: "날씨 정보 없음",
        temp: "-",
        tempRange: "로딩 실패",
      },
    ];
  }
}

// 2. Notifications (Dummy)
async function fetchNotifications() {
  return [
    {
      id: "github",
      type: "notification",
      icon: "🐙",
      title: "GitHub",
      subtitle: "New Pull Request !wantoshome!",
      time: "3일 전",
    },
    {
      id: "gmail",
      type: "notification",
      icon: "✉️",
      title: "Gmail",
      subtitle: "Google서비스에서 [편 밀림 알림]",
      time: "3시간 전",
    },
  ];
}

// 3. Stocks (Dummy)
async function fetchStocks() {
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
    {
      id: "samsung",
      type: "stock",
      icon: "📉",
      title: "삼성전자",
      price: "72,100",
      change: "▼500",
      hasChart: false,
    },
  ];
}

// 5. Videos (Dummy)
async function fetchVideos() {
  return [
    {
      id: "youtube",
      type: "video",
      icon: "▶️",
      title: "[무한도전] 사냥꾼",
      thumbnail:
        "https://via.placeholder.com/300x160/000000/FFFFFF?text=YouTube+Video",
    },
  ];
}

// 6. Images (Dummy)
async function fetchImages() {
  return [
    {
      id: "cat",
      type: "image",
      icon: "🐱",
      imageUrl: "https://via.placeholder.com/300x200?text=Random+Image",
    },
  ];
}

/**
 * Event Listeners & Helpers
 */
function setupTabNavigation() {
  const settingBtn = document.getElementById("setting");
  const settingsModal = document.getElementById("settingsModal");
  const closeBtn = document.getElementById("closeSettings");
  const settingsBody = document.getElementById("settingsBody");

  if (settingBtn) {
    settingBtn.addEventListener("click", () => {
      settingsModal.classList.add("active");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      settingsModal.classList.remove("active");
    });
  }

  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove("active");
      }
    });
  }

  if (settingsBody) {
    settingsBody.addEventListener("change", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "checkbox") return;
      const key = target.dataset.widgetKey;
      if (!key || !(key in sidebarState.widgetSettings)) return;

      sidebarState.widgetSettings[key] = target.checked;
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.sync
      ) {
        chrome.storage.sync.set({
          widgetSettings: sidebarState.widgetSettings,
        });
      }
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
