/**
 * Content script for Carnforth Web A11y extension
 * Runs in the context of the web page and performs accessibility tests
 */

// Store touchpoint modules
const touchpointModules = {};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle test requests
  if (message.action === 'runAllTests') {
    runAllTests()
      .then(results => sendResponse({ results }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicate async response
  }
  
  if (message.action === 'runTouchpointTest') {
    const touchpoint = message.touchpoint;
    if (!touchpoint) {
      sendResponse({ error: 'No touchpoint specified' });
      return true;
    }
    
    runTouchpointTest(touchpoint)
      .then(results => sendResponse({ results }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicate async response
  }
  
  if (message.action === 'pageChanged') {
    // No action needed in content script for page changes
    return false;
  }
  
  if (message.action === 'highlightElement') {
    highlightElement(message.selector);
    sendResponse({ success: true });
    return false;
  }
});

/**
 * Run all accessibility tests
 * @returns {Promise<Object>} - Results from all touchpoint tests
 */
async function runAllTests() {
  // For now, return mock data for development
  // This will be replaced with actual test implementations
  return getMockTestResults();
}

/**
 * Run a specific touchpoint test
 * @param {string} touchpoint - The touchpoint to test
 * @returns {Promise<Object>} - Results from the touchpoint test
 */
async function runTouchpointTest(touchpoint) {
  // For now, return mock data for the specific touchpoint
  const allResults = getMockTestResults();
  const result = allResults[touchpoint];
  
  if (!result) {
    throw new Error(`Touchpoint '${touchpoint}' not found`);
  }
  
  // Return just this touchpoint's results
  return { [touchpoint]: result };
}

/**
 * Highlight an element on the page
 * @param {string} selector - CSS selector or XPath for the element
 */
function highlightElement(selector) {
  // Try to get the element by CSS selector
  let element = document.querySelector(selector);
  
  // If not found and looks like XPath, try XPath
  if (!element && selector.includes('/')) {
    try {
      const result = document.evaluate(
        selector, 
        document, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      );
      
      if (result.singleNodeValue) {
        element = result.singleNodeValue;
      }
    } catch (e) {
      console.error('Invalid XPath:', e);
    }
  }
  
  if (!element) {
    console.error('Element not found with selector:', selector);
    return;
  }
  
  // Remove any existing highlights
  const existingHighlights = document.querySelectorAll('.carnforth-highlight');
  existingHighlights.forEach(el => el.remove());
  
  // Get element position
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Create highlight element
  const highlight = document.createElement('div');
  highlight.className = 'carnforth-highlight';
  
  // Position highlight with a slight offset
  const offset = 3; // 3px offset
  highlight.style.position = 'absolute';
  highlight.style.top = (rect.top + scrollTop - offset) + 'px';
  highlight.style.left = (rect.left + scrollLeft - offset) + 'px';
  highlight.style.width = (rect.width + (offset * 2)) + 'px';
  highlight.style.height = (rect.height + (offset * 2)) + 'px';
  highlight.style.border = '2px solid white';
  highlight.style.outline = '2px solid #e53935'; // Red color
  highlight.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.5)';
  highlight.style.zIndex = '2147483647'; // Maximum z-index
  highlight.style.pointerEvents = 'none'; // Make it non-interactive
  highlight.style.boxSizing = 'border-box';
  
  // Add to page
  document.body.appendChild(highlight);
  
  // Scroll element into view if needed
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  
  // Remove highlight after 3 seconds
  setTimeout(() => {
    if (highlight.parentNode) {
      highlight.remove();
    }
  }, 3000);
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