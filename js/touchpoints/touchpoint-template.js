/**
 * TOUCHPOINT_NAME Test
 * Tests for accessibility issues with TOUCHPOINT_DESCRIPTION
 */
window.test_TOUCHPOINT_NAME = async function() {
  try {
    console.log("[TOUCHPOINT_NAME] Starting TOUCHPOINT_NAME test...");
    
    // Return a simple info issue for testing
    return {
      description: 'TOUCHPOINT_DESCRIPTION_LONG',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <TOUCHPOINT_NAME> Installed',
          description: 'The TOUCHPOINT_NAME touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[TOUCHPOINT_NAME] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'TOUCHPOINT_DESCRIPTION_LONG',
      issues: [{
        type: 'error',
        title: `Error running TOUCHPOINT_NAME test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[TOUCHPOINT_NAME] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_TOUCHPOINT_NAME().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'TOUCHPOINT_NAME',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_TOUCHPOINT_NAME");