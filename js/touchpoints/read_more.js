/**
 * Read More Test
 * Tests for accessibility issues related to read more
 */
window.test_read_more = async function() {
  try {
    console.log("[Read More] Starting read_more test...");
    console.log("[Read More] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Read More] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Read More] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that "read more" or similar links provide context about their destination. Descriptive link text ensures that users understand where a link will take them, especially when links are encountered out of context.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <read_more> Installed',
          description: 'The read_more touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Read More] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that "read more" or similar links provide context about their destination. Descriptive link text ensures that users understand where a link will take them, especially when links are encountered out of context.',
      issues: [{
        type: 'error',
        title: `Error running read_more test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Read More] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_read_more().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'read_more',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_read_more");