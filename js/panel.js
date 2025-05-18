/**
 * Main panel functionality for Carnforth Web A11y extension
 */

// Store test results globally to be accessed by export functions
let currentTestResults = null;

document.addEventListener('DOMContentLoaded', function() {
  const startTestButton = document.getElementById('start-test');
  const exportBar = document.querySelector('.export-bar');
  const exportJsonButton = document.getElementById('export-json');
  const exportExcelButton = document.getElementById('export-excel');
  const exportHtmlButton = document.getElementById('export-html');
  const resultsContainer = document.getElementById('results-container');
  const failCount = document.getElementById('fail-count');
  const warningCount = document.getElementById('warning-count');
  const infoCount = document.getElementById('info-count');
  const testStatus = document.getElementById('test-status');

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
    
    // Hide export bar and disable export buttons
    exportBar.classList.add('hidden');
    exportJsonButton.disabled = true;
    exportExcelButton.disabled = true;
    exportHtmlButton.disabled = true;
    
    // Clear current results and test status
    currentTestResults = null;
    testStatus.textContent = '';
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
    
    // Update aria-live region to announce testing has started
    testStatus.textContent = 'Analyzing page for accessibility issues. Please wait while testing is in progress.';
    
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
      
      // Show export bar and enable export buttons
      exportBar.classList.remove('hidden');
      exportJsonButton.disabled = false;
      exportExcelButton.disabled = false;
      exportHtmlButton.disabled = false;
      
      // The updateSummary function will handle the status announcement
    } catch (error) {
      resultsContainer.innerHTML = `<p class="results-message error">Error running tests: ${error.message}</p>`;
      console.error('Error running tests:', error);
      startTestButton.disabled = false;
      startTestButton.textContent = 'Start Test';
      
      // Hide export bar and disable export buttons
      exportBar.classList.add('hidden');
      exportJsonButton.disabled = true;
      exportExcelButton.disabled = true;
      exportHtmlButton.disabled = true;
      
      // Update status for screen reader to announce test error
      testStatus.textContent = `Error running tests: ${error.message}. Please try again.`;
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
    header.setAttribute('id', `header-${touchpoint}`);
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
      const failCount = document.createElement('span');
      failCount.className = 'count fail';
      failCount.textContent = `${counts.fail} ${counts.fail === 1 ? 'Fail' : 'Fails'}`;
      failCount.setAttribute('title', `${counts.fail} ${counts.fail === 1 ? 'Failure' : 'Failures'}`);
      summary.appendChild(failCount);
    }

    if (counts.warning > 0) {
      const warnCount = document.createElement('span');
      warnCount.className = 'count warning';
      warnCount.textContent = `${counts.warning} ${counts.warning === 1 ? 'Warning' : 'Warnings'}`;
      warnCount.setAttribute('title', `${counts.warning} ${counts.warning === 1 ? 'Warning' : 'Warnings'}`);
      summary.appendChild(warnCount);
    }

    if (counts.info > 0) {
      const infoCount = document.createElement('span');
      infoCount.className = 'count info';
      infoCount.textContent = `${counts.info} ${counts.info === 1 ? 'Info' : 'Info'}`;
      infoCount.setAttribute('title', `${counts.info} Information ${counts.info === 1 ? 'item' : 'items'}`);
      summary.appendChild(infoCount);
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
    
    // Create disclosure button that will contain the heading
    const disclosureBtn = document.createElement('button');
    disclosureBtn.className = 'issue-disclosure-btn';
    disclosureBtn.setAttribute('aria-expanded', 'false');
    disclosureBtn.setAttribute('aria-controls', `details-${touchpoint}-${index}`);
    
    // Add issue title heading within the button
    const title = document.createElement('h3');
    title.className = 'issue-title';
    title.id = `issue-title-${touchpoint}-${index}`;
    
    // Add type indicator inside the heading
    const bullet = document.createElement('span');
    bullet.className = `issue-bullet ${issue.type}`;
    bullet.textContent = issue.type === 'fail' ? 'F' : issue.type === 'warning' ? 'W' : 'I';
    // Hide the bullet letter from screen readers as we have the semantic label
    bullet.setAttribute('aria-hidden', 'true');
    
    // Create a screen reader text that announces the type
    const srType = document.createElement('span');
    srType.className = 'issue-type-label';
    srType.textContent = issue.type === 'fail' ? 'Fail: ' : issue.type === 'warning' ? 'Warning: ' : 'Info: ';
    
    // Append the bullet and type label to the title
    title.appendChild(bullet);
    title.appendChild(srType);
    
    // Add the issue title text
    const titleText = document.createTextNode(issue.title);
    title.appendChild(titleText);
    
    // Add the heading to the button
    disclosureBtn.appendChild(title);
    
    issueItem.appendChild(disclosureBtn);

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
    
    // 7. Create a hidden element to store the selector for auto-highlighting
    if (issue.selector && issue.selector !== 'null' && issue.selector !== 'undefined' && issue.selector !== '') {
      // Create a hidden highlight button with the selector data
      // This is used by the toggleIssueDetails function
      const highlightDataElement = document.createElement('button');
      highlightDataElement.className = 'highlight-button sr-only';
      highlightDataElement.textContent = 'Highlight Element';
      highlightDataElement.setAttribute('data-selector', issue.selector);
      highlightDataElement.setAttribute('aria-hidden', 'true');
      highlightDataElement.setAttribute('tabindex', '-1');
      details.appendChild(highlightDataElement);
      
      // Add a note about automatic highlighting only if there's a valid selector
      const autoHighlightNote = document.createElement('p');
      autoHighlightNote.className = 'auto-highlight-note';
      autoHighlightNote.innerHTML = `<em>Element is automatically highlighted in the page.</em>`;
      details.appendChild(autoHighlightNote);
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
    
    // Create a more descriptive announcement for screen readers
    // Use the preferred order: fail > warn > info
    const summaryText = `Testing complete. Found ${fails} ${fails === 1 ? 'failure' : 'failures'}, ${warnings} ${warnings === 1 ? 'warning' : 'warnings'}, and ${infos} information ${infos === 1 ? 'item' : 'items'}.`;
    testStatus.textContent = summaryText;
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
  
  /**
   * Export results as an accessible HTML file with everything embedded
   */
  function exportAsHtml() {
    if (!currentTestResults) {
      console.error('No test results to export');
      return;
    }
    
    // Get the actual URL from the inspected window
    chrome.devtools.inspectedWindow.eval('window.location.href', (result, isException) => {
      if (isException) {
        console.error('Error getting page URL:', isException);
        performHtmlExport("Unknown");
      } else {
        performHtmlExport(result);
      }
    });
  }
  
  /**
   * Perform the HTML export after getting the URL
   * @param {string} pageUrl - The URL of the inspected page
   */
  function performHtmlExport(pageUrl) {
    try {
      // Get current date and time
      const now = new Date();
      const date = now.toLocaleDateString();
      const time = now.toLocaleTimeString();
      
      // Create the HTML template with embedded CSS
      let htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Audit - ${pageUrl}</title>
  <style>
    /* Reset and base styles */
    :root {
      --background-color: #ffffff;
      --fail-color: #9a0000;
      --warning-color: #6d4c00;
      --info-color: #0d47a1;
      --text-color: #222222;
      --border-color: #757575;
      --focus-outline-color: #0d47a1;
      --fail-bg-color: #e53935;
      --warning-bg-color: #ffb300;
      --info-bg-color: #1e88e5;
      --padding-small: 0.5rem;
      --padding-medium: 0.75rem;
      --padding-large: 1rem;
      --margin-small: 0.25rem;
      --margin-medium: 0.5rem;
      --margin-large: 1rem;
      --border-radius-small: 0.25rem;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 1rem;
      line-height: 1.5;
      color: var(--text-color);
      background-color: var(--background-color);
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1, h2, h3, h4 {
      margin-bottom: 1rem;
    }
    
    h1 {
      font-size: 1.75rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    
    h2 {
      font-size: 1.5rem;
      margin-top: 2rem;
    }
    
    h3 {
      font-size: 1.25rem;
      margin-top: 1.5rem;
    }
    
    h4 {
      font-size: 1.1rem;
      margin-top: 1rem;
    }
    
    p {
      margin-bottom: 1rem;
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      padding: 8px;
      z-index: 100;
      background: #ffffff;
      color: var(--info-color);
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-small);
      transition: top 0.2s;
    }
    
    .skip-link:focus {
      top: 0;
      outline: 2px solid var(--focus-outline-color);
    }
    
    .meta-info {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 0.25rem;
      margin-bottom: 2rem;
    }
    
    .meta-info dt {
      font-weight: bold;
      margin-top: 0.5rem;
    }
    
    .meta-info dd {
      margin-left: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .summary {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    
    .summary div {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid;
    }
    
    .summary h2 {
      margin-top: 0;
      margin-bottom: 0.25rem;
    }
    
    .summary .count {
      font-size: 2rem;
      font-weight: bold;
    }
    
    .fail {
      color: #7a0000; /* Darker red to ensure 4.5:1 contrast ratio on white background */
      border-color: var(--fail-color);
      background-color: rgba(229, 57, 53, 0.1);
    }
    
    .warning {
      color: var(--warning-color);
      border-color: var(--warning-color);
      background-color: rgba(255, 179, 0, 0.1);
    }
    
    .info {
      color: var(--info-color);
      border-color: var(--info-color);
      background-color: rgba(30, 136, 229, 0.1);
    }
    
    .touchpoint {
      margin-bottom: 3rem;
      border: 1px solid var(--border-color);
      border-radius: 0.25rem;
    }
    
    .touchpoint-header {
      background-color: #f5f5f5;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
    }
    
    .touchpoint-title {
      margin: 0;
      margin-right: 1rem; /* Space between title and counts */
    }
    
    .touchpoint-counts {
      display: flex;
      gap: 0.5rem;
      /* No floating needed as flexbox handles this naturally */
    }
    
    .count-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: bold;
      border: 1px solid;
    }
    
    .count-badge.fail {
      color: #7a0000; /* Darker red to ensure 4.5:1 contrast ratio */
    }
    
    .count-badge.warning {
      color: var(--warning-color);
    }
    
    .count-badge.info {
      color: var(--info-color);
    }
    
    .touchpoint-body {
      padding: 1rem;
    }
    
    .touchpoint-description {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #f9f9f9;
      border-radius: 0.25rem;
    }
    
    .issue {
      margin-bottom: 2rem;
      border: 1px solid var(--border-color);
      border-radius: 0.25rem;
    }
    
    .issue-header {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .issue-bullet {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }
    
    .issue-bullet.fail {
      background-color: #b71c1c; /* Darker red background to ensure better contrast with white text */
    }
    
    .issue-bullet.warning {
      background-color: var(--warning-bg-color);
      color: black; /* Already has good contrast */
    }
    
    .issue-bullet.info {
      background-color: #0d47a1; /* Darker blue background for better contrast with white text */
    }
    
    .issue-title {
      margin: 0;
      font-size: 1.1rem;
    }
    
    .issue-body {
      padding: 1rem;
    }
    
    .issue-description {
      margin-bottom: 1.5rem;
    }
    
    .issue-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #f8f8f8;
      border-radius: 0.25rem;
    }
    
    .issue-section h4 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.25rem;
    }
    
    .impact-who, 
    .impact-severity, 
    .impact-why {
      margin-bottom: 0.5rem;
    }
    
    .technical-label {
      font-weight: bold;
      margin-top: 0.75rem;
      margin-bottom: 0.25rem;
    }
    
    pre {
      background-color: #f1f1f1;
      padding: 0.75rem;
      border-radius: 0.25rem;
      border: 1px solid #e0e0e0;
      font-family: monospace;
      overflow-x: auto;
      white-space: pre-wrap;
      margin-bottom: 0.75rem;
    }
    
    ul, ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    
    li {
      margin-bottom: 0.25rem;
    }
    
    a {
      color: var(--info-color);
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    a:focus {
      outline: 2px solid var(--focus-outline-color);
      outline-offset: 2px;
    }
    
    /* Table of Contents Styles */
    .toc {
      background-color: #f8f8f8;
      padding: 1rem;
      border-radius: 0.25rem;
      border: 1px solid var(--border-color);
      margin-bottom: 2rem;
    }
    
    .toc ul {
      list-style-type: none;
      margin-left: 0;
    }
    
    .toc ul ul {
      margin-left: 1.5rem;
    }
    
    .toc li {
      margin-bottom: 0.5rem;
    }
    
    .toc a {
      text-decoration: none;
      color: var(--info-color);
      line-height: 1.6;
    }
    
    .toc a:hover {
      text-decoration: underline;
    }
    
    .back-to-toc {
      text-align: right;
      margin-top: 1.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }
    
    .back-to-toc a {
      font-size: 0.9rem;
      padding: 0.25rem 0.5rem;
      text-decoration: none;
      color: var(--info-color);
    }
    
    .back-to-toc a:hover {
      text-decoration: underline;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .touchpoint {
        break-inside: avoid;
      }
      
      .issue {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <h1>Accessibility Audit Report</h1>
  
  <div class="meta-info">
    <dl>
      <dt>Page URL:</dt>
      <dd>${pageUrl}</dd>
      <dt>Audit Date:</dt>
      <dd>${date}</dd>
      <dt>Audit Time:</dt>
      <dd>${time}</dd>
    </dl>
  </div>`;
      
      // Add summary section
      let fails = 0;
      let warnings = 0;
      let infos = 0;
      
      // Count all issues by type
      Object.values(currentTestResults).forEach(touchpoint => {
        (touchpoint.issues || []).forEach(issue => {
          if (issue.type === 'fail') fails++;
          else if (issue.type === 'warning') warnings++;
          else if (issue.type === 'info') infos++;
        });
      });
      
      // Sort touchpoints alphabetically first
      const sortedTouchpoints = Object.keys(currentTestResults).sort();
      
      // Add table of contents
      htmlTemplate += `
  <section aria-labelledby="toc-heading">
    <h2 id="toc-heading">Table of Contents</h2>
    <nav class="toc" aria-label="Table of contents">
      <ul>
        <li><a href="#summary-heading">Summary</a></li>
        <li>
          <a href="#details-heading">Detailed Results</a>
          <ul>`;
      
      // Add touchpoint links to table of contents
      sortedTouchpoints.forEach(touchpoint => {
        const touchpointData = currentTestResults[touchpoint];
        const issues = touchpointData.issues || [];
        
        if (issues.length === 0) {
          return; // Skip touchpoints with no issues
        }
        
        // Format touchpoint name for display
        const displayName = touchpoint
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        htmlTemplate += `
            <li><a href="#${touchpoint}-heading">${displayName}</a></li>`;
      });
      
      htmlTemplate += `
          </ul>
        </li>
      </ul>
    </nav>
  </section>

  <main id="main-content">
  <section aria-labelledby="summary-heading">
    <h2 id="summary-heading">Summary</h2>
    <div class="summary">
      <div class="fail">
        <h3>Failures</h3>
        <span class="count">${fails}</span>
      </div>
      <div class="warning">
        <h3>Warnings</h3>
        <span class="count">${warnings}</span>
      </div>
      <div class="info">
        <h3>Info</h3>
        <span class="count">${infos}</span>
      </div>
    </div>
  </section>
  
  <section aria-labelledby="details-heading">
    <h2 id="details-heading">Detailed Results</h2>`;
      
      // Add each touchpoint section
      sortedTouchpoints.forEach(touchpoint => {
        const touchpointData = currentTestResults[touchpoint];
        const issues = touchpointData.issues || [];
        
        if (issues.length === 0) {
          return; // Skip touchpoints with no issues
        }
        
        // Format touchpoint name for display
        const displayName = touchpoint
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        // Count issues by type
        const counts = {
          fail: issues.filter(issue => issue.type === 'fail').length,
          warning: issues.filter(issue => issue.type === 'warning').length,
          info: issues.filter(issue => issue.type === 'info').length
        };
        
        htmlTemplate += `
    <div class="touchpoint">
      <div class="touchpoint-header">
        <h3 class="touchpoint-title" id="${touchpoint}-heading">${displayName}</h3>
        <div class="touchpoint-counts">`;
        
        if (counts.fail > 0) {
          htmlTemplate += `
          <span class="count-badge fail">${counts.fail} ${counts.fail === 1 ? 'Fail' : 'Fails'}</span>`;
        }
        
        if (counts.warning > 0) {
          htmlTemplate += `
          <span class="count-badge warning">${counts.warning} ${counts.warning === 1 ? 'Warning' : 'Warnings'}</span>`;
        }
        
        if (counts.info > 0) {
          htmlTemplate += `
          <span class="count-badge info">${counts.info} ${counts.info === 1 ? 'Info' : 'Info'}</span>`;
        }
        
        htmlTemplate += `
        </div>
      </div>
      <div class="touchpoint-body">
        <div class="touchpoint-description">${touchpointData.description}</div>`;
        
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
        
        // Add each issue
        sortedIssues.forEach((issue, index) => {
          htmlTemplate += `
        <div class="issue">
          <div class="issue-header">
            <span class="issue-bullet ${issue.type}" aria-hidden="true">${issue.type === 'fail' ? 'F' : issue.type === 'warning' ? 'W' : 'I'}</span>
            <span class="issue-type-label sr-only">${issue.type === 'fail' ? 'Fail: ' : issue.type === 'warning' ? 'Warning: ' : 'Info: '}</span>
            <h4 class="issue-title">${issue.title}</h4>
          </div>
          <div class="issue-body">
            <p class="issue-description">${issue.description}</p>`;
          
          // Add impact information (required for fail and warning)
          if ((issue.type === 'fail' || issue.type === 'warning') && issue.impact) {
            htmlTemplate += `
            <div class="issue-section impact">
              <h5>Impact</h5>`;
            
            if (issue.impact.who) {
              htmlTemplate += `
              <div class="impact-who">
                <strong>Affects: </strong>${issue.impact.who}
              </div>`;
            }
            
            if (issue.impact.severity) {
              htmlTemplate += `
              <div class="impact-severity">
                <strong>Severity: </strong>${issue.impact.severity}
              </div>`;
            }
            
            if (issue.impact.why) {
              htmlTemplate += `
              <div class="impact-why">
                <strong>Why it matters: </strong>${issue.impact.why}
              </div>`;
            }
            
            htmlTemplate += `
            </div>`;
          }
          
          // Add WCAG information if present
          if (issue.wcag) {
            htmlTemplate += `
            <div class="issue-section wcag">
              <h5>WCAG Reference</h5>
              <div>`;
            
            if (issue.wcag.principle) {
              htmlTemplate += `
                <div>Principle: ${issue.wcag.principle}</div>`;
            }
            
            if (issue.wcag.guideline) {
              htmlTemplate += `
                <div>Guideline: ${issue.wcag.guideline}</div>`;
            }
            
            if (issue.wcag.successCriterion) {
              htmlTemplate += `
                <div>Success Criterion: ${issue.wcag.successCriterion}`;
              
              if (issue.wcag.level) {
                htmlTemplate += ` (Level ${issue.wcag.level})`;
              }
              
              htmlTemplate += `</div>`;
            }
            
            htmlTemplate += `
              </div>
            </div>`;
          }
          
          // Add remediation steps if present
          if ((issue.type === 'fail' || issue.type === 'warning') && issue.remediation && issue.remediation.length > 0) {
            htmlTemplate += `
            <div class="issue-section remediation">
              <h5>How to Fix</h5>
              <ol class="remediation-steps">`;
            
            issue.remediation.forEach(step => {
              htmlTemplate += `
                <li>${step}</li>`;
            });
            
            htmlTemplate += `
              </ol>
            </div>`;
          }
          
          // Add technical details
          if (issue.selector || issue.xpath || issue.html) {
            htmlTemplate += `
            <div class="issue-section technical">
              <h5>Technical Details</h5>`;
            
            if (issue.selector) {
              htmlTemplate += `
              <div class="technical-label">CSS Selector:</div>
              <pre>${issue.selector}</pre>`;
            }
            
            if (issue.xpath) {
              htmlTemplate += `
              <div class="technical-label">XPath:</div>
              <pre>${issue.xpath}</pre>`;
            }
            
            if (issue.html) {
              htmlTemplate += `
              <div class="technical-label">Current HTML:</div>
              <pre>${issue.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
            }
            
            if (issue.fixedHtml) {
              htmlTemplate += `
              <div class="technical-label">Example Fix:</div>
              <pre>${issue.fixedHtml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
            }
            
            htmlTemplate += `
            </div>`;
          }
          
          // Add resources if present
          if (issue.resources && issue.resources.length > 0) {
            htmlTemplate += `
            <div class="issue-section resources">
              <h5>Resources</h5>
              <ul class="resources-list">`;
            
            issue.resources.forEach(resource => {
              if (resource.url) {
                htmlTemplate += `
                <li><a href="${resource.url}" target="_blank" rel="noopener noreferrer">${resource.title || resource.url}</a></li>`;
              } else {
                htmlTemplate += `
                <li>${resource.title}</li>`;
              }
            });
            
            htmlTemplate += `
              </ul>
            </div>`;
          }
          
          htmlTemplate += `
          </div>
        </div>`;
        });
        
        htmlTemplate += `
        <div class="back-to-toc">
          <a href="#toc-heading" aria-label="Back to Table of Contents">↑ Back to Table of Contents</a>
        </div>
      </div>
    </div>`;
      });
      
      // Close the main sections and document
      htmlTemplate += `
  </section>
  
  </main>

  <footer>
    <p>Generated with Carnforth Web A11y - ${date} at ${time}</p>
  </footer>
</body>
</html>`;
      
      // Create download link
      const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `a11y-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting HTML:', error);
      alert('Failed to export HTML: ' + error.message);
    }
  }
  
  // Add event listeners for export buttons
  exportJsonButton.addEventListener('click', exportAsJson);
  exportExcelButton.addEventListener('click', exportAsExcel);
  exportHtmlButton.addEventListener('click', exportAsHtml);
});