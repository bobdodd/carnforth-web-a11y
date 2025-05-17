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
 */
function highlightElement(selector) {
  // Validate the selector before attempting to highlight
  if (!selector || selector === 'null' || selector === 'undefined' || selector === '') {
    console.error('Invalid selector, cannot highlight element');
    return;
  }
  
  // Execute the highlight function in the context of the inspected page
  chrome.devtools.inspectedWindow.eval(
    `(${highlightFunctionToInject.toString()})("${selector}")`,
    function(result, isException) {
      if (isException) {
        console.error('Error highlighting element:', isException);
      }
    }
  );
}

/**
 * This function will be injected into the page to highlight elements
 * It must be self-contained as it will be serialized and executed in the page context
 * @param {string} selector - CSS selector or XPath for the element
 */
function highlightFunctionToInject(selector) {
  // Try to get the element by CSS selector
  let element = document.querySelector(selector);
  
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
  
  // Remove any existing highlights
  const existingHighlights = document.querySelectorAll('.carnforth-highlight');
  existingHighlights.forEach(el => el.remove());
  
  // Get element position
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Create highlight element
  const highlight = document.createElement('div');
  highlight.className = 'carnforth-highlight';
  
  // Position highlight with a slight offset
  const offset = 3; // 3px offset
  highlight.style.position = 'absolute';
  highlight.style.top = (rect.top + scrollTop - offset) + 'px';
  highlight.style.left = (rect.left + scrollLeft - offset) + 'px';
  highlight.style.width = (rect.width + (offset * 2)) + 'px';
  highlight.style.height = (rect.height + (offset * 2)) + 'px';
  highlight.style.border = '2px solid white';
  highlight.style.outline = '2px solid #e53935'; // Red color
  highlight.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.5)';
  highlight.style.zIndex = '2147483647'; // Maximum z-index
  highlight.style.pointerEvents = 'none'; // Make it non-interactive
  highlight.style.boxSizing = 'border-box';
  
  // Add to page
  document.body.appendChild(highlight);
  
  // Scroll element into view if needed
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  
  // Remove highlight after 3 seconds
  setTimeout(() => {
    if (highlight.parentNode) {
      highlight.remove();
    }
  }, 3000);
}