/**
 * Lists Test
 * Tests for accessibility issues related to lists
 */
window.test_lists = async function() {
  try {
    console.log("[Lists] Starting lists test...");
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that content presented visually as lists uses proper semantic list elements. Proper list markup helps screen reader users understand content relationships and navigate efficiently.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <lists> Installed',
          description: 'The lists touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[Lists] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that content presented visually as lists uses proper semantic list elements. Proper list markup helps screen reader users understand content relationships and navigate efficiently.',
      issues: [{
        type: 'error',
        title: `Error running lists test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Lists] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_lists().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'lists',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_lists");