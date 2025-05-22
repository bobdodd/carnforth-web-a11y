/**
 * Debug script to test content script and touchpoint function injection
 * 
 * To use:
 * 1. Open fixtures/maps_test.html in Chrome
 * 2. Open DevTools console
 * 3. Copy and paste this entire file into the console
 * 4. Check if the touchpoint functions are correctly injected
 */

// Check if the test_maps function exists in the global scope
function checkTouchpointFunctions() {
  const touchpoints = [
    'accessible_name', 'animation', 'color_contrast', 'color_use', 
    'dialogs', 'electronic_documents', 'event_handling', 
    'floating_content', 'focus_management', 'fonts', 'forms',
    'headings', 'images', 'landmarks', 'language', 'lists',
    'maps', 'read_more', 'tabindex', 'title_attribute',
    'tables', 'timers', 'videos'
  ];
  
  console.log("Checking for injected touchpoint functions...");
  
  const results = {};
  
  touchpoints.forEach(touchpoint => {
    const functionName = `test_${touchpoint}`;
    const exists = typeof window[functionName] === 'function';
    results[functionName] = exists;
    
    console.log(`${functionName}: ${exists ? '✅ FOUND' : '❌ NOT FOUND'}`);
  });
  
  return results;
}

// Simulate the touchpoint-loader.js injection
function injectMapsTestFunction() {
  console.log("Manually injecting test_maps function...");
  
  // Create a script element to inject the test function
  const script = document.createElement('script');
  script.textContent = `
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
        const result = {
          description: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
          issues: []
        };
        const summary = {
          totalMaps: 0,
          mapsByProvider: {},
          mapsWithoutTitle: 0,
          mapsWithAriaHidden: 0,
          divMapsWithoutAttributes: 0
        };

        console.log("Running test_maps function...");
        console.log("Checking for iframe-based maps...");
        
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

        console.log(\`Found \${mapIframes.length} iframe-based maps\`);

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
          maps.push({
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
          });

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

        console.log("Checking for div-based maps...");
        // 2. Also check for map div elements (some providers use divs)
        const mapDivs = Array.from(document.querySelectorAll('div[class*="map"], div[id*="map"]'))
          .filter(div => {
            const classAndId = ((div.className || '') + ' ' + (div.id || '')).toLowerCase();
            return classAndId.includes('map') && 
                  !classAndId.includes('sitemap') && // Exclude sitemaps
                  !classAndId.includes('heatmap');   // Exclude heatmaps
          });

        console.log(\`Found \${mapDivs.length} div-based maps\`);

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
          maps.push({
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
          });
          
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

        // Create issues from violations
        
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
            fixedHtml: fixedHtml
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
            fixedHtml: fixedHtml
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
            fixedHtml: fixedHtml
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

        console.log("Maps test result:", result);
        return result;
      } catch (error) {
        console.error(\`Error in Maps touchpoint test: \${error}\`);
        console.log(error.stack);
        
        return {
          description: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
          issues: [{
            type: 'error',
            title: \`Error running Maps test\`,
            description: \`An error occurred while testing: \${error.message}\`
          }]
        };
      }
    }
    
    console.log("test_maps function has been successfully injected into the global scope");
  `;
  
  // Add the script to the page
  document.head.appendChild(script);
  
  // Check if it was injected successfully
  if (typeof window.test_maps === 'function') {
    console.log("✅ test_maps function injected successfully!");
  } else {
    console.log("❌ Failed to inject test_maps function!");
  }
}

// Test running the maps touchpoint
async function runMapsTest() {
  console.log("Manually running the maps touchpoint test...");
  
  try {
    // Check if the function exists first
    if (typeof window.test_maps !== 'function') {
      console.log("⚠️ test_maps function not found. Injecting it first...");
      injectMapsTestFunction();
    }
    
    // Now try to run it
    const result = await window.test_maps();
    console.log("Maps test completed successfully:");
    console.log(result);
    return result;
  } catch (error) {
    console.error("Error running test_maps:", error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

// Execute the tests
console.log("Starting debug tests...");
checkTouchpointFunctions();
runMapsTest();