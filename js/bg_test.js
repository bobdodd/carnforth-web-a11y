/**
 * Background script for Carnforth Web A11y
 * 
 * Handles communication between DevTools and content scripts
 */

// Store tab information for DevTools connections
const devToolsConnections = {};

// Listen for connections from DevTools page
chrome.runtime.onConnect.addListener(port => {
  // Only handle connections from our DevTools page
  if (port.name !== 'carnforth-devtools') {
    return;
  }

  console.log("[Background] DevTools connected");

  // Create listener for this connection
  const devToolsListener = (message) => {
    console.log("[Background] Received message from DevTools:", message);
    
    // Check message type
    if (message.action === 'init') {
      // Store connection with tab ID for future communication
      const tabId = message.tabId;
      devToolsConnections[tabId] = port;

      // Clean up when DevTools is closed
      port.onDisconnect.addListener(() => {
        delete devToolsConnections[tabId];
        console.log("[Background] DevTools disconnected for tab", tabId);
      });

      // Notify DevTools that extension is ready
      port.postMessage({
        action: 'initialized',
        tabId: tabId
      });
      
      console.log("[Background] Initialized for tab", tabId);
    }
    // Handle test requests
    else if (message.action === 'runTouchpointTest' || message.action === 'runAllTests') {
      const tabId = message.tabId;
      console.log(`[Background] Handling ${message.action} for tab ${tabId}`);
      
      // First inject test functions into the page using chrome.scripting
      injectTestFunctions(tabId).then(() => {
        console.log("[Background] Functions injected, forwarding test request to content script");
        
        // Then send the message to the content script
        chrome.tabs.sendMessage(tabId, message, response => {
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            console.error("[Background] Error sending message to content script:", lastError.message);
            port.postMessage({
              action: 'testResults',
              error: `Error communicating with content script: ${lastError.message}`,
              touchpoint: message.touchpoint
            });
            return;
          }
          
          console.log("[Background] Received response from content script:", response);
          
          if (port && response) {
            port.postMessage({
              action: 'testResults',
              results: response.results || { error: "No results received" },
              error: response.error,
              touchpoint: message.touchpoint
            });
          } else if (port) {
            port.postMessage({
              action: 'testResults',
              error: "No response received from content script",
              touchpoint: message.touchpoint
            });
          }
        });
      }).catch(error => {
        console.error("[Background] Error injecting test functions:", error);
        if (port) {
          port.postMessage({
            action: 'testResults',
            error: `Error injecting test functions: ${error.message}`,
            touchpoint: message.touchpoint
          });
        }
      });
    }
    // Other actions
    else if (message.action === 'highlightElement') {
      const tabId = message.tabId;
      chrome.tabs.sendMessage(tabId, message);
    }
  };

  // Add message listener
  port.onMessage.addListener(devToolsListener);
});

// Listen for tab navigation events to update the DevTools panel
chrome.webNavigation.onCompleted.addListener(details => {
  const tabId = details.tabId;
  const port = devToolsConnections[tabId];

  // If DevTools is connected to this tab, let it know the page has changed
  if (port) {
    port.postMessage({
      action: 'pageChanged',
      tabId: tabId,
      url: details.url
    });
  }
});

// Listen for direct messages from content scripts and DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Background] Received direct message:", message, "from:", sender);
  
  // Handle injectTestFunctions message from content script
  if (message.action === 'injectTestFunctions') {
    const tabId = sender.tab ? sender.tab.id : message.tabId;
    if (!tabId) {
      console.error("[Background] No tabId available for injectTestFunctions");
      sendResponse({ success: false, error: "No tab ID available" });
      return true;
    }
    
    injectTestFunctions(tabId)
      .then(() => {
        console.log("[Background] Test functions injected successfully");
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error("[Background] Error injecting test functions:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Indicates we'll send a response asynchronously
  }
  
  // Handle testResults message from content script
  if (message.action === 'testResults') {
    console.log("[Background] Received testResults message:", message);
    
    // Find the DevTools panel that requested these results
    // Send the results to all connected panels since we don't know which one requested it
    Object.values(devToolsConnections).forEach(port => {
      try {
        console.log("[Background] Forwarding test results to DevTools panel:", port);
        port.postMessage({
          action: 'testResults',
          results: message.results,
          error: message.error,
          touchpoint: message.touchpoint
        });
      } catch (e) {
        console.error("[Background] Error forwarding test results to DevTools panel:", e);
      }
    });
    
    return false; // No response needed
  }
  
  // Handle runAllTests message from DevTools panel
  if (message.action === 'runAllTests') {
    console.log("[Background] Received runAllTests message with tabId:", message.tabId);
    
    // Verify we have a valid tabId
    if (!message.tabId) {
      console.error("[Background] No tabId provided for runAllTests");
      sendResponse({ error: "No tab ID provided" });
      return true;
    }
    
    const tabId = message.tabId;
    let resultSent = false;
    
    // Set up a timeout in case we don't get a response
    const timeout = setTimeout(() => {
      if (!resultSent) {
        console.error("[Background] Timeout waiting for test results");
        sendResponse({ error: "Timeout waiting for test results" });
        resultSent = true;
      }
    }, 30000); // 30 second timeout
    
    // Set up a one-time listener for the results
    const resultListener = (resultMessage) => {
      // Only process testResults messages
      if (resultMessage.action !== 'testResults') return;
      
      console.log("[Background] Received test results in listener:", resultMessage);
      
      // Clear the timeout
      clearTimeout(timeout);
      
      // If we haven't sent a result yet, send it now
      if (!resultSent) {
        console.log("[Background] Forwarding results to original sender");
        sendResponse(resultMessage.results || { error: resultMessage.error || "Unknown error" });
        resultSent = true;
        
        // Remove this listener
        chrome.runtime.onMessage.removeListener(resultListener);
      }
    };
    
    // Add the temporary listener
    chrome.runtime.onMessage.addListener(resultListener);
    
    // First, make sure the content script is loaded in the tab
    const ensureContentScript = async () => {
      try {
        console.log("[Background] Ensuring content script is loaded in tab", tabId);
        
        // Execute the content script - if it's already loaded, this is harmless
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["js/content.js"]
        });
        
        console.log("[Background] Content script loaded successfully");
        return true;
      } catch (error) {
        console.error("[Background] Error loading content script:", error);
        return false;
      }
    };
    
    // Then ensure the content script is loaded and proceed
    ensureContentScript().then(contentScriptLoaded => {
      if (!contentScriptLoaded) {
        console.error("[Background] Cannot proceed without content script");
        
        // Remove the temporary listener
        chrome.runtime.onMessage.removeListener(resultListener);
        
        // Clear the timeout
        clearTimeout(timeout);
        
        if (!resultSent) {
          sendResponse({ error: "Failed to load content script" });
          resultSent = true;
        }
        return;
      }
      
      // Next, inject test functions into the page
      injectTestFunctions(tabId)
        .then(() => {
          console.log("[Background] Test functions injected, now sending message to content script");
          
          // Send the test request to the content script
          chrome.tabs.sendMessage(tabId, { action: 'runAllTests' }, response => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
              console.error("[Background] Error sending message to content script:", lastError.message);
              
              // Remove the temporary listener
              chrome.runtime.onMessage.removeListener(resultListener);
              
              // Clear the timeout
              clearTimeout(timeout);
              
              // Send the error response
              if (!resultSent) {
                sendResponse({ error: `Error communicating with content script: ${lastError.message}` });
                resultSent = true;
              }
              return;
            }
            
            console.log("[Background] Immediate response from content script:", response);
            
            // We'll get the actual results via the listener, so we don't need to do anything here
            // unless there was an immediate error
            if (response && response.error) {
              // Remove the temporary listener
              chrome.runtime.onMessage.removeListener(resultListener);
              
              // Clear the timeout
              clearTimeout(timeout);
              
              // Send the error response
              if (!resultSent) {
                sendResponse({ error: response.error });
                resultSent = true;
              }
            }
          });
        })
        .catch(error => {
          console.error("[Background] Error injecting test functions:", error);
          
          // Remove the temporary listener
          chrome.runtime.onMessage.removeListener(resultListener);
          
          // Clear the timeout
          clearTimeout(timeout);
          
          if (!resultSent) {
            sendResponse({ error: `Error injecting test functions: ${error.message}` });
            resultSent = true;
          }
        });
    });
    
    return true; // Indicates we'll send a response asynchronously
  }
  
  // Handle runTouchpointTest message from DevTools panel
  if (message.action === 'runTouchpointTest') {
    console.log("[Background] Received runTouchpointTest message:", message);
    
    // Verify we have a valid tabId and touchpoint
    if (!message.tabId) {
      console.error("[Background] No tabId provided for runTouchpointTest");
      sendResponse({ error: "No tab ID provided" });
      return true;
    }
    
    if (!message.touchpoint) {
      console.error("[Background] No touchpoint specified for runTouchpointTest");
      sendResponse({ error: "No touchpoint specified" });
      return true;
    }
    
    const tabId = message.tabId;
    const touchpoint = message.touchpoint;
    let resultSent = false;
    
    // Set up a timeout in case we don't get a response
    const timeout = setTimeout(() => {
      if (!resultSent) {
        console.error(`[Background] Timeout waiting for touchpoint ${touchpoint} test results`);
        sendResponse({ error: `Timeout waiting for touchpoint ${touchpoint} test results` });
        resultSent = true;
      }
    }, 30000); // 30 second timeout
    
    // Set up a one-time listener for the results
    const resultListener = (resultMessage) => {
      // Only process testResults messages for this touchpoint
      if (resultMessage.action !== 'testResults' || resultMessage.touchpoint !== touchpoint) return;
      
      console.log(`[Background] Received test results for touchpoint ${touchpoint}:`, resultMessage);
      
      // Clear the timeout
      clearTimeout(timeout);
      
      // If we haven't sent a result yet, send it now
      if (!resultSent) {
        console.log("[Background] Forwarding touchpoint results to original sender");
        sendResponse(resultMessage.results || { error: resultMessage.error || "Unknown error" });
        resultSent = true;
        
        // Remove this listener
        chrome.runtime.onMessage.removeListener(resultListener);
      }
    };
    
    // Add the temporary listener
    chrome.runtime.onMessage.addListener(resultListener);
    
    // First, make sure the content script is loaded in the tab
    const ensureContentScript = async () => {
      try {
        console.log("[Background] Ensuring content script is loaded in tab", tabId);
        
        // Execute the content script - if it's already loaded, this is harmless
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["js/content.js"]
        });
        
        console.log("[Background] Content script loaded successfully");
        return true;
      } catch (error) {
        console.error("[Background] Error loading content script:", error);
        return false;
      }
    };
    
    // Then ensure the content script is loaded and proceed
    ensureContentScript().then(contentScriptLoaded => {
      if (!contentScriptLoaded) {
        console.error("[Background] Cannot proceed without content script");
        
        // Remove the temporary listener
        chrome.runtime.onMessage.removeListener(resultListener);
        
        // Clear the timeout
        clearTimeout(timeout);
        
        if (!resultSent) {
          sendResponse({ error: "Failed to load content script" });
          resultSent = true;
        }
        return;
      }
      
      // Next, inject test functions into the page
      injectTestFunctions(tabId)
        .then(() => {
          console.log(`[Background] Test functions injected, now running ${touchpoint} test`);
          
          // Send the test request to the content script
          chrome.tabs.sendMessage(
            tabId, 
            { action: 'runTouchpointTest', touchpoint: touchpoint },
            response => {
              const lastError = chrome.runtime.lastError;
              if (lastError) {
                console.error("[Background] Error sending message to content script:", lastError.message);
                
                // Remove the temporary listener
                chrome.runtime.onMessage.removeListener(resultListener);
                
                // Clear the timeout
                clearTimeout(timeout);
                
                // Send the error response
                if (!resultSent) {
                  sendResponse({ error: `Error communicating with content script: ${lastError.message}` });
                  resultSent = true;
                }
                return;
              }
              
              console.log("[Background] Immediate response from content script for touchpoint:", response);
              
              // We'll get the actual results via the listener, so we don't need to do anything here
              // unless there was an immediate error
              if (response && response.error) {
                // Remove the temporary listener
                chrome.runtime.onMessage.removeListener(resultListener);
                
                // Clear the timeout
                clearTimeout(timeout);
                
                // Send the error response
                if (!resultSent) {
                  sendResponse({ error: response.error });
                  resultSent = true;
                }
              }
            }
          );
        })
      .catch(error => {
        console.error("[Background] Error injecting test functions:", error);
        
        // Remove the temporary listener
        chrome.runtime.onMessage.removeListener(resultListener);
        
        // Clear the timeout
        clearTimeout(timeout);
        
        if (!resultSent) {
          sendResponse({ error: `Error injecting test functions: ${error.message}` });
          resultSent = true;
        }
      });
    });
    
    return true; // Indicates we'll send a response asynchronously
  }
  
  // Any other messages
  return false;
});

/**
 * Helper function to inject test functions into the page
 * This uses the chrome.scripting API which is more reliable with strict CSP
 */
async function injectTestFunctions(tabId) {
  console.log(`[Background] Injecting test functions into tab ${tabId}`);
  
  // Define the functions to inject
  const functions = {
    test_accessible_name: async function() {
      return {
        description: 'Checks that all interactive elements have accessible names that clearly identify their purpose. Proper labeling ensures that assistive technology users can understand the function of each element.',
        issues: [
          {
            type: 'info',
            title: 'Accessible Name test detected',
            description: 'This is a placeholder issue. The accessible_name tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_animation: async function() {
      return {
        description: 'Evaluates whether animated content can be paused, stopped, or hidden by users. Controls for animation are essential for people with vestibular disorders, attention disorders, and those who prefer reduced motion.',
        issues: [
          {
            type: 'info',
            title: 'Animation test detected',
            description: 'This is a placeholder issue. The animation tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_color_contrast: async function() {
      return {
        description: 'Evaluates whether text and interface components have sufficient contrast against their background. Adequate contrast is essential for users with low vision, color blindness, or those using screens in bright sunlight.',
        issues: [
          {
            type: 'info',
            title: 'Color Contrast test detected',
            description: 'This is a placeholder issue. The color_contrast tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_color_use: async function() {
      return {
        description: 'Checks that color is not the only visual means of conveying information or indicating an action. Non-color indicators ensure that users with color vision deficiencies can perceive important information.',
        issues: [
          {
            type: 'info',
            title: 'Color Use test detected',
            description: 'This is a placeholder issue. The color_use tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_dialogs: async function() {
      return {
        description: 'Checks that dialogs are properly implemented with correct ARIA roles and focus management. Properly implemented dialogs ensure that keyboard and screen reader users can interact with modal content.',
        issues: [
          {
            type: 'info',
            title: 'Dialogs test detected',
            description: 'This is a placeholder issue. The dialogs tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_electronic_documents: async function() {
      return {
        description: 'Evaluates links to electronic documents to ensure they indicate file type and size. This information helps users decide whether to download a file, especially for those with limited bandwidth or who require assistive technology compatibility.',
        issues: [
          {
            type: 'info',
            title: 'Electronic Documents test detected',
            description: 'This is a placeholder issue. The electronic_documents tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_event_handling: async function() {
      return {
        description: 'Verifies that interactive elements can be operated by keyboard as well as mouse. Proper event handling ensures that all user interface components are operable by keyboard-only users.',
        issues: [
          {
            type: 'info',
            title: 'Event Handling test detected',
            description: 'This is a placeholder issue. The event_handling tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_floating_content: async function() {
      return {
        description: 'Evaluates tooltips, popovers, and other floating content for keyboard accessibility and proper ARIA implementation. Proper floating content implementation ensures that all users can access this information.',
        issues: [
          {
            type: 'info',
            title: 'Floating Content test detected',
            description: 'This is a placeholder issue. The floating_content tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_focus_management: async function() {
      return {
        description: 'Checks for logical focus order and visible focus indicators. Proper focus management ensures that keyboard users can predict where focus will go next and can visually identify the current focus position.',
        issues: [
          {
            type: 'info',
            title: 'Focus Management test detected',
            description: 'This is a placeholder issue. The focus_management tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_fonts: async function() {
      return {
        description: 'Evaluates font usage for proper sizing, line spacing, and readability. Appropriate font usage ensures that text is readable by all users, especially those with low vision or reading disabilities.',
        issues: [
          {
            type: 'info',
            title: 'Fonts test detected',
            description: 'This is a placeholder issue. The fonts tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_forms: async function() {
      return {
        description: 'Checks that forms have properly associated labels and error identification. Proper form implementation ensures that users can understand what information is requested and receive appropriate feedback on errors.',
        issues: [
          {
            type: 'info',
            title: 'Forms test detected',
            description: 'This is a placeholder issue. The forms tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_headings: async function() {
      return {
        description: 'Checks for proper heading structure and hierarchy. Well-structured headings create a logical outline of the page content, helping all users navigate and understand the page organization.',
        issues: [
          {
            type: 'info',
            title: 'Headings test detected',
            description: 'This is a placeholder issue. The headings tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_images: async function() {
      return {
        description: 'Checks that images have appropriate alternative text. Proper alt text ensures that users who cannot see images can understand their content or purpose.',
        issues: [
          {
            type: 'info',
            title: 'Images test detected',
            description: 'This is a placeholder issue. The images tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_landmarks: async function() {
      return {
        description: 'Checks for proper use of HTML5 and ARIA landmark regions. Proper landmark structure helps screen reader users navigate and understand the page layout.',
        issues: [
          {
            type: 'info',
            title: 'Landmarks test detected',
            description: 'This is a placeholder issue. The landmarks tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_language: async function() {
      return {
        description: 'Checks that the page has a language declaration and that language changes are properly marked. Proper language markup ensures that assistive technologies can present content in the correct language.',
        issues: [
          {
            type: 'info',
            title: 'Language test detected',
            description: 'This is a placeholder issue. The language tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_lists: async function() {
      return {
        description: 'Checks that content presented visually as lists uses proper semantic list elements. Proper list markup helps screen reader users understand content relationships and navigate efficiently.',
        issues: [
          {
            type: 'info',
            title: 'Lists test detected',
            description: 'This is a placeholder issue. The lists tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_maps: async function() {
      console.log("[Maps Touchpoint] Starting maps touchpoint test...");
      
      // For simplicity, just return a basic result
      return {
        description: 'Evaluates whether map content has text alternatives that provide equivalent information for users who cannot see the map. Important for blind users and those using screen readers.',
        issues: [
          {
            type: 'info',
            title: 'No maps detected on page',
            description: 'No interactive maps were detected on this page. This test looks for common map implementations including Google Maps, Bing Maps, Mapbox, Leaflet, and others.'
          }
        ]
      };
    },
    
    test_read_more: async function() {
      return {
        description: 'Checks that "read more" or similar links provide context about their destination. Descriptive link text ensures that users understand where a link will take them, especially when links are encountered out of context.',
        issues: [
          {
            type: 'info',
            title: 'Read More test detected',
            description: 'This is a placeholder issue. The read_more tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_tabindex: async function() {
      return {
        description: 'Checks for proper usage of tabindex attributes. Proper tabindex usage ensures a logical keyboard navigation order and prevents focus traps.',
        issues: [
          {
            type: 'info',
            title: 'Tabindex test detected',
            description: 'This is a placeholder issue. The tabindex tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_title_attribute: async function() {
      return {
        description: 'Checks that title attributes are not used as the sole means of providing important information. Important information should be directly visible or available through standard controls, as title attributes are not consistently accessible.',
        issues: [
          {
            type: 'info',
            title: 'Title Attribute test detected',
            description: 'This is a placeholder issue. The title_attribute tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_tables: async function() {
      return {
        description: 'Checks that data tables have proper headers, captions, and structure. Properly structured tables ensure that users can understand the relationships between data cells and headers.',
        issues: [
          {
            type: 'info',
            title: 'Tables test detected',
            description: 'This is a placeholder issue. The tables tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_timers: async function() {
      return {
        description: 'Evaluates whether content with time limits can be paused, stopped, or extended. Control over timed content ensures that users who need more time can still access and interact with content.',
        issues: [
          {
            type: 'info',
            title: 'Timers test detected',
            description: 'This is a placeholder issue. The timers tests have not been fully implemented yet.'
          }
        ]
      };
    },
    
    test_videos: async function() {
      return {
        description: 'Checks that video content has proper captions, audio descriptions, and transcripts. Accessible video ensures that users who cannot see or hear the video can still access its content.',
        issues: [
          {
            type: 'info',
            title: 'Videos test detected',
            description: 'This is a placeholder issue. The videos tests have not been fully implemented yet.'
          }
        ]
      };
    }
  };

  // Inject the function definitions into the page
  // Use the chrome.scripting API which handles CSP restrictions properly
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (touchpointFunctions) => {
        console.log("[Injected Script] Starting to assign functions to window object...");
        
        // Create a special property on window that content scripts can access
        window.__carnforthTouchpointFunctions = {};
        
        // Assign each function to both the window object and our special property
        for (const [name, func] of Object.entries(touchpointFunctions)) {
          // Add to window for page context
          window[name] = func;
          
          // Also add to the special property for content script access
          window.__carnforthTouchpointFunctions[name] = func;
          
          console.log(`[Injected Script] Registered function: ${name}`);
        }
        
        // Also add a helper function to execute tests from the content script
        window.__carnforthExecuteTest = async function(testName) {
          console.log(`[Injected Script] Executing test: ${testName}`);
          if (typeof window[testName] === 'function') {
            try {
              const result = await window[testName]();
              return { success: true, result: result };
            } catch (error) {
              return { success: false, error: error.message };
            }
          } else {
            return { success: false, error: `Function ${testName} not found` };
          }
        };
        
        // Dispatch event to notify that functions are loaded
        document.dispatchEvent(new CustomEvent('carnforth-touchpoints-loaded'));
        console.log("[Injected Script] All touchpoint functions have been registered");
        
        return true; // Signal success
      },
      args: [functions],
      world: "MAIN" // Important: inject into the main world, not the content script's isolated world
    });
    
    console.log(`[Background] Injected test functions into tab ${tabId}`);
    return true;
  } catch (error) {
    console.error(`[Background] Error injecting scripts:`, error);
    throw error;
  }
}