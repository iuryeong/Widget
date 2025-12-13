/**
 * Sidebar UI Controller
 * This is the main entry point for the sidebar panel
 */

console.log('[Widget] Sidebar loaded');

// Global sidebar state
const sidebarState = {
  currentTab: 'widgets',
  settings: null,
  notifications: [],
  bookmarks: [],
  activeMedia: null,
};

// Initialize sidebar
async function initSidebar() {
  try {
    // Load settings from storage
    const result = await chrome.storage.sync.get('settings');
    sidebarState.settings = result.settings;

    // Initialize UI
    renderSidebar();

    // Connect to service worker for real-time updates
    connectToServiceWorker();

    // Handle tab switching
    setupTabNavigation();
  } catch (error) {
    console.error('[Widget] Sidebar init error:', error);
  }
}

/**
 * Render main sidebar UI
 */
function renderSidebar() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="sidebar-container">
      <div class="sidebar-header">
        <h2>Widget</h2>
        <button id="settingsBtn" class="settings-btn">⚙️</button>
      </div>

      <div class="sidebar-tabs">
        <button class="tab-btn active" data-tab="widgets">📊 위젯</button>
        <button class="tab-btn" data-tab="player">▶️ 플레이어</button>
        <button class="tab-btn" data-tab="notifications">🔔 알림</button>
        <button class="tab-btn" data-tab="bookmarks">🔖 북마크</button>
        <button class="tab-btn" data-tab="webapps">🌐 웹앱</button>
      </div>

      <div class="sidebar-content">
        <div id="widgets-tab" class="tab-content active">
          <div class="widgets-grid" id="widgetsGrid"></div>
        </div>

        <div id="player-tab" class="tab-content">
          <div id="playerContainer" class="player-container"></div>
        </div>

        <div id="notifications-tab" class="tab-content">
          <div id="notificationsContainer" class="notifications-container"></div>
        </div>

        <div id="bookmarks-tab" class="tab-content">
          <div id="bookmarksContainer" class="bookmarks-container"></div>
        </div>

        <div id="webapps-tab" class="tab-content">
          <div id="webappsContainer" class="webapps-container"></div>
        </div>
      </div>
    </div>
  `;

  // Load content for each tab
  loadWidgets();
  loadNotifications();
  loadBookmarks();
}

/**
 * Load and render widgets
 */
async function loadWidgets() {
  const container = document.getElementById('widgetsGrid');
  if (!container) return;

  const widgets = sidebarState.settings?.widgets || [];

  container.innerHTML = widgets
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order)
    .map(
      (widget) => `
    <div class="widget-card" data-widget-id="${widget.id}">
      <div class="widget-header">
        <h3>${getWidgetTitle(widget.type)}</h3>
        <button class="widget-close" data-id="${widget.id}">×</button>
      </div>
      <div class="widget-content" id="widget-${widget.id}">
        로딩중...
      </div>
    </div>
  `
    )
    .join('');

  // Render content for each widget
  widgets.forEach((widget) => {
    if (widget.enabled) {
      renderWidget(widget);
    }
  });
}

/**
 * Render individual widget
 */
async function renderWidget(widget) {
  const contentEl = document.getElementById(`widget-${widget.id}`);
  if (!contentEl) return;

  switch (widget.type) {
    case 'weather':
      renderWeatherWidget(contentEl);
      break;
    case 'stocks':
      renderStocksWidget(contentEl);
      break;
    case 'clock':
      renderClockWidget(contentEl);
      break;
    case 'todo':
      renderTodoWidget(contentEl);
      break;
    case 'random_image':
      renderRandomImageWidget(contentEl);
      break;
    default:
      contentEl.innerHTML = '<p>미지원 위젯</p>';
  }
}

/**
 * Render weather widget
 */
async function renderWeatherWidget(container) {
  // Placeholder for weather widget
  container.innerHTML = `
    <div class="weather-widget">
      <p>📍 위치 권한 필요</p>
      <p style="font-size: 24px; margin: 10px 0;">--°C</p>
      <p>날씨 정보 로딩중...</p>
    </div>
  `;
}

/**
 * Render stocks widget
 */
async function renderStocksWidget(container) {
  container.innerHTML = `
    <div class="stocks-widget">
      <p>💹 주식/암호화폐 시세</p>
      <p>API 설정 필요</p>
    </div>
  `;
}

/**
 * Render clock widget
 */
async function renderClockWidget(container) {
  const updateClock = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const dateStr = now.toLocaleDateString('ko-KR');
    container.innerHTML = `
      <div class="clock-widget">
        <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${timeStr}</div>
        <div style="font-size: 12px; color: #999;">${dateStr}</div>
      </div>
    `;
  };

  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Render todo widget
 */
async function renderTodoWidget(container) {
  container.innerHTML = `
    <div class="todo-widget">
      <div class="todo-input">
        <input type="text" placeholder="할 일 추가..." class="todo-input-field" />
        <button class="todo-add-btn">+</button>
      </div>
      <ul class="todo-list" id="todoList"></ul>
    </div>
  `;

  // Load todos from storage
  const result = await chrome.storage.local.get('todos');
  const todos = result.todos || [];

  const todoList = container.querySelector('#todoList');
  todoList.innerHTML = todos
    .map(
      (todo) => `
    <li data-id="${todo.id}" style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
      <input type="checkbox" ${todo.completed ? 'checked' : ''} />
      <span style="flex: 1; margin-left: 8px; ${todo.completed ? 'text-decoration: line-through;' : ''}">${todo.text}</span>
      <button class="todo-delete" data-id="${todo.id}">🗑️</button>
    </li>
  `
    )
    .join('');
}

/**
 * Render random image widget
 */
async function renderRandomImageWidget(container) {
  container.innerHTML = `
    <div class="random-image-widget">
      <img src="https://api.thecatapi.com/v1/images/search" alt="Random" style="width: 100%; border-radius: 8px;" />
      <button style="width: 100%; margin-top: 8px; padding: 8px;" onclick="location.reload()">다음</button>
    </div>
  `;
}

/**
 * Load and render notifications
 */
async function loadNotifications() {
  const container = document.getElementById('notificationsContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="notifications-list" id="notificationsList">
      <p style="text-align: center; color: #999; padding: 20px;">
        알림이 없습니다
      </p>
    </div>
  `;
}

/**
 * Load and render bookmarks
 */
async function loadBookmarks() {
  const container = document.getElementById('bookmarksContainer');
  if (!container) return;

  const bookmarks = sidebarState.settings?.bookmarks || [];

  if (bookmarks.length === 0) {
    container.innerHTML = '<p style="color: #999; padding: 20px;">저장된 북마크가 없습니다</p>';
    return;
  }

  container.innerHTML = `
    <div class="bookmarks-grid">
      ${bookmarks
        .map(
          (bookmark) => `
        <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="bookmark-item" title="${bookmark.title}">
          <img src="${bookmark.favicon || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22%3E%3Crect fill=%22%23999%22 width=%2216%22 height=%2216%22/%3E%3C/svg%3E'}" alt="${bookmark.title}" />
          <span>${bookmark.title}</span>
        </a>
      `
        )
        .join('')}
    </div>
  `;
}

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetTab = e.target.dataset.tab;

      // Update active tab button
      tabBtns.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');

      // Update active tab content
      tabContents.forEach((tc) => tc.classList.remove('active'));
      document.getElementById(`${targetTab}-tab`)?.classList.add('active');

      sidebarState.currentTab = targetTab;
    });
  });
}

/**
 * Connect to service worker for real-time updates
 */
function connectToServiceWorker() {
  try {
    const port = chrome.runtime.connect({ name: 'sidebar' });

    port.onMessage.addListener((message) => {
      if (message.type === 'ACTIVE_MEDIA_UPDATED') {
        sidebarState.activeMedia = message.media;
        updateMediaDisplay(message.media);
      }
    });

    // Request initial state
    port.postMessage({ type: 'GET_ACTIVE_MEDIA' });
  } catch (error) {
    console.log('[Widget] Service worker connection failed');
  }
}

/**
 * Update media player display
 */
function updateMediaDisplay(media) {
  const container = document.getElementById('playerContainer');
  if (!container) return;

  if (!media) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">재생 중인 미디어가 없습니다</p>';
    return;
  }

  container.innerHTML = `
    <div class="mini-player">
      <div class="player-info">
        <h3>${media.title || '알 수 없는 제목'}</h3>
        <p style="font-size: 12px; color: #999;">${media.source}</p>
      </div>
      <div class="player-controls">
        <button onclick="controlMedia('play')" class="control-btn">▶️</button>
        <button onclick="controlMedia('pause')" class="control-btn">⏸️</button>
        <button onclick="controlMedia('volume')" class="control-btn">🔊</button>
      </div>
      <div class="player-status">
        ${media.isPlaying ? '▶️ 재생 중' : '⏸️ 일시정지'}
      </div>
    </div>
  `;
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

/**
 * Control media playback
 */
function controlMedia(action) {
  console.log('[Widget] Control media:', action);
  // TODO: Implement media control through service worker
}

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}
