/**
 * Color Contrast Test
 * Tests for accessibility issues related to color contrast
 */
window.test_color_contrast = async function() {
  try {
    console.log("[Color Contrast] Starting color_contrast test...");
    console.log("[Color Contrast] Running on document:", document.title);
    
    // Log some details about the page for debugging
    console.log("[Color Contrast] Page has", document.querySelectorAll('*').length, "elements");
    console.log("[Color Contrast] Interactive elements:", 
      document.querySelectorAll('button, a, input, select, textarea').length);
    
    // Return a simple info issue for testing
    return {
      description: 'Evaluates whether text and interface components have sufficient contrast against their background. Adequate contrast is essential for users with low vision, color blindness, or those using screens in bright sunlight.',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <color_contrast> Installed',
          description: 'The color_contrast touchpoint has been successfully installed and executed.'
        },
        {
          type: 'info',
          title: 'Page Details',
          description: `Running on "${document.title}" page with ${document.querySelectorAll('*').length} elements.`
        }
      ]
    };
  } catch (error) {
    console.error(`[Color Contrast] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates whether text and interface components have sufficient contrast against their background. Adequate contrast is essential for users with low vision, color blindness, or those using screens in bright sunlight.',
      issues: [{
        type: 'error',
        title: `Error running color_contrast test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[Color Contrast] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_color_contrast().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: 'color_contrast',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_color_contrast");