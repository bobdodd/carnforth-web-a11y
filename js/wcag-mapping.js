/**
 * WCAG Success Criteria Mapping
 * Maps touchpoints to the WCAG success criteria they test
 */

// Define in global scope for use by other scripts
window.WCAGMapping = window.WCAGMapping || {};

// Full list of WCAG 2.2 Success Criteria
window.WCAGMapping.WCAG_SUCCESS_CRITERIA = {
  // Level A
  '1.1.1': { level: 'A', title: 'Non-text Content', version: '2.0' },
  '1.2.1': { level: 'A', title: 'Audio-only and Video-only (Prerecorded)', version: '2.0' },
  '1.2.2': { level: 'A', title: 'Captions (Prerecorded)', version: '2.0' },
  '1.2.3': { level: 'A', title: 'Audio Description or Media Alternative (Prerecorded)', version: '2.0' },
  '1.3.1': { level: 'A', title: 'Info and Relationships', version: '2.0' },
  '1.3.2': { level: 'A', title: 'Meaningful Sequence', version: '2.0' },
  '1.3.3': { level: 'A', title: 'Sensory Characteristics', version: '2.0' },
  '1.3.5': { level: 'AA', title: 'Identify Input Purpose', version: '2.1' },
  '1.4.1': { level: 'A', title: 'Use of Color', version: '2.0' },
  '1.4.2': { level: 'A', title: 'Audio Control', version: '2.0' },
  '2.1.1': { level: 'A', title: 'Keyboard', version: '2.0' },
  '2.1.2': { level: 'A', title: 'No Keyboard Trap', version: '2.0' },
  '2.1.4': { level: 'A', title: 'Character Key Shortcuts', version: '2.1' },
  '2.2.1': { level: 'A', title: 'Timing Adjustable', version: '2.0' },
  '2.2.2': { level: 'A', title: 'Pause, Stop, Hide', version: '2.0' },
  '2.3.1': { level: 'A', title: 'Three Flashes or Below Threshold', version: '2.0' },
  '2.4.1': { level: 'A', title: 'Bypass Blocks', version: '2.0' },
  '2.4.2': { level: 'A', title: 'Page Titled', version: '2.0' },
  '2.4.3': { level: 'A', title: 'Focus Order', version: '2.0' },
  '2.4.4': { level: 'A', title: 'Link Purpose (In Context)', version: '2.0' },
  '2.5.1': { level: 'A', title: 'Pointer Gestures', version: '2.1' },
  '2.5.2': { level: 'A', title: 'Pointer Cancellation', version: '2.1' },
  '2.5.3': { level: 'A', title: 'Label in Name', version: '2.1' },
  '2.5.4': { level: 'A', title: 'Motion Actuation', version: '2.1' },
  '3.1.1': { level: 'A', title: 'Language of Page', version: '2.0' },
  '3.2.1': { level: 'A', title: 'On Focus', version: '2.0' },
  '3.2.2': { level: 'A', title: 'On Input', version: '2.0' },
  '3.3.1': { level: 'A', title: 'Error Identification', version: '2.0' },
  '3.3.2': { level: 'A', title: 'Labels or Instructions', version: '2.0' },
  '4.1.1': { level: 'A', title: 'Parsing', version: '2.0' },
  '4.1.2': { level: 'A', title: 'Name, Role, Value', version: '2.0' },
  
  // Level AA
  '1.2.4': { level: 'AA', title: 'Captions (Live)', version: '2.0' },
  '1.2.5': { level: 'AA', title: 'Audio Description (Prerecorded)', version: '2.0' },
  '1.3.4': { level: 'AA', title: 'Orientation', version: '2.1' },
  '1.4.3': { level: 'AA', title: 'Contrast (Minimum)', version: '2.0' },
  '1.4.4': { level: 'AA', title: 'Resize Text', version: '2.0' },
  '1.4.5': { level: 'AA', title: 'Images of Text', version: '2.0' },
  '1.4.10': { level: 'AA', title: 'Reflow', version: '2.1' },
  '1.4.11': { level: 'AA', title: 'Non-text Contrast', version: '2.1' },
  '1.4.12': { level: 'AA', title: 'Text Spacing', version: '2.1' },
  '1.4.13': { level: 'AA', title: 'Content on Hover or Focus', version: '2.1' },
  '2.4.5': { level: 'AA', title: 'Multiple Ways', version: '2.0' },
  '2.4.6': { level: 'AA', title: 'Headings and Labels', version: '2.0' },
  '2.4.7': { level: 'AA', title: 'Focus Visible', version: '2.0' },
  '2.4.11': { level: 'AA', title: 'Focus Not Obscured (Minimum)', version: '2.2' },
  '2.5.7': { level: 'AA', title: 'Dragging Movements', version: '2.2' },
  '2.5.8': { level: 'AA', title: 'Target Size (Minimum)', version: '2.2' },
  '3.1.2': { level: 'AA', title: 'Language of Parts', version: '2.0' },
  '3.2.3': { level: 'AA', title: 'Consistent Navigation', version: '2.0' },
  '3.2.4': { level: 'AA', title: 'Consistent Identification', version: '2.0' },
  '3.3.3': { level: 'AA', title: 'Error Suggestion', version: '2.0' },
  '3.3.4': { level: 'AA', title: 'Error Prevention (Legal, Financial, Data)', version: '2.0' },
  '3.3.7': { level: 'A', title: 'Redundant Entry', version: '2.2' },
  '3.3.8': { level: 'AA', title: 'Accessible Authentication (Minimum)', version: '2.2' },
  '4.1.3': { level: 'AA', title: 'Status Messages', version: '2.1' },
  
  // Level AAA
  '1.2.6': { level: 'AAA', title: 'Sign Language (Prerecorded)', version: '2.0' },
  '1.2.7': { level: 'AAA', title: 'Extended Audio Description (Prerecorded)', version: '2.0' },
  '1.2.8': { level: 'AAA', title: 'Media Alternative (Prerecorded)', version: '2.0' },
  '1.2.9': { level: 'AAA', title: 'Audio-only (Live)', version: '2.0' },
  '1.3.6': { level: 'AAA', title: 'Identify Purpose', version: '2.1' },
  '1.4.6': { level: 'AAA', title: 'Contrast (Enhanced)', version: '2.0' },
  '1.4.7': { level: 'AAA', title: 'Low or No Background Audio', version: '2.0' },
  '1.4.8': { level: 'AAA', title: 'Visual Presentation', version: '2.0' },
  '1.4.9': { level: 'AAA', title: 'Images of Text (No Exception)', version: '2.0' },
  '2.1.3': { level: 'AAA', title: 'Keyboard (No Exception)', version: '2.0' },
  '2.2.3': { level: 'AAA', title: 'No Timing', version: '2.0' },
  '2.2.4': { level: 'AAA', title: 'Interruptions', version: '2.0' },
  '2.2.5': { level: 'AAA', title: 'Re-authenticating', version: '2.0' },
  '2.2.6': { level: 'AAA', title: 'Timeouts', version: '2.1' },
  '2.3.2': { level: 'AAA', title: 'Three Flashes', version: '2.0' },
  '2.3.3': { level: 'AAA', title: 'Animation from Interactions', version: '2.1' },
  '2.4.8': { level: 'AAA', title: 'Location', version: '2.0' },
  '2.4.9': { level: 'AAA', title: 'Link Purpose (Link Only)', version: '2.0' },
  '2.4.10': { level: 'AAA', title: 'Section Headings', version: '2.0' },
  '2.4.12': { level: 'AAA', title: 'Focus Not Obscured (Enhanced)', version: '2.2' },
  '2.5.5': { level: 'AAA', title: 'Target Size (Enhanced)', version: '2.1' },
  '2.5.6': { level: 'AAA', title: 'Concurrent Input Mechanisms', version: '2.1' },
  '3.1.3': { level: 'AAA', title: 'Unusual Words', version: '2.0' },
  '3.1.4': { level: 'AAA', title: 'Abbreviations', version: '2.0' },
  '3.1.5': { level: 'AAA', title: 'Reading Level', version: '2.0' },
  '3.1.6': { level: 'AAA', title: 'Pronunciation', version: '2.0' },
  '3.2.5': { level: 'AAA', title: 'Change on Request', version: '2.0' },
  '3.3.5': { level: 'AAA', title: 'Help', version: '2.0' },
  '3.3.6': { level: 'AAA', title: 'Error Prevention (All)', version: '2.0' },
  '3.3.9': { level: 'AAA', title: 'Accessible Authentication (Enhanced)', version: '2.2' }
};

// Mapping of touchpoints to WCAG success criteria they test
window.WCAGMapping.TOUCHPOINT_WCAG_MAPPING = {
  accessible_name: ['1.1.1', '2.4.4', '2.4.6', '3.3.2', '4.1.2'],
  animation: ['2.2.2', '2.3.1', '2.3.3'],
  audio: ['1.2.1', '1.2.2', '1.4.2'],
  color_contrast: ['1.4.3', '1.4.6', '1.4.11'],
  color_use: ['1.4.1'],
  dialogs: ['2.1.2', '4.1.2', '4.1.3'],
  electronic_documents: ['1.1.1', '1.3.1', '4.1.2'],
  event_handling: ['2.1.1', '2.1.4', '2.5.1', '2.5.2'],
  floating_content: ['1.4.13', '2.4.11', '2.4.12'],
  focus_management: ['2.1.2', '2.4.3', '2.4.7', '2.4.11', '2.4.12'],
  fonts: ['1.4.4', '1.4.12'],
  forms: ['1.3.1', '1.3.5', '3.2.2', '3.3.1', '3.3.2', '3.3.3', '3.3.4', '3.3.7', '4.1.2'],
  headings: ['1.3.1', '2.4.6', '2.4.10'],
  images: ['1.1.1', '1.4.5', '1.4.9'],
  landmarks: ['1.3.1', '2.4.1'],
  language: ['3.1.1', '3.1.2'],
  lists: ['1.3.1'],
  maps: ['1.1.1', '2.4.1', '4.1.2'],
  read_more: ['2.4.4', '2.4.9'],
  tabindex: ['2.1.1', '2.4.3'],
  tables: ['1.3.1', '1.3.2'],
  timers: ['2.2.1', '2.2.3', '2.2.6'],
  title_attribute: ['3.3.2', '4.1.2'],
  touch_and_gestures: ['2.5.1', '2.5.4', '2.5.5', '2.5.7', '2.5.8'],
  videos: ['1.2.1', '1.2.2', '1.2.3', '1.2.5']
};

/**
 * Get all success criteria tested by current touchpoints
 * @param {string} version - WCAG version ('2.0', '2.1', '2.2')
 * @param {Array<string>} levels - Array of levels to include (['A', 'AA', 'AAA'])
 * @returns {Set<string>} Set of success criteria IDs
 */
window.WCAGMapping.getTestedSuccessCriteria = function(version = '2.2', levels = ['A', 'AA']) {
  const testedCriteria = new Set();
  
  // Get all unique success criteria from all touchpoints
  for (const criteria of Object.values(window.WCAGMapping.TOUCHPOINT_WCAG_MAPPING)) {
    for (const sc of criteria) {
      const criterion = window.WCAGMapping.WCAG_SUCCESS_CRITERIA[sc];
      if (criterion && 
          levels.includes(criterion.level) &&
          window.WCAGMapping.isVersionCompatible(criterion.version, version)) {
        testedCriteria.add(sc);
      }
    }
  }
  
  return testedCriteria;
};

/**
 * Check if a success criterion version is compatible with the selected version
 * @param {string} scVersion - Version when the SC was introduced ('2.0', '2.1', '2.2')
 * @param {string} selectedVersion - Currently selected WCAG version
 * @returns {boolean}
 */
window.WCAGMapping.isVersionCompatible = function(scVersion, selectedVersion) {
  const versionNumbers = {
    '2.0': 0,
    '2.1': 1,
    '2.2': 2
  };
  
  return versionNumbers[scVersion] <= versionNumbers[selectedVersion];
};

/**
 * Get applicable success criteria for scoring
 * @param {string} version - WCAG version
 * @param {Array<string>} levels - Array of levels
 * @param {Set<string>} notApplicableCriteria - Criteria that had no elements to test
 * @returns {Set<string>} Set of applicable success criteria IDs
 */
window.WCAGMapping.getApplicableSuccessCriteria = function(version, levels, notApplicableCriteria = new Set()) {
  const tested = window.WCAGMapping.getTestedSuccessCriteria(version, levels);
  const applicable = new Set();
  
  for (const sc of tested) {
    if (!notApplicableCriteria.has(sc)) {
      applicable.add(sc);
    }
  }
  
  return applicable;
};