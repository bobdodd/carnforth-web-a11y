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
   - ✅ Implement actual testing logic for maps touchpoint
   - ✅ Fix maps detection issues for test fixtures
   - ✅ Create test fixtures for debugging touchpoints
   - ⏭️ Implement actual testing logic for accessible_name touchpoint
   - ⏭️ Implement actual testing logic for headings touchpoint
   - ⏭️ Implement actual testing logic for images touchpoint
   
2. **Medium Priority:**
   - ✅ Add Windows High Contrast Mode support
   - ✅ Change "Export as Excel" to "Export as CSV"
   - ✅ Improve error handling with detailed debugging information
   - ✅ Create testing framework for touchpoints using fixtures
   - Implement DOCX export functionality
   - Review and refine standardized JSON result reporting structure
   - Add more comprehensive fixtures for all touchpoints

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

### May 18, 2025 Session
1. Implemented maps touchpoint with detection for common map providers
2. Added checks for iframe maps with missing accessible names
3. Added checks for div-based maps missing proper ARIA attributes
4. Added detection for aria-hidden maps hidden from screen readers
5. Created detailed remediation steps with proper WCAG references
6. Added Windows High Contrast Mode support via CSS media queries
7. Changed "Export as Excel" to "Export as CSV" for better accessibility
8. Improved error handling with detailed debugging information
9. Created v0.1.0-framework tag to mark completion of the framework
10. Updated project documentation with current status and todo list

### May 19, 2025 Session
1. Debugged and fixed maps touchpoint detection issues
2. Enhanced maps detection logic in touchpoint-loader.js with better logging
3. Created test fixtures folder for testing touchpoints
4. Added maps_test.html and accessible_name_test.html fixtures
5. Created debug scripts for testing map detection directly
6. Added special handling for test fixture detection in maps touchpoint
7. Created Python HTTP server script for easier fixture testing
8. Added fixtures documentation in README.md

### May 20, 2025 Session
1. Fixed critical issue with touchpoint functions not being available in the page's global scope
2. Updated touchpoint-loader.js to properly inject functions into the window object
3. Changed script injection to use document.documentElement instead of document.head
4. Added ensureTouchpointFunctionsLoaded function to handle timing issues
5. Added custom event dispatch when functions are loaded
6. Updated manifest.json to add web_accessible_resources permissions
7. Enhanced error handling for better troubleshooting
8. Added wait-for-function capability with timeout handling
9. Created debug logging for better diagnosing injection issues
10. Simplified async function declaration in touchpoint-loader.js

### May 21, 2025 Session (Current)
1. Fixed critical issue with element highlighting functionality
2. Identified that scrollIntoView() in highlight.js and content.js was causing panel reset 
3. Removed scrollIntoView() calls from both highlight.js and content.js
4. Added extensive comments explaining why auto-scrolling was removed to prevent future reintroduction
5. Fixed the core issue of panel resetting when clicking on issues to expand them
6. Consolidated changes and ensured all use cases work across different browsers
7. Updated accordion.js to better interact with highlight.js
8. Fixed issue with the highlight element integration between accordion.js and highlight.js
9. Added explicit checks for DevTools context to avoid using chrome.tabs API in DevTools panel
10. Diagnosed complex interaction issues between DevTools panel and content scripts

### Current Todo List
1. ✅ Create a fix for the touchpoint-loader.js script to properly inject test functions into the global scope
2. ✅ Test the fix by running maps touchpoint on the test fixture
3. ✅ Add ensureTouchpointFunctionsLoaded function to handle timing issues between content script and page script contexts
4. ✅ Update manifest.json to add web_accessible_resources for touchpoint-loader.js
5. ✅ Fix issue with panel resetting when highlighting elements from expanded issues
6. ✅ Remove scrollIntoView() calls that were causing navigation events
7. ✅ Ensure element highlighting works without causing panel resets
8. ⏭️ Verify all touchpoint tests are working correctly
9. ⏭️ Implement actual testing logic for accessible_name touchpoint
10. ⏭️ Implement actual testing logic for headings touchpoint
11. ⏭️ Implement actual testing logic for images touchpoint

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

4. Error reporting clarity:
   - Problem: Error messages weren't providing enough context for debugging
   - Solution: Enhanced error reporting with detailed diagnostics and specific touchpoint handling

5. Map detection for test fixtures:
   - Problem: Maps weren't being detected in test fixtures, especially with empty src attributes
   - Solution: Enhanced map detection to check for class names, IDs, and text content in addition to src

6. Content script access to local files:
   - Problem: Chrome extensions have limitations accessing local file:// URLs
   - Solution: Added file:// permissions in manifest.json and created a local server for testing

7. Touchpoint functions not available in page context:
   - Problem: Extension was displaying errors "window[touchpoint] is not a function" for all touchpoints
   - Solution: Updated touchpoint-loader.js to explicitly assign functions to window object, improved injection method, and added timing checks
   
8. Script context isolation in Chrome extensions:
   - Problem: Chrome extensions have separate JavaScript contexts - content script vs. page script
   - Solution: Used document.documentElement.appendChild instead of document.head, added custom event to signal when functions are loaded

9. Panel reset during element highlighting:
   - Problem: When expanding an issue to see details, the panel would completely reset (returning to "Start Test" state)
   - Root cause: The scrollIntoView() calls in highlight.js and content.js were triggering "pageChanged" events
   - Solution: Removed all scrollIntoView() calls from both files, added detailed comments explaining why
   
10. Function collision in accordion.js and highlight.js:
    - Problem: Both accordion.js and highlight.js defined their own versions of highlightElement()
    - Implications: When calling highlightElement from accordion.js, it used the wrong implementation
    - Solution: Updated highlight.js to expose its functions globally for accordion.js to use
    
11. Chrome APIs in wrong contexts:
    - Problem: chrome.tabs.query() was being used in DevTools panel context, where it's not available
    - Solution: Added explicit checks for DevTools context and used the proper APIs (chrome.devtools.inspectedWindow.eval) when in DevTools panel

### Completed Touchpoints
1. Maps touchpoint:
   - Implemented detection for Google Maps, Mapbox, Leaflet, and other map providers
   - Added checks for iframe maps with missing accessible names
   - Added checks for div-based maps missing proper ARIA attributes
   - Added detection for aria-hidden maps hidden from screen readers
   - Created detailed remediation steps with proper WCAG references
   - Integrated into touchpoint-loader.js for extension usage

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