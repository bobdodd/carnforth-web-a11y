# Touchpoint Development Guide

This guide walks through creating accessibility touchpoint tests for the Carnforth Web A11y Chrome extension. Use the maps touchpoint as your reference implementation.

## Table of Contents

1. [Understanding Touchpoints](#understanding-touchpoints)
2. [Anatomy of a Touchpoint](#anatomy-of-a-touchpoint)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Detection Strategies](#detection-strategies)
5. [Issue Categorization](#issue-categorization)
6. [WCAG Mapping](#wcag-mapping)
7. [Writing Effective Remediation](#writing-effective-remediation)
8. [Common Patterns](#common-patterns)
9. [Testing Your Touchpoint](#testing-your-touchpoint)
10. [Debugging Tips](#debugging-tips)

## Understanding Touchpoints

A touchpoint is a focused accessibility test that examines one specific aspect of web accessibility. Each touchpoint:

- Tests a single accessibility concern (e.g., maps, headings, images)
- Returns standardized results
- Provides actionable remediation guidance
- Maps issues to WCAG criteria

## Anatomy of a Touchpoint

Every touchpoint follows this structure:

```javascript
/**
 * [Name] Touchpoint - Brief description
 * 
 * Detailed explanation of what this tests and why it matters
 * 
 * WHAT THIS TESTS:
 * - Bullet points of specific checks
 * 
 * WCAG COVERAGE:
 * - Relevant success criteria
 */
window.test_[touchpoint_name] = async function() {
  try {
    // 1. Analysis function that runs in page context
    function analyze[TouchpointName]() {
      // Detection logic
      // Issue identification
      // Result compilation
      return results;
    }
    
    // 2. Execute analysis
    const results = await executeInPageContext(analyze[TouchpointName]);
    
    // 3. Transform results into issues
    const issues = processResults(results);
    
    // 4. Return standardized format
    return {
      description: 'What this touchpoint evaluates',
      issues: issues
    };
    
  } catch (error) {
    // 5. Error handling
    return {
      description: 'What this touchpoint evaluates',
      issues: [{
        type: 'error',
        title: 'Error running test',
        description: error.message
      }]
    };
  }
};
```

## Step-by-Step Implementation

### Step 1: Create Your Touchpoint File

1. Copy `touchpoint-template.js` to `js/touchpoints/[name].js`
2. Replace all placeholder values:
   - `TOUCHPOINT_NAME` → your touchpoint name (e.g., `headings`)
   - `TOUCHPOINT_DESCRIPTION` → brief description
   - `TOUCHPOINT_DESCRIPTION_LONG` → detailed description

### Step 2: Define What to Detect

Identify the elements or patterns you need to find:

```javascript
// Example: Finding all headings
const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

// Example: Finding elements with specific attributes
const elementsWithTabindex = Array.from(document.querySelectorAll('[tabindex]'));

// Example: Finding elements by multiple criteria
const interactiveElements = Array.from(document.querySelectorAll('button, a, input, select, textarea'))
  .filter(el => !el.hasAttribute('disabled'));
```

### Step 3: Implement Detection Logic

Use multiple strategies to increase accuracy:

```javascript
// Strategy 1: Direct element selection
const directMatches = document.querySelectorAll('iframe[src*="map"]');

// Strategy 2: Attribute checking
const attributeMatches = Array.from(document.querySelectorAll('div'))
  .filter(div => {
    const className = div.className.toLowerCase();
    return className.includes('map') && !className.includes('sitemap');
  });

// Strategy 3: Content analysis
const contentMatches = Array.from(document.querySelectorAll('img'))
  .filter(img => {
    const alt = img.alt.toLowerCase();
    return alt.includes('map of') || alt.includes('location');
  });

// Combine strategies
const allMatches = [...directMatches, ...attributeMatches, ...contentMatches];
```

### Step 4: Evaluate for Accessibility Issues

Check each element against accessibility criteria:

```javascript
elements.forEach(element => {
  // Check 1: Does it have an accessible name?
  const hasAccessibleName = !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title') ||
    element.textContent.trim()
  );
  
  // Check 2: Is it properly marked up?
  const hasProperRole = element.getAttribute('role') === 'expectedRole';
  
  // Check 3: Are there any anti-patterns?
  const hasProblematicAttribute = element.hasAttribute('aria-hidden');
  
  // Record violations
  if (!hasAccessibleName) {
    violations.push({
      type: 'missing-name',
      element: element,
      // ... other details
    });
  }
});
```

## Detection Strategies

### 1. Element Type Detection

```javascript
// Simple: Look for specific elements
const maps = document.querySelectorAll('iframe[src*="maps"]');

// Advanced: Multiple element types
const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
```

### 2. Attribute Pattern Matching

```javascript
// Check for presence of attributes
const hasAttribute = element.hasAttribute('aria-label');

// Check attribute values
const isHidden = element.getAttribute('aria-hidden') === 'true';

// Check multiple attributes
const hasAnyLabel = element.hasAttribute('aria-label') || 
                   element.hasAttribute('aria-labelledby') ||
                   element.hasAttribute('title');
```

### 3. Content Analysis

```javascript
// Text content checking
const hasVisibleText = element.textContent.trim().length > 0;

// Check for specific patterns
const looksLikePhoneNumber = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(element.textContent);

// Check child elements
const hasInteractiveChildren = element.querySelector('button, a, input') !== null;
```

### 4. Computed Style Checking

```javascript
// Check if element is visible
const style = window.getComputedStyle(element);
const isVisible = style.display !== 'none' && 
                 style.visibility !== 'hidden' &&
                 style.opacity !== '0';

// Check dimensions
const hasSize = parseInt(style.width) > 0 && parseInt(style.height) > 0;
```

### 5. Context Analysis

```javascript
// Check parent elements
const isInNav = element.closest('nav') !== null;

// Check siblings
const hasLabelSibling = element.previousElementSibling?.tagName === 'LABEL';

// Check document structure
const isMainHeading = element.tagName === 'H1' && 
                     element === document.querySelector('main h1');
```

## Issue Categorization

### Issue Types

- **`fail`**: WCAG violations that must be fixed
- **`warning`**: Best practices or potential issues
- **`info`**: Informational findings

### Severity Levels

Determine severity based on user impact:

- **Critical**: Blocks access to content or functionality
- **High**: Significantly impairs user experience
- **Medium**: Creates difficulty but workarounds exist
- **Low**: Minor inconvenience

### Example Categorization

```javascript
// Critical: Complete barrier
if (interactiveElement.hasAttribute('aria-hidden')) {
  issues.push({
    type: 'fail',
    severity: 'Critical',
    title: 'Interactive element hidden from screen readers'
  });
}

// High: Major difficulty
if (!formInput.hasAttribute('label') && !formInput.hasAttribute('aria-label')) {
  issues.push({
    type: 'fail',
    severity: 'High',
    title: 'Form input missing label'
  });
}

// Medium: Usability issue
if (link.textContent.trim() === 'click here') {
  issues.push({
    type: 'warning',
    severity: 'Medium',
    title: 'Link text not descriptive'
  });
}
```

## WCAG Mapping

### Understanding WCAG Structure

- **Principles**: Perceivable, Operable, Understandable, Robust
- **Guidelines**: Broad goals under each principle
- **Success Criteria**: Specific, testable requirements
- **Levels**: A (minimum), AA (recommended), AAA (enhanced)

### Common Mappings

| Issue Type | Likely WCAG Criteria |
|------------|---------------------|
| Missing alt text | 1.1.1 Non-text Content (A) |
| Missing form labels | 1.3.1 Info and Relationships (A), 4.1.2 Name, Role, Value (A) |
| Keyboard traps | 2.1.2 No Keyboard Trap (A) |
| Missing headings | 1.3.1 Info and Relationships (A), 2.4.6 Headings and Labels (AA) |
| Low contrast | 1.4.3 Contrast Minimum (AA) |
| Missing skip links | 2.4.1 Bypass Blocks (A) |

### Example WCAG Object

```javascript
wcag: {
  principle: 'Perceivable',
  guideline: '1.1 Text Alternatives',
  successCriterion: '1.1.1 Non-text Content',
  level: 'A'
}
```

## Writing Effective Remediation

### Principles

1. **Be Specific**: Don't just say "add alt text" - explain what it should contain
2. **Provide Options**: Multiple approaches when applicable
3. **Include Context**: Why the fix matters
4. **Make it Actionable**: Step-by-step when needed

### Remediation Template

```javascript
remediation: [
  'Primary solution - the most straightforward fix',
  'Alternative approach - when the primary isn't feasible',
  'Best practice enhancement - going beyond minimum compliance',
  'Testing step - how to verify the fix works'
]
```

### Example: Good Remediation

```javascript
// Good - Specific and actionable
remediation: [
  'Add a descriptive title attribute to the map iframe (e.g., "Map showing office location at 123 Main St")',
  'Alternatively, use aria-label if the title attribute conflicts with other functionality',
  'For complex maps, also provide a text description of key information near the map',
  'Test with a screen reader to ensure the map purpose is announced clearly'
]

// Bad - Too vague
remediation: [
  'Add appropriate attributes',
  'Make it accessible',
  'Follow WCAG guidelines'
]
```

## Common Patterns

### Pattern: Element Collection and Filtering

```javascript
// Collect all candidates
const allElements = Array.from(document.querySelectorAll('selector'));

// Filter for relevant ones
const relevantElements = allElements.filter(element => {
  // Multiple conditions
  return condition1 && condition2 && !exclusion;
});
```

### Pattern: Accessible Name Computation

```javascript
function getAccessibleName(element) {
  // Priority order per WCAG
  return element.getAttribute('aria-labelledby') ||
         element.getAttribute('aria-label') ||
         element.getAttribute('title') ||
         element.textContent.trim() ||
         '';
}
```

### Pattern: Safe Attribute Access

```javascript
// Defensive programming for reliability
const attribute = element.getAttribute('name') || '';
const hasAttribute = element.hasAttribute('name');
const attributeLower = attribute.toLowerCase();
```

### Pattern: XPath Generation

```javascript
function getXPath(element) {
  // Reliable fallback when CSS selectors fail
  // See maps.js for full implementation
  return generateFullXPath(element);
}
```

### Pattern: Issue Deduplication

```javascript
// Track processed elements
const processed = new Set();

elements.forEach(element => {
  const key = element.id || getXPath(element);
  
  if (!processed.has(key)) {
    processed.add(key);
    // Process element
  }
});
```

## Testing Your Touchpoint

### 1. Create Test Fixtures

Create an HTML file in `/fixtures/[touchpoint]_test.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>[Touchpoint] Test Cases</title>
</head>
<body>
    <h1>[Touchpoint] Test Cases</h1>
    
    <!-- Test Case 1: Valid implementation -->
    <div class="test-case">
        <h2>✓ Correct Implementation</h2>
        <!-- Your correct example -->
    </div>
    
    <!-- Test Case 2: Common mistake -->
    <div class="test-case">
        <h2>✗ Missing Accessibility Attribute</h2>
        <!-- Your problematic example -->
    </div>
    
    <!-- Add more test cases -->
</body>
</html>
```

### 2. Test Locally

1. Open the test fixture in Chrome
2. Open DevTools → Carnforth Web A11y panel
3. Run your touchpoint test
4. Verify all issues are detected correctly

### 3. Test Edge Cases

Always test:
- Elements with no attributes
- Elements with empty attributes (`aria-label=""`)
- Hidden elements (`display: none`, `visibility: hidden`)
- Dynamically generated content
- Nested structures
- Special characters in attributes

## Debugging Tips

### 1. Console Logging

```javascript
// Add debug logging during development
console.log(`[${touchpointName}] Found ${elements.length} elements`);
console.log(`[${touchpointName}] Element details:`, {
  tag: element.tagName,
  attributes: Array.from(element.attributes).map(a => `${a.name}="${a.value}"`)
});
```

### 2. Validate Selectors

```javascript
// Test your selectors in browser console first
document.querySelectorAll('your-selector'); // Should return expected elements
```

### 3. Handle Errors Gracefully

```javascript
try {
  // Risky operation
  const result = element.someMethod();
} catch (error) {
  console.error(`[${touchpointName}] Error:`, error);
  // Continue processing other elements
}
```

### 4. Use Chrome DevTools

- Elements panel: Inspect element properties
- Console: Test selectors and functions
- Network: Check if resources loaded
- Accessibility panel: Verify accessibility tree

### 5. Common Issues and Solutions

| Problem | Solution |
|---------|----------|
| Elements not found | Check if content is dynamically loaded |
| Selector too broad | Add exclusions or more specific criteria |
| False positives | Refine detection logic with additional checks |
| Performance issues | Limit scope or optimize selectors |

## Next Steps

1. Implement your touchpoint following this guide
2. Create comprehensive test fixtures
3. Test thoroughly with real websites
4. Document any unique patterns you discover
5. Share your learnings for future touchpoints

Remember: The goal is to help developers create more accessible websites by providing clear, actionable feedback. Your touchpoint is a teaching tool as much as it is a testing tool.