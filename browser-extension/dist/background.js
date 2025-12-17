console.log('[Widget] Service Worker initialized');

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

// Handle extension icon click - Open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('[Widget] Icon clicked for tab:', tab.id);
    
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log('[Widget] Side panel opened successfully');
  } catch (error) {
    console.error('[Widget] Error opening side panel:', error);
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Widget] Message received:', request.type);
  sendResponse({ success: true });
});