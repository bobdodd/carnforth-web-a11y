/**
 * Timers Test
 * Tests for accessibility issues related to timers
 */
window.test_timers = async function() {
  try {
    console.log("[Timers] Starting timers test...");
    console.log("[Timers] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Timers] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Timers] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates whether content with time limits can be paused, stopped, or extended. Control over timed content ensures that users who need more time can still access and interact with content.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <timers> Installed',
          description: 'The timers touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Timers] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates whether content with time limits can be paused, stopped, or extended. Control over timed content ensures that users who need more time can still access and interact with content.',
      issues: [{
        type: 'error',
        title: `Error running timers test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Timers] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_timers().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'timers',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_timers");