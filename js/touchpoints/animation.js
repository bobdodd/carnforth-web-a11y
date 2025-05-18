/**
 * Animation Test
 * Tests for accessibility issues related to animation
 */
window.test_animation = async function() {
  try {
    console.log("[Animation] Starting animation test...");
    console.log("[Animation] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Animation] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Animation] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates whether animated content can be paused, stopped, or hidden by users. Controls for animation are essential for people with vestibular disorders, attention disorders, and those who prefer reduced motion.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <animation> Installed',
          description: 'The animation touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Animation] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates whether animated content can be paused, stopped, or hidden by users. Controls for animation are essential for people with vestibular disorders, attention disorders, and those who prefer reduced motion.',
      issues: [{
        type: 'error',
        title: `Error running animation test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Animation] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_animation().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'animation',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_animation");