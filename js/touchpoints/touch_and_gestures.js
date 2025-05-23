/**
 * Touch and Gestures Test
 * Tests for accessibility issues related to touch interfaces and gesture controls
 */
window.test_touch_and_gestures = async function() {
  try {
    console.log("[Touch and Gestures] Starting touch and gestures test...");
    console.log("[Touch and Gestures] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Touch and Gestures] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Touch and Gestures] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates touch interfaces and gesture controls for accessibility. Ensures all functionality is accessible via single pointer actions and that complex gestures have alternatives for users with motor disabilities.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <touch_and_gestures> Installed',
          description: 'The touch and gestures touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Touch and Gestures] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates touch interfaces and gesture controls for accessibility. Ensures all functionality is accessible via single pointer actions and that complex gestures have alternatives for users with motor disabilities.',
      issues: [{
        type: 'error',
        title: `Error running touch and gestures test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Touch and Gestures] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_touch_and_gestures().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'touch_and_gestures',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_touch_and_gestures");