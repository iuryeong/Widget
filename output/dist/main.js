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

const pipManager = {
  async toggle() {
    const videos = Array.from(document.querySelectorAll('video'));
    
    let targetVideo = videos.find(v => v.readyState > 0 && !v.paused && !v.ended);
    
    if (!targetVideo && videos.length > 0) {
      targetVideo = videos[0];
    }

    if (!targetVideo) {
      alert('재생할 수 있는 동영상을 찾을 수 없습니다.');
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await targetVideo.requestPictureInPicture();
      }
    } catch (error) {
      console.error('[Widget] PiP 전환 실패:', error);
      alert('PiP 모드를 실행할 수 없습니다.');
    }
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TOGGLE_PIP') {
    pipManager.toggle();
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mediaDetector.init());
} else {
  mediaDetector.init();
}
