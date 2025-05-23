# Debug Mode Guide for Carnforth Web A11y

## Overview

Carnforth Web A11y includes a comprehensive debug mode designed to help developers understand how accessibility testing works. When enabled, it provides detailed logging with educational context, making it an invaluable learning tool.

## Enabling Debug Mode

There are three ways to enable debug mode:

### 1. Via Console (Recommended for Development)
```javascript
// Enable debug mode
window.CARNFORTH_DEBUG = true;

// Or use the debug object directly
CarnforthDebug.enable();
```

### 2. Via Local Storage (Persists Across Reloads)
```javascript
localStorage.setItem('carnforth_debug', 'true');
```

### 3. Via URL Parameter (Good for Sharing)
```
https://example.com?carnforth_debug=1
```

## Debug Features

### 1. Educational Logging

When debug mode is enabled, you'll see detailed explanations of:
- How elements are detected
- Why certain WCAG criteria apply
- What accessibility issues mean
- How to fix identified problems
- Chrome extension architecture insights

### 2. Performance Timing

Track how long different operations take:
```javascript
CarnforthDebugHelpers.startTimer('my-operation');
// ... do something ...
CarnforthDebugHelpers.endTimer('my-operation');
// Output: Timer ended: my-operation (245.67ms)
```

### 3. WCAG Explanations

Get detailed explanations of WCAG criteria:
```javascript
CarnforthDebug.explainWCAG('4.1.2');
// Output: Detailed explanation of Name, Role, Value criterion
```

### 4. Detection Strategy Explanations

Understand different detection approaches:
```javascript
CarnforthDebug.explainDetectionStrategy('multi-signal');
// Output: Explanation of multi-signal detection benefits
```

## Debug Console Commands

### Core Commands

```javascript
// Enable/disable debug mode
CarnforthDebug.enable();
CarnforthDebug.disable();

// Export debug log as JSON
CarnforthDebug.exportLog();

// Clear debug log
CarnforthDebug.clearLog();

// Explain WCAG criterion
CarnforthDebug.explainWCAG('1.1.1');

// Explain detection strategy
CarnforthDebug.explainDetectionStrategy('heuristic');
```

### Helper Functions for Touchpoints

```javascript
// Log element detection
CarnforthDebugHelpers.logDetection(
  'iframe maps',     // Type of element
  elements,          // Array of detected elements
  {                  // Detection strategy info
    method: 'URL pattern matching',
    selector: 'iframe[src*="map"]',
    explanation: 'Why this method works...'
  }
);

// Log accessibility analysis
CarnforthDebugHelpers.logAnalysis(
  element,           // Element being analyzed
  'accessible name', // What's being checked
  { hasName: true }, // Result
  {                  // WCAG context
    criterion: '4.1.2',
    title: 'Name, Role, Value',
    explanation: 'Why this matters...'
  }
);

// Log violations
CarnforthDebugHelpers.logViolation(
  violation,         // Violation object
  element,           // Affected element
  {                  // Remediation guidance
    steps: [
      'Step 1: Add title attribute',
      'Step 2: Make it descriptive',
      'Example: <iframe title="Map of Seattle">'
    ]
  }
);
```

## Debug Output Examples

### Detection Logging
```
🔍 [DETECTION] Found 3 iframe maps using selector: iframe[src*="map"]
📚 Learn: This detection uses URL pattern matching. Most embedded maps use iframes for security isolation.
```

### Analysis Logging
```
📊 [ANALYSIS] Checking accessible name for <iframe#map-seattle>
📚 Learn: WCAG 4.1.2: Name, Role, Value - Iframes must have accessible names for screen readers
```

### Violation Logging
```
⚠️ [WARNING] Accessibility violation: missing-accessible-name
📚 Learn: How to fix: Add title attribute → Example: <iframe title="Interactive map"> → Make it descriptive
```

### Performance Logging
```
ℹ️ [INFO] Timer started: maps-analysis
ℹ️ [INFO] Timer ended: maps-analysis (524.33ms)
```

## Integrating Debug Mode in Touchpoints

### Basic Integration

```javascript
window.test_myTouchpoint = async function() {
  // Start timing if debug is enabled
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.startTimer('myTouchpoint-analysis');
  }
  
  try {
    // Your detection logic
    const elements = document.querySelectorAll('.my-elements');
    
    // Log detection
    if (window.CarnforthDebugHelpers) {
      window.CarnforthDebugHelpers.logDetection(
        'my elements',
        Array.from(elements),
        {
          method: 'CSS selector',
          selector: '.my-elements',
          explanation: 'Why we look for these elements...'
        }
      );
    }
    
    // ... analysis logic ...
    
  } finally {
    // End timing
    if (window.CarnforthDebugHelpers) {
      window.CarnforthDebugHelpers.endTimer('myTouchpoint-analysis');
    }
  }
};
```

### Advanced Integration with Educational Context

```javascript
// When checking complex criteria
function checkComplexCriteria(element) {
  // Log Chrome extension constraints
  if (window.CarnforthDebugHelpers) {
    window.CarnforthDebugHelpers.logExtensionIssue(
      'Cannot access computed styles across shadow DOM boundaries',
      'Fallback to attribute-based detection for web components'
    );
  }
  
  // Educate about the check being performed
  if (window.CarnforthDebugHelpers) {
    console.log('%c📚 Educational: Shadow DOM and Accessibility', 
      'color: #9900cc; font-weight: bold;');
    console.log('%cShadow DOM encapsulation can hide content from assistive technology.',
      'color: #666;');
    console.log('%cAlways ensure shadow roots have appropriate ARIA attributes.',
      'color: #666;');
  }
  
  // Perform the actual check...
}
```

## Best Practices

### 1. Always Check for Debug Helpers

```javascript
// Safe pattern - won't error if debug.js isn't loaded
if (window.CarnforthDebugHelpers) {
  window.CarnforthDebugHelpers.logDetection(/* ... */);
}
```

### 2. Provide Educational Context

```javascript
// Good: Explains why this matters
window.CarnforthDebugHelpers.logAnalysis(
  element,
  'focus visibility',
  { isVisible: false },
  {
    criterion: '2.4.7',
    title: 'Focus Visible',
    explanation: 'Users who navigate by keyboard need to see which element has focus. Without visible focus, they get lost on the page.'
  }
);
```

### 3. Use Timers for Performance Insights

```javascript
// Helpful for identifying performance bottlenecks
window.CarnforthDebugHelpers.startTimer('expensive-operation');
// ... complex detection logic ...
window.CarnforthDebugHelpers.endTimer('expensive-operation');
```

### 4. Log Workarounds for Browser Limitations

```javascript
// Document Chrome extension constraints
window.CarnforthDebugHelpers.logExtensionIssue(
  'Cross-origin iframes block content access',
  'Use src URL patterns and attributes to infer content type'
);
```

## Debugging Common Issues

### Issue: Detection Not Finding Elements

Enable debug mode and check the detection logs:
```javascript
CarnforthDebug.enable();
// Run your test
// Check console for detection strategy explanations
```

### Issue: False Positives

Use debug mode to understand why elements are being detected:
```javascript
// The debug log will show all signals used for detection
// You can then refine your detection logic
```

### Issue: Performance Problems

Use timers to identify slow operations:
```javascript
// Debug mode will warn about operations taking >1000ms
// Focus optimization efforts on these areas
```

## Educational Features

### Learn WCAG Criteria

```javascript
// Get detailed explanation of any WCAG criterion
CarnforthDebug.explainWCAG('1.3.1');
// Shows: title, level, explanation, examples, impact
```

### Understand Detection Strategies

```javascript
// Learn about different detection approaches
CarnforthDebug.explainDetectionStrategy('semantic-html');
CarnforthDebug.explainDetectionStrategy('heuristic');
CarnforthDebug.explainDetectionStrategy('multi-signal');
```

### Export Learning Materials

```javascript
// Export your debug session for later study
CarnforthDebug.exportLog();
// Creates a JSON file with all logged information
```

## Tips for Learning

1. **Enable debug mode when developing new touchpoints** - You'll learn from the patterns in existing touchpoints

2. **Read the educational notes** - They explain not just what's happening, but why

3. **Export and study logs** - Review detection strategies and WCAG mappings offline

4. **Experiment with commands** - Try the explain functions to deepen your understanding

5. **Share debug URLs** - Add ?carnforth_debug=1 to URLs when asking for help

## Conclusion

Debug mode transforms Carnforth Web A11y from a testing tool into a learning platform. By providing detailed explanations and educational context, it helps developers understand not just what accessibility issues exist, but why they matter and how to fix them.

Remember: This tool's primary mission is education. The debug mode embodies this by making the invisible visible and the complex understandable. 🦢