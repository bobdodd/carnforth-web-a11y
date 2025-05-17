/**
 * Test runner for executing all accessibility touchpoint tests
 */

/**
 * Run all accessibility tests
 * @returns {Promise<Object>} - Results from all touchpoint tests
 */
async function runAllTests() {
  // Create a message to send to the content script
  const message = {
    action: 'runAllTests'
  };
  
  // Send message to the content script via the background script
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, function(response) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response && response.error) {
        reject(new Error(response.error));
        return;
      }
      
      resolve(response.results || {});
    });
  });
}

/**
 * Run a specific touchpoint test
 * @param {string} touchpoint - The touchpoint to test
 * @returns {Promise<Object>} - Results from the touchpoint test
 */
async function runTouchpointTest(touchpoint) {
  // Create a message to send to the content script
  const message = {
    action: 'runTouchpointTest',
    touchpoint: touchpoint
  };
  
  // Send message to the content script via the background script
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, function(response) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response && response.error) {
        reject(new Error(response.error));
        return;
      }
      
      resolve(response.results || {});
    });
  });
}

/**
 * Mock test data for development (will be replaced with actual tests)
 * @returns {Object} - Mock test results
 */
function getMockTestResults() {
  return {
    accessible_name: {
      description: 'Checks that all interactive elements have accessible names that clearly identify their purpose. Proper labeling ensures that assistive technology users can understand the function of each element. Affects screen reader users particularly and impacts usability for voice recognition software users. Related to WCAG 2.1 success criteria 1.1.1 (Non-text Content), 2.4.6 (Headings and Labels), and 4.1.2 (Name, Role, Value).',
      issues: [
        {
          type: 'fail',
          title: 'Button missing accessible name',
          description: 'This button element does not have an accessible name. Screen reader users will not know the purpose of this button.',
          selector: 'button.close-modal',
          html: '<button class="close-modal"></button>'
        },
        {
          type: 'warning',
          title: 'Image with generic alt text',
          description: 'This image has generic alt text that does not describe its specific content or function.',
          selector: 'img.hero-image',
          html: '<img class="hero-image" alt="image" src="hero.jpg">'
        }
      ]
    },
    color_contrast: {
      description: 'Evaluates whether text and interface components have sufficient contrast against their background. Adequate contrast is essential for users with low vision, color blindness, or those using screens in bright sunlight. Impacts a wide range of users including older adults experiencing vision changes. Related to WCAG 2.1 success criteria 1.4.3 (Contrast Minimum) and 1.4.11 (Non-text Contrast).',
      issues: [
        {
          type: 'fail',
          title: 'Insufficient text contrast',
          description: 'This text has a contrast ratio of 2.8:1, which is below the WCAG AA minimum of 4.5:1 for normal text.',
          selector: '.footer-text',
          html: '<p class="footer-text" style="color: #888888; background-color: #FFFFFF;">Contact us</p>'
        }
      ]
    },
    headings: {
      description: 'Checks for proper heading structure and hierarchy. Well-structured headings create a logical outline of the page content, helping all users navigate and understand the page organization. Particularly important for screen reader users who rely on headings for efficient navigation. Related to WCAG 2.1 success criteria 1.3.1 (Info and Relationships), 2.4.1 (Bypass Blocks), and 2.4.6 (Headings and Labels).',
      issues: [
        {
          type: 'fail',
          title: 'Missing main heading (h1)',
          description: 'The page does not contain an h1 element. Each page should have exactly one main heading that describes the page content.',
          selector: null,
          html: null
        },
        {
          type: 'warning',
          title: 'Skipped heading level',
          description: 'The heading structure skips from h2 to h4, missing the h3 level. This creates a confusing document outline.',
          selector: 'h4.subheading',
          html: '<h4 class="subheading">Product Features</h4>'
        },
        {
          type: 'info',
          title: 'Multiple sections with same heading',
          description: 'There are multiple sections with identical heading text. Consider making headings unique to improve navigation.',
          selector: 'h2.section-title',
          html: '<h2 class="section-title">Details</h2>'
        }
      ]
    }
  };
}