# Carnforth Web A11y Chrome Extension

## Overview

Carnforth Web A11y is an automated web accessibility testing Chrome extension designed to help developers and accessibility professionals identify and fix accessibility issues in web applications. The extension integrates directly into Chrome DevTools and provides comprehensive testing across 23 distinct accessibility touchpoints.

## Project Context

This extension is part of the larger Carnforth accessibility testing ecosystem, which includes both command-line tools and browser-based testing capabilities. 

### The Carnforth Name

The project is named after Carnforth railway station in Lancashire, England, which was the setting for the 1945 film "Brief Encounter." The name was chosen for its layered meaning:

1. **Historical Context**: Brief Encounter was a post-war film reminding people that wartime behaviors were no longer acceptable in peacetime - similar to how web development practices must evolve to be accessible
2. **Wordplay**: "Propaganda" becomes "prop-a-gander" (assistive technology for a male goose)
3. **Philosophical**: Accessibility is fundamentally about "brief encounters" between people with disabilities and user interfaces

This naming reflects both the technical mission and the human-centered philosophy of the project.

## Architectural Design

### Extension Architecture

The extension follows Chrome's Manifest V3 specification and consists of several key components:

1. **DevTools Integration** - The extension creates a new panel within Chrome DevTools
2. **Service Worker** - Background script managing communication between components
3. **Content Scripts** - Injected scripts that analyze page content
4. **Panel UI** - Accessible interface built following WAI-ARIA best practices

### Component Communication Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  DevTools Panel │────▶│ Service Worker   │────▶│ Content Script  │
│   (panel.js)    │◀────│ (background.js)  │◀────│ (content.js)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ Touchpoint Tests│
                                                  │(touchpoint-     │
                                                  │    loader.js)   │
                                                  └─────────────────┘
```

### Key Design Decisions

#### 1. Module Architecture
- **Challenge**: Chrome extensions have limitations with ES modules in content scripts
- **Solution**: Implemented a non-module approach using script injection
- **Implementation**: Created `touchpoint-loader.js` to inject test functions into the global window scope

#### 2. Touchpoint Framework
- **Design**: Each accessibility aspect is tested through a "touchpoint" - a focused test module
- **Structure**: 23 touchpoints covering different accessibility concerns
- **Benefits**: Modular, maintainable, and allows incremental implementation

#### 3. Accessibility-First UI
- **Principle**: The testing tool itself must be fully accessible
- **Implementation**: 
  - WCAG AAA compliant color contrast (7:1 ratios)
  - Proper ARIA patterns for accordion and disclosure widgets
  - Keyboard navigation support
  - Screen reader announcements via live regions
  - Relative units (rem) for text sizing

#### 4. Result Presentation
- **Design**: Hierarchical presentation using accordion pattern
- **Organization**: 
  - Touchpoints sorted alphabetically
  - Issues within touchpoints sorted by severity (fail > warning > info)
  - Detailed information available through disclosure widgets

## Implementation Details

### Touchpoint System

Each touchpoint follows a standardized structure:

```javascript
window.test_[touchpoint_name] = async function() {
  return {
    description: "Description of what this touchpoint tests",
    issues: [
      {
        type: "fail|warning|info",
        title: "Issue title",
        description: "Detailed explanation",
        selector: "CSS selector to element",
        xpath: "XPath to element",
        html: "HTML snippet of problematic element",
        impact: {
          who: "Affected user groups",
          severity: "High|Medium|Low",
          why: "Why this matters"
        },
        wcag: {
          principle: "Perceivable|Operable|Understandable|Robust",
          guideline: "e.g., 1.1 Text Alternatives",
          successCriterion: "e.g., 1.1.1 Non-text Content",
          level: "A|AA|AAA"
        },
        remediation: [
          "Step 1 to fix",
          "Step 2 to fix"
        ],
        codeExample: {
          before: "Problematic code",
          after: "Fixed code"
        }
      }
    ]
  };
};
```

### Implemented Touchpoints

Currently, the following touchpoint has been fully implemented:

#### Maps (maps.js)
- **Purpose**: Tests digital maps for accessibility
- **Coverage**:
  - Iframe-based maps (Google Maps, Bing Maps, etc.)
  - Div-based JavaScript maps (Mapbox, Leaflet, etc.)
  - Static map images
  - SVG-based maps
- **Tests**:
  - Missing accessible names (title, aria-label, aria-labelledby)
  - Maps hidden with aria-hidden="true"
  - Interactive maps without proper ARIA attributes
  - Generic or missing alt text on static maps
- **Advanced Features**:
  - Provider detection (identifies Google Maps, Mapbox, Leaflet, etc.)
  - Interactivity detection (determines if map is interactive)
  - Comprehensive HTML snippet capture for debugging

### Technical Challenges and Solutions

#### 1. Script Context Isolation
- **Problem**: Chrome extensions have separate JavaScript contexts
- **Solution**: Script injection into page context using `document.documentElement.appendChild`
- **Implementation**: Custom event system for cross-context communication

#### 2. Element Highlighting
- **Problem**: `scrollIntoView()` was causing panel resets
- **Root Cause**: Scroll events triggered page change detection
- **Solution**: Removed auto-scrolling, added visual highlighting only

#### 3. Timing Issues
- **Problem**: Race conditions between script injection and test execution
- **Solution**: Implemented `ensureTouchpointFunctionsLoaded` with retry logic and timeouts

#### 4. Local File Testing
- **Challenge**: Chrome restrictions on file:// URLs
- **Solution**: Added file protocol permissions in manifest.json

## Testing Infrastructure

### Test Fixtures
- Location: `/fixtures/`
- Purpose: Controlled environments for testing touchpoint detection
- Examples:
  - `maps_test.html` - Various map implementations
  - `accessible_name_test.html` - Interactive elements with name issues

### Python Reference Implementation
- Location: `/python_touchpoints/`
- Purpose: Original command-line implementation for reference
- Usage: Provides test logic and WCAG mapping for Chrome extension

## Comparison with Similar Tools

### vs. Axe DevTools
- **Similarities**: Chrome DevTools integration, automated testing
- **Differences**: 
  - Carnforth uses touchpoint-based organization
  - More detailed remediation guidance
  - Focus on specific issue categories rather than broad scanning

### vs. TPGI ARC Toolkit
- **Similarities**: Professional-level testing, WCAG compliance checking
- **Differences**:
  - Carnforth is open source (GPL)
  - Simpler UI focused on developer workflow
  - Touchpoint approach vs. rule-based testing

## Export Capabilities

### Currently Implemented
1. **JSON Export**: Complete data with full issue details
2. **CSV Export**: Tabular format for spreadsheet analysis
3. **HTML Export**: Self-contained report with:
   - Table of contents
   - Skip navigation links
   - Print-friendly styling
   - Syntax highlighting for code examples

### Planned
- **DOCX Export**: Accessible Word documents with proper structure

## Development Workflow

### Adding a New Touchpoint
1. Copy `touchpoint-template.js` to new file
2. Replace placeholder values
3. Implement test logic following existing patterns
4. Add to `touchpoint-loader.js` array
5. Create test fixture in `/fixtures/`
6. Test with fixture before live sites

### Code Style Guidelines
- No inline comments unless critical
- Use descriptive function and variable names
- Follow existing formatting patterns
- Ensure all strings are properly escaped
- Test with screen readers

## Current Status

### Completed
- ✅ Extension framework and DevTools integration
- ✅ Accessible UI implementation
- ✅ Touchpoint module system
- ✅ Maps touchpoint with comprehensive testing
- ✅ Export functionality (JSON, CSV, HTML)
- ✅ Element highlighting system
- ✅ Test fixture infrastructure

### In Progress
- 🔄 Accessible names touchpoint
- 🔄 Headings touchpoint
- 🔄 Images touchpoint

### Planned
- ⏳ Remaining 19 touchpoints
- ⏳ DOCX export
- ⏳ Automated testing framework
- ⏳ Configuration options
- ⏳ Result persistence

## Known Issues

1. **DevTools Context Limitations**: Some Chrome APIs not available in DevTools panel
2. **ShadowDOM Support**: Limited detection within shadow roots
3. **Dynamic Content**: May miss dynamically added content after test run
4. **Performance**: Large pages may cause slowdown during analysis

## Future Enhancements

1. **Machine Learning Integration**: Intelligent issue detection
2. **Fix Suggestions**: Automated code remediation proposals
3. **CI/CD Integration**: Command-line interface for automated testing
4. **Multi-language Support**: Internationalization of UI and reports
5. **Custom Rulesets**: User-defined accessibility checks
6. **Historical Tracking**: Compare results over time

## Technical Debt

1. **Error Handling**: Needs more robust error recovery
2. **Performance Optimization**: Test execution could be parallelized
3. **Test Coverage**: Limited automated tests for the extension itself
4. **Documentation**: API documentation for touchpoint developers
5. **Code Duplication**: Some patterns repeated across touchpoints

## Security Considerations

1. **Permissions**: Extension requires broad permissions for testing
2. **Data Privacy**: No data sent to external servers
3. **Content Security**: Careful handling of injected scripts
4. **User Input**: Proper sanitization of HTML in reports

## Contribution Guidelines

1. **Code Style**: Follow existing patterns
2. **Testing**: Include fixtures for new features
3. **Accessibility**: Ensure UI changes maintain AAA compliance
4. **Documentation**: Update relevant docs
5. **Commits**: Clear, descriptive commit messages

## License

The project is released under GPL (GNU General Public License), making it freely available for use and modification while ensuring derivative works remain open source.

## Conclusion

Carnforth Web A11y represents a thoughtful approach to web accessibility testing, combining automated detection with educational guidance. Its touchpoint-based architecture allows for focused testing of specific accessibility concerns while maintaining flexibility for future expansion. The emphasis on the tool's own accessibility ensures it can be used by the widest possible audience, including developers with disabilities.