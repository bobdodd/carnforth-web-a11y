/**
 * Forms Test
 * Tests for accessibility issues related to forms
 */
window.test_forms = async function() {
  try {
    console.log("[Forms] Starting forms test...");
    console.log("[Forms] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Forms] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Forms] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that forms have properly associated labels and error identification. Proper form implementation ensures that users can understand what information is requested and receive appropriate feedback on errors.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <forms> Installed',
          description: 'The forms touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Forms] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that forms have properly associated labels and error identification. Proper form implementation ensures that users can understand what information is requested and receive appropriate feedback on errors.',
      issues: [{
        type: 'error',
        title: `Error running forms test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Forms] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_forms().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'forms',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_forms");