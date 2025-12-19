/**
 * Content Script
 * Injected into every page to detect media and communicate with service worker
 */

console.log('[Widget] Content script loaded');

// Detect video elements and media playback
const mediaDetector = {
  init() {
    this.detectMediaElements();
    this.setupMediaSessionListener();
    this.observeMediaChanges();
  },

  detectMediaElements() {
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');

    videos.forEach((video) => {
      this.attachVideoListener(video);
    });

    audios.forEach((audio) => {
      this.attachAudioListener(audio);
    });
  },

  attachVideoListener(video) {
    video.addEventListener('play', () => {
      this.notifyServiceWorker({
        type: 'MEDIA_PLAYING',
        mediaType: 'video',
        source: this.detectSource(),
        url: this.getMediaUrl(),
      });
    });

    video.addEventListener('pause', () => {
      this.notifyServiceWorker({
        type: 'MEDIA_PAUSED',
        mediaType: 'video',
      });
    });
  },

  attachAudioListener(audio) {
    audio.addEventListener('play', () => {
      this.notifyServiceWorker({
        type: 'MEDIA_PLAYING',
        mediaType: 'audio',
        source: this.detectSource(),
      });
    });

    audio.addEventListener('pause', () => {
      this.notifyServiceWorker({
        type: 'MEDIA_PAUSED',
        mediaType: 'audio',
      });
    });
  },

  setupMediaSessionListener() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        this.notifyServiceWorker({
          type: 'MEDIA_SESSION_ACTION',
          action: 'play',
        });
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.notifyServiceWorker({
          type: 'MEDIA_SESSION_ACTION',
          action: 'pause',
        });
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.notifyServiceWorker({
          type: 'MEDIA_SESSION_ACTION',
          action: 'nexttrack',
        });
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.notifyServiceWorker({
          type: 'MEDIA_SESSION_ACTION',
          action: 'previoustrack',
        });
      });
    }
  },

  observeMediaChanges() {
    const observer = new MutationObserver(() => {
      this.detectMediaElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },

  detectSource() {
    const hostname = window.location.hostname;
    if (hostname.includes('youtube')) return 'youtube';
    if (hostname.includes('spotify')) return 'spotify';
    if (hostname.includes('soundcloud')) return 'soundcloud';
    return 'other';
  },

  getMediaUrl() {
    const video = document.querySelector('video');
    return video?.src || video?.currentSrc || '';
  },

  notifyServiceWorker(message) {
    chrome.runtime.sendMessage(message).catch((error) => {
      console.log('[Widget] Message sent to service worker:', message);
    });
  },
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mediaDetector.init());
} else {
  mediaDetector.init();
}

// Listen for messages from sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_METADATA') {
    sendResponse({
      title: document.title,
      url: window.location.href,
      favicon: document.querySelector('link[rel="icon"]')?.href || '',
    });
  }
});
