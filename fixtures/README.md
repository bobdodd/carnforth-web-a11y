# Carnforth Web A11y Test Fixtures

This directory contains HTML test fixtures for testing and validating the Carnforth Web A11y Chrome extension touchpoints.

## Purpose

These test fixtures serve as educational resources and testing environments to:

1. **Test touchpoint detection logic** - Validate that accessibility issues are correctly identified
2. **Demonstrate accessibility patterns** - Show both problematic and correct implementations
3. **Support development** - Provide controlled environments for debugging and enhancement
4. **Educate developers** - Learn about common accessibility issues and their solutions

## Available Test Fixtures

### Maps Test (`maps_test.html`)

A comprehensive test fixture covering all map-related accessibility scenarios:

**What it tests:**
- **25+ map providers** including Google Maps, OpenStreetMap, Mapbox, Leaflet, and regional providers
- **All implementation types**: iframe-based, div-based (JavaScript), SVG maps, and static images
- **Common issues**: Missing accessible names, aria-hidden on interactive content, generic names
- **Context detection**: Landmark associations, heading relationships
- **Edge cases**: False positives, attribution-only detection, URL parameter analysis

**Educational value:**
- Learn how different map types require different accessibility approaches
- Understand why maps need proper labeling for screen reader users
- See examples of WCAG violations and their remediation

### Accessible Name Test (`accessible_name_test.html`)

Tests the detection and validation of accessible names across various interactive elements:

**What it tests:**
- **Form controls**: Various labeling methods (label, aria-label, aria-labelledby)
- **Interactive elements**: Buttons, links, images with actions
- **Complex widgets**: Custom dropdowns, icon buttons, toggle switches
- **Non-descriptive names**: "Click here", "Read more", generic terms
- **Special cases**: Hidden labels, placeholder-only inputs, SVG buttons

**Educational value:**
- Learn the importance of meaningful accessible names
- Understand different techniques for providing accessible names
- See common anti-patterns to avoid

### Highlight Test (`highlight_test.html`)

Tests the visual highlighting functionality used to indicate issues in the page:

**What it tests:**
- Element highlighting with different border styles
- Scroll-into-view functionality
- Z-index and positioning edge cases
- Performance with many highlighted elements

## How to Use These Fixtures

### For Testing:
1. Open the HTML fixture file in Chrome
2. Open Chrome DevTools (F12)
3. Navigate to the "Carnforth Web A11y" panel
4. Click "Start Test" to run all touchpoints
5. Review detected issues against expected results

### For Learning:
1. Open the fixture in your browser
2. View the source code to see accessibility patterns
3. Use a screen reader to experience how different implementations affect users
4. Modify the examples to experiment with fixes

### For Development:
1. Use fixtures to test new touchpoint implementations
2. Verify your code correctly identifies all test cases
3. Check for false positives on correct implementations
4. Add new test cases as you discover edge cases

## Debug Mode

Enable debug mode for educational logging:
```javascript
// In the browser console:
localStorage.setItem('carnforth_debug', 'true');
```

This provides:
- Detailed detection logic explanations
- WCAG mapping information
- Performance timing data
- Strategy explanations

## Creating New Test Fixtures

When creating a test fixture for a new touchpoint:

1. **Name it clearly**: `[touchpoint_name]_test.html`
2. **Structure it well**:
   - Group related test cases
   - Use clear headings and sections
   - Include both passing and failing examples
3. **Document thoroughly**:
   - Add comments explaining each test case
   - Include expected results
   - Reference relevant WCAG criteria
4. **Make it educational**:
   - Show the impact on users
   - Provide fix examples
   - Explain why issues matter
5. **Keep it maintainable**:
   - Use semantic HTML
   - Avoid external dependencies
   - Include inline styles for clarity

## Best Practices

- **Self-contained**: Fixtures should work without external resources
- **Visual indicators**: Use color coding (green=pass, red=fail, yellow=warning)
- **Realistic examples**: Base test cases on real-world patterns
- **Progressive complexity**: Start with simple cases, build to complex scenarios
- **Cross-reference**: Link test cases to specific functions in the touchpoint code

## Understanding Test Results

When reviewing test results:
- **FAIL (Red)**: Critical accessibility barriers requiring immediate fixes
- **WARNING (Yellow)**: Potential issues that may affect some users
- **INFO (Blue)**: Informational messages about detected patterns
- **PASS (Green)**: Correct implementations that should not trigger issues

Each issue reported includes:
- **Title**: Clear description of the problem
- **Impact**: Who is affected and how severely
- **WCAG Reference**: Specific criteria violated
- **Remediation**: How to fix the issue
- **Code Examples**: Before/after code snippets

## Contributing

When contributing new fixtures:
1. Follow the existing naming and structure patterns
2. Include comprehensive test coverage
3. Add educational comments
4. Update this README
5. Test with actual screen readers when possible