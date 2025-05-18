/**
 * Touchpoint Loader Script
 * This script dynamically injects touchpoint test files into the page context
 * and handles communication between the content script and injected scripts.
 */

// Prevent double loading of the touchpoint loader
if (typeof window.__CARNFORTH_TOUCHPOINT_LOADER_LOADED !== 'undefined') {
  console.log("[Touchpoint Loader] Already loaded, exiting to prevent duplicate initialization");
} else {
  // Mark as loaded
  window.__CARNFORTH_TOUCHPOINT_LOADER_LOADED = true;
  
  // List of all touchpoints we need to load
  const touchpoints = [
    'accessible_name', 'animation', 'color_contrast', 'color_use', 
    'dialogs', 'electronic_documents', 'event_handling', 
    'floating_content', 'focus_management', 'fonts', 'forms',
    'headings', 'images', 'landmarks', 'language', 'lists',
    'maps', 'read_more', 'tabindex', 'title_attribute',
    'tables', 'timers', 'videos'
  ];

// Send message to injected script
function sendToInjectedScript(message) {
  console.log('[Touchpoint Loader] Sending to injected script:', message);
  document.dispatchEvent(new CustomEvent('FROM_EXTENSION', { 
    detail: message 
  }));
}

// Listen for responses from injected script
document.addEventListener('FROM_INJECTED_SCRIPT', function(event) {
  const response = event.detail;
  console.log('[Touchpoint Loader] Received from injected script:', response);
  
  // Forward to content script - this is redundant but adds more visibility
  document.dispatchEvent(new CustomEvent('FROM_TOUCHPOINT_LOADER', { 
    detail: response 
  }));
});

// Dynamically inject a single touchpoint script
function injectTouchpointScript(touchpoint) {
  console.log(`[Touchpoint Loader] Injecting ${touchpoint} touchpoint...`);
  
  return new Promise((resolve, reject) => {
    try {
      // Create a script element to load the touchpoint
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(`js/touchpoints/${touchpoint}.js`);
      script.onload = () => {
        console.log(`[Touchpoint Loader] Successfully loaded ${touchpoint}`);
        script.remove();
        resolve();
      };
      script.onerror = (error) => {
        console.error(`[Touchpoint Loader] Error loading ${touchpoint}:`, error);
        reject(error);
      };
      
      // Append the script to the document
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      console.error(`[Touchpoint Loader] Error setting up ${touchpoint} injection:`, error);
      reject(error);
    }
  });
}

// Load a specific touchpoint and run its test
async function loadAndRunTouchpoint(touchpoint) {
  try {
    // First inject the script
    await injectTouchpointScript(touchpoint);
    console.log(`[Touchpoint Loader] Touchpoint ${touchpoint} injected, now running test`);
    
    // Check if the touchpoint function was properly loaded
    const testFuncName = `test_${touchpoint}`;
    if (typeof window[testFuncName] !== 'function') {
      console.error(`[Touchpoint Loader] Function ${testFuncName} not found on window object`);
      return {
        description: `Error loading ${touchpoint} touchpoint test`,
        issues: [{
          type: 'error',
          title: `Function ${testFuncName} not found`,
          description: `The touchpoint test function was not properly injected into the page.`
        }]
      };
    }
    
    console.log(`[Touchpoint Loader] Found function ${testFuncName} on window object:`, typeof window[testFuncName]);
    
    // Return a new Promise to allow proper handling in the content script
    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error(`[Touchpoint Loader] Touchpoint ${touchpoint} test timed out after 15 seconds`);
        reject(new Error(`Touchpoint ${touchpoint} test timed out after 15 seconds`));
      }, 15000);
      
      // Create a one-time listener for this specific touchpoint result
      const resultListener = function(event) {
        const response = event.detail;
        console.log(`[Touchpoint Loader] Received event during ${touchpoint} test:`, response);
        
        if (response.action === 'testResult' && response.touchpoint === touchpoint) {
          // Clean up
          clearTimeout(timeout);
          document.removeEventListener('FROM_INJECTED_SCRIPT', resultListener);
          console.log(`[Touchpoint Loader] Resolving ${touchpoint} test with results:`, response.results);
          resolve(response.results);
        }
      };
      
      // Add the listener
      document.addEventListener('FROM_INJECTED_SCRIPT', resultListener);
      
      // Then send a message to run the test
      console.log(`[Touchpoint Loader] Sending runTest message for ${touchpoint}`);
      sendToInjectedScript({
        action: 'runTest',
        touchpoint: touchpoint
      });
      
      // Direct call fallback - if the event listener approach fails
      setTimeout(() => {
        console.log(`[Touchpoint Loader] Checking if results came back for ${touchpoint}...`);
      }, 2000);
    });
  } catch (error) {
    console.error(`[Touchpoint Loader] Error loading/running touchpoint ${touchpoint}:`, error);
    return {
      description: `Error in ${touchpoint} touchpoint`,
      issues: [{
        type: 'error',
        title: `Error running ${touchpoint} test`,
        description: `An error occurred: ${error.message}`
      }]
    };
  }
}

// Inject and run all touchpoint scripts
async function loadAndRunAllTouchpoints() {
  console.log("[Touchpoint Loader] Loading and running all touchpoints");
  
  const results = {};
  
  for (const touchpoint of touchpoints) {
    try {
      const result = await loadAndRunTouchpoint(touchpoint);
      results[touchpoint] = result;
    } catch (error) {
      console.error(`[Touchpoint Loader] Error with touchpoint ${touchpoint}:`, error);
      results[touchpoint] = { 
        error: error.message,
        issues: [{
          type: 'info',
          title: `Error loading touchpoint: ${touchpoint}`,
          description: error.message
        }]
      };
    }
  }
  
  return results;
}

// Export functions for use by content script
try {
  // Create the touchpoint loader interface
  const touchpointLoaderInterface = {
    loadAndRunTouchpoint,
    loadAndRunAllTouchpoints
  };
  
  // Explicitly set on window object to ensure it's properly exposed
  // Only set if not already defined
  if (typeof window.touchpointLoader === 'undefined') {
    window.touchpointLoader = touchpointLoaderInterface;
    
    // Also set as a property of window.__carnforth for extra accessibility
    if (!window.__carnforth) {
      window.__carnforth = {};
    }
    
    window.__carnforth.touchpointLoader = touchpointLoaderInterface;
    
    // Debug message to confirm the object exists
    console.log("[Touchpoint Loader] touchpointLoader object created:", 
      window.touchpointLoader !== undefined,
      ", functions:", 
      typeof window.touchpointLoader.loadAndRunTouchpoint === 'function',
      typeof window.touchpointLoader.loadAndRunAllTouchpoints === 'function'
    );
    
    // Listen for query events from content script
    document.addEventListener('touchpoint-loader-query', function(event) {
      console.log('[Touchpoint Loader] Received query event, responding with loader reference');
      // Respond with the touchpoint loader reference
      document.dispatchEvent(new CustomEvent('touchpoint-loader-ready', {
        detail: {
          touchpointLoader: touchpointLoaderInterface,
          timestamp: Date.now()
        }
      }));
    });
    
    // Immediately dispatch an event to notify that the loader is ready
    document.dispatchEvent(new CustomEvent('touchpoint-loader-ready', {
      detail: {
        touchpointLoader: touchpointLoaderInterface,
        timestamp: Date.now()
      }
    }));
  }
  
  console.log("[Touchpoint Loader] Touchpoint loader initialized successfully");
} catch (error) {
  console.error("[Touchpoint Loader] Error initializing touchpoint loader:", error);
}
} // End of the main else block