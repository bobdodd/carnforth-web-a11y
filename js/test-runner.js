/**
 * Test runner for executing all accessibility touchpoint tests
 */

/**
 * Run all accessibility tests
 * @returns {Promise<Object>} - Results from all touchpoint tests
 */
async function runAllTests() {
  // For production with content script communication
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Create a message to send to the content script
    const message = {
      action: 'runAllTests'
    };
    
    // Send message to the content script via the background script
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, function(response) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.error) {
          reject(new Error(response.error));
          return;
        }
        
        resolve(response.results || {});
      });
    });
  } 
  // For development/testing when running locally
  else {
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
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Create a message to send to the content script
    const message = {
      action: 'runTouchpointTest',
      touchpoint: touchpoint
    };
    
    // Send message to the content script via the background script
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, function(response) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.error) {
          reject(new Error(response.error));
          return;
        }
        
        resolve(response.results || {});
      });
    });
  } 
  // For development/testing when running locally
  else {
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
    'accessible_name', 'animation', 'color_contrast', 'color_use', 
    'dialogs', 'electronic_documents', 'event_handling', 
    'floating_content', 'focus_management', 'fonts', 'forms',
    'headings', 'images', 'landmarks', 'language', 'lists',
    'maps', 'read_more', 'tabindex', 'title_attribute',
    'tables', 'timers', 'videos'
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