/**
 * Example: How to integrate debug mode into touchpoints
 * This shows how maps.js would use the debug helpers
 * 
 * Educational: This demonstrates best practices for adding
 * debug logging to accessibility tests
 */

// Example snippet showing debug integration in maps.js
// (This would be added to the actual maps.js file)

// At the start of analyzeMapAccessibility function:
function analyzeMapAccessibility() {
  // Start overall timer if debug mode is on
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.startTimer('maps-analysis');
  }
  
  // ... existing setup code ...
  
  // Detection Strategy 1: Iframe-based Maps
  const mapIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
    const src = iframe.src || '';
    return src.includes('map') || src.includes('maps.google') || /* ... */;
  });
  
  // Log detection with educational context
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.logDetection(
      'iframe maps',
      mapIframes,
      {
        method: 'URL pattern matching',
        selector: 'iframe[src*="map"]',
        explanation: 'Most embedded maps use iframes for security isolation. We detect them by checking iframe src URLs for map-related patterns.'
      }
    );
  }
  
  // When checking for interactive content:
  function checkForInteractiveContent(iframe) {
    try {
      // Log Chrome extension constraint
      if (window.CarnforthDebugHelpers) {
        window.CarnforthDebugHelpers.logExtensionIssue(
          'Cannot access cross-origin iframe content due to Same-Origin Policy',
          'Use heuristic detection based on URL patterns and attributes instead'
        );
      }
      
      // ... existing heuristic detection code ...
      
    } catch (e) {
      // ... error handling ...
    }
  }
  
  // When analyzing each map:
  mapIframes.forEach(iframe => {
    const provider = identifyMapProvider(iframe.src);
    
    // Log start of analysis for this element
    if (window.CarnforthDebugHelpers) {
      window.CarnforthDebugHelpers.startTimer(`analyze-map-${provider}`);
    }
    
    // Check accessible name
    const title = iframe.getAttribute('title');
    const ariaLabel = iframe.getAttribute('aria-label');
    const hasAccessibleName = !!title || !!ariaLabel;
    
    // Log WCAG analysis
    if (window.CarnforthDebugHelpers) {
      window.CarnforthDebugHelpers.logAnalysis(
        iframe,
        'accessible name',
        { hasAccessibleName, title, ariaLabel },
        {
          criterion: '4.1.2',
          title: 'Name, Role, Value',
          explanation: 'Iframes containing maps must have an accessible name so screen reader users know what content is being embedded.'
        }
      );
    }
    
    // When a violation is found:
    if (!hasAccessibleName) {
      const violation = {
        type: 'missing-accessible-name',
        provider: provider,
        severity: 'fail',
        wcag: '4.1.2'
      };
      
      if (window.CarnforthDebugHelpers) {
        window.CarnforthDebugHelpers.logViolation(
          violation,
          iframe,
          {
            steps: [
              'Add a title attribute to the iframe',
              `Example: <iframe src="${iframe.src}" title="Interactive map of ${provider}">`,
              'The title should describe what the map shows, not just say "map"',
              'Alternative: Use aria-label or aria-labelledby attributes'
            ]
          }
        );
      }
      
      results.violations.push(violation);
    }
    
    // End timer for this map
    if (window.CarnforthDebugHelpers) {
      window.CarnforthDebugHelpers.endTimer(`analyze-map-${provider}`);
    }
  });
  
  // Detection Strategy 2: Div-based Maps
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.startTimer('div-map-detection');
  }
  
  const mapDivs = Array.from(document.querySelectorAll('div')).filter(isDivBasedMap);
  
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.logDetection(
      'div-based maps',
      mapDivs,
      {
        method: 'Multi-signal heuristic detection',
        selector: 'div[class*="map"], div[id*="map"] + heuristics',
        explanation: 'Modern JS map libraries render into div containers. We use multiple signals (classes, IDs, child elements, styling) to identify them accurately.'
      }
    );
    
    window.CarnforthDebugHelpers.endTimer('div-map-detection');
  }
  
  // ... continue with rest of analysis ...
  
  // End overall timer
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.endTimer('maps-analysis');
  }
  
  return results;
}

// Example of using debug mode in helper functions:
function isGenericName(name) {
  const genericNames = ['map', 'image', 'graphic', /* ... */];
  const isGeneric = genericNames.includes(name.toLowerCase().trim());
  
  if (window.CarnforthDebugHelpers && isGeneric) {
    window.CarnforthDebugHelpers.logAnalysis(
      null,
      'name quality check',
      { name, isGeneric },
      {
        criterion: '2.4.6',
        title: 'Headings and Labels',
        explanation: `Generic names like "${name}" don't help users understand what the map shows. Names should be descriptive, e.g., "Map of downtown Seattle" not just "map".`
      }
    );
  }
  
  return isGeneric;
}

// Example: Educational logging for landmark detection
function checkLandmarkContext(element) {
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.startTimer('landmark-detection');
    
    // Explain why landmarks matter
    console.log('%c📚 Educational: Why check for landmarks?', 'color: #9900cc; font-weight: bold;');
    console.log('%cLandmarks provide structural navigation for screen reader users.', 'color: #666;');
    console.log('%cComplex interactive regions like maps should be within landmarks', 'color: #666;');
    console.log('%cto help users understand page structure and navigate efficiently.', 'color: #666;');
  }
  
  // ... existing landmark detection code ...
  
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.endTimer('landmark-detection');
  }
  
  return landmarkInfo;
}