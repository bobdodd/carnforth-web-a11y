/**
 * Background service worker for Carnforth Web A11y extension
 * Handles communication between DevTools panel and content scripts
 */

// Listen for messages from the DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check which action is requested
  if (message.action === 'runAllTests' || message.action === 'runTouchpointTest') {
    // Forward the message to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ error: 'No active tab found' });
        return;
      }
      
      const activeTab = tabs[0];
      
      // Check if we can access the tab
      if (!activeTab || !activeTab.id) {
        sendResponse({ error: 'Cannot access active tab' });
        return;
      }
      
      // Execute a script to test if we can access the page
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => true
      }).then(() => {
        // Forward the message to the content script
        chrome.tabs.sendMessage(activeTab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            // If the content script is not loaded, inject it first
            injectContentScript(activeTab.id)
              .then(() => {
                // Send the message again after injecting the content script
                setTimeout(() => {
                  chrome.tabs.sendMessage(activeTab.id, message, (contentResponse) => {
                    if (chrome.runtime.lastError) {
                      sendResponse({ 
                        error: 'Failed to communicate with content script: ' + 
                               chrome.runtime.lastError.message 
                      });
                    } else {
                      sendResponse(contentResponse || { error: 'No response from content script' });
                    }
                  });
                }, 500); // Give the content script time to initialize
              })
              .catch((error) => {
                sendResponse({ error: 'Failed to inject content script: ' + error.message });
              });
          } else {
            // Forward the response from the content script
            sendResponse(response || { error: 'No response from content script' });
          }
        });
      }).catch((error) => {
        sendResponse({ error: 'Cannot execute script in active tab: ' + error.message });
      });
    });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  // Handle page refresh or URL change notification
  if (message.action === 'pageChanged') {
    // Broadcast the message to all DevTools panels
    chrome.runtime.sendMessage({ action: 'resetPanel' });
    return false; // No async response needed
  }
});

/**
 * Inject the content script into a tab
 * @param {number} tabId - The ID of the tab to inject into
 * @returns {Promise<void>} - Resolves when the script is injected
 */
function injectContentScript(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['js/touchpoint-loader.js', 'js/content.js']
  });
}

// Listen for tab updates to detect page refreshes or URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Notify content script that the page has changed
    chrome.tabs.sendMessage(tabId, { action: 'pageChanged' })
      .catch(() => {
        // Suppress errors if content script is not loaded yet
      });
    
    // Also notify the DevTools panel to reset
    chrome.runtime.sendMessage({ action: 'resetPanel' });
  }
});

// Listen for navigation events
chrome.webNavigation && chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) {  // Only handle main frame navigation
    // Notify DevTools panel to reset
    chrome.runtime.sendMessage({ action: 'resetPanel' });
  }
});