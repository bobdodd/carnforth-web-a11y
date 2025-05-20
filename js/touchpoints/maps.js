/**
 * Maps Test
 * Tests for accessibility issues related to maps
 */
window.test_maps = async function() {
  console.log("=============================================");
  console.log("MAPS TOUCHPOINT TEST STARTED");
  console.log("=============================================");
  
  try {
    console.log("[Maps] Starting maps test...");
    
    // Function to execute in the context of the inspected page
    function analyzeMapAccessibility() {
      // Function to generate XPath for elements
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
          path = `/${tagName}[${idx}]${path}`;
          element = element.parentNode;
        }
        return path;
      }
      
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

      const results = {
        maps: [],
        violations: [],
        summary: {
          totalMaps: 0,
          mapsByProvider: {},
          mapsWithoutTitle: 0,
          mapsWithAriaHidden: 0
        }
      };

      // Find map iframes
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

      // Check if an iframe has interactive content
      function checkForInteractiveContent(iframe) {
        try {
          // In a real implementation, we would try to check the iframe content
          // But for security reasons, we can't directly access cross-origin iframes
          // Instead, we'll use heuristics based on the iframe attributes and source

          // Maps that are known to be interactive
          const interactiveProviders = [
            'google.com/maps', 
            'bing.com/maps', 
            'openstreetmap.org',
            'waze.com',
            'maps.apple.com',
            'mapbox.com',
            'arcgis.com',
            'here.com',
            'tomtom.com'
          ];
          
          const src = iframe.src || '';
          
          // Check for attributes that suggest interactivity
          const hasInteractiveAttributes = 
            iframe.getAttribute('allowfullscreen') === 'true' || 
            iframe.getAttribute('allowfullscreen') === '' ||
            iframe.hasAttribute('allowfullscreen') ||
            iframe.hasAttribute('scrolling') ||
            iframe.hasAttribute('controls') ||
            src.includes('zoom=') ||
            src.includes('&z=') ||
            src.includes('interactive=true') ||
            src.includes('overlay=') ||
            src.includes('layer=') ||
            src.includes('mode=directions') ||
            src.includes('&dirflg=') ||
            src.includes('saddr=') ||
            src.includes('daddr=');
            
          // Check if it's from a provider known to be interactive
          const isFromInteractiveProvider = interactiveProviders.some(provider => 
            src.toLowerCase().includes(provider)
          );
          
          // Check if there are any query parameters - most interactive maps have them
          const hasQueryParams = src.includes('?') && src.includes('=');
          
          // If it's a blank page, it's definitely not interactive
          const isBlankPage = src === 'about:blank' || src === '';
          
          if (isBlankPage) {
            return false;
          }
          
          return hasInteractiveAttributes || isFromInteractiveProvider || hasQueryParams;
        } catch (e) {
          // If there's an error checking, default to assuming it's interactive
          // for safety
          console.error('[Maps] Error checking for interactive content:', e);
          return true;
        }
      }

      // Process each map
      mapIframes.forEach(iframe => {
        const provider = identifyMapProvider(iframe.src);
        const title = iframe.getAttribute('title');
        const ariaLabel = iframe.getAttribute('aria-label');
        const ariaLabelledby = iframe.getAttribute('aria-labelledby');
        const ariaHidden = iframe.getAttribute('aria-hidden');
        const hasAccessibleName = !!title || !!ariaLabel || !!ariaLabelledby;
        const isInteractive = checkForInteractiveContent(iframe);

        // Get HTML snippet
        const iframeHtml = iframe.outerHTML;
        
        // Get CSS selector
        const id = iframe.getAttribute('id');
        const cssSelector = id ? `#${id}` : getFullXPath(iframe);

        const mapInfo = {
          provider: provider,
          src: iframe.src,
          title: title,
          ariaLabel: ariaLabel,
          ariaLabelledby: ariaLabelledby,
          hasAccessibleName: hasAccessibleName,
          ariaHidden: ariaHidden === 'true',
          isInteractive: isInteractive,
          dimensions: {
            width: iframe.getAttribute('width'),
            height: iframe.getAttribute('height')
          },
          selector: cssSelector,
          xpath: getFullXPath(iframe),
          html: iframeHtml
        };

        results.maps.push(mapInfo);

        // Update summary
        results.summary.mapsByProvider[provider] = 
          (results.summary.mapsByProvider[provider] || 0) + 1;

        // Check for violations
        if (!hasAccessibleName) {
          results.summary.mapsWithoutTitle++;
          results.violations.push({
            type: 'missing-accessible-name',
            provider: provider,
            src: iframe.src,
            selector: cssSelector,
            xpath: getFullXPath(iframe),
            html: iframeHtml
          });
        }

        if (ariaHidden === 'true') {
          results.summary.mapsWithAriaHidden++;
          
          if (isInteractive) {
            // If interactive with aria-hidden, more serious issue
            results.violations.push({
              type: 'aria-hidden-interactive',
              provider: provider,
              src: iframe.src,
              title: title,
              selector: cssSelector,
              xpath: getFullXPath(iframe),
              html: iframeHtml,
              isInteractive: true
            });
          } else {
            // Non-interactive with aria-hidden
            results.violations.push({
              type: 'aria-hidden',
              provider: provider,
              src: iframe.src,
              title: title,
              selector: cssSelector,
              xpath: getFullXPath(iframe),
              html: iframeHtml,
              isInteractive: false
            });
          }
        }
      });

      // Also check for map div elements (some providers use divs)
      const mapDivs = Array.from(document.querySelectorAll('div'))
        .filter(div => {
          const classValue = div.className ? div.className.toString() : '';
          const idValue = div.id || '';
          const classAndId = (classValue + ' ' + idValue).toLowerCase();
          
          // Check if this is likely to be a map container
          // Exclude common false positives like sitemaps, heatmaps, imagemaps, etc.
          return classAndId.includes('map') && 
                 !classAndId.includes('sitemap') && // Exclude sitemaps
                 !classAndId.includes('heatmap') && // Exclude heatmaps
                 !classAndId.includes('imagemap') && // Exclude image maps
                 !classAndId.includes('site-map') && // Exclude site maps
                 !classAndId.includes('site_map') && // Exclude site maps
                 !classAndId.includes('roadmap') && // Exclude roadmaps 
                 !classAndId.includes('mindmap'); // Exclude mind maps
        });

      mapDivs.forEach(div => {
        // Look for known map provider scripts or styles
        const hasMapboxGL = document.querySelector('script[src*="mapbox-gl"]');
        const hasLeaflet = document.querySelector('link[href*="leaflet"]');
        const hasGoogleMaps = document.querySelector('script[src*="maps.google"]');
        const hasOpenLayers = document.querySelector('script[src*="openlayers"]');
        const hasArcGIS = document.querySelector('script[src*="arcgis"]');
        const hasHERE = document.querySelector('script[src*="here"]');
        
        let provider = 'Unknown Map Provider';
        if (hasMapboxGL) provider = 'Mapbox';
        if (hasLeaflet) provider = 'Leaflet';
        if (hasGoogleMaps) provider = 'Google Maps';
        if (hasOpenLayers) provider = 'OpenLayers';
        if (hasArcGIS) provider = 'ArcGIS';
        if (hasHERE) provider = 'HERE Maps';

        const ariaLabel = div.getAttribute('aria-label');
        const ariaLabelledby = div.getAttribute('aria-labelledby');
        const role = div.getAttribute('role');
        const hasAccessibleName = !!ariaLabel || !!ariaLabelledby;
        
        // Get HTML snippet
        const divHtml = div.outerHTML;
        
        // Get CSS selector
        const id = div.getAttribute('id');
        const cssSelector = id ? `#${id}` : (div.className ? `.${div.className.split(' ')[0].replace(/:/g, '\\:')}` : getFullXPath(div));

        const mapInfo = {
          provider: provider,
          type: 'div',
          ariaLabel: ariaLabel,
          ariaLabelledby: ariaLabelledby,
          role: role,
          hasAccessibleName: hasAccessibleName,
          selector: cssSelector,
          xpath: getFullXPath(div),
          html: divHtml
        };
        
        results.maps.push(mapInfo);
        results.summary.mapsByProvider[provider] = (results.summary.mapsByProvider[provider] || 0) + 1;

        // Check if the div map is likely to be interactive
        const hasInteractiveAttributes = div.hasAttribute('tabindex') || 
                                     div.querySelector('button, a, input, select, textarea') !== null ||
                                     div.getAttribute('role') === 'application' ||
                                     div.querySelector('[role="button"]') !== null;
                                     
        // Check if the div has aria-hidden
        const ariaHidden = div.getAttribute('aria-hidden');
        
        // For interactive div maps with aria-hidden, this is a more serious issue
        if (ariaHidden === 'true' && hasInteractiveAttributes) {
          results.violations.push({
            type: 'aria-hidden-interactive',
            provider: provider,
            element: 'div',
            selector: cssSelector,
            xpath: getFullXPath(div),
            html: divHtml,
            isInteractive: true
          });
        }
        // For non-interactive div maps with aria-hidden, this is a warning
        else if (ariaHidden === 'true') {
          results.violations.push({
            type: 'aria-hidden',
            provider: provider,
            element: 'div',
            selector: cssSelector,
            xpath: getFullXPath(div),
            html: divHtml,
            isInteractive: false
          });
        }
        // Check for accessibility attributes on div-based maps
        else if (!hasAccessibleName || !role) {
          results.violations.push({
            type: 'div-map-missing-attributes',
            provider: provider,
            element: 'div',
            selector: cssSelector,
            xpath: getFullXPath(div),
            html: divHtml
          });
        }
      });

      results.summary.totalMaps = results.maps.length;

      return {
        pageFlags: {
          hasMaps: results.maps.length > 0,
          hasMapsWithoutTitle: results.summary.mapsWithoutTitle > 0,
          hasMapsWithAriaHidden: results.summary.mapsWithAriaHidden > 0,
          details: {
            totalMaps: results.summary.totalMaps,
            mapsByProvider: results.summary.mapsByProvider,
            mapsWithoutTitle: results.summary.mapsWithoutTitle,
            mapsWithAriaHidden: results.summary.mapsWithAriaHidden
          }
        },
        results: results
      };
    }

    // Execute the analyzer function in the context of the inspected page
    const mapAnalysis = await new Promise((resolve) => {
      console.log('[Maps] Executing analyzeMapAccessibility function');
      chrome.devtools.inspectedWindow.eval(
        `(${analyzeMapAccessibility.toString()})()`,
        { useContentScriptContext: true },
        (result, isException) => {
          if (isException) {
            console.error('[Maps] Error analyzing maps:', isException);
            resolve({ error: isException });
          } else {
            console.log('[Maps] Received analysis result:', result);
            resolve(result);
          }
        }
      );
    });

    if (mapAnalysis.error) {
      return {
        description: 'Evaluates embedded digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including Google Maps, Mapbox, and Leaflet, and checks that they are properly labeled and accessible to screen reader users.',
        issues: [{
          type: 'error',
          title: 'Error analyzing maps',
          description: `An error occurred while analyzing maps: ${mapAnalysis.error.toString()}`
        }]
      };
    }

    // Initialize issues array
    const issues = [];
    const mapsData = mapAnalysis;

    // Add some debug info about the mapsData
    console.log('[Maps] Maps data details:', {
      hasMaps: mapsData.pageFlags?.hasMaps,
      totalMaps: mapsData.results?.summary?.totalMaps,
      mapsByProvider: mapsData.results?.summary?.mapsByProvider,
      mapsWithoutTitle: mapsData.results?.summary?.mapsWithoutTitle,
      mapsWithAriaHidden: mapsData.results?.summary?.mapsWithAriaHidden,
      mapsList: mapsData.results?.maps,
      violations: mapsData.results?.violations
    });

    // 1. If no maps are found, include an info message about it
    if (!mapsData.pageFlags.hasMaps) {
      console.log('[Maps] No maps found on the page');
      return {
        description: 'Evaluates embedded digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including Google Maps, Mapbox, and Leaflet, and checks that they are properly labeled and accessible to screen reader users.',
        issues: [{
          type: 'info',
          title: 'No maps detected on page',
          description: 'No interactive maps were detected on this page. This test looks for common map implementations including Google Maps, Bing Maps, Mapbox, Leaflet, and others.'
        }]
      };
    }

    // 2. Maps Without Title Attributes
    if (mapsData.pageFlags.hasMapsWithoutTitle) {
      const violations = mapsData.results.violations.filter(v => v.type === 'missing-accessible-name');
      
      // For individual maps (up to 3), create separate issues
      violations.slice(0, 3).forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        
        issues.push({
          type: 'fail',
          title: `${provider} map missing accessible name`,
          description: `A map iframe is missing an accessible name (title, aria-label, or aria-labelledby attribute). Screen reader users won't be able to identify the purpose of this map.`,
          selector: violation.selector,
          xpath: mapXpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users and users with cognitive disabilities',
            severity: 'High',
            why: 'Screen reader users rely on accessible names to understand the purpose of the map. Without a descriptive title, users may not understand what information the map is conveying.'
          },
          wcag: {
            principle: 'Operable, Robust',
            guideline: '2.4 Navigable, 4.1 Compatible',
            successCriterion: '2.4.1 Bypass Blocks, 4.1.2 Name, Role, Value',
            level: 'A'
          },
          remediation: [
            'Add a title attribute to the map iframe',
            'Ensure the title describes the map\'s purpose (e.g., "Map showing our office locations")',
            'Alternatively, you can use aria-label or aria-labelledby attributes',
            'Test with a screen reader to verify the map is properly announced'
          ],
          codeExample: {
            before: `<iframe 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  style="border:0;"
  allowfullscreen=""
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>`,
            after: `<iframe 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  title="Map showing our office location at 123 Main Street, Chicago"
  style="border:0;"
  allowfullscreen=""
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>`
          }
        });
      });
      
      // For maps beyond the first 3, continue to include them individually
      violations.slice(3).forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        
        issues.push({
          type: 'fail',
          title: `${provider} map missing accessible name`,
          description: `A map iframe is missing an accessible name (title, aria-label, or aria-labelledby attribute). Screen reader users won't be able to identify the purpose of this map.`,
          selector: violation.selector,
          xpath: mapXpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users and users with cognitive disabilities',
            severity: 'High',
            why: 'Screen reader users rely on accessible names to understand the purpose of the map. Without a descriptive title, users may not understand what information the map is conveying.'
          },
          wcag: {
            principle: 'Operable, Robust',
            guideline: '2.4 Navigable, 4.1 Compatible',
            successCriterion: '2.4.1 Bypass Blocks, 4.1.2 Name, Role, Value',
            level: 'A'
          },
          remediation: [
            'Add a title attribute to the map iframe',
            'Ensure the title describes the map\'s purpose (e.g., "Map showing our office locations")',
            'Alternatively, you can use aria-label or aria-labelledby attributes',
            'Test with a screen reader to verify the map is properly announced'
          ],
          codeExample: {
            before: `<iframe 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  style="border:0;"
  allowfullscreen=""
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>`,
            after: `<iframe 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  title="Map showing our office location at 123 Main Street, Chicago"
  style="border:0;"
  allowfullscreen=""
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>`
          }
        });
      });
    }

    // 3a. Maps With aria-hidden='true' that are interactive (serious fail)
    const interactiveHiddenViolations = mapsData.results.violations.filter(v => v.type === 'aria-hidden-interactive');
    
    if (interactiveHiddenViolations.length > 0) {
      // Process interactive maps with aria-hidden (all of them individually)
      interactiveHiddenViolations.forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        const elementType = violation.element === 'div' ? 'div' : 'iframe';
        
        // Primary issue - Information and Relationships
        issues.push({
          type: 'fail',
          title: `${provider} interactive map incorrectly hidden with aria-hidden='true'`,
          description: `This interactive map has aria-hidden="true" which creates a serious accessibility issue. The map becomes invisible to screen-reader users while remaining interactive for keyboard users. This creates a "silent focus trap" where keyboard users can tab into the map and get stuck without any screen reader feedback.`,
          selector: violation.selector,
          xpath: mapXpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users who navigate with a keyboard',
            severity: 'Critical',
            why: 'This creates a "silent focus trap" in the accessibility tree. Keyboard users can tab into and interact with elements inside the map, but these interactions will be completely silent for screen-reader users. Focus will move through interactive elements with no audio feedback, creating a confusing and disorienting experience.'
          },
          wcag: {
            principle: 'Perceivable, Operable',
            guideline: '1.3 Adaptable, 2.1 Keyboard Accessible',
            successCriterion: '1.3.1 Info and Relationships, 2.1.1 Keyboard',
            level: 'A'
          },
          remediation: [
            'Remove aria-hidden="true" from the interactive map',
            'Add proper accessible name with title, aria-label, or aria-labelledby',
            'For complex maps, provide an accessible alternative like a data table or descriptive text',
            'If the map must be hidden from screen readers, ensure it is also not focusable with the keyboard',
            'Test with a screen reader to verify the experience is equivalent for all users'
          ],
          codeExample: {
            before: `<${elementType} 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  aria-hidden="true"
  allowfullscreen=""
  loading="lazy">
</${elementType}>`,
            after: `<${elementType}
  src="https://www.google.com/maps/embed?pb=..."
  width="600" 
  height="450"
  title="Interactive map showing our office location"
  allowfullscreen=""
  loading="lazy">
</${elementType}>

<!-- OR provide an accessible alternative -->
<div class="map-alternative">
  <h3>Our Office Location</h3>
  <p>Our office is located at 123 Main Street, Chicago, IL.</p>
  <p>Nearby landmarks: Two blocks east of Grant Park.</p>
  <p>Public transit: Red Line (State/Lake station)</p>
</div>`
          }
        });
        
        // Secondary issue - Text Alternatives warning
        issues.push({
          type: 'warning',
          title: `${provider} map content may lack text alternatives`,
          description: `The map with aria-hidden="true" may contain important visual information that has no text alternative. If this map presents content that is not available elsewhere on the page, this creates an accessibility barrier.`,
          selector: violation.selector,
          xpath: mapXpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users',
            severity: 'Medium',
            why: 'Maps often contain important location or spatial information. If this information is hidden from screen readers and not provided in another format, it may violate WCAG 1.1.1 by failing to provide text alternatives for non-text content.'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: '1.1 Text Alternatives',
            successCriterion: '1.1.1 Non-text Content',
            level: 'A'
          },
          remediation: [
            'Provide a text description of what the map shows',
            'Add a data table with the key locations or information from the map',
            'Ensure all important information conveyed visually is also available in text format'
          ],
          codeExample: {
            before: `<!-- Map without text alternatives -->
<div class="map-container">
  <${elementType} 
    src="https://www.google.com/maps/embed?pb=..."
    width="600"
    height="450"
    aria-hidden="true">
  </${elementType}>
</div>`,
            after: `<!-- Map with text alternatives -->
<div class="map-container">
  <${elementType} 
    src="https://www.google.com/maps/embed?pb=..."
    width="600"
    height="450"
    title="Map showing our office location">
  </${elementType}>
  
  <!-- Added text alternatives for key map information -->
  <div class="map-description">
    <h3>Our Office Location</h3>
    <p>Address: 123 Main Street, Chicago, IL 60601</p>
    <h4>Key Information:</h4>
    <ul>
      <li>Nearby landmarks: Two blocks east of City Hall</li>
      <li>Public transit: Red Line (State/Lake station)</li>
      <li>Parking: Public garage available at 130 Main Street</li>
    </ul>
  </div>
</div>`
          }
        });
      });
    }
    
    // 3b. Maps With aria-hidden='true' that are not interactive (warning)
    const nonInteractiveHiddenViolations = mapsData.results.violations.filter(v => v.type === 'aria-hidden');
    
    if (nonInteractiveHiddenViolations.length > 0) {
      // Process non-interactive maps with aria-hidden (all of them individually)
      nonInteractiveHiddenViolations.forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        const elementType = violation.element === 'div' ? 'div' : 'iframe';
        
        issues.push({
          type: 'warning',
          title: `${provider} map hidden with aria-hidden='true'`,
          description: `This map has aria-hidden='true' which makes it completely invisible to screen-reader users. While this map appears to be non-interactive, it may still contain important visual information that should be accessible to all users. Screen-reader users won't receive any information about the map's presence or content.`,
          selector: violation.selector,
          xpath: mapXpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users',
            severity: 'Medium',
            why: 'Using aria-hidden="true" removes the element from the accessibility tree, making any geographic or location information in the map unavailable to people who rely on screen-readers.'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: '1.1 Text Alternatives',
            successCriterion: '1.1.1 Non-text Content',
            level: 'A'
          },
          remediation: [
            'If the map conveys important information: Remove aria-hidden="true" and add descriptive text (via title, aria-label, or nearby content)',
            'If the map is purely decorative: Consider adding role="presentation" instead of aria-hidden',
            'Add text nearby that describes what the map is showing - this benefits all users',
            'For complex maps, consider providing an accessible alternative like a data table or descriptive text'
          ],
          codeExample: {
            before: `<!-- Map hidden from screen readers -->
<${elementType} 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  aria-hidden="true">
</${elementType}>`,
            after: `<!-- Option 1: If map contains important information -->
<${elementType} 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  title="Map showing our office location at 123 Main Street">
</${elementType}>

<!-- OR Option 2: If map is purely decorative -->
<${elementType} 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  role="presentation">
</${elementType}>`
          }
        });
      });
    }

    // 4. Div-based Maps Without Proper Accessibility Attributes
    const divMapViolations = mapsData.results.violations.filter(v => v.type === 'div-map-missing-attributes');
    
    if (divMapViolations.length > 0) {
      // For individual div maps, create separate issues
      divMapViolations.forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        
        issues.push({
          type: 'fail',
          title: `${provider} div-based map missing accessibility attributes`,
          description: `This div-based map implementation is missing essential accessibility attributes (aria-label and role). Unlike traditional HTML elements (like <img>), div elements have no semantic meaning to assistive technologies. Without proper ARIA attributes, screen-reader users won't know this is a map or understand its purpose.`,
          xpath: mapXpath,
          selector: violation.selector,
          html: violation.html,
          impact: {
            who: 'Screen reader users, keyboard-only users',
            severity: 'High',
            why: 'Modern mapping libraries (like Mapbox, Leaflet, Google Maps JS API) typically render in <div> elements, which are semantically meaningless to people using screen readers. Without proper ARIA attributes, the map becomes an unidentified "group" or is announced simply as "div", providing no context about its purpose or content.'
          },
          wcag: {
            principle: 'Perceivable, Robust',
            guideline: '1.1 Text Alternatives, 4.1 Compatible',
            successCriterion: '1.1.1 Non-text Content, 4.1.2 Name, Role, Value',
            level: 'A'
          },
          remediation: [
            'For interactive maps: Add role="application" to the map container',
            'For decorative/static maps: Add role="img" to the map container',
            'Add an aria-label attribute that concisely describes what the map shows (e.g., "Map of downtown Chicago")',
            'Consider adding descriptive text or a caption adjacent to the map visible to all users',
            'For complex maps, provide alternative ways to access the same information (data tables, text descriptions)',
            'Ensure all map controls are keyboard accessible with proper labels'
          ],
          codeExample: {
            before: `<div id="map" class="map-container">
  <!-- Map content rendered by JavaScript library -->
</div>`,
            after: `<!-- For interactive maps -->
<div id="map" 
  class="map-container"
  role="application"
  aria-label="Interactive map showing our store locations in Chicago">
  <!-- Map content rendered by JavaScript library -->
</div>

<!-- OR for static/decorative maps -->
<div id="map" 
  class="map-container"
  role="img"
  aria-label="Map showing our office location at 123 Main Street">
  <!-- Map content rendered by JavaScript library -->
</div>`
          }
        });
      });
    }

    // 5. If maps are found but no accessibility issues detected, add an info message
    if (mapsData.pageFlags.hasMaps && issues.length === 0) {
      // Create a formatted string of map providers and counts
      const providersInfo = Object.entries(mapsData.results.summary.mapsByProvider)
        .map(([provider, count]) => `${provider}: ${count}`)
        .join(', ');
      
      issues.push({
        type: 'info',
        title: 'Maps with no accessibility issues detected',
        description: `${mapsData.results.summary.totalMaps} map${mapsData.results.summary.totalMaps !== 1 ? 's' : ''} found on the page (${providersInfo}). No accessibility issues detected.`
      });
    }
    
    console.log('[Maps] Returning final issues:', issues);
    
    return {
      description: 'Evaluates embedded digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including Google Maps, Mapbox, and Leaflet, and checks that they are properly labeled and accessible to screen reader users.',
      issues: issues
    };
  } catch (error) {
    console.error(`[Maps] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates embedded digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including Google Maps, Mapbox, and Leaflet, and checks that they are properly labeled and accessible to screen reader users.',
      issues: [{
        type: 'error',
        title: `Error running maps test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};