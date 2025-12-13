/**
 * Content Script
 * Injected into every page
 */

console.log('[Widget] Content script loaded');

// Optional: Detect video elements
const mediaDetector = {
  init() {
    this.detectMediaElements();
  },

  detectMediaElements() {
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    
    if (videos.length > 0 || audios.length > 0) {
      console.log('[Widget] Media elements detected');
    }
  },
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mediaDetector.init());
} else {
  mediaDetector.init();
}
