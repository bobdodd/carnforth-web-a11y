/**
 * Debug script to manually test maps detection
 * 
 * To use:
 * 1. Open fixtures/maps_test.html in Chrome
 * 2. Open DevTools console
 * 3. Copy and paste this entire file into the console
 * 4. Run the detectMaps() function
 * 5. See the detected maps and any issues in the console
 */

async function detectMaps() {
  console.log("Starting maps detection test...");
  
  // Generate XPath for elements (copied from maps touchpoint)
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

  try {
    console.log("Checking for iframe-based maps...");
    // 1. Find map iframes
    const mapIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
      const src = iframe.src || '';
      const result = src.includes('map') || 
            src.includes('maps.google') ||
            src.includes('maps.bing') ||
            src.includes('openstreetmap') ||
            src.includes('waze') ||
            src.includes('mapbox') ||
            src.includes('arcgis') ||
            src.includes('here.com') ||
            src.includes('tomtom');
      
      console.log(`Iframe with src="${src}" ${result ? 'MATCHES' : 'does not match'} map criteria`);
      return result;
    });

    console.log(`Found ${mapIframes.length} iframe-based maps`);

    // Process each map iframe
    mapIframes.forEach(iframe => {
      const provider = identifyMapProvider(iframe.src);
      const title = iframe.getAttribute('title');
      const ariaLabel = iframe.getAttribute('aria-label');
      const ariaLabelledby = iframe.getAttribute('aria-labelledby');
      const ariaHidden = iframe.getAttribute('aria-hidden');
      const hasAccessibleName = !!title || !!ariaLabel || !!ariaLabelledby;

      // Get HTML snippet
      const iframeHtml = iframe.outerHTML.substring(0, 100) + '...';
      
      // Get CSS selector
      const id = iframe.getAttribute('id');
      const cssSelector = id ? `#${id}` : getFullXPath(iframe);

      console.log(`Map iframe detected:`, {
        provider,
        src: iframe.src,
        title,
        ariaLabel,
        ariaLabelledby,
        hasAccessibleName,
        ariaHidden,
        element: 'iframe',
        selector: cssSelector
      });

      // Store map information
      maps.push({
        provider,
        src: iframe.src,
        title,
        ariaLabel,
        ariaLabelledby,
        hasAccessibleName,
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
          provider,
          element: 'iframe',
          selector: cssSelector
        });
        
        console.log(`Issue detected: ${provider} iframe missing accessible name`);
      }

      if (ariaHidden === 'true') {
        summary.mapsWithAriaHidden++;
        mapViolations.push({
          type: 'aria-hidden',
          provider,
          element: 'iframe',
          selector: cssSelector
        });
        
        console.log(`Issue detected: ${provider} iframe has aria-hidden="true"`);
      }
    });

    console.log("Checking for div-based maps...");
    // 2. Also check for map div elements (some providers use divs)
    const mapDivs = Array.from(document.querySelectorAll('div[class*="map"], div[id*="map"]'))
      .filter(div => {
        const classAndId = ((div.className || '') + ' ' + (div.id || '')).toLowerCase();
        const result = classAndId.includes('map') && 
              !classAndId.includes('sitemap') && // Exclude sitemaps
              !classAndId.includes('heatmap');   // Exclude heatmaps
        
        console.log(`Div with class/id "${classAndId}" ${result ? 'MATCHES' : 'does not match'} map criteria`);
        return result;
      });

    console.log(`Found ${mapDivs.length} div-based maps`);

    // Look for known map provider scripts or styles
    const hasMapboxGL = !!document.querySelector('script[src*="mapbox-gl"]');
    const hasLeaflet = !!document.querySelector('link[href*="leaflet"]');
    const hasGoogleMaps = !!document.querySelector('script[src*="maps.google"]');
    
    console.log("Map library detection:", {
      hasMapboxGL,
      hasLeaflet,
      hasGoogleMaps
    });

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
      const divHtml = div.outerHTML.substring(0, 100) + '...';
      
      // Get CSS selector
      const id = div.getAttribute('id');
      const cssSelector = id ? `#${id}` : (div.className ? `.${div.className.split(' ')[0].replace(/:/g, '\\:')}` : getFullXPath(div));

      console.log(`Map div detected:`, {
        provider,
        type: 'div',
        ariaLabel,
        ariaLabelledby,
        role,
        hasAccessibleName,
        element: 'div',
        selector: cssSelector
      });

      // Store map information
      maps.push({
        provider,
        type: 'div',
        ariaLabel,
        ariaLabelledby,
        role,
        hasAccessibleName,
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
          provider,
          element: 'div',
          selector: cssSelector
        });
        
        console.log(`Issue detected: ${provider} div map missing accessibility attributes`);
      }
    });

    // Update total maps count
    summary.totalMaps = maps.length;
    
    console.log("Maps detection summary:", summary);
    console.log("All detected maps:", maps);
    console.log("Map violations:", mapViolations);
    
    // Return results similar to the touchpoint
    return {
      maps: maps,
      violations: mapViolations,
      summary: summary
    };
  } catch (error) {
    console.error("Error in maps detection:", error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

// Execute the function automatically
detectMaps().then(result => {
  console.log("Maps detection complete!");
  console.log(result);
});