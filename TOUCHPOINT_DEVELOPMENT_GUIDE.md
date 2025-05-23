# Touchpoint Development Guide for Carnforth Web A11y

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Step-by-Step Tutorial](#step-by-step-tutorial)
4. [Detection Strategies](#detection-strategies)
5. [Chrome Extension Gotchas](#chrome-extension-gotchas)
6. [WCAG Mapping Guidelines](#wcag-mapping-guidelines)
7. [Testing Approaches](#testing-approaches)
8. [Code Patterns Library](#code-patterns-library)
9. [Common Pitfalls](#common-pitfalls)
10. [Best Practices](#best-practices)

## Introduction

This guide provides comprehensive instructions for developing touchpoints in the Carnforth Web A11y Chrome extension. Each touchpoint is an independent accessibility test that examines specific aspects of web content. The maps.js touchpoint serves as our reference implementation, demonstrating all key patterns and approaches.

### What is a Touchpoint?

A touchpoint is a modular accessibility test that:
- Detects specific types of web content (e.g., maps, forms, videos)
- Evaluates their accessibility according to WCAG guidelines
- Reports violations with severity levels and remediation guidance
- Runs independently without affecting other tests

## Architecture Overview

### System Architecture

```
Chrome Extension Context
├── DevTools Panel
│   ├── panel.html (UI)
│   ├── panel.js (Controller)
│   └── panel.css (Styles)
├── Content Script
│   └── content.js (Page injection)
└── Touchpoints
    ├── maps.js
    ├── forms.js (to be created)
    ├── videos.js (to be created)
    └── ... (22 more touchpoints)
```

### Execution Flow

1. **User triggers test** from DevTools panel
2. **Panel.js injects content script** into inspected page
3. **Content script loads touchpoint** JavaScript file
4. **Touchpoint function executes** in page context
5. **Results returned** via message passing
6. **Panel displays results** with export options

### Key Architectural Decisions

1. **Script Injection**: Touchpoints run in the page context (not extension context) to access DOM directly
2. **Isolation**: Each touchpoint is a separate file to maintain modularity
3. **Async Pattern**: All touchpoints use async functions for consistency
4. **Message Passing**: Chrome's message API handles cross-context communication

## Step-by-Step Tutorial

### Step 1: Create the Touchpoint File

Create a new file in `/js/touchpoints/` directory:

```javascript
// forms.js
window.test_forms = async function() {
  console.log("=============================================");
  console.log("FORMS TOUCHPOINT TEST STARTED");
  console.log("=============================================");
  
  try {
    console.log("[Forms] Starting forms test...");
    
    // Main analysis function
    function analyzeFormAccessibility() {
      // Your detection and analysis logic here
      
      const results = {
        forms: [],        // All detected forms
        violations: [],   // Accessibility issues
        summary: {        // Aggregate statistics
          totalForms: 0,
          formsWithoutLabels: 0,
          // Add relevant metrics
        }
      };
      
      // Detection and analysis logic...
      
      return results;
    }
    
    // Execute analysis
    const results = analyzeFormAccessibility();
    console.log("[Forms] Analysis complete:", results);
    
    return {
      success: true,
      touchpointName: "Forms",
      results: results
    };
    
  } catch (error) {
    console.error("[Forms] Critical error:", error);
    return {
      success: false,
      touchpointName: "Forms",
      error: error.message,
      results: null
    };
  }
};
```

### Step 2: Register the Touchpoint

Add your touchpoint to the registry in `panel.js`:

```javascript
const touchpoints = [
  { id: 'maps', name: 'Maps', enabled: true },
  { id: 'forms', name: 'Forms', enabled: true }, // Add your new touchpoint
  // ... other touchpoints
];
```

### Step 3: Implement Detection Logic

Use multiple strategies to identify target elements:

```javascript
// Strategy 1: Direct element selection
const forms = Array.from(document.querySelectorAll('form'));

// Strategy 2: ARIA role detection
const ariaForms = Array.from(document.querySelectorAll('[role="form"]'));

// Strategy 3: Heuristic detection (for implicit forms)
const implicitForms = Array.from(document.querySelectorAll('div, section'))
  .filter(container => {
    // Check for form-like characteristics
    const hasInputs = container.querySelector('input, select, textarea');
    const hasSubmit = container.querySelector('[type="submit"], button');
    return hasInputs && hasSubmit;
  });

// Combine and deduplicate results
const allForms = [...new Set([...forms, ...ariaForms, ...implicitForms])];
```

### Step 4: Analyze Accessibility

Evaluate each detected element against WCAG criteria:

```javascript
allForms.forEach(form => {
  const violations = [];
  
  // Check for form labeling
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const hasLabel = input.labels?.length > 0 || 
                    input.getAttribute('aria-label') ||
                    input.getAttribute('aria-labelledby');
    
    if (!hasLabel) {
      violations.push({
        type: 'missing-label',
        element: input,
        wcag: '3.3.2',
        severity: 'fail'
      });
    }
  });
  
  // Store results
  results.forms.push({
    element: form,
    violations: violations
  });
});
```

### Step 5: Format Results

Structure your results for the reporting system:

```javascript
results.violations = results.forms.flatMap(form => 
  form.violations.map(violation => ({
    type: violation.type,
    wcag: violation.wcag,
    severity: violation.severity,
    selector: getCssSelector(violation.element),
    xpath: getFullXPath(violation.element),
    html: violation.element.outerHTML,
    remediation: getRemediationGuidance(violation.type)
  }))
);
```

## Detection Strategies

### 1. Multi-Signal Detection

From maps.js, we learn to use multiple signals to increase accuracy:

```javascript
function isDivBasedMap(div) {
  // Signal 1: Class/ID indicators
  const classAndId = (div.className + ' ' + div.id).toLowerCase();
  const hasMapIndicator = ['map', 'gmap', 'leaflet'].some(term => 
    classAndId.includes(term)
  );
  
  // Signal 2: Data attributes
  const hasMapDataAttributes = Array.from(div.attributes)
    .some(attr => attr.name.includes('map') || attr.name.includes('geo'));
  
  // Signal 3: Visual characteristics
  const style = window.getComputedStyle(div);
  const hasMapStyling = style.position === 'relative' && 
                       parseInt(style.height) > 100;
  
  // Signal 4: Child elements
  const hasMapChildren = div.querySelector('.marker, .zoom, .control');
  
  // Combine signals (need at least 2 for confidence)
  const signals = [hasMapIndicator, hasMapDataAttributes, hasMapStyling, hasMapChildren];
  return signals.filter(Boolean).length >= 2;
}
```

### 2. Provider-Specific Detection

Identify specific implementations for better guidance:

```javascript
function identifyProvider(element) {
  const indicators = {
    'Google': ['gm-', 'google.com/maps', '.gm-style'],
    'Mapbox': ['mapbox', 'mapboxgl', 'api.mapbox.com'],
    'Leaflet': ['leaflet', '.leaflet-container'],
    // Add more providers
  };
  
  for (const [provider, patterns] of Object.entries(indicators)) {
    if (patterns.some(pattern => elementMatchesPattern(element, pattern))) {
      return provider;
    }
  }
  
  return 'Unknown Provider';
}
```

### 3. Interactive Element Detection

Comprehensive scanning for focusable elements:

```javascript
function scanForFocusableElements(container) {
  // Semantic HTML elements
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[contenteditable="true"]'
  ];
  
  // ARIA interactive roles
  const interactiveRoles = [
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="tab"]'
  ];
  
  // Tabindex elements
  const tabindexSelectors = [
    '[tabindex]:not([tabindex="-1"])',
    '[tabindex="0"]'
  ];
  
  const allSelectors = [...focusableSelectors, ...interactiveRoles, ...tabindexSelectors];
  const focusableElements = container.querySelectorAll(allSelectors.join(', '));
  
  return {
    hasFocusableElements: focusableElements.length > 0,
    count: focusableElements.length,
    elements: Array.from(focusableElements)
  };
}
```

### 4. Context Detection

Find structural context (landmarks, headings):

```javascript
function checkLandmarkContext(element) {
  const landmarkRoles = ['region', 'main', 'navigation', 'complementary'];
  const landmarkElements = { 'main': 'main', 'nav': 'navigation', 'aside': 'complementary' };
  
  let current = element;
  while (current && current !== document.body) {
    // Check ARIA landmarks
    const role = current.getAttribute('role');
    if (role && landmarkRoles.includes(role)) {
      return { hasLandmark: true, type: role };
    }
    
    // Check HTML5 landmarks
    const tagName = current.tagName.toLowerCase();
    if (landmarkElements[tagName]) {
      return { hasLandmark: true, type: landmarkElements[tagName] };
    }
    
    current = current.parentElement;
  }
  
  return { hasLandmark: false };
}
```

## Chrome Extension Gotchas

### 1. Context Isolation

Chrome extensions run in isolated contexts. You cannot directly access the page's JavaScript objects:

```javascript
// ❌ Won't work - different context
const pageVariable = window.somePageVariable;

// ✅ Works - DOM is shared
const element = document.querySelector('.map');
```

### 2. Cross-Origin Restrictions

Cannot access iframe content from different origins:

```javascript
function checkIframeContent(iframe) {
  try {
    // This will throw for cross-origin iframes
    const doc = iframe.contentDocument;
    return doc.querySelector('.interactive');
  } catch (e) {
    // Fallback to heuristic detection
    return checkForInteractiveHeuristics(iframe);
  }
}
```

### 3. Script Injection Pattern

Must inject scripts to run in page context:

```javascript
// In content.js
function injectScript(file) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(file);
  script.onload = function() { this.remove(); };
  (document.head || document.documentElement).appendChild(script);
}
```

### 4. Message Passing

Communication between contexts requires message passing:

```javascript
// In touchpoint (page context)
window.postMessage({
  type: 'TOUCHPOINT_RESULT',
  data: results
}, '*');

// In content script
window.addEventListener('message', (event) => {
  if (event.data.type === 'TOUCHPOINT_RESULT') {
    chrome.runtime.sendMessage(event.data);
  }
});
```

### 5. Async Execution

All touchpoints must handle async operations:

```javascript
window.test_async = async function() {
  // Wait for dynamic content
  await waitForElement('.lazy-loaded-map');
  
  // Perform analysis
  const results = analyzeContent();
  
  return results;
};

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); reject(); }, timeout);
  });
}
```

## WCAG Mapping Guidelines

### Severity Levels

1. **FAIL**: Clear WCAG violations that prevent access
2. **WARNING**: Potential issues or suboptimal implementations
3. **INFO**: Best practice recommendations

### Common WCAG Mappings

| Issue Type | WCAG Criterion | Level | Severity |
|------------|----------------|-------|----------|
| Missing accessible name | 4.1.2 Name, Role, Value | A | FAIL |
| Interactive content with aria-hidden | 1.3.1 Info and Relationships | A | FAIL |
| Missing alt text | 1.1.1 Non-text Content | A | FAIL |
| Keyboard trap | 2.1.2 No Keyboard Trap | A | FAIL |
| Missing labels | 3.3.2 Labels or Instructions | A | FAIL |
| Low contrast | 1.4.3 Contrast (Minimum) | AA | WARNING |
| Missing landmarks | 1.3.1 Info and Relationships | A | WARNING |

### Mapping Decision Process

```javascript
function mapToWCAG(violation) {
  const mappings = {
    'missing-accessible-name': {
      wcag: '4.1.2',
      level: 'A',
      severity: 'fail',
      title: 'Name, Role, Value'
    },
    'aria-hidden-interactive': {
      wcag: '1.3.1',
      level: 'A', 
      severity: 'fail',
      title: 'Info and Relationships'
    },
    'generic-name': {
      wcag: '2.4.6',
      level: 'AA',
      severity: 'warning',
      title: 'Headings and Labels'
    }
  };
  
  return mappings[violation.type] || {
    wcag: '4.1.1',
    level: 'A',
    severity: 'warning',
    title: 'Parsing'
  };
}
```

## Testing Approaches

### 1. Unit Testing Pattern

Test individual detection functions:

```javascript
// In test file
describe('Map Detection', () => {
  it('should detect iframe maps', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://maps.google.com/embed';
    document.body.appendChild(iframe);
    
    const maps = detectIframeMaps();
    expect(maps).toHaveLength(1);
    expect(maps[0].provider).toBe('Google Maps');
  });
});
```

### 2. Fixture-Based Testing

Create test HTML files for each scenario:

```html
<!-- fixtures/maps/missing-title.html -->
<iframe src="https://maps.google.com/embed" 
        width="600" 
        height="400">
</iframe>

<!-- Expected violation: missing-accessible-name -->
```

### 3. Integration Testing

Test complete touchpoint execution:

```javascript
async function testTouchpoint() {
  // Load test page
  await page.goto('fixtures/maps/test-page.html');
  
  // Execute touchpoint
  const results = await page.evaluate(() => window.test_maps());
  
  // Verify results
  expect(results.success).toBe(true);
  expect(results.results.violations).toHaveLength(3);
}
```

### 4. Manual Testing Checklist

- [ ] Test with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Test keyboard navigation
- [ ] Test with browser zoom (200%, 400%)
- [ ] Test in different browsers
- [ ] Test with slow network
- [ ] Test with JavaScript disabled (graceful degradation)

## Code Patterns Library

### 1. XPath Generation

Reliable element identification:

```javascript
function getFullXPath(element) {
  if (!element) return '';
  
  function getElementIdx(el) {
    let count = 1;
    for (let sib = el.previousSibling; sib; sib = sib.previousSibling) {
      if (sib.nodeType === 1 && sib.tagName === el.tagName) count++;
    }
    return count;
  }
  
  let path = '';
  while (element && element.nodeType === 1) {
    const idx = getElementIdx(element);
    const tagName = element.tagName.toLowerCase();
    path = `/${tagName}[${idx}]${path}`;
    element = element.parentNode;
  }
  return path;
}
```

### 2. CSS Selector Generation

Prefer IDs when available:

```javascript
function getCssSelector(element) {
  if (element.id) return `#${element.id}`;
  
  if (element.className) {
    const classes = element.className.split(' ')
      .filter(c => c && !c.includes(':'))
      .map(c => `.${c}`)
      .join('');
    if (classes) return element.tagName.toLowerCase() + classes;
  }
  
  return getFullXPath(element);
}
```

### 3. Safe Attribute Access

Handle missing attributes gracefully:

```javascript
function getSafeAttribute(element, attr) {
  try {
    return element.getAttribute(attr) || '';
  } catch (e) {
    return '';
  }
}
```

### 4. Results Structure

Consistent result formatting:

```javascript
function formatViolation(type, element, additionalInfo = {}) {
  return {
    type: type,
    severity: getSeverity(type),
    wcag: getWCAGMapping(type),
    selector: getCssSelector(element),
    xpath: getFullXPath(element),
    html: element.outerHTML.substring(0, 500),
    remediation: getRemediation(type),
    ...additionalInfo
  };
}
```

### 5. Error Handling

Graceful degradation:

```javascript
function safeExecute(fn, fallback = null) {
  try {
    return fn();
  } catch (error) {
    console.error('[Touchpoint] Error:', error);
    return fallback;
  }
}
```

## Common Pitfalls

### 1. Over-Detection

**Problem**: Detecting too many false positives

```javascript
// ❌ Too broad
const maps = document.querySelectorAll('[class*="map"]');
// This catches: "sitemap", "bitmap", "mapping", etc.

// ✅ More specific
const maps = Array.from(document.querySelectorAll('[class*="map"]'))
  .filter(el => !el.className.includes('sitemap'));
```

### 2. Missing Edge Cases

**Problem**: Not handling dynamic content

```javascript
// ❌ Only checks initial state
const maps = document.querySelectorAll('.map');

// ✅ Handles dynamic content
function detectMaps() {
  // Initial detection
  let maps = Array.from(document.querySelectorAll('.map'));
  
  // Watch for new maps
  const observer = new MutationObserver(() => {
    const newMaps = document.querySelectorAll('.map:not([data-analyzed])');
    newMaps.forEach(map => {
      map.setAttribute('data-analyzed', 'true');
      analyzeMap(map);
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}
```

### 3. Context Loss

**Problem**: Losing context in async operations

```javascript
// ❌ Context lost
elements.forEach(async (el) => {
  const result = await analyzeElement(el);
  results.push(result); // Race condition!
});

// ✅ Maintain context
const results = await Promise.all(
  elements.map(el => analyzeElement(el))
);
```

### 4. Performance Issues

**Problem**: Inefficient DOM queries

```javascript
// ❌ Multiple queries
function checkElement(el) {
  const hasLabel = document.querySelector(`label[for="${el.id}"]`);
  const hasAria = el.getAttribute('aria-label');
  const hasTitle = el.getAttribute('title');
}

// ✅ Batched queries
function checkElements(elements) {
  const labels = new Map();
  document.querySelectorAll('label[for]').forEach(label => {
    labels.set(label.getAttribute('for'), label);
  });
  
  elements.forEach(el => {
    const hasLabel = labels.has(el.id);
    const hasAria = el.getAttribute('aria-label');
    // ...
  });
}
```

### 5. Incomplete Remediation

**Problem**: Vague fix instructions

```javascript
// ❌ Too vague
remediation: "Add accessible name"

// ✅ Specific and actionable
remediation: `Add a title attribute to the iframe element. For example:
<iframe src="${src}" title="Interactive map showing office location">
The title should describe what the map shows, not just say "map".`
```

## Best Practices

### 1. Educational Comments

Every complex logic should teach:

```javascript
// Educational: Chrome's Same-Origin Policy prevents iframe content access
// We must use indirect methods to determine interactivity
// This demonstrates working within browser security constraints
```

### 2. Progressive Enhancement

Start simple, add complexity:

```javascript
// Level 1: Basic detection
const forms = document.querySelectorAll('form');

// Level 2: Include ARIA forms
const allForms = document.querySelectorAll('form, [role="form"]');

// Level 3: Heuristic detection for implicit forms
// ... (advanced logic)
```

### 3. Defensive Programming

Assume everything can fail:

```javascript
function analyzeElement(element) {
  if (!element || !element.nodeType) return null;
  
  const results = {
    // Safe defaults
    hasAccessibleName: false,
    violations: []
  };
  
  try {
    // Analysis logic
  } catch (error) {
    console.error('Analysis failed:', error);
    return results; // Return partial results
  }
}
```

### 4. Clear Naming

Use descriptive names:

```javascript
// ❌ Unclear
function check(el) {
  return el.getAttribute('aria-hidden') === 'true';
}

// ✅ Clear intent
function isHiddenFromAssistiveTechnology(element) {
  return element.getAttribute('aria-hidden') === 'true';
}
```

### 5. Modular Functions

Keep functions focused:

```javascript
// Each function does one thing well
function detectMaps() { /* ... */ }
function analyzeMap(map) { /* ... */ }
function checkAccessibleName(element) { /* ... */ }
function generateRemediation(violation) { /* ... */ }
```

## Conclusion

Creating touchpoints for Carnforth Web A11y requires balancing technical implementation with educational value. Every line of code should serve both purposes: detecting accessibility issues AND teaching developers how to build better testing tools.

Remember the project's mission: this is an educational tool first, testing tool second. Your code should be clear, well-commented, and demonstrate best practices in both accessibility testing and Chrome extension development.

When in doubt, refer to maps.js as the gold standard implementation. It demonstrates all the patterns, handles edge cases, and includes comprehensive educational comments.

Happy coding, and remember: we're creating tools that make the web more accessible for everyone! 🌟