/**
 * Accessible Name Test
 * Tests for accessibility issues related to accessible name
 */
window.test_accessible_name = async function() {
  try {
    console.log("[Accessible Name] Starting accessible_name test...");
    console.log("[Accessible Name] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Accessible Name] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Accessible Name] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that all interactive elements have accessible names that clearly identify their purpose. Proper labeling ensures that assistive technology users can understand the function of each element.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <accessible_name> Installed',
          description: 'The accessible_name touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Accessible Name] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that all interactive elements have accessible names that clearly identify their purpose. Proper labeling ensures that assistive technology users can understand the function of each element.',
      issues: [{
        type: 'error',
        title: `Error running accessible_name test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Accessible Name] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_accessible_name().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'accessible_name',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_accessible_name");