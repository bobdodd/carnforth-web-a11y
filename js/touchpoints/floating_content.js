/**
 * Floating Content Test
 * Tests for accessibility issues related to floating content
 */
window.test_floating_content = async function() {
  try {
    console.log("[Floating Content] Starting floating_content test...");
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates tooltips, popovers, and other floating content for keyboard accessibility and proper ARIA implementation. Proper floating content implementation ensures that all users can access this information.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <floating_content> Installed',
          description: 'The floating_content touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[Floating Content] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates tooltips, popovers, and other floating content for keyboard accessibility and proper ARIA implementation. Proper floating content implementation ensures that all users can access this information.',
      issues: [{
        type: 'error',
        title: `Error running floating_content test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Floating Content] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_floating_content().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'floating_content',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_floating_content");