# Carnforth Web A11y - Project Instructions

This document contains the complete specifications and design requirements for the Carnforth Web A11y Chrome extension.

## Overview

Carnforth Web A11y is an automated web accessibility testing extension for Chrome. It evaluates web pages against 23 distinct accessibility touchpoints and presents results in an accessible interface within Chrome DevTools.

## Key Requirements

- Chrome extension with DevTools panel integration
- Structured testing around 23 accessibility touchpoints
- Accessible user interface following WAI ARIA Authoring Practices Guide
- Element highlighting for identified issues
- Reset functionality when page refresh or URL change occurs
- WCAG AAA compliant UI

## UI Design Specifications

### Colors

All colors must meet WCAG AAA compliance (7:1 contrast ratio):

```css
/* Base colors */
--background-color: #ffffff;

/* WCAG AAA compliant colors (7:1 contrast ratio on white) */
--fail-color: #9a0000; /* Darker red for text on light backgrounds */
--warning-color: #6d4c00; /* Dark amber */
--info-color: #0d47a1; /* Dark blue */
--text-color: #222222; /* Almost black text on white - over 10:1 ratio */
--border-color: #757575; /* Medium gray - at least 3:1 for subtle borders */
--focus-outline-color: #0d47a1; /* Dark blue for focus - AAA compliant */

/* For UI components requiring brighter colors (buttons with white text) */
--fail-bg-color: #e53935; /* Bright red for backgrounds with white text */
--warning-bg-color: #ffb300; /* Bright amber for icons/backgrounds */
--info-bg-color: #1e88e5; /* Bright blue for buttons/backgrounds with white text */
```

### Typography

- All text must use relative units (rem) not fixed pixel sizes
- Minimum font size of 16px (1rem)
- Clear hierarchy of headings:
  - h1: 1.5rem (24px)
  - h2: 1.125rem (18px)
  - h3: 1rem (16px)

```css
/* Define base font sizes */
--base-font-size: 1rem; /* 16px in most browsers */
--large-font-size: 1.5rem; /* 24px */
--medium-font-size: 1.125rem; /* 18px */
--small-font-size: 1rem; /* 16px */
```

### Layout

1. **Header**
   - Full-width header with left-aligned h1
   - Border-bottom to separate from content

2. **Message Bar**
   - Left-aligned instructional message
   - Positioned directly below header
   - Message: "Click 'Start Test' to analyze accessibility issues on this page."

3. **Control Bar**
   - Start button aligned to the left
   - Summary box with counts floating just to the right of the start button
   - Summary format: counts of Fails/Warnings/Info with appropriate colors
   - Summary indicators must show actual counts (not letters)

4. **Results Area**
   - Accordion sections for each touchpoint category
   - Touchpoint name on left with summary dots floating immediately after
   - Sorting: Touchpoints sorted alphabetically
   - Issues within each touchpoint sorted by:
     1. Type (fails first, then warnings, then info)
     2. Alphabetically by title within each type
   - Issue items follow a nested disclosure pattern

### Accordion & Disclosure Design

- Follow WAI ARIA APG for accordion and disclosure widgets
- Accordion headers must have:
  - Proper ARIA attributes (button role, aria-expanded, aria-controls)
  - Visual indicator for expand/collapse state
  - Clear hierarchy with touchpoint name and summary
  - Summary dots showing counts by issue type

- Issue disclosures must have:
  - Colored bullets indicating severity (fail/warning/info)
  - Detailed information in expandable sections
  - "Highlight Element" button for elements with selectors

## Touchpoint Categories

1. Accessible Names
2. Animation
3. Color Contrast
4. Color Use
5. Dialogs
6. Electronic Documents
7. Event Handling
8. Floating Content
9. Focus Management
10. Fonts
11. Forms
12. Headings
13. Images
14. Landmarks
15. Language
16. Lists
17. Maps
18. Read More Links
19. Tabindex
20. Title Attributes
21. Tables
22. Timers
23. Videos

## Result Format

Each touchpoint test should return results in this structure with enhanced fields for comprehensive reporting:

```javascript
{
  [touchpoint_name]: {
    description: "Description text explaining the touchpoint...",
    issues: [
      {
        // Required for all issue types (fail, warning, info)
        type: "fail", // or "warning" or "info"
        title: "Issue title",
        description: "Detailed explanation of the issue",
        
        // Required for fail and warning types
        impact: {
          who: "Description of affected user groups (e.g., screen reader users, keyboard-only users)", 
          severity: "High/Medium/Low - level of impact on affected users",
          why: "Why this issue matters for accessibility"
        },
        
        // Required for fail and warning types where applicable
        remediation: [
          "Approach 1 to fix the issue",
          "Alternative approach 2 if applicable"
        ],
        
        // Technical details for fail and warning types
        selector: "CSS selector to the problematic element",
        xpath: "XPath to the problematic element (alternative to CSS selector)",
        html: "HTML snippet of the problematic element as it exists currently",
        
        // Example fix (required for fail and warning types where applicable)
        fixedHtml: "HTML snippet showing a corrected version of the code",
        
        // Optional fields for all types
        wcag: {
          principle: "WCAG principle (e.g., 'Perceivable', 'Operable')",
          guideline: "Guideline number and name (e.g., '1.1 Text Alternatives')",
          successCriterion: "Success criterion (e.g., '1.1.1 Non-text Content')",
          level: "A, AA, or AAA"
        },
        resources: [
          {
            title: "Resource title",
            url: "URL to helpful resource"
          }
        ]
      },
      // More issues...
    ]
  },
  // More touchpoints...
}
```

## Interaction Behavior

1. **Test Execution**
   - Click "Start Test" to analyze the current page
   - Show "Running tests..." during analysis
   - Display results organized by touchpoint
   - Update summary counts with totals

2. **Results Navigation**
   - Click on accordion headers to expand/collapse touchpoint sections
   - Click on issue headers to expand/collapse detailed information
   - Click "Highlight Element" to visually identify elements on the page

3. **Page Changes**
   - Reset UI when page changes or refreshes
   - Reset counts to 0
   - Clear results
   - Return button to initial state

## Implementation Notes

### Component Structure

- **manifest.json**: Configuration for Chrome extension
- **devtools_page/**: DevTools integration
- **panel/**: Main UI for the accessibility panel
- **css/**: Styling
- **js/**: JavaScript functionality
  - panel.js: Main UI functionality
  - accordion.js: Accordion behavior
  - highlight.js: Element highlighting
  - test-runner.js: Test execution
  - background.js: Background service worker
  - content.js: Content script

### Touchpoint Testing Structure

Each touchpoint test should be implemented as a separate module that:
1. Analyzes specific accessibility aspects
2. Returns results in standardized format
3. Provides actionable information

## Accessibility Requirements

The extension itself must be fully accessible:

1. **Keyboard Accessibility**
   - All interactive elements must be keyboard accessible
   - Proper focus indicators (2px outline with high contrast)
   - Logical tab order

2. **Screen Reader Support**
   - Proper ARIA roles, states, and properties
   - Meaningful labels and descriptions
   - Appropriate announcements for state changes

3. **Visual Design**
   - Color is not the only means of conveying information
   - All text has sufficient contrast (7:1 ratio for AAA compliance)
   - Interface is responsive and supports zoom

4. **Cognitive Considerations**
   - Clear, simple language in descriptions
   - Consistent patterns and behavior
   - Helpful error messages and guidance

## Export Functionality

### Current Export Options
- **JSON Export**: Complete data export with full issue details and metadata
- **Excel/CSV Export**: Tabular format with key fields and metadata section

### DOCX Export Requirements (Planned)
- Generate accessible Word documents that follow accessibility best practices
- Include proper document structure:
  - Use semantic heading levels (H1-H6)
  - Add alternative text to screenshots
  - Define table header rows
  - Set document language and metadata
  - Create bookmarks and internal navigation

- Implementation options:
  1. HTML to DOCX conversion using libraries like docx.js
  2. Direct OOXML generation for precise control
  3. Markdown as intermediate format with pandoc conversion
  4. Template-based approach with placeholders
  
- Required document components:
  - Cover page with URL, test date, and summary
  - Table of contents for navigation
  - Executive summary with counts by issue type
  - Detailed findings organized by touchpoint
  - Screenshots of identified issues
  - Remediation recommendations
  - WCAG references and resources section

## Future Enhancements

- Save test results for comparison over time
- Custom touchpoint configurations
- Integration with other testing tools
- Automated fix suggestions
- Custom templates for exports

## Current Project Status

### Completed Features
- Basic Chrome extension structure with DevTools panel integration
- Accessible UI following WAI ARIA patterns
- Accordion and disclosure widgets for results display
- Element highlighting functionality
- Reset functionality for page changes
- JSON and Excel/CSV export functionality
- WCAG AAA compliant UI with appropriate color contrast
- Relative units (rem) for all sizes for better accessibility
- Left-aligned layout for better readability
- Summary indicators with counts

### In Progress
- Test runner implementation
- Standardized JSON result reporting structure

### Pending
- Module structure for all 23 touchpoints
- Implementation of individual touchpoint tests
- DOCX export functionality
- Testing framework for the extension
- Review of existing prototype code for reusable components

## Development Guidelines

- Follow consistent naming conventions
- Document code thoroughly
- Test with various assistive technologies
- Maintain separation of concerns between UI and testing logic
- Use progressive enhancement
- Ensure all UI components meet WCAG AAA requirements
- Provide appropriate keyboard navigation
- Add meaningful metadata to all exports