/**
 * Focus Management Test
 * Tests for accessibility issues related to focus management
 */
window.test_focus_management = async function() {
  try {
    console.log("[Focus Management] Starting focus_management test...");
    
    // Return a simple info issue for testing
    return {
      description: 'Checks for logical focus order and visible focus indicators. Proper focus management ensures that keyboard users can predict where focus will go next and can visually identify the current focus position.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <focus_management> Installed',
          description: 'The focus_management touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[Focus Management] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks for logical focus order and visible focus indicators. Proper focus management ensures that keyboard users can predict where focus will go next and can visually identify the current focus position.',
      issues: [{
        type: 'error',
        title: `Error running focus_management test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Focus Management] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_focus_management().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'focus_management',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_focus_management");