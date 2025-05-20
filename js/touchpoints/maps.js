/**
 * UPDATED Maps Test - VERSION 2
 * Tests for accessibility issues related to maps
 */
window.test_maps = async function() {
  alert("MAPS TOUCHPOINT TEST v2 EXECUTED");
  console.log("=============================================");
  console.log("MAPS TOUCHPOINT TEST STARTED");
  console.log("=============================================");
  try {
    console.log("[Maps] Starting maps test...");
    console.log("WOOOOOOO HOOOOO");
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

      // Process each map
      mapIframes.forEach(iframe => {
        const provider = identifyMapProvider(iframe.src);
        const title = iframe.getAttribute('title');
        const ariaHidden = iframe.getAttribute('aria-hidden');

        const mapInfo = {
          provider: provider,
          src: iframe.src,
          title: title,
          hasTitle: !!title,
          ariaHidden: ariaHidden === 'true',
          dimensions: {
            width: iframe.getAttribute('width'),
            height: iframe.getAttribute('height')
          },
          attributes: {
            id: iframe.id || null,
            class: iframe.className || null,
            title: title,
            ariaHidden: ariaHidden
          },
          xpath: getFullXPath(iframe)
        };

        results.maps.push(mapInfo);

        // Update summary
        results.summary.mapsByProvider[provider] = 
          (results.summary.mapsByProvider[provider] || 0) + 1;

        // Check for violations
        if (!title) {
          results.summary.mapsWithoutTitle++;
          results.violations.push({
            type: 'missing-title',
            provider: provider,
            src: iframe.src,
            xpath: getFullXPath(iframe),
            element: iframe.outerHTML
          });
        }

        if (ariaHidden === 'true') {
          results.summary.mapsWithAriaHidden++;
          results.violations.push({
            type: 'aria-hidden',
            provider: provider,
            src: iframe.src,
            title: title,
            xpath: getFullXPath(iframe),
            element: iframe.outerHTML
          });
        }
      });

      // Also check for map div elements (some providers use divs)
      const mapDivs = Array.from(document.querySelectorAll('div'))
        .filter(div => {
          const classValue = div.className ? div.className.toString() : '';
          const idValue = div.id || '';
          const classAndId = (classValue + ' ' + idValue).toLowerCase();
          
          // Debug map div detection
          if(classAndId.includes('map')) {
            console.log('[MAP DIV DETECTION]', {
              element: div.outerHTML.substring(0, 100),
              classValue,
              idValue,
              classAndId
            });
          }
          
          return classAndId.includes('map') && 
                 !classAndId.includes('sitemap') && // Exclude sitemaps
                 !classAndId.includes('heatmap'); // Exclude heatmaps
        });

      mapDivs.forEach(div => {
        // Look for known map provider scripts or styles
        const hasMapboxGL = document.querySelector('script[src*="mapbox-gl"]');
        const hasLeaflet = document.querySelector('link[href*="leaflet"]');
        const hasGoogleMaps = document.querySelector('script[src*="maps.google"]');
        
        let provider = 'Unknown Map Provider';
        if (hasMapboxGL) provider = 'Mapbox';
        if (hasLeaflet) provider = 'Leaflet';
        if (hasGoogleMaps) provider = 'Google Maps';

        const mapInfo = {
          provider: provider,
          type: 'div',
          id: div.id || null,
          class: div.className,
          ariaLabel: div.getAttribute('aria-label'),
          role: div.getAttribute('role'),
          xpath: getFullXPath(div)
        };

        results.maps.push(mapInfo);
        results.summary.mapsByProvider[provider] = 
          (results.summary.mapsByProvider[provider] || 0) + 1;

        // Check for accessibility attributes on div-based maps
        if (!div.getAttribute('aria-label') && !div.getAttribute('role')) {
          results.violations.push({
            type: 'div-map-missing-attributes',
            provider: provider,
            element: div.outerHTML,
            xpath: getFullXPath(div)
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

    // 1. If no maps are found, return an info message
    if (!mapsData.pageFlags.hasMaps) {
      console.log('[Maps] No maps found on the page');
      return {
        description: 'Evaluates embedded digital maps for proper accessibility attributes and alternative content. This test identifies common map implementations including Google Maps, Mapbox, and Leaflet, and checks that they are properly labeled and accessible to screen reader users.',
        issues: [{
          type: 'info',
          title: 'No maps found',
          description: 'No maps were detected on this page.'
        }]
      };
    }

    // 2. Maps Without Title Attributes
    if (mapsData.pageFlags.hasMapsWithoutTitle) {
      const violations = mapsData.results.violations.filter(v => v.type === 'missing-title');
      
      // For individual maps (up to 3), create separate issues
      violations.slice(0, 3).forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        
        issues.push({
          type: 'fail',
          title: `${provider} map iframe missing title attribute`,
          description: `A map iframe is missing a title attribute. Screen reader users won't be able to identify the purpose of this map iframe.`,
          selector: `iframe[src*="${violation.src ? violation.src.split('?')[0] : ''}"]`,
          xpath: mapXpath,
          html: violation.element,
          impact: {
            who: 'Screen reader users, keyboard-only users, and users with cognitive disabilities',
            severity: 'High',
            why: 'Screen reader users cannot identify the purpose of the map without a descriptive title'
          },
          wcag: {
            principle: 'Operable, Robust',
            guideline: 'Navigable, Compatible',
            successCriterion: '2.4.1, 4.1.2',
            level: 'A'
          },
          remediation: [
            'Add a title attribute to the map iframe',
            'Ensure the title describes the map\'s purpose (e.g., \'Map showing our office locations\')',
            'Test with a screen reader to verify the map is properly announced'
          ]
        });
      });
      
      // If there are more than 3 maps with issues, add a summary issue
      if (violations.length > 3) {
        const allXpaths = violations.map(v => v.xpath || '').filter(Boolean);
        
        // Format for readability
        let xpathsStr;
        if (allXpaths.length <= 5) {
          xpathsStr = allXpaths.join(', ');
        } else {
          xpathsStr = `${allXpaths.slice(0, 3).join(', ')}, ... (${allXpaths.length - 3} more)`;
        }
        
        issues.push({
          type: 'fail',
          title: `${violations.length} maps missing title attributes`,
          description: `Multiple map iframes are missing title attributes. Screen reader users won't be able to identify the purpose of these map iframes.`,
          xpath: allXpaths.slice(0, 10).join(', '),
          impact: {
            who: 'Screen reader users, keyboard-only users, and users with cognitive disabilities',
            severity: 'High',
            why: 'Screen reader users cannot identify the purpose of maps without descriptive titles'
          },
          wcag: {
            principle: 'Operable, Robust',
            guideline: 'Navigable, Compatible',
            successCriterion: '2.4.1, 4.1.2',
            level: 'A'
          },
          remediation: [
            'Identify all map iframes on the page',
            'Add descriptive title attributes that explain each map\'s purpose and content',
            'Ensure titles are concise but informative',
            'Test with screen readers to verify maps are properly announced'
          ]
        });
      }
    }

    // 3. Maps With aria-hidden='true'
    if (mapsData.pageFlags.hasMapsWithAriaHidden) {
      const violations = mapsData.results.violations.filter(v => v.type === 'aria-hidden');
      
      // For individual maps (up to 3), create separate issues
      violations.slice(0, 3).forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        
        issues.push({
          type: 'fail',
          title: `${provider} map has aria-hidden='true'`,
          description: `A map has aria-hidden='true' which makes it completely invisible to screen readers. If the map contains important information, screen reader users won't have access to it.`,
          selector: `iframe[src*="${violation.src ? violation.src.split('?')[0] : ''}"]`,
          xpath: mapXpath,
          html: violation.element,
          impact: {
            who: 'Screen reader users',
            severity: 'High',
            why: 'Maps with aria-hidden=\'true\' are completely inaccessible to screen reader users'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: 'Text Alternatives',
            successCriterion: '1.1.1',
            level: 'A'
          },
          remediation: [
            'Remove aria-hidden=\'true\' from the map element',
            'Ensure the map has proper accessibility attributes like title',
            'If the map must remain hidden, provide equivalent information in an accessible format nearby',
            'Test with a screen reader to verify the experience'
          ]
        });
      });
      
      // If there are more than 3 maps with issues, add a summary issue
      if (violations.length > 3) {
        const allXpaths = violations.map(v => v.xpath || '').filter(Boolean);
        
        // Format for readability
        let xpathsStr;
        if (allXpaths.length <= 5) {
          xpathsStr = allXpaths.join(', ');
        } else {
          xpathsStr = `${allXpaths.slice(0, 3).join(', ')}, ... (${allXpaths.length - 3} more)`;
        }
        
        issues.push({
          type: 'fail',
          title: `${violations.length} maps have aria-hidden='true'`,
          description: `Multiple maps have aria-hidden='true' which makes them completely invisible to screen readers. If these maps contain important information, screen reader users won't have access to it.`,
          xpath: allXpaths.slice(0, 10).join(', '),
          impact: {
            who: 'Screen reader users',
            severity: 'High',
            why: 'Maps with aria-hidden=\'true\' are completely inaccessible to screen reader users'
          },
          wcag: {
            principle: 'Perceivable',
            guideline: 'Text Alternatives',
            successCriterion: '1.1.1',
            level: 'A'
          },
          remediation: [
            'Remove aria-hidden=\'true\' from map elements',
            'Ensure maps have proper accessibility attributes',
            'If maps must remain hidden, provide equivalent information in an accessible format nearby',
            'Test with screen readers to verify the experience'
          ]
        });
      }
    }

    // 4. Div-based Maps Without Proper Accessibility Attributes
    const divMapViolations = mapsData.results.violations.filter(v => v.type === 'div-map-missing-attributes');
    
    if (divMapViolations.length > 0) {
      // For individual div maps (up to 3), create separate issues
      divMapViolations.slice(0, 3).forEach(violation => {
        const provider = violation.provider || 'Unknown';
        const mapXpath = violation.xpath || '';
        
        issues.push({
          type: 'fail',
          title: `${provider} div-based map missing accessibility attributes`,
          description: `A div-based map is missing accessibility attributes such as aria-label and role. Screen reader users won't be able to identify this element as a map.`,
          xpath: mapXpath,
          html: violation.element,
          impact: {
            who: 'Screen reader users, keyboard-only users',
            severity: 'High',
            why: 'Div-based maps without proper ARIA attributes are not identified as maps by screen readers'
          },
          wcag: {
            principle: 'Perceivable, Robust',
            guideline: 'Text Alternatives, Compatible',
            successCriterion: '1.1.1, 4.1.2',
            level: 'A'
          },
          remediation: [
            'Add role=\'application\' or role=\'img\' to the map container',
            'Add an aria-label that describes the map\'s purpose',
            'Consider adding additional text descriptions near the map',
            'Ensure keyboard accessibility for map interactions',
            'Test with screen readers and keyboard-only navigation'
          ]
        });
      });
      
      // If there are more than 3 div maps with issues, add a summary issue
      if (divMapViolations.length > 3) {
        const allXpaths = divMapViolations.map(v => v.xpath || '').filter(Boolean);
        
        // Format for readability
        let xpathsStr;
        if (allXpaths.length <= 5) {
          xpathsStr = allXpaths.join(', ');
        } else {
          xpathsStr = `${allXpaths.slice(0, 3).join(', ')}, ... (${allXpaths.length - 3} more)`;
        }
        
        issues.push({
          type: 'fail',
          title: `${divMapViolations.length} div-based maps missing accessibility attributes`,
          description: `Multiple div-based maps are missing accessibility attributes such as aria-label and role. Screen reader users won't be able to identify these elements as maps.`,
          xpath: allXpaths.slice(0, 10).join(', '),
          impact: {
            who: 'Screen reader users, keyboard-only users',
            severity: 'High',
            why: 'Div-based maps without proper ARIA attributes are not identified as maps by screen readers'
          },
          wcag: {
            principle: 'Perceivable, Robust',
            guideline: 'Text Alternatives, Compatible',
            successCriterion: '1.1.1, 4.1.2',
            level: 'A'
          },
          remediation: [
            'Add role=\'application\' or role=\'img\' to map container divs',
            'Provide aria-label attributes that describe each map\'s purpose',
            'Consider adding additional text descriptions near maps',
            'Ensure keyboard accessibility for map interactions',
            'Test with screen readers and keyboard-only navigation'
          ]
        });
      }
    }

    // 5. Add an info summary with map providers if maps were found
    if (mapsData.pageFlags.hasMaps && mapsData.results.summary.totalMaps > 0) {
      // Create a formatted string of map providers and counts
      const providersInfo = Object.entries(mapsData.results.summary.mapsByProvider)
        .map(([provider, count]) => `${provider}: ${count}`)
        .join(', ');
      
      issues.push({
        type: 'info',
        title: 'Map providers detected',
        description: `${mapsData.results.summary.totalMaps} map${mapsData.results.summary.totalMaps !== 1 ? 's' : ''} found on the page (${providersInfo})`
      });
    }

    // Add at least one info issue if none exist
    if (issues.length === 0) {
      issues.push({
        type: 'info',
        title: 'Maps analysis completed',
        description: 'Maps analysis was executed but no specific issues were found or detected.'
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