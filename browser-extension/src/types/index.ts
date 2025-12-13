// Widget Types
export interface Widget {
  id: string;
  type: 'weather' | 'stocks' | 'clock' | 'todo' | 'random_image' | 'media_control';
  enabled: boolean;
  order: number;
  config?: Record<string, any>;
}

// Notification Types
export interface Notification {
  id: string;
  source: 'gmail' | 'github' | 'slack' | 'calendar';
  title: string;
  description: string;
  unread: boolean;
  timestamp: number;
  link?: string;
  icon?: string;
}

// Bookmark Types
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  openMode: 'new-tab' | 'current-tab' | 'sidebar-webview';
}

// Media Control Types
export interface MediaInfo {
  tabId: number;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: number;
  currentTime?: number;
  isPlaying: boolean;
  source: 'youtube' | 'spotify' | 'soundcloud' | 'other';
  controls: {
    canPlay: boolean;
    canPause: boolean;
    canNextTrack: boolean;
    canPreviousTrack: boolean;
  };
}

// Settings Types
export interface ExtensionSettings {
  sidebarPosition: 'left' | 'right' | 'top' | 'bottom';
  sidebarWidth: number;
  theme: 'light' | 'dark' | 'auto';
  widgets: Widget[];
  bookmarks: Bookmark[];
  notifications: {
    enableGmail: boolean;
    enableGithub: boolean;
    gmailRefreshInterval: number;
    githubRefreshInterval: number;
  };
  shortcuts: Record<string, string>;
}

// Mini Player Types
export interface MiniPlayerState {
  active: boolean;
  videoUrl?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
}

// Fun Widget Types
export interface FunWidgetConfig {
  enabled: boolean;
  source: 'giphy' | 'tenor' | 'dog' | 'cat' | 'fox' | 'nasa' | 'unsplash';
  refreshInterval: number;
}
