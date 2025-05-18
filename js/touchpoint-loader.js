/**
 * Touchpoint Loader Script
 * This script injects all touchpoint test functions into the page
 * to be called by the content script.
 */

// Create a script element to inject the test functions
const script = document.createElement('script');
script.textContent = `
// Touchpoint test functions
${createAccessibleNameTest()}
${createAnimationTest()}
${createColorContrastTest()}
${createColorUseTest()}
${createDialogsTest()}
${createElectronicDocumentsTest()}
${createEventHandlingTest()}
${createFloatingContentTest()}
${createFocusManagementTest()}
${createFontsTest()}
${createFormsTest()}
${createHeadingsTest()}
${createImagesTest()}
${createLandmarksTest()}
${createLanguageTest()}
${createListsTest()}
${createMapsTest()}
${createReadMoreTest()}
${createTabindexTest()}
${createTitleAttributeTest()}
${createTablesTest()}
${createTimersTest()}
${createVideosTest()}
`;

// Add the script to the page
document.head.appendChild(script);

/**
 * Create the accessible_name test function
 */
function createAccessibleNameTest() {
  return `
async function test_accessible_name() {
  return {
    description: 'Checks that all interactive elements have accessible names that clearly identify their purpose. Proper labeling ensures that assistive technology users can understand the function of each element. Affects screen reader users particularly and impacts usability for voice recognition software users.',
    issues: [
      {
        type: 'info',
        title: 'Accessible Name test detected',
        description: 'This is a placeholder issue. The accessible_name tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the animation test function
 */
function createAnimationTest() {
  return `
async function test_animation() {
  return {
    description: 'Evaluates whether animated content can be paused, stopped, or hidden by users. Controls for animation are essential for people with vestibular disorders, attention disorders, and those who prefer reduced motion. Impacts users with cognitive disabilities, seizure disorders, and vestibular disorders.',
    issues: [
      {
        type: 'info',
        title: 'Animation test detected',
        description: 'This is a placeholder issue. The animation tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the color_contrast test function
 */
function createColorContrastTest() {
  return `
async function test_color_contrast() {
  return {
    description: 'Evaluates whether text and interface components have sufficient contrast against their background. Adequate contrast is essential for users with low vision, color blindness, or those using screens in bright sunlight. Impacts a wide range of users including older adults experiencing vision changes.',
    issues: [
      {
        type: 'info',
        title: 'Color Contrast test detected',
        description: 'This is a placeholder issue. The color_contrast tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the color_use test function
 */
function createColorUseTest() {
  return `
async function test_color_use() {
  return {
    description: 'Checks that color is not the only visual means of conveying information or indicating an action. Non-color indicators ensure that users with color vision deficiencies can perceive important information. Impacts approximately 8% of men and 0.5% of women with color vision deficiencies.',
    issues: [
      {
        type: 'info',
        title: 'Color Use test detected',
        description: 'This is a placeholder issue. The color_use tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the dialogs test function
 */
function createDialogsTest() {
  return `
async function test_dialogs() {
  return {
    description: 'Checks that dialogs are properly implemented with correct ARIA roles and focus management. Properly implemented dialogs ensure that keyboard and screen reader users can interact with modal content. Impacts keyboard-only and screen reader users.',
    issues: [
      {
        type: 'info',
        title: 'Dialogs test detected',
        description: 'This is a placeholder issue. The dialogs tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the electronic_documents test function
 */
function createElectronicDocumentsTest() {
  return `
async function test_electronic_documents() {
  return {
    description: 'Evaluates links to electronic documents to ensure they indicate file type and size. This information helps users decide whether to download a file, especially for those with limited bandwidth or who require assistive technology compatibility. Impacts screen reader users, users with cognitive disabilities, and those with slow internet connections.',
    issues: [
      {
        type: 'info',
        title: 'Electronic Documents test detected',
        description: 'This is a placeholder issue. The electronic_documents tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the event_handling test function
 */
function createEventHandlingTest() {
  return `
async function test_event_handling() {
  return {
    description: 'Verifies that interactive elements can be operated by keyboard as well as mouse. Proper event handling ensures that all user interface components are operable by keyboard-only users. Impacts users with motor disabilities, those using keyboard-only navigation, and screen reader users.',
    issues: [
      {
        type: 'info',
        title: 'Event Handling test detected',
        description: 'This is a placeholder issue. The event_handling tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the floating_content test function
 */
function createFloatingContentTest() {
  return `
async function test_floating_content() {
  return {
    description: 'Evaluates tooltips, popovers, and other floating content for keyboard accessibility and proper ARIA implementation. Proper floating content implementation ensures that all users can access this information. Impacts keyboard-only users, screen reader users, and those with low vision.',
    issues: [
      {
        type: 'info',
        title: 'Floating Content test detected',
        description: 'This is a placeholder issue. The floating_content tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the focus_management test function
 */
function createFocusManagementTest() {
  return `
async function test_focus_management() {
  return {
    description: 'Checks for logical focus order and visible focus indicators. Proper focus management ensures that keyboard users can predict where focus will go next and can visually identify the current focus position. Impacts keyboard-only users, screen reader users, and users with cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Focus Management test detected',
        description: 'This is a placeholder issue. The focus_management tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the fonts test function
 */
function createFontsTest() {
  return `
async function test_fonts() {
  return {
    description: 'Evaluates font usage for proper sizing, line spacing, and readability. Appropriate font usage ensures that text is readable by all users, especially those with low vision or reading disabilities. Impacts users with low vision, dyslexia, and cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Fonts test detected',
        description: 'This is a placeholder issue. The fonts tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the forms test function
 */
function createFormsTest() {
  return `
async function test_forms() {
  return {
    description: 'Checks that forms have properly associated labels and error identification. Proper form implementation ensures that users can understand what information is requested and receive appropriate feedback on errors. Impacts screen reader users, users with cognitive disabilities, and those with low vision.',
    issues: [
      {
        type: 'info',
        title: 'Forms test detected',
        description: 'This is a placeholder issue. The forms tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the headings test function
 */
function createHeadingsTest() {
  return `
async function test_headings() {
  return {
    description: 'Checks for proper heading structure and hierarchy. Well-structured headings create a logical outline of the page content, helping all users navigate and understand the page organization. Particularly important for screen reader users who rely on headings for efficient navigation.',
    issues: [
      {
        type: 'info',
        title: 'Headings test detected',
        description: 'This is a placeholder issue. The headings tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the images test function
 */
function createImagesTest() {
  return `
async function test_images() {
  return {
    description: 'Checks that images have appropriate alternative text. Proper alt text ensures that users who cannot see images can understand their content or purpose. Affects screen reader users, users with low bandwidth, and those who turn off images.',
    issues: [
      {
        type: 'info',
        title: 'Images test detected',
        description: 'This is a placeholder issue. The images tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the landmarks test function
 */
function createLandmarksTest() {
  return `
async function test_landmarks() {
  return {
    description: 'Checks for proper use of HTML5 and ARIA landmark regions. Proper landmark structure helps screen reader users navigate and understand the page layout. Primarily impacts screen reader users who navigate by landmarks.',
    issues: [
      {
        type: 'info',
        title: 'Landmarks test detected',
        description: 'This is a placeholder issue. The landmarks tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the language test function
 */
function createLanguageTest() {
  return `
async function test_language() {
  return {
    description: 'Checks that the page has a language declaration and that language changes are properly marked. Proper language markup ensures that assistive technologies can present content in the correct language. Impacts screen reader users and users of translation tools.',
    issues: [
      {
        type: 'info',
        title: 'Language test detected',
        description: 'This is a placeholder issue. The language tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the lists test function
 */
function createListsTest() {
  return `
async function test_lists() {
  return {
    description: 'Checks that content presented visually as lists uses proper semantic list elements. Proper list markup helps screen reader users understand content relationships and navigate efficiently. Impacts screen reader users and those with cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Lists test detected',
        description: 'This is a placeholder issue. The lists tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the maps test function
 */
function createMapsTest() {
  return `
async function test_maps() {
  try {
    // Generate XPath for elements
    function getFullXPath(element) {
      if (!element) return '';
      
      function getElementIdx(el) {
        let count = 1;
        for (let sib = el.previousSibling; sib; sib = sib.previousSibling) {
          if (sib.nodeType === 1 && sib.tagName === el.tagName) {
            count++;
          }
        }
        return count;
      }

      let path = '';
      while (element && element.nodeType === 1) {
        let idx = getElementIdx(element);
        let tagName = element.tagName.toLowerCase();
        path = \`/\${tagName}[\${idx}]\${path}\`;
        element = element.parentNode;
      }
      return path;
    }
    
    // Function to identify map provider from src attribute
    function identifyMapProvider(src) {
      const srcLower = src.toLowerCase();
      if (srcLower.includes('google.com/maps')) return 'Google Maps';
      if (srcLower.includes('bing.com/maps')) return 'Bing Maps';
      if (srcLower.includes('openstreetmap.org')) return 'OpenStreetMap';
      if (srcLower.includes('waze.com')) return 'Waze';
      if (srcLower.includes('mapbox.com')) return 'Mapbox';
      if (srcLower.includes('leafletjs.com') || srcLower.includes('leaflet')) return 'Leaflet';
      if (srcLower.includes('arcgis.com')) return 'ArcGIS';
      if (srcLower.includes('here.com')) return 'HERE Maps';
      if (srcLower.includes('tomtom.com')) return 'TomTom';
      if (srcLower.includes('maps.apple.com')) return 'Apple Maps';
      return 'Unknown Map Provider';
    }

    // Track found maps and issues
    const maps = [];
    const mapViolations = [];
    const summary = {
      totalMaps: 0,
      mapsByProvider: {},
      mapsWithoutTitle: 0,
      mapsWithAriaHidden: 0,
      divMapsWithoutAttributes: 0
    };

    // Create result object
    const result = {
      description: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
      issues: []
    };

    // 1. Find map iframes
    const mapIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
      const src = iframe.src || '';
      return src.includes('map') || 
            src.includes('maps.google') ||
            src.includes('maps.bing') ||
            src.includes('openstreetmap') ||
            src.includes('waze') ||
            src.includes('mapbox') ||
            src.includes('arcgis') ||
            src.includes('here.com') ||
            src.includes('tomtom');
    });

    // Process each map iframe
    mapIframes.forEach(iframe => {
      const provider = identifyMapProvider(iframe.src);
      const title = iframe.getAttribute('title');
      const ariaLabel = iframe.getAttribute('aria-label');
      const ariaLabelledby = iframe.getAttribute('aria-labelledby');
      const ariaHidden = iframe.getAttribute('aria-hidden');
      const hasAccessibleName = !!title || !!ariaLabel || !!ariaLabelledby;

      // Get HTML snippet
      const iframeHtml = iframe.outerHTML;
      
      // Get CSS selector
      const id = iframe.getAttribute('id');
      const cssSelector = id ? \`#\${id}\` : getFullXPath(iframe);

      // Store map information
      const mapInfo = {
        provider: provider,
        src: iframe.src,
        title: title,
        ariaLabel: ariaLabel,
        ariaLabelledby: ariaLabelledby,
        hasAccessibleName: hasAccessibleName,
        ariaHidden: ariaHidden === 'true',
        element: 'iframe',
        selector: cssSelector,
        xpath: getFullXPath(iframe),
        html: iframeHtml
      };

      maps.push(mapInfo);

      // Update summary
      summary.mapsByProvider[provider] = (summary.mapsByProvider[provider] || 0) + 1;

      // Check for violations
      if (!hasAccessibleName) {
        summary.mapsWithoutTitle++;
        mapViolations.push({
          type: 'missing-accessible-name',
          provider: provider,
          element: 'iframe',
          selector: cssSelector,
          xpath: getFullXPath(iframe),
          html: iframeHtml
        });
      }

      if (ariaHidden === 'true') {
        summary.mapsWithAriaHidden++;
        mapViolations.push({
          type: 'aria-hidden',
          provider: provider,
          element: 'iframe',
          selector: cssSelector,
          xpath: getFullXPath(iframe),
          html: iframeHtml
        });
      }
    });

    // 2. Also check for map div elements (some providers use divs)
    const mapDivs = Array.from(document.querySelectorAll('div[class*="map"], div[id*="map"]'))
      .filter(div => {
        const classAndId = ((div.className || '') + ' ' + (div.id || '')).toLowerCase();
        return classAndId.includes('map') && 
              !classAndId.includes('sitemap') && // Exclude sitemaps
              !classAndId.includes('heatmap');   // Exclude heatmaps
      });

    // Look for known map provider scripts or styles
    const hasMapboxGL = !!document.querySelector('script[src*="mapbox-gl"]');
    const hasLeaflet = !!document.querySelector('link[href*="leaflet"]');
    const hasGoogleMaps = !!document.querySelector('script[src*="maps.google"]');

    mapDivs.forEach(div => {
      // Try to determine the provider
      let provider = 'Unknown Map Provider';
      if (hasMapboxGL) provider = 'Mapbox';
      if (hasLeaflet) provider = 'Leaflet';
      if (hasGoogleMaps) provider = 'Google Maps';
      
      const ariaLabel = div.getAttribute('aria-label');
      const ariaLabelledby = div.getAttribute('aria-labelledby');
      const role = div.getAttribute('role');
      const hasAccessibleName = !!ariaLabel || !!ariaLabelledby;
      
      // Get HTML snippet
      const divHtml = div.outerHTML.substring(0, 500) + (div.outerHTML.length > 500 ? '...' : '');
      
      // Get CSS selector
      const id = div.getAttribute('id');
      const cssSelector = id ? \`#\${id}\` : (div.className ? \`.\${div.className.split(' ')[0].replace(/:/g, '\\\\:')}\` : getFullXPath(div));

      // Store map information
      const mapInfo = {
        provider: provider,
        type: 'div',
        ariaLabel: ariaLabel,
        ariaLabelledby: ariaLabelledby,
        role: role,
        hasAccessibleName: hasAccessibleName,
        element: 'div',
        selector: cssSelector,
        xpath: getFullXPath(div),
        html: divHtml
      };

      maps.push(mapInfo);
      summary.mapsByProvider[provider] = (summary.mapsByProvider[provider] || 0) + 1;

      // Check for accessibility attributes on div-based maps
      if (!hasAccessibleName || !role) {
        summary.divMapsWithoutAttributes++;
        mapViolations.push({
          type: 'div-map-missing-attributes',
          provider: provider,
          element: 'div',
          selector: cssSelector,
          xpath: getFullXPath(div),
          html: divHtml
        });
      }
    });

    // Update total maps count
    summary.totalMaps = maps.length;

    // 3. Process violations and create issues
    
    // Maps Without Accessible Names
    const missingNameViolations = mapViolations.filter(v => v.type === 'missing-accessible-name');
    missingNameViolations.forEach(violation => {
      const provider = violation.provider;
      const element = violation.element;
      const selector = violation.selector;
      const xpath = violation.xpath;
      const html = violation.html;
      
      // Create fixed HTML example
      let fixedHtml = '';
      if (element === 'iframe') {
        fixedHtml = html.replace('<iframe ', '<iframe title="Map showing location of our office" ');
      } else {
        fixedHtml = html.replace('<div ', '<div role="img" aria-label="Map showing location of our office" ');
      }

      result.issues.push({
        type: 'warning',
        title: \`\${provider} \${element} map missing accessible name\`,
        description: \`A \${provider} map embedded as an \${element} does not have an accessible name. Maps should have descriptive accessible names (via title, aria-label, or aria-labelledby) that explain their purpose.\`,
        impact: {
          who: 'Screen reader users, keyboard-only users, and users with cognitive disabilities',
          severity: 'High',
          why: 'Without an accessible name, screen reader users cannot identify the purpose of the map, making it difficult or impossible to understand the map\\'s content and context.'
        },
        remediation: [
          element === 'iframe' 
            ? 'Add a descriptive title attribute to the iframe (e.g., title="Map showing our office locations")' 
            : 'Add aria-label or aria-labelledby to the map div (e.g., aria-label="Map showing our office locations")',
          element === 'div' ? 'Add role="img" or role="application" to the map container div' : '',
          'Ensure the accessible name clearly describes what the map is showing',
          'Test with a screen reader to verify the map is properly announced'
        ].filter(item => item !== ''),
        selector: selector,
        xpath: xpath,
        html: html,
        fixedHtml: fixedHtml,
        wcag: {
          principle: 'Perceivable, Robust',
          guideline: element === 'iframe' ? '2.4 Navigable, 4.1 Compatible' : '1.1 Text Alternatives, 4.1 Compatible',
          successCriterion: element === 'iframe' ? '2.4.1 Bypass Blocks, 4.1.2 Name, Role, Value' : '1.1.1 Non-text Content, 4.1.2 Name, Role, Value',
          level: 'A'
        },
        resources: [
          {
            title: 'Making Maps Accessible',
            url: 'https://www.w3.org/WAI/RD/wiki/Maps'
          },
          {
            title: 'Accessible Names and Descriptions for Maps',
            url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/img_role'
          }
        ]
      });
    });

    // Maps With aria-hidden='true'
    const ariaHiddenViolations = mapViolations.filter(v => v.type === 'aria-hidden');
    ariaHiddenViolations.forEach(violation => {
      const provider = violation.provider;
      const element = violation.element;
      const selector = violation.selector;
      const xpath = violation.xpath;
      const html = violation.html;
      
      // Create fixed HTML example
      const fixedHtml = html.replace('aria-hidden="true"', 'aria-hidden="false"');

      result.issues.push({
        type: 'fail',
        title: \`\${provider} map hidden from assistive technology\`,
        description: \`A \${provider} map has aria-hidden="true", which completely hides it from screen readers. This makes the map information inaccessible to users who rely on assistive technologies.\`,
        impact: {
          who: 'Screen reader users',
          severity: 'High',
          why: 'When maps are hidden with aria-hidden="true", screen reader users are completely excluded from accessing potentially important geographic information like location details, directions, or spatial relationships shown on the map.'
        },
        remediation: [
          'Remove aria-hidden="true" from the map element',
          'Ensure the map has a proper accessible name via title, aria-label, or aria-labelledby',
          'If the map must remain hidden, provide equivalent information in an accessible text format nearby',
          'Test with a screen reader to verify the map is now properly accessible'
        ],
        selector: selector,
        xpath: xpath,
        html: html,
        fixedHtml: fixedHtml,
        wcag: {
          principle: 'Perceivable',
          guideline: '1.1 Text Alternatives',
          successCriterion: '1.1.1 Non-text Content',
          level: 'A'
        },
        resources: [
          {
            title: 'Accessible Rich Internet Applications (WAI-ARIA) 1.2',
            url: 'https://www.w3.org/TR/wai-aria-1.2/#aria-hidden'
          },
          {
            title: 'How and when to hide content',
            url: 'https://www.a11yproject.com/posts/how-to-hide-content/'
          }
        ]
      });
    });

    // Div Maps Without Proper Accessibility Attributes
    const divViolations = mapViolations.filter(v => v.type === 'div-map-missing-attributes');
    divViolations.forEach(violation => {
      const provider = violation.provider;
      const selector = violation.selector;
      const xpath = violation.xpath;
      const html = violation.html;
      
      // Create fixed HTML example
      const fixedHtml = html.replace('<div ', '<div role="application" aria-label="Map showing our location" ');

      result.issues.push({
        type: 'fail',
        title: \`\${provider} div-based map missing accessibility attributes\`,
        description: \`A div-based map implementation is missing required accessibility attributes. Div-based maps need proper ARIA roles and labels to be accessible to screen reader users.\`,
        impact: {
          who: 'Screen reader users, keyboard-only users',
          severity: 'High',
          why: 'Without proper ARIA attributes, div-based maps appear as generic containers to screen readers, with no indication of their purpose or content. This prevents users from understanding and interacting with the map content.'
        },
        remediation: [
          'Add role="application" or role="img" to the map container div',
          'Add aria-label attribute that describes the map\\'s purpose (e.g., aria-label="Map showing our office locations")',
          'Ensure the map controls are keyboard accessible',
          'Provide a text alternative or description nearby if the map contains critical information',
          'Test with screen readers and keyboard-only navigation'
        ],
        selector: selector,
        xpath: xpath,
        html: html,
        fixedHtml: fixedHtml,
        wcag: {
          principle: 'Perceivable, Robust',
          guideline: '1.1 Text Alternatives, 4.1 Compatible',
          successCriterion: '1.1.1 Non-text Content, 4.1.2 Name, Role, Value',
          level: 'A'
        },
        resources: [
          {
            title: 'Creating Accessible Maps',
            url: 'https://www.w3.org/WAI/RD/wiki/Maps'
          },
          {
            title: 'ARIA Role for Interactive Maps',
            url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/application_role'
          }
        ]
      });
    });

    // 4. General information issue about maps on the page
    if (maps.length > 0) {
      // Format summary of map providers
      const providerSummary = Object.entries(summary.mapsByProvider)
        .map(([provider, count]) => \`\${provider}: \${count}\`)
        .join(', ');

      result.issues.push({
        type: 'info',
        title: \`\${summary.totalMaps} maps detected on page\`,
        description: \`The page contains \${summary.totalMaps} map(s): \${providerSummary}. Maps present unique accessibility challenges and should be manually tested to ensure all users can access the geographic information they provide.\`,
        resources: [
          {
            title: 'Making Maps Accessible',
            url: 'https://www.w3.org/WAI/RD/wiki/Maps'
          },
          {
            title: 'Google Maps Accessibility Features',
            url: 'https://support.google.com/maps/answer/6396990'
          }
        ]
      });
    } else {
      // No maps detected
      result.issues.push({
        type: 'info',
        title: 'No maps detected on page',
        description: 'No interactive maps were detected on this page. This test looks for common map implementations including Google Maps, Bing Maps, Mapbox, Leaflet, and others.'
      });
    }

    return result;
  } catch (error) {
    console.error(\`Error in Maps touchpoint test: \${error}\`);
    
    return {
      description: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
      issues: [{
        type: 'info',
        title: \`Error running Maps test\`,
        description: \`An error occurred while testing: \${error.message}\`
      }]
    };
  }
}`;
}

/**
 * Create the read_more test function
 */
function createReadMoreTest() {
  return `
async function test_read_more() {
  return {
    description: 'Checks that "read more" or similar links provide context about their destination. Descriptive link text ensures that users understand where a link will take them, especially when links are encountered out of context. Impacts screen reader users and users with cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Read More test detected',
        description: 'This is a placeholder issue. The read_more tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the tabindex test function
 */
function createTabindexTest() {
  return `
async function test_tabindex() {
  return {
    description: 'Checks for proper usage of tabindex attributes. Proper tabindex usage ensures a logical keyboard navigation order and prevents focus traps. Impacts keyboard-only users and screen reader users.',
    issues: [
      {
        type: 'info',
        title: 'Tabindex test detected',
        description: 'This is a placeholder issue. The tabindex tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the title_attribute test function
 */
function createTitleAttributeTest() {
  return `
async function test_title_attribute() {
  return {
    description: 'Checks that title attributes are not used as the sole means of providing important information. Important information should be directly visible or available through standard controls, as title attributes are not consistently accessible. Impacts screen reader users, keyboard-only users, and mobile users.',
    issues: [
      {
        type: 'info',
        title: 'Title Attribute test detected',
        description: 'This is a placeholder issue. The title_attribute tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the tables test function
 */
function createTablesTest() {
  return `
async function test_tables() {
  return {
    description: 'Checks that data tables have proper headers, captions, and structure. Properly structured tables ensure that users can understand the relationships between data cells and headers. Impacts screen reader users and users with cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Tables test detected',
        description: 'This is a placeholder issue. The tables tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the timers test function
 */
function createTimersTest() {
  return `
async function test_timers() {
  return {
    description: 'Evaluates whether content with time limits can be paused, stopped, or extended. Control over timed content ensures that users who need more time can still access and interact with content. Impacts users with cognitive disabilities, motor disabilities, and those using screen readers.',
    issues: [
      {
        type: 'info',
        title: 'Timers test detected',
        description: 'This is a placeholder issue. The timers tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the videos test function
 */
function createVideosTest() {
  return `
async function test_videos() {
  return {
    description: 'Checks that video content has proper captions, audio descriptions, and transcripts. Accessible video ensures that users who cannot see or hear the video can still access its content. Impacts deaf or hard of hearing users, blind or low vision users, and users in noisy environments.',
    issues: [
      {
        type: 'info',
        title: 'Videos test detected',
        description: 'This is a placeholder issue. The videos tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}