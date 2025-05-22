# Carnforth Web A11y Test Fixtures

This directory contains HTML test fixtures for testing and validating the Carnforth Web A11y Chrome extension touchpoints.

## Purpose

These test fixtures provide controlled environments with known accessibility issues and correct implementations to:

1. Test and validate touchpoint detection logic
2. Manually verify how the extension recognizes and reports various issues
3. Support development and debugging of new touchpoint implementations
4. Provide examples of accessibility issues and their fixes

## Available Test Fixtures

### Maps Touchpoint Test (`maps_test.html`)

This fixture contains various map implementations to test the maps touchpoint:

- Iframe-based maps (Google Maps, Bing Maps, etc.)
- Div-based maps (Mapbox, Leaflet, etc.)
- Maps with and without accessible names
- Maps with aria-hidden="true"
- Maps missing required ARIA attributes

### Accessible Name Touchpoint Test (`accessible_name_test.html`)

This fixture contains various elements to test the accessible name touchpoint:

- Interactive elements with missing accessible names (buttons, images, inputs, etc.)
- Elements with non-descriptive accessible names ("click here", "read more", etc.)
- Form controls with various labeling methods (explicit labels, implicit labels, aria-label, aria-labelledby)
- Complex interactive elements (icon buttons, custom dropdowns, etc.)
- Special cases and edge cases (visually hidden labels, SVGs, dialogs, etc.)

## How to Use These Fixtures

1. Open the HTML fixture file in Chrome
2. Open Chrome DevTools
3. Navigate to the Carnforth Web A11y panel
4. Click "Start Test" to run all touchpoints, or select a specific touchpoint to test
5. Review the results against the expected issues described in each fixture's "Testing Instructions" section

For development:
- Implement touchpoint logic based on the issues presented in these fixtures
- Check that your implementation correctly identifies issues in the problem cases
- Verify that correctly implemented examples don't generate false positive warnings

## Creating New Test Fixtures

When creating a new test fixture for a touchpoint:

1. Create an HTML file named `[touchpoint_name]_test.html`
2. Include a variety of both problematic and correct implementations
3. Clearly document each test case with descriptive headings and comments
4. Include testing instructions with expected results
5. Update this README to include your new fixture

## Notes on Test Data

These fixtures use:
- Data URIs for images instead of external resources
- Inline styles to maintain simplicity
- Simulated elements where actual implementations aren't practical (e.g., map embeds)
- Visual highlighting to indicate issues (red) and proper implementations (green)