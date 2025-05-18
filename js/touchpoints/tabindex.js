/**
 * Tabindex Touchpoint
 * 
 * Tests for proper usage of tabindex attributes
 */

/**
 * Touchpoint metadata and description
 */
const metadata = {
  name: 'Tabindex',
  description: 'Checks for proper usage of tabindex attributes, particularly looking for tabindex values greater than 0 which can disrupt normal keyboard navigation. Affects keyboard users who rely on a predictable tab order.',
  wcagCriteria: [
    {
      principle: 'Operable',
      guideline: '2.1 Keyboard Accessible',
      successCriterion: '2.1.1 Keyboard',
      level: 'A'
    },
    {
      principle: 'Operable',
      guideline: '2.4 Navigable',
      successCriterion: '2.4.3 Focus Order',
      level: 'A'
    }
  ]
};

/**
 * Run the touchpoint test
 * @returns {Promise<Object>} - Test results
 */
async function test() {
  try {
    // Create result object with touchpoint information
    const result = {
      description: metadata.description,
      issues: []
    };
    
    // Example info issue to show the touchpoint is working
    result.issues.push({
      type: 'info',
      title: `${metadata.name} test detected`,
      description: 'This is a placeholder issue. The tabindex tests have not been fully implemented yet.'
    });
    
    return result;
  } catch (error) {
    console.error(`Error in ${metadata.name} touchpoint test:`, error);
    
    // Return error as an issue
    return {
      description: metadata.description,
      issues: [{
        type: 'info',
        title: `Error running ${metadata.name} test`,
        description: `An error occurred while testing: ${error.message}`
      }]
    };
  }
}

// Export the touchpoint module
export default {
  metadata,
  test
};