/**
 * Content script for Carnforth Web A11y extension
 * Runs in the context of the web page
 * 
 * This simplified implementation only handles element highlighting and
 * DOM querying for accessibility testing. No test execution happens here.
 */

// Only initialize once - prevent duplicate script execution
if (typeof window.__CARNFORTH_CONTENT_LOADED === 'undefined') {
  // Set flag to prevent duplicate initialization
  window.__CARNFORTH_CONTENT_LOADED = true;
  
  console.log("[Content] Content script loaded", window.location.href);
  console.log("[Content] Page title:", document.title);

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[Content] Received message:", message);
    
    // Handle ping for connection check
    if (message.action === 'ping') {
      sendResponse({ action: 'pong' });
      return false;
    }
    
    // Handle element highlighting
    if (message.action === 'highlightElement') {
      highlightElement(message.selector);
      sendResponse({ success: true });
      return false;
    }

    // Handle DOM query requests
    if (message.action === 'queryDOM') {
      try {
        const result = queryDOM(message.query);
        sendResponse({ result });
      } catch (error) {
        sendResponse({ error: error.message });
      }
      return true;
    }
    
    return false;
  });

  /**
   * Query the DOM for accessibility-related data
   * @param {Object} query - The query parameters
   * @returns {Object} - The query results
   */
  function queryDOM(query) {
    // Example implementation - could be expanded for more complex queries
    if (query.selector) {
      const elements = document.querySelectorAll(query.selector);
      const results = [];
      
      elements.forEach(el => {
        // Basic element info
        results.push({
          tagName: el.tagName.toLowerCase(),
          text: el.textContent?.trim(),
          attributes: getElementAttributes(el),
          rect: el.getBoundingClientRect().toJSON()
        });
      });
      
      return {
        count: results.length,
        elements: results
      };
    }
    
    // Default page information
    return {
      title: document.title,
      url: window.location.href,
      elementCount: document.querySelectorAll('*').length
    };
  }
  
  /**
   * Get all attributes of an element
   * @param {Element} element - The DOM element
   * @returns {Object} - Object with attribute name/value pairs
   */
  function getElementAttributes(element) {
    const attributes = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  /**
   * Highlight an element on the page
   * @param {string} selector - CSS selector or XPath for the element
   */
  function highlightElement(selector) {
    console.log(`[Content] Highlighting element: ${selector}`);
    
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
        console.error('[Content] Invalid XPath:', e);
      }
    }
    
    if (!element) {
      console.error('[Content] Element not found with selector:', selector);
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

} else {
  console.log("[Content] Script already initialized, skipping duplicate execution");
}