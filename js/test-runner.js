/**
 * Test runner for executing all accessibility touchpoint tests
 */

// Create a port connection to the background page once
let backgroundPort;
let tabId;

// Initialize the connection to the background script
function initializeConnection() {
  if (!backgroundPort && typeof chrome !== 'undefined' && chrome.devtools) {
    // Get the current tab ID from the DevTools API
    tabId = chrome.devtools.inspectedWindow.tabId;
    
    // Create a connection to the background script
    backgroundPort = chrome.runtime.connect({
      name: 'carnforth-devtools'
    });
    
    console.log('[DevTools] Connecting to background script with tabId:', tabId);
    
    // Initialize the connection
    backgroundPort.postMessage({
      action: 'init',
      tabId: tabId
    });
    
    // Set up message listener
    backgroundPort.onMessage.addListener(function(message) {
      console.log('[DevTools] Received message from background:', message);
    });
    
    // Handle disconnections
    backgroundPort.onDisconnect.addListener(function() {
      console.log('[DevTools] Disconnected from background script');
      backgroundPort = null;
    });
  }
}

// This code should only execute when user explicitly clicks the test button
// Nothing should run automatically on load

// Initialize connection ONLY, no automatic test execution
if (typeof chrome !== 'undefined' && chrome.devtools) {
  initializeConnection();
}

/**
 * Run all accessibility tests
 * @returns {Promise<Object>} - Results from all touchpoint tests
 */
async function runAllTests() {
  // For production with content script communication
  if (typeof chrome !== 'undefined' && chrome.devtools) {
    console.log('[DevTools] Running all tests');
    
    // Ensure we have a connection
    if (!backgroundPort) {
      console.log('[DevTools] No connection to background, initializing...');
      initializeConnection();
    }
    
    // Send message through the DevTools port connection
    return new Promise((resolve, reject) => {
      // We need to declare these variables before using them in closure
      let messageListener, clearTimeoutOnResponse, timeoutId;
      
      // Make sure to clear timeout when we get a response
      clearTimeoutOnResponse = function(message) {
        if (message.action === 'testResults') {
          clearTimeout(timeoutId);
        }
      };
      
      // Set up a temporary listener for the test results
      messageListener = function(message) {
        console.log('[DevTools] Received message during test:', message);
        
        // Handle test results
        if (message.action === 'testResults') {
          // Remove both listeners
          backgroundPort.onMessage.removeListener(messageListener);
          backgroundPort.onMessage.removeListener(clearTimeoutOnResponse);
          
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeoutId);
          
          if (message.error) {
            console.error('[DevTools] Error from background:', message.error);
            reject(new Error(message.error));
            return;
          }
          
          resolve(message.results || {});
        }
      };
      
      // Set a timeout to prevent hanging indefinitely
      timeoutId = setTimeout(() => {
        backgroundPort.onMessage.removeListener(messageListener);
        backgroundPort.onMessage.removeListener(clearTimeoutOnResponse);
        reject(new Error('Test request timed out after 30 seconds'));
      }, 30000);
      
      // Add listeners
      backgroundPort.onMessage.addListener(messageListener);
      backgroundPort.onMessage.addListener(clearTimeoutOnResponse);
      
      // Send the actual request
      backgroundPort.postMessage({
        action: 'runAllTests',
        tabId: tabId
      });
      
      console.log('[DevTools] Sent runAllTests message to background');
    });
  } 
  // For development/testing when running locally
  else {
    console.log('[Local] Using mock results for runAllTests');
    // Use simple placeholder results when not in extension
    return getLocalResults();
  }
}

/**
 * Run a specific touchpoint test
 * @param {string} touchpoint - The touchpoint to test
 * @returns {Promise<Object>} - Results from the touchpoint test
 */
async function runTouchpointTest(touchpoint) {
  // For production with content script communication
  if (typeof chrome !== 'undefined' && chrome.devtools) {
    console.log(`[DevTools] Running touchpoint test: ${touchpoint}`);
    
    // Ensure we have a connection
    if (!backgroundPort) {
      console.log('[DevTools] No connection to background, initializing...');
      initializeConnection();
    }
    
    // Send message through the DevTools port connection
    return new Promise((resolve, reject) => {
      // We need to declare these variables before using them in closure
      let messageListener, clearTimeoutOnResponse, timeoutId;
      
      // Make sure to clear timeout when we get a response
      clearTimeoutOnResponse = function(message) {
        if (message.action === 'testResults' && message.touchpoint === touchpoint) {
          clearTimeout(timeoutId);
        }
      };
      
      // Set up a temporary listener for the test results
      messageListener = function(message) {
        console.log('[DevTools] Received message during touchpoint test:', message);
        
        // Handle test results for this specific touchpoint
        if (message.action === 'testResults' && message.touchpoint === touchpoint) {
          // Remove both listeners
          backgroundPort.onMessage.removeListener(messageListener);
          backgroundPort.onMessage.removeListener(clearTimeoutOnResponse);
          
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeoutId);
          
          if (message.error) {
            console.error(`[DevTools] Error running ${touchpoint} test:`, message.error);
            reject(new Error(message.error));
            return;
          }
          
          resolve(message.results || {});
        }
      };
      
      // Set a timeout to prevent hanging indefinitely
      timeoutId = setTimeout(() => {
        backgroundPort.onMessage.removeListener(messageListener);
        backgroundPort.onMessage.removeListener(clearTimeoutOnResponse);
        reject(new Error(`Test request for ${touchpoint} timed out after 30 seconds`));
      }, 30000);
      
      // Add listeners
      backgroundPort.onMessage.addListener(messageListener);
      backgroundPort.onMessage.addListener(clearTimeoutOnResponse);
      
      // Send the actual request
      backgroundPort.postMessage({
        action: 'runTouchpointTest',
        tabId: tabId,
        touchpoint: touchpoint
      });
      
      console.log(`[DevTools] Sent runTouchpointTest message for ${touchpoint} to background`);
    });
  } 
  // For development/testing when running locally
  else {
    console.log(`[Local] Using mock results for touchpoint: ${touchpoint}`);
    // Get mock results and return just this touchpoint
    const results = getLocalResults();
    const result = results[touchpoint];
    
    if (!result) {
      throw new Error(`Touchpoint '${touchpoint}' not found`);
    }
    
    return { [touchpoint]: result };
  }
}

/**
 * Generate simple local results for development and testing
 * This is only used outside the extension environment
 * @returns {Object} - Test results
 */
function getLocalResults() {
  // Create result object
  const results = {};
  
  // List of touchpoints
  const touchpoints = [
    'accessible_name', 'animation', 'audio', 'color_contrast', 
    'color_use', 'dialogs', 'electronic_documents', 'event_handling', 
    'floating_content', 'focus_management', 'fonts', 'forms',
    'headings', 'images', 'landmarks', 'language', 'lists',
    'maps', 'read_more', 'tabindex', 'title_attribute',
    'tables', 'timers', 'touch_and_gestures', 'videos'
  ];
  
  // Create placeholder results for most touchpoints
  touchpoints.forEach(touchpoint => {
    const displayName = touchpoint
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // For maps touchpoint, use the real implementation
    if (touchpoint === 'maps') {
      results[touchpoint] = {
        description: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
        issues: [{
          type: 'info',
          title: 'No maps detected on page',
          description: 'No interactive maps were detected on this page. This test looks for common map implementations including Google Maps, Bing Maps, Mapbox, Leaflet, and others.'
        }]
      };
    } else {
      // Standard placeholder for other touchpoints
      results[touchpoint] = {
        description: `Tests for ${displayName} touchpoint.`,
        issues: [{
          type: 'info',
          title: `${displayName} placeholder`,
          description: 'This is a placeholder issue when running outside the extension context.'
        }]
      };
    }
  });
  
  return results;
}