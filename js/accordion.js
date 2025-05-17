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
  
  // Toggle details visibility
  if (details) {
    details.classList.toggle('expanded');
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