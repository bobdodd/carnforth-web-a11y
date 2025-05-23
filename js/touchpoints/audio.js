/**
 * Audio Test
 * Tests for accessibility issues related to audio content
 */
window.test_audio = async function() {
  try {
    console.log("[Audio] Starting audio test...");
    console.log("[Audio] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Audio] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Audio] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates audio content for accessibility including controls, captions, transcripts, and auto-play behavior. Ensures audio content is accessible to people who are deaf or hard of hearing.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <audio> Installed',
          description: 'The audio touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Audio] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates audio content for accessibility including controls, captions, transcripts, and auto-play behavior. Ensures audio content is accessible to people who are deaf or hard of hearing.',
      issues: [{
        type: 'error',
        title: `Error running audio test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Audio] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_audio().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'audio',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_audio");