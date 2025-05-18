/**
 * Background script for Carnforth Web A11y
 * 
 * Handles communication between DevTools and content scripts
 */

// Store tab information for DevTools connections
const devToolsConnections = {};

// Store pending test results for tabs that don't have an active connection
const pendingResults = {};

// Listen for connections from DevTools page
chrome.runtime.onConnect.addListener(port => {
  // Only handle connections from our DevTools page
  if (port.name !== 'carnforth-devtools') {
    return;
  }

  console.log("[Background] DevTools connected");
  let tabId = null;

  // Create listener for this connection
  const devToolsListener = (message) => {
    console.log("[Background] Received message from DevTools:", message);
    
    // Check message type
    if (message.action === 'init') {
      // Store connection with tab ID for future communication
      tabId = message.tabId;
      devToolsConnections[tabId] = port;

      // Notify DevTools that extension is ready
      port.postMessage({
        action: 'initialized',
        tabId: tabId
      });
      
      console.log("[Background] Initialized for tab", tabId);
      
      // We've removed the automatic sending of pending results to prevent
      // automatic test execution when the DevTools panel is opened.
      // Pending results will only be sent when explicitly requested.
      if (pendingResults[tabId]) {
        console.log("[Background] Found pending results for tab", tabId, "but not sending automatically");
      }
    }
    // Handle other message types
  };

  // Add message listener
  port.onMessage.addListener(devToolsListener);
  
  // Clean up when DevTools is closed
  port.onDisconnect.addListener(() => {
    if (tabId) {
      console.log("[Background] DevTools disconnected for tab", tabId);
      delete devToolsConnections[tabId];
    } else {
      console.log("[Background] DevTools disconnected (unknown tab)");
    }
  });
});

// Listen for tab navigation events to update the DevTools panel
chrome.webNavigation.onCompleted.addListener(details => {
  const tabId = details.tabId;
  const port = devToolsConnections[tabId];

  // If DevTools is connected to this tab, let it know the page has changed
  if (port) {
    port.postMessage({
      action: 'pageChanged',
      tabId: tabId,
      url: details.url
    });
  }
});

// Listen for direct messages from content scripts and DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Background] Received direct message:", message, "from:", sender);
  
  // Handle ping for connection check - highest priority
  if (message.action === 'ping') {
    console.log("[Background] Received ping, sending pong");
    // Send response immediately to prevent message port closed errors
    setTimeout(() => {
      try {
        sendResponse({ action: 'pong' });
      } catch (e) {
        console.error("[Background] Error sending pong response:", e);
      }
    }, 0);
    return true;
  }
  
  // Handle test result messages from content script
  if (message.action === 'testResults') {
    console.log("[Background] Received testResults message:", message);
    
    // Find the DevTools panel that requested these results
    const tabId = sender.tab ? sender.tab.id : null;
    const port = tabId ? devToolsConnections[tabId] : null;
    
    // Prepare the results to send (or store)
    const resultsToSend = message.touchpoint ? 
      { [message.touchpoint]: message.results } : 
      message.results;
      
    // Log if these are complete results or just a single touchpoint
    if (message.touchpoint) {
      console.log(`[Background] Single touchpoint results for ${message.touchpoint}`);
    } else {
      console.log(`[Background] Complete test results with ${Object.keys(message.results || {}).length} touchpoints`);
    }
    
    if (port) {
      try {
        console.log("[Background] Forwarding test results to DevTools panel for tab", tabId);
        
        port.postMessage({
          action: 'testResults',
          results: resultsToSend,
          error: message.error,
          touchpoint: message.touchpoint
        });
        
        console.log("[Background] Results forwarded successfully to DevTools");
      } catch (e) {
        console.error("[Background] Error forwarding test results to DevTools panel:", e);
        
        // Store as pending in case of error
        if (tabId) {
          console.log("[Background] Storing results as pending for tab", tabId);
          pendingResults[tabId] = resultsToSend;
        }
      }
    } else {
      console.log("[Background] No DevTools connection for tab", tabId);
      console.log("[Background] All connections:", Object.keys(devToolsConnections));
      
      // Store as pending for later retrieval
      if (tabId) {
        console.log("[Background] Storing results as pending for tab", tabId);
        pendingResults[tabId] = resultsToSend;
      }
      
      // Try to broadcast to all connected panels as fallback
      const connections = Object.values(devToolsConnections);
      if (connections.length > 0) {
        console.log("[Background] Attempting to broadcast to all connections:", connections.length);
        
        connections.forEach((connection, index) => {
          try {
            console.log(`[Background] Sending to connection ${index}`);
            
            connection.postMessage({
              action: 'testResults',
              results: resultsToSend,
              error: message.error,
              touchpoint: message.touchpoint,
              tabId: tabId // Include the original tabId for context
            });
            
            console.log(`[Background] Successfully sent to connection ${index}`);
          } catch (e) {
            console.error(`[Background] Error forwarding to connection ${index}:`, e);
          }
        });
      }
    }
    
    // Send immediate response to prevent connection errors
    sendResponse({ received: true });
    return true;
  }
  
  // Handle runAllTests message
  if (message.action === 'runAllTests') {
    const tabId = message.tabId;
    console.log("[Background] Handling runAllTests for tab", tabId);
    
    // Tests are now run directly in the DevTools panel, no need to inject scripts
    // We just acknowledge the message
    sendResponse({ status: "acknowledged" });
    
    return true;
  }
  
  // Handle runTouchpointTest message
  if (message.action === 'runTouchpointTest') {
    const tabId = message.tabId;
    const touchpoint = message.touchpoint;
    console.log("[Background] Handling runTouchpointTest for tab", tabId, "touchpoint:", touchpoint);
    
    // Tests are now run directly in the DevTools panel, no need to inject scripts
    // We just acknowledge the message
    sendResponse({ status: "acknowledged" });
    
    return true;
  }
  
  // Handle highlightElement message
  if (message.action === 'highlightElement') {
    const tabId = message.tabId;
    
    // Make sure the content script is injected before sending the message
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["js/content.js"]
    }).then(() => {
      // Send message to content script to highlight the element
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error("[Background] Error highlighting element:", chrome.runtime.lastError);
        }
      });
      
      sendResponse({ success: true });
    }).catch(error => {
      console.error("[Background] Error injecting content script for highlighting:", error);
      sendResponse({ error: error.message });
    });
    
    return true;
  }
  
  // No known action, return false
  return false;
});

// We no longer need the executeScripts function
// Tests now run directly in the DevTools panel without injecting scripts into the page