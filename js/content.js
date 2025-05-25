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
      const highlightId = highlightElement(message.selector, message.issueId);
      sendResponse({ success: true, highlightId });
      return false;
    }
    
    // Handle element highlight removal
    if (message.action === 'removeHighlight') {
      removeHighlight(message.issueId);
      sendResponse({ success: true });
      return false;
    }
    
    // Handle cleanup of all highlights
    if (message.action === 'cleanupAllHighlights') {
      cleanupAllHighlights();
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
   * @param {string} issueId - The ID of the issue being highlighted
   * @returns {string} - The ID of the highlight element created
   */
  function highlightElement(selector, issueId) {
    console.log(`[Content] Highlighting element: ${selector} for issue: ${issueId}`);
    
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
    
    // Check if this is an XPath selector first (starts with / or contains /html)
    if (selector.startsWith('/') || selector.includes('/html')) {
      // This is definitely an XPath, use XPath evaluation
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
          console.log('[Content] Found element via XPath:', element.tagName, element.id || 'no-id');
        }
      } catch (e) {
        console.error('[Content] Invalid XPath:', e);
      }
    } else {
      // Try CSS selector
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
          console.log(`[Content] Using more specific selector: ${specificSelector} derived from ${selector} and issueId: ${issueId}`);
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
        console.error('[Content] Error with CSS selector:', e);
      }
    }
    
    // If still not found and looks like it might be XPath, try XPath as fallback
    if (!element && selector.includes('/') && !selector.startsWith('/')) {
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
      return null;
    }
    
    // Generate a unique ID for this highlight based on the issue ID
    const safeIssueId = issueId || `unspecified-${Date.now()}`;
    const highlightId = `carnforth-highlight-${safeIssueId}`;
    
    // Get element position
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Create highlight element
    const highlight = document.createElement('div');
    highlight.id = highlightId;
    highlight.className = 'carnforth-highlight';
    highlight.setAttribute('data-issue-id', safeIssueId);
    
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
      // Element might have been removed from the DOM, check first
      if (!element.isConnected) {
        removeEventListeners();
        if (highlight.parentNode) {
          highlight.remove();
        }
        return;
      }
      
      const newRect = element.getBoundingClientRect();
      const newScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const newScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      highlight.style.top = (newRect.top + newScrollTop - offset) + 'px';
      highlight.style.left = (newRect.left + newScrollLeft - offset) + 'px';
      highlight.style.width = (newRect.width + (offset * 2)) + 'px';
      highlight.style.height = (newRect.height + (offset * 2)) + 'px';
    };
    
    // Function to remove event listeners when no longer needed
    const removeEventListeners = () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePositionWithoutNavigation);
    };
    
    // Create a non-navigating scroll handler to prevent accidental navigation events
    // This uses a passive event listener and prevents the default behavior
    const updatePositionWithoutNavigation = (e) => {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        updatePosition();
      });
    };
    
    // Add event listeners for window resize and scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePositionWithoutNavigation, { passive: true });
    
    // Store references to the element and event cleanup
    highlight.targetElement = element;
    highlight.updatePosition = updatePosition;
    highlight.removeEventListeners = removeEventListeners;
    
    return highlightId;
  }
  
  /**
   * Remove a highlight element by issue ID
   * @param {string} issueId - The ID of the issue whose highlight should be removed
   */
  function removeHighlight(issueId) {
    if (!issueId) return;
    
    try {
      // First try to find the highlight by ID (the preferred way)
      const highlightId = `carnforth-highlight-${issueId}`;
      const highlight = document.getElementById(highlightId);
      
      if (highlight) {
        console.log('[Content] Found highlight element with ID:', highlightId);
        // Remove event listeners if they exist
        if (highlight.removeEventListeners) {
          highlight.removeEventListeners();
        }
        // Remove from DOM
        highlight.remove();
        return;
      }
      
      // If not found by ID, do a broader cleanup (in case the ID naming convention changed)
      // Check for any highlights that might be orphaned
      const allHighlights = document.querySelectorAll('.carnforth-highlight, [id^="carnforth-highlight-"]');
      if (allHighlights.length > 0) {
        console.log('[Content] Found', allHighlights.length, 'potential highlight elements to clean up');
        allHighlights.forEach(h => {
          if (h.removeEventListeners) {
            h.removeEventListeners();
          }
          h.remove();
        });
      }
    } catch (error) {
      console.error('[Content] Error removing highlight:', error);
    }
  }
  
  /**
   * Remove all highlight elements from the page
   */
  function cleanupAllHighlights() {
    console.log('[Content] Cleaning up all highlights');
    
    try {
      // Get all highlights - using both class and ID patterns for more thorough cleanup
      const highlights = document.querySelectorAll('.carnforth-highlight, [id^="carnforth-highlight-"]');
      
      if (highlights.length === 0) {
        console.log('[Content] No highlight elements found to clean up');
        return;
      }
      
      console.log(`[Content] Found ${highlights.length} highlight elements to clean up`);
      
      // Remove each highlight
      highlights.forEach(highlight => {
        try {
          // Remove event listeners if they exist
          if (highlight.removeEventListeners) {
            highlight.removeEventListeners();
          }
          
          // Remove the highlight from the DOM
          highlight.remove();
        } catch (e) {
          console.error('[Content] Error removing individual highlight:', e);
        }
      });
      
      console.log('[Content] Successfully cleaned up all highlights');
    } catch (error) {
      console.error('[Content] Error in cleanupAllHighlights:', error);
    }
  }

} else {
  console.log("[Content] Script already initialized, skipping duplicate execution");
}