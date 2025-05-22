/**
 * Accessible accordion functionality based on WAI-ARIA Authoring Practices Guide
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

/**
 * Initialize all accordions on the page
 */
function initializeAccordions() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  accordionHeaders.forEach(header => {
    // Set up click handler
    header.addEventListener('click', toggleAccordion);
    
    // Set up keyboard handler
    header.addEventListener('keydown', function(event) {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          toggleAccordion.call(this);
          break;
          
        case 'ArrowDown':
          event.preventDefault();
          // Find the next accordion header and focus it
          const nextAccordion = findNextAccordionHeader(this);
          if (nextAccordion) {
            nextAccordion.focus();
          }
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          // Find the previous accordion header and focus it
          const prevAccordion = findPrevAccordionHeader(this);
          if (prevAccordion) {
            prevAccordion.focus();
          }
          break;
          
        case 'Home':
          event.preventDefault();
          // Focus the first accordion header
          const firstAccordion = document.querySelector('.accordion-header');
          if (firstAccordion) {
            firstAccordion.focus();
          }
          break;
          
        case 'End':
          event.preventDefault();
          // Focus the last accordion header
          const accordionHeaders = document.querySelectorAll('.accordion-header');
          const lastAccordion = accordionHeaders[accordionHeaders.length - 1];
          if (lastAccordion) {
            lastAccordion.focus();
          }
          break;
      }
    });
  });
}

/**
 * Initialize issue disclosure widgets
 */
function initializeIssueDisclosures() {
  const disclosureBtns = document.querySelectorAll('.issue-disclosure-btn');
  
  disclosureBtns.forEach(button => {
    // Set up click handler
    button.addEventListener('click', toggleIssueDetails);
    
    // No need for keyboard handler as buttons already handle Enter and Space
  });
}

/**
 * Toggle accordion open/closed state
 */
function toggleAccordion() {
  // Toggle aria-expanded
  const expanded = this.getAttribute('aria-expanded') === 'true';
  this.setAttribute('aria-expanded', !expanded);
  
  // Find the content element
  const controlsId = this.getAttribute('aria-controls');
  const content = document.getElementById(controlsId);
  
  // Toggle content visibility
  if (content) {
    content.classList.toggle('expanded');
    
    // Make the content programmatically focusable when expanded
    if (!expanded) {
      // Only make focusable when expanding
      content.setAttribute('tabindex', '-1');
      
      // Fix the aria-labelledby attribute if missing
      const headerId = this.getAttribute('id');
      if (headerId && !content.getAttribute('aria-labelledby')) {
        content.setAttribute('aria-labelledby', headerId);
      } else if (!content.getAttribute('aria-labelledby')) {
        // If the header doesn't have an ID, find the title inside it
        const headerTitle = this.querySelector('.accordion-title');
        if (headerTitle && headerTitle.getAttribute('id')) {
          content.setAttribute('aria-labelledby', headerTitle.getAttribute('id'));
        }
      }
      
      // Move focus to the content region after expanding
      // This helps screen readers navigate into the content
      content.focus();
    } else {
      // Remove tabindex when collapsing to avoid extra tab stops
      content.removeAttribute('tabindex');
    }
  }
  
  // Toggle icon rotation
  const icon = this.querySelector('.accordion-icon');
  if (icon) {
    icon.classList.toggle('expanded');
    icon.innerHTML = expanded ? '▶' : '▼';
  }
}

/**
 * Toggle issue details open/closed state
 */
function toggleIssueDetails() {
  // Toggle aria-expanded
  const expanded = this.getAttribute('aria-expanded') === 'true';
  this.setAttribute('aria-expanded', !expanded);
  
  // Update the screen reader text
  const srText = this.querySelector('.sr-only');
  if (srText) {
    srText.textContent = expanded ? 'Show details' : 'Hide details';
  }
  
  // Find the details element
  const controlsId = this.getAttribute('aria-controls');
  const details = document.getElementById(controlsId);
  
  // Get the issue ID for tracking the highlight
  const issueId = controlsId.replace('details-', '');
  
  // Toggle details visibility
  if (details) {
    details.classList.toggle('expanded');
    
    // When expanding
    if (!expanded) {
      // Only make focusable when expanding
      details.setAttribute('tabindex', '-1');
      
      // Ensure proper aria-labelledby
      const titleId = this.getAttribute('aria-labelledby');
      if (titleId && !details.getAttribute('aria-labelledby')) {
        details.setAttribute('aria-labelledby', titleId);
      }
      
      // Move focus to the details region after expanding
      // This helps screen readers navigate into the content
      details.focus();
      
      // Automatically highlight the element if there's a valid selector
      const highlightButton = details.querySelector('.highlight-button');
      if (highlightButton) {
        const selector = highlightButton.getAttribute('data-selector');
        if (selector && selector !== 'null' && selector !== 'undefined' && selector !== '') {
          // Use the highlight function to highlight the element with the issue ID
          highlightElement(selector, issueId);
        }
      }
    } else {
      // When collapsing
      // Remove tabindex when collapsing to avoid extra tab stops
      details.removeAttribute('tabindex');
      
      // Remove the highlight for this issue
      removeHighlight(issueId);
    }
  }
}

/**
 * Find the next accordion header in the document
 * @param {HTMLElement} currentHeader - The current accordion header
 * @returns {HTMLElement|null} - The next accordion header or null
 */
function findNextAccordionHeader(currentHeader) {
  const headers = Array.from(document.querySelectorAll('.accordion-header'));
  const currentIndex = headers.indexOf(currentHeader);
  
  if (currentIndex !== -1 && currentIndex < headers.length - 1) {
    return headers[currentIndex + 1];
  }
  
  return null;
}

/**
 * Find the previous accordion header in the document
 * @param {HTMLElement} currentHeader - The current accordion header
 * @returns {HTMLElement|null} - The previous accordion header or null
 */
function findPrevAccordionHeader(currentHeader) {
  const headers = Array.from(document.querySelectorAll('.accordion-header'));
  const currentIndex = headers.indexOf(currentHeader);
  
  if (currentIndex > 0) {
    return headers[currentIndex - 1];
  }
  
  return null;
}

/**
 * Remove highlight for an issue
 * @param {string} issueId - The issue ID to remove highlight for
 */
function removeHighlight(issueId) {
  // If we're in the DevTools panel context
  if (typeof chrome.devtools !== 'undefined') {
    console.log("Using DevTools inspectedWindow to remove highlight for", issueId);
    
    // Use chrome.devtools.inspectedWindow.eval to remove the highlight
    chrome.devtools.inspectedWindow.eval(
      `(function(issueId) {
        try {
          // First try to find the highlight by ID (the preferred way)
          const highlightId = "carnforth-highlight-" + issueId;
          const highlight = document.getElementById(highlightId);
          
          if (highlight) {
            console.log("Found highlight element with ID:", highlightId);
            // Remove event listeners if they exist
            if (highlight.removeEventListeners) {
              highlight.removeEventListeners();
            }
            // Remove from DOM
            highlight.remove();
            return true;
          }
          
          // If not found by ID, do a broader cleanup (in case the ID naming convention changed)
          // Check for any highlights that might be orphaned
          const allHighlights = document.querySelectorAll('.carnforth-highlight, [id^="carnforth-highlight-"]');
          if (allHighlights.length > 0) {
            console.log("Found", allHighlights.length, "potential highlight elements");
            allHighlights.forEach(h => {
              if (h.removeEventListeners) {
                h.removeEventListeners();
              }
              h.remove();
            });
            return true;
          }
          
          return false;
        } catch (error) {
          console.error("Error removing highlight:", error);
          return false;
        }
      })("${issueId}")`,
      function(result, isException) {
        if (isException) {
          console.error('Error removing highlight:', isException);
        } else if (result) {
          console.log('Successfully removed highlight for', issueId);
        } else {
          console.log('No highlight found for', issueId);
        }
      }
    );
  } else {
    // Fallback for non-DevTools context (should not be used in our case)
    console.log("Using direct content script messaging to remove highlight");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'removeHighlight',
        issueId: issueId
      });
    });
  }
}

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
  
  // If we're in the DevTools panel, use the global highlightElement from highlight.js
  // which uses chrome.devtools.inspectedWindow.eval
  if (typeof chrome.devtools !== 'undefined') {
    console.log("Using highlight.js's highlightElement for DevTools panel");
    // The global highlightElement is loaded from highlight.js in panel.html
    // This calls window.highlightElement which will use the proper implementation
    window.highlightElementFromHighlightJs(selector, issueId);
  } else {
    // Fallback to direct content script messaging if not in DevTools
    // This shouldn't be called in our current context
    console.log("Using direct content script messaging for highlighting");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'highlightElement',
        selector: selector,
        issueId: issueId
      });
    });
  }
}