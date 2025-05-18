/**
 * Images Test
 * Tests for accessibility issues related to images
 */
window.test_images = async function() {
  try {
    console.log("[Images] Starting images test...");
    console.log("[Images] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Images] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Images] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that images have appropriate alternative text. Proper alt text ensures that users who cannot see images can understand their content or purpose.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <images> Installed',
          description: 'The images touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Images] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that images have appropriate alternative text. Proper alt text ensures that users who cannot see images can understand their content or purpose.',
      issues: [{
        type: 'error',
        title: `Error running images test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Images] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_images().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'images',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_images");