# Impact Scoring Guidelines for Carnforth Web A11y

## Overview

The `impact` field on issues represents the severity of impact on disabled users. It uses a three-level scale: **high**, **medium**, and **low**.

## Scoring Principles

1. **Consider all affected user groups** - An issue should be scored based on the most severe impact across all affected disability groups
2. **Focus on functional impact** - Score based on whether users can complete tasks, not just on technical violations
3. **Context matters** - The same technical issue may have different impacts depending on the element's purpose

## Impact Levels

### High Impact
Issues that **prevent** users from accessing content or completing tasks:
- Content completely hidden from assistive technology
- Interactive elements that cannot be activated
- Critical information that is inaccessible
- Focus traps that prevent navigation
- Target sizes too small to tap accurately (fails WCAG 2.5.8 minimum)

**Examples:**
- Maps with `aria-hidden="true"` that contain interactive controls
- Form controls without labels
- Images conveying critical information without alt text
- Keyboard traps

### Medium Impact
Issues that make tasks **difficult but not impossible**:
- Unclear or generic labels that require guessing
- Missing landmarks that slow navigation
- Suboptimal but functional alternatives exist
- Target sizes that meet minimum but not recommended size
- Content that requires extra effort to understand

**Examples:**
- Generic accessible names like "Map" without location context
- Missing heading structure
- Small but tappable buttons (24-43px)
- Poor color contrast on decorative elements

### Low Impact
Issues that cause **minor inconvenience**:
- Best practice violations with minimal user impact
- Redundant or verbose information
- Minor efficiency reductions
- Issues affecting comfort but not functionality

**Examples:**
- Overly verbose alt text on decorative images
- Minor semantic markup issues
- Redundant ARIA labels

## Implementation Example

```javascript
// Direct impact field on violations
results.violations.push({
  type: 'missing-accessible-name',
  element: 'iframe',
  impact: 'high'  // Blocks access to map content
});

// Impact object with detailed information
{
  type: 'fail',
  title: 'Interactive map hidden from screen readers',
  impact: {
    who: 'Screen reader users',
    level: 'high',
    why: 'Map controls are completely inaccessible, preventing users from interacting with location data'
  }
}
```

## Guidelines for Specific Issues

### Maps and Location Content
- Hidden maps: **high** (blocks access to location information)
- Generic map names: **medium** (reduces understanding)
- Missing alternative text descriptions: **high** if map is only source of info, **medium** if text alternative exists

### Interactive Controls
- No accessible name: **high** (cannot identify purpose)
- Generic name: **medium** (can use but difficult)
- Target size < 24px: **high** (may be impossible to tap)
- Target size 24-43px: **medium** (difficult but possible)

### Navigation and Structure
- Missing landmarks: **medium** (slows navigation)
- Improper heading hierarchy: **medium** (confuses structure)
- Skip links missing: **medium** (forces sequential navigation)

## Testing Impact

When evaluating impact, consider:
1. Can the user complete their task without this element?
2. Are there accessible alternatives?
3. How critical is this functionality?
4. Which user groups are affected?
5. What is the frequency of use?

Remember: The goal is to help developers prioritize fixes based on real user impact, not just technical compliance.