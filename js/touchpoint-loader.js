/**
 * Touchpoint Loader Script
 * This script injects all touchpoint test functions into the page
 * to be called by the content script.
 */

// Create a script element to inject the test functions
const script = document.createElement('script');
script.textContent = `
// Touchpoint test functions
${createAccessibleNameTest()}
${createAnimationTest()}
${createColorContrastTest()}
${createColorUseTest()}
${createDialogsTest()}
${createElectronicDocumentsTest()}
${createEventHandlingTest()}
${createFloatingContentTest()}
${createFocusManagementTest()}
${createFontsTest()}
${createFormsTest()}
${createHeadingsTest()}
${createImagesTest()}
${createLandmarksTest()}
${createLanguageTest()}
${createListsTest()}
${createMapsTest()}
${createReadMoreTest()}
${createTabindexTest()}
${createTitleAttributeTest()}
${createTablesTest()}
${createTimersTest()}
${createVideosTest()}
`;

// Add the script to the page
document.head.appendChild(script);

/**
 * Create the accessible_name test function
 */
function createAccessibleNameTest() {
  return `
async function test_accessible_name() {
  return {
    description: 'Checks that all interactive elements have accessible names that clearly identify their purpose. Proper labeling ensures that assistive technology users can understand the function of each element. Affects screen reader users particularly and impacts usability for voice recognition software users.',
    issues: [
      {
        type: 'info',
        title: 'Accessible Name test detected',
        description: 'This is a placeholder issue. The accessible_name tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the animation test function
 */
function createAnimationTest() {
  return `
async function test_animation() {
  return {
    description: 'Evaluates whether animated content can be paused, stopped, or hidden by users. Controls for animation are essential for people with vestibular disorders, attention disorders, and those who prefer reduced motion. Impacts users with cognitive disabilities, seizure disorders, and vestibular disorders.',
    issues: [
      {
        type: 'info',
        title: 'Animation test detected',
        description: 'This is a placeholder issue. The animation tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the color_contrast test function
 */
function createColorContrastTest() {
  return `
async function test_color_contrast() {
  return {
    description: 'Evaluates whether text and interface components have sufficient contrast against their background. Adequate contrast is essential for users with low vision, color blindness, or those using screens in bright sunlight. Impacts a wide range of users including older adults experiencing vision changes.',
    issues: [
      {
        type: 'info',
        title: 'Color Contrast test detected',
        description: 'This is a placeholder issue. The color_contrast tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the color_use test function
 */
function createColorUseTest() {
  return `
async function test_color_use() {
  return {
    description: 'Checks that color is not the only visual means of conveying information or indicating an action. Non-color indicators ensure that users with color vision deficiencies can perceive important information. Impacts approximately 8% of men and 0.5% of women with color vision deficiencies.',
    issues: [
      {
        type: 'info',
        title: 'Color Use test detected',
        description: 'This is a placeholder issue. The color_use tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the dialogs test function
 */
function createDialogsTest() {
  return `
async function test_dialogs() {
  return {
    description: 'Checks that dialogs are properly implemented with correct ARIA roles and focus management. Properly implemented dialogs ensure that keyboard and screen reader users can interact with modal content. Impacts keyboard-only and screen reader users.',
    issues: [
      {
        type: 'info',
        title: 'Dialogs test detected',
        description: 'This is a placeholder issue. The dialogs tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the electronic_documents test function
 */
function createElectronicDocumentsTest() {
  return `
async function test_electronic_documents() {
  return {
    description: 'Evaluates links to electronic documents to ensure they indicate file type and size. This information helps users decide whether to download a file, especially for those with limited bandwidth or who require assistive technology compatibility. Impacts screen reader users, users with cognitive disabilities, and those with slow internet connections.',
    issues: [
      {
        type: 'info',
        title: 'Electronic Documents test detected',
        description: 'This is a placeholder issue. The electronic_documents tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the event_handling test function
 */
function createEventHandlingTest() {
  return `
async function test_event_handling() {
  return {
    description: 'Verifies that interactive elements can be operated by keyboard as well as mouse. Proper event handling ensures that all user interface components are operable by keyboard-only users. Impacts users with motor disabilities, those using keyboard-only navigation, and screen reader users.',
    issues: [
      {
        type: 'info',
        title: 'Event Handling test detected',
        description: 'This is a placeholder issue. The event_handling tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the floating_content test function
 */
function createFloatingContentTest() {
  return `
async function test_floating_content() {
  return {
    description: 'Evaluates tooltips, popovers, and other floating content for keyboard accessibility and proper ARIA implementation. Proper floating content implementation ensures that all users can access this information. Impacts keyboard-only users, screen reader users, and those with low vision.',
    issues: [
      {
        type: 'info',
        title: 'Floating Content test detected',
        description: 'This is a placeholder issue. The floating_content tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the focus_management test function
 */
function createFocusManagementTest() {
  return `
async function test_focus_management() {
  return {
    description: 'Checks for logical focus order and visible focus indicators. Proper focus management ensures that keyboard users can predict where focus will go next and can visually identify the current focus position. Impacts keyboard-only users, screen reader users, and users with cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Focus Management test detected',
        description: 'This is a placeholder issue. The focus_management tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the fonts test function
 */
function createFontsTest() {
  return `
async function test_fonts() {
  return {
    description: 'Evaluates font usage for proper sizing, line spacing, and readability. Appropriate font usage ensures that text is readable by all users, especially those with low vision or reading disabilities. Impacts users with low vision, dyslexia, and cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Fonts test detected',
        description: 'This is a placeholder issue. The fonts tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the forms test function
 */
function createFormsTest() {
  return `
async function test_forms() {
  return {
    description: 'Checks that forms have properly associated labels and error identification. Proper form implementation ensures that users can understand what information is requested and receive appropriate feedback on errors. Impacts screen reader users, users with cognitive disabilities, and those with low vision.',
    issues: [
      {
        type: 'info',
        title: 'Forms test detected',
        description: 'This is a placeholder issue. The forms tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the headings test function
 */
function createHeadingsTest() {
  return `
async function test_headings() {
  return {
    description: 'Checks for proper heading structure and hierarchy. Well-structured headings create a logical outline of the page content, helping all users navigate and understand the page organization. Particularly important for screen reader users who rely on headings for efficient navigation.',
    issues: [
      {
        type: 'info',
        title: 'Headings test detected',
        description: 'This is a placeholder issue. The headings tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the images test function
 */
function createImagesTest() {
  return `
async function test_images() {
  return {
    description: 'Checks that images have appropriate alternative text. Proper alt text ensures that users who cannot see images can understand their content or purpose. Affects screen reader users, users with low bandwidth, and those who turn off images.',
    issues: [
      {
        type: 'info',
        title: 'Images test detected',
        description: 'This is a placeholder issue. The images tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the landmarks test function
 */
function createLandmarksTest() {
  return `
async function test_landmarks() {
  return {
    description: 'Checks for proper use of HTML5 and ARIA landmark regions. Proper landmark structure helps screen reader users navigate and understand the page layout. Primarily impacts screen reader users who navigate by landmarks.',
    issues: [
      {
        type: 'info',
        title: 'Landmarks test detected',
        description: 'This is a placeholder issue. The landmarks tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the language test function
 */
function createLanguageTest() {
  return `
async function test_language() {
  return {
    description: 'Checks that the page has a language declaration and that language changes are properly marked. Proper language markup ensures that assistive technologies can present content in the correct language. Impacts screen reader users and users of translation tools.',
    issues: [
      {
        type: 'info',
        title: 'Language test detected',
        description: 'This is a placeholder issue. The language tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the lists test function
 */
function createListsTest() {
  return `
async function test_lists() {
  return {
    description: 'Checks that content presented visually as lists uses proper semantic list elements. Proper list markup helps screen reader users understand content relationships and navigate efficiently. Impacts screen reader users and those with cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Lists test detected',
        description: 'This is a placeholder issue. The lists tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the maps test function
 */
function createMapsTest() {
  return `
async function test_maps() {
  return {
    description: 'Evaluates whether map content has text alternatives. Proper text alternatives for maps ensure that users who cannot see or interact with maps can access the essential information they provide. Impacts blind users and those with motor disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Maps test detected',
        description: 'This is a placeholder issue. The maps tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the read_more test function
 */
function createReadMoreTest() {
  return `
async function test_read_more() {
  return {
    description: 'Checks that "read more" or similar links provide context about their destination. Descriptive link text ensures that users understand where a link will take them, especially when links are encountered out of context. Impacts screen reader users and users with cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Read More test detected',
        description: 'This is a placeholder issue. The read_more tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the tabindex test function
 */
function createTabindexTest() {
  return `
async function test_tabindex() {
  return {
    description: 'Checks for proper usage of tabindex attributes. Proper tabindex usage ensures a logical keyboard navigation order and prevents focus traps. Impacts keyboard-only users and screen reader users.',
    issues: [
      {
        type: 'info',
        title: 'Tabindex test detected',
        description: 'This is a placeholder issue. The tabindex tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the title_attribute test function
 */
function createTitleAttributeTest() {
  return `
async function test_title_attribute() {
  return {
    description: 'Checks that title attributes are not used as the sole means of providing important information. Important information should be directly visible or available through standard controls, as title attributes are not consistently accessible. Impacts screen reader users, keyboard-only users, and mobile users.',
    issues: [
      {
        type: 'info',
        title: 'Title Attribute test detected',
        description: 'This is a placeholder issue. The title_attribute tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the tables test function
 */
function createTablesTest() {
  return `
async function test_tables() {
  return {
    description: 'Checks that data tables have proper headers, captions, and structure. Properly structured tables ensure that users can understand the relationships between data cells and headers. Impacts screen reader users and users with cognitive disabilities.',
    issues: [
      {
        type: 'info',
        title: 'Tables test detected',
        description: 'This is a placeholder issue. The tables tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the timers test function
 */
function createTimersTest() {
  return `
async function test_timers() {
  return {
    description: 'Evaluates whether content with time limits can be paused, stopped, or extended. Control over timed content ensures that users who need more time can still access and interact with content. Impacts users with cognitive disabilities, motor disabilities, and those using screen readers.',
    issues: [
      {
        type: 'info',
        title: 'Timers test detected',
        description: 'This is a placeholder issue. The timers tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}

/**
 * Create the videos test function
 */
function createVideosTest() {
  return `
async function test_videos() {
  return {
    description: 'Checks that video content has proper captions, audio descriptions, and transcripts. Accessible video ensures that users who cannot see or hear the video can still access its content. Impacts deaf or hard of hearing users, blind or low vision users, and users in noisy environments.',
    issues: [
      {
        type: 'info',
        title: 'Videos test detected',
        description: 'This is a placeholder issue. The videos tests have not been fully implemented yet.'
      }
    ]
  };
}`;
}