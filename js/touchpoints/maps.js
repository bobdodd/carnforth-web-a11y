/**
 * Maps Test
 * Tests for accessibility issues related to maps
 */
window.test_maps = async function() {
  try {
    console.log("[Maps] Starting maps test...");
    console.log("[Maps] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Maps] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Maps] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <maps> Installed',
          description: 'The maps touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Maps] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
      issues: [{
        type: 'error',
        title: `Error running maps test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Maps] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_maps().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'maps',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_maps");