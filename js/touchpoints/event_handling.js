/**
 * Event Handling Test
 * Tests for accessibility issues related to event handling
 */
window.test_event_handling = async function() {
  try {
    console.log("[Event Handling] Starting event_handling test...");
    
    // Return a simple info issue for testing
    return {
      description: 'Verifies that interactive elements can be operated by keyboard as well as mouse. Proper event handling ensures that all user interface components are operable by keyboard-only users.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <event_handling> Installed',
          description: 'The event_handling touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[Event Handling] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Verifies that interactive elements can be operated by keyboard as well as mouse. Proper event handling ensures that all user interface components are operable by keyboard-only users.',
      issues: [{
        type: 'error',
        title: `Error running event_handling test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Event Handling] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_event_handling().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'event_handling',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_event_handling");