/**
 * Debug script to test if the touchpoint functions are properly injected
 * 
 * To use:
 * 1. Open the fixture page (fixtures/maps_test.html) in Chrome
 * 2. Open Chrome DevTools (F12)
 * 3. While the Carnforth Web A11y extension is installed, paste this entire script into the Console
 *    to verify that the touchpoint functions are properly injected
 */

// Check if touchpoint functions are available in the window object
function checkTouchpointFunctions() {
  const touchpoints = [
    'accessible_name', 'animation', 'color_contrast', 'color_use', 
    'dialogs', 'electronic_documents', 'event_handling', 
    'floating_content', 'focus_management', 'fonts', 'forms',
    'headings', 'images', 'landmarks', 'language', 'lists',
    'maps', 'read_more', 'tabindex', 'title_attribute',
    'tables', 'timers', 'videos'
  ];
  
  console.log("%c Testing Touchpoint Function Availability", "background: #4a4a4a; color: white; font-size: 14px; padding: 5px;");
  
  const results = {
    available: [],
    missing: []
  };
  
  touchpoints.forEach(touchpoint => {
    const functionName = `test_${touchpoint}`;
    const exists = typeof window[functionName] === 'function';
    
    if (exists) {
      results.available.push(functionName);
      console.log(`%c ✓ ${functionName} `, "color: green; font-weight: bold;", "Available in window object");
    } else {
      results.missing.push(functionName);
      console.log(`%c ✗ ${functionName} `, "color: red; font-weight: bold;", "NOT FOUND in window object");
    }
  });
  
  console.log("%c Summary", "background: #4a4a4a; color: white; font-size: 14px; padding: 5px;");
  console.log(`Available functions: ${results.available.length}/${touchpoints.length}`);
  console.log(`Missing functions: ${results.missing.length}/${touchpoints.length}`);
  
  return results;
}

// Test maps touchpoint if available 
async function testMapsFunction() {
  console.log("%c Testing Maps Touchpoint", "background: #4a4a4a; color: white; font-size: 14px; padding: 5px;");
  
  if (typeof window.test_maps !== 'function') {
    console.log("%c ✗ test_maps is not available", "color: red; font-weight: bold;");
    return { error: "test_maps function not found in window object" };
  }
  
  console.log("%c ✓ test_maps is available, running test...", "color: green; font-weight: bold;");
  
  try {
    const result = await window.test_maps();
    console.log("%c Maps test completed successfully", "color: green; font-weight: bold;");
    console.log("Result:", result);
    
    // Log issues found
    if (result.issues && result.issues.length > 0) {
      console.log(`%c Found ${result.issues.length} issues:`, "font-weight: bold;");
      result.issues.forEach((issue, index) => {
        console.log(`%c Issue ${index+1}: ${issue.title}`, "font-weight: bold;");
        console.log(`Type: ${issue.type}`);
        console.log(`Description: ${issue.description}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error("%c Error running maps test:", "color: red; font-weight: bold;", error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

// Check extension status
function checkExtensionStatus() {
  console.log("%c Checking Carnforth Web A11y Extension Status", "background: #4a4a4a; color: white; font-size: 14px; padding: 5px;");
  
  // Check if touchpoint-loader script has been injected
  const touchpointLoaderExists = !!document.querySelector('script[src*="touchpoint-loader.js"]');
  console.log(`%c Touchpoint loader script injected: ${touchpointLoaderExists ? '✓ Yes' : '✗ No'}`, 
    touchpointLoaderExists ? "color: green;" : "color: red;");
  
  // Check if content script has been injected  
  const contentScriptExists = !!document.querySelector('script[src*="content.js"]');
  console.log(`%c Content script injected: ${contentScriptExists ? '✓ Yes' : '✗ No'}`, 
    contentScriptExists ? "color: green;" : "color: red;");
  
  return {
    touchpointLoaderExists,
    contentScriptExists
  };
}

// Execute all tests
async function runAllTests() {
  console.log("%c Carnforth Web A11y Debug Tests", "background: #2196f3; color: white; font-size: 16px; padding: 10px;");
  
  // Check extension status
  const extensionStatus = checkExtensionStatus();
  
  // Check touchpoint functions
  const functionResults = checkTouchpointFunctions();
  
  // Test maps function if available
  let mapsResult = null;
  if (functionResults.available.includes('test_maps')) {
    mapsResult = await testMapsFunction();
  }
  
  // Return comprehensive results
  return {
    extensionStatus,
    functionResults,
    mapsResult
  };
}

// Run all tests and log results
runAllTests().then(results => {
  console.log("%c All Tests Completed", "background: #2196f3; color: white; font-size: 16px; padding: 10px;");
  console.log("Results:", results);
});