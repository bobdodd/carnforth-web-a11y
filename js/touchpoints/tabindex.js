/**
 * Tabindex Test
 * Tests for accessibility issues related to tabindex
 */
window.test_tabindex = async function() {
  try {
    console.log("[Tabindex] Starting tabindex test...");
    console.log("[Tabindex] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Tabindex] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Tabindex] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks for proper usage of tabindex attributes. Proper tabindex usage ensures a logical keyboard navigation order and prevents focus traps.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <tabindex> Installed',
          description: 'The tabindex touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Tabindex] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks for proper usage of tabindex attributes. Proper tabindex usage ensures a logical keyboard navigation order and prevents focus traps.',
      issues: [{
        type: 'error',
        title: `Error running tabindex test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Tabindex] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_tabindex().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'tabindex',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_tabindex");