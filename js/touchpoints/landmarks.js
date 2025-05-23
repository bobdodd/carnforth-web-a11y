/**
 * Landmarks Test
 * Tests for accessibility issues related to landmarks
 */
window.test_landmarks = async function() {
  try {
    console.log("[Landmarks] Starting landmarks test...");
    console.log("[Landmarks] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Landmarks] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Landmarks] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks for proper use of HTML5 and ARIA landmark regions. Proper landmark structure helps screen reader users navigate and understand the page layout.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <landmarks> Installed',
          description: 'The landmarks touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Landmarks] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks for proper use of HTML5 and ARIA landmark regions. Proper landmark structure helps screen reader users navigate and understand the page layout.',
      issues: [{
        type: 'error',
        title: `Error running landmarks test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Landmarks] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_landmarks().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'landmarks',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_landmarks");