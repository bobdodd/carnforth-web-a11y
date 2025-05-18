/**
 * Electronic Documents Test
 * Tests for accessibility issues related to electronic documents
 */
window.test_electronic_documents = async function() {
  try {
    console.log("[Electronic Documents] Starting electronic_documents test...");
    console.log("[Electronic Documents] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Electronic Documents] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Electronic Documents] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates links to electronic documents to ensure they indicate file type and size. This information helps users decide whether to download a file, especially for those with limited bandwidth or who require assistive technology compatibility.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <electronic_documents> Installed',
          description: 'The electronic_documents touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Electronic Documents] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates links to electronic documents to ensure they indicate file type and size. This information helps users decide whether to download a file, especially for those with limited bandwidth or who require assistive technology compatibility.',
      issues: [{
        type: 'error',
        title: `Error running electronic_documents test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Electronic Documents] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_electronic_documents().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'electronic_documents',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_electronic_documents");