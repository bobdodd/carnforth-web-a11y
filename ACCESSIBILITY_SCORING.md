# Accessibility Scoring Methodology

## Overview

The Carnforth Web A11y extension calculates two accessibility scores for each tested page:
1. **Raw Page Score** - A simple ratio of success criteria passed vs failed
2. **Weighted Score** - A score that considers impact severity and violation frequency

## Scoring Calculation

### Step 1: Determine Applicable Success Criteria (A)

1. Start with the full list of WCAG success criteria for the selected version and level
2. Eliminate any success criteria we do not currently test for
3. Eliminate any success criteria that we tested for but found no elements to test (not relevant to this page)
4. The remaining count = **A** (Applicable Success Criteria)

### Step 2: Count Failed Success Criteria (B)

Count the number of unique WCAG success criteria that had violations during testing.
- Each success criterion is only counted once, regardless of how many violations it had
- This count = **B** (Failed Success Criteria)

### Step 3: Calculate Raw Page Score

```
Raw Page Score = (A - B) / A × 100%
```

This gives the percentage of applicable success criteria that passed.

### Step 4: Calculate Weighted Violations (C)

For each unique success criterion with violations, calculate a weighted score:

```
Base Weight = Impact Weight + Level Weight + Frequency Weight

Where:
- Impact Weight:
  - Low impact = 1
  - Medium impact = 2  
  - High impact = 3

- Level Weight:
  - Level A = +1
  - Level AA = 0
  - Level AAA = 0

- Frequency Weight:
  - Single occurrence = 0
  - Multiple occurrences = +1
```

Sum all weighted scores = **C** (Total Weighted Violations)

### Step 5: Calculate Weighted Score

```
Weighted Score = (A - C) / A × 100%
```

If the weighted score would be negative, it is capped at 0%.

## Example Calculation

Given:
- 20 applicable success criteria for the page (A = 20)
- 5 success criteria had violations (B = 5)
- Violations breakdown:
  - SC 1.1.1 (Level A): 3 high impact violations → Weight = 3 + 1 + 1 = 5
  - SC 1.4.3 (Level AA): 1 medium impact violation → Weight = 2 + 0 + 0 = 2
  - SC 2.4.4 (Level A): 2 low impact violations → Weight = 1 + 1 + 1 = 3
  - SC 3.3.2 (Level A): 1 high impact violation → Weight = 3 + 1 + 0 = 4
  - SC 4.1.2 (Level A): 5 medium impact violations → Weight = 2 + 1 + 1 = 4
- Total weighted violations (C) = 5 + 2 + 3 + 4 + 4 = 18

Results:
- Raw Page Score = (20 - 5) / 20 × 100% = 75%
- Weighted Score = (20 - 18) / 20 × 100% = 10%

## Score Interpretation

### Raw Page Score
- **90-100%**: Excellent - Very few accessibility issues
- **70-89%**: Good - Some issues to address
- **50-69%**: Fair - Significant improvements needed
- **Below 50%**: Poor - Major accessibility barriers

### Weighted Score
The weighted score provides context about severity:
- A low weighted score indicates serious issues (high impact, Level A, or frequent violations)
- The gap between raw and weighted scores shows the severity concentration
- Large gap = Few but serious issues
- Small gap = Many minor issues

## Implementation Notes

1. **Success Criteria Mapping**: Each touchpoint must declare which WCAG success criteria it tests
2. **No Elements Found**: Track when a test runs but finds no applicable elements
3. **Impact Level**: Use the highest impact level when a success criterion has multiple violations
4. **Frequency**: Count unique elements, not total violation instances