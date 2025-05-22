# Maps Touchpoint Issue Deduplication

The Maps touchpoint has been enhanced with issue deduplication logic to prevent multiple accessibility issues being reported for the same map element. This document explains the changes and their impact.

## Problem Description

In the original implementation, a single map element could potentially trigger multiple accessibility violations, leading to duplicate entries in the issues list. For example, a Google Maps iframe with both `aria-hidden="true"` and no title attribute would generate both of these issues:

1. `Google Maps interactive map incorrectly hidden with aria-hidden='true'`
2. `Google Maps map missing accessible name`

This was causing confusion for users who saw what appeared to be duplicate issues for the same map element.

## Solution Implemented

The solution uses a simple tracking mechanism to ensure each map element only appears once in the issues list, with the most serious issue taking precedence:

1. Added an `elementTracker` Map to keep track of elements that have already had issues reported
2. Re-ordered issue processing to prioritize more serious issues first:
   - Interactive maps with aria-hidden (highest priority - FAIL)
   - Missing accessible names (high priority - FAIL)
   - Non-interactive maps with aria-hidden (medium priority - WARNING)
   - Generic/non-descriptive alt text (medium priority - WARNING)

3. When processing each issue type, we check if the element has already been reported:
   ```javascript
   const elementKey = mapXpath || violation.selector;
   
   // Skip if we already have an issue for this element
   if (elementTracker.has(elementKey)) {
     return;
   }
   
   // Mark this element as tracked
   elementTracker.set(elementKey, true);
   ```

4. Special case handling: For maps with aria-hidden="true" that are interactive, we still generate a secondary warning about text alternatives, as this is a separate concern from the focus trap issue.

## Testing

The deduplication logic has been tested with the following map fixtures:

1. **maps_test.html**: Standard test fixture with iframe maps
2. **maps_extended_test.html**: Test fixture focused on aria-hidden scenarios
3. **maps_svg_test.html**: Test fixture for SVG maps
4. **maps_div_enhanced_test.html**: Test fixture for div-based maps

The most important test case is in maps_extended_test.html, where a Google Maps iframe with both aria-hidden="true" and no title attribute now correctly shows only the more serious issue (the interactive map with aria-hidden) rather than both issues.

## Benefits

1. **Improved UX**: Users no longer see confusing duplicate issues for the same element
2. **Clearer prioritization**: The most serious issues are reported first
3. **More efficient remediation**: Developers can focus on fixing the most critical issues first
4. **Reduced issue count**: The total number of issues is reduced, making reports more manageable

## Future Enhancements

1. Consider adding an option to show all issues for an element (for advanced users)
2. Explore issue grouping by element rather than strict deduplication
3. Add priority scores to issues to better sort them in the UI