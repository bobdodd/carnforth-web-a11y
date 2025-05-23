/**
 * Main entry point for touchpoint testing
 * This file exports all touchpoint modules and provides utility functions
 */

// Import all touchpoint modules
import accessibleName from './accessible_name.js';
import animation from './animation.js';
import audio from './audio.js';
import colorContrast from './color_contrast.js';
import colorUse from './color_use.js';
import dialogs from './dialogs.js';
import electronicDocuments from './electronic_documents.js';
import eventHandling from './event_handling.js';
import floatingContent from './floating_content.js';
import focusManagement from './focus_management.js';
import fonts from './fonts.js';
import forms from './forms.js';
import headings from './headings.js';
import images from './images.js';
import landmarks from './landmarks.js';
import language from './language.js';
import lists from './lists.js';
import maps from './maps.js';
import readMore from './read_more.js';
import tabindex from './tabindex.js';
import titleAttribute from './title_attribute.js';
import tables from './tables.js';
import timers from './timers.js';
import touchAndGestures from './touch_and_gestures.js';
import videos from './videos.js';

// Map of touchpoint names to touchpoint modules
const touchpoints = {
  accessible_name: accessibleName,
  animation: animation,
  audio: audio,
  color_contrast: colorContrast,
  color_use: colorUse,
  dialogs: dialogs,
  electronic_documents: electronicDocuments,
  event_handling: eventHandling,
  floating_content: floatingContent, 
  focus_management: focusManagement,
  fonts: fonts,
  forms: forms,
  headings: headings,
  images: images,
  landmarks: landmarks,
  language: language,
  lists: lists,
  maps: maps,
  read_more: readMore,
  tabindex: tabindex,
  title_attribute: titleAttribute,
  tables: tables,
  timers: timers,
  touch_and_gestures: touchAndGestures,
  videos: videos
};

/**
 * Run all touchpoint tests
 * @returns {Promise<Object>} - Results from all touchpoint tests
 */
export async function runAllTouchpointTests() {
  const results = {};
  
  // Run each touchpoint test
  for (const [name, touchpoint] of Object.entries(touchpoints)) {
    results[name] = await touchpoint.test();
  }
  
  return results;
}

/**
 * Run a specific touchpoint test
 * @param {string} touchpointName - The name of the touchpoint to test
 * @returns {Promise<Object>} - Results from the touchpoint test
 */
export async function runTouchpointTest(touchpointName) {
  if (!touchpoints[touchpointName]) {
    throw new Error(`Touchpoint ${touchpointName} not found`);
  }
  
  const result = {};
  result[touchpointName] = await touchpoints[touchpointName].test();
  
  return result;
}

// Export individual touchpoint modules for direct use
export {
  accessibleName,
  animation,
  audio,
  colorContrast,
  colorUse,
  dialogs,
  electronicDocuments,
  eventHandling,
  floatingContent,
  focusManagement,
  fonts,
  forms,
  headings,
  images,
  landmarks,
  language,
  lists,
  maps,
  readMore,
  tabindex,
  titleAttribute,
  tables,
  timers,
  touchAndGestures,
  videos
};

// Export the touchpoints map
export default touchpoints;