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
  // Use JSON.stringify to properly escape the selector string
  chrome.devtools.inspectedWindow.eval(
    `(${highlightFunctionToInject.toString()})(${JSON.stringify(selector)}, ${JSON.stringify(safeIssueId)})`,
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
  // First, remove ALL existing highlights to ensure only one element is highlighted at a time
  const existingHighlights = document.querySelectorAll('.carnforth-highlight, [id^="carnforth-highlight-"]');
  existingHighlights.forEach(highlight => {
    // Clean up event listeners if they exist
    if (highlight.updatePosition) {
      window.removeEventListener('resize', highlight.updatePosition);
      window.removeEventListener('scroll', highlight.updatePosition);
    }
    highlight.remove();
  });
  
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
  
  // Create a thick red highlight with white borders that works in all contrast modes
  highlight.style.boxSizing = 'border-box';
  
  // Use multiple box-shadows to create the layered effect
  // This works better than outline for cross-browser compatibility
  highlight.style.boxShadow = `
    0 0 0 2px white,           /* Inner white border */
    0 0 0 8px #cc0000,         /* Thick red border (6px wide) */
    0 0 0 10px white,          /* Outer white border */
    0 0 20px rgba(0, 0, 0, 0.5) /* Subtle shadow for depth */
  `;
  
  // For high contrast mode, use CurrentColor which adapts to the user's settings
  const highContrastStyles = `
    @media (prefers-contrast: high) {
      .carnforth-highlight {
        box-shadow: 
          0 0 0 2px CurrentColor,    /* Inner border uses system color */
          0 0 0 8px CanvasText,      /* Main border uses text color */
          0 0 0 10px CurrentColor,   /* Outer border uses system color */
          0 0 20px rgba(0, 0, 0, 0.5) !important;
      }
    }
    
    /* Windows High Contrast Mode specific */
    @media (-ms-high-contrast: active), (forced-colors: active) {
      .carnforth-highlight {
        box-shadow: none !important;
        border: 2px solid ButtonText !important;
        outline: 6px solid Highlight !important;
        outline-offset: 2px !important;
        forced-color-adjust: none;
      }
    }
  `;
  
  // Add high contrast styles if not already added
  if (!document.getElementById('carnforth-highlight-styles')) {
    const style = document.createElement('style');
    style.id = 'carnforth-highlight-styles';
    style.textContent = highContrastStyles;
    document.head.appendChild(style);
  }
  
  highlight.style.zIndex = '2147483647'; // Maximum z-index
  highlight.style.pointerEvents = 'none'; // Make it non-interactive
  
  // Add to page
  document.body.appendChild(highlight);
  
  // Scroll element into view using a method that won't trigger navigation events
  // Use setTimeout to ensure the highlight is rendered before scrolling
  setTimeout(() => {
    const elementRect = element.getBoundingClientRect();
    const absoluteTop = elementRect.top + window.pageYOffset;
    const absoluteLeft = elementRect.left + window.pageXOffset;
    
    // Calculate center position
    const centerY = absoluteTop - (window.innerHeight / 2) + (elementRect.height / 2);
    const centerX = absoluteLeft - (window.innerWidth / 2) + (elementRect.width / 2);
    
    // Use window.scrollTo instead of scrollIntoView to avoid navigation events
    window.scrollTo({
      top: Math.max(0, centerY),
      left: Math.max(0, centerX),
      behavior: 'smooth'
    });
    
    // Also add a visual pulse effect to draw attention
    highlight.style.animation = 'carnforth-pulse 1s ease-out';
    
    // Add the pulse animation if it doesn't exist
    if (!document.getElementById('carnforth-animations')) {
      const style = document.createElement('style');
      style.id = 'carnforth-animations';
      style.textContent = `
        @keyframes carnforth-pulse {
          0% { 
            transform: scale(1); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.02); 
            opacity: 0.9;
            box-shadow: 
              0 0 0 2px white,
              0 0 0 10px #cc0000,    /* Slightly thicker during pulse */
              0 0 0 12px white,
              0 0 30px rgba(204, 0, 0, 0.6); /* Red glow effect */
          }
          100% { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
        
        /* High contrast mode pulse animation */
        @media (prefers-contrast: high), (-ms-high-contrast: active), (forced-colors: active) {
          @keyframes carnforth-pulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.02); 
              opacity: 1; /* Don't reduce opacity in high contrast */
            }
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, 100); // Small delay to ensure DOM is updated
  
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
  const updatePositionWithoutNavigation = () => {
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