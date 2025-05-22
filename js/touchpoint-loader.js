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
  
  // List of all touchpoints we need to load (uncomment as they're implemented)
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
      // Get the URL for the touchpoint script
      const scriptUrl = chrome.runtime.getURL(`js/touchpoints/${touchpoint}.js`);
      console.log(`[Touchpoint Loader] Script URL for ${touchpoint}: ${scriptUrl}`);
      
      if (!scriptUrl) {
        console.error(`[Touchpoint Loader] Failed to get URL for touchpoint: ${touchpoint}`);
        reject(new Error(`Failed to get URL for touchpoint script: ${touchpoint}.js - This may indicate a manifest issue or missing file.`));
        return;
      }
      
      // Check if the script function already exists to avoid duplicate loading
      const funcName = `test_${touchpoint}`;
      if (typeof window[funcName] === 'function') {
        console.log(`[Touchpoint Loader] Function ${funcName} already exists, skipping script injection`);
        resolve();
        return;
      }
      
      // Create a script element to load the touchpoint
      const script = document.createElement('script');
      script.src = scriptUrl;
      
      // Set a timeout to prevent hanging indefinitely
      const timeout = setTimeout(() => {
        console.error(`[Touchpoint Loader] Timeout loading touchpoint: ${touchpoint}`);
        script.remove();
        reject(new Error(`Timeout loading touchpoint script: ${touchpoint}.js - The script did not load within the expected time.`));
      }, 10000); // 10 second timeout
      
      script.onload = () => {
        console.log(`[Touchpoint Loader] Successfully loaded ${touchpoint}`);
        clearTimeout(timeout);
        
        // Verify the touchpoint function exists
        if (typeof window[funcName] !== 'function') {
          console.error(`[Touchpoint Loader] Function ${funcName} not found after loading script`);
          console.error(`[Touchpoint Loader] Available global functions:`, 
            Object.keys(window).filter(key => key.startsWith('test_')).join(', '));
          script.remove();
          reject(new Error(`Function ${funcName} not found after loading ${touchpoint}.js - The script may not have defined the expected function.`));
          return;
        }
        
        console.log(`[Touchpoint Loader] Verified function ${funcName} exists`);
        script.remove();
        resolve();
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`[Touchpoint Loader] Error loading ${touchpoint}:`, error);
        console.error(`[Touchpoint Loader] Failed to load ${scriptUrl}`);
        console.error(`[Touchpoint Loader] This could be due to:
          - Missing file in extension
          - File path error
          - Network error
          - CORS/CSP restrictions
        `);
        script.remove();
        reject(new Error(`Failed to load touchpoint script: ${touchpoint}.js - Check console for detailed error information.`));
      };
      
      // Add explicit attributes to help with troubleshooting
      script.setAttribute('data-touchpoint', touchpoint);
      script.setAttribute('async', 'false');
      script.setAttribute('charset', 'utf-8');
      
      // Append the script to the document
      (document.head || document.documentElement).appendChild(script);
      console.log(`[Touchpoint Loader] Script element for ${touchpoint} appended to document`);
    } catch (error) {
      console.error(`[Touchpoint Loader] Error setting up ${touchpoint} injection:`, error);
      console.error(`[Touchpoint Loader] Error stack trace:`, error.stack);
      reject(new Error(`Error injecting touchpoint script: ${touchpoint}.js - ${error.message}`));
    }
  });
}

// Load a specific touchpoint and run its test
async function loadAndRunTouchpoint(touchpoint) {
  try {
    // Validate touchpoint name to prevent injection issues
    if (!touchpoint || typeof touchpoint !== 'string' || !/^[a-z_]+$/.test(touchpoint)) {
      console.error(`[Touchpoint Loader] Invalid touchpoint name: ${touchpoint}`);
      return {
        description: `Error with touchpoint name: ${touchpoint}`,
        issues: [{
          type: 'error',
          title: `Invalid touchpoint name: ${touchpoint}`,
          description: `The touchpoint name must be a valid string containing only lowercase letters and underscores.`
        }]
      };
    }
    
    console.log(`[Touchpoint Loader] Starting to load and run touchpoint: ${touchpoint}`);
    
    // First inject the script
    await injectTouchpointScript(touchpoint);
    console.log(`[Touchpoint Loader] Touchpoint ${touchpoint} injected, now running test`);
    
    // Check if the touchpoint function was properly loaded
    const testFuncName = `test_${touchpoint}`;
    if (typeof window[testFuncName] !== 'function') {
      console.error(`[Touchpoint Loader] Function ${testFuncName} not found on window object`);
      console.error(`[Touchpoint Loader] Available window functions:`, 
        Object.keys(window).filter(key => key.startsWith('test_')));
      
      return {
        description: `Error loading ${touchpoint} touchpoint test`,
        issues: [{
          type: 'error',
          title: `Function ${testFuncName} not found`,
          description: `The touchpoint test function was not properly injected into the page. This could be due to a script loading error or incorrect function name.`
        }]
      };
    }
    
    console.log(`[Touchpoint Loader] Found function ${testFuncName} on window object:`, typeof window[testFuncName]);
    
    // Return a new Promise to allow proper handling in the content script
    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error(`[Touchpoint Loader] Touchpoint ${touchpoint} test timed out after 15 seconds`);
        document.removeEventListener('FROM_INJECTED_SCRIPT', resultListener);
        
        // Don't reject - instead return a friendly error message as a valid result
        resolve({
          description: `Timed out while running ${touchpoint} touchpoint test`,
          issues: [{
            type: 'error',
            title: `Timeout running ${touchpoint} test`,
            description: `The test did not complete within 15 seconds. This could indicate an infinite loop or async operation that never completes in the touchpoint code.`
          }]
        });
      }, 15000);
      
      // Create a one-time listener for this specific touchpoint result
      const resultListener = function(event) {
        const response = event.detail;
        console.log(`[Touchpoint Loader] Received event during ${touchpoint} test:`, response);
        
        if (response.action === 'testResult' && response.touchpoint === touchpoint) {
          // Clean up
          clearTimeout(timeout);
          document.removeEventListener('FROM_INJECTED_SCRIPT', resultListener);
          
          // Validate the results structure
          if (!response.results) {
            console.error(`[Touchpoint Loader] Invalid results from ${touchpoint} test: missing results object`);
            resolve({
              description: `Error in ${touchpoint} touchpoint`,
              issues: [{
                type: 'error',
                title: `Invalid result format from ${touchpoint}`,
                description: `The touchpoint returned an invalid result format. Expected a result object but received none.`
              }]
            });
            return;
          }
          
          if (!response.results.issues || !Array.isArray(response.results.issues)) {
            console.error(`[Touchpoint Loader] Invalid results from ${touchpoint} test: missing or invalid issues array`);
            // Fix the structure before returning
            const fixedResult = {
              description: response.results.description || `Results from ${touchpoint} touchpoint`,
              issues: [{
                type: 'error',
                title: `Invalid result format from ${touchpoint}`,
                description: `The touchpoint returned results with an invalid issues array. This has been fixed automatically.`
              }]
            };
            resolve(fixedResult);
            return;
          }
          
          // Log success and return the valid results
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
      
      // Check if results came back after a delay (for debugging)
      setTimeout(() => {
        console.log(`[Touchpoint Loader] Checking if results came back for ${touchpoint}...`);
        
        // Only provide diagnostic information if the timeout is still active
        if (timeout._idleTimeout) {
          console.log(`[Touchpoint Loader] No results received yet for ${touchpoint} after 2 seconds`);
          console.log(`[Touchpoint Loader] This is typically caused by the touchpoint script not properly communicating back results`);
          console.log(`[Touchpoint Loader] Check if the touchpoint correctly dispatches events with 'FROM_INJECTED_SCRIPT'`);
        }
      }, 2000);
      
      // We've removed the direct method call fallback to prevent automatic test execution
      // This ensures tests only run when the user explicitly requests them
    });
  } catch (error) {
    console.error(`[Touchpoint Loader] Error loading/running touchpoint ${touchpoint}:`, error);
    console.error(`[Touchpoint Loader] Error stack trace:`, error.stack);
    
    // Return a structured error response
    return {
      description: `Error in ${touchpoint} touchpoint`,
      issues: [{
        type: 'error',
        title: `Error running ${touchpoint} test`,
        description: `An error occurred during test execution: ${error.message}. Check the browser console for more details.`
      }]
    };
  }
}

// Inject and run all touchpoint scripts
async function loadAndRunAllTouchpoints() {
  console.log("[Touchpoint Loader] Loading and running all touchpoints");
  
  const results = {};
  const totalTouchpoints = touchpoints.length;
  console.log(`[Touchpoint Loader] Preparing to run ${totalTouchpoints} touchpoints`);
  
  // Track successful and failed touchpoints
  const successful = [];
  const failed = [];
  
  // Process touchpoints in batches to avoid overwhelming the browser
  const batchSize = 3; // Reduced batch size for more reliable loading
  const batchDelay = 500; // Add a small delay between batches
  
  for (let i = 0; i < touchpoints.length; i += batchSize) {
    const batch = touchpoints.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    const totalBatches = Math.ceil(touchpoints.length / batchSize);
    
    console.log(`[Touchpoint Loader] Processing batch ${batchNum}/${totalBatches} with ${batch.length} touchpoints: ${batch.join(', ')}`);
    
    // Run touchpoints in this batch concurrently
    try {
      const batchPromises = batch.map(async touchpoint => {
        try {
          console.log(`[Touchpoint Loader] Starting touchpoint: ${touchpoint}`);
          const startTime = performance.now();
          const result = await loadAndRunTouchpoint(touchpoint);
          const endTime = performance.now();
          const executionTime = (endTime - startTime).toFixed(2);
          
          console.log(`[Touchpoint Loader] Completed touchpoint: ${touchpoint} in ${executionTime}ms`);
          successful.push(touchpoint);
          return { touchpoint, result, success: true, executionTime };
        } catch (error) {
          console.error(`[Touchpoint Loader] Error with touchpoint ${touchpoint}:`, error);
          failed.push(touchpoint);
          return { 
            touchpoint, 
            error, 
            success: false,
            result: { 
              description: `Error processing touchpoint: ${touchpoint}`,
              issues: [{
                type: 'error',
                title: `Error loading touchpoint: ${touchpoint}`,
                description: error.message || "Unknown error occurred"
              }]
            }
          };
        }
      });
      
      console.log(`[Touchpoint Loader] Waiting for ${batchPromises.length} touchpoints in batch ${batchNum} to complete`);
      const batchResults = await Promise.all(batchPromises);
      
      // Process the results
      batchResults.forEach(({ touchpoint, result, success, executionTime }) => {
        results[touchpoint] = result;
        if (success) {
          console.log(`[Touchpoint Loader] Touchpoint ${touchpoint} succeeded in ${executionTime}ms`);
        } else {
          console.error(`[Touchpoint Loader] Touchpoint ${touchpoint} failed in batch processing`);
        }
      });
      
      console.log(`[Touchpoint Loader] Batch ${batchNum}/${totalBatches} completed with ${batchResults.filter(r => r.success).length}/${batch.length} successful touchpoints`);
      
      // Add a small delay between batches to avoid overwhelming the browser
      if (i + batchSize < touchpoints.length) {
        console.log(`[Touchpoint Loader] Waiting ${batchDelay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    } catch (error) {
      console.error(`[Touchpoint Loader] Fatal error in batch processing:`, error);
      console.error(`[Touchpoint Loader] Error stack trace:`, error.stack);
      
      // Add error results for the entire batch in case of fatal error
      batch.forEach(touchpoint => {
        if (!results[touchpoint]) {
          results[touchpoint] = { 
            description: `Error in ${touchpoint} touchpoint batch processing`,
            issues: [{
              type: 'error',
              title: `Fatal batch error for ${touchpoint}`,
              description: `A fatal error occurred during batch processing: ${error.message}`
            }]
          };
          failed.push(touchpoint);
        }
      });
    }
    
    console.log(`[Touchpoint Loader] Finished batch ${batchNum}/${totalBatches}`);
    console.log(`[Touchpoint Loader] Progress: ${Object.keys(results).length}/${totalTouchpoints} touchpoints processed`);
  }
  
  // Add summary information to console
  console.log(`[Touchpoint Loader] All touchpoints processed. Results for ${Object.keys(results).length}/${totalTouchpoints} touchpoints`);
  console.log(`[Touchpoint Loader] Successful touchpoints (${successful.length}): ${successful.join(', ')}`);
  console.log(`[Touchpoint Loader] Failed touchpoints (${failed.length}): ${failed.join(', ')}`);
  
  // Add global summary result
  results['__summary'] = {
    description: 'Summary of touchpoint execution results',
    issues: [{
      type: 'info',
      title: 'Touchpoint Execution Summary',
      description: `Successfully executed ${successful.length} of ${totalTouchpoints} touchpoints. ${failed.length} touchpoints failed.`
    }]
  };
  
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
  // Force overwrite any existing instance to ensure we have the latest
  window.touchpointLoader = touchpointLoaderInterface;
  
  // Only set it directly on the window object
  // No redundant locations - keep it simple and clear for debugging
  
  // Debug message to confirm the loader exists
  console.log("[Touchpoint Loader] touchpointLoader created on window object, functions available:", {
    "loadAndRunTouchpoint": typeof window.touchpointLoader.loadAndRunTouchpoint === 'function',
    "loadAndRunAllTouchpoints": typeof window.touchpointLoader.loadAndRunAllTouchpoints === 'function'
  });
  
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
  
  console.log("[Touchpoint Loader] Touchpoint loader initialized successfully");
  
  // No special hooks or flags - just the touchpointLoader object itself
} catch (error) {
  console.error("[Touchpoint Loader] Error initializing touchpoint loader:", error);
  console.error("[Touchpoint Loader] Error stack trace:", error.stack);
}
} // End of the main else block