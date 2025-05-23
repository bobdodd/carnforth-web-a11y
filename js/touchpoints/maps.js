/**
 * Maps Touchpoint - Reference Implementation for Carnforth Web A11y
 * 
 * This touchpoint serves as the primary reference for implementing accessibility tests.
 * It demonstrates key patterns and approaches that should be used across all touchpoints.
 * 
 * WHAT THIS TESTS:
 * - Digital maps embedded in web pages (iframes, divs, SVGs, static images)
 * - Proper labeling and ARIA attributes for screen reader accessibility
 * - Detection of maps hidden from assistive technology
 * 
 * KEY LEARNING POINTS:
 * 1. Multiple detection strategies increase accuracy
 * 2. Heuristic analysis helps identify element purposes
 * 3. Provider-specific knowledge improves recommendations
 * 4. Different map types require different accessibility approaches
 * 
 * WCAG COVERAGE:
 * - 1.1.1 Non-text Content (Level A) - Maps need text alternatives
 * - 2.4.1 Bypass Blocks (Level A) - Maps should be identifiable
 * - 4.1.2 Name, Role, Value (Level A) - Proper semantics for custom widgets
 */
window.test_maps = async function() {
  // Educational: Console logging helps developers debug issues during development
  // Pattern: Use clear separators in console to make test boundaries obvious
  console.log("=============================================");
  console.log("MAPS TOUCHPOINT TEST STARTED");
  console.log("=============================================");
  
  try {
    console.log("[Maps] Starting maps test...");
    
    // Chrome Extension Architecture Note:
    // This function runs in the context of the inspected page, not the extension.
    // We define it here and inject it to access the page's DOM directly.
    // This is necessary because Chrome extensions have isolated contexts.
    function analyzeMapAccessibility() {
      // Utility Pattern: XPath Generation
      // Why XPath? CSS selectors can fail with special characters or when IDs are missing.
      // XPath provides a reliable fallback for element identification.
      // This pattern should be reused across all touchpoints for consistency.
      function getFullXPath(element) {
        if (!element) return '';
        
        // Educational: Count position among siblings of same tag type
        // This ensures unique identification even without IDs or classes
        function getElementIdx(el) {
          let count = 1;
          for (let sib = el.previousSibling; sib; sib = sib.previousSibling) {
            // Only count element nodes (nodeType 1), not text nodes
            if (sib.nodeType === 1 && sib.tagName === el.tagName) {
              count++;
            }
          }
          return count;
        }

        // Build XPath from element up to document root
        let path = '';
        while (element && element.nodeType === 1) {
          let idx = getElementIdx(element);
          let tagName = element.tagName.toLowerCase();
          path = `/${tagName}[${idx}]${path}`;
          element = element.parentNode;
        }
        return path;
      }
      
      // Pattern: Provider Detection
      // Why identify providers? Different map services have different accessibility features
      // and limitations. Provider-specific guidance improves remediation quality.
      // Educational: This shows how to use URL patterns for service identification
      function identifyMapProvider(src) {
        const srcLower = src.toLowerCase();
        
        // Common providers and their URL patterns
        // Order matters: check more specific patterns first
        
        // Major Western providers
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
        
        // Asian providers (high priority - significant global usage)
        if (srcLower.includes('map.baidu.com') || srcLower.includes('api.map.baidu.com')) return 'Baidu Maps';
        if (srcLower.includes('amap.com') || srcLower.includes('webapi.amap.com')) return 'Amap';
        if (srcLower.includes('map.naver.com') || srcLower.includes('openapi.naver.com')) return 'Naver Maps';
        if (srcLower.includes('map.kakao.com') || srcLower.includes('dapi.kakao.com')) return 'Kakao Maps';
        
        // Regional/specialized providers
        if (srcLower.includes('2gis.com') || srcLower.includes('maps.2gis.com')) return '2GIS';
        if (srcLower.includes('mapy.cz') || srcLower.includes('api.mapy.cz')) return 'Mapy.cz';
        if (srcLower.includes('maptiler.com') || srcLower.includes('api.maptiler.com')) return 'Maptiler';
        if (srcLower.includes('viamichelin.com')) return 'ViaMichelin';
        if (srcLower.includes('ordnancesurvey.co.uk') || srcLower.includes('api.os.uk')) return 'Ordnance Survey';
        if (srcLower.includes('yandex') && srcLower.includes('maps')) return 'Yandex Maps';
        if (srcLower.includes('geoportail.gouv.fr')) return 'IGN Géoportail';
        if (srcLower.includes('sygic.com')) return 'Sygic';
        if (srcLower.includes('carto.com') || srcLower.includes('cartodb')) return 'Carto';
        
        // Always provide a fallback for unknown providers
        return 'Unknown Map Provider';
      }

      // Data Structure Pattern: Results Object
      // This structure separates raw findings (maps) from issues (violations)
      // and provides summary statistics for quick overview.
      // Pattern: Always structure results for both detailed analysis and summary reporting
      const results = {
        maps: [],        // All detected maps, regardless of issues
        violations: [],  // Specific accessibility problems found
        touchTargetViolations: [], // Touch target size issues in map controls
        summary: {       // Aggregate data for reporting
          totalMaps: 0,
          mapsByProvider: {},
          mapsWithoutTitle: 0,
          mapsWithAriaHidden: 0,
          smallTouchTargets: 0
        }
      };

      // Detection Strategy 1: Iframe-based Maps
      // Most embedded maps use iframes for isolation and security
      // Educational: We cast NodeList to Array for better manipulation methods
      const mapIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
        const src = iframe.src || '';
        
        // Pattern: Multiple detection strategies reduce false negatives
        // We check for various URL patterns that indicate map content
        // Note: 'map' alone could match non-map content, so we also check specific providers
        return src.includes('map') || 
               // Western providers
               src.includes('maps.google') ||
               src.includes('maps.bing') ||
               src.includes('openstreetmap') ||
               src.includes('waze') ||
               src.includes('mapbox') ||
               src.includes('arcgis') ||
               src.includes('here.com') ||
               src.includes('tomtom') ||
               src.includes('maps.apple') ||
               // Asian providers
               src.includes('map.baidu') ||
               src.includes('amap.com') ||
               src.includes('map.naver') ||
               src.includes('map.kakao') ||
               // Additional providers  
               src.includes('2gis') ||
               src.includes('mapy.cz') ||
               src.includes('maptiler') ||
               src.includes('yandex.com/maps') ||
               src.includes('viamichelin') ||
               src.includes('ordnancesurvey') ||
               src.includes('carto.com');
      });

      // Pattern: Enhanced Focusable Element Detection
      // Educational: This function demonstrates comprehensive detection of interactive elements
      // It checks for both explicit focusable elements and common interactive patterns
      function scanForFocusableElements(container, options = {}) {
        try {
          // Focusable elements by default (semantic HTML)
          const focusableSelectors = [
            'a[href]',              // Links with href
            'button:not([disabled])', // Enabled buttons
            'input:not([disabled]):not([type="hidden"])', // Visible, enabled inputs
            'select:not([disabled])', // Enabled select elements
            'textarea:not([disabled])', // Enabled textareas
            'iframe',               // Nested iframes
            'object',               // Embedded objects
            'embed',                // Embedded content
            'audio[controls]',      // Audio with controls
            'video[controls]',      // Video with controls
            '[contenteditable="true"]', // Editable content
            '[contenteditable=""]',  // Editable content (shorthand)
            'details > summary',     // Summary elements in details
          ];

          // Elements made focusable via tabindex
          const tabindexSelectors = [
            '[tabindex]:not([tabindex="-1"])', // Positive or 0 tabindex
            '[tabindex="0"]',       // Explicitly in tab order
          ];

          // Interactive ARIA roles that suggest focusability
          const interactiveRoles = [
            '[role="button"]',      // Button role
            '[role="link"]',        // Link role
            '[role="checkbox"]',    // Checkbox role
            '[role="radio"]',       // Radio role
            '[role="tab"]',         // Tab role
            '[role="menuitem"]',    // Menu item role
            '[role="option"]',      // Option role
            '[role="switch"]',      // Switch role
            '[role="textbox"]',     // Textbox role
            '[role="searchbox"]',   // Searchbox role
            '[role="slider"]',      // Slider role
            '[role="spinbutton"]',  // Spinbutton role
            '[role="combobox"]',    // Combobox role
            '[role="listbox"]',     // Listbox role
            '[role="grid"]',        // Grid role (often interactive)
            '[role="gridcell"]',    // Grid cell role
            '[role="treegrid"]',    // Tree grid role
          ];

          // Map-specific interactive patterns
          const mapInteractivePatterns = [
            '.marker[onclick]',     // Clickable markers
            '.pin[onclick]',        // Clickable pins
            '[class*="clickable"]', // Elements with clickable class
            '[class*="interactive"]', // Elements with interactive class
            '[data-interactive]',   // Data attribute for interactivity
            '[data-clickable]',     // Data attribute for clickability
            '.popup',               // Map popups (often interactive)
            '.tooltip',             // Map tooltips
            '.control-button',      // Control buttons
            '.zoom-control',        // Zoom controls
            '.layer-control',       // Layer controls
          ];

          // Combine all selectors
          const allSelectors = [
            ...focusableSelectors,
            ...tabindexSelectors,
            ...interactiveRoles,
            ...mapInteractivePatterns
          ].join(', ');

          // Find all potentially focusable elements
          const focusableElements = container.querySelectorAll(allSelectors);

          // Additional checks for event listeners (if accessible)
          const hasEventListeners = Array.from(container.querySelectorAll('*')).some(el => {
            // Check for inline event handlers
            const hasInlineHandlers = ['onclick', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup']
              .some(handler => el.hasAttribute(handler));
            
            // Check for data attributes suggesting interactivity
            const hasInteractiveData = Array.from(el.attributes)
              .some(attr => attr.name.includes('click') || attr.name.includes('interactive'));

            return hasInlineHandlers || hasInteractiveData;
          });

          // Return comprehensive results
          return {
            hasFocusableElements: focusableElements.length > 0,
            focusableCount: focusableElements.length,
            hasEventListeners: hasEventListeners,
            elements: options.returnElements ? Array.from(focusableElements) : null
          };
        } catch (e) {
          console.error('[Maps] Error scanning for focusable elements:', e);
          // On error, return conservative estimate
          return {
            hasFocusableElements: true, // Assume interactive to avoid missing issues
            focusableCount: -1,
            hasEventListeners: false,
            elements: null
          };
        }
      }

      // Pattern: Heuristic Analysis for Interactivity Detection
      // Chrome Extension Limitation: Cross-origin iframes block content access
      // Solution: Use observable attributes and URL patterns to infer interactivity
      // This demonstrates how to work within browser security constraints
      function checkForInteractiveContent(iframe) {
        try {
          // Educational: Browser security prevents accessing cross-origin iframe content
          // This is a fundamental web security feature (Same-Origin Policy)
          // We must use indirect methods to determine if a map is interactive

          // First, try to scan the iframe's parent container for focusable elements
          // This catches cases where controls are outside the iframe
          const parentContainer = iframe.parentElement;
          if (parentContainer) {
            const parentScan = scanForFocusableElements(parentContainer);
            if (parentScan.hasFocusableElements) {
              return true;
            }
          }

          // Known interactive map providers based on their standard implementations
          // These providers typically offer pan, zoom, and click interactions
          const interactiveProviders = [
            // Major Western providers
            'google.com/maps',      // Google Maps embeds are interactive by default
            'bing.com/maps',        // Bing Maps provides interactive controls
            'openstreetmap.org',    // OSM embeds include navigation
            'waze.com',             // Waze live maps are interactive
            'maps.apple.com',       // Apple Maps web embeds
            'mapbox.com',           // Mapbox GL JS maps
            'arcgis.com',           // Esri ArcGIS web maps
            'here.com',             // HERE Maps platform
            'tomtom.com',           // TomTom web maps
            
            // Asian providers - these are typically interactive
            'map.baidu.com',        // Baidu Maps (China)
            'amap.com',             // Amap/Gaode (China)
            'map.naver.com',        // Naver Maps (Korea)
            'map.kakao.com',        // Kakao Maps (Korea)
            
            // Additional interactive providers
            '2gis.com',             // 2GIS (Russia/CIS)
            'mapy.cz',              // Mapy.cz (Czech Republic)
            'maptiler.com',         // Maptiler cloud maps
            'yandex.com/maps',      // Yandex Maps
            'carto.com'             // Carto visualization platform
          ];
          
          const src = iframe.src || '';
          
          // Heuristic 1: Check iframe attributes that suggest interactivity
          // allowfullscreen suggests the map can be expanded
          // scrolling/controls suggest user interaction is expected
          const hasInteractiveAttributes = 
            iframe.getAttribute('allowfullscreen') === 'true' || 
            iframe.getAttribute('allowfullscreen') === '' ||
            iframe.hasAttribute('allowfullscreen') ||
            iframe.hasAttribute('scrolling') ||
            iframe.hasAttribute('controls') ||
            // URL parameters that indicate interactive features
            src.includes('zoom=') ||        // Zoom level parameter
            src.includes('&z=') ||           // Short form zoom parameter
            src.includes('interactive=true') || // Explicit interactivity flag
            src.includes('overlay=') ||      // Map overlays suggest interaction
            src.includes('layer=') ||        // Layer controls
            src.includes('mode=directions') || // Direction mode is interactive
            src.includes('&dirflg=') ||      // Direction flags
            src.includes('saddr=') ||        // Start address for directions
            src.includes('daddr=');          // Destination address
            
          // Heuristic 2: Known interactive providers
          const isFromInteractiveProvider = interactiveProviders.some(provider => 
            src.toLowerCase().includes(provider)
          );
          
          // Heuristic 3: Query parameters often indicate dynamic/interactive content
          const hasQueryParams = src.includes('?') && src.includes('=');
          
          // Edge case: Blank or empty iframes
          const isBlankPage = src === 'about:blank' || src === '';
          
          if (isBlankPage) {
            return false;
          }
          
          // Combine heuristics for final determination
          return hasInteractiveAttributes || isFromInteractiveProvider || hasQueryParams;
        } catch (e) {
          // Error Handling Pattern: Default to more restrictive assumption
          // If we can't determine interactivity, assume it IS interactive
          // This ensures we don't miss accessibility issues
          console.error('[Maps] Error checking for interactive content:', e);
          return true;
        }
      }

      // Pattern: Process and Analyze Each Element
      // This demonstrates systematic accessibility evaluation
      mapIframes.forEach(iframe => {
        const provider = identifyMapProvider(iframe.src);
        
        // Accessibility Check 1: Accessible Name
        // WCAG 4.1.2 requires interface components to have accessible names
        // For iframes, this can be title, aria-label, or aria-labelledby
        const title = iframe.getAttribute('title');
        const ariaLabel = iframe.getAttribute('aria-label');
        const ariaLabelledby = iframe.getAttribute('aria-labelledby');
        const hasAccessibleName = !!title || !!ariaLabel || !!ariaLabelledby;
        
        // Accessibility Check 2: Hidden State
        // aria-hidden="true" removes element from accessibility tree
        // This is problematic for interactive content
        const ariaHidden = iframe.getAttribute('aria-hidden');
        
        // Accessibility Check 3: Presentation Role
        // role="presentation" removes semantic meaning
        // This is a WCAG 4.1.2 violation for interactive content
        const role = iframe.getAttribute('role');
        const hasPresentation = role === 'presentation' || role === 'none';
        
        // Determine if this map is interactive
        const isInteractive = checkForInteractiveContent(iframe);

        // Capture element HTML for reporting
        // Educational: outerHTML includes the element's tags and attributes
        const iframeHtml = iframe.outerHTML;
        
        // Create reliable selector for element identification
        // Pattern: Prefer ID when available, fall back to XPath
        const id = iframe.getAttribute('id');
        const cssSelector = id ? `#${id}` : getFullXPath(iframe);

        // Check name quality
        const accessibleNameText = title || ariaLabel || ariaLabelledby;
        const nameIsGeneric = hasAccessibleName && isGenericName(accessibleNameText);

        const mapInfo = {
          provider: provider,
          src: iframe.src,
          title: title,
          ariaLabel: ariaLabel,
          ariaLabelledby: ariaLabelledby,
          hasAccessibleName: hasAccessibleName,
          hasGenericName: nameIsGeneric,
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

        // Pattern: Violation Detection and Categorization
        // Different issues have different severity levels and remediation approaches
        
        // Violation Type 1: Missing Accessible Name
        // Impact: Screen reader users can't identify the map's purpose
        // WCAG: 4.1.2 Name, Role, Value (Level A)
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
        // Check for generic names
        else if (nameIsGeneric) {
          results.violations.push({
            type: 'generic-name',
            provider: provider,
            element: 'iframe',
            src: iframe.src,
            selector: cssSelector,
            xpath: getFullXPath(iframe),
            html: iframeHtml,
            currentName: accessibleNameText,
            severity: 'warning'
          });
        }

        // Violation Type 2: Hidden from Assistive Technology
        // aria-hidden="true" completely removes element from accessibility tree
        // This is especially problematic for interactive content
        if (ariaHidden === 'true') {
          results.summary.mapsWithAriaHidden++;
          
          if (isInteractive) {
            // Critical Issue: Interactive content hidden from screen readers
            // Creates "keyboard trap" - users can tab in but get no feedback
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
            // Warning: Non-interactive content hidden
            // May still contain important information
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
        
        // Violation Type 3: Presentation Role on Interactive Content
        // role="presentation" or role="none" removes semantics
        // This violates WCAG 4.1.2 Name, Role, Value for interactive maps
        if (hasPresentation && isInteractive) {
          results.violations.push({
            type: 'presentation-role-interactive',
            provider: provider,
            src: iframe.src,
            title: title,
            selector: cssSelector,
            xpath: getFullXPath(iframe),
            html: iframeHtml,
            isInteractive: true
          });
        }
      });

      // Detection Strategy 2: Div-based Maps
      // Modern JavaScript map libraries often render into div containers
      // This requires more sophisticated detection than iframe maps
      function isDivBasedMap(div) {
        // Educational: Multiple signals increase detection accuracy
        // We check various indicators and combine them to reduce false positives
        
        // Signal 1: Check class and ID attributes for map-related terms
        const classValue = div.className ? div.className.toString() : '';
        const idValue = div.id || '';
        const classAndId = (classValue + ' ' + idValue).toLowerCase();
        
        // Common indicators that suggest a map container
        const mapIndicators = [
          'map',          // Generic map identifier
          'gmap',         // Google Maps shorthand
          'mapbox',       // Mapbox containers
          'leaflet',      // Leaflet.js maps
          'openlayers',   // OpenLayers library
          'ol-map',       // OpenLayers alternative
          'mapview',      // Common map view naming
          'mapcontainer'  // Generic container name
        ];
        
        // False positive prevention: Terms that contain 'map' but aren't maps
        const exclusions = [
          'sitemap',      // Site navigation map
          'heatmap',      // Data visualization
          'imagemap',     // HTML image maps
          'site-map',     // Alternative sitemap spelling
          'site_map',     // Another variant
          'roadmap',      // Project roadmap
          'mindmap',      // Mind mapping tools
          'skipmap',      // Skip navigation
          'mapbox-logo'   // Logo, not the map itself
        ];
        
        // 2. Check for map-specific data attributes
        const hasMapDataAttributes = Array.from(div.attributes)
          .some(attr => attr.name.startsWith('data-') && 
            (attr.name.includes('map') || attr.name.includes('geo') || 
             attr.name.includes('marker') || attr.name.includes('zoom') || 
             attr.name.includes('lat') || attr.name.includes('lng') || 
             attr.name.includes('location')));
        
        // 3. Check for map styling (height, width, position) - maps typically have specific dimensions
        const style = window.getComputedStyle(div);
        const hasMapStyling = style.position === 'relative' && 
                             style.height !== 'auto' && 
                             style.height !== '0px' && 
                             parseInt(style.height) > 100 && 
                             parseInt(style.width) > 100;
        
        // 4. Check for map-related child elements
        const hasMapChildren = div.querySelector('.marker, .pin, .poi, .popup, .infowindow, .zoom, [class*="marker"], [class*="pin"], [class*="poi"]') !== null;
        
        // 5. Check for canvas element within the div (used by some map libraries like Mapbox GL)
        const hasCanvas = div.querySelector('canvas') !== null;
        
        // 6. Check for map controls or attribution
        const hasMapControls = div.querySelector('[class*="control"], [class*="attribution"], [class*="zoom"], [class*="legend"], [class*="marker"]') !== null;
        
        // 7. Check for map libraries' specific elements
        const hasLeafletClasses = div.querySelector('[class*="leaflet"]') !== null;
        const hasGoogleClasses = div.querySelector('[class*="gm-"]') !== null;
        const hasMapboxClasses = div.querySelector('[class*="mapbox"]') !== null;
        const hasOpenLayersClasses = div.querySelector('[class*="ol-"]') !== null;
        
        // Check if the container has any of the map indicators in class/id
        const hasMapIndicator = mapIndicators.some(indicator => classAndId.includes(indicator));
        const hasExclusion = exclusions.some(exclusion => classAndId.includes(exclusion));
        
        // For explicit map classes/ids, we can be more confident it's a map
        if (hasMapIndicator && !hasExclusion) {
          return true;
        }
        
        // For other cases, use multiple signals to reduce false positives
        // Need at least two strong signals to consider it a map
        const strongSignals = [
          hasMapDataAttributes,
          hasMapStyling && (hasMapChildren || hasMapControls),
          hasLeafletClasses,
          hasGoogleClasses,
          hasMapboxClasses,
          hasOpenLayersClasses,
          hasCanvas && hasMapStyling
        ];
        
        const signalCount = strongSignals.filter(signal => signal === true).length;
        
        return signalCount >= 2;
      }
      
      // Find map divs using the improved detection function
      const mapDivs = Array.from(document.querySelectorAll('div')).filter(isDivBasedMap);
        
      // Check for static image maps (img elements with map-related attributes)
      const staticImageMaps = Array.from(document.querySelectorAll('img'))
        .filter(img => {
          // Get attributes to check
          const src = (img.src || '').toLowerCase();
          const alt = (img.alt || '').toLowerCase();
          const classValue = (img.className || '').toLowerCase();
          const idValue = (img.id || '').toLowerCase();
          const classAndId = (classValue + ' ' + idValue).toLowerCase();
          
          // Check for static map service URLs in src
          const isMapServiceURL = 
            src.includes('maps.googleapis.com/maps/api/staticmap') ||  // Google Static Maps API
            src.includes('api.mapbox.com/styles') ||                   // Mapbox Static Images API
            src.includes('staticmap.openstreetmap') ||                 // OpenStreetMap static
            src.includes('static-maps.yandex') ||                      // Yandex Maps static
            src.includes('dev.virtualearth.net/REST/v1/Imagery/Map');  // Bing Maps static

          // Check for map references in alt text
          const altHasMapReference = 
            alt.includes('map') || 
            alt.includes('location') || 
            alt.includes('directions') ||
            alt.includes('area') && (alt.includes('city') || alt.includes('region') || alt.includes('country'));
            
          // Check for map references in class/id
          const hasMapClass = 
            classAndId.includes('map') && 
            !classAndId.includes('sitemap') && 
            !classAndId.includes('heatmap') &&
            !classAndId.includes('roadmap') &&
            !classAndId.includes('mindmap'); 
            
          // If it's from a map service or has explicit map reference in alt text, it's definitely a map
          // Otherwise, it needs map in class/id AND map-like terms in alt text
          return isMapServiceURL || 
                 (altHasMapReference && hasMapClass) ||
                 (alt.includes('map of') || alt.includes('map showing'));
        });
        
      // Check for SVG-based maps (increasingly common for interactive choropleth, vector maps)
      const svgMaps = Array.from(document.querySelectorAll('svg'))
        .filter(svg => {
          // 1. Check for SVG element with map-related classes or IDs
          const classValue = svg.className ? (svg.className.baseVal || svg.className.toString()) : '';
          const idValue = svg.id || '';
          const classAndId = (classValue + ' ' + idValue).toLowerCase();
          
          // 2. Check if SVG has a viewBox attribute (common in maps)
          const hasViewBox = svg.hasAttribute('viewBox');
          
          // 3. Check for common map SVG elements - paths, polygons, etc.
          const hasGeoPaths = svg.querySelectorAll('path, polygon, polyline, g[id*="region"], g[id*="country"], g[id*="state"], g[id*="province"]').length > 0;
          
          // 4. Check for data attributes that suggest this is a map
          const hasDataAttrs = Array.from(svg.attributes)
            .some(attr => attr.name.startsWith('data-') && 
              (attr.name.includes('map') || attr.name.includes('geo') || 
               attr.name.includes('region') || attr.name.includes('country')));
          
          // 5. Check if this SVG has a title element for accessible name
          const hasTitle = svg.querySelector('title') !== null;
          
          // 6. Check for typical map interaction patterns
          const hasZoomControls = svg.closest('div')?.querySelector('[id*="zoom"], [class*="zoom"], [aria-label*="zoom"]') !== null;
          
          // Exclude SVGs that are definitely not maps
          const excludedTypes = ['icon', 'logo', 'chart', 'graph', 'avatar', 'illustration', 'button'];
          const isExcludedType = excludedTypes.some(type => classAndId.includes(type));
          
          // If it has map in class/id, it's very likely a map
          const explicitlyMap = classAndId.includes('map') && 
                                !classAndId.includes('sitemap') && 
                                !classAndId.includes('roadmap') &&
                                !classAndId.includes('mindmap');
                                
          // For other SVGs, we need at least two indicators to consider it a map
          return explicitlyMap || 
                 (!isExcludedType && 
                  ((hasGeoPaths && hasViewBox) || 
                   (hasGeoPaths && hasDataAttrs) || 
                   (hasZoomControls && hasGeoPaths) ||
                   (hasTitle && hasGeoPaths)));
        });

      // Process static image maps
      staticImageMaps.forEach(img => {
        // Get a CSS selector for the image
        const id = img.getAttribute('id');
        const cssSelector = id ? `#${id}` : getFullXPath(img);
        
        // Get HTML snippet
        const imgHtml = img.outerHTML;
        
        // Check for alt text and other attributes
        const alt = img.getAttribute('alt') || '';
        const ariaLabel = img.getAttribute('aria-label') || '';
        const ariaLabelledby = img.getAttribute('aria-labelledby') || '';
        const ariaHidden = img.getAttribute('aria-hidden');
        const longdesc = img.getAttribute('longdesc') || '';
        
        // Determine the map provider based on src
        let provider = 'Static Map Image';
        const src = img.src || '';
        if (src.includes('maps.googleapis.com')) provider = 'Google Static Maps';
        if (src.includes('api.mapbox.com')) provider = 'Mapbox Static Maps';
        if (src.includes('staticmap.openstreetmap')) provider = 'OpenStreetMap Static';
        if (src.includes('static-maps.yandex')) provider = 'Yandex Maps';
        if (src.includes('dev.virtualearth.net')) provider = 'Bing Maps Static';
        
        // Additional static map providers
        if (src.includes('restapi.amap.com/v3/staticmap')) provider = 'Amap Static';
        if (src.includes('map.baidu.com/staticimage')) provider = 'Baidu Static Maps';
        if (src.includes('naveropenapi.apigw.ntruss.com/map-static')) provider = 'Naver Static Maps';
        if (src.includes('map.staticmap.kakao.com')) provider = 'Kakao Static Maps';
        if (src.includes('static.2gis.com')) provider = '2GIS Static';
        if (src.includes('api.mapy.cz/staticmap')) provider = 'Mapy.cz Static';
        if (src.includes('api.maptiler.com/static')) provider = 'Maptiler Static';
        
        // An image has an accessible name if it has alt text, aria-label, or aria-labelledby
        const hasAccessibleName = !!(alt || ariaLabel || ariaLabelledby);
        
        // Detect if the alt text is meaningful
        const meaningfulAltTextLength = alt.length > 10; // Arbitrary threshold for meaningful description
        const hasGenericAltText = alt.toLowerCase() === 'map' || alt.toLowerCase() === 'location' || alt.toLowerCase() === 'map image';
        const hasMeaningfulAltText = meaningfulAltTextLength && !hasGenericAltText;
        
        // Add to results
        const mapInfo = {
          provider: provider,
          type: 'img',
          src: src,
          alt: alt,
          ariaLabel: ariaLabel,
          ariaLabelledby: ariaLabelledby,
          hasAccessibleName: hasAccessibleName,
          hasMeaningfulAltText: hasMeaningfulAltText,
          ariaHidden: ariaHidden === 'true',
          selector: cssSelector,
          xpath: getFullXPath(img),
          html: imgHtml
        };
        
        results.maps.push(mapInfo);
        results.summary.mapsByProvider[provider] = (results.summary.mapsByProvider[provider] || 0) + 1;
        
        // Check for accessibility issues
        
        // Missing alt text
        if (!hasAccessibleName) {
          results.violations.push({
            type: 'static-map-missing-alt',
            provider: provider,
            selector: cssSelector,
            xpath: getFullXPath(img),
            html: imgHtml
          });
        } 
        // Has alt but it's not meaningful
        else if (hasAccessibleName && !hasMeaningfulAltText) {
          results.violations.push({
            type: 'static-map-generic-alt',
            provider: provider,
            selector: cssSelector,
            xpath: getFullXPath(img),
            html: imgHtml,
            alt: alt
          });
        }
        
        // Map with aria-hidden="true"
        if (ariaHidden === 'true') {
          results.violations.push({
            type: 'aria-hidden',
            provider: provider,
            element: 'img',
            selector: cssSelector,
            xpath: getFullXPath(img),
            html: imgHtml,
            isInteractive: false
          });
        }
      });
      
      // Function to determine the map provider more accurately
      function identifyDivMapProvider(div) {
        // First check the page for known map library scripts
        const pageScripts = {
          // Major Western providers
          'Mapbox': document.querySelector('script[src*="mapbox-gl"], script[src*="mapbox.js"]') !== null,
          'Leaflet': document.querySelector('script[src*="leaflet"], link[href*="leaflet"]') !== null,
          'Google Maps': document.querySelector('script[src*="maps.google"], script[src*="googleapis.com/maps"]') !== null,
          'OpenLayers': document.querySelector('script[src*="openlayers"], script[src*="ol.js"], script[src*="ol-debug"]') !== null,
          'ArcGIS': document.querySelector('script[src*="arcgis"], script[src*="esri"]') !== null,
          'HERE Maps': document.querySelector('script[src*="here"], script[src*="api.here.com"]') !== null,
          'Mapfit': document.querySelector('script[src*="mapfit"]') !== null,
          'TomTom': document.querySelector('script[src*="tomtom"], script[src*="api.tomtom.com"]') !== null,
          'Bing Maps': document.querySelector('script[src*="bing"], script[src*="virtualearth"]') !== null,
          'Carto': document.querySelector('script[src*="carto"], link[href*="carto"]') !== null,
          
          // Asian providers
          'Baidu Maps': document.querySelector('script[src*="api.map.baidu.com"]') !== null,
          'Amap': document.querySelector('script[src*="webapi.amap.com/maps"]') !== null,
          'Naver Maps': document.querySelector('script[src*="openapi.map.naver.com"]') !== null,
          'Kakao Maps': document.querySelector('script[src*="dapi.kakao.com"]') !== null,
          
          // Additional providers
          '2GIS': document.querySelector('script[src*="maps.api.2gis.ru"]') !== null,
          'Mapy.cz': document.querySelector('script[src*="api.mapy.cz"]') !== null,
          'Maptiler': document.querySelector('script[src*="cdn.maptiler.com"]') !== null,
          'Yandex Maps': document.querySelector('script[src*="api-maps.yandex.ru"]') !== null,
          'Ordnance Survey': document.querySelector('script[src*="api.os.uk"]') !== null
        };
        
        // Then check the div itself for library-specific classes
        const divClasses = div.className ? div.className.toString().toLowerCase() : '';
        const divId = div.id ? div.id.toLowerCase() : '';
        
        // Look for specific provider signatures in the div
        // Western providers
        if (divClasses.includes('mapbox') || divClasses.includes('mapboxgl') || divId.includes('mapbox')) return 'Mapbox';
        if (divClasses.includes('leaflet') || div.querySelector('.leaflet')) return 'Leaflet';
        if (divClasses.includes('gm-') || div.querySelector('.gm-style') || divId.includes('googlemap')) return 'Google Maps';
        if (divClasses.includes('ol-') || divClasses.includes('openlayers') || divId.includes('openlayers')) return 'OpenLayers';
        if (divClasses.includes('esri') || divClasses.includes('arcgis')) return 'ArcGIS';
        if (divClasses.includes('here-map') || divId.includes('here-map')) return 'HERE Maps';
        if (divClasses.includes('tomtom') || divId.includes('tomtom')) return 'TomTom';
        if (divClasses.includes('bing') || divId.includes('bing')) return 'Bing Maps';
        if (divClasses.includes('carto') || divId.includes('carto')) return 'Carto';
        
        // Asian providers
        if (divClasses.includes('baidu') || divClasses.includes('bmap') || divId.includes('baidu')) return 'Baidu Maps';
        if (divClasses.includes('amap') || divId.includes('amap')) return 'Amap';
        if (divClasses.includes('naver') || divId.includes('naver')) return 'Naver Maps';
        if (divClasses.includes('kakao') || divId.includes('kakao')) return 'Kakao Maps';
        
        // Additional providers
        if (divClasses.includes('2gis') || divId.includes('2gis')) return '2GIS';
        if (divClasses.includes('mapy-cz') || divId.includes('mapy')) return 'Mapy.cz';
        if (divClasses.includes('maptiler') || divId.includes('maptiler')) return 'Maptiler';
        if (divClasses.includes('yandex') || divId.includes('yandex')) return 'Yandex Maps';
        
        // If no specific class indicators, check for map attribution elements which often indicate the provider
        const attribution = div.querySelector('.mapbox-attribution, .leaflet-attribution, .ol-attribution, .gmnoprint, .gm-style-cc');
        if (attribution) {
          const attributionText = attribution.textContent.toLowerCase();
          if (attributionText.includes('mapbox')) return 'Mapbox';
          if (attributionText.includes('leaflet')) return 'Leaflet';
          if (attributionText.includes('google')) return 'Google Maps';
          if (attributionText.includes('openstreetmap') && divClasses.includes('ol-')) return 'OpenLayers';
          if (attributionText.includes('esri') || attributionText.includes('arcgis')) return 'ArcGIS';
          if (attributionText.includes('here')) return 'HERE Maps';
          if (attributionText.includes('tomtom')) return 'TomTom';
          if (attributionText.includes('bing') || attributionText.includes('microsoft')) return 'Bing Maps';
        }
        
        // If we can't identify from the div itself, check page scripts
        for (const [provider, exists] of Object.entries(pageScripts)) {
          if (exists) return provider;
        }
        
        // Check for canvas elements which might indicate vector-based maps
        if (div.querySelector('canvas') && (divClasses.includes('map') || divId.includes('map'))) {
          return 'Vector Map (Canvas-based)';
        }
        
        // If we can't determine the provider, return a generic description
        return 'Unknown Map Provider';
      }
      
      // Function to determine if a div-based map is interactive
      // Enhanced with comprehensive focusable element detection
      function isInteractiveDivMap(div) {
        // Use our comprehensive focusable element scanner
        const scanResult = scanForFocusableElements(div);
        
        // If we found focusable elements, it's definitely interactive
        if (scanResult.hasFocusableElements) {
          return true;
        }
        
        // Additional checks for map-specific patterns that might not be caught by the scanner
        // Check for map interaction attributes on the container itself
        const hasInteractionAttrs = div.hasAttribute('tabindex') || 
                                 div.hasAttribute('onclick') || 
                                 div.hasAttribute('onmousemove') || 
                                 div.hasAttribute('onmousedown') ||
                                 div.hasAttribute('data-interactive') ||
                                 div.getAttribute('role') === 'application';
        
        // Check for map data attributes that suggest interactivity
        const hasInteractiveDataAttrs = Array.from(div.attributes)
          .some(attr => attr.name.startsWith('data-') && 
            (attr.name.includes('interactive') || 
             attr.name.includes('control') || 
             attr.name.includes('zoom') || 
             attr.name.includes('click')));
             
        // Check child canvas for click handlers (common in WebGL maps)
        const canvas = div.querySelector('canvas');
        const canvasHasHandlers = canvas && (
          canvas.hasAttribute('onclick') || 
          canvas.hasAttribute('onmousedown') || 
          canvas.hasAttribute('onmousemove') || 
          canvas.hasAttribute('tabindex'));
        
        // Check if the map uses CSS to indicate interactivity
        const style = window.getComputedStyle(div);
        const hasCursorPointer = style.cursor === 'pointer' || style.cursor === 'grab' || style.cursor === 'grabbing';
        
        return scanResult.hasEventListeners || 
               hasInteractionAttrs || 
               hasInteractiveDataAttrs ||
               canvasHasHandlers ||
               hasCursorPointer;
      }

      // Pattern: Landmark Detection for Div-based Maps
      // Educational: Landmarks provide structural navigation for screen reader users
      // According to WCAG, complex interactive regions should be within landmarks
      function checkLandmarkContext(element) {
        // Landmark roles that provide proper structural context
        const landmarkRoles = [
          'region',         // Generic region landmark
          'main',           // Main content landmark
          'navigation',     // Navigation landmark
          'complementary',  // Complementary content landmark
          'contentinfo',    // Footer landmark
          'banner',         // Header landmark
          'application',    // Application landmark (for interactive widgets)
          'article',        // Article landmark
          'section'         // Section landmark (when labeled)
        ];

        // HTML5 elements that are implicit landmarks
        const landmarkElements = {
          'main': 'main',
          'nav': 'navigation',
          'aside': 'complementary',
          'header': 'banner',     // Only when not within article/section
          'footer': 'contentinfo', // Only when not within article/section
          'section': 'region',    // Only when labeled
          'article': 'article'
        };

        // Traverse up the DOM tree looking for landmarks
        let currentElement = element;
        while (currentElement && currentElement !== document.body) {
          // Check for explicit landmark role
          const role = currentElement.getAttribute('role');
          if (role && landmarkRoles.includes(role)) {
            // Check if the landmark has an accessible name
            const ariaLabel = currentElement.getAttribute('aria-label');
            const ariaLabelledby = currentElement.getAttribute('aria-labelledby');
            const hasAccessibleName = !!ariaLabel || !!ariaLabelledby;
            
            return {
              hasLandmark: true,
              landmarkType: role,
              landmarkElement: currentElement,
              hasAccessibleName: hasAccessibleName,
              landmarkLabel: ariaLabel || ariaLabelledby || null
            };
          }

          // Check for HTML5 landmark elements
          const tagName = currentElement.tagName.toLowerCase();
          if (landmarkElements[tagName]) {
            // Special cases for header/footer (only landmarks at top level)
            if ((tagName === 'header' || tagName === 'footer')) {
              const parent = currentElement.parentElement;
              if (parent && (parent.tagName.toLowerCase() === 'article' || 
                           parent.tagName.toLowerCase() === 'section')) {
                // Not a landmark when inside article/section
                currentElement = currentElement.parentElement;
                continue;
              }
            }

            // Section is only a landmark when labeled
            if (tagName === 'section') {
              const ariaLabel = currentElement.getAttribute('aria-label');
              const ariaLabelledby = currentElement.getAttribute('aria-labelledby');
              if (!ariaLabel && !ariaLabelledby) {
                currentElement = currentElement.parentElement;
                continue;
              }
            }

            return {
              hasLandmark: true,
              landmarkType: landmarkElements[tagName],
              landmarkElement: currentElement,
              hasAccessibleName: true, // HTML5 landmarks have implicit names
              landmarkLabel: null
            };
          }

          currentElement = currentElement.parentElement;
        }

        return {
          hasLandmark: false,
          landmarkType: null,
          landmarkElement: null,
          hasAccessibleName: false,
          landmarkLabel: null
        };
      }

      // Pattern: Heading Association Detection
      // Educational: Headings provide context and navigation structure
      // Maps should be associated with descriptive headings
      function findAssociatedHeading(element) {
        // Look for heading that precedes the map
        let currentElement = element;
        let attempts = 0;
        const maxAttempts = 10; // Limit how far back we look

        // First, check if there's a heading inside the map container
        const internalHeading = element.querySelector('h1, h2, h3, h4, h5, h6');
        if (internalHeading) {
          return {
            hasHeading: true,
            headingLevel: parseInt(internalHeading.tagName.substring(1)),
            headingText: internalHeading.textContent.trim(),
            headingElement: internalHeading,
            headingLocation: 'inside'
          };
        }

        // Look for previous siblings
        while (attempts < maxAttempts) {
          const prevSibling = currentElement.previousElementSibling;
          if (!prevSibling) {
            // No more siblings, try parent's previous sibling
            currentElement = currentElement.parentElement;
            if (!currentElement || currentElement === document.body) {
              break;
            }
            attempts++;
            continue;
          }

          // Check if the sibling is a heading
          const tagName = prevSibling.tagName.toLowerCase();
          if (/^h[1-6]$/.test(tagName)) {
            return {
              hasHeading: true,
              headingLevel: parseInt(tagName.substring(1)),
              headingText: prevSibling.textContent.trim(),
              headingElement: prevSibling,
              headingLocation: 'before'
            };
          }

          // Check if the sibling contains a heading
          const headingInSibling = prevSibling.querySelector('h1, h2, h3, h4, h5, h6');
          if (headingInSibling) {
            return {
              hasHeading: true,
              headingLevel: parseInt(headingInSibling.tagName.substring(1)),
              headingText: headingInSibling.textContent.trim(),
              headingElement: headingInSibling,
              headingLocation: 'nearby'
            };
          }

          currentElement = prevSibling;
          attempts++;
        }

        return {
          hasHeading: false,
          headingLevel: null,
          headingText: null,
          headingElement: null,
          headingLocation: null
        };
      }

      // Pattern: Name Quality Validation
      // Educational: Generic names like "map" provide no useful information
      // Names should describe what the map shows
      function isGenericName(name) {
        if (!name) return false;
        
        const nameLower = name.toLowerCase().trim();
        
        // List of generic, non-descriptive names
        const genericNames = [
          'map',
          'image',
          'graphic',
          'diagram',
          'figure',
          'picture',
          'img',
          'view',
          'visualization',
          'chart',
          'display',
          'untitled',
          'placeholder'
        ];

        // Check if the name is just one of the generic terms
        if (genericNames.includes(nameLower)) {
          return true;
        }

        // Check if name is very short (less than 5 chars is likely not descriptive)
        if (nameLower.length < 5) {
          return true;
        }

        // Check if the name is just "map of" or "image of" without specifics
        if (nameLower === 'map of' || nameLower === 'image of' || nameLower === 'diagram of') {
          return true;
        }

        return false;
      }
      
      mapDivs.forEach(div => {
        // Determine the map provider using our enhanced function
        const provider = identifyDivMapProvider(div);
        
        // Get accessibility attributes
        const ariaLabel = div.getAttribute('aria-label');
        const ariaLabelledby = div.getAttribute('aria-labelledby');
        const role = div.getAttribute('role');
        const hasAccessibleName = !!ariaLabel || !!ariaLabelledby;
        
        // Check landmark and heading context
        const landmarkInfo = checkLandmarkContext(div);
        const headingInfo = findAssociatedHeading(div);
        
        // Check name quality
        const nameIsGeneric = hasAccessibleName && isGenericName(ariaLabel || ariaLabelledby);
        
        // Get HTML snippet - limit size for very large divs
        const divHtml = div.outerHTML.length > 2000 ? 
                        div.outerHTML.substring(0, 2000) + '...' : 
                        div.outerHTML;
        
        // Get CSS selector
        const id = div.getAttribute('id');
        const cssSelector = id ? `#${id}` : (div.className ? `.${div.className.split(' ')[0].replace(/:/g, '\\:')}` : getFullXPath(div));

        // Check if this map is interactive using our enhanced detection
        const isInteractive = isInteractiveDivMap(div);
        
        // Get map dimensions
        const style = window.getComputedStyle(div);
        const dimensions = {
          width: style.width,
          height: style.height
        };
        
        // Find visible text content within the map (for context)
        let visibleText = Array.from(div.querySelectorAll('*'))
          .filter(el => {
            const style = window.getComputedStyle(el);
            return el.textContent.trim() !== '' && 
                   style.display !== 'none' && 
                   style.visibility !== 'hidden' &&
                   !['script', 'style'].includes(el.tagName.toLowerCase());
          })
          .map(el => el.textContent.trim())
          .join(' ')
          .substring(0, 200); // Limit length
        
        // If text is too long, truncate it
        if (visibleText.length === 200) visibleText += '...';
        
        const mapInfo = {
          provider: provider,
          type: 'div',
          ariaLabel: ariaLabel,
          ariaLabelledby: ariaLabelledby,
          role: role,
          hasAccessibleName: hasAccessibleName,
          isInteractive: isInteractive,
          dimensions: dimensions,
          visibleText: visibleText || null,
          selector: cssSelector,
          xpath: getFullXPath(div),
          html: divHtml,
          // New landmark and heading info
          landmarkContext: landmarkInfo,
          headingContext: headingInfo,
          hasGenericName: nameIsGeneric
        };
        
        results.maps.push(mapInfo);
        results.summary.mapsByProvider[provider] = (results.summary.mapsByProvider[provider] || 0) + 1;

        // Check if the div has aria-hidden
        const ariaHidden = div.getAttribute('aria-hidden');
        
        // For interactive div maps with aria-hidden, this is a more serious issue
        if (ariaHidden === 'true' && isInteractive) {
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
        
        // Check for role="presentation" on interactive maps (WCAG 4.1.2 violation)
        if ((role === 'presentation' || role === 'none') && isInteractive) {
          results.violations.push({
            type: 'presentation-role-interactive',
            provider: provider,
            element: 'div',
            selector: cssSelector,
            xpath: getFullXPath(div),
            html: divHtml,
            isInteractive: true
          });
        }
        
        // Check for structural issues with div-based maps
        // According to spec: Must have landmark OR heading (fail if neither, warn if only heading)
        if (!landmarkInfo.hasLandmark && !headingInfo.hasHeading) {
          results.violations.push({
            type: 'div-map-no-structure',
            provider: provider,
            element: 'div',
            selector: cssSelector,
            xpath: getFullXPath(div),
            html: divHtml,
            isInteractive: isInteractive,
            severity: 'fail'
          });
        } else if (!landmarkInfo.hasLandmark && headingInfo.hasHeading) {
          results.violations.push({
            type: 'div-map-heading-only',
            provider: provider,
            element: 'div',
            selector: cssSelector,
            xpath: getFullXPath(div),
            html: divHtml,
            isInteractive: isInteractive,
            headingText: headingInfo.headingText,
            severity: 'warning'
          });
        }
        
        // Check for generic names
        if (hasAccessibleName && nameIsGeneric) {
          results.violations.push({
            type: 'generic-name',
            provider: provider,
            element: 'div',
            selector: cssSelector,
            xpath: getFullXPath(div),
            html: divHtml,
            currentName: ariaLabel || ariaLabelledby,
            severity: 'warning'
          });
        }
        
        // Check for missing accessibility attributes (original check)
        else if (!hasAccessibleName || !role) {
          results.violations.push({
            type: 'div-map-missing-attributes',
            provider: provider,
            element: 'div',
            selector: cssSelector,
            xpath: getFullXPath(div),
            html: divHtml,
            isInteractive: isInteractive,
            missingName: !hasAccessibleName,
            missingRole: !role
          });
        }
      });
      
      // Process SVG-based maps
      svgMaps.forEach(svg => {
        // Get a CSS selector for the SVG
        const id = svg.getAttribute('id');
        const cssSelector = id ? `#${id}` : getFullXPath(svg);
        
        // Get HTML snippet for the SVG - limit to 2000 chars to avoid huge outputs
        const svgHtml = svg.outerHTML.length > 2000 
          ? svg.outerHTML.substring(0, 2000) + '...' 
          : svg.outerHTML;
        
        // Check for accessible name via various SVG methods
        const titleElement = svg.querySelector('title');
        const titleText = titleElement ? titleElement.textContent : null;
        const ariaLabelledby = svg.getAttribute('aria-labelledby');
        const ariaLabel = svg.getAttribute('aria-label');
        const ariaHidden = svg.getAttribute('aria-hidden');
        const role = svg.getAttribute('role');
        
        // SVG maps should have a role attribute (usually 'img' or sometimes 'graphics-document' or 'application' if interactive)
        const hasProperRole = role === 'img' || role === 'graphics-document' || role === 'application' || role === 'figure';
        
        // An SVG has an accessible name if it has a title element, aria-label, or aria-labelledby
        const hasAccessibleName = !!titleText || !!ariaLabel || !!ariaLabelledby;
        
        // Check for interactivity in the SVG
        // Enhanced with comprehensive focusable element detection
        const svgScanResult = scanForFocusableElements(svg);
        const hasInteractiveElements = svgScanResult.hasFocusableElements || 
                                      svg.querySelectorAll('a, [tabindex], [onclick], [onmouseover], [onmousedown], [role="button"]').length > 0;
        const hasInteractiveAttributes = svg.hasAttribute('tabindex') || 
                                        svg.hasAttribute('onclick') || 
                                        svg.hasAttribute('onmouseover') || 
                                        svg.hasAttribute('onmousedown');
        
        const isInteractive = hasInteractiveElements || hasInteractiveAttributes;
        
        // Check name quality
        const accessibleNameText = titleText || ariaLabel || ariaLabelledby;
        const nameIsGeneric = hasAccessibleName && isGenericName(accessibleNameText);
        
        // Detect common mapping libraries that use SVG
        let provider = 'SVG Map';
        if (document.querySelector('script[src*="datamaps"]')) provider = 'Datamaps';
        if (document.querySelector('script[src*="d3-geo"]')) provider = 'D3.js Geo';
        if (document.querySelector('script[src*="topojson"]')) provider = 'TopoJSON';
        if (document.querySelector('script[src*="highcharts"]')) provider = 'Highcharts Maps';
        if (document.querySelector('script[src*="amcharts"]')) provider = 'amCharts Maps';
        
        // Add the SVG map to our results
        const mapInfo = {
          provider: provider,
          type: 'svg',
          titleText: titleText,
          ariaLabel: ariaLabel,
          ariaLabelledby: ariaLabelledby,
          role: role,
          hasAccessibleName: hasAccessibleName,
          hasProperRole: hasProperRole,
          hasGenericName: nameIsGeneric,
          isInteractive: isInteractive,
          selector: cssSelector,
          xpath: getFullXPath(svg),
          html: svgHtml
        };
        
        results.maps.push(mapInfo);
        results.summary.mapsByProvider[provider] = (results.summary.mapsByProvider[provider] || 0) + 1;
        
        // Check for accessibility issues
        
        // Most critical: interactive SVG map with aria-hidden="true"
        if (ariaHidden === 'true' && isInteractive) {
          results.violations.push({
            type: 'aria-hidden-interactive',
            provider: provider,
            element: 'svg',
            selector: cssSelector,
            xpath: getFullXPath(svg),
            html: svgHtml,
            isInteractive: true
          });
        } 
        // Non-interactive SVG with aria-hidden="true"
        else if (ariaHidden === 'true') {
          results.violations.push({
            type: 'aria-hidden',
            provider: provider,
            element: 'svg',
            selector: cssSelector,
            xpath: getFullXPath(svg),
            html: svgHtml,
            isInteractive: false
          });
        }
        
        // Check for role="presentation" on interactive SVG (WCAG 4.1.2 violation)
        if ((role === 'presentation' || role === 'none') && isInteractive) {
          results.violations.push({
            type: 'presentation-role-interactive',
            provider: provider,
            element: 'svg',
            selector: cssSelector,
            xpath: getFullXPath(svg),
            html: svgHtml,
            isInteractive: true
          });
        }
        
        // Check for generic names
        if (hasAccessibleName && nameIsGeneric) {
          results.violations.push({
            type: 'generic-name',
            provider: provider,
            element: 'svg',
            selector: cssSelector,
            xpath: getFullXPath(svg),
            html: svgHtml,
            currentName: accessibleNameText,
            severity: 'warning'
          });
        }
        
        // Missing proper accessibility attributes
        else if (!hasAccessibleName || !hasProperRole) {
          results.violations.push({
            type: 'svg-map-missing-attributes',
            provider: provider,
            element: 'svg',
            selector: cssSelector,
            xpath: getFullXPath(svg),
            html: svgHtml,
            missingName: !hasAccessibleName,
            missingRole: !hasProperRole
          });
        }
      });

      // Touch Target Size Detection
      // Check for small touch targets within all detected maps
      console.log('[Maps] Checking touch target sizes...');
      
      // Helper function to check touch target size
      function checkTouchTargetSize(element) {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Account for padding in the touch target size
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        
        const width = rect.width || (rect.right - rect.left);
        const height = rect.height || (rect.bottom - rect.top);
        
        // Total touch target includes padding
        const totalWidth = width + paddingLeft + paddingRight;
        const totalHeight = height + paddingTop + paddingBottom;
        
        // Check if element is visible
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         computedStyle.display !== 'none' && 
                         computedStyle.visibility !== 'hidden' &&
                         computedStyle.opacity !== '0';
        
        return {
          width: totalWidth,
          height: totalHeight,
          isVisible: isVisible,
          meetsWCAG258: totalWidth >= 24 && totalHeight >= 24, // WCAG 2.5.8 (Level AA)
          meetsWCAG255: totalWidth >= 44 && totalHeight >= 44  // WCAG 2.5.5 (Level AAA)
        };
      }
      
      // Track elements to avoid duplicates
      const touchTargetElementTracker = new Set();
      
      // Selectors for common map controls
      const controlSelectors = [
        'button',
        'a[href]',
        '[role="button"]',
        '.gm-control-active', // Google Maps controls
        '.mapboxgl-ctrl-zoom-in, .mapboxgl-ctrl-zoom-out', // Mapbox
        '.leaflet-control-zoom-in, .leaflet-control-zoom-out', // Leaflet
        '.ol-zoom-in, .ol-zoom-out', // OpenLayers
        '[class*="zoom"]',
        '[class*="control"]',
        '[aria-label*="zoom"]',
        '[aria-label*="Zoom"]',
        '[title*="zoom"]',
        '[title*="Zoom"]'
      ];
      
      // Check controls within each detected map container
      const mapContainers = [
        ...mapIframes,
        ...mapDivs,
        ...Array.from(document.querySelectorAll('svg[role="img"], svg[role="application"]'))
      ];
      
      mapContainers.forEach(container => {
        // For iframes, we can't check inside them due to cross-origin restrictions
        if (container.tagName === 'IFRAME') return;
        
        // Find the associated map info
        const mapXPath = getFullXPath(container);
        const mapInfo = results.maps.find(m => m.xpath === mapXPath);
        const provider = mapInfo?.provider || 'Unknown';
        
        // Find all interactive controls within the map
        const controls = container.querySelectorAll(controlSelectors.join(', '));
        
        controls.forEach(control => {
          // Skip if already checked
          const controlXPath = getFullXPath(control);
          if (touchTargetElementTracker.has(controlXPath)) return;
          touchTargetElementTracker.add(controlXPath);
          
          const touchTarget = checkTouchTargetSize(control);
          
          // Only report visible controls that don't meet minimum size
          if (touchTarget.isVisible && (!touchTarget.meetsWCAG258 || !touchTarget.meetsWCAG255)) {
            // Get control description
            const ariaLabel = control.getAttribute('aria-label');
            const title = control.getAttribute('title');
            const text = control.textContent?.trim();
            const controlName = ariaLabel || title || text || 'Unnamed control';
            
            results.touchTargetViolations.push({
              provider: provider,
              controlName: controlName,
              width: Math.round(touchTarget.width),
              height: Math.round(touchTarget.height),
              meetsWCAG258: touchTarget.meetsWCAG258,
              meetsWCAG255: touchTarget.meetsWCAG255,
              selector: control.id ? `#${control.id}` : null,
              xpath: controlXPath,
              html: control.outerHTML.substring(0, 200) + (control.outerHTML.length > 200 ? '...' : ''),
              severity: !touchTarget.meetsWCAG258 ? 'critical' : 'warning'
            });
            
            if (!touchTarget.meetsWCAG258) {
              results.summary.smallTouchTargets++;
            }
          }
        });
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
        description: 'Evaluates digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including map iframes, div-based maps (Google Maps, Mapbox, Leaflet, etc.), SVG maps, and static map images. It ensures maps are properly labeled and accessible to screen reader users.',
        issues: [{
          type: 'error',
          title: 'Error analyzing maps',
          description: `An error occurred while analyzing maps: ${mapAnalysis.error.toString()}`
        }]
      };
    }

    // Pattern: Transform Raw Results into User-Friendly Issues
    // This section demonstrates how to convert technical findings into
    // actionable feedback for developers
    const issues = [];
    const mapsData = mapAnalysis;

    // Educational: Debug logging helps during development
    // Optional chaining (?.) prevents errors if data structure is incomplete
    console.log('[Maps] Maps data details:', {
      hasMaps: mapsData.pageFlags?.hasMaps,
      totalMaps: mapsData.results?.summary?.totalMaps,
      mapsByProvider: mapsData.results?.summary?.mapsByProvider,
      mapsWithoutTitle: mapsData.results?.summary?.mapsWithoutTitle,
      mapsWithAriaHidden: mapsData.results?.summary?.mapsWithAriaHidden,
      mapsList: mapsData.results?.maps,
      violations: mapsData.results?.violations
    });

    // Pattern: Handle "No Issues Found" Gracefully
    // Always provide feedback, even when no problems are detected
    // This confirms the test ran successfully
    if (!mapsData.pageFlags.hasMaps) {
      console.log('[Maps] No maps found on the page');
      return {
        description: 'Evaluates digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including map iframes, div-based maps (Google Maps, Mapbox, Leaflet, etc.), SVG maps, and static map images. It ensures maps are properly labeled and accessible to screen reader users.',
        issues: [{
          type: 'info',  // Info type for non-problems
          title: 'No maps detected on page',
          description: 'No maps were detected on this page. This test looks for common map implementations including iframe maps (Google Maps, Bing Maps), div-based maps (Mapbox, Leaflet), SVG maps (D3.js, TopoJSON), and static map images.'
        }]
      };
    }

    // Create a map to track elements that have interactive aria-hidden issues
    // We'll use this to avoid duplicate issues for the same element
    const elementTracker = new Map();
    
    // 3a. Maps With aria-hidden='true' that are interactive (serious fail)
    // Process these FIRST because they're higher priority than missing accessible names
    const interactiveHiddenViolations = mapsData.results.violations.filter(v => v.type === 'aria-hidden-interactive');
    
    if (interactiveHiddenViolations.length > 0) {
      // Process interactive maps with aria-hidden (all of them individually)
      interactiveHiddenViolations.forEach((violation, index) => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        const elementType = violation.element || 'iframe';
        
        // Create a key to track this element
        const elementKey = mapXpath || violation.selector;
        elementTracker.set(elementKey, true);
        
        // Create a more precise selector with the index to ensure uniqueness
        // If the original selector is an XPath that won't work with querySelector, convert to CSS path if possible
        // Otherwise, make the selector include the issue index to ensure different issues highlight different elements
        let uniqueSelector = violation.selector;
        if (uniqueSelector && (uniqueSelector.startsWith('/') || uniqueSelector.includes('['))) {
          // Attempt to create a more reliable CSS selector
          if (violation.element === 'iframe') {
            uniqueSelector = `iframe:nth-of-type(${index + 1})`;
          } else if (violation.element === 'div') {
            uniqueSelector = `div[class*="map"]:nth-of-type(${index + 1})`;
          } else if (violation.element === 'svg') {
            uniqueSelector = `svg:nth-of-type(${index + 1})`;
          }
        }
        
        // Pattern: Creating Comprehensive Issue Reports
        // Each issue should provide:
        // 1. Clear problem statement (title)
        // 2. Detailed explanation (description)
        // 3. User impact (who, severity, why)
        // 4. Standards reference (WCAG)
        // 5. Actionable remediation steps
        // 6. Code examples showing the fix
        
        issues.push({
          type: 'fail',  // fail = WCAG violation, warning = best practice, info = FYI
          title: `${provider} interactive map incorrectly hidden with aria-hidden='true'`,
          description: `This interactive map has aria-hidden="true" which creates a serious accessibility issue. The map becomes invisible to screen-reader users while remaining interactive for keyboard users. This creates a "silent focus trap" where keyboard users can tab into the map and get stuck without any screen reader feedback.`,
          selector: uniqueSelector,
          xpath: mapXpath,
          html: violation.html,
          
          // Impact section helps developers understand severity and prioritize fixes
          impact: {
            who: 'Screen reader users who navigate with a keyboard',
            severity: 'Critical',  // Critical/High/Medium/Low based on user impact
            why: 'This creates a "silent focus trap" in the accessibility tree. Keyboard users can tab into and interact with elements inside the map, but these interactions will be completely silent for screen-reader users. Focus will move through interactive elements with no audio feedback, creating a confusing and disorienting experience.'
          },
          
          // WCAG mapping provides standards compliance context
          wcag: {
            principle: 'Perceivable, Operable',
            guideline: '1.3 Adaptable, 2.1 Keyboard Accessible',
            successCriterion: '1.3.1 Info and Relationships, 2.1.1 Keyboard',
            level: 'A',  // A = essential, AA = recommended, AAA = enhanced
            version: '2.0'
          },
          
          // Remediation steps should be specific and actionable
          remediation: [
            'Remove aria-hidden="true" from the interactive map',
            'Add proper accessible name with title, aria-label, or aria-labelledby',
            'For complex maps, provide an accessible alternative like a data table or descriptive text',
            'If the map must be hidden from screen readers, ensure it is also not focusable with the keyboard',
            'Test with a screen reader to verify the experience is equivalent for all users'
          ],
          
          // Code examples make fixes concrete and copy-pasteable
          codeExample: elementType === 'img' ? {
            before: `<img 
  src="https://static-maps.example.com/..."
  aria-hidden="true"
  alt="">`,
            after: `<!-- Structured content with proper headings -->
<section class="location-section">
  <h3>Our Office Location</h3>
  
  <h4 class="sr-only">Map showing our office location</h4>
  <img
    src="https://static-maps.example.com/..."
    alt="Map showing our office location at 123 Main Street, Chicago">
  
  <h4>Key Information</h4>
  <ul>
    <li>Address: 123 Main Street, Chicago, IL 60601</li>
    <li>Nearby landmarks: Two blocks east of Grant Park</li>
    <li>Public transit: Red Line (State/Lake station)</li>
  </ul>
</section>`
          } : {
            before: `<${elementType} 
  src="https://www.google.com/maps/embed?pb=..."
  width="600"
  height="450"
  aria-hidden="true"
  allowfullscreen=""
  loading="lazy">
</${elementType}>`,
            after: `<!-- Structured content with proper headings -->
<section class="location-section">
  <h3>Our Office Location</h3>
  
  <h4 class="sr-only">Interactive map showing our office location</h4>
  <${elementType}
    src="https://www.google.com/maps/embed?pb=..."
    width="600" 
    height="450"
    title="Interactive map showing our office location"
    allowfullscreen=""
    loading="lazy">
  </${elementType}>
  
  <h4>Key Information</h4>
  <ul>
    <li>Address: 123 Main Street, Chicago, IL 60601</li>
    <li>Nearby landmarks: Two blocks east of Grant Park</li>
    <li>Public transit: Red Line (State/Lake station)</li>
  </ul>
</section>`
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
            level: 'A',
            version: '2.0'
          },
          remediation: [
            'Provide a text description of what the map shows',
            'Add a screen reader-only heading (h4) before the map to make it skippable',
            'Include the address with other key information under a visible heading',
            'Add a data table with the key locations or information from the map',
            'Ensure all important information conveyed visually is also available in text format'
          ],
          codeExample: elementType === 'div' ? {
            before: `<!-- Map without text alternatives -->
<div class="map-container">
  <div class="map" aria-hidden="true">
    <!-- Map rendered by JavaScript -->
  </div>
</div>`,
            after: `<!-- Map with proper heading structure and text alternatives -->
<section class="location-section">
  <h3>Our Office Location</h3>
  
  <!-- Screen reader-only heading allows users to skip the map -->
  <h4 id="map-heading" class="sr-only">Interactive map of our office location</h4>
  <div class="map-container">
    <div class="map" aria-labelledby="map-heading">
      <!-- Map rendered by JavaScript -->
    </div>
  </div>
  
  <!-- Text alternatives for key map information -->
  <div class="map-description">
    <h4>Key Information</h4>
    <ul>
      <li>Address: 123 Main Street, Chicago, IL 60601</li>
      <li>Nearby landmarks: Two blocks east of City Hall</li>
      <li>Public transit: Red Line (State/Lake station)</li>
      <li>Parking: Public garage available at 130 Main Street</li>
    </ul>
  </div>
</section>`
          } : elementType === 'img' ? {
            before: `<!-- Map without text alternatives -->
<div class="map-container">
  <img 
    src="https://static-maps.example.com/..."
    aria-hidden="true"
    alt="">
</div>`,
            after: `<!-- Map with proper heading structure and text alternatives -->
<section class="location-section">
  <h3>Our Office Location</h3>
  
  <h4 class="sr-only">Map showing our office location</h4>
  <div class="map-container">
    <img 
      src="https://static-maps.example.com/..."
      alt="Map showing our office at 123 Main Street, Chicago, 2 blocks east of City Hall">
  </div>
  
  <!-- Additional text information -->
  <div class="map-description">
    <h4>Key Information</h4>
    <ul>
      <li>Address: 123 Main Street, Chicago, IL 60601</li>
      <li>Nearby landmarks: Two blocks east of City Hall</li>
      <li>Public transit: Red Line (State/Lake station)</li>
      <li>Parking: Public garage available at 130 Main Street</li>
    </ul>
  </div>
</section>`
          } : {
            before: `<!-- Map without text alternatives -->
<div class="map-container">
  <${elementType} 
    src="https://www.google.com/maps/embed?pb=..."
    width="600"
    height="450"
    aria-hidden="true">
  </${elementType}>
</div>`,
            after: `<!-- Map with proper heading structure and text alternatives -->
<section class="location-section">
  <h3>Our Office Location</h3>
  
  <h4 class="sr-only">Interactive map showing our office location</h4>
  <div class="map-container">
    <${elementType} 
      src="https://www.google.com/maps/embed?pb=..."
      width="600"
      height="450"
      title="Interactive map showing our office location">
    </${elementType}>
  </div>
  
  <!-- Text alternatives for key map information -->
  <div class="map-description">
    <h4>Key Information</h4>
    <ul>
      <li>Address: 123 Main Street, Chicago, IL 60601</li>
      <li>Nearby landmarks: Two blocks east of City Hall</li>
      <li>Public transit: Red Line (State/Lake station)</li>
      <li>Parking: Public garage available at 130 Main Street</li>
    </ul>
  </div>
</section>`
          }
        });
      });
    }
    
    // Process role="presentation" on interactive maps (WCAG 4.1.2 violation)
    const presentationRoleViolations = mapsData.results.violations.filter(v => v.type === 'presentation-role-interactive');
    
    if (presentationRoleViolations.length > 0) {
      presentationRoleViolations.forEach((violation, index) => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        const elementType = violation.element || 'iframe';
        
        const elementKey = mapXpath || violation.selector;
        elementTracker.set(elementKey, true);
        
        let uniqueSelector = violation.selector;
        if (uniqueSelector && (uniqueSelector.startsWith('/') || uniqueSelector.includes('['))) {
          if (violation.element === 'iframe') {
            uniqueSelector = `iframe:nth-of-type(${index + 1})`;
          } else if (violation.element === 'div') {
            uniqueSelector = `div[class*="map"]:nth-of-type(${index + 1})`;
          }
        }
        
        // WCAG 4.1.2 Name, Role, Value violation
        issues.push({
          type: 'fail',
          title: `${provider} interactive map has role="presentation" removing semantic meaning`,
          description: `This interactive map has role="presentation" which removes its semantic meaning while keeping it keyboard accessible. This violates WCAG 4.1.2 Name, Role, Value by failing to expose the proper role to assistive technology.`,
          selector: uniqueSelector,
          xpath: mapXpath,
          html: violation.html,
          
          impact: {
            who: 'Screen reader users',
            severity: 'Critical',
            why: 'The role="presentation" attribute tells assistive technology to ignore this element\'s semantic meaning. For an interactive map, this creates a confusing experience where users can interact with controls but receive no context about what they are interacting with.'
          },
          
          // Correct WCAG mapping for role="presentation" on interactive content
          wcag: {
            principle: 'Robust',
            guideline: '4.1 Compatible',
            successCriterion: '4.1.2 Name, Role, Value',
            level: 'A',
            version: '2.0'
          },
          
          remediation: [
            'Remove role="presentation" from the interactive map',
            'Add proper accessible name with title, aria-label, or aria-labelledby',
            'If the map contains complex interactions, consider role="application"',
            'Ensure all interactive elements within the map are properly labeled',
            'Test with a screen reader to verify all controls are announced correctly'
          ],
          
          codeExample: elementType === 'img' ? {
            before: `<img 
  src="https://static-maps.example.com/..."
  role="presentation"
  alt="">`,
            after: `<img
  src="https://static-maps.example.com/..."
  alt="Map of downtown area showing major streets and landmarks">`
          } : {
            before: `<${elementType} 
  src="https://www.google.com/maps/embed?pb=..."
  role="presentation"
  width="600"
  height="450">
</${elementType}>`,
            after: `<${elementType}
  src="https://www.google.com/maps/embed?pb=..."
  title="Interactive map of downtown area"
  width="600"
  height="450">
</${elementType}>`
          }
        });
      });
    }

    // 2. Maps Without Title Attributes
    if (mapsData.pageFlags.hasMapsWithoutTitle) {
      const violations = mapsData.results.violations.filter(v => v.type === 'missing-accessible-name');
      
      // For individual maps (up to 3), create separate issues
      // Skip elements that already have a more serious issue reported
      violations.slice(0, 3).forEach((violation, index) => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        const elementKey = mapXpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        // Get element type from violation
        const elementType = violation.element || 'iframe';
        
        // Create a more specific selector
        let uniqueSelector = violation.selector;
        if (uniqueSelector && (uniqueSelector.startsWith('/') || uniqueSelector.includes('['))) {
          uniqueSelector = `${elementType}:nth-of-type(${index + 1})`;
        }
        
        issues.push({
          type: 'fail',
          title: `${provider} map missing accessible name`,
          description: `This ${elementType} map is missing an accessible name (${elementType === 'img' ? 'alt text' : elementType === 'iframe' ? 'title' : 'aria-label or aria-labelledby'} attribute). Screen reader users won't be able to identify the purpose of this map.`,
          selector: uniqueSelector,
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
            level: 'A',
            version: '2.0'
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
      violations.slice(3).forEach((violation, index) => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        const elementKey = mapXpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        // Get element type from violation
        const elementType = violation.element || 'iframe';
        
        // Create a more specific selector
        let uniqueSelector = violation.selector;
        if (uniqueSelector && (uniqueSelector.startsWith('/') || uniqueSelector.includes('['))) {
          // Add 3 to the index since this is the slice after the first 3
          uniqueSelector = `${elementType}:nth-of-type(${index + 3 + 1})`;
        }
        
        issues.push({
          type: 'fail',
          title: `${provider} map missing accessible name`,
          description: `This ${elementType} map is missing an accessible name (${elementType === 'img' ? 'alt text' : elementType === 'iframe' ? 'title' : 'aria-label or aria-labelledby'} attribute). Screen reader users won't be able to identify the purpose of this map.`,
          selector: uniqueSelector,
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
            level: 'A',
            version: '2.0'
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

    // Note: We've moved the interactive aria-hidden violations to be handled first
    // This section has been re-ordered to prioritize the most serious issues
    
    // 3b. Maps With aria-hidden='true' that are not interactive (warning)
    const nonInteractiveHiddenViolations = mapsData.results.violations.filter(v => v.type === 'aria-hidden');
    
    if (nonInteractiveHiddenViolations.length > 0) {
      // Process non-interactive maps with aria-hidden (all of them individually)
      nonInteractiveHiddenViolations.forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        const elementType = violation.element || 'iframe';
        const elementKey = mapXpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        issues.push({
          type: 'warning',
          title: `${provider} map hidden with aria-hidden='true'`,
          description: `This map has aria-hidden='true' which makes it completely invisible to screen-reader users. While this map appears to be non-interactive, it may still contain important visual information that should be accessible to all users. Screen-reader users won't receive any information about the map's presence or content. This creates a risk of violating WCAG 1.1.1 if the map information is not provided elsewhere.`,
          selector: violation.selector,
          xpath: mapXpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users',
            severity: 'Medium',
            why: 'Using aria-hidden="true" removes the element from the accessibility tree, making any geographic or location information in the map unavailable to people who rely on screen-readers. This is a WCAG 1.1.1 violation if equivalent information is not provided in another format.'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: '1.1 Text Alternatives',
            successCriterion: '1.1.1 Non-text Content (AT RISK)',
            level: 'A',
            version: '2.0'
          },
          remediation: [
            'If the map conveys important information: Remove aria-hidden="true" and add descriptive text (via title, aria-label, or nearby content)',
            'If the map is purely decorative: Consider adding role="presentation" instead of aria-hidden',
            'Add text nearby that describes what the map is showing - this benefits all users',
            'For complex maps, consider providing an accessible alternative like a data table or descriptive text'
          ],
          codeExample: elementType === 'img' ? {
            before: `<!-- Map hidden from screen readers -->
<img 
  src="https://static-maps.example.com/..."
  aria-hidden="true"
  alt="">`,
            after: `<!-- Option 1: If map contains important information -->
<img 
  src="https://static-maps.example.com/..."
  alt="Map showing office location at 123 Main Street, 2 blocks from Central Station">

<!-- OR Option 2: If map is purely decorative -->
<img 
  src="https://static-maps.example.com/..."
  alt=""
  role="presentation">`
          } : {
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
        const elementKey = mapXpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
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
            level: 'A',
            version: '2.0'
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
    
    // Static Image Maps Without Alt Text
    const staticMapMissingAltViolations = mapsData.results.violations.filter(v => v.type === 'static-map-missing-alt');
    
    if (staticMapMissingAltViolations.length > 0) {
      // For individual static map images, create separate issues
      staticMapMissingAltViolations.forEach(violation => {
        const provider = violation.provider || 'Static Map Image';
        const elementKey = violation.xpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        issues.push({
          type: 'fail',
          title: `${provider} missing alternative text`,
          description: `This static map image is missing alternative text (alt attribute). Screen reader users will not receive any information about the map's content or purpose.`,
          selector: violation.selector,
          xpath: violation.xpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users and users who cannot see images',
            severity: 'High',
            why: 'Maps often convey crucial location or spatial information. Without alternative text, users who rely on screen readers have no access to this information.'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: '1.1 Text Alternatives',
            successCriterion: '1.1.1 Non-text Content',
            level: 'A',
            version: '2.0'
          },
          remediation: [
            'Add a descriptive alt attribute to the image that explains what the map shows',
            'Include key information such as the location being shown and any important landmarks',
            'If the map is complex, consider adding a longer description nearby with more detailed information',
            'For static API-generated maps, ensure parameters that control the visual appearance are also reflected in the alt text'
          ],
          codeExample: {
            before: `<img src="https://maps.googleapis.com/maps/api/staticmap?center=Brooklyn+Bridge,New+York,NY&zoom=13&size=600x300&maptype=roadmap">`,
            after: `<img 
  src="https://maps.googleapis.com/maps/api/staticmap?center=Brooklyn+Bridge,New+York,NY&zoom=13&size=600x300&maptype=roadmap"
  alt="Map showing Brooklyn Bridge in New York City with surrounding streets and neighborhoods">

<!-- For complex maps, consider adding more comprehensive information nearby -->
<div class="map-description">
  <h3>Map Information</h3>
  <p>This map shows the Brooklyn Bridge and surrounding areas in New York City including 
  DUMBO to the north, Financial District to the south, and the East River.</p>
</div>`
          }
        });
      });
    }
    
    // Static Image Maps With Generic/Non-descriptive Alt Text
    const staticMapGenericAltViolations = mapsData.results.violations.filter(v => v.type === 'static-map-generic-alt');
    
    if (staticMapGenericAltViolations.length > 0) {
      // For individual static map images with generic alt text, create separate issues
      staticMapGenericAltViolations.forEach(violation => {
        const provider = violation.provider || 'Static Map Image';
        const currentAlt = violation.alt || '';
        const elementKey = violation.xpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        issues.push({
          type: 'warning',
          title: `${provider} has generic alternative text`,
          description: `This static map image has overly generic alternative text: "${currentAlt}". The alt text should be more descriptive to convey what the map actually shows.`,
          selector: violation.selector,
          xpath: violation.xpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users and users who cannot see images',
            severity: 'Medium',
            why: 'Generic alt text like "map" or "location" doesn\'t convey any meaningful information about the map\'s content. Screen reader users need to know what location or area is being shown and any key details.'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: '1.1 Text Alternatives',
            successCriterion: '1.1.1 Non-text Content',
            level: 'A',
            version: '2.0'
          },
          remediation: [
            'Replace the generic alt text with a more specific description of what the map shows',
            'Include key information like location names, addresses, or regions being displayed',
            'For maps generated by static map APIs, ensure the important parameters (location, zoom level, etc.) are reflected in the alt text',
            'If appropriate, supplement the alt text with a nearby visible description for all users'
          ],
          codeExample: {
            before: `<img src="https://maps.googleapis.com/maps/api/staticmap?center=Seattle,WA&zoom=12&size=600x300&maptype=roadmap"
  alt="Map">`,
            after: `<img 
  src="https://maps.googleapis.com/maps/api/staticmap?center=Seattle,WA&zoom=12&size=600x300&maptype=roadmap"
  alt="Map of downtown Seattle showing major landmarks including Space Needle, Pike Place Market and surrounding neighborhoods">`
          }
        });
      });
    }
    
    // 5. SVG-based Maps Without Proper Accessibility Attributes
    const svgMapViolations = mapsData.results.violations.filter(v => v.type === 'svg-map-missing-attributes');
    
    if (svgMapViolations.length > 0) {
      // For individual SVG maps, create separate issues
      svgMapViolations.forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        const missingName = violation.missingName;
        const missingRole = violation.missingRole;
        const elementKey = mapXpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        issues.push({
          type: 'fail',
          title: `${provider} SVG map missing accessibility attributes`,
          description: `This SVG-based map ${missingName && missingRole ? 'is missing both an accessible name and proper role attribute' : 
                         missingName ? 'is missing an accessible name' : 
                         'is missing the proper role attribute'}. SVG elements need proper accessibility attributes to be correctly interpreted by screen readers.`,
          xpath: mapXpath,
          selector: violation.selector,
          html: violation.html,
          impact: {
            who: 'Screen reader users, keyboard-only users',
            severity: 'High',
            why: 'SVG-based maps are increasingly common for interactive choropleth, vector, and data visualization maps. Without proper accessibility attributes, screen readers cannot identify the SVG as a map or understand its purpose. This creates a significant barrier for non-visual users trying to access this information.'
          },
          wcag: {
            principle: 'Perceivable, Robust',
            guideline: '1.1 Text Alternatives, 4.1 Compatible',
            successCriterion: '1.1.1 Non-text Content, 4.1.2 Name, Role, Value',
            level: 'A',
            version: '2.0'
          },
          remediation: [
            missingRole ? 'Add role="img" or role="graphics-document" to the SVG element' : '',
            missingRole && missingName ? 'AND' : '',
            missingName ? 'Provide an accessible name using one of these methods:' : '',
            missingName ? '1. Add a <title> element as the first child of the SVG' : '',
            missingName ? '2. OR add an aria-label attribute to the SVG element' : '',
            missingName ? '3. OR use aria-labelledby pointing to a visible heading' : '',
            'For complex maps, additionally consider providing a text alternative describing the key information conveyed by the map',
            'For interactive SVG maps, ensure all controls and interactive elements are keyboard accessible'
          ].filter(item => item !== ''), // Remove empty strings from the array
          codeExample: {
            before: `<svg viewBox="0 0 800 500" class="us-map">
  <!-- Map of US states with various paths -->
  <path d="M..." id="california" fill="#ccefff"></path>
  <path d="M..." id="oregon" fill="#ccefff"></path>
  <!-- etc... -->
</svg>`,
            after: `<svg viewBox="0 0 800 500" class="us-map" 
  role="img" 
  aria-labelledby="map-title">
  
  <title>Map of United States showing population density by state</title>
  <!-- Alternative 1: title element as first child of SVG -->
  
  <desc>California and New York have the highest population density, 
  while Wyoming and Alaska have the lowest.</desc>
  <!-- Optional: Longer description using desc element -->
  
  <!-- Map of US states with various paths -->
  <path d="M..." id="california" fill="#ccefff"></path>
  <path d="M..." id="oregon" fill="#ccefff"></path>
  <!-- etc... -->
</svg>

<!-- Alternative 2: Using aria-labelledby pointing to a visible heading -->
<h2 id="map-title">Population Density Map of United States</h2>
<svg viewBox="0 0 800 500" class="us-map" 
  role="img" 
  aria-labelledby="map-title">
  <!-- ... SVG content ... -->
</svg>

<!-- Alternative 3: Using aria-label directly on the SVG -->
<svg viewBox="0 0 800 500" class="us-map" 
  role="img" 
  aria-label="Map of United States showing population density by state">
  <!-- ... SVG content ... -->
</svg>`
          }
        });
      });
    }

    // 6. Div-based Maps Without Proper Structure (No Landmark AND No Heading)
    const divMapNoStructureViolations = mapsData.results.violations.filter(v => v.type === 'div-map-no-structure');
    
    if (divMapNoStructureViolations.length > 0) {
      divMapNoStructureViolations.forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const elementKey = violation.xpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        issues.push({
          type: 'fail',
          title: `${provider} div-based map lacks structural context`,
          description: `This div-based map has neither a landmark region nor an associated heading. Screen reader users need structural context to understand the purpose and boundaries of map regions. Without proper structure, the map content appears as an undifferentiated block of content.`,
          selector: violation.selector,
          xpath: violation.xpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users',
            severity: 'High',
            why: 'Div-based maps are complex regions that need proper structural context. Without a landmark or heading, screen reader users cannot easily navigate to the map or understand its boundaries and purpose within the page structure.'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: '1.3 Adaptable',
            successCriterion: '1.3.1 Info and Relationships',
            level: 'A',
            version: '2.0'
          },
          remediation: [
            'Best practice: Wrap the map in a landmark region with an accessible name',
            'Alternative: Add a heading element immediately before the map',
            'For landmark approach: Use <section> with aria-label or role="region" with aria-label',
            'For heading approach: Use appropriate heading level (h1-h6) that describes the map',
            'Ensure the landmark or heading clearly describes what the map shows'
          ],
          codeExample: {
            before: `<div id="map" class="map-container">
  <!-- Map content -->
</div>`,
            after: `<!-- Option 1: Using landmark (recommended) -->
<section aria-label="Office locations map">
  <div id="map" class="map-container">
    <!-- Map content -->
  </div>
</section>

<!-- Option 2: Using heading -->
<h2>Our Office Locations</h2>
<div id="map" class="map-container">
  <!-- Map content -->
</div>`
          }
        });
      });
    }

    // 7. Div-based Maps With Only Heading (Warning)
    const divMapHeadingOnlyViolations = mapsData.results.violations.filter(v => v.type === 'div-map-heading-only');
    
    if (divMapHeadingOnlyViolations.length > 0) {
      divMapHeadingOnlyViolations.forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const elementKey = violation.xpath || violation.selector;
        const headingText = violation.headingText || 'detected heading';
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        issues.push({
          type: 'warning',
          title: `${provider} div-based map has heading but no landmark`,
          description: `This div-based map has an associated heading ("${headingText}") but is not contained within a landmark region. While the heading provides some context, best practice is to use landmarks for complex interactive regions to improve navigation for screen reader users.`,
          selector: violation.selector,
          xpath: violation.xpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users',
            severity: 'Medium',
            why: 'While the heading provides context, landmarks offer better navigation and structural understanding. Screen reader users can jump between landmarks but may miss content that only has headings.'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: '1.3 Adaptable',
            successCriterion: '1.3.1 Info and Relationships (Best Practice)',
            level: 'A',
            version: '2.0'
          },
          remediation: [
            'Consider wrapping the map in a landmark region for better structure',
            'Use <section> or role="region" with an accessible name',
            'The landmark should encompass both the heading and the map',
            'This improves navigation and provides clearer boundaries for the map content'
          ],
          codeExample: {
            before: `<h2>${headingText}</h2>
<div id="map" class="map-container">
  <!-- Map content -->
</div>`,
            after: `<section aria-labelledby="map-heading">
  <h2 id="map-heading">${headingText}</h2>
  <div id="map" class="map-container">
    <!-- Map content -->
  </div>
</section>`
          }
        });
      });
    }

    // 8. Maps With Generic Names
    const genericNameViolations = mapsData.results.violations.filter(v => v.type === 'generic-name');
    
    if (genericNameViolations.length > 0) {
      genericNameViolations.forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const elementKey = violation.xpath || violation.selector;
        const currentName = violation.currentName || 'generic name';
        const elementType = violation.element || 'map';
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        issues.push({
          type: 'fail',
          title: `${provider} ${elementType} has generic accessible name`,
          description: `This ${elementType} has a generic accessible name: "${currentName}". Generic names like "map", "image", or "graphic" don't provide meaningful information about what the map actually shows. Screen reader users need descriptive names to understand the map's content and purpose.`,
          selector: violation.selector,
          xpath: violation.xpath,
          html: violation.html,
          impact: {
            who: 'Screen reader users',
            severity: 'High',
            why: 'Generic names provide no useful information about the map\'s content. Users need to know what location, data, or information the map displays to determine if it\'s relevant to their needs. This violates WCAG 2.4.6 which requires labels to describe purpose.'
          },
          wcag: {
            principle: 'Operable',
            guideline: '2.4 Navigable',
            successCriterion: '2.4.6 Headings and Labels',
            level: 'AA',
            version: '2.0'
          },
          remediation: [
            'Replace the generic name with a descriptive one that explains what the map shows',
            'Include the location, region, or type of data being displayed',
            'Examples of good names:',
            '- "Map of downtown Seattle showing public transit routes"',
            '- "Store locations in the San Francisco Bay Area"',
            '- "Population density map of European countries"',
            'Avoid generic terms like "map", "location", "image" without additional context'
          ],
          codeExample: {
            before: `<${elementType === 'iframe' ? 'iframe' : elementType === 'svg' ? 'svg' : 'div'} 
  ${elementType === 'iframe' ? 'title' : 'aria-label'}="${currentName}">
  <!-- Map content -->
</${elementType === 'iframe' ? 'iframe' : elementType === 'svg' ? 'svg' : 'div'}>`,
            after: `<${elementType === 'iframe' ? 'iframe' : elementType === 'svg' ? 'svg' : 'div'} 
  ${elementType === 'iframe' ? 'title' : 'aria-label'}="Interactive map showing office locations in downtown Chicago">
  <!-- Map content -->
</${elementType === 'iframe' ? 'iframe' : elementType === 'svg' ? 'svg' : 'div'}>`
          }
        });
      });
    }

    // 9. Touch Target Size Violations
    if (mapsData.results.touchTargetViolations && mapsData.results.touchTargetViolations.length > 0) {
      const touchTargetViolations = mapsData.results.touchTargetViolations;
      
      // Report all touch target violations individually
      touchTargetViolations.forEach(violation => {
        const elementKey = violation.xpath || violation.selector;
        
        // Skip if we already have an issue for this element
        if (elementTracker.has(elementKey)) {
          return;
        }
        
        // Mark this element as tracked
        elementTracker.set(elementKey, true);
        
        // Determine if this fails WCAG 2.5.8 (AA) or only 2.5.5 (AAA)
        const failsMinimum = !violation.meetsWCAG258;
        
        issues.push({
          type: 'fail',
          title: `${violation.provider} map control "${violation.controlName}" has insufficient touch target size (${violation.width}x${violation.height}px)`,
          description: failsMinimum 
            ? `This map control has a touch target size of only ${violation.width}x${violation.height} pixels, which is below the WCAG 2.5.8 minimum of 24x24 pixels. Small touch targets are difficult or impossible for users with motor disabilities to activate accurately.`
            : `This map control has a touch target size of ${violation.width}x${violation.height} pixels. While it meets the minimum WCAG 2.5.8 requirement of 24x24 pixels, it falls short of the enhanced 44x44 pixel target recommended by WCAG 2.5.5 for optimal usability.`,
          selector: violation.selector,
          xpath: violation.xpath,
          html: violation.html,
          impact: {
            who: failsMinimum 
              ? 'Users with motor disabilities, users with tremors, elderly users, mobile users'
              : 'Mobile users, users with minor motor difficulties',
            severity: failsMinimum ? 'High' : 'Medium',
            why: failsMinimum
              ? 'Small touch targets require precise motor control that many users don\'t have. This can make map controls unusable for people with conditions like Parkinson\'s disease, arthritis, or other motor impairments. Mobile users also struggle with small targets.'
              : 'While technically accessible, smaller touch targets increase error rates and user frustration, particularly on touch devices. Larger targets provide a more comfortable and confident user experience.'
          },
          wcag: {
            principle: 'Operable',
            guideline: '2.5 Input Modalities',
            successCriterion: failsMinimum ? '2.5.8 Target Size (Minimum)' : '2.5.5 Target Size (Enhanced)',
            level: failsMinimum ? 'AA' : 'AAA',
            version: failsMinimum ? '2.2' : '2.1' // 2.5.8 is WCAG 2.2, 2.5.5 is WCAG 2.1
          },
          remediation: failsMinimum ? [
            'Increase the touch target size to at least 24x24 CSS pixels',
            'Ideally, make touch targets 44x44 pixels for better usability (WCAG 2.5.5)',
            'Use padding to increase the clickable area without changing visual size',
            'Consider providing alternative large-button controls for essential functions',
            'Space controls apart to reduce accidental activation of wrong target'
          ] : [
            'Consider increasing touch targets to 44x44 CSS pixels for optimal usability',
            'This is especially important for frequently-used controls like zoom buttons',
            'Use generous padding around interactive elements',
            'Mobile-first design often naturally leads to appropriately-sized touch targets',
            'Test with real users on touch devices to ensure comfortable interaction'
          ],
          codeExample: {
            before: `<button class="${failsMinimum ? 'zoom-in' : 'map-control'}" style="width: ${failsMinimum ? '20' : '30'}px; height: ${failsMinimum ? '20' : '30'}px;">
  ${failsMinimum ? '+' : '🔍'}
</button>`,
            after: `<button class="${failsMinimum ? 'zoom-in' : 'map-control'}" style="width: ${failsMinimum ? '20' : '30'}px; height: ${failsMinimum ? '20' : '30'}px; padding: ${failsMinimum ? '12' : '7'}px;">
  ${failsMinimum ? '+' : '🔍'}
</button>
<!-- Total touch target: 44x44px -->`
          }
        });
      });
    }

    // 10. Always add info message when maps are found to list detected providers
    if (mapsData.pageFlags.hasMaps) {
      // Sort providers alphabetically and create array
      const sortedProviders = Object.entries(mapsData.results.summary.mapsByProvider)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([provider, count]) => ({provider, count}));
      
      // Determine if there are any issues with the maps
      const hasIssues = issues.length > 0;
      
      issues.push({
        type: 'info',
        title: hasIssues ? 'Maps detected on page' : 'Maps with no accessibility issues detected',
        description: `${mapsData.results.summary.totalMaps} map${mapsData.results.summary.totalMaps !== 1 ? 's' : ''} found on the page.${hasIssues ? '' : ' No accessibility issues detected.'}`,
        providers: sortedProviders
      });
    }
    
    console.log('[Maps] Returning final issues:', issues);
    
    return {
      description: 'Evaluates digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including map iframes, div-based maps (Google Maps, Mapbox, Leaflet, etc.), SVG maps, and static map images. It ensures maps are properly labeled and accessible to screen reader users.',
      issues: issues
    };
  } catch (error) {
    console.error(`[Maps] Error in test:`, error);
    
    // Return error as an issue
    return {
      description: 'Evaluates digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including map iframes, div-based maps (Google Maps, Mapbox, Leaflet, etc.), SVG maps, and static map images. It ensures maps are properly labeled and accessible to screen reader users.',
      issues: [{
        type: 'error',
        title: `Error running maps test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
};