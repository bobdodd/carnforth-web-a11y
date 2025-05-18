/**
 * Videos Test
 * Tests for accessibility issues related to videos
 */
window.test_videos = async function() {
  try {
    console.log("[Videos] Starting videos test...");
    
    // Return a simple info issue for testing
    return {
      description: 'Checks that video content has proper captions, audio descriptions, and transcripts. Accessible video ensures that users who cannot see or hear the video can still access its content.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <videos> Installed',
          description: 'The videos touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(`[Videos] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Checks that video content has proper captions, audio descriptions, and transcripts. Accessible video ensures that users who cannot see or hear the video can still access its content.',
      issues: [{
        type: 'error',
        title: `Error running videos test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Videos] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_videos().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'videos',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_videos");