/**
 * Main panel functionality for Carnforth Web A11y extension
 */

// Store test results globally to be accessed by export functions
let currentTestResults = null;

document.addEventListener('DOMContentLoaded', function() {
  const startTestButton = document.getElementById('start-test');
  const exportJsonButton = document.getElementById('export-json');
  const exportExcelButton = document.getElementById('export-excel');
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
    
    // Reset button states
    startTestButton.disabled = false;
    startTestButton.textContent = 'Start Test';
    
    // Disable export buttons
    exportJsonButton.disabled = true;
    exportExcelButton.disabled = true;
    
    // Clear current results
    currentTestResults = null;
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

    // For development, use mock test results
    try {
      // Get the mock test results
      const results = getMockTestResults();
      
      // Store results for export
      currentTestResults = results;
      
      // Display results in UI
      displayResults(results);
      updateSummary(results);
      
      // Update button states
      startTestButton.disabled = false;
      startTestButton.textContent = 'Start Test';
      
      // Enable export buttons
      exportJsonButton.disabled = false;
      exportExcelButton.disabled = false;
    } catch (error) {
      resultsContainer.innerHTML = `<p class="results-message error">Error running tests: ${error.message}</p>`;
      console.error('Error running tests:', error);
      startTestButton.disabled = false;
      startTestButton.textContent = 'Start Test';
      
      // Disable export buttons
      exportJsonButton.disabled = true;
      exportExcelButton.disabled = true;
    }
    
    // When ready to connect to real tests, uncomment this:
    /*
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
    */
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

    // 1. Add issue description (required for all types)
    const description = document.createElement('p');
    description.className = 'issue-description';
    description.textContent = issue.description;
    details.appendChild(description);

    // 2. Add impact information (required for fail and warning)
    if ((issue.type === 'fail' || issue.type === 'warning') && issue.impact) {
      const impactSection = document.createElement('div');
      impactSection.className = 'issue-impact';
      
      const impactTitle = document.createElement('h4');
      impactTitle.textContent = 'Impact';
      impactSection.appendChild(impactTitle);

      // Who is affected
      if (issue.impact.who) {
        const whoSection = document.createElement('div');
        whoSection.className = 'impact-who';
        
        const whoLabel = document.createElement('strong');
        whoLabel.textContent = 'Affects: ';
        whoSection.appendChild(whoLabel);
        
        const whoText = document.createTextNode(issue.impact.who);
        whoSection.appendChild(whoText);
        
        impactSection.appendChild(whoSection);
      }

      // Severity
      if (issue.impact.severity) {
        const severitySection = document.createElement('div');
        severitySection.className = 'impact-severity';
        
        const severityLabel = document.createElement('strong');
        severityLabel.textContent = 'Severity: ';
        severitySection.appendChild(severityLabel);
        
        const severityText = document.createTextNode(issue.impact.severity);
        severitySection.appendChild(severityText);
        
        impactSection.appendChild(severitySection);
      }

      // Why it matters
      if (issue.impact.why) {
        const whySection = document.createElement('div');
        whySection.className = 'impact-why';
        
        const whyLabel = document.createElement('strong');
        whyLabel.textContent = 'Why it matters: ';
        whySection.appendChild(whyLabel);
        
        const whyText = document.createTextNode(issue.impact.why);
        whySection.appendChild(whyText);
        
        impactSection.appendChild(whySection);
      }

      details.appendChild(impactSection);
    }

    // 3. Add WCAG information if present
    if (issue.wcag) {
      const wcagSection = document.createElement('div');
      wcagSection.className = 'issue-wcag';
      
      const wcagTitle = document.createElement('h4');
      wcagTitle.textContent = 'WCAG Reference';
      wcagSection.appendChild(wcagTitle);

      const wcagInfo = document.createElement('div');
      let wcagText = '';
      
      if (issue.wcag.principle) {
        wcagText += `Principle: ${issue.wcag.principle}\n`;
      }
      
      if (issue.wcag.guideline) {
        wcagText += `Guideline: ${issue.wcag.guideline}\n`;
      }
      
      if (issue.wcag.successCriterion) {
        wcagText += `Success Criterion: ${issue.wcag.successCriterion}`;
        if (issue.wcag.level) {
          wcagText += ` (Level ${issue.wcag.level})`;
        }
      }
      
      wcagInfo.textContent = wcagText;
      wcagSection.appendChild(wcagInfo);
      
      details.appendChild(wcagSection);
    }

    // 4. Add remediation steps if present (required for fail and warning)
    if ((issue.type === 'fail' || issue.type === 'warning') && issue.remediation && issue.remediation.length > 0) {
      const remediationSection = document.createElement('div');
      remediationSection.className = 'issue-remediation';
      
      const remediationTitle = document.createElement('h4');
      remediationTitle.textContent = 'How to Fix';
      remediationSection.appendChild(remediationTitle);

      const remediationList = document.createElement('ol');
      remediationList.className = 'remediation-steps';
      
      issue.remediation.forEach(step => {
        const listItem = document.createElement('li');
        listItem.textContent = step;
        remediationList.appendChild(listItem);
      });
      
      remediationSection.appendChild(remediationList);
      details.appendChild(remediationSection);
    }

    // 5. Add technical details (selector/xpath and HTML)
    if (issue.selector || issue.xpath || issue.html) {
      const technicalSection = document.createElement('div');
      technicalSection.className = 'issue-technical';
      
      const technicalTitle = document.createElement('h4');
      technicalTitle.textContent = 'Technical Details';
      technicalSection.appendChild(technicalTitle);

      // Add selector if present
      if (issue.selector) {
        const selectorLabel = document.createElement('div');
        selectorLabel.className = 'technical-label';
        selectorLabel.textContent = 'CSS Selector:';
        technicalSection.appendChild(selectorLabel);
        
        const selector = document.createElement('pre');
        selector.className = 'issue-selector';
        selector.textContent = issue.selector;
        technicalSection.appendChild(selector);
      }
      
      // Add XPath if present
      if (issue.xpath) {
        const xpathLabel = document.createElement('div');
        xpathLabel.className = 'technical-label';
        xpathLabel.textContent = 'XPath:';
        technicalSection.appendChild(xpathLabel);
        
        const xpath = document.createElement('pre');
        xpath.className = 'issue-xpath';
        xpath.textContent = issue.xpath;
        technicalSection.appendChild(xpath);
      }

      // Add HTML fragment if present
      if (issue.html) {
        const htmlLabel = document.createElement('div');
        htmlLabel.className = 'technical-label';
        htmlLabel.textContent = 'Current HTML:';
        technicalSection.appendChild(htmlLabel);
        
        const html = document.createElement('pre');
        html.className = 'issue-html';
        html.textContent = issue.html;
        technicalSection.appendChild(html);
      }
      
      // Add fixed HTML example if present
      if (issue.fixedHtml) {
        const fixedHtmlLabel = document.createElement('div');
        fixedHtmlLabel.className = 'technical-label';
        fixedHtmlLabel.textContent = 'Example Fix:';
        technicalSection.appendChild(fixedHtmlLabel);
        
        const fixedHtml = document.createElement('pre');
        fixedHtml.className = 'issue-fixed-html';
        fixedHtml.textContent = issue.fixedHtml;
        technicalSection.appendChild(fixedHtml);
      }
      
      details.appendChild(technicalSection);
    }
    
    // 6. Add resources if present
    if (issue.resources && issue.resources.length > 0) {
      const resourcesSection = document.createElement('div');
      resourcesSection.className = 'issue-resources';
      
      const resourcesTitle = document.createElement('h4');
      resourcesTitle.textContent = 'Resources';
      resourcesSection.appendChild(resourcesTitle);

      const resourcesList = document.createElement('ul');
      resourcesList.className = 'resources-list';
      
      issue.resources.forEach(resource => {
        const listItem = document.createElement('li');
        
        if (resource.url) {
          const link = document.createElement('a');
          link.textContent = resource.title || resource.url;
          link.href = resource.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          listItem.appendChild(link);
        } else {
          listItem.textContent = resource.title;
        }
        
        resourcesList.appendChild(listItem);
      });
      
      resourcesSection.appendChild(resourcesList);
      details.appendChild(resourcesSection);
    }
    
    // 7. Add highlight button if selector is present
    if (issue.selector) {
      const actionSection = document.createElement('div');
      actionSection.className = 'issue-actions';
      
      const highlightButton = document.createElement('button');
      highlightButton.className = 'highlight-button';
      highlightButton.textContent = 'Highlight Element';
      highlightButton.setAttribute('data-selector', issue.selector);
      actionSection.appendChild(highlightButton);
      
      details.appendChild(actionSection);
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
  
  /**
   * Export results as JSON file
   */
  function exportAsJson() {
    if (!currentTestResults) {
      console.error('No test results to export');
      return;
    }
    
    // Get the actual URL from the inspected window
    chrome.devtools.inspectedWindow.eval('window.location.href', (result, isException) => {
      if (isException) {
        console.error('Error getting page URL:', isException);
        performJsonExport("Unknown");
      } else {
        performJsonExport(result);
      }
    });
  }
  
  /**
   * Perform the JSON export after getting the URL
   * @param {string} pageUrl - The URL of the inspected page
   */
  function performJsonExport(pageUrl) {
    try {
      // Add page URL and timestamp to the export
      const exportData = {
        url: pageUrl,
        timestamp: new Date().toISOString(),
        title: document.title || "Unknown Page Title",
        results: currentTestResults
      };
      
      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `a11y-results-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Failed to export JSON: ' + error.message);
    }
  }
  
  /**
   * Export results as Excel (CSV) file
   */
  function exportAsExcel() {
    if (!currentTestResults) {
      console.error('No test results to export');
      return;
    }
    
    // Get the actual URL from the inspected window
    chrome.devtools.inspectedWindow.eval('window.location.href', (result, isException) => {
      if (isException) {
        console.error('Error getting page URL:', isException);
        performExcelExport("Unknown");
      } else {
        performExcelExport(result);
      }
    });
  }
  
  /**
   * Perform the Excel (CSV) export after getting the URL
   * @param {string} pageUrl - The URL of the inspected page
   */
  function performExcelExport(pageUrl) {
    try {
      // Create formatted date for CSV
      const currentDate = new Date().toISOString().split('T')[0];
      
      // CSV header with metadata
      let csv = 'Metadata\n';
      csv += `URL,${pageUrl}\n`;
      csv += `Date,${currentDate}\n`;
      csv += `Time,${new Date().toISOString().split('T')[1].split('.')[0]}\n`;
      csv += '\n'; // Empty row as separator
      
      // Main data header
      csv += 'Touchpoint,Issue Type,Title,Description,Who it Affects,Severity,Why it Matters,Selector,XPath\n';
      
      // Add rows for each issue
      Object.entries(currentTestResults).forEach(([touchpoint, data]) => {
        const touchpointName = touchpoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        (data.issues || []).forEach(issue => {
          // Escape any commas in fields
          const escapeField = field => {
            if (field === null || field === undefined) return '';
            return `"${String(field).replace(/"/g, '""')}"`;
          };
          
          // Create CSV row
          const row = [
            escapeField(touchpointName),
            escapeField(issue.type),
            escapeField(issue.title),
            escapeField(issue.description),
            escapeField(issue.impact?.who || ''),
            escapeField(issue.impact?.severity || ''),
            escapeField(issue.impact?.why || ''),
            escapeField(issue.selector || ''),
            escapeField(issue.xpath || '')
          ].join(',');
          
          csv += row + '\n';
        });
      });
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `a11y-results-${currentDate}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV: ' + error.message);
    }
  }
  
  // Add event listeners for export buttons
  exportJsonButton.addEventListener('click', exportAsJson);
  exportExcelButton.addEventListener('click', exportAsExcel);
});