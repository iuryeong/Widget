// 기본 설정값 정의
const DEFAULT_SETTINGS = {
  sidebarPosition: 'right',
  sidebarWidth: 320,
  theme: 'dark',
  widgets: [
    { id: 'weather', type: 'weather', enabled: true, order: 0 },
    { id: 'clock', type: 'clock', enabled: true, order: 1 },
    { id: 'stocks', type: 'stocks', enabled: true, order: 2 },
    { id: 'random-image', type: 'random_image', enabled: true, order: 3 },
  ],
  bookmarks: [],
  notifications: {
    enableGmail: false,
    enableGithub: false,
    gmailRefreshInterval: 300000, // 5분
    githubRefreshInterval: 300000,
  },
  shortcuts: {
    toggleSidebar: 'Ctrl+Shift+W',
  },
};

/**
 * 크롬 확장프로그램 스토리지 관리 객체
 */
export const StorageManager = {
  /**
   * @returns {Promise<Object>} 설정 객체
   */
  async getSettings() {
    // chrome.storage.sync는 크롬 확장프로그램 환경에서만 동작합니다.
    const result = await chrome.storage.sync.get('settings');
    return result.settings || DEFAULT_SETTINGS;
  },

  /**
   * 설정을 저장소에 저장합니다.
   * @param {Object} settings - 저장할 설정 객체
   */
  async saveSettings(settings) {
    await chrome.storage.sync.set({ settings });
  },

  /**
   * @param {Array} widgets - 위젯 배열
   */
  async updateWidgets(widgets) {
    const settings = await this.getSettings();
    settings.widgets = widgets;
    await this.saveSettings(settings);
  },

  /**
   * @param {Array} bookmarks - 북마크 배열
   */
  async updateBookmarks(bookmarks) {
    const settings = await this.getSettings();
    settings.bookmarks = bookmarks;
    await this.saveSettings(settings);
  },

  async resetToDefaults() {
    await this.saveSettings(DEFAULT_SETTINGS);
  },

  
  async clearAll() {
    await chrome.storage.sync.clear();
  },
};