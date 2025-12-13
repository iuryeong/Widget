/**
 * Sidebar UI Controller
 * This is the main entry point for the sidebar panel
 */

console.log('[Widget] Sidebar loaded');

// API Configuration
const API_CONFIG = {
  notifications: 'https://api.example.com/notifications',
  weather: 'https://api.example.com/weather',
  stocks: 'https://api.example.com/stocks',
  time: 'https://api.example.com/time',
  messages: 'https://api.example.com/messages',
  videos: 'https://api.example.com/videos',
  images: 'https://api.example.com/images',
};

// Global sidebar state
const sidebarState = {
  currentTab: 'widgets',
  settings: null,
  notifications: [],
  bookmarks: [],
  activeMedia: null,
  feedItems: [],
  widgetSettings: {
    notifications: true,
    weather: true,
    stocks: true,
    messages: true,
    videos: true,
    images: true,
  },
};

// Initialize sidebar
async function initSidebar() {
  try {
    console.log('[Widget] Initializing sidebar...');
    
    // Load settings from storage
    const result = await chrome.storage.sync.get(['settings', 'widgetSettings']);
    sidebarState.settings = result.settings;
    
    // Load widget settings
    if (result.widgetSettings) {
      sidebarState.widgetSettings = result.widgetSettings;
    }

    // Initialize UI
    renderSidebar();

    // Setup tab navigation
    setupTabNavigation();
    
    console.log('[Widget] Sidebar initialized successfully');
  } catch (error) {
    console.error('[Widget] Sidebar init error:', error);
  }
}

/**
 * Render main sidebar UI
 */
function renderSidebar() {
  const root = document.getElementById('root');
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '.');
  
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
          <div class="settings-body">
            <div class="widget-checkbox">
              <input type="checkbox" id="toggle-notifications" ${sidebarState.widgetSettings.notifications ? 'checked' : ''}>
              <label for="toggle-notifications">📬 알림</label>
            </div>
            <div class="widget-checkbox">
              <input type="checkbox" id="toggle-weather" ${sidebarState.widgetSettings.weather ? 'checked' : ''}>
              <label for="toggle-weather">🌤️ 날씨</label>
            </div>
            <div class="widget-checkbox">
              <input type="checkbox" id="toggle-stocks" ${sidebarState.widgetSettings.stocks ? 'checked' : ''}>
              <label for="toggle-stocks">📈 주식</label>
            </div>
            <div class="widget-checkbox">
              <input type="checkbox" id="toggle-messages" ${sidebarState.widgetSettings.messages ? 'checked' : ''}>
              <label for="toggle-messages">💬 메시지</label>
            </div>
            <div class="widget-checkbox">
              <input type="checkbox" id="toggle-videos" ${sidebarState.widgetSettings.videos ? 'checked' : ''}>
              <label for="toggle-videos">▶️ 비디오</label>
            </div>
            <div class="widget-checkbox">
              <input type="checkbox" id="toggle-images" ${sidebarState.widgetSettings.images ? 'checked' : ''}>
              <label for="toggle-images">🖼️ 이미지</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load feed items
  loadFeed();
}

/**
 * Load and render feed items
 */
async function loadFeed() {
  const container = document.getElementById('feedContainer');
  if (!container) return;

  try {
    // Fetch data from APIs in parallel
    const results = await Promise.all([
      sidebarState.widgetSettings.notifications ? fetchNotifications() : Promise.resolve([]),
      sidebarState.widgetSettings.weather ? fetchWeather() : Promise.resolve([]),
      sidebarState.widgetSettings.stocks ? fetchStocks() : Promise.resolve([]),
      sidebarState.widgetSettings.messages ? fetchMessages() : Promise.resolve([]),
      sidebarState.widgetSettings.videos ? fetchVideos() : Promise.resolve([]),
      sidebarState.widgetSettings.images ? fetchImages() : Promise.resolve([]),
    ]);

    // Combine all items
    const allItems = [
      ...results[0],
      ...results[1],
      ...results[2],
      ...results[3],
      ...results[4],
      ...results[5],
    ];

    sidebarState.feedItems = allItems;
    
    // Render all items
    container.innerHTML = allItems
      .map((item) => renderFeedItem(item))
      .join('');
  } catch (error) {
    console.error('[Widget] Error loading feed:', error);
    container.innerHTML = '<div style="padding: 16px; color: #666;">데이터를 불러오는 중에 오류가 발생했습니다.</div>';
  }
}

/**
 * Render individual feed item
 */
function renderFeedItem(item) {
  switch (item.type) {
    case 'notification':
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
    case 'time':
      return `
        <div class="feed-card time-card">
          <h4>${item.title}</h4>
          <p class="time-display">${new Date().toLocaleTimeString('ko-KR')}</p>
          <p class="time-date">${new Date().toLocaleDateString('ko-KR')}</p>
          <span class="card-time">${item.time}</span>
        </div>
      `;
    case 'weather':
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
    case 'stock':
      return `
        <div class="feed-card stock-card">
          <div class="stock-header">
            <span class="card-icon">${item.icon}</span>
            <h4>${item.title}</h4>
          </div>
          <div class="stock-price">
            <span class="price">${item.price}</span>
            <span class="change">${item.change}</span>
          </div>
          ${item.hasChart ? '<div class="stock-chart" style="height: 40px; background: #f0f0f0; border-radius: 4px;"></div>' : ''}
        </div>
      `;
    case 'image':
      return `
        <div class="feed-card image-card">
          <img src="${item.imageUrl}" alt="Random" onerror="this.src='https://via.placeholder.com/100?text=Image'" />
        </div>
      `;
    case 'message':
      return `
        <div class="feed-card message-card">
          <div class="message-content">
            <span class="card-icon">${item.icon}</span>
            <p>${item.text}</p>
          </div>
          <p class="sender">${item.sender}</p>
        </div>
      `;
    case 'video':
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
      return '';
  }
}

/**
 * API Fetch Functions
 */

// Fetch notifications from API
async function fetchNotifications() {
  try {
    const response = await fetch(API_CONFIG.notifications);
    if (!response.ok) throw new Error('Notifications API failed');
    return await response.json();
  } catch (error) {
    console.warn('[Widget] Notifications API error:', error);
    // Return sample data as fallback
    return [
      {
        id: 'github',
        type: 'notification',
        icon: '□',
        title: 'Git Hub',
        subtitle: 'New Pull Request !wantoshome!서서 Pull Request 정하고있습니다.',
        time: '3일 전'
      },
      {
        id: 'gmail',
        type: 'notification',
        icon: '✉️',
        title: 'Gmail',
        subtitle: 'Google서비스에서 [편 밀림 알림]을 받으셨습니다.',
        time: '3시간 전'
      }
    ];
  }
}

// Fetch weather from API
async function fetchWeather() {
  try {
    const response = await fetch(API_CONFIG.weather);
    if (!response.ok) throw new Error('Weather API failed');
    return await response.json();
  } catch (error) {
    console.warn('[Widget] Weather API error:', error);
    // Return sample data as fallback
    return [
      {
        id: 'weather',
        type: 'weather',
        icon: '🌤️',
        title: '제주특별자치 아라동',
        temp: '3°',
        tempRange: '최고 5° 최저 -1°'
      }
    ];
  }
}

// Fetch stocks from API
async function fetchStocks() {
  try {
    const response = await fetch(API_CONFIG.stocks);
    if (!response.ok) throw new Error('Stocks API failed');
    return await response.json();
  } catch (error) {
    console.warn('[Widget] Stocks API error:', error);
    // Return sample data as fallback
    return [
      {
        id: 'kakao',
        type: 'stock',
        icon: '📈',
        title: '카카오',
        price: '60,900',
        change: '△700',
        hasChart: true
      }
    ];
  }
}

// Fetch messages from API
async function fetchMessages() {
  try {
    const response = await fetch(API_CONFIG.messages);
    if (!response.ok) throw new Error('Messages API failed');
    return await response.json();
  } catch (error) {
    console.warn('[Widget] Messages API error:', error);
    // Return sample data as fallback
    return [
      {
        id: 'message',
        type: 'message',
        icon: '💬',
        text: '좋은 아침입니다. WooRyeong!',
        sender: '프로필'
      }
    ];
  }
}

// Fetch videos from API
async function fetchVideos() {
  try {
    const response = await fetch(API_CONFIG.videos);
    if (!response.ok) throw new Error('Videos API failed');
    return await response.json();
  } catch (error) {
    console.warn('[Widget] Videos API error:', error);
    // Return sample data as fallback
    return [
      {
        id: 'youtube',
        type: 'video',
        icon: '▶️',
        title: '[무한도전] 사냥꾼',
        thumbnail: 'https://via.placeholder.com/100x100?text=Video'
      }
    ];
  }
}

// Fetch images from API
async function fetchImages() {
  try {
    const response = await fetch(API_CONFIG.images);
    if (!response.ok) throw new Error('Images API failed');
    return await response.json();
  } catch (error) {
    console.warn('[Widget] Images API error:', error);
    // Return sample data as fallback
    return [
      {
        id: 'cat',
        type: 'image',
        icon: '🐱',
        imageUrl: 'https://api.thecatapi.com/v1/images/search'
      }
    ];
  }
}

function setupTabNavigation() {
  const settingBtn = document.getElementById('setting');
  const settingsModal = document.getElementById('settingsModal');
  const closeBtn = document.getElementById('closeSettings');

  // Open settings modal
  if (settingBtn) {
    settingBtn.addEventListener('click', () => {
      settingsModal.classList.add('active');
    });
  }

  // Close settings modal
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      settingsModal.classList.remove('active');
    });
  }

  // Close modal when clicking outside
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
      }
    });
  }

  // Handle widget toggles
  const toggles = {
    'toggle-notifications': 'notifications',
    'toggle-weather': 'weather',
    'toggle-stocks': 'stocks',
    'toggle-messages': 'messages',
    'toggle-videos': 'videos',
    'toggle-images': 'images',
  };

  Object.entries(toggles).forEach(([elementId, settingKey]) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('change', (e) => {
        sidebarState.widgetSettings[settingKey] = e.target.checked;
        
        // Save to storage
        chrome.storage.sync.set({ widgetSettings: sidebarState.widgetSettings });
        
        // Reload feed
        loadFeed();
      });
    }
  });
}

/**
 * Helper: Get widget title
 */
function getWidgetTitle(type) {
  const titles = {
    weather: '날씨',
    stocks: '주식',
    clock: '시계',
    todo: '할 일',
    random_image: '이미지',
    media_control: '미디어 제어',
  };
  return titles[type] || type;
}

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}
