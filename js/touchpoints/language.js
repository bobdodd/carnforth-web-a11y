/**
 * Language Touchpoint
 * 
 * Tests for proper language declaration and changes
 */

/**
 * Touchpoint metadata and description
 */
const metadata = {
  name: 'Language',
  description: 'Checks that the page has a language declaration and that language changes within the content are properly marked. Language declarations allow screen readers to use the correct pronunciation rules.',
  wcagCriteria: [
    {
      principle: 'Perceivable',
      guideline: '3.1 Readable',
      successCriterion: '3.1.1 Language of Page',
      level: 'A'
    },
    {
      principle: 'Perceivable',
      guideline: '3.1 Readable',
      successCriterion: '3.1.2 Language of Parts',
      level: 'AA'
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
      description: 'This is a placeholder issue. The language tests have not been fully implemented yet.'
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