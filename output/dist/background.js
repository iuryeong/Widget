console.log('[Widget] Service Worker initialized');

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('[Widget] Icon clicked for tab:', tab.id);
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log('[Widget] Side panel opened successfully');
  } catch (error) {
    console.error('[Widget] Error opening side panel:', error);
  }
});

// CORS 우회를 위한 fetch 핸들러
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_STOCKS') {
    fetch('https://finance.naver.com/sise/sise_rise.naver')
      .then(response => response.arrayBuffer())
      .then(buffer => {
        const decoder = new TextDecoder('euc-kr');
        const html = decoder.decode(buffer);
        sendResponse({ success: true, html });
      })
      .catch(error => {
        console.error('Background stock fetch error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 비동기 응답
  }
  
  sendResponse({ success: true });
});