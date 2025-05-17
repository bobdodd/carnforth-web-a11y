/**
 * Test runner for executing all accessibility touchpoint tests
 */

// Define functions in the global scope for simplicity since they need to be accessed by other scripts

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
          
          impact: {
            who: "Screen reader users and voice recognition users",
            severity: "High",
            why: "Buttons without names are not announced properly by screen readers"
          },
          
          remediation: [
            'Add an aria-label attribute with descriptive text',
            'Add visible text inside the button element',
            'Add an aria-labelledby attribute that references the ID of a visible element'
          ],
          
          selector: 'button.close-modal',
          xpath: '//button[@class="close-modal"]',
          html: '<button class="close-modal"></button>',
          fixedHtml: '<button class="close-modal" aria-label="Close modal">✕</button>',
          
          wcag: {
            principle: 'Operable',
            guideline: '2.4 Navigable',
            successCriterion: '2.4.6 Headings and Labels',
            level: 'AA'
          },
          
          resources: [
            {
              title: 'Understanding Success Criterion 2.4.6: Headings and Labels',
              url: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
            },
            {
              title: 'Accessible Name and Description Computation',
              url: 'https://www.w3.org/TR/accname-1.1/'
            }
          ]
        },
        {
          type: 'warning',
          title: 'Image with generic alt text',
          description: 'This image has generic alt text that does not describe its specific content or function.',
          
          impact: {
            who: "Screen reader users and users with slow connections",
            severity: "Medium",
            why: "Generic alt text provides no useful information about the image"
          },
          
          remediation: [
            'Replace generic alt text with specific, concise description of the image content or function',
            'If the image is decorative only, use an empty alt attribute (alt="") instead'
          ],
          
          selector: 'img.hero-image',
          xpath: '//img[@class="hero-image"]',
          html: '<img class="hero-image" alt="image" src="hero.jpg">',
          fixedHtml: '<img class="hero-image" alt="Company headquarters building in downtown Seattle" src="hero.jpg">',
          
          wcag: {
            principle: 'Perceivable',
            guideline: '1.1 Text Alternatives',
            successCriterion: '1.1.1 Non-text Content',
            level: 'A'
          },
          
          resources: [
            {
              title: 'Alt Text Decision Tree',
              url: 'https://www.w3.org/WAI/tutorials/images/decision-tree/'
            },
            {
              title: 'Writing Effective and Helpful Alt Text',
              url: 'https://webaim.org/techniques/alttext/'
            }
          ]
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
          
          impact: {
            who: "Users with low vision and users in high-glare environments",
            severity: "High",
            why: "Low contrast text is difficult to read for users with vision impairments"
          },
          
          remediation: [
            'Darken the text color to at least #595959 to achieve a 4.5:1 contrast ratio for AA compliance',
            'Darken further to #4D4D4D to achieve a 7:1 contrast ratio for AAA compliance',
            'Consider using a darker background with light text as an alternative approach'
          ],
          
          selector: '.footer-text',
          xpath: '//p[@class="footer-text"]',
          html: '<p class="footer-text" style="color: #888888; background-color: #FFFFFF;">Contact us</p>',
          fixedHtml: '<p class="footer-text" style="color: #595959; background-color: #FFFFFF;">Contact us</p>',
          
          wcag: {
            principle: 'Perceivable',
            guideline: '1.4 Distinguishable',
            successCriterion: '1.4.3 Contrast (Minimum)',
            level: 'AA'
          },
          
          resources: [
            {
              title: 'WebAIM Contrast Checker',
              url: 'https://webaim.org/resources/contrastchecker/'
            },
            {
              title: 'Understanding Success Criterion 1.4.3: Contrast (Minimum)',
              url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
            }
          ]
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
          
          impact: {
            who: "Screen reader users, cognitive disability users, and search engines",
            severity: "High",
            why: "The h1 element establishes the page topic and provides navigation for screen readers"
          },
          
          remediation: [
            'Add a single h1 element at the beginning of the main content that clearly describes the page content',
            'Ensure the h1 text matches or closely relates to the page title'
          ],
          
          selector: 'body',
          xpath: '/html/body',
          html: '<body>\n  <div class="page-content">\n    <div class="header">\n      <img src="logo.png" alt="Company Logo">\n    </div>\n    ...\n  </div>\n</body>',
          fixedHtml: '<body>\n  <div class="page-content">\n    <div class="header">\n      <img src="logo.png" alt="Company Logo">\n      <h1>Company Name - Product Catalog</h1>\n    </div>\n    ...\n  </div>\n</body>',
          
          wcag: {
            principle: 'Perceivable',
            guideline: '1.3 Adaptable',
            successCriterion: '1.3.1 Info and Relationships',
            level: 'A'
          },
          
          resources: [
            {
              title: 'Heading Structure and Accessibility',
              url: 'https://webaim.org/techniques/semanticstructure/#headings'
            },
            {
              title: 'W3C WAI Headings Tutorial',
              url: 'https://www.w3.org/WAI/tutorials/page-structure/headings/'
            }
          ]
        },
        {
          type: 'warning',
          title: 'Skipped heading level',
          description: 'The heading structure skips from h2 to h4, missing the h3 level. This creates a confusing document outline.',
          
          impact: {
            who: "Screen reader users and users with cognitive disabilities",
            severity: "Medium",
            why: "Skipped heading levels create a confusing document structure"
          },
          
          remediation: [
            'Change the h4 to an h3 to maintain a proper sequential hierarchy',
            'If deeper nesting is needed, restructure the entire heading hierarchy consistently'
          ],
          
          selector: 'h4.subheading',
          xpath: '//h4[@class="subheading"]',
          html: '<h4 class="subheading">Product Features</h4>',
          fixedHtml: '<h3 class="subheading">Product Features</h3>',
          
          wcag: {
            principle: 'Perceivable',
            guideline: '1.3 Adaptable',
            successCriterion: '1.3.1 Info and Relationships',
            level: 'A'
          },
          
          resources: [
            {
              title: 'Understanding Success Criterion 1.3.1: Info and Relationships',
              url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
            }
          ]
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

// Functions are already in global scope, no need for explicit export