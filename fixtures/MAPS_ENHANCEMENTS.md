# Maps Touchpoint Enhancements

This document outlines the enhancements made to the Maps touchpoint to improve detection of various map implementations and provide more specific accessibility guidance.

## Implemented Enhancements

### 1. Enhanced Div-based Map Detection

The div-based map detection has been significantly improved with:

- **Multi-signal detection:** Uses multiple signals to reduce false positives, requiring at least two indicators to identify a map
- **Data attribute recognition:** Detects map-specific data attributes like data-zoom, data-lat, data-lng, etc.
- **Map library detection:** Recognizes specific class patterns from common mapping libraries (Leaflet, Mapbox, Google Maps, OpenLayers, etc.)
- **Canvas detection:** Identifies maps that use canvas elements for rendering (common in vector maps)
- **Interactive element detection:** Looks for zoom controls, markers, and other interactive elements
- **Attribution detection:** Identifies map attribution elements which often indicate map providers
- **Styling patterns:** Checks for typical map styling patterns (position: relative, specific dimensions)
- **Exclusion patterns:** Filters out common false positives (sitemaps, heatmaps, mind maps, etc.)

### 2. SVG Map Detection

Added comprehensive detection for SVG-based maps with:

- **SVG-specific attributes:** Detects viewBox and other SVG attributes common in maps
- **Geographic elements:** Looks for path elements and groups with region/country IDs
- **Interactive elements:** Identifies interactive SVG maps with click handlers
- **Accessibility checks:** Verifies SVG maps have proper title, role, and aria attributes
- **Common map library detection:** Identifies D3.js Geo, TopoJSON, and other SVG map libraries
- **Interactivity classification:** Differentiates between static and interactive SVG maps

### 3. Static Image Map Detection

Added detection for static image maps with:

- **Map service URLs:** Recognizes URLs from static map services (Google Static Maps, Mapbox Static, etc.)
- **Alt text analysis:** Checks for map-related terms in alt text
- **Meaningful alternative text:** Detects generic/non-descriptive alt text for maps
- **Provider identification:** Identifies specific static map providers

### 4. Improved Classification of aria-hidden Issues

Enhanced the classification of aria-hidden issues based on interactivity:

- **Critical issues:** Interactive maps with aria-hidden="true" (creates focus traps)
- **Warnings:** Non-interactive maps with aria-hidden="true" (missing content)

### 5. Improved Issue Reporting 

Enhanced the issue reporting with more detailed remediation advice:

- **Customized by map type:** Different remediation advice for iframe, div, SVG, and image maps
- **Context-aware code examples:** Better before/after code examples showing appropriate fixes
- **More detailed impact descriptions:** Better explanation of who is affected and why

## Test Fixtures

Three test fixtures have been created to validate these enhancements:

1. **maps_svg_test.html:** Tests SVG map detection and accessibility requirements
2. **maps_div_enhanced_test.html:** Tests advanced div-based map implementations
3. **maps_test.html (original):** Standard test fixture for iframe-based maps

## Future Enhancement Ideas

Potential future improvements to consider:

1. **Client-side rendered map detection:** Improve detection for maps that render after page load via JavaScript
2. **Map region accessibility:** Check for keyboard accessibility of clickable map regions
3. **Color contrast in maps:** Check for sufficient contrast in map elements
4. **Alternative content verification:** Check if maps have meaningful alternatives (tables, descriptions)
5. **Custom map element detection:** Support for custom elements used for maps
6. **Video maps and 3D maps:** Detection for more advanced map types (Google Earth, etc.)
7. **Test coverage expansion:** Additional test cases for edge cases and false positives

## Usage

To test these enhancements:

1. Open Chrome and load one of the test fixtures
2. Open Chrome DevTools
3. Navigate to the Carnforth Web A11y panel
4. Run the Maps touchpoint
5. Verify that the correct map implementations are detected and appropriate issues are reported