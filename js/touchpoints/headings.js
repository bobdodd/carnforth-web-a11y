/**
 * Headings Test
 * Tests for accessibility issues related to headings
 */
window.test_headings = async function() {
  try {
    console.log("[Headings] Starting headings test...");
    
    // Return a simple info issue for testing
    return {
      description: 'Checks for proper heading structure and hierarchy. Well-structured headings create a logical outline of the page content, helping all users navigate and understand the page organization.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <headings> Installed',
          description: 'The headings touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[Headings] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks for proper heading structure and hierarchy. Well-structured headings create a logical outline of the page content, helping all users navigate and understand the page organization.',
      issues: [{
        type: 'error',
        title: `Error running headings test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Headings] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_headings().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'headings',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_headings");