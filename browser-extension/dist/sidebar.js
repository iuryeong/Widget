/**
 * Sidebar UI Controller
 * - 날씨: 실제 API 사용 (WidgetAPIs)
 * - 나머지: 테스트용 더미 데이터 사용
 */

console.log('[Widget] Sidebar loaded');

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
    
    // Load settings from storage (에러 방지용 예외처리)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      const result = await chrome.storage.sync.get(['settings', 'widgetSettings']);
      sidebarState.settings = result.settings;
      
      if (result.widgetSettings) {
        sidebarState.widgetSettings = result.widgetSettings;
      }
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
  if (!root) return;

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
    
    if (allItems.length === 0) {
        container.innerHTML = '<div style="padding:16px; text-align:center; color:#666">활성화된 위젯이 없습니다.</div>';
    } else {
        container.innerHTML = allItems
        .map((item) => renderFeedItem(item))
        .join('');
    }

  } catch (error) {
    console.error('[Widget] Error loading feed:', error);
    container.innerHTML = '<div style="padding: 16px; color: #666;">데이터 로딩 중 오류가 발생했습니다.</div>';
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
      const colorStyle = item.changeColor 
        ? `color: ${item.changeColor}` 
        : `color:${item.change.includes('▲') || item.change.includes('△') ? '#d32f2f' : '#1976d2'}`;

      // [핵심 로직] 개장 전이면 텍스트, 아니면 이미지
      let chartArea = '';
      if (item.isPreMarket) {
        chartArea = `
          <div style="height: 40px; background: #f8f9fa; border-radius: 4px; margin-top: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #888;">
            😴 개장 전입니다 (09:00 오픈)
          </div>`;
      } else {
        // 네이버 차트 이미지를 꽉 차게 보여줍니다.
        chartArea = `
          <div style="margin-top: 8px; text-align: center;">
            <img src="${item.chartUrl}?t=${new Date().getTime()}" alt="차트" style="width: 100%; height: auto; border-radius: 4px;" />
          </div>`;
      }

      return `
        <div class="feed-card stock-card">
          <div class="stock-header">
            <span class="card-icon">${item.icon}</span>
            <h4>${item.title}</h4>
          </div>
          <div class="stock-price">
            <span class="price">${item.price}</span>
            <span class="change" style="${colorStyle}">${item.change}</span>
          </div>
          ${chartArea}
        </div>
      `;

    case 'image':
      return `
        <div class="feed-card image-card">
          <img src="${item.imageUrl}" alt="Random" style="width:100%; border-radius:8px;" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
        </div>
      `;
    case 'message':
      return `
        <div class="feed-card message-card">
          <div class="message-content">
            <span class="card-icon">${item.icon}</span>
            <p>${item.text}</p>
          </div>
          <p class="sender" style="font-size:12px; color:#888; margin-top:5px;">${item.sender}</p>
        </div>
      `;
      
    case 'video':
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
      return '';
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
    if (typeof WidgetAPIs === 'undefined') {
        console.warn('WidgetAPIs not found');
        throw new Error('API not loaded');
    }

    const data = await WidgetAPIs.getWeather();
    if (!data) throw new Error('Weather API failed');

    const temp = Math.round(data.temperature);
    const humid = data.humidity;
    const code = data.weatherCode;
    // const lat = data.locationInfo.lat;
    // const lon = data.locationInfo.lon;

    return [
      {
        id: 'weather-real',
        type: 'weather',
        icon: getWeatherIcon(code),
        title: '현재 위치 날씨', // 정확한 동이름은 API가 필요하므로 일단 '현재 위치'로 표시
        temp: `${temp}°C`,
        tempRange: `습도: ${humid}%`
      }
    ];
  } catch (error) {
    console.error('Weather load error:', error);
    // 실패 시 보여줄 기본값
    return [
      {
        id: 'weather-fallback',
        type: 'weather',
        icon: '🌦️',
        title: '날씨 정보 없음',
        temp: '-',
        tempRange: '로딩 실패'
      }
    ];
  }
}

// 2. Notifications (Dummy)
async function fetchNotifications() {
  return [
    {
      id: 'github',
      type: 'notification',
      icon: '🐙',
      title: 'GitHub',
      subtitle: 'New Pull Request !wantoshome!',
      time: '3일 전'
    },
    {
      id: 'gmail',
      type: 'notification',
      icon: '✉️',
      title: 'Gmail',
      subtitle: 'Google서비스에서 [편 밀림 알림]',
      time: '3시간 전'
    }
  ];
}

// 3. Stocks
async function fetchStocks() {
  try {
    const now = new Date();
    const hours = now.getHours();

    const isPreMarket = hours < 9;
    
    const response = await fetch('https://finance.naver.com/item/main.naver?code=035720');
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const priceElement = doc.querySelector('.no_today .blind');
    const price = priceElement ? priceElement.innerText : '-';

    const marketInfo = doc.querySelector('.no_exday');
    let changeAmount = '0';
    let changeSymbol = ''; // ▲ 또는 ▼
    let changeColor = '#333'; // 기본 검정
    
    if (marketInfo) {
      // 변동 가격 추출
      const blinds = marketInfo.querySelectorAll('.blind');
      if (blinds.length > 0) changeAmount = blinds[0].innerText;

      // 상승/하락 여부 판단 (클래스명으로 확인)
      const htmlContent = marketInfo.innerHTML;
      if (htmlContent.includes('ico_up')) {
        changeSymbol = '▲';
        changeColor = '#d32f2f'; // 빨강 (상승)
      } else if (htmlContent.includes('ico_down')) {
        changeSymbol = '▼';
        changeColor = '#1976d2'; // 파랑 (하락)
      }
    }

  return [
    {
      id: 'kakao',
      type: 'stock',
      icon: '📈',
      title: '카카오',
      price: `${price}원`,
      change: `${changeSymbol} ${changeAmount}`,
      changeColor: changeColor,
      isPreMarket: isPreMarket,
      chartUrl: 'https://ssl.pstatic.net/imgfinance/chart/mobile/mini/035720.png' 
    },
  ];
} catch (error) {
    console.error('Stock fetch error:', error);
    return [
      {
        id: 'kakao-fail', type: 'stock', icon: '⚠️', title: '카카오',
      price: '-', change: '로딩 실패', changeColor: '#999',
      isPreMarket: false, chartUrl: ''
      },
    ];
  } 
}

// 4. Messages (Dummy)
async function fetchMessages() {
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

// 5. Videos (Dummy)
async function fetchVideos() {
  return [
    {
      id: 'youtube',
      type: 'video',
      icon: '▶️',
      title: '[무한도전] 사냥꾼',
      thumbnail: 'https://via.placeholder.com/300x160/000000/FFFFFF?text=YouTube+Video'
    }
  ];
}

// 6. Images (Dummy)
async function fetchImages() {
  return [
    {
      id: 'cat',
      type: 'image',
      icon: '🐱',
      imageUrl: 'https://via.placeholder.com/300x200?text=Random+Image'
    }
  ];
}

/**
 * Event Listeners & Helpers
 */
function setupTabNavigation() {
  const settingBtn = document.getElementById('setting');
  const settingsModal = document.getElementById('settingsModal');
  const closeBtn = document.getElementById('closeSettings');

  if (settingBtn) {
    settingBtn.addEventListener('click', () => {
      settingsModal.classList.add('active');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      settingsModal.classList.remove('active');
    });
  }

  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
      }
    });
  }

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
        if(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ widgetSettings: sidebarState.widgetSettings });
        }
        loadFeed();
      });
    }
  });
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️'; 
  if (code <= 3) return '⛅'; 
  if (code <= 48) return '🌫️'; 
  if (code <= 67) return '🌧️'; 
  if (code <= 77) return '🌨️'; 
  if (code <= 82) return '🌧️'; 
  if (code <= 99) return '⛈️'; 
  return '❓';
}

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}