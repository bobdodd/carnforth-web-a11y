# Accessibility Scoring Methodology

## Overview

The Carnforth Web A11y extension displays three distinct metrics to provide a nuanced view of accessibility:

1. **Critical Barriers** - Count of show-stopping issues that prevent access
2. **Breadth Score** - Percentage of relevant guidelines with violations  
3. **A11y Index** - Combined metric showing overall direction of accessibility

**Important**: Conformance to WCAG is binary - you either conform or you don't. These metrics are directional indicators to help prioritize remediation efforts, not a measure of compliance.

## The Three Metrics

### 1. Critical Barriers (Show-Stopper Count)

A direct count of issues that completely prevent access for users. The only acceptable number is **zero**.

Critical barriers include:
- Missing accessible names on interactive elements
- Keyboard traps that prevent navigation
- Missing form labels
- Interactive content hidden with `aria-hidden="true"`
- Images conveying critical information without text alternatives  
- Focus order that prevents task completion
- Controls with touch targets too small to activate

### 2. Breadth Score

Measures how widely accessibility issues are distributed across different guidelines:

```
Breadth Score = (Touchpoints with failures / Touchpoints with testable elements found) × 100
```

**Key points:**
- Only includes touchpoints that found elements to test
- Excludes touchpoints that found no relevant elements (e.g., video tests on pages without video)
- Shows what percentage of relevant accessibility areas have issues
- Higher percentage means issues affect more diverse user needs

### 3. A11y Index

A weighted combination providing an overall directional indicator:

```
A11y Index = 100 - ((Breadth × 0.5) + (Friction × 0.3) + (Principle Weights × 0.2))

Where:
- Breadth = Breadth Score (as calculated above)
- Friction = (Total issues / Total elements tested) × 100
- Principle Weights = Issues weighted by WCAG principle
```

#### WCAG Principle Weighting

Issues are weighted by which WCAG principle they violate:
- **Perceivable**: 1.0 (fundamental to accessing content)
- **Operable**: 1.0 (fundamental to using interface)
- **Understandable**: 0.8 (important but sometimes workable)
- **Robust**: 0.7 (technical compliance)

## Display Format

The three metrics are displayed prominently:

```
Critical Barriers: 3 ❌ (Must be zero)
Breadth: 45% (Issues across 45% of relevant guidelines)
A11y Index: 72 (Higher is better - directional only)
```

## Important Considerations

1. **No Partial Conformance**: These numbers do NOT represent percentage conformance. A site with any critical barriers is non-conformant, period.

2. **Direction, Not Destination**: Use these metrics to track improvement over time, not as a final score.

3. **Context Matters**: A low A11y Index might mean many minor issues or few severe ones. Always review the detailed results.

4. **Relevant Guidelines Only**: The scoring system automatically excludes guidelines that don't apply to the current page, ensuring fair assessment.

## Example Calculation

Given a page with:
- 3 critical barriers (automatic fail for conformance)
- 15 touchpoints found testable elements
- 7 touchpoints have failures (Breadth = 46.7%)
- 150 total elements tested
- 25 total issues found (Friction = 16.7%)
- Issues distributed across principles with weighted score of 12.5

Results:
```
Critical Barriers: 3 ❌
Breadth: 47%
A11y Index: 100 - ((46.7 × 0.5) + (16.7 × 0.3) + (12.5 × 0.2)) = 69
```

## Using the Metrics

- **Fix Critical Barriers First**: These must be zero before considering the site accessible
- **Use Breadth to Prioritize**: High breadth means many different user groups are affected
- **Track A11y Index Over Time**: Shows if accessibility is improving with each iteration
- **Review Detailed Results**: The metrics guide priority but don't replace thorough review