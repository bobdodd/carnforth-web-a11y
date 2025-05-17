/**
 * Main panel functionality for Carnforth Web A11y extension
 */

document.addEventListener('DOMContentLoaded', function() {
  const startTestButton = document.getElementById('start-test');
  const resultsContainer = document.getElementById('results-container');
  const failCount = document.getElementById('fail-count');
  const warningCount = document.getElementById('warning-count');
  const infoCount = document.getElementById('info-count');

  // Initialize to default state
  function resetUI() {
    // Reset result counts
    failCount.textContent = '0 Fails';
    warningCount.textContent = '0 Warnings';
    infoCount.textContent = '0 Info';
    
    // Reset results container
    resultsContainer.innerHTML = '';
    
    // Reset button state
    startTestButton.disabled = false;
    startTestButton.textContent = 'Start Test';
  }
  
  // Reset UI on page load
  resetUI();
  
  // Listen for URL changes or page refreshes
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'resetPanel') {
      resetUI();
    }
  });

  // Listen for test button click
  startTestButton.addEventListener('click', function() {
    // Show loading state
    startTestButton.disabled = true;
    startTestButton.textContent = 'Running tests...';
    resultsContainer.innerHTML = '<p class="results-message">Analyzing page for accessibility issues...</p>';
    
    // Reset counts
    failCount.textContent = '0 Fails';
    warningCount.textContent = '0 Warnings';
    infoCount.textContent = '0 Info';

    // Run the accessibility tests
    runAllTests().then(function(results) {
      displayResults(results);
      updateSummary(results);
      startTestButton.disabled = false;
      startTestButton.textContent = 'Start Test';
    }).catch(function(error) {
      resultsContainer.innerHTML = `<p class="results-message error">Error running tests: ${error.message}</p>`;
      startTestButton.disabled = false;
      startTestButton.textContent = 'Start Test';
    });
  });

  /**
   * Display the test results in the panel
   * @param {Object} results - Test results organized by touchpoint
   */
  function displayResults(results) {
    if (!results || Object.keys(results).length === 0) {
      resultsContainer.innerHTML = '<p class="results-message">No accessibility issues detected.</p>';
      return;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Sort touchpoints alphabetically
    const sortedTouchpoints = Object.keys(results).sort();

    // Create accordion for each touchpoint
    sortedTouchpoints.forEach(touchpoint => {
      const touchpointData = results[touchpoint];
      const issues = touchpointData.issues || [];
      
      if (issues.length === 0) {
        return; // Skip touchpoints with no issues
      }

      // Create accordion section
      const accordion = createAccordionSection(
        touchpoint, 
        touchpointData.description, 
        issues
      );
      
      resultsContainer.appendChild(accordion);
    });

    // Initialize accordion functionality
    initializeAccordions();
    initializeIssueDisclosures();
    initializeHighlightButtons();
  }

  /**
   * Create an accordion section for a touchpoint
   * @param {string} touchpoint - Touchpoint name
   * @param {string} description - Touchpoint description
   * @param {Array} issues - Array of issues found
   * @returns {HTMLElement} - The accordion element
   */
  function createAccordionSection(touchpoint, description, issues) {
    // Format touchpoint name for display
    const displayName = touchpoint
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    // Count issues by type
    const counts = {
      fail: 0,
      warning: 0,
      info: 0
    };

    issues.forEach(issue => {
      counts[issue.type]++;
    });

    // Create accordion element
    const accordion = document.createElement('div');
    accordion.className = 'accordion';
    accordion.setAttribute('id', `accordion-${touchpoint}`);

    // Create accordion header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `content-${touchpoint}`);
    header.setAttribute('tabindex', '0');

    // Add expand/collapse icon
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.innerHTML = '▶';
    icon.setAttribute('aria-hidden', 'true');
    header.appendChild(icon);

    // Add touchpoint name
    const title = document.createElement('h2');
    title.className = 'accordion-title';
    title.textContent = displayName;
    header.appendChild(title);

    // Add summary dots
    const summary = document.createElement('div');
    summary.className = 'accordion-summary';

    if (counts.fail > 0) {
      const failDot = document.createElement('span');
      failDot.className = 'dot fail';
      failDot.textContent = counts.fail.toString();
      failDot.setAttribute('title', `${counts.fail} Failures`);
      failDot.setAttribute('aria-label', `${counts.fail} Failures`);
      summary.appendChild(failDot);
    }

    if (counts.warning > 0) {
      const warnDot = document.createElement('span');
      warnDot.className = 'dot warning';
      warnDot.textContent = counts.warning.toString();
      warnDot.setAttribute('title', `${counts.warning} Warnings`);
      warnDot.setAttribute('aria-label', `${counts.warning} Warnings`);
      summary.appendChild(warnDot);
    }

    if (counts.info > 0) {
      const infoDot = document.createElement('span');
      infoDot.className = 'dot info';
      infoDot.textContent = counts.info.toString();
      infoDot.setAttribute('title', `${counts.info} Information items`);
      infoDot.setAttribute('aria-label', `${counts.info} Information items`);
      summary.appendChild(infoDot);
    }

    header.appendChild(summary);
    
    // Add a spacer to push any future elements to the right
    const spacer = document.createElement('div');
    spacer.className = 'accordion-spacer';
    header.appendChild(spacer);
    
    accordion.appendChild(header);

    // Create accordion content
    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.setAttribute('id', `content-${touchpoint}`);
    content.setAttribute('role', 'region');
    content.setAttribute('aria-labelledby', `header-${touchpoint}`);

    // Add touchpoint description
    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'touchpoint-description';
    descriptionElement.textContent = description;
    content.appendChild(descriptionElement);

    // Create issue list
    const issueList = document.createElement('ul');
    issueList.className = 'issue-list';

    // First, group issues by type
    const issuesByType = {
      fail: issues.filter(issue => issue.type === 'fail'),
      warning: issues.filter(issue => issue.type === 'warning'),
      info: issues.filter(issue => issue.type === 'info')
    };
    
    // Sort each group alphabetically by title
    Object.keys(issuesByType).forEach(type => {
      issuesByType[type].sort((a, b) => a.title.localeCompare(b.title));
    });
    
    // Combine the groups in priority order: fails, warnings, info
    const sortedIssues = [
      ...issuesByType.fail,
      ...issuesByType.warning,
      ...issuesByType.info
    ];

    // Add each issue to the list
    sortedIssues.forEach((issue, index) => {
      const issueItem = createIssueElement(issue, touchpoint, index);
      issueList.appendChild(issueItem);
    });

    content.appendChild(issueList);
    accordion.appendChild(content);

    return accordion;
  }

  /**
   * Create an element for a single issue
   * @param {Object} issue - The issue data
   * @param {string} touchpoint - The touchpoint name
   * @param {number} index - The issue index
   * @returns {HTMLElement} - The issue list item
   */
  function createIssueElement(issue, touchpoint, index) {
    const issueItem = document.createElement('li');
    issueItem.className = 'issue-item';

    // Create issue header
    const issueHeader = document.createElement('div');
    issueHeader.className = 'issue-header';
    issueHeader.setAttribute('role', 'button');
    issueHeader.setAttribute('aria-expanded', 'false');
    issueHeader.setAttribute('aria-controls', `details-${touchpoint}-${index}`);
    issueHeader.setAttribute('tabindex', '0');

    // Add type indicator
    const bullet = document.createElement('span');
    bullet.className = `issue-bullet ${issue.type}`;
    bullet.textContent = issue.type === 'fail' ? 'F' : issue.type === 'warning' ? 'W' : 'I';
    bullet.setAttribute('aria-hidden', 'true');
    issueHeader.appendChild(bullet);

    // Add issue title
    const title = document.createElement('h3');
    title.className = 'issue-title';
    title.textContent = issue.title;
    issueHeader.appendChild(title);

    issueItem.appendChild(issueHeader);

    // Create issue details
    const details = document.createElement('div');
    details.className = 'issue-details';
    details.setAttribute('id', `details-${touchpoint}-${index}`);

    // Add issue description
    const description = document.createElement('p');
    description.className = 'issue-description';
    description.textContent = issue.description;
    details.appendChild(description);

    // Add selector if present
    if (issue.selector) {
      const selector = document.createElement('div');
      selector.className = 'issue-selector';
      selector.textContent = issue.selector;
      details.appendChild(selector);
    }

    // Add HTML fragment if present
    if (issue.html) {
      const html = document.createElement('pre');
      html.className = 'issue-html';
      html.textContent = issue.html;
      details.appendChild(html);
    }

    // Add highlight button if selector is present
    if (issue.selector) {
      const highlightButton = document.createElement('button');
      highlightButton.className = 'highlight-button';
      highlightButton.textContent = 'Highlight Element';
      highlightButton.setAttribute('data-selector', issue.selector);
      details.appendChild(highlightButton);
    }

    issueItem.appendChild(details);

    return issueItem;
  }

  /**
   * Update the summary counts
   * @param {Object} results - Test results
   */
  function updateSummary(results) {
    let fails = 0;
    let warnings = 0;
    let infos = 0;

    // Count all issues by type
    Object.values(results).forEach(touchpoint => {
      (touchpoint.issues || []).forEach(issue => {
        if (issue.type === 'fail') fails++;
        else if (issue.type === 'warning') warnings++;
        else if (issue.type === 'info') infos++;
      });
    });

    // Update the count displays
    failCount.textContent = `${fails} ${fails === 1 ? 'Fail' : 'Fails'}`;
    warningCount.textContent = `${warnings} ${warnings === 1 ? 'Warning' : 'Warnings'}`;
    infoCount.textContent = `${infos} ${infos === 1 ? 'Info' : 'Info'}`;
  }
});