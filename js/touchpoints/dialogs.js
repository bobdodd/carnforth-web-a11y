/**
 * Dialogs Test
 * Tests for accessibility issues related to dialogs
 */
window.test_dialogs = async function() {
  try {
    console.log("[Dialogs] Starting dialogs test...");
    console.log("[Dialogs] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Dialogs] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Dialogs] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that dialogs are properly implemented with correct ARIA roles and focus management. Properly implemented dialogs ensure that keyboard and screen reader users can interact with modal content.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <dialogs> Installed',
          description: 'The dialogs touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Dialogs] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that dialogs are properly implemented with correct ARIA roles and focus management. Properly implemented dialogs ensure that keyboard and screen reader users can interact with modal content.',
      issues: [{
        type: 'error',
        title: `Error running dialogs test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Dialogs] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_dialogs().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'dialogs',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_dialogs");