/**
 * Updates all touchpoint files to follow the standard format
 * 
 * This script is run from Node.js and updates all touchpoint files to:
 * 1. Return a consistent "Touchpoint <name> Installed" message
 * 2. Add event listeners for proper communication
 */

const fs = require('fs');
const path = require('path');

// Directory containing touchpoint files
const touchpointsDir = path.join(__dirname, 'touchpoints');

// Touchpoint descriptions
const descriptions = {
  accessible_name: 'Checks that all interactive elements have accessible names that clearly identify their purpose. Proper labeling ensures that assistive technology users can understand the function of each element.',
  animation: 'Evaluates whether animated content can be paused, stopped, or hidden by users. Controls for animation are essential for people with vestibular disorders, attention disorders, and those who prefer reduced motion.',
  color_contrast: 'Evaluates whether text and interface components have sufficient contrast against their background. Adequate contrast is essential for users with low vision, color blindness, or those using screens in bright sunlight.',
  color_use: 'Checks that color is not the only visual means of conveying information or indicating an action. Non-color indicators ensure that users with color vision deficiencies can perceive important information.',
  dialogs: 'Checks that dialogs are properly implemented with correct ARIA roles and focus management. Properly implemented dialogs ensure that keyboard and screen reader users can interact with modal content.',
  electronic_documents: 'Evaluates links to electronic documents to ensure they indicate file type and size. This information helps users decide whether to download a file, especially for those with limited bandwidth or who require assistive technology compatibility.',
  event_handling: 'Verifies that interactive elements can be operated by keyboard as well as mouse. Proper event handling ensures that all user interface components are operable by keyboard-only users.',
  floating_content: 'Evaluates tooltips, popovers, and other floating content for keyboard accessibility and proper ARIA implementation. Proper floating content implementation ensures that all users can access this information.',
  focus_management: 'Checks for logical focus order and visible focus indicators. Proper focus management ensures that keyboard users can predict where focus will go next and can visually identify the current focus position.',
  fonts: 'Evaluates font usage for proper sizing, line spacing, and readability. Appropriate font usage ensures that text is readable by all users, especially those with low vision or reading disabilities.',
  forms: 'Checks that forms have properly associated labels and error identification. Proper form implementation ensures that users can understand what information is requested and receive appropriate feedback on errors.',
  headings: 'Checks for proper heading structure and hierarchy. Well-structured headings create a logical outline of the page content, helping all users navigate and understand the page organization.',
  images: 'Checks that images have appropriate alternative text. Proper alt text ensures that users who cannot see images can understand their content or purpose.',
  landmarks: 'Checks for proper use of HTML5 and ARIA landmark regions. Proper landmark structure helps screen reader users navigate and understand the page layout.',
  language: 'Checks that the page has a language declaration and that language changes are properly marked. Proper language markup ensures that assistive technologies can present content in the correct language.',
  lists: 'Checks that content presented visually as lists uses proper semantic list elements. Proper list markup helps screen reader users understand content relationships and navigate efficiently.',
  maps: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
  read_more: 'Checks that "read more" or similar links provide context about their destination. Descriptive link text ensures that users understand where a link will take them, especially when links are encountered out of context.',
  tabindex: 'Checks for proper usage of tabindex attributes. Proper tabindex usage ensures a logical keyboard navigation order and prevents focus traps.',
  tables: 'Checks that data tables have proper headers, captions, and structure. Properly structured tables ensure that users can understand the relationships between data cells and headers.',
  timers: 'Evaluates whether content with time limits can be paused, stopped, or extended. Control over timed content ensures that users who need more time can still access and interact with content.',
  title_attribute: 'Checks that title attributes are not used as the sole means of providing important information. Important information should be directly visible or available through standard controls, as title attributes are not consistently accessible.',
  videos: 'Checks that video content has proper captions, audio descriptions, and transcripts. Accessible video ensures that users who cannot see or hear the video can still access its content.'
};

// Template for touchpoint files
function getTemplate(touchpoint, description) {
  const formattedTouchpoint = touchpoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return `/**
 * ${formattedTouchpoint} Test
 * Tests for accessibility issues related to ${touchpoint.replace(/_/g, ' ')}
 */
window.test_${touchpoint} = async function() {
  try {
    console.log("[${formattedTouchpoint}] Starting ${touchpoint} test...");
    
    // Return a simple info issue for testing
    return {
      description: '${description}',
      issues: [
        {
          type: 'info',
          title: 'Touchpoint <${touchpoint}> Installed',
          description: 'The ${touchpoint} touchpoint has been successfully installed.'
        }
      ]
    };
  } catch (error) {
    console.error(\`[${formattedTouchpoint}] Error in test:\`, error);
    
    // Return error as an issue
    return {
      description: '${description}',
      issues: [{
        type: 'error',
        title: \`Error running ${touchpoint} test\`,
        description: \`An error occurred while testing: \${error.message}\`
      }]
    };
  }
};

// Listen for messages from the content script
document.addEventListener('FROM_EXTENSION', function(event) {
  const message = event.detail;
  console.log('[${formattedTouchpoint}] Received message:', message);
  
  if (message.action === 'runTest') {
    // Run the test and send back the results
    window.test_${touchpoint}().then(result => {
      // Send the result back to the content script
      document.dispatchEvent(new CustomEvent('FROM_INJECTED_SCRIPT', { 
        detail: {
          action: 'testResult',
          touchpoint: '${touchpoint}',
          results: result
        }
      }));
    });
  }
});

console.log("[Touchpoint Loaded] test_${touchpoint}");`;
}

// Skip these files (they should be left unchanged)
const skipFiles = ['index.js', 'touchpoint-template.js'];

// Process all touchpoint files
fs.readdir(touchpointsDir, (err, files) => {
  if (err) {
    console.error('Error reading touchpoints directory:', err);
    return;
  }
  
  // Filter for JavaScript files and skip the ones we want to leave unchanged
  const touchpointFiles = files.filter(file => 
    file.endsWith('.js') && !skipFiles.includes(file)
  );
  
  let updatedCount = 0;
  let errorCount = 0;
  
  // Process each touchpoint file
  touchpointFiles.forEach(file => {
    const touchpoint = file.replace('.js', '');
    const filePath = path.join(touchpointsDir, file);
    
    // Skip if no description for this touchpoint
    if (!descriptions[touchpoint]) {
      console.warn(`No description found for touchpoint: ${touchpoint}, skipping`);
      return;
    }
    
    // Generate the new content
    const newContent = getTemplate(touchpoint, descriptions[touchpoint]);
    
    // Write the file
    fs.writeFile(filePath, newContent, err => {
      if (err) {
        console.error(`Error updating ${file}:`, err);
        errorCount++;
      } else {
        console.log(`Updated ${file}`);
        updatedCount++;
      }
      
      // If all files have been processed, show summary
      if (updatedCount + errorCount === touchpointFiles.length) {
        console.log(`\nTouchpoint update complete:`);
        console.log(`- Updated ${updatedCount} files`);
        console.log(`- Failed to update ${errorCount} files`);
        
        if (errorCount > 0) {
          console.log('Please check the errors above and fix manually if needed.');
        }
      }
    });
  });
});