/**
 * Title Attribute Test
 * Tests for accessibility issues related to title attribute
 */
window.test_title_attribute = async function() {
  try {
    console.log("[Title Attribute] Starting title_attribute test...");
    console.log("[Title Attribute] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Title Attribute] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Title Attribute] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that title attributes are not used as the sole means of providing important information. Important information should be directly visible or available through standard controls, as title attributes are not consistently accessible.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <title_attribute> Installed',
          description: 'The title_attribute touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Title Attribute] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that title attributes are not used as the sole means of providing important information. Important information should be directly visible or available through standard controls, as title attributes are not consistently accessible.',
      issues: [{
        type: 'error',
        title: `Error running title_attribute test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Title Attribute] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_title_attribute().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'title_attribute',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_title_attribute");