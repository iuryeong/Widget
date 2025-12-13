/**
 * Service Worker
 * Background service for handling alarms, notifications, and media control
 */

console.log('[Widget] Service Worker initialized');

// Global state for active media
let activeMedia = null;

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Widget] Extension installed');
    // Open welcome page or setup page
  } else if (details.reason === 'update') {
    console.log('[Widget] Extension updated');
  }
});

// Handle extension icon click - Open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Toggle side panel for the current tab
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log('[Widget] Side panel opened');
  } catch (error) {
    console.error('[Widget] Error opening side panel:', error);
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'MEDIA_PLAYING') {
    activeMedia = {
      tabId: sender.tab.id,
      url: sender.tab.url,
      title: sender.tab.title,
      source: request.source,
      mediaType: request.mediaType,
      isPlaying: true,
      timestamp: Date.now(),
    };
    console.log('[Widget] Media playing:', activeMedia);
    
    // Broadcast to sidebar
    broadcastToSidebar({
      type: 'ACTIVE_MEDIA_UPDATED',
      media: activeMedia,
    });
  }

  if (request.type === 'MEDIA_PAUSED') {
    if (activeMedia) {
      activeMedia.isPlaying = false;
    }
    broadcastToSidebar({
      type: 'ACTIVE_MEDIA_UPDATED',
      media: activeMedia,
    });
  }

  if (request.type === 'MEDIA_SESSION_ACTION') {
    console.log('[Widget] Media session action:', request.action);
    if (activeMedia) {
      broadcastToSidebar({
        type: 'MEDIA_CONTROL',
        action: request.action,
        tabId: activeMedia.tabId,
      });
    }
  }

  sendResponse({ success: true });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Inject content script if needed
    if (tab.url && !tab.url.startsWith('chrome://')) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['src/content-script.js'],
      }).catch(() => {
        // Script already injected or page doesn't support it
      });
    }
  }
});

// Listen for tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeMedia && activeMedia.tabId === tabId) {
    activeMedia = null;
    broadcastToSidebar({
      type: 'ACTIVE_MEDIA_CLEARED',
    });
  }
});

// Set up periodic notification refresh (optional)
chrome.alarms.create('refreshNotifications', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshNotifications') {
    console.log('[Widget] Refreshing notifications');
    // Fetch and update notifications from Gmail, GitHub, etc.
  }
});

/**
 * Broadcast message to sidebar
 */
function broadcastToSidebar(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Sidebar not open, that's fine
  });
}

/**
 * Handle sidebar requests
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidebar') {
    console.log('[Widget] Sidebar connected');
    
    port.onMessage.addListener((message) => {
      if (message.type === 'GET_ACTIVE_MEDIA') {
        port.postMessage({
          type: 'ACTIVE_MEDIA',
          media: activeMedia,
        });
      }
    });
  }
});
