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
   - Skip links for bypassing navigation

2. **Screen Reader Support**
   - Proper ARIA roles, states, and properties
   - Meaningful labels and descriptions
   - Appropriate announcements for state changes
   - ARIA live regions for dynamic content updates
   - Proper semantics for interactive elements

3. **Visual Design**
   - Color is not the only means of conveying information
   - All text has sufficient contrast (7:1 ratio for AAA compliance)
   - Interface is responsive and supports zoom
   - Consistent visual indicators for interactive elements

4. **Cognitive Considerations**
   - Clear, simple language in descriptions
   - Consistent patterns and behavior
   - Helpful error messages and guidance
   - Logical organization of content
   - Table of Contents for complex documents

## Recent Accessibility Improvements

1. **Accordion Improvements:**
   - Enhanced WAI-ARIA implementation with proper focus management
   - Added programmatic focus to expanded content regions
   - Improved keyboard navigation between accordion sections
   - Added proper semantics with heading structure

2. **Element Highlighting:**
   - Automatic highlighting when expanding issue details
   - Removed extra click requirement for better usability
   - Added descriptive text indicating automatic highlighting
   - Robust validation to prevent errors with invalid selectors

3. **Status Announcements:**
   - Added ARIA live regions for test status updates
   - Implemented status messages for test start and completion
   - Included count information in status announcements
   - Improved error handling with descriptive messages

4. **HTML Export Enhancements:**
   - Accessible Table of Contents with proper navigation
   - Skip-to-content links for keyboard users
   - Back-to-top navigation for long reports
   - Proper heading hierarchy and semantic structure
   - Print-friendly styles for PDF generation

## Recent Technical Improvements

1. **Touchpoint Framework Implementation:**
   - Created a modular structure for all 23 touchpoints
   - Set up standardized interfaces for consistent implementation
   - Each touchpoint exports metadata and test function
   - Abstracted test logic into separate modules for maintainability

2. **Module Architecture Changes:**
   - Switched from ES modules to regular JS to fix Chrome extension limitations
   - Created touchpoint-loader.js to inject test functions properly
   - Fixed "getMockTestResults is not defined" error
   - Simplified message passing between panel, test-runner, and content script

3. **Windows High Contrast Mode Support:**
   - Added CSS media queries to detect high contrast mode
   - Applied appropriate styles for high contrast environments
   - Used system colors instead of custom colors when in high contrast mode
   - Added additional non-color indicators for states and roles

4. **Font Size and Relative Units:**
   - Converted all fixed px sizes to relative rem units
   - Set minimum font size of 16px (1rem) throughout the interface
   - Ensured proper text scaling when browser zoom is used
   - Improved code samples with properly sized monospace font

## Export Functionality

### Current Export Options
- **JSON Export**: Complete data export with full issue details and metadata
- **Excel/CSV Export**: Tabular format with key fields and metadata section
- **HTML Export**: Self-contained HTML report with all styles embedded
  - Includes Table of Contents with section links
  - Features accessible navigation with skip links
  - Formats code with proper escaping and syntax
  - Organizes results by touchpoint with back-to-top links
  - Provides print-friendly styling for PDF generation

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
- JSON, Excel/CSV, and HTML export functionality
- WCAG AAA compliant UI with appropriate color contrast
- Relative units (rem) for all sizes for better accessibility
- Left-aligned layout for better readability
- Summary indicators with counts
- Improved accordion implementation with proper focus management
- Automatic element highlighting for issues when expanded
- Accessible Table of Contents for HTML exports
- ARIA live regions for status announcements
- Skip links for keyboard navigation

### In Progress
- Test runner implementation
- Standardized JSON result reporting structure

### Pending
- Module structure for all 23 touchpoints
- Implementation of individual touchpoint tests
- DOCX export functionality
- Testing framework for the extension
- Review of existing prototype code for reusable components

## Current To-Do List (Prioritized)

1. **High Priority:**
   - ✅ Create touchpoint module framework for test implementation
   - ✅ Set up structure for all 23 touchpoints with standardized interfaces
   - ✅ Complete test runner implementation to support touchpoint modules
   - ✅ Fix ES module import issues with "getMockTestResults is not defined" error
   - ⏭️ Implement actual testing logic for accessible_name touchpoint
   - ⏭️ Implement actual testing logic for headings touchpoint
   - ⏭️ Implement actual testing logic for images touchpoint
   
2. **Medium Priority:**
   - Implement DOCX export functionality
   - Set up testing framework for the extension
   - Review and refine standardized JSON result reporting structure

## Development Guidelines

- Follow consistent naming conventions
- Document code thoroughly
- Test with various assistive technologies
- Maintain separation of concerns between UI and testing logic
- Use progressive enhancement
- Ensure all UI components meet WCAG AAA requirements
- Provide appropriate keyboard navigation
- Add meaningful metadata to all exports

## Current Implementation Status and Work Log

### May 17, 2025 Session
1. Created touchpoint module framework for all 23 touchpoints
2. Fixed ES module imports that were causing "getMockTestResults is not defined" error
3. Implemented non-module approach to work around Chrome extension limitations
4. Created touchpoint-loader.js to inject test functions directly into page context
5. Updated content.js to work with injected touchpoint functions
6. Modified background.js to properly inject necessary scripts
7. Fixed panel.js to work without ES module imports
8. Updated manifest.json to load touchpoint-loader.js before content.js
9. Committed all changes to GitHub repository

### Issues Encountered and Resolutions
1. ES modules in Chrome extensions: 
   - Problem: Chrome extensions have limitations with ES modules in content scripts
   - Solution: Switched to standard JS files and a script injection approach

2. Function visibility across scripts:
   - Problem: Functions defined in one script weren't accessible in others
   - Solution: Created touchpoint-loader.js to inject test functions into the global scope

3. Message passing between contexts:
   - Problem: DevTools panel couldn't directly call content script functions
   - Solution: Implemented message passing via the background script service worker

### Next Implementation Tasks
1. Implement actual test logic for accessible_name touchpoint:
   - Create element selector for interactive elements
   - Implement accessible name computation algorithm
   - Add detection for empty, insufficient, and proper accessible names
   - Create specific issue reporting for different element types

2. Implement actual test logic for headings touchpoint:
   - Add heading structure analysis
   - Check for proper hierarchy (no skipped levels)
   - Verify presence of main heading (h1)
   - Detect duplicate or empty headings

3. Implement actual test logic for images touchpoint:
   - Check for alt text on images
   - Verify decorative images have empty alt or role="presentation"
   - Test for appropriate alt text length and quality
   - Check SVG images for accessible names