/**
 * Sidebar UI Controller
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
        
        <div style="display: flex; gap: 8px;">
          
          <button id="setting" class="setting-btn" title="위젯 설정">⚙️</button>
        </div>
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
      (sidebarState.widgetSettings.memo !== false) ? fetchMemo() : Promise.resolve([]),
      sidebarState.widgetSettings.weather ? fetchWeather() : Promise.resolve([]),
      sidebarState.widgetSettings.stocks ? fetchStocks() : Promise.resolve([]),
      sidebarState.widgetSettings.videos ? fetchVideos() : Promise.resolve([]),
      sidebarState.widgetSettings.images ? fetchImages() : Promise.resolve([]),
      sidebarState.widgetSettings.messages ? fetchMessages() : Promise.resolve([]),
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
      let chartArea = '';
      if (item.isPreMarket) {
        chartArea = `
          <div style="height: 40px; background: #f8f9fa; border-radius: 4px; margin-top: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #888;">
            😴 개장 전 (09:00 오픈)
          </div>`;
      } else {
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
            <span class="price" style="color: ${item.changeColor}">${item.price}</span>
            <span class="change" style="color: ${item.changeColor}">${item.change}</span>
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
      let embedUrl = `https://www.youtube.com/embed/${item.videoId}`;
      
      if (item.listId) {
        embedUrl += `?list=${item.listId}`;
      }

      return `
        <div class="feed-card video-card" style="padding: 10px;">
          <div class="video-header" style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            <span class="card-icon">${item.icon}</span>
            <h4 style="font-size: 13px; font-weight: 600; margin: 0;">${item.title}</h4>
          </div>
          
          <div class="video-player" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">
            <iframe 
              src="${embedUrl}" 
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        </div>
      `;

      case 'memo':
        return `
        <div class="feed-card memo-card" style="padding: 12px;">
          <div class="memo-header" style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            <span class="card-icon">${item.icon}</span>
            <h4 style="font-size: 13px; font-weight: 600; margin: 0;">나만의 메모장</h4>
          </div>
          <textarea 
            id="memoInput" 
            placeholder="메모해보시던가.." 
            style="
              width: 100%; 
              height: 100px; 
              border: 1px solid #eee; 
              border-radius: 6px; 
              padding: 8px; 
              font-family: sans-serif; 
              font-size: 13px; 
              resize: vertical; 
              outline: none;
              background-color: #fffcF0;
              color: #333;
            ">${item.text}</textarea>
        </div>
      `;
    default:
      return '';
  }
}

/**
 * =================================================
 * API Fetch Functions
 * =================================================
 */

async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      resolve({ lat: 37.5665, lon: 126.9780 }); // 기본값: 서울
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        resolve({ lat: 37.5665, lon: 126.9780 }); // 실패 시 기본값
      }
    );
  });
}

async function fetchWeather() {
  try {
    const API_KEY = '55c2cbe5b7be23a8b79d69256be48566';
    
    const location = await getCurrentLocation();
    const lat = location.lat;
    const lon = location.lon;
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ko`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('OpenWeatherMap API failed');
    
    const data = await response.json();
    
    const temp = Math.round(data.main.temp);
    const tempMin = Math.round(data.main.temp_min);
    const tempMax = Math.round(data.main.temp_max);
    const humidity = data.main.humidity;
    const weatherCode = data.weather[0].main;
    const locationName = data.name;

    return [
      {
        id: 'weather-real',
        type: 'weather',
        icon: getWeatherIcon(weatherCode),
        title: `현재 위치 날씨 (${locationName})`, // 정확한 동이름은 API가 필요하므로 일단 '현재 위치'로 표시
        temp: `${temp}°C`,
        tempRange: `최고 ${tempMax}° / 최저 ${tempMin}° (습도: ${humidity}%)`
      }
    ];
  } catch (error) {
    console.error('Weather load error:', error);
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

function getWeatherIcon(weatherCode) {
  switch (weatherCode) {
    case 'Clear':
      return '☀️';
    case 'Clouds':
      return '☁️';
    case 'Rain':
    case 'Drizzle':
      return '🌧️';
    case 'Thunderstorm':
      return '⛈️';
    case 'Snow':
      return '❄️';
    case 'Mist':
    case 'Smoke':
    case 'Haze':
    case 'Dust':
    case 'Fog':
    case 'Sand':
    case 'Ash':
    case 'Squall':
    case 'Tornado':
      return '🌫️';
    default:
      return '🌡️';
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

// 3. Stocks - 급등주 TOP 5
async function fetchStocks() {
  try {
    const now = new Date();
    const hours = now.getHours();
    const isPreMarket = hours < 9 || hours >= 16;
    
    // 네이버 금융 급등주 페이지
    const response = await fetch('https://finance.naver.com/sise/sise_rise.naver');
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 급등주 리스트 가져오기 (상위 3개만)
    const stockRows = doc.querySelectorAll('.type_2 tbody tr');
    const stocks = [];
    
    for (let i = 0; i < Math.min(3, stockRows.length); i++) {
      const row = stockRows[i];
      
      // 빈 행 건너뛰기
      if (!row.querySelector('.tltle')) continue;
      
      const nameElement = row.querySelector('.tltle');
      const priceElement = row.querySelectorAll('td')[2];
      const changeElements = row.querySelectorAll('td span');
      
      if (!nameElement || !priceElement) continue;
      
      const name = nameElement.innerText.trim();
      const price = priceElement.innerText.trim();
      
      // 등락률 찾기
      let changePercent = '0%';
      let changeColor = '#333';
      let changeSymbol = '';
      
      for (let span of changeElements) {
        const className = span.className;
        const text = span.innerText.trim();
        
        if (className.includes('tah p11')) {
          if (className.includes('nv01')) {
            changeSymbol = '▲';
            changeColor = '#d32f2f';
          } else if (className.includes('nv02')) {
            changeSymbol = '▼';
            changeColor = '#1976d2';
          }
          
          if (text.includes('%')) {
            changePercent = text;
            break;
          }
        }
      }
      
      // 종목 코드 추출 (링크에서)
      const link = nameElement.getAttribute('href');
      const codeMatch = link ? link.match(/code=(\d+)/) : null;
      const stockCode = codeMatch ? codeMatch[1] : '000000';
      
      stocks.push({
        id: `stock-${stockCode}`,
        type: 'stock',
        icon: '🔥',
        title: name,
        price: `${price}원`,
        change: `${changeSymbol} ${changePercent}`,
        changeColor: changeColor,
        isPreMarket: isPreMarket,
        chartUrl: `https://ssl.pstatic.net/imgfinance/chart/mobile/mini/${stockCode}.png`
      });
      
      // 최대 3개까지만
      if (stocks.length >= 3) break;
    }
    
    // 데이터가 없으면 폴백
    if (stocks.length === 0) {
      throw new Error('No stock data found');
    }
    
    return stocks;

  } catch (error) {
    console.error('Stock fetch error:', error);
    return [
      {
        id: 'stock-fail',
        type: 'stock',
        icon: '⚠️',
        title: '급등주 정보',
        price: '-',
        change: '로딩 실패',
        changeColor: '#999',
        isPreMarket: false,
        chartUrl: ''
      }
    ];
  }
}

// 4. Messages
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

// 5. Videos
async function fetchVideos() {
  const VIDEO_ID = 'M7lc1UVf-VE';
  const LIST_ID = null;

  let videoTitle = 'official test';

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${VIDEO_ID}&format=json`);
    if (response.ok) {
      const data = await response.json();
      videoTitle = data.title;
    }
  } catch (error) {
    console.warn('제목 로딩 실패');
  }

  return [
    {
      id: 'youtube',
      type: 'video',
      icon: '▶️',
      title: videoTitle,
      videoId: VIDEO_ID,
      listId : LIST_ID
    }
  ];
}

// 6. Images
async function fetchImages() {
  try {
    const response = await fetch('https://api.thecatapi.com/v1/images/search', {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error('Cat API failed');

    const data = await response.json();
    const catImageUrl = data[0].url;

    return [
      {
        id: 'random-cat',
        type: 'image',
        icon: '🐱',
        imageUrl: catImageUrl
      }
    ];

  } catch (error) {
    console.warn('[Widget] 고양이 사진 로딩 실패:', error);
    return [
      {
        id: 'cat-fail',
        type: 'image',
        icon: '😿',
        imageUrl: 'https://via.placeholder.com/300x200?text=No+Cat+Found'
      }
    ];
  }
}

// 7.Memo
async function fetchMemo() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userMemo'], (result) => {
      const savedText = result.userMemo || '';
      
      resolve([
        {
          id: 'my-memo',
          type: 'memo',
          icon: '📝',
          text: savedText
        }
      ]);
    });
  });
}

/**
 * Event Listeners & Helpers
 */
function setupTabNavigation() {
  const settingBtn = document.getElementById('setting');
  const settingsModal = document.getElementById('settingsModal');
  const closeBtn = document.getElementById('closeSettings');
  const feedContainer = document.getElementById('feedContainer');

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

  if (feedContainer) {
    let timeoutId; // 디바운싱(Debouncing)용 변수

    feedContainer.addEventListener('input', (e) => {
      // 이벤트가 발생한 요소가 메모장 인풋인지 확인
      if (e.target && e.target.id === 'memoInput') {
        const text = e.target.value;

        // 1. 타이핑 할 때마다 즉시 저장하면 성능에 안 좋으니, 
        //    타이핑이 멈추고 0.5초 뒤에 저장하도록 처리 (디바운싱)
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          chrome.storage.sync.set({ userMemo: text }, () => {
            console.log('메모 저장됨:', text);
          });
        }, 500); // 0.5초 딜레이
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
  if (feedContainer) {
    feedContainer.addEventListener('click', async (e) => {
      // 클릭된 요소가 .image-card 내부인지 확인
      const imageCard = e.target.closest('.image-card');
      
      if (imageCard) {
        const imgElement = imageCard.querySelector('img');
        
        if (imgElement) imgElement.style.opacity = '0.5';

        const newImages = await fetchImages();
        
        if (newImages && newImages.length > 0 && imgElement) {
          const newSrc = newImages[0].imageUrl;
          const tempImg = new Image();
          tempImg.src = newSrc;
          
          tempImg.onload = () => {
            imgElement.src = newSrc;
            imgElement.style.opacity = '1'; // 다시 선명하게
          };
        } else {
            imgElement.style.opacity = '1';
        }
      }
    });
  }
}


// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}