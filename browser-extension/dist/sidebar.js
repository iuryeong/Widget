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
            <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 12px;">
              <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">
                🐙 GitHub Personal Access Token
              </label>
              <input type="password" id="githubTokenInput" placeholder="ghp_..." 
                style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
              <button id="saveGithubToken" 
                style="margin-top: 6px; padding: 6px 12px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                저장
              </button>
              <p style="font-size: 10px; color: #666; margin-top: 4px;">
                <a href="https://github.com/settings/tokens" target="_blank" style="color: #6366f1;">토큰 생성하기</a> (notifications 권한 필요)
              </p>
            </div>
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
      (sidebarState.widgetSettings.todo !== false) ? fetchTodo() : Promise.resolve([]),
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
      ...results[6],
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
      const embedUrl = `https://www.youtube.com/embed/${item.videoId}`;

      return `
        <div class="feed-card video-card" style="padding: 12px;">
          <div class="video-header" style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="card-icon">${item.icon}</span>
              <h4 style="font-size: 13px; font-weight: 600; margin: 0;">YouTube Player</h4>
            </div>
          </div>

          <div style="display: flex; gap: 6px; margin-bottom: 10px;">
            <input type="text" id="youtubeUrlInput" placeholder="유튜브 링크 붙여넣기..." 
              style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; outline: none;">
            <button id="changeVideoBtn" 
              style="padding: 6px 10px; background: #ff0000; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">
              재생
            </button>
          </div>
          
          <div class="video-player" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #000;">
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
case 'todo':
      // 할 일 목록 HTML 생성
      const todoListHtml = item.items.map(todo => `
        <div class="todo-item" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <input type="checkbox" class="todo-check" data-id="${todo.id}" ${todo.done ? 'checked' : ''} style="cursor: pointer;">
          
          <input type="text" class="todo-text" data-id="${todo.id}" value="${todo.text}" 
            style="flex: 1; border: none; border-bottom: 1px solid #eee; padding: 4px; outline: none; font-size: 13px; color: ${todo.done ? '#aaa' : '#333'}; text-decoration: ${todo.done ? 'line-through' : 'none'}; background: transparent;">
          
          <button class="todo-delete" data-id="${todo.id}" style="border: none; background: none; cursor: pointer; color: #ff6b6b; font-size: 14px;">✕</button>
        </div>
      `).join('');

      return `
      <div class="feed-card todo-card" style="padding: 12px;">
          <div class="todo-header" style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="card-icon">${item.icon}</span>
              <h4 style="font-size: 13px; font-weight: 600; margin: 0;">할 일 목록</h4>
            </div>
          </div>
          
          <div id="todoListArea">${todoListHtml}</div>

          <div style="display: flex; gap: 5px; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
            <input type="text" id="newTodoInput" placeholder="할 일 입력" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
            <button id="addTodoBtn" style="padding: 6px 12px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">추가</button>
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

// 2. Notifications - GitHub API 실제 연동
async function fetchNotifications() {
  const { githubToken } = await chrome.storage.sync.get(['githubToken']);
  
  // GitHub 토큰이 없으면 설정 안내
  if (!githubToken) {
    return [
      {
        id: 'setup-github',
        type: 'notification',
        icon: '⚙️',
        title: 'GitHub 알림 설정',
        subtitle: '설정에서 Personal Access Token을 입력하세요',
        time: '지금'
      }
    ];
  }
  
  try {
    // GitHub Notifications API 호출
    const response = await fetch('https://api.github.com/notifications', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) throw new Error('GitHub API failed');
    
    const data = await response.json();
    
    // 최근 5개만 표시
    return data.slice(0, 5).map(notif => ({
      id: notif.id,
      type: 'notification',
      icon: getNotificationIcon(notif.subject.type),
      title: notif.repository.full_name,
      subtitle: notif.subject.title,
      time: getTimeAgo(notif.updated_at),
      url: notif.subject.url
    }));
    
  } catch (error) {
    console.error('GitHub notification error:', error);
    return [
      {
        id: 'github-error',
        type: 'notification',
        icon: '⚠️',
        title: 'GitHub 알림 로딩 실패',
        subtitle: '토큰을 확인하거나 나중에 다시 시도하세요',
        time: '지금'
      }
    ];
  }
}

function getNotificationIcon(type) {
  switch(type) {
    case 'PullRequest': return '🔀';
    case 'Issue': return '❗';
    case 'Commit': return '💾';
    case 'Release': return '🚀';
    default: return '📬';
  }
}

function getTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

// 3. Stocks - 급등주 TOP 3
async function fetchStocks() {
  try {
    const now = new Date();
    const hours = now.getHours();
    const isPreMarket = hours < 9 || hours >= 16;
    
    // Background로 요청 (CORS 우회)
    const response = await chrome.runtime.sendMessage({ type: 'FETCH_STOCKS' });
    
    if (!response.success) {
      throw new Error(response.error || 'Background fetch failed');
    }
    
    const html = response.html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const stockRows = doc.querySelectorAll('.type_2 tbody tr');
    const stocks = [];
    
    // 모든 행 순회
    for (let i = 0; i < stockRows.length && stocks.length < 3; i++) {
      const row = stockRows[i];
      
      const nameElement = row.querySelector('.tltle');
      if (!nameElement) continue;
      
      const tds = row.querySelectorAll('td');
      if (tds.length < 5) continue; // 5개 컬럼 필요
      
      const name = nameElement.innerText.trim();
      if (!name) continue;
      
      const priceElement = tds[2];
      const price = priceElement ? priceElement.innerText.trim() : '0';
      
      // 등락률은 tds[4]에 있음
      const changeTd = tds[4];
      let changePercent = '+0%';
      let changeColor = '#d32f2f';
      
      if (changeTd) {
        const changeText = changeTd.innerText.trim();
        if (changeText && changeText.includes('%')) {
          changePercent = changeText.replace(/\s/g, '');
          if (!changePercent.startsWith('+') && !changePercent.startsWith('-')) {
            changePercent = '+' + changePercent;
          }
        }
      }
      
      const link = nameElement.getAttribute('href');
      const codeMatch = link ? link.match(/code=([A-Za-z0-9]+)/) : null;
      const stockCode = codeMatch ? codeMatch[1] : '000000';
      
      // 디버깅용 로그 추가
      console.log(`[Stock Debug] ${name} -> code: ${stockCode}, url: ${link}`);
      
      stocks.push({
        id: `stock-rise-${stockCode}`,
        type: 'stock',
        icon: '🔥',
        title: name,
        price: `${price}원`,
        change: `▲ ${changePercent}`,
        changeColor: changeColor,
        isPreMarket: isPreMarket,
        chartUrl: `https://ssl.pstatic.net/imgfinance/chart/mobile/mini/${stockCode}.png`
      });
    }
    
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
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userVideoId'], (result) => {
      const videoId = result.userVideoId || 'M7lc1UVf-VE';

      resolve([
        {
          id: 'youtube',
          type: 'video',
          icon: '▶️',
          title: 'youtube',
          videoId: videoId,
          listId: null
        }
      ]);
    });
  });
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

//8. Todo list
async function fetchTodo() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['userTodos'], (result) => {
      // 저장된 할 일이 없으면 빈 배열 []
      const todos = result.userTodos || [];
      
      resolve([
        {
          id: 'my-todo',
          type: 'todo',
          icon: '✅',
          items: todos // 배열 데이터를 넘겨줌
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
  const saveTokenBtn = document.getElementById('saveGithubToken');
  if (saveTokenBtn) {
    saveTokenBtn.addEventListener('click', async () => {
      const input = document.getElementById('githubTokenInput');
      const token = input.value.trim();
    
      if (token) {
        await chrome.storage.sync.set({ githubToken: token });
        alert('GitHub 토큰이 저장되었습니다!');
        loadFeed(); // 알림 새로고침
      }
    });
  }

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
    let memoTimeoutId;
    let todoTimeoutId;

    feedContainer.addEventListener('input', (e) => {
      // 1. 메모장 자동 저장
      if (e.target.id === 'memoInput') {
        const text = e.target.value;
        clearTimeout(memoTimeoutId);
        memoTimeoutId = setTimeout(() => {
          chrome.storage.sync.set({ userMemo: text }, () => console.log('메모 저장됨'));
        }, 500);
      }

      // 2. [추가됨] 투두리스트 내용 수정 (실시간 저장)
      if (e.target.classList.contains('todo-text')) {
        const idToEdit = Number(e.target.dataset.id);
        const newText = e.target.value;

        clearTimeout(todoTimeoutId);
        todoTimeoutId = setTimeout(async () => {
          const { userTodos = [] } = await chrome.storage.sync.get(['userTodos']);
          const updatedTodos = userTodos.map(todo => {
            if (todo.id === idToEdit) return { ...todo, text: newText };
            return todo;
          });
          await chrome.storage.sync.set({ userTodos: updatedTodos });
          console.log('투두 수정됨');
        }, 500);
      }
    });

    // --- [B] 클릭 이벤트 (투두 추가/삭제/체크 + 이미지 새로고침) ---
    
    // (헬퍼 함수) 투두 추가 로직
    const addTodo = async () => {
      const input = document.getElementById('newTodoInput');
      if (!input || !input.value.trim()) return;

      const newText = input.value.trim();
      const newTodo = { id: Date.now(), text: newText, done: false };

      const { userTodos = [] } = await chrome.storage.sync.get(['userTodos']);
      const updatedTodos = [...userTodos, newTodo];
      
      await chrome.storage.sync.set({ userTodos: updatedTodos });
      loadFeed(); // 화면 갱신
    };

    feedContainer.addEventListener('click', async (e) => {
      if (e.target.id === 'addTodoBtn') {
        addTodo();
      }

      if (e.target.id === 'changeVideoBtn') {
        const input = document.getElementById('youtubeUrlInput');
        const url = input.value.trim();

        if (!url) return;

        // URL에서 Video ID 추출하기 (정규식 마법)
        // 지원 형식: youtube.com/watch?v=ID, youtu.be/ID, embed/ID 등
        const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        
        if (videoIdMatch && videoIdMatch[1]) {
          const newVideoId = videoIdMatch[1];
          
          // ID 저장 후 새로고침
          await chrome.storage.sync.set({ userVideoId: newVideoId });
          console.log('새 영상 ID 저장됨:', newVideoId);
          loadFeed(); // 화면 갱신해서 바로 영상 보여주기
          
        } else {
          alert('올바른 유튜브 링크가 아닙니다.\n(예: https://youtu.be/... 또는 https://www.youtube.com/watch?v=...)');
        }
      }

      if (e.target.classList.contains('todo-delete')) {
        const idToDelete = Number(e.target.dataset.id);
        const { userTodos = [] } = await chrome.storage.sync.get(['userTodos']);
        const updatedTodos = userTodos.filter(todo => todo.id !== idToDelete);
        
        await chrome.storage.sync.set({ userTodos: updatedTodos });
        loadFeed();
      }

      if (e.target.classList.contains('todo-check')) {
        const idToToggle = Number(e.target.dataset.id);
        const { userTodos = [] } = await chrome.storage.sync.get(['userTodos']);
        
        const updatedTodos = userTodos.map(todo => {
          if (todo.id === idToToggle) return { ...todo, done: e.target.checked };
          return todo;
        });

        const textInput = e.target.nextElementSibling;
        if (textInput) {
          textInput.style.textDecoration = e.target.checked ? 'line-through' : 'none';
          textInput.style.color = e.target.checked ? '#aaa' : '#333';
        }
        
        await chrome.storage.sync.set({ userTodos: updatedTodos });
      }

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
            imgElement.style.opacity = '1';
          };
        } else {
            imgElement.style.opacity = '1';
        }
      }
    });

    feedContainer.addEventListener('keydown', (e) => {
      if (e.target.id === 'newTodoInput' && e.key === 'Enter') {
        addTodo();
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


// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}