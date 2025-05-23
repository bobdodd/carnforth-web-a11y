/**
 * Documentation System for Carnforth Web A11y
 * 
 * This module provides a reusable documentation mechanism that can be used
 * throughout the extension to provide educational content about touchpoints,
 * WCAG criteria, best practices, and more.
 */

// Documentation content for each touchpoint
const touchpointDocumentation = {
  maps: {
    title: 'Maps Touchpoint',
    overview: 'Evaluates digital maps for proper accessibility attributes and alternative content.',
    whatItTests: [
      'Iframe-based embedded maps (Google Maps, OpenStreetMap, etc.)',
      'JavaScript-rendered div maps (Mapbox GL, Leaflet, etc.)',
      'SVG maps and data visualizations',
      'Static map images',
      'Proper labeling with title, aria-label, or aria-labelledby',
      'Detection of maps hidden from assistive technology',
      'Interactive vs non-interactive map classification',
      'Landmark and heading context for div maps',
      'Generic or non-descriptive names'
    ],
    wcagCriteria: [
      { criterion: '1.1.1 Non-text Content', level: 'A', description: 'Maps need text alternatives' },
      { criterion: '1.3.1 Info and Relationships', level: 'A', description: 'Map structure must be programmatically determinable' },
      { criterion: '2.4.6 Headings and Labels', level: 'AA', description: 'Maps need descriptive labels' },
      { criterion: '4.1.2 Name, Role, Value', level: 'A', description: 'Interactive maps must have proper ARIA attributes' }
    ],
    commonIssues: [
      'Missing accessible names (title, aria-label)',
      'Using aria-hidden="true" on interactive maps',
      'Generic names like "Map" without context',
      'Div-based maps without proper ARIA roles',
      'Missing alt text on static map images'
    ],
    bestPractices: [
      'Always provide a descriptive title or aria-label that explains what the map shows',
      'Include the location or purpose in the accessible name (e.g., "Map of downtown Chicago office locations")',
      'For div-based maps, use role="application" for interactive maps or role="img" for static ones',
      'Ensure all map controls are keyboard accessible',
      'Provide alternative ways to access map information (tables, text descriptions)',
      'Never use aria-hidden="true" on interactive content'
    ],
    examples: {
      good: [
        {
          code: '<iframe src="https://maps.google.com/..." title="Interactive map showing University of Oxford campus location"></iframe>',
          explanation: 'Descriptive title that explains what the map shows'
        },
        {
          code: '<div role="application" aria-label="Interactive store locator map for Chicago area">\n  <!-- Map content -->\n</div>',
          explanation: 'Div-based map with proper role and descriptive label'
        }
      ],
      bad: [
        {
          code: '<iframe src="https://maps.google.com/..."></iframe>',
          explanation: 'Missing accessible name - screen readers have no context'
        },
        {
          code: '<iframe src="https://maps.google.com/..." title="Map" aria-hidden="true"></iframe>',
          explanation: 'Generic name and hidden from assistive technology'
        }
      ]
    },
    resources: [
      { title: 'WCAG 2.1 Understanding Non-text Content', url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html' },
      { title: 'Making Maps Accessible', url: 'https://www.w3.org/WAI/WCAG21/Techniques/general/G92' },
      { title: 'ARIA Authoring Practices', url: 'https://www.w3.org/TR/wai-aria-practices-1.1/' }
    ]
  },
  
  accessible_name: {
    title: 'Accessible Name Touchpoint',
    overview: 'Ensures all interactive elements have meaningful accessible names that describe their purpose.',
    whatItTests: [
      'Buttons, links, and form controls have accessible names',
      'Images with onclick handlers have appropriate alt text or ARIA labels',
      'Custom interactive elements have proper labeling',
      'Accessible names are meaningful and descriptive',
      'Avoidance of generic phrases like "click here" or "read more"'
    ],
    wcagCriteria: [
      { criterion: '2.4.4 Link Purpose (In Context)', level: 'A', description: 'Link text must describe the purpose' },
      { criterion: '2.4.9 Link Purpose (Link Only)', level: 'AAA', description: 'Link text alone should be descriptive' },
      { criterion: '3.3.2 Labels or Instructions', level: 'A', description: 'Form inputs need clear labels' },
      { criterion: '4.1.2 Name, Role, Value', level: 'A', description: 'All UI components need accessible names' }
    ],
    commonIssues: [
      'Buttons with only icons and no text or aria-label',
      'Form inputs with placeholder text but no label',
      'Links that say "click here" or "read more" without context',
      'Images with onclick but no alt text',
      'Custom elements missing ARIA labels'
    ],
    bestPractices: [
      'Use descriptive, action-oriented text for buttons',
      'Make link text describe the destination or action',
      'Always pair form inputs with visible labels',
      'For icon buttons, add aria-label or visually hidden text',
      'Avoid redundant phrases like "link to" or "button for"',
      'Test with a screen reader to verify names make sense'
    ]
  },
  
  tabindex: {
    title: 'Tabindex Touchpoint',
    overview: 'Evaluates the proper use of tabindex attributes to ensure keyboard navigation follows a logical order.',
    whatItTests: [
      'Detection of positive tabindex values (tabindex > 0)',
      'Identification of elements removed from tab order (tabindex="-1")',
      'Non-interactive elements with tabindex="0"',
      'Interactive elements unnecessarily assigned tabindex',
      'Missing keyboard accessibility for custom interactive elements'
    ],
    wcagCriteria: [
      { criterion: '2.1.1 Keyboard', level: 'A', description: 'All functionality must be keyboard accessible' },
      { criterion: '2.4.3 Focus Order', level: 'A', description: 'Focus order must be logical and meaningful' },
      { criterion: '3.2.2 On Input', level: 'A', description: 'Focus changes should not cause unexpected context changes' }
    ],
    commonIssues: [
      'Using positive tabindex values which disrupt natural focus order',
      'Interactive elements with tabindex="-1" that cannot be keyboard accessed',
      'Non-interactive elements like divs/spans with tabindex making them focusable',
      'Custom controls missing proper keyboard support'
    ],
    bestPractices: [
      'Avoid positive tabindex values - use DOM order for focus sequence',
      'Only use tabindex="-1" for elements that will receive focus programmatically',
      'Interactive elements rarely need explicit tabindex',
      'Ensure custom controls are fully keyboard accessible',
      'Test keyboard navigation without a mouse'
    ]
  },
  
  focus_management: {
    title: 'Focus Management Touchpoint',
    overview: 'Ensures proper focus management for dynamic content and single-page applications.',
    whatItTests: [
      'Focus moves appropriately when content changes',
      'Modal dialogs trap focus correctly',
      'Focus returns to trigger element when dialogs close',
      'Skip links and bypass blocks work correctly',
      'Focus is visible for all interactive elements'
    ],
    wcagCriteria: [
      { criterion: '2.4.3 Focus Order', level: 'A', description: 'Navigation sequences must be logical' },
      { criterion: '2.4.7 Focus Visible', level: 'AA', description: 'Keyboard focus indicator must be visible' },
      { criterion: '2.4.1 Bypass Blocks', level: 'A', description: 'Mechanisms to skip repeated content' }
    ],
    commonIssues: [
      'Focus not moving to new content in SPAs',
      'Modal dialogs allowing focus to escape',
      'Focus lost when content is removed',
      'Missing or low contrast focus indicators',
      'Skip links that don\'t work'
    ],
    bestPractices: [
      'Move focus to new content when routes change in SPAs',
      'Implement focus trapping for modal dialogs',
      'Return focus to trigger element when closing overlays',
      'Ensure all interactive elements have visible focus indicators',
      'Test focus management with keyboard only'
    ]
  }
  
  // Add more touchpoint documentation as needed
};

/**
 * Opens documentation in a modal dialog
 * @param {string} touchpointId - The touchpoint identifier
 */
function openDocumentationModal(touchpointId) {
  const doc = touchpointDocumentation[touchpointId];
  if (!doc) {
    console.warn(`No documentation found for touchpoint: ${touchpointId}`);
    return;
  }
  
  // Check if modal already exists
  let modal = document.getElementById('carnforth-doc-modal');
  if (!modal) {
    modal = createModal();
    document.body.appendChild(modal);
  }
  
  // Populate modal content
  populateModal(modal, doc, touchpointId);
  
  // Show modal
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  
  // Set focus to modal
  const closeButton = modal.querySelector('.modal-close');
  if (closeButton) {
    closeButton.focus();
  }
  
  // Trap focus within modal
  trapFocus(modal);
}

/**
 * Creates the modal structure
 */
function createModal() {
  const modal = document.createElement('div');
  modal.id = 'carnforth-doc-modal';
  modal.className = 'carnforth-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';
  
  const modalTitle = document.createElement('h2');
  modalTitle.id = 'modal-title';
  modalTitle.className = 'modal-title';
  modal.setAttribute('aria-labelledby', 'modal-title');
  
  const closeButton = document.createElement('button');
  closeButton.className = 'modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.setAttribute('aria-label', 'Close documentation');
  closeButton.onclick = closeDocumentationModal;
  
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);
  
  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  modalBody.id = 'modal-body';
  
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeDocumentationModal();
    }
  };
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      closeDocumentationModal();
    }
  });
  
  return modal;
}

/**
 * Populates the modal with documentation content
 */
function populateModal(modal, doc, touchpointId) {
  const title = modal.querySelector('.modal-title');
  const body = modal.querySelector('.modal-body');
  
  title.textContent = doc.title + ' Documentation';
  
  // Clear previous content
  body.innerHTML = '';
  
  // Overview section
  const overviewSection = document.createElement('section');
  overviewSection.innerHTML = `
    <h3>Overview</h3>
    <p>${doc.overview}</p>
  `;
  body.appendChild(overviewSection);
  
  // What it tests
  const testsSection = document.createElement('section');
  testsSection.innerHTML = `
    <h3>What This Touchpoint Tests</h3>
    <ul>
      ${doc.whatItTests.map(test => `<li>${test}</li>`).join('')}
    </ul>
  `;
  body.appendChild(testsSection);
  
  // WCAG criteria
  const wcagSection = document.createElement('section');
  wcagSection.innerHTML = `
    <h3>WCAG Success Criteria</h3>
    <ul>
      ${doc.wcagCriteria.map(criteria => `
        <li>
          <strong>${criteria.criterion}</strong> (Level ${criteria.level})<br>
          <span class="criteria-description">${criteria.description}</span>
        </li>
      `).join('')}
    </ul>
  `;
  body.appendChild(wcagSection);
  
  // Common issues
  const issuesSection = document.createElement('section');
  issuesSection.innerHTML = `
    <h3>Common Issues Detected</h3>
    <ul>
      ${doc.commonIssues.map(issue => `<li>${issue}</li>`).join('')}
    </ul>
  `;
  body.appendChild(issuesSection);
  
  // Best practices
  const practicesSection = document.createElement('section');
  practicesSection.innerHTML = `
    <h3>Best Practices</h3>
    <ul>
      ${doc.bestPractices.map(practice => `<li>${practice}</li>`).join('')}
    </ul>
  `;
  body.appendChild(practicesSection);
  
  // Examples (if available)
  if (doc.examples) {
    const examplesSection = document.createElement('section');
    examplesSection.innerHTML = `
      <h3>Examples</h3>
      <div class="examples-container">
        <div class="good-examples">
          <h4>✅ Good Examples</h4>
          ${doc.examples.good.map(ex => `
            <div class="example">
              <pre><code>${escapeHtml(ex.code)}</code></pre>
              <p class="example-explanation">${ex.explanation}</p>
            </div>
          `).join('')}
        </div>
        <div class="bad-examples">
          <h4>❌ Bad Examples</h4>
          ${doc.examples.bad.map(ex => `
            <div class="example">
              <pre><code>${escapeHtml(ex.code)}</code></pre>
              <p class="example-explanation">${ex.explanation}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    body.appendChild(examplesSection);
  }
  
  // Resources (if available)
  if (doc.resources) {
    const resourcesSection = document.createElement('section');
    resourcesSection.innerHTML = `
      <h3>Learn More</h3>
      <ul>
        ${doc.resources.map(resource => `
          <li><a href="${resource.url}" target="_blank" rel="noopener noreferrer">${resource.title}</a></li>
        `).join('')}
      </ul>
    `;
    body.appendChild(resourcesSection);
  }
}

/**
 * Closes the documentation modal
 */
function closeDocumentationModal() {
  const modal = document.getElementById('carnforth-doc-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    
    // Return focus to the help button that opened it
    const lastFocusedButton = document.activeElement;
    if (lastFocusedButton && lastFocusedButton.classList.contains('help-button')) {
      lastFocusedButton.focus();
    }
  }
}

/**
 * Traps focus within the modal
 */
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  });
}

/**
 * Escapes HTML for safe display
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Creates a help button for touchpoint documentation
 */
function createHelpButton(touchpointId) {
  const button = document.createElement('button');
  button.className = 'help-button';
  button.setAttribute('aria-label', `Help for ${touchpointId.replace(/_/g, ' ')} touchpoint`);
  button.innerHTML = '<span aria-hidden="true">?</span>';
  button.onclick = (e) => {
    e.stopPropagation(); // Prevent accordion toggle
    openDocumentationModal(touchpointId);
  };
  return button;
}

// Export functions for use in other modules
window.CarnforthDocumentation = {
  openDocumentationModal,
  createHelpButton,
  touchpointDocumentation
};