/**
 * Fonts Test
 * Tests for accessibility issues related to fonts
 */
window.test_fonts = async function() {
  try {
    console.log("[Fonts] Starting fonts test...");
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates font usage for proper sizing, line spacing, and readability. Appropriate font usage ensures that text is readable by all users, especially those with low vision or reading disabilities.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <fonts> Installed',
          description: 'The fonts touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[Fonts] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates font usage for proper sizing, line spacing, and readability. Appropriate font usage ensures that text is readable by all users, especially those with low vision or reading disabilities.',
      issues: [{
        type: 'error',
        title: `Error running fonts test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Fonts] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_fonts().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'fonts',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_fonts");