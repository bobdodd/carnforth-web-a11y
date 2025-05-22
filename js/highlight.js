/**
 * Functionality for highlighting elements on the page
 */

/**
 * The initializeHighlightButtons function is no longer needed
 * as highlighting now happens automatically when expanding issue details
 */

/**
 * Highlight an element on the page
 * @param {string} selector - CSS selector or XPath for the element
 * @param {string} issueId - The ID of the issue being highlighted
 */
function highlightElement(selector, issueId) {
  // Validate the selector before attempting to highlight
  if (!selector || selector === 'null' || selector === 'undefined' || selector === '') {
    console.error('Invalid selector, cannot highlight element');
    return;
  }
  
  // Default issueId if not provided
  const safeIssueId = issueId || 'unspecified';
  
  console.log('[highlight.js] Highlighting element with selector:', selector);
  
  // Execute the highlight function in the context of the inspected page
  chrome.devtools.inspectedWindow.eval(
    `(${highlightFunctionToInject.toString()})("${selector}", "${safeIssueId}")`,
    function(result, isException) {
      if (isException) {
        console.error('Error highlighting element:', isException);
      }
    }
  );
}

// Expose the highlightElement function globally for accordion.js to use
window.highlightElementFromHighlightJs = highlightElement;

/**
 * This function will be injected into the page to highlight elements
 * It must be self-contained as it will be serialized and executed in the page context
 * @param {string} selector - CSS selector or XPath for the element
 * @param {string} issueId - The ID of the issue being highlighted
 */
function highlightFunctionToInject(selector, issueId) {
  // Try to get the element by CSS selector
  let element = null;
  
  // Store the original selector for logging
  const originalSelector = selector;
  
  try {
    // If the selector contains an index indicator like :nth-of-type or :nth-child
    // We need to handle it specially to ensure we highlight the correct element
    if (selector.includes(':nth-of-type(') || selector.includes(':nth-child(')) {
      element = document.querySelector(selector);
    } 
    // If selector is very simple like 'iframe' but we need a specific one
    // and the issueId contains a numeric identifier, we can use that
    else if (/^(iframe|div|svg)$/.test(selector) && issueId && /\d+/.test(issueId)) {
      // Extract numeric part from issue ID if present
      const match = issueId.match(/\d+/);
      const index = match ? parseInt(match[0]) : 0;
      // Create a more specific selector using nth-of-type
      const specificSelector = `${selector}:nth-of-type(${index + 1})`;
      console.log(`Using more specific selector: ${specificSelector} derived from ${selector} and issueId: ${issueId}`);
      element = document.querySelector(specificSelector);
      
      // If still not found, fall back to basic selector
      if (!element) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Use the index from issueId, but ensure it's within bounds
          const safeIndex = index < elements.length ? index : 0;
          element = elements[safeIndex];
        }
      }
    } else {
      element = document.querySelector(selector);
    }
  } catch (e) {
    console.error('Error with selector:', e);
  }
  
  // If not found and looks like XPath, try XPath
  if (!element && selector.includes('/')) {
    try {
      const result = document.evaluate(
        selector, 
        document, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      );
      
      if (result.singleNodeValue) {
        element = result.singleNodeValue;
      }
    } catch (e) {
      console.error('Invalid XPath:', e);
    }
  }
  
  if (!element) {
    console.error('Element not found with selector:', selector);
    return;
  }
  
  // Generate a unique ID for this highlight based on the issue ID
  const highlightId = `carnforth-highlight-${issueId}`;
  
  // Check if this issue already has a highlight
  const existingHighlight = document.getElementById(highlightId);
  if (existingHighlight) {
    // If already highlighted, just return without scrolling
    // REMOVED: element.scrollIntoView() call that was causing page navigation events
    console.log('Element already highlighted, skipping highlight creation');
    return;
  }
  
  // Get element position
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Create highlight element
  const highlight = document.createElement('div');
  highlight.id = highlightId;
  highlight.className = 'carnforth-highlight';
  highlight.setAttribute('data-issue-id', issueId);
  
  // Position highlight with a slight offset
  const offset = 2; // 2px offset
  highlight.style.position = 'absolute';
  highlight.style.top = (rect.top + scrollTop - offset) + 'px';
  highlight.style.left = (rect.left + scrollLeft - offset) + 'px';
  highlight.style.width = (rect.width + (offset * 2)) + 'px';
  highlight.style.height = (rect.height + (offset * 2)) + 'px';
  
  // Use white borders inside and outside the dark red outline
  highlight.style.boxSizing = 'border-box';
  highlight.style.border = '2px solid white';  // Inner white border
  highlight.style.outline = '4px solid #cc0000'; // Dark red outline, thicker (4px)
  highlight.style.outlineOffset = '-3px'; // Adjust to create the right layering effect
  
  // Add a white outer glow
  highlight.style.boxShadow = '0 0 0 1px white, 0 0 8px rgba(255, 255, 255, 0.8)';
  
  highlight.style.zIndex = '2147483647'; // Maximum z-index
  highlight.style.pointerEvents = 'none'; // Make it non-interactive
  
  // Add to page
  document.body.appendChild(highlight);
  
  // REMOVED: Scroll element into view - This was causing page navigation events
  // We're removing the auto-scrolling behavior because it may trigger page changed events
  // element.scrollIntoView({
  //   behavior: 'smooth',
  //   block: 'center'
  // });
  
  // Add window resize listener to reposition highlight
  const updatePosition = () => {
    const newRect = element.getBoundingClientRect();
    const newScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const newScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    highlight.style.top = (newRect.top + newScrollTop - offset) + 'px';
    highlight.style.left = (newRect.left + newScrollLeft - offset) + 'px';
    highlight.style.width = (newRect.width + (offset * 2)) + 'px';
    highlight.style.height = (newRect.height + (offset * 2)) + 'px';
  };

  // Create a non-navigating scroll handler to prevent accidental navigation events
  // This uses a passive event listener and requestAnimationFrame for better performance
  const updatePositionWithoutNavigation = (e) => {
    requestAnimationFrame(() => {
      updatePosition();
    });
  };
  
  // Add event listeners for window resize and scroll
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePositionWithoutNavigation, { passive: true });
  
  // Store a reference to the event listeners on the highlight element
  highlight.updatePosition = updatePosition;
  
  // Return the highlight element ID so it can be removed later
  return highlightId;
}