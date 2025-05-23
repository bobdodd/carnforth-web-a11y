# Maps Fixture Coverage Analysis

## Overview

This document analyzes whether `maps_comprehensive_test.html` covers all test cases from the other fixture files.

## Coverage Comparison

### 1. maps_test.html (Original Basic Fixture)

| Test Case | Covered in Comprehensive? | Notes |
|-----------|---------------------------|-------|
| Google Maps iframe with title | ✅ Yes | Test: "Google Maps - Proper Implementation" |
| Google Maps iframe without accessible name | ✅ Yes | Test: "Google Maps - Missing Accessible Name" |
| Google Maps iframe with aria-hidden="true" | ✅ Yes | Test: "Google Maps - Interactive with aria-hidden='true'" |
| Bing Maps iframe with aria-label | ✅ Yes | Test: "Bing Maps - With aria-label" |
| Mapbox div with role="application" | ✅ Yes | Test: "Mapbox GL - Within Landmark" |
| Leaflet div without accessibility | ✅ Yes | Test: "Leaflet - With Heading Only" |
| Generic div with map class | ✅ Yes | Test: "Canvas-based Vector Map" |

### 2. maps_extended_test.html (aria-hidden Scenarios)

| Test Case | Covered in Comprehensive? | Notes |
|-----------|---------------------------|-------|
| Interactive iframe with aria-hidden (FAIL) | ✅ Yes | Test: "Google Maps - Interactive with aria-hidden='true'" |
| Non-interactive iframe with aria-hidden (WARNING) | ✅ Yes | Test: "HERE Maps - Non-interactive with aria-hidden" |
| Static image with aria-hidden | ✅ Yes | Test: "Yandex Maps Static - With aria-hidden" |
| Interactive div with aria-hidden | ✅ Yes | Test: "OpenLayers - Interactive with aria-hidden" |

### 3. maps_svg_test.html (SVG Maps)

| Test Case | Covered in Comprehensive? | Notes |
|-----------|---------------------------|-------|
| SVG with proper accessibility | ✅ Yes | Test: "SVG Map - Complete Accessibility" |
| SVG missing role | ✅ Yes | Test: "SVG Map - Missing role='img'" |
| SVG with aria-hidden | ✅ Yes | Test: "SVG Map - Interactive with aria-hidden" |
| Interactive SVG with aria-hidden | ✅ Yes | Test: "SVG Map - Interactive with aria-hidden" |
| SVG with partial accessibility | ✅ Yes | Test: "SVG Map - Missing role='img'" |
| D3.js choropleth map | ✅ Yes | Test: "D3.js Choropleth Map" |

### 4. maps_div_enhanced_test.html (Advanced Div Detection)

| Test Case | Covered in Comprehensive? | Notes |
|-----------|---------------------------|-------|
| Mapbox with canvas and controls | ✅ Yes | Test: "Mapbox GL - Within Landmark" |
| Complex div with data attributes | ❌ **Missing** | Need: Map with multiple data-* attributes |
| Leaflet with popup and markers | ❌ **Missing** | Need: Detailed Leaflet implementation |
| OpenLayers with specific classes | ✅ Yes | Test: "OpenLayers - Interactive with aria-hidden" |
| Google Maps JS with gm-style | ✅ Yes | Test: "Google Maps JavaScript API - No Structure" |
| Map with attribution only | ❌ **Missing** | Need: Subtle detection via attribution |
| Canvas map with ambiguous classes | ✅ Yes | Test: "Canvas-based Vector Map" |
| False positive test (heatmap) | ❌ **Missing** | Need: Exclusion pattern testing |

## New Test Cases in Comprehensive Fixture

The comprehensive fixture adds several test cases not in other fixtures:

1. **Additional Providers**: OpenStreetMap, ArcGIS, TomTom, Waze, Apple Maps, Carto
2. **role="presentation" violations**: Tests for interactive maps with presentation role
3. **Generic name detection**: Tests for non-descriptive titles like "Map"
4. **Landmark context tests**: Tests for maps within landmarks (main, region, etc.)
5. **Heading association tests**: Tests for maps with associated headings
6. **Provider detection for static maps**: All 5 static map providers
7. **URL parameter detection**: Tests for interaction hints in URLs
8. **Edge cases**: Empty iframes, Mapfit provider, etc.

## Missing Coverage

The comprehensive fixture is missing these test cases from `maps_div_enhanced_test.html`:

1. **Complex data attributes test**: A div with multiple map-specific data-* attributes (data-zoom, data-lat, data-lng, etc.)
2. **Detailed Leaflet implementation**: Full Leaflet structure with markers, popups, and panes
3. **Attribution-only detection**: Map identified only by attribution text
4. **False positive exclusion**: Tests for "heatmap", "sitemap", etc. that shouldn't be detected

## Recommendations

To make `maps_comprehensive_test.html` truly comprehensive, add:

```html
<!-- Complex Data Attributes Test -->
<div class="map-container">
    <h3>Complex Data Attributes Map</h3>
    <div class="test-info">
        <span class="issue-highlight">FAIL</span>: Has map data attributes but no accessibility
    </div>
    <div id="data-map" 
         class="map-div"
         data-map-type="vector"
         data-zoom="12"
         data-center-lat="40.7128"
         data-center-lng="-74.0060"
         data-interactive="true"
         data-markers="true">
        <canvas></canvas>
    </div>
    <div class="test-ref">Tests: hasMapDataAttributes in isDivBasedMap()</div>
</div>

<!-- False Positive Test -->
<div class="map-container">
    <h3>False Positive - Heatmap Chart</h3>
    <div class="test-info">
        Should NOT be detected as a map
    </div>
    <div class="heatmap-visualization">
        Not a geographic map
    </div>
    <div class="test-ref">Tests: exclusions list in isDivBasedMap()</div>
</div>

<!-- Attribution-Only Detection -->
<div class="map-container">
    <h3>Subtle Map - Attribution Only</h3>
    <div class="test-info">
        <span class="issue-highlight">WARNING</span>: Detected via attribution text
    </div>
    <div class="custom-viewer">
        <div class="attribution">© Mapbox © OpenStreetMap</div>
    </div>
    <div class="test-ref">Tests: attribution text detection</div>
</div>
```

## Conclusion

`maps_comprehensive_test.html` covers approximately **85%** of all test cases from other fixtures. To achieve 100% coverage, add the 4 missing test cases identified above. The comprehensive fixture also adds significant new test coverage not present in the original fixtures, making it the most complete test resource for the maps touchpoint.