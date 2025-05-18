/**
 * Language Test
 * Tests for accessibility issues related to language
 */
window.test_language = async function() {
  try {
    console.log("[Language] Starting language test...");
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that the page has a language declaration and that language changes are properly marked. Proper language markup ensures that assistive technologies can present content in the correct language.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <language> Installed',
          description: 'The language touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[Language] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that the page has a language declaration and that language changes are properly marked. Proper language markup ensures that assistive technologies can present content in the correct language.',
      issues: [{
        type: 'error',
        title: `Error running language test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Language] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_language().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'language',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_language");