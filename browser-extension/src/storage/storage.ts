import { ExtensionSettings, Widget, Bookmark } from '../types';

const DEFAULT_SETTINGS: ExtensionSettings = {
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
    gmailRefreshInterval: 300000, // 5 min
    githubRefreshInterval: 300000,
  },
  shortcuts: {
    toggleSidebar: 'Ctrl+Shift+W',
  },
};

export const StorageManager = {
  async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.sync.get('settings');
    return result.settings || DEFAULT_SETTINGS;
  },

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.sync.set({ settings });
  },

  async updateWidgets(widgets: Widget[]): Promise<void> {
    const settings = await this.getSettings();
    settings.widgets = widgets;
    await this.saveSettings(settings);
  },

  async updateBookmarks(bookmarks: Bookmark[]): Promise<void> {
    const settings = await this.getSettings();
    settings.bookmarks = bookmarks;
    await this.saveSettings(settings);
  },

  async resetToDefaults(): Promise<void> {
    await this.saveSettings(DEFAULT_SETTINGS);
  },

  async clearAll(): Promise<void> {
    await chrome.storage.sync.clear();
  },
};
