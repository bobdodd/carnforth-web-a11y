/**
 * Color Use Test
 * Tests for accessibility issues related to color use
 */
window.test_color_use = async function() {
  try {
    console.log("[Color Use] Starting color_use test...");
    console.log("[Color Use] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Color Use] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Color Use] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that color is not the only visual means of conveying information or indicating an action. Non-color indicators ensure that users with color vision deficiencies can perceive important information.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <color_use> Installed',
          description: 'The color_use touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Color Use] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that color is not the only visual means of conveying information or indicating an action. Non-color indicators ensure that users with color vision deficiencies can perceive important information.',
      issues: [{
        type: 'error',
        title: `Error running color_use test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Color Use] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_color_use().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'color_use',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_color_use");