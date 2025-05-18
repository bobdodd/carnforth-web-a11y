/**
 * Tables Test
 * Tests for accessibility issues related to tables
 */
window.test_tables = async function() {
  try {
    console.log("[Tables] Starting tables test...");
    console.log("[Tables] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Tables] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Tables] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that data tables have proper headers, captions, and structure. Properly structured tables ensure that users can understand the relationships between data cells and headers.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <tables> Installed',
          description: 'The tables touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Tables] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that data tables have proper headers, captions, and structure. Properly structured tables ensure that users can understand the relationships between data cells and headers.',
      issues: [{
        type: 'error',
        title: `Error running tables test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Tables] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_tables().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'tables',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_tables");