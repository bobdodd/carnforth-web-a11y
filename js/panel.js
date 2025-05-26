/**
 * Main panel functionality for Carnforth Web A11y extension
 */

// Store test results globally to be accessed by export functions
let currentTestResults = null;

// Export removeAllHighlights function for use by other modules
window.removeAllHighlights = null; // Will be defined later

// The list of touchpoints to run - defined before DOMContentLoaded
const touchpoints = [
  'accessible_name', 'animation', 'audio', 'color_contrast', 
  'color_use', 'dialogs', 'electronic_documents', 'event_handling', 
  'floating_content', 'focus_management', 'fonts', 'forms',
  'headings', 'images', 'landmarks', 'language', 'lists',
  'maps', 'read_more', 'tabindex', 'title_attribute',
  'tables', 'timers', 'touch_and_gestures', 'videos'
];

// Function to remove all highlights from the page
function removeAllHighlights() {
  console.log("[Panel] Removing all highlights");
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const highlights = document.querySelectorAll('.carnforth-highlight, [id^="carnforth-highlight-"]');
      highlights.forEach(highlight => {
        if (highlight.updatePosition) {
          window.removeEventListener('resize', highlight.updatePosition);
          window.removeEventListener('scroll', highlight.updatePosition);
        }
        highlight.remove();
      });
      console.log('[Carnforth] Removed', highlights.length, 'highlights');
    })()`,
    function(result, isException) {
      if (isException) {
        console.error('[Panel] Error removing highlights:', isException);
      }
    }
  );
}

// Export the function for use by other modules
window.removeAllHighlights = removeAllHighlights;

// Clean up highlights when panel loses focus or is closed
window.addEventListener('blur', function() {
  console.log("[Panel] Window lost focus, removing highlights");
  if (typeof removeAllHighlights === 'function') {
    removeAllHighlights();
  }
});

window.addEventListener('beforeunload', function() {
  console.log("[Panel] Panel unloading, removing highlights");
  if (typeof removeAllHighlights === 'function') {
    removeAllHighlights();
  }
});

// Also clean up when DevTools is hidden
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    console.log("[Panel] Panel hidden, removing highlights");
    if (typeof removeAllHighlights === 'function') {
      removeAllHighlights();
    }
  }
});

document.addEventListener('DOMContentLoaded', function() {
  console.log("[Panel] DOMContentLoaded event fired");
  const startTestButton = document.getElementById('start-test');
  const exportBar = document.querySelector('.export-bar');
  const filterBar = document.querySelector('.filter-bar');
  const exportJsonButton = document.getElementById('export-json');
  const exportExcelButton = document.getElementById('export-excel');
  const exportHtmlButton = document.getElementById('export-html');
  const exportDocumentationButton = document.getElementById('export-documentation');
  const resultsContainer = document.getElementById('results-container');
  const failCount = document.getElementById('fail-count');
  const warningCount = document.getElementById('warning-count');
  const infoCount = document.getElementById('info-count');
  const testStatus = document.getElementById('test-status');
  
  // Filter elements
  const wcagVersionButtons = document.querySelectorAll('[data-wcag-version]');
  const wcagFilterButtons = document.querySelectorAll('[data-wcag-level]');
  const issueTypeButtons = document.querySelectorAll('[data-issue-type]');
  const impactLevelButtons = document.querySelectorAll('[data-impact]');
  const searchInput = document.getElementById('issue-search');
  const filterResultsText = document.getElementById('filter-results-text');
  const filterStatus = document.getElementById('filter-status');
  const groupingButtons = document.querySelectorAll('.grouping-button');
  
  // Preferences elements
  const preferencesButton = document.getElementById('preferences-button');
  const preferencesModal = document.getElementById('preferences-modal');
  const modalClose = preferencesModal?.querySelector('.modal-close');
  const modalBackdrop = preferencesModal?.querySelector('.modal-backdrop');
  const savePreferencesButton = document.getElementById('save-preferences');
  const resetPreferencesButton = document.getElementById('reset-preferences');
  
  // Filter state
  let activeFilters = {
    wcagVersion: '2.2', // Single WCAG version selected (default to latest)
    wcagLevels: new Set(['A', 'AA', 'AAA']), // All levels selected by default
    issueTypes: new Set(['fail', 'warning', 'info']), // All types selected by default
    impactLevels: new Set(['high', 'medium', 'low']), // All impact levels selected by default
    searchText: ''
  };
  
  // Preferences state
  let preferences = {
    defaultWcagVersion: '2.2', // Single WCAG version (default to latest)
    defaultWcagLevels: ['A', 'AA', 'AAA'],
    defaultIssueTypes: ['fail', 'warning', 'info'],
    defaultImpactLevels: ['high', 'medium', 'low'],
    selectedTouchpoints: [...touchpoints], // All touchpoints by default
    accordionDefault: 'closed',
    groupByRegionDefault: false, // Group by region off by default
    defaultGrouping: 'none' // Default grouping mode
  };

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
    
    // Hide filter bar
    filterBar.classList.add('hidden');
    
    // Reset filters to preferences defaults
    activeFilters = {
      wcagVersion: preferences.defaultWcagVersion,
      wcagLevels: new Set(preferences.defaultWcagLevels),
      issueTypes: new Set(preferences.defaultIssueTypes),
      impactLevels: new Set(preferences.defaultImpactLevels),
      searchText: ''
    };
    
    // Reset filter UI based on preferences
    wcagVersionButtons.forEach(btn => {
      const version = btn.dataset.wcagVersion;
      if (version === preferences.defaultWcagVersion) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    
    wcagFilterButtons.forEach(btn => {
      const level = btn.dataset.wcagLevel;
      if (level === 'all') {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else if (preferences.defaultWcagLevels.includes(level)) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    
    issueTypeButtons.forEach(btn => {
      const type = btn.dataset.issueType;
      if (type === 'all') {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else if (preferences.defaultIssueTypes.includes(type)) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    
    impactLevelButtons.forEach(btn => {
      const impact = btn.dataset.impact;
      if (impact === 'all') {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else if (preferences.defaultImpactLevels.includes(impact)) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Apply grouping preference
    groupingButtons.forEach(btn => {
      const grouping = btn.dataset.grouping;
      if (grouping === preferences.defaultGrouping) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    
    // Clear current results and test status
    currentTestResults = null;
    testStatus.textContent = '';
  }
  
  // Load preferences from storage
  async function loadPreferences() {
    try {
      const stored = await chrome.storage.local.get('carnforthPreferences');
      if (stored.carnforthPreferences) {
        preferences = { ...preferences, ...stored.carnforthPreferences };
        
        // Migrate old format: defaultWcagVersions array to defaultWcagVersion string
        const storedPrefs = stored.carnforthPreferences;
        if (Array.isArray(storedPrefs.defaultWcagVersions) && !storedPrefs.defaultWcagVersion) {
          // Use the highest version from the array, or default to 2.2
          if (storedPrefs.defaultWcagVersions.includes('2.2')) {
            preferences.defaultWcagVersion = '2.2';
          } else if (storedPrefs.defaultWcagVersions.includes('2.1')) {
            preferences.defaultWcagVersion = '2.1';
          } else if (storedPrefs.defaultWcagVersions.includes('2.0')) {
            preferences.defaultWcagVersion = '2.0';
          } else {
            preferences.defaultWcagVersion = '2.2';
          }
          // Save migrated preferences
          await savePreferences();
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }
  
  // Save preferences to storage
  async function savePreferences() {
    try {
      await chrome.storage.local.set({ carnforthPreferences: preferences });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }
  
  // Load preferences then reset UI
  loadPreferences().then(() => {
    resetUI();
  });
  
  // Connection management
  let port = null;
  const tabId = chrome.devtools.inspectedWindow.tabId;
  
  // Function to establish connection to background script
  function connectToBackground() {
    // Cleanup old connection if it exists
    if (port) {
      try {
        port.disconnect();
      } catch (e) {
        console.error('Error disconnecting old port:', e);
      }
    }
    
    console.log('Connecting to background script...');
    port = chrome.runtime.connect({name: 'carnforth-devtools'});
    
    // Set up reconnection when connection drops
    port.onDisconnect.addListener(() => {
      console.log('Connection to background script lost, reconnecting in 1 second...');
      setTimeout(connectToBackground, 1000);
    });
    
    // Listen for messages from the background script
    port.onMessage.addListener(handleBackgroundMessage);
    
    // Initialize with the current tab ID
    port.postMessage({
      action: 'init',
      tabId: tabId
    });
  }
  
  // Initial connection
  connectToBackground();
  
  // Function to handle test results when they arrive
  function handleTestResults(results) {
    console.log('Handling test results:', results);
    
    if (!results || Object.keys(results).length === 0) {
      resultsContainer.innerHTML = `<p class="results-message">No results returned from tests.</p>`;
      console.warn('No results returned from tests');
      startTestButton.disabled = false;
      startTestButton.textContent = 'Start Test';
      return;
    }
    
    // Store results for export
    currentTestResults = results;
    
    // Display results in UI based on preference
    console.log('Displaying results in UI');
    switch (preferences.defaultGrouping) {
      case 'region':
        displayResultsGroupedByRegion(results);
        break;
      case 'guideline':
        displayResultsGroupedByGuideline(results);
        break;
      case 'criteria':
        displayResultsGroupedByCriteria(results);
        break;
      case 'impact':
        displayResultsGroupedByImpact(results);
        break;
      case 'none':
      default:
        displayResults(results);
        break;
    }
    updateSummary(results);
    
    // Update button states
    startTestButton.disabled = false;
    startTestButton.textContent = 'Start Test';
    
    // Show export bar and enable export buttons
    exportBar.classList.remove('hidden');
    exportJsonButton.disabled = false;
    exportExcelButton.disabled = false;
    exportHtmlButton.disabled = false;
    
    // Show filter bar
    filterBar.classList.remove('hidden');
    
    // Show results summary console and calculate scores
    const summaryConsole = document.querySelector('.results-summary-console');
    if (summaryConsole) {
      summaryConsole.classList.remove('hidden');
      calculateAndDisplayScores(results);
      createCharts(results);
    }
    
    // Initialize filter count
    const totalIssues = Object.keys(results)
      .filter(key => key !== '__summary')
      .reduce((total, touchpoint) => {
        return total + (results[touchpoint].issues || []).length;
      }, 0);
    
    updateFilterResultsCount(totalIssues, totalIssues);
  }

  // Handle messages from the background script
  function handleBackgroundMessage(message) {
    console.log('DevTools received message:', message);
    
    if (message.action === 'initialized') {
      console.log('DevTools panel initialized for tab:', message.tabId);
    }
    
    if (message.action === 'pageChanged') {
      console.log('Page changed:', message.url);
      resetUI();
    }
    
    if (message.action === 'testResults') {
      console.log('Test results received:', message);
      
      if (message.error) {
        resultsContainer.innerHTML = `<p class="results-message error">Error running tests: ${message.error}</p>`;
        console.error('Error running tests:', message.error);
        
        startTestButton.disabled = false;
        startTestButton.textContent = 'Start Test';
        
        // Update status for screen reader to announce test error
        testStatus.textContent = `Error running tests: ${message.error}. Please try again.`;
        return;
      }
      
      if (message.results) {
        handleTestResults(message.results);
      }
    }
  }
  
  // Listen for URL changes or page refreshes
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'resetPanel') {
      resetUI();
    }
  });

  /**
   * Load and execute a touchpoint test directly in the DevTools panel
   * @param {string} touchpoint - The touchpoint name
   * @returns {Promise<Object>} - The test results
   */
  async function runTouchpoint(touchpoint) {
    console.log(`[Panel] Running touchpoint test: ${touchpoint}`);
    
    // Create a function that executes in the context of the inspected page
    // This is the content script part that gathers the data we need
    function gatherPageData() {
      // Basic page information
      const pageInfo = {
        url: window.location.href,
        title: document.title,
        elementCount: document.querySelectorAll('*').length,
        accessibilityTree: []
        // We can add more detailed data as needed for specific touchpoints
      };
      
      // Return the collected data
      return pageInfo;
    }
    
    try {
      // Execute the content script to gather page data
      const pageDataResult = await new Promise((resolve) => {
        chrome.devtools.inspectedWindow.eval(
          `(${gatherPageData.toString()})()`,
          { useContentScriptContext: true },
          (result, isException) => {
            if (isException) {
              console.error('[Panel] Error gathering page data:', isException);
              resolve({ error: isException });
            } else {
              resolve(result);
            }
          }
        );
      });
      
      if (pageDataResult.error) {
        return {
          description: `Error in ${touchpoint} touchpoint`,
          issues: [{
            type: 'error',
            title: `Error gathering page data for ${touchpoint}`,
            description: pageDataResult.error.toString()
          }]
        };
      }
      
      // Load and execute the specific touchpoint test from its file
      try {
        console.log(`[Panel] Attempting to load and execute touchpoint: ${touchpoint}`);
        
        // Try to import the touchpoint's JavaScript
        const touchpointResult = await new Promise((resolve) => {
          // Create a script element to load the touchpoint
          const script = document.createElement('script');
          script.src = chrome.runtime.getURL(`js/touchpoints/${touchpoint}.js`);
          script.onload = () => {
            console.log(`[Panel] Successfully loaded ${touchpoint}.js file`);
            // Try to execute the touchpoint function if it exists
            const funcName = `test_${touchpoint}`;
            if (typeof window[funcName] === 'function') {
              console.log(`[Panel] Executing ${funcName} function`);
              try {
                window[funcName]()
                  .then(result => {
                    console.log(`[Panel] ${funcName} execution successful:`, result);
                    resolve(result);
                  })
                  .catch(error => {
                    console.error(`[Panel] ${funcName} execution failed:`, error);
                    resolve({
                      description: `Error in ${touchpoint} touchpoint`,
                      issues: [{
                        type: 'error',
                        title: `Error executing ${touchpoint} test`,
                        description: error.message || 'An unknown error occurred'
                      }]
                    });
                  });
              } catch (error) {
                console.error(`[Panel] Error starting ${funcName}:`, error);
                resolve({
                  description: `Error in ${touchpoint} touchpoint`,
                  issues: [{
                    type: 'error',
                    title: `Error starting ${touchpoint} test`,
                    description: error.message || 'An unknown error occurred'
                  }]
                });
              }
            } else {
              console.error(`[Panel] Function ${funcName} not found after loading script`);
              resolve({
                description: `Error in ${touchpoint} touchpoint`,
                issues: [{
                  type: 'error',
                  title: `Error loading ${touchpoint} test`,
                  description: `The function ${funcName} could not be found`
                }]
              });
            }
          };
          script.onerror = (error) => {
            console.error(`[Panel] Failed to load ${touchpoint}.js:`, error);
            resolve({
              description: `Error in ${touchpoint} touchpoint`,
              issues: [{
                type: 'error',
                title: `Error loading ${touchpoint} script`,
                description: `Failed to load the ${touchpoint}.js script file`
              }]
            });
          };
          
          document.head.appendChild(script);
        });
        
        return touchpointResult;
      } catch (error) {
        console.error(`[Panel] Error in touchpoint loading process:`, error);
        return {
          description: `Error in ${touchpoint} touchpoint`,
          issues: [{
            type: 'error',
            title: `Error loading ${touchpoint} test`,
            description: error.message || 'An unknown error occurred in the loading process'
          }]
        };
      }
    } catch (error) {
      console.error(`[Panel] Error running touchpoint ${touchpoint}:`, error);
      return {
        description: `Error in ${touchpoint} touchpoint`,
        issues: [{
          type: 'error',
          title: `Error running ${touchpoint} test`,
          description: error.message || 'An unknown error occurred'
        }]
      };
    }
  }
  
  /**
   * Run all touchpoint tests in batches
   * @returns {Promise<Object>} - The combined test results
   */
  async function runAllTouchpoints() {
    console.log('[Panel] Running all touchpoint tests');
    
    const results = {};
    const batchSize = 3; // Process touchpoints in small batches
    
    // Track successful and failed touchpoints
    const successful = [];
    const failed = [];
    
    // Use only selected touchpoints from preferences
    const selectedTouchpoints = preferences.selectedTouchpoints;
    
    // Process touchpoints in batches
    for (let i = 0; i < selectedTouchpoints.length; i += batchSize) {
      const batch = selectedTouchpoints.slice(i, i + batchSize);
      console.log(`[Panel] Processing batch of touchpoints: ${batch.join(', ')}`);
      
      // Run touchpoints in this batch sequentially
      for (const touchpoint of batch) {
        try {
          console.log(`[Panel] Starting touchpoint: ${touchpoint}`);
          const result = await runTouchpoint(touchpoint);
          
          // Store the result
          results[touchpoint] = result;
          
          // Determine if the touchpoint was successful (no errors)
          const hasErrors = (result.issues || []).some(issue => issue.type === 'error');
          if (!hasErrors) {
            successful.push(touchpoint);
            console.log(`[Panel] Touchpoint ${touchpoint} succeeded`);
          } else {
            failed.push(touchpoint);
            console.error(`[Panel] Touchpoint ${touchpoint} failed`);
          }
        } catch (error) {
          console.error(`[Panel] Unexpected error with touchpoint ${touchpoint}:`, error);
          results[touchpoint] = {
            description: `Error in ${touchpoint} touchpoint`,
            issues: [{
              type: 'error',
              title: `Unexpected error with ${touchpoint}`,
              description: error.message || 'Unknown error occurred'
            }]
          };
          failed.push(touchpoint);
        }
      }
      
      // Add a small delay between batches
      if (i + batchSize < touchpoints.length) {
        console.log('[Panel] Waiting before processing next batch...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Add summary information
    console.log(`[Panel] All touchpoints processed. Results for ${Object.keys(results).length}/${touchpoints.length} touchpoints`);
    console.log(`[Panel] Successful touchpoints (${successful.length}): ${successful.join(', ')}`);
    console.log(`[Panel] Failed touchpoints (${failed.length}): ${failed.join(', ')}`);
    
    // Add global summary result
    results['__summary'] = {
      description: 'Summary of touchpoint execution results',
      issues: [{
        type: 'info',
        title: 'Touchpoint Execution Summary',
        description: `Successfully executed ${successful.length} of ${touchpoints.length} touchpoints. ${failed.length} touchpoints failed.`
      }]
    };
    
    return results;
  }

  /**
   * Apply syntax highlighting to HTML code blocks using highlight.js
   * This function has robust error handling and fallbacks
   */
  function applyHtmlSyntaxHighlighting() {
    console.log('[Panel] Applying syntax highlighting with highlight.js...');
    
    // Get all HTML code blocks
    const codeBlocks = document.querySelectorAll('code.language-html');
    console.log(`[Panel] Found ${codeBlocks.length} code blocks to highlight`);
    
    // First check if highlight.js is available
    if (typeof hljs === 'undefined') {
      console.error('[Panel] highlight.js not loaded yet, using fallback styling');
      applyFallbackSyntaxHighlighting(codeBlocks);
      return;
    }
    
    // Configure highlight.js
    try {
      hljs.configure({
        languages: ['html', 'xml'],  // Just support HTML/XML for now
        ignoreUnescapedHTML: true // Safer parsing for broken HTML
      });
    } catch (configError) {
      console.error('[Panel] Error configuring highlight.js:', configError);
      // Continue anyway, as default config might work
    }
    
    // Apply highlighting to each block with error handling
    codeBlocks.forEach((block, index) => {
      try {
        const originalContent = block.textContent || '';
        
        // Check if content is already escaped
        const isAlreadyEscaped = originalContent.includes('&lt;') || originalContent.includes('&gt;');
        
        if (isAlreadyEscaped) {
          // Content is already escaped, create a temporary unescaped version for highlighting
          const unescapedContent = originalContent
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          
          // Set the unescaped content
          block.textContent = unescapedContent;
        }
        
        // Apply highlighting
        hljs.highlightElement(block);
        
        console.log(`[Panel] Successfully highlighted block #${index + 1}`);
      } catch (error) {
        console.error(`[Panel] Error highlighting block #${index + 1}:`, error);
        // If highlighting fails, apply basic escaping and fallback styling
        applyFallbackHighlightingToElement(block);
      }
    });
  }
  
  /**
   * Apply fallback styling to all code blocks when highlight.js fails completely
   * @param {NodeList} codeBlocks - The code blocks to style
   */
  function applyFallbackSyntaxHighlighting(codeBlocks) {
    console.log('[Panel] Applying fallback syntax highlighting');
    codeBlocks.forEach((block) => {
      applyFallbackHighlightingToElement(block);
    });
  }
  
  /**
   * Apply fallback styling to a single code block
   * @param {HTMLElement} block - The code block to style
   */
  function applyFallbackHighlightingToElement(block) {
    try {
      // Get the original content
      const originalContent = block.textContent || '';
      
      // Check if content is already escaped
      const isAlreadyEscaped = originalContent.includes('&lt;') || originalContent.includes('&gt;');
      
      let processedContent;
      
      if (isAlreadyEscaped) {
        // Content is already escaped, use it directly
        processedContent = originalContent;
      } else {
        // Content needs escaping
        processedContent = originalContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
      
      // Apply basic coloring with regex - using higher contrast colors
      let coloredHTML = processedContent
        // Color tags - dark green for better contrast
        .replace(/(&lt;\/?[\w-]+)(\s|&gt;)/g, '<span class="tag">$1</span>$2')
        // Color attributes - dark blue for better contrast
        .replace(/(\s[\w-]+=)/g, '<span class="attr">$1</span>')
        // Color strings in attributes - darker blue for better contrast
        .replace(/(&quot;.*?&quot;|'.*?')/g, '<span class="string">$1</span>')
        // Color comments - darker gray for better contrast
        .replace(/(&lt;!--.*?--&gt;)/g, '<span class="comment">$1</span>');
      
      block.innerHTML = coloredHTML;
    } catch (error) {
      console.error('[Panel] Error applying fallback highlighting:', error);
      // Last resort: make sure the content is safe for display
      const originalContent = block.textContent || '';
      const isAlreadyEscaped = originalContent.includes('&lt;') || originalContent.includes('&gt;');
      
      if (isAlreadyEscaped) {
        // Already escaped, just use as is
        block.innerHTML = originalContent;
      } else {
        // Needs escaping
        const safeContent = originalContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        block.innerHTML = safeContent;
      }
    }
  }

  // Listen for about button click
  const aboutButton = document.getElementById('about-carnforth');
  if (aboutButton) {
    aboutButton.addEventListener('click', function() {
      if (window.CarnforthDocumentation && window.CarnforthDocumentation.openDocumentationModal) {
        window.CarnforthDocumentation.openDocumentationModal('carnforth-project');
      }
    });
  }

  // Listen for score info button click
  const scoreInfoButton = document.getElementById('score-info-button');
  if (scoreInfoButton) {
    scoreInfoButton.addEventListener('click', function() {
      if (window.CarnforthDocumentation && window.CarnforthDocumentation.openDocumentationModal) {
        window.CarnforthDocumentation.openDocumentationModal('accessibility-scoring');
      }
    });
  }

  // Filter functionality
  // Handle WCAG version filter buttons
  wcagVersionButtons.forEach(button => {
    button.addEventListener('click', function() {
      const version = this.dataset.wcagVersion;
      const isActive = this.classList.contains('active');
      
      if (isActive) {
        // Radio button behavior - clicking an already selected version does nothing
        return;
      }
      
      // Deselect all other versions
      wcagVersionButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      
      // Select this version
      activeFilters.wcagVersion = version;
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      
      applyFilters();
    });
  });
  
  // Handle WCAG level filter buttons
  wcagFilterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const level = this.dataset.wcagLevel;
      
      if (level === 'all') {
        // "All" button toggles all other buttons
        const allButton = this;
        const isCurrentlyActive = allButton.classList.contains('active');
        
        if (!isCurrentlyActive) {
          // Select all levels
          activeFilters.wcagLevels = new Set(['A', 'AA', 'AAA']);
          wcagFilterButtons.forEach(btn => {
            if (btn.dataset.wcagLevel !== 'all') {
              btn.classList.add('active');
              btn.setAttribute('aria-pressed', 'true');
            }
          });
        } else {
          // Deselect all levels
          activeFilters.wcagLevels.clear();
          wcagFilterButtons.forEach(btn => {
            if (btn.dataset.wcagLevel !== 'all') {
              btn.classList.remove('active');
              btn.setAttribute('aria-pressed', 'false');
            }
          });
        }
        
        // Toggle "All" button state
        allButton.classList.toggle('active');
        allButton.setAttribute('aria-pressed', allButton.classList.contains('active') ? 'true' : 'false');
      } else {
        // Individual level button
        const isActive = this.classList.contains('active');
        
        if (isActive) {
          // Deselect this level
          activeFilters.wcagLevels.delete(level);
          this.classList.remove('active');
          this.setAttribute('aria-pressed', 'false');
        } else {
          // Select this level
          activeFilters.wcagLevels.add(level);
          this.classList.add('active');
          this.setAttribute('aria-pressed', 'true');
        }
        
        // Update "All" button state based on individual selections
        const allButton = document.querySelector('[data-wcag-level="all"]');
        if (activeFilters.wcagLevels.size === 3) {
          allButton.classList.add('active');
          allButton.setAttribute('aria-pressed', 'true');
        } else {
          allButton.classList.remove('active');
          allButton.setAttribute('aria-pressed', 'false');
        }
      }
      
      applyFilters();
    });
  });

  // Handle issue type filter buttons
  issueTypeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const type = this.dataset.issueType;
      
      if (type === 'all') {
        // "All" button toggles all other buttons
        const allButton = this;
        const isCurrentlyActive = allButton.classList.contains('active');
        
        if (!isCurrentlyActive) {
          // Select all types
          activeFilters.issueTypes = new Set(['fail', 'warning', 'info']);
          issueTypeButtons.forEach(btn => {
            if (btn.dataset.issueType !== 'all') {
              btn.classList.add('active');
              btn.setAttribute('aria-pressed', 'true');
            }
          });
        } else {
          // Deselect all types
          activeFilters.issueTypes.clear();
          issueTypeButtons.forEach(btn => {
            if (btn.dataset.issueType !== 'all') {
              btn.classList.remove('active');
              btn.setAttribute('aria-pressed', 'false');
            }
          });
        }
        
        // Toggle "All" button state
        allButton.classList.toggle('active');
        allButton.setAttribute('aria-pressed', allButton.classList.contains('active') ? 'true' : 'false');
      } else {
        // Individual type button
        const isActive = this.classList.contains('active');
        
        if (isActive) {
          // Deselect this type
          activeFilters.issueTypes.delete(type);
          this.classList.remove('active');
          this.setAttribute('aria-pressed', 'false');
        } else {
          // Select this type
          activeFilters.issueTypes.add(type);
          this.classList.add('active');
          this.setAttribute('aria-pressed', 'true');
        }
        
        // Update "All" button state based on individual selections
        const allButton = document.querySelector('[data-issue-type="all"]');
        if (activeFilters.issueTypes.size === 3) {
          allButton.classList.add('active');
          allButton.setAttribute('aria-pressed', 'true');
        } else {
          allButton.classList.remove('active');
          allButton.setAttribute('aria-pressed', 'false');
        }
      }
      
      applyFilters();
    });
  });

  // Handle impact level buttons
  impactLevelButtons.forEach(button => {
    button.addEventListener('click', function() {
      const impact = this.dataset.impact;
      
      if (impact === 'all') {
        // "All" button toggles all other buttons
        const allButton = this;
        const isCurrentlyActive = allButton.classList.contains('active');
        
        if (!isCurrentlyActive) {
          // Select all impact levels
          activeFilters.impactLevels = new Set(['high', 'medium', 'low']);
          impactLevelButtons.forEach(btn => {
            if (btn.dataset.impact !== 'all') {
              btn.classList.add('active');
              btn.setAttribute('aria-pressed', 'true');
            }
          });
        } else {
          // Deselect all impact levels
          activeFilters.impactLevels.clear();
          impactLevelButtons.forEach(btn => {
            if (btn.dataset.impact !== 'all') {
              btn.classList.remove('active');
              btn.setAttribute('aria-pressed', 'false');
            }
          });
        }
        
        // Toggle "All" button state
        allButton.classList.toggle('active');
        allButton.setAttribute('aria-pressed', allButton.classList.contains('active') ? 'true' : 'false');
      } else {
        // Individual impact button
        const isActive = this.classList.contains('active');
        
        if (isActive) {
          // Deselect this impact level
          activeFilters.impactLevels.delete(impact);
          this.classList.remove('active');
          this.setAttribute('aria-pressed', 'false');
        } else {
          // Select this impact level
          activeFilters.impactLevels.add(impact);
          this.classList.add('active');
          this.setAttribute('aria-pressed', 'true');
        }
        
        // Update "All" button state based on individual selections
        const allButton = document.querySelector('[data-impact="all"]');
        if (activeFilters.impactLevels.size === 3) {
          allButton.classList.add('active');
          allButton.setAttribute('aria-pressed', 'true');
        } else {
          allButton.classList.remove('active');
          allButton.setAttribute('aria-pressed', 'false');
        }
      }
      
      applyFilters();
    });
  });

  // Handle search input
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      activeFilters.searchText = this.value.toLowerCase();
      applyFilters();
    });
  }
  
  // Handle grouping buttons
  if (groupingButtons.length > 0) {
    let currentGrouping = 'none';
    
    groupingButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Update active state
        groupingButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-pressed', 'true');
        
        // Apply grouping
        currentGrouping = this.dataset.grouping;
        
        // Save preference
        preferences.defaultGrouping = currentGrouping;
        savePreferences();
        
        if (currentTestResults) {
          switch (currentGrouping) {
            case 'none':
              displayResults(currentTestResults);
              break;
            case 'region':
              displayResultsGroupedByRegion(currentTestResults);
              break;
            case 'guideline':
              displayResultsGroupedByGuideline(currentTestResults);
              break;
            case 'criteria':
              displayResultsGroupedByCriteria(currentTestResults);
              break;
            case 'impact':
              displayResultsGroupedByImpact(currentTestResults);
              break;
          }
        }
      });
    });
  }

  // Apply filters to displayed results
  function applyFilters() {
    if (!currentTestResults) return;

    // Create filtered results
    const filteredResults = {};
    let hasVisibleIssues = false;
    let totalFilteredIssues = 0;
    let totalOriginalIssues = 0;

    Object.keys(currentTestResults).forEach(touchpoint => {
      if (touchpoint === '__summary') {
        filteredResults[touchpoint] = currentTestResults[touchpoint];
        return;
      }

      const touchpointData = currentTestResults[touchpoint];
      const originalIssues = touchpointData.issues || [];
      totalOriginalIssues += originalIssues.length;
      
      const filteredIssues = originalIssues.filter(issue => {
        // Filter by issue type
        if (activeFilters.issueTypes.size > 0 && !activeFilters.issueTypes.has(issue.type)) {
          return false;
        }

        // Filter by impact level
        if (activeFilters.impactLevels && activeFilters.impactLevels.size > 0) {
          // Only filter fails and warnings by impact (info issues don't have impact)
          if ((issue.type === 'fail' || issue.type === 'warning') && issue.impact && issue.impact.level) {
            if (!activeFilters.impactLevels.has(issue.impact.level)) {
              return false;
            }
          } else if (issue.type === 'fail' || issue.type === 'warning') {
            // If a fail/warning doesn't have impact data, exclude it when impact filter is active
            return false;
          }
          // Info issues pass through when impact filter is active
        }

        // Filter by WCAG level
        if (activeFilters.wcagLevels.size > 0 && issue.wcag && issue.wcag.level) {
          if (!activeFilters.wcagLevels.has(issue.wcag.level)) {
            return false;
          }
        }
        
        // Filter by WCAG version
        if (issue.wcag && issue.wcag.version) {
          // For WCAG version filtering, include issues from the selected version and all previous versions
          const versionHierarchy = { '2.0': 1, '2.1': 2, '2.2': 3 };
          const selectedLevel = versionHierarchy[activeFilters.wcagVersion] || 3;
          const issueLevel = versionHierarchy[issue.wcag.version] || 1;
          if (issueLevel > selectedLevel) {
            return false;
          }
        }

        // Filter by search text
        if (activeFilters.searchText) {
          const searchableText = [
            issue.title || '',
            issue.description || '',
            issue.impact?.why || '',
            issue.wcag?.guideline || '',
            issue.wcag?.successCriterion || ''
          ].join(' ').toLowerCase();

          if (!searchableText.includes(activeFilters.searchText)) {
            return false;
          }
        }

        return true;
      });

      if (filteredIssues.length > 0) {
        filteredResults[touchpoint] = {
          ...touchpointData,
          issues: filteredIssues
        };
        hasVisibleIssues = true;
        totalFilteredIssues += filteredIssues.length;
      }
    });

    // Update visible count
    updateFilterResultsCount(totalFilteredIssues, totalOriginalIssues);

    // Display filtered results respecting current grouping
    if (hasVisibleIssues) {
      // Get current grouping mode
      const currentGrouping = document.querySelector('.grouping-button.active')?.dataset.grouping || 'none';
      
      switch (currentGrouping) {
        case 'region':
          displayResultsGroupedByRegion(filteredResults);
          break;
        case 'guideline':
          displayResultsGroupedByGuideline(filteredResults);
          break;
        case 'criteria':
          displayResultsGroupedByCriteria(filteredResults);
          break;
        case 'impact':
          displayResultsGroupedByImpact(filteredResults);
          break;
        case 'none':
        default:
          displayResults(filteredResults);
          break;
      }
      updateSummary(filteredResults);
    } else {
      resultsContainer.innerHTML = '<p class="results-message">No issues match the current filters.</p>';
    }

    // Update filter count and announce to screen readers
    updateFilterResultsCount(totalFilteredIssues, totalOriginalIssues);
    announceFilterResults(totalFilteredIssues, totalOriginalIssues);
    
    // Recalculate scores with new filters
    const summaryConsole = document.querySelector('.results-summary-console');
    if (summaryConsole && !summaryConsole.classList.contains('hidden')) {
      calculateAndDisplayScores(currentTestResults);
    }
  }

  // Update the visible filter results count
  function updateFilterResultsCount(filtered, total) {
    if (!filterResultsText) return;
    
    if (filtered === total) {
      filterResultsText.textContent = `Showing all ${total} issues`;
    } else {
      filterResultsText.textContent = `Showing ${filtered} of ${total} issues`;
    }
  }

  // Announce filter results to screen readers
  function announceFilterResults(filtered, total) {
    if (!filterStatus) return;
    
    let announcement = '';
    
    // Build filter description
    const filterDescriptions = [];
    
    // WCAG version
    if (activeFilters.wcagVersion !== '2.2') {
      filterDescriptions.push(`WCAG ${activeFilters.wcagVersion}`);
    }
    
    // WCAG levels
    if (activeFilters.wcagLevels.size < 3 && activeFilters.wcagLevels.size > 0) {
      const levels = Array.from(activeFilters.wcagLevels).sort().join(', ');
      filterDescriptions.push(`WCAG levels: ${levels}`);
    }
    
    // Issue types
    if (activeFilters.issueTypes.size < 3 && activeFilters.issueTypes.size > 0) {
      const types = Array.from(activeFilters.issueTypes).join(', ');
      filterDescriptions.push(`issue types: ${types}`);
    }
    
    // Impact levels
    if (activeFilters.impactLevels && activeFilters.impactLevels.size < 3 && activeFilters.impactLevels.size > 0) {
      const impacts = Array.from(activeFilters.impactLevels).join(', ');
      filterDescriptions.push(`impact levels: ${impacts}`);
    }
    
    // Search text
    if (activeFilters.searchText) {
      filterDescriptions.push(`search term: "${activeFilters.searchText}"`);
    }
    
    if (filtered === 0) {
      announcement = 'No issues match the current filters';
      if (filterDescriptions.length > 0) {
        announcement += ': ' + filterDescriptions.join(', ');
      }
    } else if (filtered === total) {
      announcement = `Showing all ${total} issues`;
    } else {
      announcement = `Showing ${filtered} of ${total} issues`;
      if (filterDescriptions.length > 0) {
        announcement += ' filtered by ' + filterDescriptions.join(', ');
      }
    }
    
    filterStatus.textContent = announcement;
  }

  // Listen for test button click
  startTestButton.addEventListener('click', function() {
    // Remove any existing highlights before starting new test
    if (typeof removeAllHighlights === 'function') {
      removeAllHighlights();
    }
    
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

    // Get the current tab ID from DevTools API
    const tabId = chrome.devtools.inspectedWindow.tabId;
    
    console.log('Starting tests on tab:', tabId);
    
    // Run the tests directly in the panel without injecting code into the page
    runAllTouchpoints()
      .then(results => {
        console.log('All touchpoints completed, processing results');
        handleTestResults(results);
      })
      .catch(error => {
        console.error('Error running all touchpoints:', error);
        resultsContainer.innerHTML = `<p class="results-message error">Error running tests: ${error.message}</p>`;
        startTestButton.disabled = false;
        startTestButton.textContent = 'Start Test';
        
        // Hide export bar and disable export buttons
        exportBar.classList.add('hidden');
        exportJsonButton.disabled = true;
        exportExcelButton.disabled = true;
        exportHtmlButton.disabled = true;
        
        // Update status for screen reader to announce test error
        testStatus.textContent = `Error running tests: ${error.message}. Please try again.`;
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

    // Check for execution summary (this is added by touchpoint-loader.js)
    if (results.__summary) {
      const summaryBox = document.createElement('div');
      summaryBox.className = 'execution-summary';
      summaryBox.style.marginBottom = '1.5rem';
      summaryBox.style.padding = '1rem';
      summaryBox.style.border = '1px solid #e0e0e0';
      summaryBox.style.borderRadius = '4px';
      summaryBox.style.backgroundColor = '#f9f9f9';
      
      const summaryTitle = document.createElement('h3');
      summaryTitle.textContent = 'Execution Summary';
      summaryTitle.style.marginTop = '0';
      summaryBox.appendChild(summaryTitle);
      
      const summaryText = document.createElement('p');
      summaryText.textContent = results.__summary.issues[0].description;
      summaryBox.appendChild(summaryText);
      
      resultsContainer.appendChild(summaryBox);
    }

    // Sort touchpoints alphabetically, but filter out the __summary touchpoint
    const sortedTouchpoints = Object.keys(results)
      .filter(touchpoint => touchpoint !== '__summary')
      .sort();

    // Count total errors
    let totalErrors = 0;
    sortedTouchpoints.forEach(touchpoint => {
      const touchpointData = results[touchpoint];
      const issues = touchpointData.issues || [];
      const errorCount = issues.filter(issue => issue.type === 'error').length;
      totalErrors += errorCount;
    });
    
    // Create accordion for each touchpoint
    sortedTouchpoints.forEach(touchpoint => {
      const touchpointData = results[touchpoint];
      const issues = touchpointData.issues || [];
      
      if (issues.length === 0) {
        return; // Skip touchpoints with no issues
      }

      // Check if this touchpoint has errors
      const hasErrors = issues.some(issue => issue.type === 'error');
      
      // Create accordion section
      const accordion = createAccordionSection(
        touchpoint, 
        touchpointData.description, 
        issues
      );
      
      // Highlight touchpoints with errors
      if (hasErrors) {
        // Add a special class to highlight accordions with errors
        accordion.classList.add('accordion-with-errors');
        accordion.style.borderLeft = '4px solid #e53935';
      }
      
      resultsContainer.appendChild(accordion);
    });

    // If there are errors, add a note at the top
    if (totalErrors > 0) {
      const errorNote = document.createElement('div');
      errorNote.className = 'error-note';
      errorNote.style.marginBottom = '1.5rem';
      errorNote.style.padding = '1rem';
      errorNote.style.border = '1px solid #e53935';
      errorNote.style.borderRadius = '4px';
      errorNote.style.backgroundColor = 'rgba(229, 57, 53, 0.1)';
      
      const errorTitle = document.createElement('h3');
      errorTitle.textContent = 'Execution Errors Detected';
      errorTitle.style.marginTop = '0';
      errorTitle.style.color = '#e53935';
      errorNote.appendChild(errorTitle);
      
      const errorText = document.createElement('p');
      errorText.textContent = `${totalErrors} touchpoint execution errors were detected. These errors indicate issues with the touchpoint test code, not accessibility issues with the page. Please check the browser console for more details.`;
      errorNote.appendChild(errorText);
      
      // Insert at the beginning
      resultsContainer.insertBefore(errorNote, resultsContainer.firstChild);
    }

    // Initialize accordion functionality
    initializeAccordions();
    initializeIssueDisclosures();
    
    // Apply accordion default preference
    if (preferences.accordionDefault === 'open') {
      // Open all accordions
      document.querySelectorAll('.accordion-header').forEach(header => {
        const accordion = header.parentElement;
        const content = accordion.querySelector('.accordion-content');
        if (content && header.getAttribute('aria-expanded') === 'false') {
          // Simulate click to open accordion
          header.click();
        }
      });
    }
    
    // Apply syntax highlighting to all code blocks
    // Use a longer timeout to ensure DOM is fully rendered and highlight.js is loaded
    setTimeout(() => {
      try {
        applyHtmlSyntaxHighlighting();
      } catch (error) {
        console.error('[Panel] Error applying syntax highlighting:', error);
      }
    }, 300);
  }
  
  /**
   * Display the test results grouped by page region
   * @param {Object} results - Test results organized by touchpoint
   */
  function displayResultsGroupedByRegion(results) {
    if (!results || Object.keys(results).length === 0) {
      resultsContainer.innerHTML = '<p class="results-message">No accessibility issues detected.</p>';
      return;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // First, collect all issues and group them by region
    const issuesByRegion = {};
    const regionOrder = []; // To maintain order of regions as we encounter them
    
    Object.keys(results).forEach(touchpoint => {
      if (touchpoint === '__summary') return;
      
      const touchpointData = results[touchpoint];
      const issues = touchpointData.issues || [];
      
      issues.forEach(issue => {
        // Get the region from the issue, default to 'Unknown Region'
        const region = issue.region || 'Unknown Region';
        
        if (!issuesByRegion[region]) {
          issuesByRegion[region] = [];
          regionOrder.push(region);
        }
        
        // Add touchpoint info to the issue for display
        issuesByRegion[region].push({
          ...issue,
          touchpoint: touchpoint,
          touchpointDescription: touchpointData.description
        });
      });
    });
    
    // Sort regions with known landmarks first, then unknown
    regionOrder.sort((a, b) => {
      const knownRegions = ['Header', 'Navigation', 'Main Content', 'Footer', 'Sidebar', 'Search', 'Form'];
      const aIndex = knownRegions.findIndex(r => a.startsWith(r));
      const bIndex = knownRegions.findIndex(r => b.startsWith(r));
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        return a.localeCompare(b);
      }
    });
    
    // Create accordion for each region
    regionOrder.forEach(region => {
      const issues = issuesByRegion[region];
      
      if (issues.length === 0) return;
      
      const accordion = createRegionAccordion(region, issues);
      resultsContainer.appendChild(accordion);
    });
    
    // Initialize accordion functionality
    initializeAccordions();
    initializeIssueDisclosures();
    
    // Apply accordion default preference
    if (preferences.accordionDefault === 'open') {
      document.querySelectorAll('.accordion-header').forEach(header => {
        const accordion = header.parentElement;
        const content = accordion.querySelector('.accordion-content');
        if (content && header.getAttribute('aria-expanded') === 'false') {
          header.click();
        }
      });
    }
    
    // Apply syntax highlighting
    setTimeout(() => {
      try {
        applyHtmlSyntaxHighlighting();
      } catch (error) {
        console.error('[Panel] Error applying syntax highlighting:', error);
      }
    }, 300);
  }
  
  /**
   * Get WCAG guideline number from success criteria
   * @param {string} criteria - Success criteria (e.g., "1.1.1", "2.4.1")
   * @returns {string} Guideline number (e.g., "1.1", "2.4")
   */
  function getGuidelineFromCriteria(criteria) {
    if (!criteria || typeof criteria !== 'string') return '';
    const parts = criteria.split('.');
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : '';
  }
  
  /**
   * Map of WCAG guideline numbers to their names
   */
  const guidelineNames = {
    '1.1': 'Text Alternatives',
    '1.2': 'Time-based Media',
    '1.3': 'Adaptable',
    '1.4': 'Distinguishable',
    '2.1': 'Keyboard Accessible',
    '2.2': 'Enough Time',
    '2.3': 'Seizures and Physical Reactions',
    '2.4': 'Navigable',
    '2.5': 'Input Modalities',
    '3.1': 'Readable',
    '3.2': 'Predictable',
    '3.3': 'Input Assistance',
    '4.1': 'Compatible'
  };
  
  /**
   * Display the test results grouped by WCAG guideline
   * @param {Object} results - Test results organized by touchpoint
   */
  function displayResultsGroupedByGuideline(results) {
    if (!results || Object.keys(results).length === 0) {
      resultsContainer.innerHTML = '<p class="results-message">No accessibility issues detected.</p>';
      return;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Collect all issues and group them by guideline
    const issuesByGuideline = {};
    const guidelineOrder = [];
    
    Object.keys(results).forEach(touchpoint => {
      if (touchpoint === '__summary') return;
      
      const touchpointData = results[touchpoint];
      if (touchpointData.issues && touchpointData.issues.length > 0) {
        touchpointData.issues.forEach(issue => {
          // Get guideline from WCAG information
          if (issue.wcag && issue.wcag.successCriterion) {
            // Extract the criteria number from the successCriterion string (e.g., "1.1.1 Non-text Content" -> "1.1.1")
            const criteriaMatch = issue.wcag.successCriterion.match(/^(\d+\.\d+\.\d+)/);
            const criteriaNum = criteriaMatch ? criteriaMatch[1] : null;
            
            if (criteriaNum) {
              const guideline = getGuidelineFromCriteria(criteriaNum);
              if (guideline) {
                const guidelineName = guidelineNames[guideline] || 'Unknown Guideline';
                const guidelineKey = `${guideline} ${guidelineName}`;
                
                if (!issuesByGuideline[guidelineKey]) {
                  issuesByGuideline[guidelineKey] = [];
                  guidelineOrder.push(guidelineKey);
                }
                
                // Clone the issue and set the specific criteria for this grouping
                const issueClone = {
                  ...issue,
                  touchpoint: touchpoint,
                  touchpointTitle: touchpointData.title || touchpoint
                };
                issuesByGuideline[guidelineKey].push(issueClone);
              }
            }
          }
        });
      }
    });
    
    // Sort guidelines numerically
    guidelineOrder.sort((a, b) => {
      const numA = parseFloat(a.split(' ')[0]);
      const numB = parseFloat(b.split(' ')[0]);
      return numA - numB;
    });
    
    // Create sections for each guideline
    guidelineOrder.forEach((guideline, index) => {
      const issues = issuesByGuideline[guideline];
      const section = createGuidelineSection(guideline, issues, index);
      resultsContainer.appendChild(section);
    });
    
    // Initialize issue disclosures
    initializeIssueDisclosures();
    
    // Apply syntax highlighting after a delay
    setTimeout(() => {
      try {
        applyHtmlSyntaxHighlighting();
      } catch (error) {
        console.error('[Panel] Error applying syntax highlighting:', error);
      }
    }, 300);
  }
  
  /**
   * Display the test results grouped by WCAG success criteria
   * @param {Object} results - Test results organized by touchpoint
   */
  function displayResultsGroupedByCriteria(results) {
    if (!results || Object.keys(results).length === 0) {
      resultsContainer.innerHTML = '<p class="results-message">No accessibility issues detected.</p>';
      return;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Collect all issues and group them by criteria
    const issuesByCriteria = {};
    const criteriaOrder = [];
    
    Object.keys(results).forEach(touchpoint => {
      if (touchpoint === '__summary') return;
      
      const touchpointData = results[touchpoint];
      if (touchpointData.issues && touchpointData.issues.length > 0) {
        touchpointData.issues.forEach(issue => {
          // Group by criteria
          if (issue.wcag && issue.wcag.successCriterion) {
            const criteriaKey = issue.wcag.successCriterion;
            
            if (!issuesByCriteria[criteriaKey]) {
              issuesByCriteria[criteriaKey] = [];
              criteriaOrder.push(criteriaKey);
            }
            
            // Clone the issue and add touchpoint info
            const issueClone = {
              ...issue,
              touchpoint: touchpoint,
              touchpointTitle: touchpointData.title || touchpoint
            };
            issuesByCriteria[criteriaKey].push(issueClone);
          }
        });
      }
    });
    
    // Sort criteria numerically by extracting the number part
    criteriaOrder.sort((a, b) => {
      const matchA = a.match(/^(\d+)\.(\d+)\.(\d+)/);
      const matchB = b.match(/^(\d+)\.(\d+)\.(\d+)/);
      
      if (matchA && matchB) {
        const partsA = [parseInt(matchA[1]), parseInt(matchA[2]), parseInt(matchA[3])];
        const partsB = [parseInt(matchB[1]), parseInt(matchB[2]), parseInt(matchB[3])];
        
        for (let i = 0; i < 3; i++) {
          if (partsA[i] !== partsB[i]) {
            return partsA[i] - partsB[i];
          }
        }
      }
      return 0;
    });
    
    // Create sections for each criteria
    criteriaOrder.forEach((criteria, index) => {
      const issues = issuesByCriteria[criteria];
      const section = createCriteriaSection(criteria, issues, index);
      resultsContainer.appendChild(section);
    });
    
    // Initialize issue disclosures
    initializeIssueDisclosures();
    
    // Apply syntax highlighting after a delay
    setTimeout(() => {
      try {
        applyHtmlSyntaxHighlighting();
      } catch (error) {
        console.error('[Panel] Error applying syntax highlighting:', error);
      }
    }, 300);
  }
  
  /**
   * Display the test results grouped by impact level
   * @param {Object} results - Test results organized by touchpoint
   */
  function displayResultsGroupedByImpact(results) {
    if (!results || Object.keys(results).length === 0) {
      resultsContainer.innerHTML = '<p class="results-message">No accessibility issues detected.</p>';
      return;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Collect all issues and group them by impact level
    const issuesByImpact = {
      'high': [],
      'medium': [],
      'low': [],
      'info': [] // Info issues don't have impact levels, so we'll group them separately
    };
    
    Object.keys(results).forEach(touchpoint => {
      if (touchpoint === '__summary') return;
      
      const touchpointData = results[touchpoint];
      if (touchpointData.issues && touchpointData.issues.length > 0) {
        touchpointData.issues.forEach(issue => {
          // Clone the issue and add touchpoint info
          const issueClone = {
            ...issue,
            touchpoint: touchpoint,
            touchpointTitle: touchpointData.title || touchpoint
          };
          
          // Group by impact level
          if (issue.type === 'info') {
            issuesByImpact['info'].push(issueClone);
          } else if (issue.impact && issue.impact.level) {
            const impactLevel = issue.impact.level.toLowerCase();
            if (issuesByImpact[impactLevel]) {
              issuesByImpact[impactLevel].push(issueClone);
            }
          }
        });
      }
    });
    
    // Create sections in order: high, medium, low, info
    const impactOrder = ['high', 'medium', 'low', 'info'];
    const impactLabels = {
      'high': 'High Impact',
      'medium': 'Medium Impact', 
      'low': 'Low Impact',
      'info': 'Informational'
    };
    
    impactOrder.forEach((impactLevel, index) => {
      const issues = issuesByImpact[impactLevel];
      if (issues.length > 0) {
        const section = createImpactSection(impactLabels[impactLevel], issues, index, impactLevel);
        resultsContainer.appendChild(section);
      }
    });
    
    // Initialize issue disclosures
    initializeIssueDisclosures();
    
    // Apply syntax highlighting after a delay
    setTimeout(() => {
      try {
        applyHtmlSyntaxHighlighting();
      } catch (error) {
        console.error('[Panel] Error applying syntax highlighting:', error);
      }
    }, 300);
  }
  
  /**
   * Create an accordion section for an impact level
   * @param {string} impactLabel - Display label for the impact level
   * @param {Array} issues - Array of issues at this impact level
   * @param {number} index - Section index
   * @param {string} impactLevel - Raw impact level (high, medium, low, info)
   * @returns {HTMLElement} - The accordion element
   */
  function createImpactSection(impactLabel, issues, index, impactLevel) {
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
    accordion.className = 'accordion impact-accordion';
    accordion.setAttribute('id', `accordion-impact-${index}`);

    // Create accordion header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `content-impact-${index}`);
    header.setAttribute('tabindex', '0');

    // Add expand/collapse icon
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.innerHTML = '▶';
    icon.setAttribute('aria-hidden', 'true');
    header.appendChild(icon);

    // Add impact level name
    const title = document.createElement('h2');
    title.className = 'accordion-title';
    title.textContent = impactLabel;
    header.appendChild(title);

    // Add summary counts
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
    accordion.appendChild(header);

    // Create accordion content
    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.setAttribute('id', `content-impact-${index}`);
    
    // Group issues by touchpoint within this impact level
    const issuesByTouchpoint = {};
    issues.forEach(issue => {
      const key = issue.touchpointTitle;
      if (!issuesByTouchpoint[key]) {
        issuesByTouchpoint[key] = [];
      }
      issuesByTouchpoint[key].push(issue);
    });

    // Sort touchpoints alphabetically and create subsections
    const sortedTouchpoints = Object.entries(issuesByTouchpoint)
      .sort(([a], [b]) => a.localeCompare(b));
    
    sortedTouchpoints.forEach(([touchpointTitle, touchpointIssues]) => {
      const touchpointSection = document.createElement('div');
      touchpointSection.className = 'touchpoint-subsection';
      
      const touchpointHeader = document.createElement('h3');
      touchpointHeader.className = 'touchpoint-subsection-title';
      touchpointHeader.textContent = touchpointTitle;
      touchpointSection.appendChild(touchpointHeader);
      
      // Sort issues within touchpoint by type first, then alphabetically
      const sortedIssues = touchpointIssues.sort((a, b) => {
        // First sort by type (fail, warning, info)
        const typeOrder = { fail: 0, warning: 1, info: 2 };
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;
        
        // Then sort alphabetically by title within the same type
        return a.title.localeCompare(b.title);
      });
      
      sortedIssues.forEach(issue => {
        const issueElement = createIssueElement(issue, issue.touchpoint);
        touchpointSection.appendChild(issueElement);
      });
      
      content.appendChild(touchpointSection);
    });

    // Add click handler for accordion
    header.addEventListener('click', toggleAccordion);

    header.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion.call(this);
      }
    });

    accordion.appendChild(content);
    return accordion;
  }
  
  /**
   * Create an accordion section for a page region
   * @param {string} region - Region name
   * @param {Array} issues - Array of issues in this region
   * @returns {HTMLElement} - The accordion element
   */
  function createRegionAccordion(region, issues) {
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
    accordion.className = 'accordion region-accordion';
    accordion.setAttribute('id', `accordion-region-${region.replace(/\s+/g, '-').toLowerCase()}`);

    // Create accordion header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('tabindex', '0');

    // Add expand/collapse icon
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.innerHTML = '▶';
    icon.setAttribute('aria-hidden', 'true');
    header.appendChild(icon);

    // Add region name
    const title = document.createElement('h2');
    title.className = 'accordion-title';
    title.textContent = region;
    header.appendChild(title);

    // Add summary counts
    const summary = document.createElement('div');
    summary.className = 'accordion-summary';

    if (counts.fail > 0) {
      const failCount = document.createElement('span');
      failCount.className = 'count fail';
      failCount.textContent = `${counts.fail} ${counts.fail === 1 ? 'Fail' : 'Fails'}`;
      summary.appendChild(failCount);
    }

    if (counts.warning > 0) {
      const warnCount = document.createElement('span');
      warnCount.className = 'count warning';
      warnCount.textContent = `${counts.warning} ${counts.warning === 1 ? 'Warning' : 'Warnings'}`;
      summary.appendChild(warnCount);
    }

    if (counts.info > 0) {
      const infoCount = document.createElement('span');
      infoCount.className = 'count info';
      infoCount.textContent = `${counts.info} ${counts.info === 1 ? 'Info' : 'Info'}`;
      summary.appendChild(infoCount);
    }

    header.appendChild(summary);
    accordion.appendChild(header);

    // Create accordion content
    const content = document.createElement('div');
    content.className = 'accordion-content';

    // Group issues by touchpoint within the region
    const issuesByTouchpoint = {};
    issues.forEach(issue => {
      if (!issuesByTouchpoint[issue.touchpoint]) {
        issuesByTouchpoint[issue.touchpoint] = [];
      }
      issuesByTouchpoint[issue.touchpoint].push(issue);
    });

    // Create sub-sections for each touchpoint
    Object.keys(issuesByTouchpoint).sort().forEach(touchpoint => {
      const touchpointIssues = issuesByTouchpoint[touchpoint];
      
      // Create touchpoint subsection
      const subsection = document.createElement('div');
      subsection.className = 'touchpoint-subsection';
      
      const touchpointTitle = document.createElement('h3');
      touchpointTitle.className = 'touchpoint-subsection-title';
      touchpointTitle.textContent = touchpoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      subsection.appendChild(touchpointTitle);
      
      // Create issue list
      const issueList = document.createElement('ul');
      issueList.className = 'issue-list';
      
      // Sort issues by type first, then alphabetically
      touchpointIssues.sort((a, b) => {
        // First sort by type (fail, warning, info)
        const typeOrder = { fail: 0, warning: 1, info: 2 };
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;
        
        // Then sort alphabetically by title within the same type
        return a.title.localeCompare(b.title);
      });
      
      touchpointIssues.forEach((issue, index) => {
        const issueItem = createIssueElement(issue, touchpoint, index);
        issueList.appendChild(issueItem);
      });
      
      subsection.appendChild(issueList);
      content.appendChild(subsection);
    });

    accordion.appendChild(content);
    return accordion;
  }

  /**
   * Create a section for a WCAG guideline
   * @param {string} guideline - Guideline key (e.g., "1.1 Text Alternatives")
   * @param {Array} issues - Array of issues for this guideline
   * @param {number} index - Section index
   * @returns {HTMLElement} - The section element
   */
  function createGuidelineSection(guideline, issues, index) {
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
    accordion.className = 'accordion guideline-accordion';
    accordion.setAttribute('id', `accordion-guideline-${index}`);

    // Create accordion header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `content-guideline-${index}`);
    header.setAttribute('tabindex', '0');

    // Add expand/collapse icon
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.innerHTML = '▶';
    icon.setAttribute('aria-hidden', 'true');
    header.appendChild(icon);

    // Add guideline name
    const title = document.createElement('h2');
    title.className = 'accordion-title';
    title.textContent = `WCAG ${guideline}`;
    header.appendChild(title);

    // Add summary counts
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
    accordion.appendChild(header);

    // Create accordion content
    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.setAttribute('id', `content-guideline-${index}`);
    
    // Group issues by touchpoint within this guideline
    const issuesByTouchpoint = {};
    issues.forEach(issue => {
      const key = issue.touchpointTitle;
      if (!issuesByTouchpoint[key]) {
        issuesByTouchpoint[key] = [];
      }
      issuesByTouchpoint[key].push(issue);
    });

    // Sort touchpoints alphabetically and create subsections
    const sortedTouchpoints = Object.entries(issuesByTouchpoint)
      .sort(([a], [b]) => a.localeCompare(b));
    
    sortedTouchpoints.forEach(([touchpointTitle, touchpointIssues]) => {
      const touchpointSection = document.createElement('div');
      touchpointSection.className = 'touchpoint-subsection';
      
      const touchpointHeader = document.createElement('h3');
      touchpointHeader.className = 'touchpoint-subsection-title';
      touchpointHeader.textContent = touchpointTitle;
      touchpointSection.appendChild(touchpointHeader);
      
      // Sort issues within touchpoint by type first, then alphabetically
      const sortedIssues = touchpointIssues.sort((a, b) => {
        // First sort by type (fail, warning, info)
        const typeOrder = { fail: 0, warning: 1, info: 2 };
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;
        
        // Then sort alphabetically by title within the same type
        return a.title.localeCompare(b.title);
      });
      
      sortedIssues.forEach(issue => {
        const issueElement = createIssueElement(issue, issue.touchpoint);
        touchpointSection.appendChild(issueElement);
      });
      
      content.appendChild(touchpointSection);
    });

    // Add click handler for accordion
    header.addEventListener('click', toggleAccordion);

    header.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion.call(this);
      }
    });

    accordion.appendChild(content);
    return accordion;
  }

  /**
   * Create a section for a WCAG success criteria
   * @param {string} criteria - Success criteria (e.g., "1.1.1")
   * @param {Array} issues - Array of issues for this criteria
   * @param {number} index - Section index
   * @returns {HTMLElement} - The section element
   */
  function createCriteriaSection(criteria, issues, index) {
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
    accordion.className = 'accordion criteria-accordion';
    accordion.setAttribute('id', `accordion-criteria-${index}`);

    // Create accordion header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `content-criteria-${index}`);
    header.setAttribute('tabindex', '0');

    // Add expand/collapse icon
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.innerHTML = '▶';
    icon.setAttribute('aria-hidden', 'true');
    header.appendChild(icon);

    // Add criteria number
    const title = document.createElement('h2');
    title.className = 'accordion-title';
    title.textContent = `WCAG ${criteria}`;
    header.appendChild(title);

    // Add summary counts
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
    accordion.appendChild(header);

    // Create accordion content
    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.setAttribute('id', `content-criteria-${index}`);
    
    // Group issues by touchpoint within this criteria
    const issuesByTouchpoint = {};
    issues.forEach(issue => {
      const key = issue.touchpointTitle;
      if (!issuesByTouchpoint[key]) {
        issuesByTouchpoint[key] = [];
      }
      issuesByTouchpoint[key].push(issue);
    });

    // Sort touchpoints alphabetically and create subsections
    const sortedTouchpoints = Object.entries(issuesByTouchpoint)
      .sort(([a], [b]) => a.localeCompare(b));
    
    sortedTouchpoints.forEach(([touchpointTitle, touchpointIssues]) => {
      const touchpointSection = document.createElement('div');
      touchpointSection.className = 'touchpoint-subsection';
      
      const touchpointHeader = document.createElement('h3');
      touchpointHeader.className = 'touchpoint-subsection-title';
      touchpointHeader.textContent = touchpointTitle;
      touchpointSection.appendChild(touchpointHeader);
      
      // Sort issues within touchpoint by type first, then alphabetically
      const sortedIssues = touchpointIssues.sort((a, b) => {
        // First sort by type (fail, warning, info)
        const typeOrder = { fail: 0, warning: 1, info: 2 };
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;
        
        // Then sort alphabetically by title within the same type
        return a.title.localeCompare(b.title);
      });
      
      sortedIssues.forEach(issue => {
        const issueElement = createIssueElement(issue, issue.touchpoint);
        touchpointSection.appendChild(issueElement);
      });
      
      content.appendChild(touchpointSection);
    });

    // Add click handler for accordion
    header.addEventListener('click', toggleAccordion);

    header.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion.call(this);
      }
    });

    accordion.appendChild(content);
    return accordion;
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
    
    // Add help button immediately after the summary if documentation system is available
    if (window.CarnforthDocumentation && window.CarnforthDocumentation.createHelpButton) {
      const helpButton = window.CarnforthDocumentation.createHelpButton(touchpoint);
      helpButton.style.marginLeft = '0.5rem'; // Small gap after the text
      header.appendChild(helpButton);
    }
    
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
    
    // Create container for bullet and info button
    const indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'issue-indicator';
    
    // Add type indicator
    const bullet = document.createElement('span');
    bullet.className = `issue-bullet ${issue.type}`;
    bullet.textContent = issue.type === 'fail' ? 'F' : issue.type === 'warning' ? 'W' : 'I';
    // Hide the bullet letter from screen readers as we have the semantic label
    bullet.setAttribute('aria-hidden', 'true');
    
    // Add bullet to container
    indicatorContainer.appendChild(bullet);
    
    // Create a screen reader text that announces the type
    const srType = document.createElement('span');
    srType.className = 'issue-type-label';
    srType.textContent = issue.type === 'fail' ? 'Fail: ' : issue.type === 'warning' ? 'Warning: ' : 'Info: ';
    
    // Append the indicator container to the title
    title.appendChild(indicatorContainer);
    
    // Check if we have documentation for this issue type and add info button right after bullet
    if (window.CarnforthDocumentation && window.CarnforthDocumentation.createIssueInfoButton) {
      // Determine issue key based on touchpoint and issue title
      let issueKey = null;
      
      // Map common issue patterns to documentation keys
      if (touchpoint === 'maps') {
        if (issue.title.includes('map missing accessible name') || 
            issue.title.includes('missing accessibility attributes') ||
            issue.title.includes('missing alternative text')) {
          issueKey = 'maps-no-accessible-name';
        } else if (issue.title.includes('has generic accessible name') || 
                   issue.title.includes('has generic alternative text')) {
          issueKey = 'generic-map-name';
        } else if (issue.title.includes('role="presentation"')) {
          issueKey = 'maps-presentation-role';
        } else if (issue.title.includes('aria-hidden')) {
          issueKey = 'maps-aria-hidden';
        } else if (issue.title.includes('map control') && issue.title.includes('has insufficient touch target size')) {
          // Check WCAG level to determine which documentation to show
          if (issue.wcag && issue.wcag.level === 'AA') {
            issueKey = 'map-control-too-small';
          } else {
            issueKey = 'map-controls-suboptimal-size';
          }
        }
      } else if (touchpoint === 'tabindex') {
        if (issue.title.includes('Positive tabindex')) {
          issueKey = 'positive-tabindex';
        } else if (issue.title.includes('Non-interactive element') && issue.title.includes('tabindex="0"')) {
          issueKey = 'tabindex-on-non-interactive';
        }
      } else if (touchpoint === 'accessible_name') {
        if (issue.title.includes('no accessible name')) {
          issueKey = 'no-accessible-name';
        }
      }
      
      // If we have a matching documentation key, add the info button
      if (issueKey && window.CarnforthDocumentation.issueDocumentation[issueKey]) {
        const infoButton = window.CarnforthDocumentation.createIssueInfoButton(touchpoint, issueKey, issue);
        indicatorContainer.appendChild(infoButton);
      }
    }
    
    title.appendChild(srType);
    
    // Add the issue title text
    const titleText = document.createTextNode(issue.title);
    title.appendChild(titleText);
    
    // Add the heading to the button
    disclosureBtn.appendChild(title);
    
    // Add xpath to collapsed view if it exists
    if (issue.xpath) {
      const xpathPreview = document.createElement('div');
      xpathPreview.className = 'xpath-preview';
      xpathPreview.textContent = `XPath: ${issue.xpath}`;
      disclosureBtn.appendChild(xpathPreview);
    }
    
    // Add the disclosure button to the list item
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

    // 1a. Add region information if present
    if (issue.region && issue.region !== 'Unknown') {
      const regionSection = document.createElement('div');
      regionSection.className = 'issue-region';
      
      const regionLabel = document.createElement('strong');
      regionLabel.textContent = 'Page Region: ';
      regionSection.appendChild(regionLabel);
      
      const regionText = document.createTextNode(issue.region);
      regionSection.appendChild(regionText);
      
      details.appendChild(regionSection);
    }

    // 1b. Add providers list if present (for info messages about maps)
    if (issue.providers && Array.isArray(issue.providers) && issue.providers.length > 0) {
      const providerSection = document.createElement('div');
      providerSection.className = 'provider-list-section';
      
      const listTitle = document.createElement('p');
      listTitle.className = 'provider-list-title';
      listTitle.textContent = 'Map providers found:';
      providerSection.appendChild(listTitle);
      
      const providerList = document.createElement('ul');
      providerList.className = 'provider-list';
      
      issue.providers.forEach(({provider, count}) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${provider}: ${count} map${count !== 1 ? 's' : ''}`;
        providerList.appendChild(listItem);
      });
      
      providerSection.appendChild(providerList);
      details.appendChild(providerSection);
    }

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

      // Impact Level (previously called Severity)
      if (issue.impact.level) {
        const severitySection = document.createElement('div');
        severitySection.className = 'impact-severity';
        
        const severityLabel = document.createElement('strong');
        severityLabel.textContent = 'Impact Level: ';
        severitySection.appendChild(severityLabel);
        
        const severitySpan = document.createElement('span');
        severitySpan.className = `impact-level impact-level-${issue.impact.level}`;
        severitySpan.textContent = issue.impact.level.charAt(0).toUpperCase() + issue.impact.level.slice(1);
        severitySection.appendChild(severitySpan);
        
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
      wcagInfo.className = 'wcag-info';
      
      if (issue.wcag.principle) {
        const principleDiv = document.createElement('div');
        principleDiv.className = 'wcag-principle';
        principleDiv.innerHTML = '<strong>Principle:</strong> ' + issue.wcag.principle;
        wcagInfo.appendChild(principleDiv);
      }
      
      if (issue.wcag.guideline) {
        const guidelineDiv = document.createElement('div');
        guidelineDiv.className = 'wcag-guideline';
        guidelineDiv.innerHTML = '<strong>Guideline:</strong> ' + issue.wcag.guideline;
        wcagInfo.appendChild(guidelineDiv);
      }
      
      if (issue.wcag.successCriterion) {
        // Check if there are multiple success criteria (comma-separated)
        const criteria = issue.wcag.successCriterion.split(',').map(c => c.trim());
        
        if (criteria.length === 1) {
          // Single criterion
          const criterionDiv = document.createElement('div');
          criterionDiv.className = 'wcag-criterion';
          let criterionText = '<strong>Success Criterion:</strong> ' + issue.wcag.successCriterion;
          if (issue.wcag.level) {
            criterionText += ` (Level ${issue.wcag.level})`;
          }
          criterionDiv.innerHTML = criterionText;
          wcagInfo.appendChild(criterionDiv);
        } else {
          // Multiple criteria
          const criteriaLabel = document.createElement('div');
          criteriaLabel.className = 'wcag-criterion-label';
          criteriaLabel.innerHTML = '<strong>Success Criteria:</strong>';
          wcagInfo.appendChild(criteriaLabel);
          
          const criteriaList = document.createElement('ul');
          criteriaList.className = 'wcag-criteria-list';
          
          criteria.forEach(criterion => {
            const li = document.createElement('li');
            li.textContent = criterion;
            if (issue.wcag.level) {
              li.textContent += ` (Level ${issue.wcag.level})`;
            }
            criteriaList.appendChild(li);
          });
          
          wcagInfo.appendChild(criteriaList);
        }
      }
      
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
        
        const htmlContainer = document.createElement('pre');
        htmlContainer.className = 'issue-html';
        
        const codeElement = document.createElement('code');
        codeElement.className = 'language-html';
        codeElement.textContent = issue.html;
        htmlContainer.appendChild(codeElement);
        
        technicalSection.appendChild(htmlContainer);
        
        // We'll apply our custom syntax highlighting when all elements are ready
      }
      
      // Add before and after code example if present
      if (issue.codeExample && issue.codeExample.before && issue.codeExample.after) {
        const beforeAfterSection = document.createElement('div');
        beforeAfterSection.className = 'before-after-example';
        
        const exampleTitle = document.createElement('h4');
        exampleTitle.textContent = 'Before & After Example';
        beforeAfterSection.appendChild(exampleTitle);
        
        // Before code
        const beforeLabel = document.createElement('div');
        beforeLabel.className = 'technical-label code-label-before';
        beforeLabel.textContent = 'Before:';
        beforeAfterSection.appendChild(beforeLabel);
        
        const beforeContainer = document.createElement('pre');
        beforeContainer.className = 'issue-before-code';
        
        const beforeCodeElement = document.createElement('code');
        beforeCodeElement.className = 'language-html';
        beforeCodeElement.textContent = issue.codeExample.before;
        beforeContainer.appendChild(beforeCodeElement);
        
        beforeAfterSection.appendChild(beforeContainer);
        
        // After code
        const afterLabel = document.createElement('div');
        afterLabel.className = 'technical-label code-label-after';
        afterLabel.textContent = 'After:';
        beforeAfterSection.appendChild(afterLabel);
        
        const afterContainer = document.createElement('pre');
        afterContainer.className = 'issue-after-code';
        
        const afterCodeElement = document.createElement('code');
        afterCodeElement.className = 'language-html';
        afterCodeElement.textContent = issue.codeExample.after;
        afterContainer.appendChild(afterCodeElement);
        
        beforeAfterSection.appendChild(afterContainer);
        
        // We'll apply our custom syntax highlighting when all elements are ready
        
        technicalSection.appendChild(beforeAfterSection);
      }
      
      // Add fixed HTML example if present (legacy support)
      if (issue.fixedHtml) {
        const fixedHtmlLabel = document.createElement('div');
        fixedHtmlLabel.className = 'technical-label';
        fixedHtmlLabel.textContent = 'Example Fix:';
        technicalSection.appendChild(fixedHtmlLabel);
        
        const fixedHtmlContainer = document.createElement('pre');
        fixedHtmlContainer.className = 'issue-fixed-html';
        
        const fixedCodeElement = document.createElement('code');
        fixedCodeElement.className = 'language-html';
        fixedCodeElement.textContent = issue.fixedHtml;
        fixedHtmlContainer.appendChild(fixedCodeElement);
        
        technicalSection.appendChild(fixedHtmlContainer);
        
        // We'll apply our custom syntax highlighting when all elements are ready
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
    let errors = 0;

    // Count all issues by type
    Object.values(results).forEach(touchpoint => {
      (touchpoint.issues || []).forEach(issue => {
        if (issue.type === 'fail') fails++;
        else if (issue.type === 'warning') warnings++;
        else if (issue.type === 'info') infos++;
        else if (issue.type === 'error') errors++;
      });
    });

    // Update the count displays
    failCount.textContent = `${fails} ${fails === 1 ? 'Fail' : 'Fails'}`;
    warningCount.textContent = `${warnings} ${warnings === 1 ? 'Warning' : 'Warnings'}`;
    infoCount.textContent = `${infos} ${infos === 1 ? 'Info' : 'Info'}`;
    
    // Create a more descriptive announcement for screen readers
    // Use the preferred order: error > fail > warn > info
    let summaryText = `Testing complete.`;
    
    if (errors > 0) {
      summaryText += ` ${errors} ${errors === 1 ? 'execution error' : 'execution errors'} detected.`;
    }
    
    summaryText += ` Found ${fails} ${fails === 1 ? 'failure' : 'failures'}, ${warnings} ${warnings === 1 ? 'warning' : 'warnings'}, and ${infos} information ${infos === 1 ? 'item' : 'items'}.`;
    
    if (errors > 0) {
      summaryText += ` Please check the browser console for details on the execution errors.`;
    }
    
    testStatus.textContent = summaryText;
  }

  /**
   * Get WCAG principle from criterion number
   * @param {string} criterionNumber - WCAG criterion number (e.g., "1.1.1")
   * @returns {string|null} - The principle name or null
   */
  function getPrincipleFromCriterion(criterionNumber) {
    if (!criterionNumber) return null;
    
    const firstDigit = criterionNumber.charAt(0);
    switch (firstDigit) {
      case '1': return 'perceivable';
      case '2': return 'operable';
      case '3': return 'understandable';
      case '4': return 'robust';
      default: return null;
    }
  }

  /**
   * Calculate and display accessibility scores
   * @param {Object} results - Test results
   */
  function calculateAndDisplayScores(results) {
    // Critical barriers that completely prevent access
    const criticalBarrierPatterns = [
      'no accessible name',
      'missing accessible name',
      'keyboard trap',
      'missing form label',
      'aria-hidden="true"',
      'focus order prevents',
      'touch target.*too small',
      'insufficient touch target'
    ];
    
    // Count metrics
    let criticalBarriers = 0;
    let touchpointsWithFailures = 0;
    let touchpointsWithTestableElements = 0;
    let totalIssues = 0;
    let totalElementsTested = 0;
    let principleWeightedScore = 0;
    
    // Track principle violations
    const principleViolations = {
      perceivable: 0,
      operable: 0,
      understandable: 0,
      robust: 0
    };
    
    // Analyze results
    Object.entries(results).forEach(([touchpoint, data]) => {
      if (touchpoint === '__summary') return;
      
      const issues = data.issues || [];
      
      // Check if touchpoint found elements to test
      const hasNoElementsInfo = issues.some(issue => 
        issue.type === 'info' && 
        (issue.title.includes('No') || issue.title.includes('no elements'))
      );
      
      if (!hasNoElementsInfo && issues.length > 0) {
        touchpointsWithTestableElements++;
        
        // Check for failures
        const failures = issues.filter(issue => issue.type === 'fail');
        if (failures.length > 0) {
          touchpointsWithFailures++;
        }
        
        // Count all issues
        totalIssues += issues.length;
        
        // Count critical barriers
        issues.forEach(issue => {
          if (issue.type === 'fail') {
            const isCritical = criticalBarrierPatterns.some(pattern => {
              const regex = new RegExp(pattern, 'i');
              return regex.test(issue.title) || regex.test(issue.description);
            });
            if (isCritical) {
              criticalBarriers++;
            }
            
            // Track principle violations
            if (issue.wcag && issue.wcag.criteria) {
              const criterionNumber = issue.wcag.criteria.split(' ')[0];
              const principle = getPrincipleFromCriterion(criterionNumber);
              if (principle) {
                principleViolations[principle]++;
              }
            }
          }
        });
      }
      
      // Estimate elements tested (approximate based on touchpoint)
      if (data.metadata && data.metadata.elementsChecked) {
        totalElementsTested += data.metadata.elementsChecked;
      } else if (!hasNoElementsInfo) {
        // Rough estimate if metadata not available
        totalElementsTested += Math.max(issues.length, 1);
      }
    });
    
    // Calculate the three metrics
    
    // 1. Critical Barriers - raw count
    const criticalBarriersCount = criticalBarriers;
    
    // 2. Breadth Score - percentage of touchpoints with failures
    const breadthScore = touchpointsWithTestableElements > 0 
      ? (touchpointsWithFailures / touchpointsWithTestableElements) * 100 
      : 0;
    
    // 3. Calculate principle weighted score
    const principleWeights = {
      perceivable: 1.0,
      operable: 1.0,
      understandable: 0.8,
      robust: 0.7
    };
    
    Object.entries(principleViolations).forEach(([principle, count]) => {
      principleWeightedScore += count * principleWeights[principle];
    });
    
    // Normalize principle score to 0-100 scale
    const maxPossiblePrincipleScore = totalIssues * 1.0; // All issues at max weight
    const normalizedPrincipleScore = maxPossiblePrincipleScore > 0 
      ? (principleWeightedScore / maxPossiblePrincipleScore) * 100 
      : 0;
    
    // Calculate friction score
    const frictionScore = totalElementsTested > 0 
      ? (totalIssues / totalElementsTested) * 100 
      : 0;
    
    // 3. A11y Index - combined metric
    const a11yIndex = Math.max(0, 100 - (
      (breadthScore * 0.5) + 
      (frictionScore * 0.3) + 
      (normalizedPrincipleScore * 0.2)
    ));
    
    // Display the new three metrics
    const criticalBarriersElement = document.getElementById('critical-barriers');
    const breadthScoreElement = document.getElementById('breadth-score');
    const a11yIndexElement = document.getElementById('a11y-index');
    
    if (criticalBarriersElement) {
      criticalBarriersElement.innerHTML = `
        <span class="metric-value ${criticalBarriersCount === 0 ? 'good' : 'fail'}">${criticalBarriersCount}</span>
        <span class="metric-status">${criticalBarriersCount === 0 ? '✓' : '❌'}</span>
      `;
    }
    
    if (breadthScoreElement) {
      breadthScoreElement.innerHTML = `
        <span class="metric-value">${Math.round(breadthScore)}%</span>
        <span class="metric-description">of relevant guidelines</span>
      `;
    }
    
    if (a11yIndexElement) {
      a11yIndexElement.innerHTML = `
        <span class="metric-value">${Math.round(a11yIndex)}</span>
        <span class="metric-description">directional indicator</span>
      `;
    }
    
    // Store scoring details for info button
    window.scoringDetails = {
      criticalBarriers: criticalBarriersCount,
      breadthScore: breadthScore,
      a11yIndex: a11yIndex,
      touchpointsWithFailures: touchpointsWithFailures,
      touchpointsWithTestableElements: touchpointsWithTestableElements,
      totalIssues: totalIssues,
      totalElementsTested: totalElementsTested,
      principleViolations: principleViolations
    };
  }

  /**
   * Create charts for the results summary
   * @param {Object} results - Test results
   */
  function createCharts(results) {
    // Count issues by impact, type, and WCAG level
    const impactCounts = { high: 0, medium: 0, low: 0 };
    const typeCounts = { fail: 0, warning: 0, info: 0 };
    const levelCounts = { A: 0, AA: 0, AAA: 0 };
    
    Object.entries(results).forEach(([touchpoint, data]) => {
      if (touchpoint === '__summary') return;
      
      const issues = data.issues || [];
      
      issues.forEach(issue => {
        // Count by type
        if (issue.type in typeCounts) {
          typeCounts[issue.type]++;
        }
        
        // Count by impact
        if (issue.impact) {
          const impactLevel = issue.impact.level || issue.impact;
          if (impactLevel in impactCounts) {
            impactCounts[impactLevel]++;
          }
        }
        
        // Count by WCAG level (only for failures)
        if (issue.type === 'fail' && issue.wcag && issue.wcag.level) {
          if (issue.wcag.level in levelCounts) {
            levelCounts[issue.wcag.level]++;
          }
        }
      });
    });
    
    // Create accessible SVG charts
    createAccessiblePieChart('impact-chart', 
      'Distribution of issues by impact severity',
      [
        { label: 'High Impact', value: impactCounts.high, color: '#d32f2f', pattern: 'high-impact' },
        { label: 'Medium Impact', value: impactCounts.medium, color: '#f57c00', pattern: 'medium-impact' },
        { label: 'Low Impact', value: impactCounts.low, color: '#388e3c', pattern: 'low-impact' }
      ]
    );
    
    createAccessiblePieChart('type-chart',
      'Distribution of issues by type',
      [
        { label: 'Failures', value: typeCounts.fail, color: '#b71c1c', pattern: 'fail-type' },
        { label: 'Warnings', value: typeCounts.warning, color: '#ff6f00', pattern: 'warning-type' },
        { label: 'Information', value: typeCounts.info, color: '#1976d2', pattern: 'info-type' }
      ]
    );
    
    createAccessibleBarChart('level-chart',
      'Number of failures by WCAG level',
      [
        { label: 'Level A', value: levelCounts.A, color: '#b71c1c', pattern: 'level-a' },
        { label: 'Level AA', value: levelCounts.AA, color: '#ff6f00', pattern: 'level-aa' },
        { label: 'Level AAA', value: levelCounts.AAA, color: '#388e3c', pattern: 'level-aaa' }
      ]
    );
  }

  /**
   * Create an accessible pie chart using SVG
   * @param {string} containerId - ID of the container element
   * @param {string} description - Chart description for screen readers
   * @param {Array} data - Array of {label, value, color, pattern}
   */
  function createAccessiblePieChart(containerId, description, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Calculate dimensions - larger pie chart, centered
    const svgWidth = 400;
    const chartHeight = 240; // Reduced height to minimize whitespace
    const radius = 120; // Larger radius for better visibility
    const centerX = svgWidth / 2; // Center horizontally in the full width
    const centerY = radius + 10; // Position based on radius to minimize top space
    
    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', chartHeight);
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${chartHeight}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', description);
    
    // Add title for tooltip
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = description;
    svg.appendChild(title);
    
    // Add description
    const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
    const detailedDesc = data.map(d => `${d.label}: ${d.value} (${total > 0 ? Math.round(d.value/total*100) : 0}%)`).join(', ');
    desc.textContent = detailedDesc;
    svg.appendChild(desc);
    
    // Define patterns for high contrast mode
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    data.forEach(item => {
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', item.pattern);
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern.setAttribute('width', '10');
      pattern.setAttribute('height', '10');
      
      // Different patterns for different data types
      if (item.pattern.includes('high') || item.pattern.includes('fail')) {
        // Diagonal stripes for high/fail
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '10');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', item.color);
        pattern.appendChild(rect);
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,10 L10,0 M0,0 L10,10');
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('opacity', '0.4');
        pattern.appendChild(path);
      } else if (item.pattern.includes('medium') || item.pattern.includes('warning')) {
        // Dots for medium/warning
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '10');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', item.color);
        pattern.appendChild(rect);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '5');
        circle.setAttribute('cy', '5');
        circle.setAttribute('r', '2');
        circle.setAttribute('fill', 'white');
        circle.setAttribute('opacity', '0.4');
        pattern.appendChild(circle);
      } else {
        // Horizontal lines for low/info
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '10');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', item.color);
        pattern.appendChild(rect);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '5');
        line.setAttribute('x2', '10');
        line.setAttribute('y2', '5');
        line.setAttribute('stroke', 'white');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.4');
        pattern.appendChild(line);
      }
      
      defs.appendChild(pattern);
    });
    svg.appendChild(defs);
    
    if (total === 0) {
      // No data message
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', centerX);
      text.setAttribute('y', centerY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'chart-no-data');
      text.textContent = 'No data';
      svg.appendChild(text);
    } else {
      // Create two groups - one for slices, one for labels
      const slicesG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const labelsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Store label data while drawing slices
      const labelData = [];
      
      // First pass: Draw all pie slices
      let currentAngle = -Math.PI / 2; // Start at top
      
      data.forEach((item, index) => {
        if (item.value === 0) return;
        
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;
        
        // Create path for slice
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
        const x1 = centerX + Math.cos(currentAngle) * radius;
        const y1 = centerY + Math.sin(currentAngle) * radius;
        const x2 = centerX + Math.cos(endAngle) * radius;
        const y2 = centerY + Math.sin(endAngle) * radius;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        path.setAttribute('d', d);
        path.setAttribute('fill', `url(#${item.pattern})`); // Use pattern by default
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('class', 'chart-slice');
        path.setAttribute('data-color', item.color); // Store original color
        path.setAttribute('tabindex', '0');
        path.setAttribute('role', 'img');
        path.setAttribute('aria-label', `${item.label}: ${item.value} (${Math.round(item.value/total*100)}%)`);
        
        slicesG.appendChild(path);
        
        // Store label data for second pass
        const labelAngle = currentAngle + sliceAngle / 2;
        labelData.push({
          value: item.value,
          angle: labelAngle
        });
        
        currentAngle = endAngle;
      });
      
      // Add slices group first
      svg.appendChild(slicesG);
      
      // Second pass: Draw all labels on top
      labelData.forEach(label => {
        // Position labels closer to center to avoid clipping
        const labelRadius = radius * 0.6;
        const labelX = centerX + Math.cos(label.angle) * labelRadius;
        const labelY = centerY + Math.sin(label.angle) * labelRadius;
        
        // Create a group for the label
        const labelG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Add white background rect for contrast with proper sizing
        const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const labelText = label.value.toString();
        const textWidth = labelText.length * 12 + 20; // Add more padding for 1px border
        const textHeight = 30; // Taller to provide padding above text
        
        labelBg.setAttribute('x', labelX - textWidth/2);
        labelBg.setAttribute('y', labelY - textHeight/2);
        labelBg.setAttribute('width', textWidth);
        labelBg.setAttribute('height', textHeight);
        labelBg.setAttribute('fill', 'white');
        labelBg.setAttribute('stroke', '#333');
        labelBg.setAttribute('stroke-width', '1');
        labelBg.setAttribute('rx', '4');
        labelBg.setAttribute('ry', '4');
        labelBg.setAttribute('fill-opacity', '0.95'); // Slight transparency
        labelG.appendChild(labelBg);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY + 3); // Position text with padding from top of background
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('class', 'chart-value');
        text.setAttribute('fill', '#333'); // Dark text on white background
        text.setAttribute('aria-hidden', 'true');
        text.textContent = labelText;
        labelG.appendChild(text);
        
        labelsG.appendChild(labelG);
      });
      
      // Add labels group on top
      svg.appendChild(labelsG);
    }
    
    // Add legend below the chart with better spacing
    const legendStartY = chartHeight + 42; // One line height (42px) gap after chart
    const legendG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendG.setAttribute('class', 'chart-legend');
    
    // Calculate legend height based on number of items with proper spacing
    const legendItemHeight = 42; // 1.5x line height (28px * 1.5 = 42px)
    const activeItems = data.filter(item => item.value > 0).length;
    const legendHeight = (activeItems * legendItemHeight) + 20; // Add padding
    
    // Update SVG height to accommodate legend
    svg.setAttribute('height', chartHeight + legendHeight);
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${chartHeight + legendHeight}`);
    
    // Create legend items vertically to avoid overlap
    let legendY = legendStartY;
    data.forEach((item, index) => {
      if (item.value > 0) {
        // Legend item group
        const itemG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Single pattern indicator that combines color and pattern
        const legendIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const swatchHeight = 20; // ~80% of 28px font height for visual separation
        const swatchY = legendY + (42 - swatchHeight) / 2; // Center swatch in line height
        const legendX = 20; // Position legend with left padding to prevent clipping
        legendIndicator.setAttribute('x', legendX);
        legendIndicator.setAttribute('y', swatchY);
        legendIndicator.setAttribute('width', '20');
        legendIndicator.setAttribute('height', swatchHeight);
        legendIndicator.setAttribute('fill', `url(#${item.pattern})`);
        legendIndicator.setAttribute('stroke', '#333');
        legendIndicator.setAttribute('stroke-width', '1');
        legendIndicator.setAttribute('class', 'legend-color');
        itemG.appendChild(legendIndicator);
        
        // Label with percentage
        const percentage = total > 0 ? Math.round(item.value/total*100) : 0;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', legendX + 25); // Position text 25px after rectangle
        text.setAttribute('y', legendY + 28); // Position text baseline at legendY + font height (28px)
        text.setAttribute('class', 'legend-text');
        text.textContent = `${item.label}: ${item.value} (${percentage}%)`;
        itemG.appendChild(text);
        
        legendG.appendChild(itemG);
        legendY += 42; // 1.5x line height (28px * 1.5 = 42px)
      }
    });
    
    svg.appendChild(legendG);
    container.appendChild(svg);
    
    // Add accessible data table (visually hidden but available to screen readers)
    const table = document.createElement('table');
    table.className = 'sr-only';
    table.setAttribute('summary', description);
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const thCategory = document.createElement('th');
    thCategory.textContent = 'Category';
    const thCount = document.createElement('th');
    thCount.textContent = 'Count';
    const thPercentage = document.createElement('th');
    thPercentage.textContent = 'Percentage';
    headerRow.appendChild(thCategory);
    headerRow.appendChild(thCount);
    headerRow.appendChild(thPercentage);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
      const tdCategory = document.createElement('td');
      tdCategory.textContent = item.label;
      const tdCount = document.createElement('td');
      tdCount.textContent = item.value;
      const tdPercentage = document.createElement('td');
      tdPercentage.textContent = total > 0 ? `${Math.round(item.value/total*100)}%` : '0%';
      row.appendChild(tdCategory);
      row.appendChild(tdCount);
      row.appendChild(tdPercentage);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    container.appendChild(table);
  }

  /**
   * Create an accessible bar chart using SVG
   * @param {string} containerId - ID of the container element
   * @param {string} description - Chart description for screen readers
   * @param {Array} data - Array of {label, value, color, pattern}
   */
  function createAccessibleBarChart(containerId, description, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Calculate dimensions - match pie chart dimensions for consistency
    const width = 400; // Match pie chart width
    const height = 240; // Match pie chart height
    const padding = 40;
    const chartTop = 10; // Add consistent top padding
    const barWidth = (width - padding * 2) / data.length - 10;
    
    // Find max value
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', description);
    
    // Add title for tooltip
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = description;
    svg.appendChild(title);
    
    // Add description
    const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
    const detailedDesc = data.map(d => `${d.label}: ${d.value}`).join(', ');
    desc.textContent = detailedDesc;
    svg.appendChild(desc);
    
    // Define patterns for high contrast mode
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    data.forEach(item => {
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', item.pattern);
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern.setAttribute('width', '10');
      pattern.setAttribute('height', '10');
      
      // Different patterns for different levels
      if (item.pattern.includes('level-a')) {
        // Diagonal stripes for Level A
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '10');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', item.color);
        pattern.appendChild(rect);
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,10 L10,0 M0,0 L10,10');
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('opacity', '0.4');
        pattern.appendChild(path);
      } else if (item.pattern.includes('level-aa')) {
        // Dots for Level AA
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '10');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', item.color);
        pattern.appendChild(rect);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '5');
        circle.setAttribute('cy', '5');
        circle.setAttribute('r', '2');
        circle.setAttribute('fill', 'white');
        circle.setAttribute('opacity', '0.4');
        pattern.appendChild(circle);
      } else {
        // Horizontal lines for Level AAA
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '10');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', item.color);
        pattern.appendChild(rect);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '5');
        line.setAttribute('x2', '10');
        line.setAttribute('y2', '5');
        line.setAttribute('stroke', 'white');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.4');
        pattern.appendChild(line);
      }
      
      defs.appendChild(pattern);
    });
    svg.appendChild(defs);
    
    // Create bars group
    const barsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    barsG.setAttribute('class', 'chart-bars');
    
    // Draw bars
    data.forEach((item, index) => {
      const barX = padding + index * (barWidth + 10);
      const barHeight = item.value > 0 ? (item.value / maxValue) * (height - padding * 2 - chartTop) : 0;
      const barY = height - padding - barHeight;
      
      // Create bar group
      const barG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      barG.setAttribute('tabindex', '0');
      barG.setAttribute('role', 'img');
      barG.setAttribute('aria-label', `${item.label}: ${item.value} failures`);
      
      // Draw bar
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', barX);
      rect.setAttribute('y', barY);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', `url(#${item.pattern})`); // Use pattern by default
      rect.setAttribute('stroke', '#333');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('class', 'chart-bar');
      rect.setAttribute('data-color', item.color); // Store original color
      barG.appendChild(rect);
      
      // Draw value on top
      if (item.value > 0) {
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', barX + barWidth / 2);
        valueText.setAttribute('y', barY - 5);
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('class', 'chart-value');
        valueText.setAttribute('aria-hidden', 'true');
        valueText.textContent = item.value.toString();
        barG.appendChild(valueText);
      }
      
      // Labels will be shown in legend instead
      
      barsG.appendChild(barG);
    });
    
    svg.appendChild(barsG);
    
    // Add axis line
    const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axisLine.setAttribute('x1', padding);
    axisLine.setAttribute('y1', height - padding);
    axisLine.setAttribute('x2', width - padding);
    axisLine.setAttribute('y2', height - padding);
    axisLine.setAttribute('stroke', '#666');
    axisLine.setAttribute('stroke-width', '1');
    axisLine.setAttribute('class', 'chart-axis');
    svg.appendChild(axisLine);
    
    // Add legend below the chart
    const legendStartY = height + 42; // One line height gap after chart
    const legendG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendG.setAttribute('class', 'chart-legend');
    
    // Calculate legend height
    const legendItemHeight = 42; // 1.5x line height
    const legendHeight = (data.length * legendItemHeight) + 20; // Add padding
    
    // Update SVG height to accommodate legend
    svg.setAttribute('height', height + legendHeight);
    svg.setAttribute('viewBox', `0 0 ${width} ${height + legendHeight}`);
    
    // Create legend items
    let legendY = legendStartY;
    data.forEach((item, index) => {
      const itemG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Color indicator
      const legendIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const swatchHeight = 20;
      const swatchY = legendY + (42 - swatchHeight) / 2;
      const legendX = 20;
      legendIndicator.setAttribute('x', legendX);
      legendIndicator.setAttribute('y', swatchY);
      legendIndicator.setAttribute('width', '20');
      legendIndicator.setAttribute('height', swatchHeight);
      legendIndicator.setAttribute('fill', `url(#${item.pattern})`);
      legendIndicator.setAttribute('stroke', '#333');
      legendIndicator.setAttribute('stroke-width', '1');
      legendIndicator.setAttribute('class', 'legend-color');
      itemG.appendChild(legendIndicator);
      
      // Label text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', legendX + 25);
      text.setAttribute('y', legendY + 28);
      text.setAttribute('class', 'legend-text');
      text.textContent = `${item.label}: ${item.value}`;
      itemG.appendChild(text);
      
      legendG.appendChild(itemG);
      legendY += 42;
    });
    
    svg.appendChild(legendG);
    container.appendChild(svg);
    
    // Add accessible data table (visually hidden but available to screen readers)
    const table = document.createElement('table');
    table.className = 'sr-only';
    table.setAttribute('summary', description);
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const thLevel = document.createElement('th');
    thLevel.textContent = 'WCAG Level';
    const thFailures = document.createElement('th');
    thFailures.textContent = 'Number of Failures';
    headerRow.appendChild(thLevel);
    headerRow.appendChild(thFailures);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
      const tdLevel = document.createElement('td');
      tdLevel.textContent = item.label;
      const tdFailures = document.createElement('td');
      tdFailures.textContent = item.value;
      row.appendChild(tdLevel);
      row.appendChild(tdFailures);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    container.appendChild(table);
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
   * Export results as CSV file
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
   * Perform the CSV export after getting the URL
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
   * Export design documentation as HTML
   */
  function exportDocumentation() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `carnforth-design-documentation-${timestamp}.html`;
    
    // Start building the documentation HTML
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carnforth Web A11y - Design Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    
    h2 {
      color: #34495e;
      margin-top: 40px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }
    
    h3 {
      color: #7f8c8d;
      margin-top: 25px;
    }
    
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
    
    pre {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      line-height: 1.4;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    .toc {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .toc h2 {
      margin-top: 0;
      border: none;
    }
    
    .toc ul {
      list-style: none;
      padding-left: 0;
    }
    
    .toc li {
      margin: 8px 0;
    }
    
    .toc a {
      color: #3498db;
      text-decoration: none;
    }
    
    .toc a:hover {
      text-decoration: underline;
    }
    
    .note {
      background: #e8f4f8;
      border-left: 4px solid #3498db;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    th {
      background: #f2f2f2;
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      color: #7f8c8d;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Carnforth Web A11y - Design Documentation</h1>
    
    <div class="toc">
      <h2>Table of Contents</h2>
      <ul>
        <li><a href="#introduction">1. Introduction</a></li>
        <li><a href="#goals">2. Project Goals and Philosophy</a></li>
        <li><a href="#accessibility-metrics">3. Accessibility Metrics: Philosophy and Implementation</a></li>
        <li><a href="#architecture">5. System Architecture</a></li>
        <li><a href="#touchpoint-system">6. The Touchpoint System</a></li>
        <li><a href="#design-patterns">7. Design Patterns</a></li>
        <li><a href="#maps-touchpoint">8. Maps Touchpoint - A Deep Dive</a></li>
        <li><a href="#creating-touchpoints">9. Creating New Touchpoints</a></li>
        <li><a href="#technical-implementation">10. Technical Implementation</a></li>
        <li><a href="#testing-approach">11. Testing and Validation</a></li>
        <li><a href="#future-work">12. Future Work</a></li>
      </ul>
    </div>
    
    <h2 id="introduction">1. Introduction</h2>
    <p>This document provides a comprehensive guide to the design and implementation of the Carnforth Web A11y Chrome extension. It is intended for developers, accessibility professionals, and anyone interested in understanding or extending the system.</p>
    
    <p>Carnforth Web A11y represents a new approach to accessibility testing that prioritizes real-world user experiences over technical compliance alone. By organizing tests into "touchpoints" - critical interaction patterns that users rely on - we provide more meaningful and actionable results.</p>
    
    <h2 id="goals">2. Project Goals and Philosophy</h2>
    
    <h3>2.1 Core Mission</h3>
    <p>The Carnforth Web A11y project exists to bridge the gap between technical accessibility compliance and actual user experience. While WCAG provides essential guidelines, real users encounter barriers in patterns that cross multiple success criteria. Our mission is to:</p>
    
    <ul>
      <li><strong>Humanize accessibility testing</strong> by focusing on user journeys rather than isolated technical checks</li>
      <li><strong>Provide actionable insights</strong> that directly improve user experiences</li>
      <li><strong>Educate developers</strong> about the real impact of accessibility barriers</li>
      <li><strong>Streamline remediation</strong> by grouping related issues that should be fixed together</li>
    </ul>
    
    <h3>2.2 The Problem We Solve</h3>
    <p>Traditional accessibility testing tools often produce overwhelming lists of technical violations that:</p>
    <ul>
      <li>Lack context about real user impact</li>
      <li>Fragment related issues across different reports</li>
      <li>Provide generic fixes without considering the specific implementation</li>
      <li>Focus on automated detection at the expense of nuanced evaluation</li>
    </ul>
    
    <p>Carnforth addresses these limitations by introducing the concept of <strong>touchpoints</strong> - cohesive interaction patterns that represent how real users actually engage with web content.</p>
    
    <h3>2.3 Design Philosophy</h3>
    
    <h4>User-Centric Testing</h4>
    <p>Every test in Carnforth is designed around a specific user need. For example, our "Maps" touchpoint doesn't just check for alt text on images - it evaluates whether users can:</p>
    <ul>
      <li>Understand what geographic information is being presented</li>
      <li>Access the same information through multiple modalities</li>
      <li>Navigate map controls with keyboard or assistive technology</li>
      <li>Receive equivalent information when interactive features are unavailable</li>
    </ul>
    
    <h4>Progressive Enhancement</h4>
    <p>We recognize that perfect accessibility is a journey, not a destination. Our system:</p>
    <ul>
      <li>Identifies critical barriers that block access entirely</li>
      <li>Distinguishes between showstoppers and friction points</li>
      <li>Provides improvement paths that prioritize user impact</li>
      <li>Celebrates incremental progress through metrics like the Accessibility Index</li>
    </ul>
    
    <h4>Educational by Design</h4>
    <p>Every violation includes:</p>
    <ul>
      <li><strong>Why it matters:</strong> Real-world impact on actual users</li>
      <li><strong>Who is affected:</strong> Specific user groups and assistive technologies</li>
      <li><strong>How to fix:</strong> Contextual remediation guidance</li>
      <li><strong>How to test:</strong> Manual verification steps</li>
    </ul>
    
    <h3>2.4 Key Principles</h3>
    
    <div class="note">
      <h4>1. Context Over Compliance</h4>
      <p>We evaluate accessibility in context. A map without keyboard access is a more severe issue than a decorative image missing alt text, even though both are WCAG violations.</p>
    </div>
    
    <div class="note">
      <h4>2. Patterns Over Points</h4>
      <p>We identify patterns of accessibility issues rather than individual point failures. If a site has 50 images without alt text, that's one pattern to fix, not 50 separate issues.</p>
    </div>
    
    <div class="note">
      <h4>3. Experience Over Elements</h4>
      <p>We test complete user experiences rather than individual elements. Can a user successfully find location information? This matters more than whether every div has the correct ARIA role.</p>
    </div>
    
    <div class="note">
      <h4>4. Guidance Over Grades</h4>
      <p>While we provide metrics, our primary output is actionable guidance. We want teams to know what to fix, why it matters, and how to verify their fixes work.</p>
    </div>
    
    <h3>2.5 Success Metrics</h3>
    <p>We measure our success not by the number of issues detected, but by:</p>
    <ul>
      <li><strong>Clarity of guidance:</strong> Can developers understand and act on our recommendations?</li>
      <li><strong>User impact:</strong> Do our prioritizations reflect real-world severity?</li>
      <li><strong>Learning outcomes:</strong> Do teams better understand accessibility after using our tool?</li>
      <li><strong>Remediation efficiency:</strong> Can teams fix issues faster with our grouped approach?</li>
    </ul>
    
    <h3>2.6 Future Vision</h3>
    <p>Carnforth aims to evolve accessibility testing from a compliance checklist to a user experience discipline. We envision a future where:</p>
    <ul>
      <li>Accessibility testing is integrated into the design process, not just QA</li>
      <li>Developers think in terms of user journeys, not just code patterns</li>
      <li>Organizations measure accessibility success by user outcomes, not violation counts</li>
      <li>The accessibility community collaborates on defining and testing new touchpoints</li>
    </ul>
    
    <div class="warning">
      <strong>Important:</strong> Carnforth is not a replacement for comprehensive accessibility audits or WCAG compliance testing. It is a complementary tool that provides a user-focused lens on accessibility issues. Always combine automated testing with manual evaluation and user testing.
    </div>
    
    <h2 id="accessibility-metrics">3. Accessibility Metrics: Philosophy and Implementation</h2>
    
    <h3>3.1 The Philosophy Behind Our Metrics</h3>
    <p>Traditional accessibility testing often produces overwhelming lists of issues without providing actionable insights. Our metrics system was designed with several key philosophical principles:</p>
    
    <h4>3.1.1 User-Centric Measurement</h4>
    <p>Rather than counting violations, we measure the actual impact on users. A single critical barrier that prevents navigation is weighted more heavily than multiple minor contrast issues. This reflects the reality that accessibility is about enabling use, not achieving perfection.</p>
    
    <h4>3.1.2 Progressive Enhancement Philosophy</h4>
    <p>Our metrics encourage iterative improvement. Sites don't need to be perfect to be accessible - they need to be usable. The metrics reflect this by:</p>
    <ul>
      <li>Distinguishing between critical barriers and friction points</li>
      <li>Measuring breadth of issues across different user journeys</li>
      <li>Providing a composite score that balances different aspects</li>
    </ul>
    
    <h4>3.1.3 Context-Aware Scoring</h4>
    <p>Not all accessibility issues are equal. Our metrics consider:</p>
    <ul>
      <li><strong>Location criticality:</strong> Issues in navigation are weighted higher than footer issues</li>
      <li><strong>User journey impact:</strong> Problems that block task completion score higher</li>
      <li><strong>Cumulative effect:</strong> Multiple small issues in one area compound the difficulty</li>
    </ul>
    
    <h3>3.2 The Three Core Metrics</h3>
    
    <h4>3.2.1 Critical Barriers</h4>
    <p>Critical barriers are show-stopping issues that completely prevent access to content or functionality.</p>
    
    <div class="formula">
      <h5>Formula:</h5>
      <pre><code>Critical Barriers = Σ(issues where severity === 'critical')</code></pre>
    </div>
    
    <p><strong>Examples of critical barriers:</strong></p>
    <ul>
      <li>Interactive elements with no accessible name</li>
      <li>Form fields without labels</li>
      <li>Keyboard traps</li>
      <li>Missing alt text on informational images</li>
      <li>Videos without captions</li>
    </ul>
    
    <p><strong>Philosophy:</strong> Even one critical barrier can make a site unusable for some users. This metric helps prioritize the most important fixes.</p>
    
    <h4>3.2.2 Breadth Score</h4>
    <p>The breadth score measures how widespread accessibility issues are across different aspects of the site.</p>
    
    <div class="formula">
      <h5>Formula:</h5>
      <pre><code>Breadth Score = (Touchpoints with Failures / Total Testable Touchpoints) × 100</code></pre>
    </div>
    
    <p><strong>Calculation Example:</strong></p>
    <pre><code>// If 8 out of 12 touchpoints have failures:
Breadth Score = (8 / 12) × 100 = 66.67%</code></pre>
    
    <p><strong>Philosophy:</strong> A high breadth score indicates systemic accessibility problems rather than isolated issues. This helps identify whether problems are due to specific components or fundamental design decisions.</p>
    
    <h4>3.2.3 A11y Index (Accessibility Index)</h4>
    <p>The A11y Index is our composite metric that provides a single score representing overall accessibility health.</p>
    
    <div class="formula">
      <h5>Formula:</h5>
      <pre><code>A11y Index = 100 - (
  (Breadth Weight × Breadth Score) +
  (Friction Weight × Normalized Friction Score) +
  (Principles Weight × Principles Violation Score)
)

Where:
- Breadth Weight = 0.5 (50%)
- Friction Weight = 0.3 (30%)
- Principles Weight = 0.2 (20%)</code></pre>
    </div>
    
    <p><strong>Component Calculations:</strong></p>
    
    <div class="code-example">
      <h6>Friction Score Normalization:</h6>
      <pre><code>// Friction points are minor issues that make tasks harder
frictionPoints = Σ(issues where severity === 'friction')

// Normalize to 0-100 scale (assumes 50 friction points = 100%)
normalizedFrictionScore = Math.min(100, (frictionPoints / 50) × 100)</code></pre>
    </div>
    
    <div class="code-example">
      <h6>Principles Violation Score:</h6>
      <pre><code>// Based on WCAG principles violated
violatedPrinciples = countViolatedPrinciples(allIssues)
principlesScore = (violatedPrinciples / 4) × 100

// Where principles are:
// 1. Perceivable
// 2. Operable
// 3. Understandable
// 4. Robust</code></pre>
    </div>
    
    <p><strong>Complete Example Calculation:</strong></p>
    <pre><code>// Given:
// - Breadth Score: 60% (issues in 60% of touchpoints)
// - Friction Points: 15 (normalized to 30%)
// - Principles Violated: 2 of 4 (50%)

A11y Index = 100 - (
  (0.5 × 60) +    // 30 from breadth
  (0.3 × 30) +    // 9 from friction
  (0.2 × 50)      // 10 from principles
)
A11y Index = 100 - 49 = 51</code></pre>
    
    <p><strong>Philosophy:</strong> The A11y Index balances different aspects of accessibility to provide a holistic view. The weights reflect our belief that breadth of issues is the strongest indicator of accessibility health.</p>
    
    <h3>3.3 Advanced Metrics and Calculations</h3>
    
    <h4>3.3.1 Severity Weighting</h4>
    <p>Issues are weighted by their impact on users:</p>
    
    <pre><code>const severityWeights = {
  critical: 10,    // Complete barriers
  serious: 5,      // Major difficulties
  moderate: 3,     // Noticeable problems
  minor: 1        // Small inconveniences
};

// Weighted issue count
weightedIssueScore = Σ(issues.map(issue => 
  severityWeights[issue.severity]
))</code></pre>
    
    <h4>3.3.2 Location-Based Scoring</h4>
    <p>Issues in different page regions have different impacts:</p>
    
    <pre><code>const locationMultipliers = {
  navigation: 2.0,    // Critical for site usage
  main: 1.5,         // Primary content area
  forms: 1.8,        // Interactive elements
  sidebar: 1.0,      // Supporting content
  footer: 0.5        // Less critical information
};

// Location-adjusted score
locationAdjustedScore = issue.baseScore × 
  locationMultipliers[issue.location]</code></pre>
    
    <h4>3.3.3 Cumulative Impact Calculation</h4>
    <p>Multiple issues in the same area compound difficulty:</p>
    
    <pre><code>// For each page region
cumulativeImpact = baseImpact × (1 + (0.1 × (issueCount - 1)))

// Example: 5 issues in navigation
// Impact = base × (1 + (0.1 × 4)) = base × 1.4</code></pre>
    
    <h3>3.4 Potential Improvements and Extensions</h3>
    
    <h4>3.4.1 Task Completion Rate (TCR)</h4>
    <p>A proposed metric that measures the percentage of common user tasks that can be completed with assistive technology:</p>
    
    <pre><code>TCR = (Completable Tasks / Total Tasks) × 100

// Where tasks might include:
// - Find contact information
// - Submit a form
// - Navigate to key pages
// - Complete a purchase</code></pre>
    
    <h4>3.4.2 Cognitive Load Score</h4>
    <p>Measuring the mental effort required to use the site:</p>
    
    <pre><code>cognitiveLoadFactors = {
  inconsistentNavigation: 0.2,
  complexLanguage: 0.15,
  poorErrorMessages: 0.15,
  unclearLabels: 0.2,
  missingContext: 0.3
}

cognitiveLoadScore = Σ(factors × occurrences)</code></pre>
    
    <h4>3.4.3 Recovery Difficulty Index</h4>
    <p>How hard is it to recover from errors or confusion:</p>
    
    <pre><code>recoveryFactors = {
  hasBackButton: -0.2,
  clearErrorMessages: -0.3,
  undoAvailable: -0.2,
  helpAvailable: -0.3
}

recoveryDifficulty = baseScore + Σ(recoveryFactors)</code></pre>
    
    <h4>3.4.4 Progressive Enhancement Score</h4>
    <p>Measuring how well the site works with different capabilities:</p>
    
    <pre><code>enhancementLevels = {
  worksWithoutJS: 0.3,
  worksWithoutCSS: 0.2,
  textOnlyMode: 0.2,
  highContrastMode: 0.15,
  reducedMotion: 0.15
}

progressiveScore = Σ(level.weight × level.passes)</code></pre>
    
    <h3>3.5 Implementation Considerations</h3>
    
    <h4>3.5.1 Real-Time Calculation</h4>
    <p>Metrics are calculated dynamically as tests run:</p>
    
    <pre><code>class MetricsCalculator {
  constructor() {
    this.cache = new Map();
    this.listeners = [];
  }
  
  updateMetrics(testResults) {
    // Invalidate affected cache entries
    this.invalidateCache(testResults.touchpoint);
    
    // Recalculate core metrics
    const metrics = {
      criticalBarriers: this.calculateCriticalBarriers(testResults),
      breadthScore: this.calculateBreadthScore(testResults),
      a11yIndex: this.calculateA11yIndex(testResults)
    };
    
    // Notify listeners
    this.notifyListeners(metrics);
    
    return metrics;
  }
  
  calculateWithCaching(metricName, calculator) {
    if (this.cache.has(metricName)) {
      return this.cache.get(metricName);
    }
    
    const result = calculator();
    this.cache.set(metricName, result);
    return result;
  }
}</code></pre>
    
    <h4>3.5.2 Trend Analysis</h4>
    <p>Tracking metrics over time to show improvement:</p>
    
    <pre><code>class MetricsTrend {
  constructor() {
    this.history = [];
    this.maxHistory = 30; // 30 days
  }
  
  addDataPoint(metrics) {
    this.history.push({
      timestamp: Date.now(),
      metrics: { ...metrics }
    });
    
    // Maintain history limit
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }
  
  calculateTrend() {
    if (this.history.length < 2) return 0;
    
    const recent = this.history.slice(-7); // Last 7 days
    const previous = this.history.slice(-14, -7); // Previous 7 days
    
    const recentAvg = this.average(recent);
    const previousAvg = this.average(previous);
    
    return ((recentAvg - previousAvg) / previousAvg) × 100;
  }
}</code></pre>
    
    <h3>3.6 Future Directions</h3>
    
    <h4>3.6.1 Machine Learning Integration</h4>
    <p>Using ML to predict accessibility issues based on code patterns:</p>
    <ul>
      <li>Train models on known accessibility patterns</li>
      <li>Predict likelihood of issues before testing</li>
      <li>Suggest fixes based on similar resolved issues</li>
    </ul>
    
    <h4>3.6.2 User Journey Scoring</h4>
    <p>Metrics that follow actual user paths through the site:</p>
    <ul>
      <li>Track accessibility along conversion funnels</li>
      <li>Identify journey-breaking barriers</li>
      <li>Score based on task completion probability</li>
    </ul>
    
    <h4>3.6.3 Comparative Metrics</h4>
    <p>Benchmarking against industry standards:</p>
    <ul>
      <li>Compare scores within industry verticals</li>
      <li>Track improvement relative to competitors</li>
      <li>Identify best practices from high-scoring sites</li>
    </ul>
    
    <h4>3.6.4 Real User Monitoring (RUM) Integration</h4>
    <p>Combining automated testing with actual user data:</p>
    <ul>
      <li>Track how real AT users interact with the site</li>
      <li>Identify issues automated testing misses</li>
      <li>Validate metric accuracy against user success rates</li>
    </ul>
    
    <div class="tip">
      <h4>💡 Key Insight</h4>
      <p>The best accessibility metrics are those that correlate with real user success. Our metrics system is designed to be pragmatic, focusing on what actually helps users rather than achieving perfect compliance scores.</p>
    </div>
    
    <h2 id="architecture">4. System Architecture</h2>
    
    <h3>4.1 Overview</h3>
    <p>Carnforth Web A11y is built as a Chrome DevTools Extension, leveraging the browser's powerful debugging APIs to analyze web pages in real-time. The architecture is designed for modularity, extensibility, and performance.</p>
    
    <h3>4.2 Core Components</h3>
    
    <h4>4.2.1 Extension Manifest</h4>
    <p>The extension uses Manifest V3 for security and performance:</p>
    <pre><code>{
  "manifest_version": 3,
  "devtools_page": "devtools/devtools.html",
  "permissions": ["debugger", "tabs"],
  "host_permissions": ["<all_urls>"]
}</code></pre>
    
    <h4>4.2.2 Panel Interface (panel.html / panel.js)</h4>
    <p>The main user interface that runs within Chrome DevTools:</p>
    <ul>
      <li><strong>Test Controls:</strong> Start test button, progress indicators</li>
      <li><strong>Results Display:</strong> Grouped violations with filtering and sorting</li>
      <li><strong>Export Functions:</strong> JSON, CSV, HTML, and Documentation exports</li>
      <li><strong>Preferences:</strong> WCAG version, level filters, impact filters</li>
    </ul>
    
    <h4>4.2.3 Test Runner (test-runner.js)</h4>
    <p>Orchestrates the testing process:</p>
    <pre><code>class TestRunner {
  async runTests(tabId) {
    // 1. Inject content scripts
    // 2. Execute touchpoint tests
    // 3. Collect and aggregate results
    // 4. Calculate metrics
    // 5. Return formatted report
  }
}</code></pre>
    
    <h4>4.2.4 Content Scripts</h4>
    <p>Injected into the page being tested to:</p>
    <ul>
      <li>Access DOM elements directly</li>
      <li>Evaluate computed styles</li>
      <li>Test interactive behaviors</li>
      <li>Highlight elements during testing</li>
    </ul>
    
    <h4>4.2.5 Touchpoint Modules</h4>
    <p>Each touchpoint is a self-contained module in <code>/js/touchpoints/</code>:</p>
    <ul>
      <li><strong>maps.js:</strong> Geographic and mapping accessibility</li>
      <li><strong>forms.js:</strong> Form interaction patterns (planned)</li>
      <li><strong>navigation.js:</strong> Site navigation testing (planned)</li>
      <li><strong>media.js:</strong> Audio/video accessibility (planned)</li>
    </ul>
    
    <h3>4.3 Data Flow</h3>
    <ol>
      <li><strong>User initiates test</strong> from the DevTools panel</li>
      <li><strong>Panel sends message</strong> to test runner with configuration</li>
      <li><strong>Test runner injects scripts</strong> into the inspected page</li>
      <li><strong>Touchpoint modules execute</strong> their specific tests</li>
      <li><strong>Results are collected</strong> and sent back to the panel</li>
      <li><strong>Panel processes results</strong> for display and export</li>
    </ol>
    
    <h3>5.4 Communication Architecture</h3>
    <pre><code>Panel ←→ Background Script ←→ Content Script ←→ Inspected Page
  ↓                                                      ↑
  └──────────────── Test Runner ────────────────────────┘</code></pre>
    
    <h3>5.5 Key Design Decisions</h3>
    
    <div class="note">
      <h4>Chrome Extension vs Web App</h4>
      <p>We chose a Chrome extension to provide deep integration with developer workflows, access to powerful debugging APIs, and the ability to test any website without proxy or modification.</p>
    </div>
    
    <div class="note">
      <h4>Modular Touchpoints</h4>
      <p>Each touchpoint is independent, allowing easy addition of new test patterns without affecting existing functionality. This also enables selective testing based on page content.</p>
    </div>
    
    <div class="note">
      <h4>Client-Side Processing</h4>
      <p>All testing happens client-side for privacy and performance. No data is sent to external servers, making it safe for testing internal or sensitive applications.</p>
    </div>
    
    <h2 id="touchpoint-system">5. The Touchpoint System</h2>
    
    <h3>6.1 What is a Touchpoint?</h3>
    <p>A touchpoint represents a complete user interaction pattern - a cohesive set of elements, behaviors, and expectations that users encounter when trying to accomplish a specific task. Unlike traditional accessibility tests that check individual elements, touchpoints evaluate entire user experiences.</p>
    
    <h3>6.2 Anatomy of a Touchpoint</h3>
    
    <h4>6.2.1 Detection Phase</h4>
    <p>Each touchpoint first determines if it applies to the current page:</p>
    <pre><code>// Example from maps.js
function detectMapElements() {
  const patterns = [
    'iframe[src*="maps.google.com"]',
    'iframe[src*="openstreetmap.org"]',
    '[class*="map"]',
    '[id*="map"]',
    'canvas[aria-label*="map"]'
  ];
  
  return patterns.some(selector => 
    document.querySelector(selector) !== null
  );
}</code></pre>
    
    <h4>6.2.2 Test Execution</h4>
    <p>Once detected, the touchpoint runs a comprehensive suite of tests:</p>
    <ul>
      <li><strong>Structural Tests:</strong> Required elements and relationships</li>
      <li><strong>Semantic Tests:</strong> Proper roles and descriptions</li>
      <li><strong>Interactive Tests:</strong> Keyboard and screen reader support</li>
      <li><strong>Visual Tests:</strong> Contrast, sizing, and visibility</li>
      <li><strong>Alternative Tests:</strong> Fallbacks and equivalents</li>
    </ul>
    
    <h4>6.2.3 Violation Structure</h4>
    <p>Each violation found includes:</p>
    <pre><code>{
  id: "map-no-text-alternative",
  touchpoint: "Maps",
  impact: "critical",
  elements: [/* affected elements */],
  wcagCriteria: ["1.1.1", "1.3.1"],
  title: "Map lacks text alternative",
  description: "Geographic information must be available...",
  howToFix: "Provide a text description...",
  whyItMatters: "Users who cannot see the map...",
  whoIsAffected: ["Screen reader users", "Users with images disabled"],
  howToTest: "1. Disable images\\n2. Use a screen reader..."
}</code></pre>
    
    <h3>6.3 Touchpoint Lifecycle</h3>
    
    <h4>Phase 1: Registration</h4>
    <p>Touchpoints register themselves with the test runner:</p>
    <pre><code>TestRunner.registerTouchpoint({
  id: 'maps',
  name: 'Maps',
  description: 'Tests geographic and mapping accessibility',
  module: './touchpoints/maps.js'
});</code></pre>
    
    <h4>Phase 2: Detection</h4>
    <p>During test execution, each touchpoint checks if it should run:</p>
    <pre><code>if (touchpoint.detect(document)) {
  activeTouchpoints.push(touchpoint);
}</code></pre>
    
    <h4>Phase 3: Testing</h4>
    <p>Active touchpoints execute their test suites:</p>
    <pre><code>const results = await touchpoint.runTests({
  document,
  config: userPreferences,
  helpers: testUtilities
});</code></pre>
    
    <h4>Phase 4: Reporting</h4>
    <p>Results are aggregated and enhanced with metadata:</p>
    <pre><code>results.forEach(violation => {
  violation.touchpoint = touchpoint.name;
  violation.timestamp = Date.now();
  violation.pageContext = getPageContext();
});</code></pre>
    
    <h3>6.4 Touchpoint Categories</h3>
    
    <table>
      <tr>
        <th>Category</th>
        <th>Focus Area</th>
        <th>Example Touchpoints</th>
      </tr>
      <tr>
        <td>Navigation</td>
        <td>How users move through content</td>
        <td>Menus, Breadcrumbs, Skip Links</td>
      </tr>
      <tr>
        <td>Interaction</td>
        <td>How users engage with controls</td>
        <td>Forms, Buttons, Sliders</td>
      </tr>
      <tr>
        <td>Content</td>
        <td>How users consume information</td>
        <td>Headings, Tables, Lists</td>
      </tr>
      <tr>
        <td>Media</td>
        <td>How users experience rich content</td>
        <td>Images, Videos, Maps</td>
      </tr>
      <tr>
        <td>Feedback</td>
        <td>How users understand system state</td>
        <td>Errors, Notifications, Progress</td>
      </tr>
    </table>
    
    <h3>6.5 Benefits of the Touchpoint Approach</h3>
    
    <h4>For Developers</h4>
    <ul>
      <li><strong>Contextual Understanding:</strong> Issues are presented within user workflows</li>
      <li><strong>Efficient Remediation:</strong> Related issues are grouped for batch fixing</li>
      <li><strong>Clear Priorities:</strong> Critical barriers are distinguished from minor issues</li>
      <li><strong>Learning Tool:</strong> Each report teaches accessibility principles</li>
    </ul>
    
    <h4>For Users</h4>
    <ul>
      <li><strong>Holistic Testing:</strong> Complete experiences are validated</li>
      <li><strong>Real-World Focus:</strong> Tests reflect actual usage patterns</li>
      <li><strong>Progressive Improvement:</strong> Sites can improve incrementally</li>
      <li><strong>Meaningful Metrics:</strong> Success is measured by usability, not just compliance</li>
    </ul>
    
    <h3>6.6 Creating Custom Touchpoints</h3>
    <p>Organizations can create custom touchpoints for their specific needs:</p>
    <pre><code>// Custom touchpoint for e-commerce checkout
class CheckoutTouchpoint extends BaseTouchpoint {
  detect() {
    return document.querySelector('[role="form"][aria-label*="checkout"]') ||
           document.querySelector('.checkout-form');
  }
  
  async runTests() {
    const violations = [];
    
    // Test payment form accessibility
    violations.push(...this.testPaymentForms());
    
    // Test address autocomplete
    violations.push(...this.testAddressFields());
    
    // Test order review
    violations.push(...this.testOrderSummary());
    
    return violations;
  }
}</code></pre>
    
    <div class="note">
      <strong>Best Practice:</strong> When creating touchpoints, focus on complete user journeys rather than technical elements. Ask "What is the user trying to accomplish?" rather than "What elements are on the page?"
    </div>
    
    <h2 id="design-patterns">6. Design Patterns</h2>
    
    <h3>7.1 Overview</h3>
    <p>Carnforth employs several key design patterns that ensure consistency, maintainability, and extensibility. These patterns have evolved through practical experience and represent best practices for accessibility testing tools.</p>
    
    <h3>7.2 Core Patterns</h3>
    
    <h4>7.2.1 Module Pattern</h4>
    <p>Each touchpoint is a self-contained module with a consistent interface:</p>
    <pre><code>// touchpoints/example.js
(function() {
  'use strict';
  
  // Private variables and functions
  const VIOLATION_IDS = {
    MISSING_ALT: 'example-missing-alt',
    INVALID_ROLE: 'example-invalid-role'
  };
  
  // Public interface
  window.ExampleTouchpoint = {
    id: 'example',
    name: 'Example',
    
    detect: function(document) {
      // Detection logic
    },
    
    test: function(document, config) {
      // Testing logic
    },
    
    getViolationDetails: function(id) {
      // Return detailed violation info
    }
  };
})();</code></pre>
    
    <h4>7.2.2 Strategy Pattern</h4>
    <p>Different testing strategies based on element type:</p>
    <pre><code>const testStrategies = {
  iframe: testIframeMap,
  canvas: testCanvasMap,
  svg: testSVGMap,
  div: testDivBasedMap
};

function testMapElement(element) {
  const elementType = element.tagName.toLowerCase();
  const strategy = testStrategies[elementType] || testGenericMap;
  return strategy(element);
}</code></pre>
    
    <h4>7.2.3 Observer Pattern</h4>
    <p>Monitoring dynamic content changes:</p>
    <pre><code>class AccessibilityObserver {
  constructor() {
    this.observers = new Map();
  }
  
  observe(element, callback) {
    const observer = new MutationObserver((mutations) => {
      const relevantChanges = this.filterRelevantChanges(mutations);
      if (relevantChanges.length > 0) {
        callback(relevantChanges);
      }
    });
    
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['aria-label', 'alt', 'title', 'role'],
      childList: true,
      subtree: true
    });
    
    this.observers.set(element, observer);
  }
  
  disconnect(element) {
    const observer = this.observers.get(element);
    if (observer) {
      observer.disconnect();
      this.observers.delete(element);
    }
  }
}</code></pre>
    
    <h4>7.2.4 Factory Pattern</h4>
    <p>Creating violations with consistent structure:</p>
    <pre><code>class ViolationFactory {
  static create(type, element, touchpoint) {
    const baseViolation = {
      id: generateId(type, element),
      touchpoint: touchpoint.name,
      timestamp: Date.now(),
      element: serializeElement(element),
      impact: this.determineImpact(type),
      wcagCriteria: this.getWCAGCriteria(type)
    };
    
    return Object.assign(baseViolation, 
      this.getViolationDetails(type),
      this.getContextualInfo(element)
    );
  }
  
  static determineImpact(type) {
    const impactMap = {
      'missing-alt': 'critical',
      'low-contrast': 'serious',
      'decorative-issue': 'minor'
    };
    return impactMap[type] || 'moderate';
  }
}</code></pre>
    
    <h4>7.2.5 Chain of Responsibility</h4>
    <p>Processing violations through multiple handlers:</p>
    <pre><code>class ViolationProcessor {
  constructor() {
    this.handlers = [];
  }
  
  addHandler(handler) {
    this.handlers.push(handler);
    return this;
  }
  
  process(violation) {
    let result = violation;
    
    for (const handler of this.handlers) {
      result = handler.process(result);
      if (result.stopProcessing) break;
    }
    
    return result;
  }
}

// Usage
const processor = new ViolationProcessor()
  .addHandler(new DuplicateFilter())
  .addHandler(new ImpactCalculator())
  .addHandler(new WCAGMapper())
  .addHandler(new RemediationGuide());
  
const processedViolations = violations.map(v => processor.process(v));</code></pre>
    
    <h3>7.3 Architectural Patterns</h3>
    
    <h4>7.3.1 Layered Architecture</h4>
    <pre><code>// Layer 1: Presentation (Panel UI)
//   ↓
// Layer 2: Business Logic (Test Runner)
//   ↓
// Layer 3: Domain (Touchpoints)
//   ↓
// Layer 4: Infrastructure (DOM Access, Storage)</code></pre>
    
    <h4>7.3.2 Plugin Architecture</h4>
    <p>Touchpoints as plugins to the core system:</p>
    <pre><code>class TouchpointRegistry {
  constructor() {
    this.touchpoints = new Map();
    this.hooks = {
      beforeDetect: [],
      afterTest: [],
      onViolation: []
    };
  }
  
  register(touchpoint) {
    this.validateTouchpoint(touchpoint);
    this.touchpoints.set(touchpoint.id, touchpoint);
    this.notifyHooks('register', touchpoint);
  }
  
  validateTouchpoint(touchpoint) {
    const required = ['id', 'name', 'detect', 'test'];
    for (const prop of required) {
      if (!touchpoint[prop]) {
        throw new Error(\`Touchpoint missing required property: \${prop}\`);
      }
    }
  }
}</code></pre>
    
    <h4>7.3.3 Message Passing</h4>
    <p>Communication between extension components:</p>
    <pre><code>// Panel → Background → Content Script
class MessageBus {
  static send(target, action, data) {
    return new Promise((resolve, reject) => {
      const messageId = generateMessageId();
      const message = { id: messageId, action, data };
      
      const listener = (response) => {
        if (response.id === messageId) {
          cleanup();
          response.error ? reject(response.error) : resolve(response.data);
        }
      };
      
      const cleanup = () => {
        chrome.runtime.onMessage.removeListener(listener);
      };
      
      chrome.runtime.onMessage.addListener(listener);
      chrome.runtime.sendMessage(message);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        cleanup();
        reject(new Error('Message timeout'));
      }, 30000);
    });
  }
}</code></pre>
    
    <h3>7.4 Data Patterns</h3>
    
    <h4>7.4.1 Immutable Updates</h4>
    <pre><code>// State updates without mutation
function updateViolation(violations, id, updates) {
  return violations.map(violation => 
    violation.id === id 
      ? { ...violation, ...updates }
      : violation
  );
}

// Adding to arrays immutably
function addViolation(violations, newViolation) {
  return [...violations, newViolation];
}</code></pre>
    
    <h4>7.4.2 Normalization</h4>
    <pre><code>// Normalized data structure
const state = {
  violations: {
    byId: {
      'v1': { id: 'v1', type: 'missing-alt', elementId: 'e1' },
      'v2': { id: 'v2', type: 'low-contrast', elementId: 'e2' }
    },
    allIds: ['v1', 'v2']
  },
  elements: {
    byId: {
      'e1': { id: 'e1', tagName: 'img', selector: 'img#logo' },
      'e2': { id: 'e2', tagName: 'p', selector: 'p.text' }
    }
  }
};</code></pre>
    
    <h4>7.4.3 Lazy Evaluation</h4>
    <pre><code>class LazyViolationDetails {
  constructor(violationId, loader) {
    this.violationId = violationId;
    this.loader = loader;
    this._details = null;
  }
  
  get details() {
    if (!this._details) {
      this._details = this.loader(this.violationId);
    }
    return this._details;
  }
  
  // Only load when needed
  get howToFix() {
    return this.details.howToFix;
  }
}</code></pre>
    
    <h3>7.5 Testing Patterns</h3>
    
    <h4>7.5.1 Test Fixtures</h4>
    <pre><code>// Reusable HTML patterns for testing
const fixtures = {
  validMap: \`
    <div role="application" aria-label="Store locator map">
      <canvas tabindex="0"></canvas>
    </div>
  \`,
  
  invalidMap: \`
    <div class="map">
      <canvas></canvas>
    </div>
  \`,
  
  createFixture(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
  },
  
  cleanup() {
    document.body.innerHTML = '';
  }
};</code></pre>
    
    <h4>7.5.2 Assertion Helpers</h4>
    <pre><code>const assert = {
  hasViolation(results, violationId) {
    const violation = results.find(r => r.id === violationId);
    if (!violation) {
      throw new Error(\`Expected violation \${violationId} not found\`);
    }
    return violation;
  },
  
  violationCount(results, expected) {
    if (results.length !== expected) {
      throw new Error(\`Expected \${expected} violations, got \${results.length}\`);
    }
  },
  
  elementTested(results, selector) {
    const tested = results.some(r => r.element.selector === selector);
    if (!tested) {
      throw new Error(\`Element \${selector} was not tested\`);
    }
  }
};</code></pre>
    
    <h3>7.6 Performance Patterns</h3>
    
    <h4>7.6.1 Debouncing</h4>
    <pre><code>function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage in dynamic content monitoring
const handleContentChange = debounce(() => {
  rerunTests();
}, 500);</code></pre>
    
    <h4>7.6.2 Memoization</h4>
    <pre><code>const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

// Expensive calculations cached
const calculateAccessibilityScore = memoize((violations) => {
  // Complex scoring logic
  return score;
});</code></pre>
    
    <h4>7.6.3 Batch Processing</h4>
    <pre><code>class BatchProcessor {
  constructor(processFunc, batchSize = 50, delay = 10) {
    this.processFunc = processFunc;
    this.batchSize = batchSize;
    this.delay = delay;
  }
  
  async processAll(items) {
    const results = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(
        batch.map(item => this.processFunc(item))
      );
      results.push(...batchResults);
      
      // Allow UI to update
      if (i + this.batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    return results;
  }
}</code></pre>
    
    <h3>7.7 Error Handling Patterns</h3>
    
    <h4>7.7.1 Graceful Degradation</h4>
    <pre><code>function safeTest(testFunc, element) {
  try {
    return testFunc(element);
  } catch (error) {
    console.error('Test failed:', error);
    return {
      id: 'test-error',
      title: 'Test could not be completed',
      description: 'An error occurred while testing this element',
      impact: 'unknown',
      error: error.message
    };
  }
}

// Never let one failure stop all testing
function runAllTests(elements) {
  return elements.map(element => safeTest(testElement, element))
    .filter(result => result !== null);
}</code></pre>
    
    <h4>7.7.2 Error Context</h4>
    <pre><code>class ContextualError extends Error {
  constructor(message, context) {
    super(message);
    this.name = 'ContextualError';
    this.context = context;
    this.timestamp = Date.now();
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}</code></pre>
    
    <h2 id="maps-touchpoint">7. Maps Touchpoint - A Deep Dive</h2>
    
    <h3>8.1 Overview</h3>
    <p>The Maps touchpoint is our flagship implementation, demonstrating the power of the touchpoint approach. It addresses the complex accessibility challenges of geographic information systems, from simple embedded maps to sophisticated WebGL-powered applications.</p>
    
    <h3>8.2 Why Maps Need Special Attention</h3>
    
    <h4>The Challenge</h4>
    <p>Maps present unique accessibility challenges because they:</p>
    <ul>
      <li>Convey spatial relationships that are inherently visual</li>
      <li>Often lack text alternatives for geographic data</li>
      <li>Use complex interactions (pan, zoom, click) that may not be keyboard accessible</li>
      <li>Employ canvas or WebGL rendering that bypasses DOM accessibility</li>
      <li>Contain dynamic content that changes based on zoom level and viewport</li>
    </ul>
    
    <h4>User Impact</h4>
    <p>When maps are inaccessible, users cannot:</p>
    <ul>
      <li>Find business locations or get directions</li>
      <li>Understand geographic data in news or research</li>
      <li>Use location-based services effectively</li>
      <li>Participate in activities requiring spatial awareness</li>
    </ul>
    
    <h3>8.3 Detection Strategies</h3>
    
    <h4>8.3.1 Iframe Detection</h4>
    <pre><code>// Detect common map embeds
const mapProviders = [
  'maps.google.com',
  'google.com/maps',
  'openstreetmap.org',
  'mapbox.com',
  'bing.com/maps',
  'here.com',
  'maps.apple.com'
];

const iframes = document.querySelectorAll('iframe');
iframes.forEach(iframe => {
  if (mapProviders.some(provider => iframe.src.includes(provider))) {
    // Map iframe detected
  }
});</code></pre>
    
    <h4>8.3.2 DOM Pattern Detection</h4>
    <pre><code>// Detect map containers by common patterns
const patterns = [
  '[class*="map"]:not([class*="sitemap"])',
  '[id*="map"]:not([id*="sitemap"])',
  '[aria-label*="map" i]',
  '[role="application"][aria-roledescription*="map" i]',
  'div[data-map]',
  '.leaflet-container',
  '.mapboxgl-map',
  '.gm-style'
];</code></pre>
    
    <h4>8.3.3 Canvas and WebGL Detection</h4>
    <pre><code>// Sophisticated canvas map detection
function analyzeCanvas(canvas) {
  const ctx = canvas.getContext('2d') || canvas.getContext('webgl');
  
  // Check for map-like patterns
  const indicators = {
    hasGeographicLabels: checkForTextRendering(ctx),
    hasTilePattern: checkForTileLoading(canvas),
    hasInteractivity: checkForEventListeners(canvas),
    hasMapControls: checkForNearbyControls(canvas)
  };
  
  return calculateMapConfidence(indicators) > 0.7;
}</code></pre>
    
    <h4>8.3.4 WebGL Pattern Analysis</h4>
    <pre><code>// Detect WebGL maps by shader patterns
function analyzeWebGLMapPatterns(gl, canvas) {
  const patterns = {
    isLikelyMap: false,
    mapType: 'unknown',
    confidence: 0,
    features: []
  };
  
  // Check for map-specific extensions
  const extensions = [
    'OES_element_index_uint',  // Large meshes
    'ANGLE_instanced_arrays',  // Repeated features
    'OES_texture_float',       // Elevation data
    'EXT_texture_filter_anisotropic' // Terrain rendering
  ];
  
  // Analyze shader uniforms for map patterns
  const mapUniforms = ['u_matrix', 'u_zoom', 'u_pitch', 'u_bearing'];
  
  return patterns;
}</code></pre>
    
    <h3>8.4 Comprehensive Test Suite</h3>
    
    <h4>8.4.1 Basic Accessibility Tests</h4>
    
    <table>
      <tr>
        <th>Test ID</th>
        <th>What It Checks</th>
        <th>Why It Matters</th>
      </tr>
      <tr>
        <td>map-no-text-alternative</td>
        <td>Presence of text description</td>
        <td>Screen reader users need location information</td>
      </tr>
      <tr>
        <td>map-iframe-missing-title</td>
        <td>Iframe has descriptive title</td>
        <td>Identifies map purpose in page structure</td>
      </tr>
      <tr>
        <td>map-no-keyboard-access</td>
        <td>Keyboard navigation support</td>
        <td>Motor-impaired users need keyboard control</td>
      </tr>
      <tr>
        <td>map-controls-small-touch-target</td>
        <td>Control size ≥ 44x44 pixels</td>
        <td>Mobile and motor-impaired users need larger targets</td>
      </tr>
    </table>
    
    <h4>8.4.2 Advanced Canvas Tests</h4>
    
    <pre><code>// Canvas-specific accessibility violations
const canvasViolations = {
  'canvas-map-missing-accessibility': {
    check: (canvas) => !canvas.getAttribute('role') || 
                        !canvas.getAttribute('aria-label'),
    impact: 'critical',
    howToFix: 'Add role="img" and descriptive aria-label'
  },
  
  'canvas-map-not-keyboard-accessible': {
    check: (canvas) => {
      const tabindex = canvas.getAttribute('tabindex');
      return !tabindex || tabindex < 0;
    },
    impact: 'critical',
    howToFix: 'Add tabindex="0" and keyboard event handlers'
  },
  
  'canvas-map-no-text-alternative': {
    check: (canvas) => !findTextAlternative(canvas),
    impact: 'serious',
    howToFix: 'Provide text description of map data nearby'
  }
};</code></pre>
    
    <h4>8.4.3 WebGL-Specific Tests</h4>
    
    <pre><code>// WebGL 3D map accessibility
if (patterns.mapType === '3d-terrain') {
  violations.push({
    id: 'webgl-map-no-3d-instructions',
    title: '3D map lacks navigation instructions',
    description: '3D maps need instructions for camera control',
    howToFix: \`Add instructions like:
      - Use arrow keys to pan
      - Use +/- to zoom
      - Hold Shift + drag to rotate
      - Press H for help\`
  });
}</code></pre>
    
    <h3>8.5 Intelligent Remediation Guidance</h3>
    
    <h4>8.5.1 Context-Aware Fixes</h4>
    <p>The Maps touchpoint provides specific guidance based on the map implementation:</p>
    
    <pre><code>// Example: Google Maps iframe
if (isGoogleMapsIframe(element)) {
  return {
    howToFix: \`
1. Add title attribute: title="Google Map showing \${extractLocation(element)}"
2. Consider adding text directions below the map
3. Use Google's Embed API parameters for accessibility:
   &amp;output=embed&amp;hl=en&amp;z=15
4. Provide a "View larger map" link for full accessibility\`,
    example: \`&lt;iframe 
  src="https://maps.google.com/maps?q=..."
  title="Map showing downtown office location"
  width="600" height="450"&gt;
&lt;/iframe&gt;
&lt;p&gt;Our office is located at 123 Main St, downtown.&lt;/p&gt;\`
  };
}</code></pre>
    
    <h4>8.5.2 Progressive Enhancement Strategies</h4>
    
    <div class="note">
      <h4>Good: Basic Accessibility</h4>
      <pre><code>&lt;div role="img" aria-label="Map showing store locations"&gt;
  &lt;canvas id="store-map"&gt;&lt;/canvas&gt;
&lt;/div&gt;
&lt;p&gt;We have 3 stores in the downtown area.&lt;/p&gt;</code></pre>
    </div>
    
    <div class="note">
      <h4>Better: Enhanced Information</h4>
      <pre><code>&lt;div role="application" aria-label="Interactive store locator map"&gt;
  &lt;canvas id="store-map" tabindex="0"&gt;&lt;/canvas&gt;
  &lt;div class="sr-only" aria-live="polite" id="map-status"&gt;&lt;/div&gt;
&lt;/div&gt;
&lt;details&gt;
  &lt;summary&gt;Text-based store locations&lt;/summary&gt;
  &lt;ul&gt;
    &lt;li&gt;Downtown: 123 Main St (2 miles north)&lt;/li&gt;
    &lt;li&gt;Westside: 456 Oak Ave (5 miles west)&lt;/li&gt;
    &lt;li&gt;Eastside: 789 Elm Dr (3 miles east)&lt;/li&gt;
  &lt;/ul&gt;
&lt;/details&gt;</code></pre>
    </div>
    
    <div class="note">
      <h4>Best: Full Accessibility</h4>
      <pre><code>&lt;div class="map-container"&gt;
  &lt;div role="application" 
       aria-label="Interactive store locator map"
       aria-describedby="map-instructions"&gt;
    &lt;canvas id="store-map" tabindex="0"&gt;&lt;/canvas&gt;
    &lt;div id="map-controls" role="group" aria-label="Map controls"&gt;
      &lt;button aria-label="Zoom in" id="zoom-in"&gt;+&lt;/button&gt;
      &lt;button aria-label="Zoom out" id="zoom-out"&gt;-&lt;/button&gt;
      &lt;button aria-label="Reset view" id="reset"&gt;⌂&lt;/button&gt;
    &lt;/div&gt;
  &lt;/div&gt;
  
  &lt;div id="map-instructions" class="sr-only"&gt;
    Use arrow keys to pan, plus/minus to zoom, 
    Tab to cycle through locations, Enter to select.
  &lt;/div&gt;
  
  &lt;div role="region" aria-label="Store locations list"&gt;
    &lt;h3&gt;All Store Locations&lt;/h3&gt;
    &lt;ul id="location-list"&gt;
      &lt;!-- Dynamically populated with keyboard-accessible links --&gt;
    &lt;/ul&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>
    </div>
    
    <h3>8.6 Real-World Test Cases</h3>
    
    <h4>8.6.1 Test Fixture Coverage</h4>
    <p>Our test suite includes examples of:</p>
    <ul>
      <li>Google Maps embeds (iframe and JavaScript API)</li>
      <li>OpenStreetMap with Leaflet.js</li>
      <li>Mapbox GL JS (WebGL-based)</li>
      <li>Canvas-based custom maps</li>
      <li>Static image maps with area elements</li>
      <li>SVG-based interactive maps</li>
      <li>3D terrain visualizations</li>
      <li>Indoor floor plans</li>
      <li>Real-time data overlays</li>
    </ul>
    
    <h4>8.6.2 Edge Cases</h4>
    <pre><code>// Handle maps that are initially hidden
if (element.offsetParent === null) {
  addWarning('Map is hidden and cannot be tested completely');
  // Schedule retest when visible
}

// Handle dynamically loaded maps
const observer = new MutationObserver(() => {
  if (mapHasLoaded(element)) {
    runMapTests(element);
    observer.disconnect();
  }
});

// Handle maps in Shadow DOM
if (element.shadowRoot) {
  testShadowDOMMap(element.shadowRoot);
}</code></pre>
    
    <h3>8.7 Metrics and Scoring</h3>
    
    <h4>Impact Classification</h4>
    <ul>
      <li><strong>Critical:</strong> Map is completely inaccessible (no text alternative, no keyboard access)</li>
      <li><strong>Serious:</strong> Major features inaccessible (controls not reachable, no instructions)</li>
      <li><strong>Moderate:</strong> Usability issues (small touch targets, unclear labels)</li>
      <li><strong>Minor:</strong> Enhancement opportunities (could add more landmarks)</li>
    </ul>
    
    <h3>8.8 Future Enhancements</h3>
    
    <h4>Planned Features</h4>
    <ul>
      <li><strong>AI-Powered Description:</strong> Generate text alternatives from visual map content</li>
      <li><strong>Route Testing:</strong> Verify accessible routing instructions</li>
      <li><strong>Sonification:</strong> Audio representation of geographic data</li>
      <li><strong>Haptic Feedback:</strong> Support for tactile map interfaces</li>
      <li><strong>Voice Control:</strong> Integration with voice navigation</li>
    </ul>
    
    <h4>Research Areas</h4>
    <ul>
      <li>Machine learning for automatic landmark detection</li>
      <li>Standardized accessible map markup language</li>
      <li>Cross-platform accessible map components</li>
      <li>User preference adaptation</li>
    </ul>
    
    <div class="warning">
      <h4>Important Considerations</h4>
      <p>While our tests are comprehensive, maps often require manual testing to ensure true accessibility. Consider:</p>
      <ul>
        <li>Testing with actual screen reader users</li>
        <li>Verifying information equivalence, not just technical compliance</li>
        <li>Ensuring mobile accessibility for touch interfaces</li>
        <li>Providing multiple ways to access the same information</li>
      </ul>
    </div>
    
    <h2 id="creating-touchpoints">8. Creating New Touchpoints</h2>
    
    <h3>9.1 Overview</h3>
    <p>Creating a new touchpoint involves implementing detection logic, accessibility analysis, and educational remediation guidance. This guide walks through the complete process using real examples from our implementation.</p>
    
    <h3>9.2 Touchpoint Structure</h3>
    
    <h4>9.2.1 File Structure</h4>
    <pre><code>// /js/touchpoints/forms.js
window.test_forms = async function() {
  console.log("=============================================");
  console.log("FORMS TOUCHPOINT TEST STARTED");
  console.log("=============================================");
  
  try {
    // Main analysis function
    function analyzeFormAccessibility() {
      const results = {
        forms: [],        // All detected forms
        violations: [],   // Accessibility issues
        summary: {        // Aggregate statistics
          totalForms: 0,
          formsWithoutLabels: 0,
          formsWithoutFieldsets: 0
        }
      };
      
      // Detection and analysis logic...
      
      return results;
    }
    
    // Execute analysis
    const results = analyzeFormAccessibility();
    console.log("[Forms] Analysis complete:", results);
    
    return {
      success: true,
      touchpointName: "Forms",
      results: results
    };
    
  } catch (error) {
    console.error("[Forms] Critical error:", error);
    return {
      success: false,
      touchpointName: "Forms",
      error: error.message,
      results: null
    };
  }
};</code></pre>
    
    <h4>9.2.2 Registration</h4>
    <p>Add your touchpoint to the registry in <code>panel.js</code>:</p>
    <pre><code>const touchpoints = [
  { id: 'maps', name: 'Maps', enabled: true },
  { id: 'forms', name: 'Forms', enabled: true }, // Your new touchpoint
  { id: 'navigation', name: 'Navigation', enabled: false },
  // ... other touchpoints
];</code></pre>
    
    <h3>9.3 Detection Strategies</h3>
    
    <h4>9.3.1 Multi-Signal Detection</h4>
    <p>Use multiple signals to increase accuracy and reduce false positives:</p>
    <pre><code>function detectForms() {
  // Strategy 1: Direct element selection
  const semanticForms = Array.from(document.querySelectorAll('form'));
  
  // Strategy 2: ARIA role detection
  const ariaForms = Array.from(document.querySelectorAll('[role="form"]'));
  
  // Strategy 3: Heuristic detection for implicit forms
  const implicitForms = Array.from(document.querySelectorAll('div, section'))
    .filter(container => {
      // Must have form-like characteristics
      const hasInputs = container.querySelector('input, select, textarea');
      const hasSubmit = container.querySelector('[type="submit"], button');
      const hasFormClasses = /form|contact|signup|login/i.test(container.className);
      
      // Need at least 2 signals for confidence
      const signals = [hasInputs, hasSubmit, hasFormClasses].filter(Boolean);
      return signals.length >= 2;
    });
  
  // Combine and deduplicate
  const allForms = [...new Set([...semanticForms, ...ariaForms, ...implicitForms])];
  
  return allForms;
}</code></pre>
    
    <h4>9.3.2 Context Analysis</h4>
    <p>Understand the structural context of detected elements:</p>
    <pre><code>function analyzeFormContext(form) {
  const context = {
    hasHeading: false,
    headingText: '',
    hasLandmark: false,
    landmarkType: '',
    hasDescription: false
  };
  
  // Find associated heading
  const heading = form.querySelector('h1, h2, h3, h4, h5, h6') ||
                 findPrecedingSibling(form, 'h1, h2, h3, h4, h5, h6');
  
  if (heading) {
    context.hasHeading = true;
    context.headingText = heading.textContent.trim();
  }
  
  // Check landmark context
  const landmark = form.closest('[role="main"], [role="form"], main, section');
  if (landmark) {
    context.hasLandmark = true;
    context.landmarkType = landmark.getAttribute('role') || landmark.tagName.toLowerCase();
  }
  
  // Check for description
  const describedBy = form.getAttribute('aria-describedby');
  if (describedBy) {
    const description = document.getElementById(describedBy);
    context.hasDescription = description !== null;
  }
  
  return context;
}</code></pre>
    
    <h3>9.4 Accessibility Analysis</h3>
    
    <h4>9.4.1 WCAG Violation Detection</h4>
    <pre><code>function analyzeFormAccessibility(form) {
  const violations = [];
  
  // Test 1: Form labeling
  if (!form.getAttribute('aria-label') && !form.getAttribute('aria-labelledby')) {
    const context = analyzeFormContext(form);
    if (!context.hasHeading) {
      violations.push({
        id: 'form-missing-name',
        impact: 'serious',
        wcagCriteria: ['1.3.1', '4.1.2'],
        title: 'Form lacks accessible name',
        description: 'Forms must have an accessible name to identify their purpose',
        element: form
      });
    }
  }
  
  // Test 2: Input labeling
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (!hasAccessibleName(input)) {
      violations.push({
        id: 'input-missing-label',
        impact: 'critical',
        wcagCriteria: ['3.3.2', '4.1.2'],
        title: 'Form input lacks label',
        description: 'All form inputs must have associated labels',
        element: input
      });
    }
  });
  
  // Test 3: Error handling
  const requiredInputs = form.querySelectorAll('[required], [aria-required="true"]');
  if (requiredInputs.length > 0 && !form.querySelector('[role="alert"], .error-message')) {
    violations.push({
      id: 'form-no-error-handling',
      impact: 'serious',
      wcagCriteria: ['3.3.1', '3.3.3'],
      title: 'Form lacks error identification mechanism',
      description: 'Forms with required fields need clear error messaging',
      element: form
    });
  }
  
  return violations;
}</code></pre>
    
    <h4>9.4.2 Helper Functions</h4>
    <pre><code>function hasAccessibleName(element) {
  // Check for explicit label
  if (element.labels && element.labels.length > 0) {
    return true;
  }
  
  // Check ARIA labeling
  if (element.getAttribute('aria-label') || 
      element.getAttribute('aria-labelledby')) {
    return true;
  }
  
  // Check for implicit label (wrapped)
  const parent = element.parentElement;
  if (parent && parent.tagName === 'LABEL') {
    return true;
  }
  
  // Check title attribute (last resort)
  if (element.getAttribute('title')) {
    return true;
  }
  
  return false;
}

function findPrecedingSibling(element, selector) {
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.matches(selector)) {
      return sibling;
    }
    sibling = sibling.previousElementSibling;
  }
  return null;
}</code></pre>
    
    <h3>9.5 Remediation Guidance</h3>
    
    <h4>9.5.1 Context-Aware Fixes</h4>
    <pre><code>function generateRemediation(violation) {
  const remediations = {
    'form-missing-name': {
      howToFix: \`Add an accessible name to the form using one of these methods:
1. Add aria-label: <form aria-label="Contact Us">
2. Use aria-labelledby: <h2 id="form-title">Contact Us</h2><form aria-labelledby="form-title">
3. Place a heading as the first child: <form><h2>Contact Us</h2>...</form>\`,
      
      whyItMatters: 'Screen reader users need to understand the purpose of a form before filling it out. Without a name, they must guess based on the fields alone.',
      
      whoIsAffected: ['Screen reader users', 'Voice control users'],
      
      howToTest: \`1. Turn on a screen reader
2. Navigate to the form
3. Verify the form\'s purpose is announced
4. Use landmarks navigation to verify the form appears in the list\`
    },
    
    'input-missing-label': {
      howToFix: \`Associate a label with this input using one of these methods:
1. Explicit label: <label for="email">Email</label><input id="email" type="email">
2. Implicit label: <label>Email <input type="email"></label>
3. ARIA label: <input type="email" aria-label="Email address">\`,
      
      whyItMatters: 'Users need to know what information to enter in each field. Without labels, they must guess based on placeholder text or position, which is unreliable.',
      
      whoIsAffected: ['Screen reader users', 'Users with cognitive disabilities', 'Voice control users'],
      
      howToTest: \`1. Click on the label text
2. Verify focus moves to the input
3. Use a screen reader to verify the label is announced\`
    }
  };
  
  return remediations[violation.id] || {
    howToFix: 'Implement accessibility best practices for this element',
    whyItMatters: 'Accessibility barriers prevent users from completing tasks',
    whoIsAffected: ['Users with disabilities'],
    howToTest: 'Test with assistive technologies'
  };
}</code></pre>
    
    <h3>9.6 Testing Your Touchpoint</h3>
    
    <h4>9.6.1 Unit Testing</h4>
    <pre><code>// Create test fixtures
const fixtures = {
  validForm: \`
    <form aria-label="Newsletter Signup">
      <label for="email">Email Address</label>
      <input id="email" type="email" required>
      <button type="submit">Subscribe</button>
    </form>
  \`,
  
  invalidForm: \`
    <form>
      <input type="email" placeholder="Email">
      <button>Submit</button>
    </form>
  \`
};

// Test detection
function testDetection() {
  document.body.innerHTML = fixtures.validForm + fixtures.invalidForm;
  const forms = detectForms();
  
  console.assert(forms.length === 2, 'Should detect both forms');
}

// Test analysis
function testAnalysis() {
  document.body.innerHTML = fixtures.invalidForm;
  const form = document.querySelector('form');
  const violations = analyzeFormAccessibility(form);
  
  console.assert(violations.length >= 2, 'Should find multiple violations');
  console.assert(violations.some(v => v.id === 'form-missing-name'), 'Should detect missing form name');
  console.assert(violations.some(v => v.id === 'input-missing-label'), 'Should detect missing input label');
}</code></pre>
    
    <h4>9.6.2 Integration Testing</h4>
    <pre><code>// Test with real pages
async function integrationTest() {
  // Load test page
  const testPages = [
    'fixtures/forms/contact-form.html',
    'fixtures/forms/login-form.html',
    'fixtures/forms/complex-form.html'
  ];
  
  for (const page of testPages) {
    console.log(\`Testing \${page}...\`);
    
    // Navigate to page
    window.location.href = page;
    await waitForPageLoad();
    
    // Run touchpoint
    const results = await window.test_forms();
    
    // Verify results
    console.assert(results.success, \`Touchpoint should succeed on \${page}\`);
    console.log(\`Found \${results.results.violations.length} violations\`);
  }
}</code></pre>
    
    <h3>9.7 Best Practices</h3>
    
    <div class="note">
      <h4>1. Start Simple</h4>
      <p>Begin with basic detection and gradually add complexity. It's better to have reliable detection of common patterns than unreliable detection of everything.</p>
    </div>
    
    <div class="note">
      <h4>2. Educate Through Code</h4>
      <p>Include comments that explain WHY something is an issue, not just what the issue is. Your code should teach developers about accessibility.</p>
    </div>
    
    <div class="note">
      <h4>3. Provide Actionable Guidance</h4>
      <p>Remediation advice should be specific to the context. Generic "add a label" advice is less helpful than showing exactly how to fix the specific issue.</p>
    </div>
    
    <div class="note">
      <h4>4. Handle Edge Cases Gracefully</h4>
      <p>Your touchpoint will encounter broken HTML, dynamic content, and unusual implementations. Always code defensively.</p>
    </div>
    
    <div class="warning">
      <h4>Common Pitfalls to Avoid</h4>
      <ul>
        <li><strong>Over-detection:</strong> Casting too wide a net leads to false positives</li>
        <li><strong>Under-detection:</strong> Missing common patterns reduces usefulness</li>
        <li><strong>Vague guidance:</strong> Generic fixes don't help developers learn</li>
        <li><strong>Performance issues:</strong> Inefficient DOM queries slow down testing</li>
        <li><strong>Context loss:</strong> Async operations can lose element references</li>
      </ul>
    </div>
    
    <h2 id="technical-implementation">9. Technical Implementation</h2>
    
    <h3>10.1 Chrome Extension Architecture</h3>
    <p>Carnforth leverages Chrome's extension APIs to provide deep integration with the browser's developer tools. This section details the technical implementation choices and patterns.</p>
    
    <h3>10.2 Extension Components</h3>
    
    <h4>10.2.1 Manifest Configuration</h4>
    <pre><code>{
  "manifest_version": 3,
  "name": "Carnforth Web A11y",
  "version": "1.0.0",
  "description": "Accessibility testing focused on user journeys",
  
  "devtools_page": "devtools/devtools.html",
  
  "permissions": [
    "debugger",
    "tabs",
    "storage"
  ],
  
  "host_permissions": ["<all_urls>"],
  
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["js/content-script.js"],
    "run_at": "document_idle"
  }],
  
  "background": {
    "service_worker": "js/background.js"
  }
}</code></pre>
    
    <h4>10.2.2 DevTools Panel Creation</h4>
    <pre><code>// devtools.js
chrome.devtools.panels.create(
  "Carnforth A11y",
  "icons/icon48.png",
  "panel/panel.html",
  function(panel) {
    // Panel created callback
    panel.onShown.addListener(function(window) {
      // Panel is visible
    });
  }
);</code></pre>
    
    <h4>10.2.3 Content Script Injection</h4>
    <pre><code>// Inject scripts into the inspected page
function injectScript(tabId, file) {
  return chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: [file],
    world: 'MAIN' // Access to page's JavaScript context
  });
}

// Inject touchpoint modules dynamically
async function injectTouchpoints(tabId, touchpoints) {
  for (const touchpoint of touchpoints) {
    await injectScript(tabId, \`js/touchpoints/\${touchpoint}.js\`);
  }
}</code></pre>
    
    <h3>10.3 Communication Layer</h3>
    
    <h4>10.3.1 Message Protocol</h4>
    <pre><code>// Standard message format
interface Message {
  id: string;          // Unique message ID
  source: string;      // 'panel' | 'content' | 'background'
  action: string;      // Action to perform
  data?: any;          // Payload
  timestamp: number;   // When sent
}

// Response format
interface Response {
  id: string;          // Matching request ID
  success: boolean;    // Operation result
  data?: any;          // Response payload
  error?: string;      // Error message if failed
}</code></pre>
    
    <h4>10.3.2 Panel to Content Communication</h4>
    <pre><code>// Panel side
function sendToContent(action, data) {
  return new Promise((resolve, reject) => {
    const messageId = generateId();
    
    // Send through inspected window
    chrome.devtools.inspectedWindow.eval(
      \`window.postMessage({
        id: '\${messageId}',
        source: 'carnforth-panel',
        action: '\${action}',
        data: \${JSON.stringify(data)}
      }, '*')\`,
      (result, error) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
}

// Content side listener
window.addEventListener('message', (event) => {
  if (event.data.source !== 'carnforth-panel') return;
  
  handlePanelMessage(event.data);
});</code></pre>
    
    <h4>10.3.3 Result Collection</h4>
    <pre><code>// Aggregate results from multiple frames
async function collectResults(tabId) {
  const frames = await getAllFrames(tabId);
  const results = [];
  
  for (const frame of frames) {
    try {
      const frameResults = await executeInFrame(frame, 'getTestResults');
      results.push({
        frameId: frame.frameId,
        url: frame.url,
        violations: frameResults
      });
    } catch (error) {
      console.warn(\`Frame \${frame.frameId} test failed:\`, error);
    }
  }
  
  return results;
}</code></pre>
    
    <h3>10.4 DOM Analysis Techniques</h3>
    
    <h4>10.4.1 Element Selection</h4>
    <pre><code>// Efficient element selection with fallbacks
function selectElements(selectors) {
  const elements = new Set();
  
  for (const selector of selectors) {
    try {
      // Use native selector when possible
      const matches = document.querySelectorAll(selector);
      matches.forEach(el => elements.add(el));
    } catch (e) {
      // Fallback to custom selector engine
      const customMatches = customSelector(selector);
      customMatches.forEach(el => elements.add(el));
    }
  }
  
  return Array.from(elements);
}</code></pre>
    
    <h4>10.4.2 Shadow DOM Traversal</h4>
    <pre><code>// Recursive shadow DOM walker
function* walkShadowDOM(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: () => NodeFilter.FILTER_ACCEPT
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    yield node;
    
    // Check for shadow root
    if (node.shadowRoot) {
      yield* walkShadowDOM(node.shadowRoot);
    }
    
    // Check for slots
    if (node.tagName === 'SLOT') {
      const assigned = node.assignedElements();
      for (const el of assigned) {
        yield* walkShadowDOM(el);
      }
    }
  }
}</code></pre>
    
    <h4>10.4.3 Computed Style Analysis</h4>
    <pre><code>// Get effective styles considering inheritance
function getEffectiveStyles(element, properties) {
  const computed = window.getComputedStyle(element);
  const effective = {};
  
  for (const prop of properties) {
    let value = computed[prop];
    
    // Handle special cases
    if (prop === 'color' || prop === 'backgroundColor') {
      value = normalizeColor(value);
    } else if (prop === 'fontSize') {
      value = convertToPixels(value, element);
    }
    
    effective[prop] = value;
  }
  
  return effective;
}

// Color normalization
function normalizeColor(color) {
  const div = document.createElement('div');
  div.style.color = color;
  document.body.appendChild(div);
  const rgb = getComputedStyle(div).color;
  document.body.removeChild(div);
  return rgb;
}</code></pre>
    
    <h3>10.5 Performance Optimization</h3>
    
    <h4>10.5.1 Virtual DOM Diffing</h4>
    <pre><code>// Minimize DOM updates
class VirtualRenderer {
  constructor(container) {
    this.container = container;
    this.currentVDOM = null;
  }
  
  render(newVDOM) {
    if (!this.currentVDOM) {
      // Initial render
      this.container.innerHTML = '';
      this.container.appendChild(createElement(newVDOM));
    } else {
      // Diff and patch
      const patches = diff(this.currentVDOM, newVDOM);
      patch(this.container.firstChild, patches);
    }
    
    this.currentVDOM = newVDOM;
  }
}</code></pre>
    
    <h4>10.5.2 Worker Thread Processing</h4>
    <pre><code>// Offload heavy computation to worker
const analysisWorker = new Worker('js/analysis-worker.js');

function analyzeInWorker(data) {
  return new Promise((resolve, reject) => {
    const id = generateId();
    
    const handler = (event) => {
      if (event.data.id === id) {
        analysisWorker.removeEventListener('message', handler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      }
    };
    
    analysisWorker.addEventListener('message', handler);
    analysisWorker.postMessage({ id, data });
  });
}</code></pre>
    
    <h4>10.5.3 Request Debouncing</h4>
    <pre><code>// Intelligent request batching
class RequestBatcher {
  constructor(executor, delay = 16) {
    this.executor = executor;
    this.delay = delay;
    this.pending = new Map();
    this.timer = null;
  }
  
  add(key, data) {
    this.pending.set(key, data);
    this.scheduleFlush();
  }
  
  scheduleFlush() {
    if (this.timer) return;
    
    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }
  
  async flush() {
    const batch = Array.from(this.pending.entries());
    this.pending.clear();
    this.timer = null;
    
    if (batch.length > 0) {
      await this.executor(batch);
    }
  }
}</code></pre>
    
    <h3>10.6 Storage and Persistence</h3>
    
    <h4>10.6.1 Settings Management</h4>
    <pre><code>// Synchronized settings across extension
class SettingsManager {
  constructor() {
    this.cache = null;
    this.listeners = new Set();
  }
  
  async get(key) {
    if (!this.cache) {
      this.cache = await chrome.storage.sync.get();
    }
    return key ? this.cache[key] : this.cache;
  }
  
  async set(key, value) {
    const update = { [key]: value };
    await chrome.storage.sync.set(update);
    
    // Update cache
    if (this.cache) {
      this.cache[key] = value;
    }
    
    // Notify listeners
    this.notifyListeners(key, value);
  }
  
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}</code></pre>
    
    <h4>10.6.2 Result Caching</h4>
    <pre><code>// LRU cache for test results
class ResultCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  
  generateKey(url, touchpoints, config) {
    return JSON.stringify({ url, touchpoints, config });
  }
  
  get(url, touchpoints, config) {
    const key = this.generateKey(url, touchpoints, config);
    const entry = this.cache.get(key);
    
    if (entry) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      
      // Check expiry
      if (Date.now() - entry.timestamp < 300000) { // 5 minutes
        return entry.data;
      }
    }
    
    return null;
  }
  
  set(url, touchpoints, config, data) {
    const key = this.generateKey(url, touchpoints, config);
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}</code></pre>
    
    <h3>10.7 Security Considerations</h3>
    
    <h4>10.7.1 Content Security Policy</h4>
    <pre><code>// Handle CSP restrictions
function injectWithCSPBypass(code) {
  const script = document.createElement('script');
  script.textContent = code;
  
  // Use extension's CSP context
  script.setAttribute('data-carnforth', 'true');
  
  // Clean up after execution
  script.addEventListener('load', () => {
    script.remove();
  });
  
  (document.head || document.documentElement).appendChild(script);
}</code></pre>
    
    <h4>10.7.2 Input Sanitization</h4>
    <pre><code>// Prevent XSS in user-provided content
function sanitizeHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  
  // Remove dangerous elements
  const dangerous = template.content.querySelectorAll(
    'script, iframe, object, embed, link[rel="import"]'
  );
  dangerous.forEach(el => el.remove());
  
  // Clean attributes
  const allElements = template.content.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove event handlers
    for (const attr of el.attributes) {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }
    
    // Clean href/src attributes
    if (el.hasAttribute('href') || el.hasAttribute('src')) {
      const url = el.getAttribute('href') || el.getAttribute('src');
      if (url.startsWith('javascript:')) {
        el.removeAttribute('href');
        el.removeAttribute('src');
      }
    }
  });
  
  return template.innerHTML;
}</code></pre>
    
    <h3>10.8 Advanced Features</h3>
    
    <h4>10.8.1 Real-time Monitoring</h4>
    <pre><code>// Monitor for accessibility regressions
class AccessibilityMonitor {
  constructor() {
    this.baseline = null;
    this.observer = null;
  }
  
  start(touchpoints) {
    // Establish baseline
    this.baseline = this.captureState(touchpoints);
    
    // Start monitoring
    this.observer = new MutationObserver(() => {
      this.checkForRegressions(touchpoints);
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-*', 'role', 'alt', 'title']
    });
  }
  
  checkForRegressions(touchpoints) {
    const current = this.captureState(touchpoints);
    const regressions = this.compareStates(this.baseline, current);
    
    if (regressions.length > 0) {
      this.notifyRegressions(regressions);
    }
  }
}</code></pre>
    
    <h4>10.8.2 Machine Learning Integration</h4>
    <pre><code>// Predictive issue detection
class MLPredictor {
  constructor(modelUrl) {
    this.model = null;
    this.loadModel(modelUrl);
  }
  
  async loadModel(url) {
    // Load TensorFlow.js model
    this.model = await tf.loadLayersModel(url);
  }
  
  async predictIssues(element) {
    if (!this.model) return [];
    
    // Extract features
    const features = this.extractFeatures(element);
    
    // Run prediction
    const prediction = await this.model.predict(features).data();
    
    // Interpret results
    return this.interpretPrediction(prediction);
  }
  
  extractFeatures(element) {
    // Convert element to feature tensor
    return tf.tensor([
      element.tagName === 'IMG' ? 1 : 0,
      element.hasAttribute('alt') ? 1 : 0,
      element.getAttribute('role') ? 1 : 0,
      // ... more features
    ]);
  }
}</code></pre>
    
    <div class="warning">
      <h4>Implementation Notes</h4>
      <ul>
        <li>Always test in multiple Chrome versions</li>
        <li>Handle extension updates gracefully</li>
        <li>Minimize content script footprint</li>
        <li>Respect page performance</li>
        <li>Follow Chrome extension best practices</li>
      </ul>
    </div>
    
    <h2 id="testing-approach">10. Testing and Validation</h2>
    
    <h3>11.1 Testing Philosophy</h3>
    <p>Our testing approach ensures both technical correctness and educational value. We test not only that our tool finds accessibility issues, but that it provides meaningful guidance for fixing them.</p>
    
    <h3>11.2 Test Infrastructure</h3>
    
    <h4>11.2.1 Test Fixtures</h4>
    <p>We maintain a comprehensive library of HTML test fixtures that represent real-world patterns:</p>
    <pre><code>// /fixtures/maps_test.html structure
&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
  &lt;title&gt;Maps Accessibility Test Fixtures&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;!-- Section 1: Google Maps Embeds --&gt;
  &lt;section id="google-maps"&gt;
    &lt;h2&gt;Google Maps Test Cases&lt;/h2&gt;
    
    &lt;!-- Valid: Properly labeled iframe --&gt;
    &lt;div class="test-case" data-expected="pass"&gt;
      &lt;iframe src="https://maps.google.com/maps?q=..."
              title="Map showing office location at 123 Main St"
              width="600" height="400"&gt;&lt;/iframe&gt;
    &lt;/div&gt;
    
    &lt;!-- Invalid: Missing title --&gt;
    &lt;div class="test-case" data-expected="fail" data-violations="1"&gt;
      &lt;iframe src="https://maps.google.com/maps?q=..."
              width="600" height="400"&gt;&lt;/iframe&gt;
    &lt;/div&gt;
  &lt;/section&gt;
  
  &lt;!-- More test sections... --&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
    
    <h4>11.2.2 Test Runner</h4>
    <p>Our test runner validates both detection and remediation:</p>
    <pre><code>class TouchpointTestRunner {
  constructor(touchpointName) {
    this.touchpointName = touchpointName;
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }
  
  async runTests(fixtureUrl) {
    // Load fixture
    await this.loadFixture(fixtureUrl);
    
    // Get all test cases
    const testCases = document.querySelectorAll('.test-case');
    
    for (const testCase of testCases) {
      await this.runTestCase(testCase);
    }
    
    return this.results;
  }
  
  async runTestCase(testCase) {
    const expected = testCase.dataset.expected;
    const expectedViolations = parseInt(testCase.dataset.violations || '0');
    
    try {
      // Run touchpoint
      const touchpointFunc = window[\`test_\${this.touchpointName}\`];
      const results = await touchpointFunc();
      
      // Validate results
      if (expected === 'pass' && results.results.violations.length === 0) {
        this.results.passed++;
      } else if (expected === 'fail' && results.results.violations.length === expectedViolations) {
        this.results.passed++;
      } else {
        this.results.failed++;
        this.results.errors.push({
          testCase: testCase.id,
          expected: expectedViolations,
          actual: results.results.violations.length
        });
      }
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({
        testCase: testCase.id,
        error: error.message
      });
    }
  }
}</code></pre>
    
    <h3>11.3 Unit Testing</h3>
    
    <h4>11.3.1 Detection Functions</h4>
    <pre><code>// Test individual detection functions
describe('Map Detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  
  it('should detect Google Maps iframes', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://maps.google.com/maps?q=test';
    document.body.appendChild(iframe);
    
    const detector = new MapDetector();
    const maps = detector.detectIframeMaps();
    
    expect(maps).toHaveLength(1);
    expect(maps[0].provider).toBe('Google Maps');
  });
  
  it('should not detect non-map iframes', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://example.com/video';
    document.body.appendChild(iframe);
    
    const detector = new MapDetector();
    const maps = detector.detectIframeMaps();
    
    expect(maps).toHaveLength(0);
  });
  
  it('should detect canvas-based maps', () => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Interactive map');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
    
    const detector = new MapDetector();
    const maps = detector.detectCanvasMaps();
    
    expect(maps).toHaveLength(1);
  });
});</code></pre>
    
    <h4>11.3.2 Analysis Functions</h4>
    <pre><code>describe('Accessibility Analysis', () => {
  it('should detect missing accessible name', () => {
    const element = document.createElement('div');
    element.setAttribute('role', 'application');
    
    const analyzer = new AccessibilityAnalyzer();
    const violations = analyzer.checkAccessibleName(element);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].id).toBe('missing-accessible-name');
  });
  
  it('should pass with proper labeling', () => {
    const element = document.createElement('div');
    element.setAttribute('role', 'application');
    element.setAttribute('aria-label', 'Store locator map');
    
    const analyzer = new AccessibilityAnalyzer();
    const violations = analyzer.checkAccessibleName(element);
    
    expect(violations).toHaveLength(0);
  });
});</code></pre>
    
    <h3>11.4 Integration Testing</h3>
    
    <h4>11.4.1 Full Touchpoint Testing</h4>
    <pre><code>// Test complete touchpoint execution
async function testFullTouchpoint() {
  const testCases = [
    {
      name: 'Simple Google Maps embed',
      html: '<iframe src="https://maps.google.com/maps"></iframe>',
      expectedViolations: ['map-iframe-missing-title']
    },
    {
      name: 'Accessible canvas map',
      html: \`
        <div role="application" aria-label="Interactive store map">
          <canvas tabindex="0"></canvas>
        </div>
      \`,
      expectedViolations: []
    },
    {
      name: 'Complex map with controls',
      html: \`
        <div class="map-container">
          <div class="map" role="application">
            <canvas></canvas>
            <button class="zoom-in">+</button>
            <button class="zoom-out">-</button>
          </div>
        </div>
      \`,
      expectedViolations: [
        'map-missing-accessible-name',
        'canvas-map-not-keyboard-accessible',
        'map-controls-missing-labels'
      ]
    }
  ];
  
  for (const testCase of testCases) {
    console.log(\`Testing: \${testCase.name}\`);
    
    // Set up DOM
    document.body.innerHTML = testCase.html;
    
    // Run touchpoint
    const results = await window.test_maps();
    
    // Validate results
    const violations = results.results.violations.map(v => v.id);
    expect(violations).toEqual(testCase.expectedViolations);
  }
}</code></pre>
    
    <h4>11.4.2 Cross-Browser Testing</h4>
    <pre><code>// Automated cross-browser test suite
const browsers = ['chrome', 'firefox', 'safari', 'edge'];

async function runCrossBrowserTests() {
  for (const browser of browsers) {
    console.log(\`Testing in \${browser}...\`);
    
    const driver = await getWebDriver(browser);
    
    try {
      // Load extension
      await driver.get('chrome-extension://[extension-id]/panel/panel.html');
      
      // Navigate to test page
      await driver.executeScript('chrome.tabs.update({url: "fixtures/test-page.html"})');
      
      // Run tests
      await driver.executeScript('document.getElementById("start-test").click()');
      
      // Wait for results
      await driver.wait(until.elementLocated(By.className('results-complete')), 10000);
      
      // Verify results
      const violations = await driver.findElements(By.className('violation'));
      console.log(\`Found \${violations.length} violations in \${browser}\`);
      
    } finally {
      await driver.quit();
    }
  }
}</code></pre>
    
    <h3>11.5 Manual Testing</h3>
    
    <h4>11.5.1 Screen Reader Testing</h4>
    <div class="note">
      <h4>NVDA Testing Checklist</h4>
      <ul>
        <li>Navigate to map using browse mode (arrow keys)</li>
        <li>Verify map purpose is announced</li>
        <li>Switch to focus mode (Insert+Space)</li>
        <li>Test all interactive controls</li>
        <li>Verify status updates are announced</li>
        <li>Check landmark navigation (D key)</li>
      </ul>
    </div>
    
    <div class="note">
      <h4>JAWS Testing Checklist</h4>
      <ul>
        <li>Use virtual cursor to explore map region</li>
        <li>Test forms mode activation</li>
        <li>Verify button labels are read</li>
        <li>Check heading navigation (H key)</li>
        <li>Test with different verbosity settings</li>
      </ul>
    </div>
    
    <div class="note">
      <h4>VoiceOver Testing Checklist</h4>
      <ul>
        <li>Navigate with VO+arrows</li>
        <li>Test rotor navigation</li>
        <li>Verify gestures work on touch devices</li>
        <li>Check web rotor for landmarks</li>
        <li>Test with Safari and Chrome</li>
      </ul>
    </div>
    
    <h4>11.5.2 Keyboard Testing</h4>
    <pre><code>// Keyboard test scenarios
const keyboardTests = [
  {
    name: 'Tab navigation',
    steps: [
      'Press Tab to reach map',
      'Verify focus indicator is visible',
      'Continue tabbing through all controls',
      'Verify no keyboard traps'
    ]
  },
  {
    name: 'Arrow key navigation',
    steps: [
      'Focus on map',
      'Use arrow keys to pan',
      'Verify map updates',
      'Check status announcements'
    ]
  },
  {
    name: 'Shortcut keys',
    steps: [
      'Press + to zoom in',
      'Press - to zoom out',
      'Press 0 to reset',
      'Press ? for help'
    ]
  }
];</code></pre>
    
    <h3>11.6 Performance Testing</h3>
    
    <h4>11.6.1 Benchmark Suite</h4>
    <pre><code>class PerformanceBenchmark {
  async runBenchmarks() {
    const results = {};
    
    // Test 1: Large DOM performance
    results.largeDom = await this.benchmarkLargeDOM();
    
    // Test 2: Dynamic content handling
    results.dynamicContent = await this.benchmarkDynamicContent();
    
    // Test 3: Memory usage
    results.memory = await this.benchmarkMemoryUsage();
    
    return results;
  }
  
  async benchmarkLargeDOM() {
    // Create 1000 map elements
    for (let i = 0; i < 1000; i++) {
      const div = document.createElement('div');
      div.className = 'map-container';
      div.innerHTML = '<div class="map"></div>';
      document.body.appendChild(div);
    }
    
    const startTime = performance.now();
    await window.test_maps();
    const endTime = performance.now();
    
    return {
      elements: 1000,
      time: endTime - startTime,
      avgPerElement: (endTime - startTime) / 1000
    };
  }
  
  async benchmarkMemoryUsage() {
    if (performance.memory) {
      const before = performance.memory.usedJSHeapSize;
      
      // Run test 10 times
      for (let i = 0; i < 10; i++) {
        await window.test_maps();
      }
      
      const after = performance.memory.usedJSHeapSize;
      
      return {
        before: before,
        after: after,
        increase: after - before,
        leakDetected: (after - before) > 1000000 // 1MB threshold
      };
    }
    
    return { error: 'Memory API not available' };
  }
}</code></pre>
    
    <h3>11.7 Validation Strategies</h3>
    
    <h4>11.7.1 False Positive Prevention</h4>
    <pre><code>// Validate that we don't over-detect
function validateNoFalsePositives() {
  const testCases = [
    {
      html: '<div class="sitemap">Site Map</div>',
      shouldDetect: false,
      reason: 'sitemap is not a geographic map'
    },
    {
      html: '<img src="bitmap.png" alt="Logo">',
      shouldDetect: false,
      reason: 'bitmap is not a map'
    },
    {
      html: '<div class="roadmap">Product Roadmap</div>',
      shouldDetect: false,
      reason: 'roadmap in this context is not geographic'
    }
  ];
  
  testCases.forEach(testCase => {
    document.body.innerHTML = testCase.html;
    const results = detectMaps();
    
    if (results.length > 0 && !testCase.shouldDetect) {
      console.error(\`False positive: \${testCase.reason}\`);
    }
  });
}</code></pre>
    
    <h4>11.7.2 Remediation Validation</h4>
    <pre><code>// Ensure remediation advice actually fixes the issue
async function validateRemediation(violation) {
  // Apply the suggested fix
  const element = document.querySelector(violation.selector);
  const fixedHTML = applyRemediation(element, violation.remediation);
  
  // Re-test with fixed HTML
  document.body.innerHTML = fixedHTML;
  const retest = await window.test_maps();
  
  // Verify the violation is resolved
  const stillPresent = retest.results.violations.some(v => v.id === violation.id);
  
  if (stillPresent) {
    throw new Error(\`Remediation for \${violation.id} did not fix the issue\`);
  }
}</code></pre>
    
    <h3>11.8 Continuous Integration</h3>
    
    <h4>11.8.1 GitHub Actions Workflow</h4>
    <pre><code># .github/workflows/test.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm test
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run fixture tests
      run: npm run test:fixtures
    
    - name: Generate coverage report
      run: npm run coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2</code></pre>
    
    <div class="warning">
      <h4>Testing Best Practices</h4>
      <ul>
        <li><strong>Test real patterns:</strong> Use HTML from actual websites</li>
        <li><strong>Test edge cases:</strong> Broken HTML, dynamic content, unusual implementations</li>
        <li><strong>Test with real AT:</strong> Automated tests can't replace human testing</li>
        <li><strong>Test performance:</strong> Ensure the extension doesn't slow down pages</li>
        <li><strong>Test cross-browser:</strong> Different browsers have different APIs and behaviors</li>
      </ul>
    </div>
    
    <h2 id="future-work">11. Future Work</h2>
    
    <h3>12.1 Planned Touchpoints</h3>
    <p>We have identified 24 touchpoints that cover the most critical accessibility patterns on the web. Currently, only the Maps touchpoint is fully implemented.</p>
    
    <h4>10.1.1 High Priority Touchpoints</h4>
    <table>
      <tr>
        <th>Touchpoint</th>
        <th>Description</th>
        <th>Key Tests</th>
      </tr>
      <tr>
        <td>Color Contrast</td>
        <td>Detect insufficient contrast ratios</td>
        <td>Text contrast, link contrast, focus indicators</td>
      </tr>
      <tr>
        <td>Heading Order</td>
        <td>Check heading hierarchy and structure</td>
        <td>Sequential order, missing levels, empty headings</td>
      </tr>
      <tr>
        <td>Forms</td>
        <td>Form accessibility and usability</td>
        <td>Labels, error handling, required fields, fieldsets</td>
      </tr>
      <tr>
        <td>Navigation</td>
        <td>Site navigation patterns</td>
        <td>Skip links, consistent navigation, breadcrumbs</td>
      </tr>
      <tr>
        <td>Images</td>
        <td>Non-text content accessibility</td>
        <td>Alt text quality, decorative images, complex graphics</td>
      </tr>
    </table>
    
    <h4>10.1.2 Medium Priority Touchpoints</h4>
    <ul>
      <li><strong>Tables:</strong> Data table structure and headers</li>
      <li><strong>Language:</strong> Language attributes and changes</li>
      <li><strong>Keyboard Navigation:</strong> Tab order and keyboard traps</li>
      <li><strong>ARIA Usage:</strong> Proper ARIA implementation</li>
      <li><strong>Media Alternatives:</strong> Captions, transcripts, audio descriptions</li>
      <li><strong>Link Purpose:</strong> Meaningful link text</li>
      <li><strong>Page Structure:</strong> Landmarks and regions</li>
    </ul>
    
    <h3>12.2 Advanced Map Detection</h3>
    
    <h4>10.2.1 Sophisticated Touch Target Analysis</h4>
    <ol>
      <li><strong>Custom Control Detection:</strong> Canvas-based controls, SVG controls, overlay controls</li>
      <li><strong>Control Clustering Analysis:</strong> Detect controls too close together</li>
      <li><strong>Gesture-Based Patterns:</strong> Swipe areas, pinch-to-zoom regions</li>
      <li><strong>Mobile-Specific Patterns:</strong> Responsive control sizing</li>
      <li><strong>Advanced Control Types:</strong> Slider controls, radial menus</li>
      <li><strong>Proximity Analysis:</strong> Controls near edges, dynamic sizing</li>
    </ol>
    
    <h4>10.2.2 Additional Map Types</h4>
    <ul>
      <li><strong>Indoor Mapping:</strong> Building interiors, floor plans, venue maps</li>
      <li><strong>3D Building/Terrain:</strong> Three-dimensional visualizations</li>
      <li><strong>Real-time Data Overlays:</strong> Traffic, weather, live tracking</li>
      <li><strong>Geographic Heatmaps:</strong> Data visualization on maps</li>
      <li><strong>Vector Tile Formats:</strong> Modern mapping technologies</li>
    </ul>
    
    <h3>12.3 Technical Enhancements</h3>
    
    <h4>10.3.1 Performance Improvements</h4>
    <pre><code>// Planned optimizations
const performanceEnhancements = {
  virtualScrolling: 'Handle thousands of violations efficiently',
  webWorkers: 'Move analysis to background threads',
  incrementalTesting: 'Test visible content first',
  caching: 'Cache results for unchanged content',
  lazyLoading: 'Load touchpoints on demand'
};</code></pre>
    
    <h4>10.3.2 AI Integration</h4>
    <div class="note">
      <h4>Machine Learning Applications</h4>
      <ul>
        <li><strong>Alt Text Generation:</strong> Suggest meaningful alt text using image recognition</li>
        <li><strong>Pattern Recognition:</strong> Identify common accessibility anti-patterns</li>
        <li><strong>Predictive Analysis:</strong> Predict likely accessibility issues</li>
        <li><strong>Smart Remediation:</strong> Context-aware fix suggestions</li>
        <li><strong>Natural Language Processing:</strong> Analyze content clarity and readability</li>
      </ul>
    </div>
    
    <h4>10.3.3 Real-time Monitoring</h4>
    <pre><code>// Continuous accessibility monitoring
class AccessibilityMonitor {
  features: {
    mutationObserver: 'Track DOM changes',
    regressionDetection: 'Alert on new issues',
    performanceTracking: 'Monitor impact on page speed',
    historyTracking: 'Show accessibility trends',
    ciIntegration: 'Fail builds on regressions'
  }
}</code></pre>
    
    <h3>12.4 User Experience Enhancements</h3>
    
    <h4>10.4.1 Reporting Features</h4>
    <ul>
      <li><strong>PDF Export:</strong> Professional reports for stakeholders</li>
      <li><strong>Issue Tracking Integration:</strong> Create tickets in Jira, GitHub</li>
      <li><strong>Progress Tracking:</strong> Show improvement over time</li>
      <li><strong>Custom Report Templates:</strong> Organizational branding</li>
      <li><strong>Executive Dashboards:</strong> High-level metrics and trends</li>
    </ul>
    
    <h4>10.4.2 Educational Features</h4>
    <div class="note">
      <h4>Interactive Learning</h4>
      <p>Transform Carnforth into a teaching tool:</p>
      <ul>
        <li>Interactive tutorials for each touchpoint</li>
        <li>Before/after examples of fixes</li>
        <li>Video demonstrations of screen reader behavior</li>
        <li>Gamification of accessibility improvements</li>
        <li>Certification paths for developers</li>
      </ul>
    </div>
    
    <h4>10.4.3 Collaboration Features</h4>
    <pre><code>// Team collaboration capabilities
const collaborationFeatures = {
  sharedReports: 'Team members can view and comment',
  assignmentSystem: 'Assign violations to developers',
  codeReview: 'Integrate with PR workflows',
  knowledgeBase: 'Share remediation patterns',
  teamMetrics: 'Track team accessibility performance'
};</code></pre>
    
    <h3>12.5 Research Areas</h3>
    
    <h4>10.5.1 Accessibility Innovation</h4>
    <ul>
      <li><strong>Voice Interface Testing:</strong> Evaluate voice control accessibility</li>
      <li><strong>AR/VR Accessibility:</strong> Emerging technology patterns</li>
      <li><strong>Cognitive Accessibility:</strong> Beyond WCAG guidelines</li>
      <li><strong>Cultural Accessibility:</strong> Internationalization considerations</li>
      <li><strong>Situational Impairments:</strong> Context-aware testing</li>
    </ul>
    
    <h4>10.5.2 Standards Development</h4>
    <div class="warning">
      <h4>Contributing to Standards</h4>
      <p>We aim to contribute our learnings back to the accessibility community:</p>
      <ul>
        <li>Propose new WCAG success criteria based on touchpoint insights</li>
        <li>Develop standardized testing methodologies</li>
        <li>Create open-source touchpoint libraries</li>
        <li>Publish research on real-world accessibility patterns</li>
        <li>Collaborate with W3C working groups</li>
      </ul>
    </div>
    
    <h3>12.6 Community Building</h3>
    
    <h4>10.6.1 Open Source Initiative</h4>
    <pre><code>// Community contribution model
const openSourceGoals = {
  touchpointMarketplace: 'Community-created touchpoints',
  translationProgram: 'Localize for global use',
  bugBounty: 'Reward accessibility issue reports',
  sponsorProgram: 'Sustainable development funding',
  advisoryBoard: 'Accessibility expert guidance'
};</code></pre>
    
    <h4>10.6.2 Educational Partnerships</h4>
    <ul>
      <li>University curriculum integration</li>
      <li>Bootcamp training modules</li>
      <li>Corporate training programs</li>
      <li>Accessibility certification courses</li>
      <li>Student contribution programs</li>
    </ul>
    
    <h3>12.7 Long-term Vision</h3>
    
    <div class="note">
      <h4>The Future of Web Accessibility</h4>
      <p>Carnforth represents just the beginning of a new approach to accessibility testing. Our vision for the future includes:</p>
      
      <ul>
        <li><strong>Ubiquitous Accessibility:</strong> Every developer has accessibility tools built into their workflow</li>
        <li><strong>Proactive Prevention:</strong> Issues are caught during design, not after development</li>
        <li><strong>User-Driven Testing:</strong> Real users with disabilities guide our testing priorities</li>
        <li><strong>Automated Remediation:</strong> AI assists in fixing issues, not just finding them</li>
        <li><strong>Global Standards:</strong> Consistent accessibility expectations worldwide</li>
      </ul>
      
      <p>Together, we can make the web accessible to everyone, regardless of ability. Every line of code we write, every test we create, and every issue we fix brings us closer to that goal.</p>
    </div>
    
    <div class="footer">
      <p><strong>Join us in making the web more accessible!</strong></p>
      <p>Contribute at: <a href="https://github.com/carnforth/web-a11y">github.com/carnforth/web-a11y</a></p>
      <p>Learn more at: <a href="https://carnforth.dev">carnforth.dev</a></p>
    </div>
    
    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      <p>Carnforth Web A11y - Chrome Extension for Accessibility Testing</p>
    </div>
  </div>
</body>
</html>`;
    
    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Escape HTML entities to prevent XSS and rendering issues
   * @param {string} str - The string to escape
   * @returns {string} - The escaped string
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Get touchpoint documentation if available
   * @param {string} touchpoint - The touchpoint name
   * @returns {object|null} - The documentation object or null
   */
  function getTouchpointDocumentation(touchpoint) {
    // Full documentation for maps touchpoint (expand as needed)
    const basicDocs = {
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
          'Generic or non-descriptive names',
          'Touch target sizes for map controls (zoom, pan, etc.)'
        ],
        wcagCriteria: [
          { criterion: '1.1.1 Non-text Content', level: 'A', description: 'Maps need text alternatives' },
          { criterion: '1.3.1 Info and Relationships', level: 'A', description: 'Map structure must be programmatically determinable' },
          { criterion: '2.4.6 Headings and Labels', level: 'AA', description: 'Maps need descriptive labels' },
          { criterion: '4.1.2 Name, Role, Value', level: 'A', description: 'Interactive maps must have proper ARIA attributes' },
          { criterion: '2.5.5 Target Size (Enhanced)', level: 'AAA', description: 'Touch targets should be at least 44x44 pixels' },
          { criterion: '2.5.8 Target Size (Minimum)', level: 'AA', description: 'Touch targets must be at least 24x24 pixels' }
        ],
        commonIssues: [
          'Missing accessible names (title, aria-label)',
          'Using aria-hidden="true" on interactive maps',
          'Generic names like "Map" without context',
          'Div-based maps without proper ARIA roles',
          'Missing alt text on static map images',
          'Map controls (zoom buttons, etc.) with insufficient touch target size'
        ],
        bestPractices: [
          'Always provide a descriptive title or aria-label that explains what the map shows',
          'Include the location or purpose in the accessible name (e.g., "Map of downtown Chicago office locations")',
          'Add a screen reader-only heading (h4) before maps to make them easily skippable',
          'Structure content with proper headings: main location (h3), map (sr-only h4), key information (h4)',
          'For div-based maps, use role="application" for interactive maps or role="img" for static ones',
          'Ensure all map controls are keyboard accessible',
          'Provide alternative ways to access map information (tables, text descriptions)',
          'Never use aria-hidden="true" on interactive content',
          'Ensure map controls have adequate touch target sizes (minimum 24x24px, ideally 44x44px)',
          'Use padding to increase touch target size without changing visual appearance'
        ],
        examples: {
          good: [
            {
              code: `<section>
  <h3>Our Office Location</h3>
  <h4 class="sr-only">Interactive map of our office</h4>
  <iframe 
    src="https://maps.google.com/..." 
    title="Interactive map showing office location at 123 Main St, Chicago"
    width="600" 
    height="450">
  </iframe>
  <h4>Key Information</h4>
  <ul>
    <li>Address: 123 Main St, Chicago, IL 60601</li>
    <li>Phone: (555) 123-4567</li>
    <li>Parking: Available in the building</li>
  </ul>
</section>`,
              explanation: 'Proper heading structure with screen reader-only h4 allows users to skip the map. Descriptive title includes specific location information.'
            }
          ],
          bad: [
            {
              code: `<iframe 
  src="https://maps.google.com/..." 
  width="600" 
  height="450">
</iframe>`,
              explanation: 'Missing title attribute means screen reader users have no context about what the map shows.'
            },
            {
              code: `<iframe 
  src="https://maps.google.com/..." 
  title="Map"
  aria-hidden="true"
  width="600" 
  height="450">
</iframe>`,
              explanation: 'Generic title provides no useful information. aria-hidden="true" makes the interactive map completely inaccessible to screen reader users.'
            }
          ]
        }
      }
    };
    
    // Check if documentation module is loaded first
    if (typeof touchpointDocumentation !== 'undefined' && touchpointDocumentation[touchpoint]) {
      return touchpointDocumentation[touchpoint];
    }
    
    // Fall back to basic docs
    return basicDocs[touchpoint] || null;
  }

  /**
   * Generate SVG pie chart for HTML export
   * @param {string} description - Chart description
   * @param {Array} data - Array of {label, value, color, pattern}
   * @returns {string} SVG HTML string
   */
  function generateSVGPieChart(description, data) {
    const svgWidth = 400;
    const chartHeight = 240;
    const radius = 120;
    const centerX = svgWidth / 2;
    const centerY = radius + 10;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    let svg = `<svg width="100%" height="${chartHeight}" viewBox="0 0 ${svgWidth} ${chartHeight}" role="img" aria-label="${escapeHtml(description)}">
      <title>${escapeHtml(description)}</title>
      <desc>${data.map(d => `${d.label}: ${d.value} (${total > 0 ? Math.round(d.value/total*100) : 0}%)`).join(', ')}</desc>
      <defs>`;
    
    // Add patterns
    data.forEach(item => {
      if (item.pattern.includes('high') || item.pattern.includes('fail')) {
        svg += `
        <pattern id="${item.pattern}" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="${item.color}"/>
          <path d="M0,10 L10,0 M0,0 L10,10" stroke="white" stroke-width="1.5" opacity="0.4"/>
        </pattern>`;
      } else if (item.pattern.includes('medium') || item.pattern.includes('warning')) {
        svg += `
        <pattern id="${item.pattern}" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="${item.color}"/>
          <circle cx="5" cy="5" r="2" fill="white" opacity="0.4"/>
        </pattern>`;
      } else {
        svg += `
        <pattern id="${item.pattern}" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="${item.color}"/>
          <line x1="0" y1="5" x2="10" y2="5" stroke="white" stroke-width="2" opacity="0.4"/>
        </pattern>`;
      }
    });
    
    svg += `</defs>`;
    
    if (total === 0) {
      svg += `<text x="${centerX}" y="${centerY}" text-anchor="middle" class="chart-no-data">No data</text>`;
    } else {
      // First pass: Draw all pie slices
      let currentAngle = -Math.PI / 2;
      const labelData = [];
      
      data.forEach((item) => {
        if (item.value === 0) return;
        
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;
        
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
        const x1 = centerX + Math.cos(currentAngle) * radius;
        const y1 = centerY + Math.sin(currentAngle) * radius;
        const x2 = centerX + Math.cos(endAngle) * radius;
        const y2 = centerY + Math.sin(endAngle) * radius;
        
        const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        
        svg += `<path d="${d}" fill="url(#${item.pattern})" stroke="#fff" stroke-width="2" class="chart-slice" data-color="${item.color}"/>`;
        
        // Store label data for second pass
        const labelAngle = currentAngle + sliceAngle / 2;
        labelData.push({
          angle: labelAngle,
          value: item.value
        });
        
        currentAngle = endAngle;
      });
      
      // Second pass: Draw all labels on top
      labelData.forEach(label => {
        const labelRadius = radius * 0.6; // Closer to center to avoid clipping
        const labelX = centerX + Math.cos(label.angle) * labelRadius;
        const labelY = centerY + Math.sin(label.angle) * labelRadius;
        
        // Add white background rect for contrast with proper sizing
        const labelText = label.value.toString();
        const textWidth = labelText.length * 12 + 20; // Add more padding
        const textHeight = 30; // Taller to provide padding
        
        svg += `
          <g>
            <rect x="${labelX - textWidth/2}" y="${labelY - textHeight/2}" 
                  width="${textWidth}" height="${textHeight}" 
                  fill="white" fill-opacity="0.95" stroke="#333" stroke-width="1" rx="4" ry="4"/>
            <text x="${labelX}" y="${labelY + 3}" text-anchor="middle" dominant-baseline="middle" 
                  class="chart-value" fill="#333">${labelText}</text>
          </g>`;
      });
    }
    
    // Add legend below the chart with proper spacing
    const legendStartY = chartHeight + 42; // One line height gap
    const legendItemHeight = 42; // 1.5x line height for proper spacing
    const activeItems = data.filter(item => item.value > 0);
    const legendHeight = (activeItems.length * legendItemHeight) + 20;
    
    // Update SVG height to accommodate legend
    svg = svg.replace(`height="${chartHeight}"`, `height="${chartHeight + legendHeight}"`);
    svg = svg.replace(`viewBox="0 0 ${svgWidth} ${chartHeight}"`, `viewBox="0 0 ${svgWidth} ${chartHeight + legendHeight}"`);
    
    // Add legend group
    let legendY = legendStartY;
    activeItems.forEach((item) => {
      const percentage = total > 0 ? Math.round(item.value/total*100) : 0;
      const swatchHeight = 20;
      const swatchY = legendY + (42 - swatchHeight) / 2; // Center swatch in line height
      svg += `
        <g>
          <rect x="20" y="${swatchY}" width="20" height="${swatchHeight}" 
                fill="url(#${item.pattern})" stroke="#333" stroke-width="1"/>
          <text x="45" y="${legendY + 28}" class="legend-text" style="font-size: 1rem;">
            ${escapeHtml(item.label)}: ${item.value} (${percentage}%)
          </text>
        </g>`;
      legendY += legendItemHeight;
    });
    
    svg += `</svg>`;
    return svg;
  }

  /**
   * Generate SVG bar chart for HTML export
   * @param {string} description - Chart description
   * @param {Array} data - Array of {label, value, color, pattern}
   * @returns {string} SVG HTML string
   */
  function generateSVGBarChart(description, data) {
    const width = 400;
    const height = 240;
    const padding = 40;
    const chartTop = 10;
    const barWidth = (width - padding * 2) / data.length - 10;
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(description)}">
      <title>${escapeHtml(description)}</title>
      <desc>${data.map(d => `${d.label}: ${d.value}`).join(', ')}</desc>
      <defs>`;
    
    // Add patterns
    data.forEach(item => {
      if (item.pattern.includes('level-a')) {
        svg += `
        <pattern id="${item.pattern}" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="${item.color}"/>
          <path d="M0,10 L10,0 M0,0 L10,10" stroke="white" stroke-width="1.5" opacity="0.4"/>
        </pattern>`;
      } else if (item.pattern.includes('level-aa')) {
        svg += `
        <pattern id="${item.pattern}" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="${item.color}"/>
          <circle cx="5" cy="5" r="2" fill="white" opacity="0.4"/>
        </pattern>`;
      } else {
        svg += `
        <pattern id="${item.pattern}" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="${item.color}"/>
          <line x1="0" y1="5" x2="10" y2="5" stroke="white" stroke-width="2" opacity="0.4"/>
        </pattern>`;
      }
    });
    
    svg += `</defs>`;
    
    if (maxValue === 0) {
      svg += `<text x="${width/2}" y="${height/2}" text-anchor="middle" class="chart-no-data">No data</text>`;
    } else {
      const barTop = chartTop + 20;
      const maxBarHeight = height - barTop - 60;
      
      data.forEach((item, index) => {
        const x = padding + index * (barWidth + 10);
        const barHeight = maxValue > 0 ? (item.value / maxValue) * maxBarHeight : 0;
        const y = barTop + maxBarHeight - barHeight;
        
        svg += `
          <g>
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                  fill="url(#${item.pattern})" stroke="#fff" stroke-width="1" 
                  class="chart-bar" data-color="${item.color}"/>
            <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" class="chart-value">${item.value}</text>
          </g>`;
      });
    }
    
    // Add legend below the chart with proper spacing
    const legendStartY = height + 42; // One line height gap
    const legendItemHeight = 42; // 1.5x line height for proper spacing
    const legendHeight = (data.length * legendItemHeight) + 20;
    
    // Update SVG height to accommodate legend
    svg = svg.replace(`height="${height}"`, `height="${height + legendHeight}"`);
    svg = svg.replace(`viewBox="0 0 ${width} ${height}"`, `viewBox="0 0 ${width} ${height + legendHeight}"`);
    
    // Add legend group
    let legendY = legendStartY;
    data.forEach((item) => {
      const swatchHeight = 20;
      const swatchY = legendY + (42 - swatchHeight) / 2; // Center swatch in line height
      svg += `
        <g>
          <rect x="20" y="${swatchY}" width="20" height="${swatchHeight}" 
                fill="url(#${item.pattern})" stroke="#333" stroke-width="1"/>
          <text x="45" y="${legendY + 28}" class="legend-text" style="font-size: 1rem;">
            ${escapeHtml(item.label)}: ${item.value}
          </text>
        </g>`;
      legendY += legendItemHeight;
    });
    
    svg += `</svg>`;
    return svg;
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
      
      // Define implemented touchpoints once for the entire export
      const implementedTouchpoints = ['maps']; // Add more as they are implemented
      
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
    
    html {
      font-size: 100%; /* Ensure 1rem = 16px */
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 1rem; /* 16px */
      line-height: 1.5;
      color: var(--text-color);
      background-color: var(--background-color);
      padding: 2rem;
      max-width: 1400px;
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
      font-size: 1.25rem; /* Increased from 1.1rem to ensure good readability */
      margin-top: 1rem;
    }
    
    h5 {
      font-size: 1.1rem; /* Ensure minimum size for h5 elements */
      margin-top: 0.75rem;
      margin-bottom: 0.75rem;
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
      font-size: 1.2rem; /* Increased from 1.1rem for better readability */
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
      font-size: 1rem; /* Ensure minimum 16px font size */
      margin-bottom: 0.5rem;
    }
    
    .technical-label {
      font-weight: bold;
      font-size: 1rem; /* Ensure minimum 16px font size */
      margin-top: 0.75rem;
      margin-bottom: 0.25rem;
    }
    
    pre {
      background-color: #f1f1f1;
      padding: 0.75rem;
      border-radius: 0.25rem;
      border: 1px solid #e0e0e0;
      font-family: monospace;
      font-size: 1rem; /* Ensure minimum 16px font size */
      overflow-x: auto;
      white-space: pre-wrap;
      margin-bottom: 0.75rem;
    }
    
    /* Hide empty pre elements */
    pre:empty {
      display: none;
    }
    
    /* Hide any stray interactive elements that might come from test page HTML */
    .small-map-controls,
    .tiny-button {
      display: none !important;
    }
    
    ul, ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    
    li {
      font-size: 1rem; /* Ensure minimum 16px font size */
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
      text-align: left;
      margin-top: 1.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }
    
    .back-to-toc a {
      font-size: 1rem; /* Changed from 0.9rem to ensure 16px minimum size */
      padding: 0.25rem 0.5rem;
      text-decoration: none;
      color: var(--info-color);
    }
    
    .back-to-toc a:hover {
      text-decoration: underline;
    }
    
    /* Auto highlight note */
    .auto-highlight-note {
      font-size: 1rem; /* Ensure minimum 16px font size */
      color: var(--info-color);
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    
    /* Section numbering */
    .section-number {
      font-weight: bold;
      color: var(--info-color);
      margin-right: 0.5rem;
    }
    
    /* About Carnforth section */
    .about-section {
      margin-top: 3rem;
      padding: 2rem;
      background-color: #f0f7ff;
      border: 1px solid #d0e3f4;
      border-radius: 0.5rem;
    }
    
    .about-section h2 {
      color: var(--info-color);
      border-bottom: 2px solid var(--info-color);
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    
    .about-section h3 {
      color: var(--text-color);
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    
    .about-section ul {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .about-section li {
      margin-bottom: 0.5rem;
      line-height: 1.6;
    }
    
    .about-resources {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #d0e3f4;
    }
    
    .about-resources ul {
      list-style-type: none;
      margin-left: 0;
    }
    
    .about-resources li {
      margin-bottom: 0.75rem;
    }
    
    /* Touchpoint documentation */
    .touchpoint-doc {
      background-color: #f9f9f9;
      padding: 1rem;
      margin-bottom: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.25rem;
    }
    
    .touchpoint-doc h4 {
      color: var(--text-color);
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .touchpoint-doc ul {
      margin-left: 1.5rem;
      margin-bottom: 0.75rem;
    }
    
    .touchpoint-doc li {
      margin-bottom: 0.25rem;
    }
    
    /* Code examples */
    .code-example {
      margin: 1rem 0;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 0.25rem;
      padding: 1rem;
    }
    
    .code-example pre {
      margin: 0 0 0.5rem 0;
      background-color: #fff;
      border: 1px solid #e0e0e0;
    }
    
    .code-example p {
      margin: 0;
      font-style: italic;
      color: #666;
    }
    
    /* Windows High Contrast Mode support */
    @media screen and (-ms-high-contrast: active), screen and (forced-colors: active) {
      /* Reset all colors to system colors in high contrast mode */
      :root {
        --background-color: Canvas;
        --fail-color: LinkText;
        --warning-color: MarkText;
        --info-color: LinkText;
        --text-color: CanvasText;
        --border-color: CanvasText;
        --focus-outline-color: Highlight;
      }
      
      /* Force solid backgrounds and borders for better visibility */
      .fail, .warning, .info {
        background-color: Canvas;
        border: 1px solid;
      }
      
      .issue-bullet {
        border: 1px solid CanvasText;
      }
      
      .issue-bullet.fail, .issue-bullet.warning, .issue-bullet.info {
        background-color: Canvas;
        color: CanvasText;
      }
      
      /* Ensure proper focus indicators */
      a:focus, button:focus {
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }
      
      /* Ensure links and interactive elements have proper contrast */
      a, button, .count-badge {
        color: LinkText;
      }
      
      /* Add patterns for color indicators since colors may be removed */
      .count-badge.fail {
        text-decoration: underline;
      }
      
      .count-badge.warning {
        font-style: italic;
      }
    }
    
    /* Summary Section Styles */
    section[aria-labelledby="summary-heading"] {
      background-color: #f0f7ff;
      border: 2px solid #0d47a1;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    
    section[aria-labelledby="summary-heading"] h2 {
      color: #0d47a1;
      margin-bottom: 1.5rem;
    }
    
    .summary-counts {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    
    .summary-count {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: bold;
      border: 1px solid;
      white-space: nowrap;
    }
    
    .summary-count.fail {
      background-color: #ffebee;
      color: #b71c1c;
      border-color: #ffcdd2;
    }
    
    .summary-count.warning {
      background-color: #fff8e1;
      color: #f57c00;
      border-color: #ffe0b2;
    }
    
    .summary-count.info {
      background-color: #e3f2fd;
      color: #1976d2;
      border-color: #bbdefb;
    }
    
    .wcag-at-risk {
      margin-top: 2rem;
    }
    
    .wcag-criteria-list {
      list-style: decimal;
      margin-left: 2rem;
      margin-top: 1rem;
    }
    
    .wcag-criterion {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 0.75rem;
      font-size: 0.95rem;
      margin-bottom: 0.5rem;
    }
    
    .wcag-criterion.level-a {
      border-left: 4px solid #4caf50;
    }
    
    .wcag-criterion.level-aa {
      border-left: 4px solid #ff9800;
    }
    
    .wcag-criterion.level-aaa {
      border-left: 4px solid #9c27b0;
    }
    
    .critical-barriers {
      background: #ffebee;
      border: 1px solid #ef5350;
      border-radius: 4px;
      padding: 1.5rem;
      margin-top: 2rem;
    }
    
    .critical-barriers h3 {
      color: #c62828;
      margin-bottom: 1rem;
    }
    
    .aria-level-breakdown {
      margin-top: 2rem;
    }
    
    .aria-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      border-left: 2px solid #666;
      border-bottom: 2px solid #666;
      padding: 1rem;
      margin-top: 1rem;
    }
    
    .aria-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      margin: 0 1rem;
    }
    
    .aria-bar-fill {
      width: 60px;
      background: #1976d2;
      border-radius: 4px 4px 0 0;
      transition: height 0.3s ease;
      position: relative;
    }
    
    .aria-bar-fill.level-a {
      background: #4caf50;
    }
    
    .aria-bar-fill.level-aa {
      background: #ff9800;
    }
    
    .aria-bar-fill.level-aaa {
      background: #9c27b0;
    }
    
    .aria-bar-value {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-weight: bold;
    }
    
    .aria-bar-label {
      margin-top: 0.5rem;
      font-weight: bold;
    }
    
    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 2rem;
    }
    
    .chart-section {
      min-height: 450px;
    }
    
    .chart-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      color: #333;
    }
    
    .chart-container {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      min-height: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    
    /* Accessibility Metrics Styles */
    .summary-metrics {
      margin: 2rem 0;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    
    .summary-metrics h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #0d47a1;
    }
    
    .metrics-row {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }
    
    .metric-item {
      flex: 1;
      min-width: 200px;
      text-align: center;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .metric-label {
      display: block;
      font-weight: bold;
      color: #666;
      margin-bottom: 0.5rem;
    }
    
    .metric-value {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.25rem;
    }
    
    .metric-value.good {
      color: #2e7d32;
    }
    
    .metric-value.fail {
      color: #d32f2f;
    }
    
    .metric-status {
      font-size: 1.5rem;
      margin-left: 0.5rem;
    }
    
    .metric-description {
      display: block;
      font-size: 0.875rem;
      color: #666;
    }
    
    /* Metrics documentation section */
    .metrics-doc {
      background-color: #f0f7ff;
      border: 2px solid #0d47a1;
      border-radius: 8px;
      padding: 2rem;
      margin-top: 3rem;
    }
    
    .metrics-doc h2 {
      color: #0d47a1;
      margin-bottom: 1.5rem;
    }
    
    .metrics-doc h3 {
      color: #0d47a1;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    .metrics-doc .doc-overview {
      font-style: italic;
      margin-bottom: 2rem;
      padding: 1rem;
      background: white;
      border-left: 4px solid #0d47a1;
      border-radius: 4px;
    }
    
    .chart-slice {
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    .chart-slice:hover {
      opacity: 0.8;
    }
    
    .chart-bar {
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    .chart-bar:hover {
      opacity: 0.8;
    }
    
    .chart-label {
      font-size: 1rem;
      fill: #333;
    }
    
    .chart-value {
      font-size: 1rem;
      font-weight: bold;
      fill: #333;
    }
    
    .chart-no-data {
      font-size: 1rem;
      fill: #999;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      section[aria-labelledby="summary-heading"] {
        page-break-after: always;
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
        <li><a href="#summary-heading"><span class="section-number">1</span>Summary</a></li>
        <li>
          <a href="#details-heading"><span class="section-number">2</span>Detailed Results</a>
          <ul>`;
      
      // Add touchpoint links to table of contents
      let touchpointIndex = 1;
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
            <li><a href="#${touchpoint}-heading"><span class="section-number">2.${touchpointIndex}</span>${displayName}</a></li>`;
        touchpointIndex++;
      });
      
      htmlTemplate += `
          </ul>
        </li>
        <li><a href="#about-carnforth"><span class="section-number">3</span>About Carnforth Web A11y</a></li>
        <li>
          <a href="#about-touchpoints"><span class="section-number">4</span>About Touchpoints</a>
          <ul>`;
      
      // Add touchpoint documentation links
      let docIndex = 1;
      implementedTouchpoints.forEach(touchpoint => {
        const doc = getTouchpointDocumentation(touchpoint);
        if (doc) {
          htmlTemplate += `
            <li><a href="#touchpoint-${touchpoint}"><span class="section-number">4.${docIndex}</span>${escapeHtml(doc.title || touchpoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</a></li>`;
          docIndex++;
        }
      });
      
      htmlTemplate += `
          </ul>
        </li>
        <li><a href="#accessibility-metrics-explained"><span class="section-number">5</span>Accessibility Metrics Explained</a></li>
      </ul>
    </nav>
  </section>

  <main id="main-content">`; 
      
      // Calculate metrics for executive summary
      const wcagCriteriaAtRisk = new Map();
      const criticalBarriers = [];
      const ariaLevelCounts = { 'A': 0, 'AA': 0, 'AAA': 0, 'Unknown': 0 };
      const impactCounts = { 'high': 0, 'medium': 0, 'low': 0 };
      const typeCounts = { 'fail': 0, 'warning': 0, 'info': 0 };
      
      // Critical barrier patterns (same as panel uses)
      const criticalBarrierPatterns = [
        'no accessible name',
        'missing accessible name',
        'keyboard trap',
        'missing form label',
        'aria-hidden="true"',
        'focus order prevents',
        'touch target.*too small',
        'insufficient touch target'
      ];
      
      // Metrics for breadth score and a11y index
      let touchpointsWithFailures = 0;
      let touchpointsWithTestableElements = 0;
      let totalIssues = 0;
      let totalElementsTested = 0;
      const principleViolations = {
        perceivable: 0,
        operable: 0,
        understandable: 0,
        robust: 0
      };
      
      // Function to get principle from WCAG criterion number
      function getPrincipleFromCriterion(criterion) {
        if (!criterion) return null;
        const firstDigit = criterion.charAt(0);
        switch (firstDigit) {
          case '1': return 'perceivable';
          case '2': return 'operable';
          case '3': return 'understandable';
          case '4': return 'robust';
          default: return null;
        }
      }
      
      // Analyze issues for metrics
      Object.entries(currentTestResults).forEach(([touchpoint, touchpointData]) => {
        const issues = touchpointData.issues || [];
        const failures = issues.filter(issue => issue.type === 'fail');
        
        if (touchpointData.elementsChecked && touchpointData.elementsChecked > 0) {
          touchpointsWithTestableElements++;
          totalElementsTested += touchpointData.elementsChecked;
          
          if (failures.length > 0) {
            touchpointsWithFailures++;
          }
        }
        
        // Count all issues
        totalIssues += issues.length;
        
        issues.forEach(issue => {
          // Count by type
          if (typeCounts[issue.type] !== undefined) {
            typeCounts[issue.type]++;
          }
          
          // Count by impact (only for fails and warnings)
          if ((issue.type === 'fail' || issue.type === 'warning') && issue.impact && issue.impact.level) {
            if (impactCounts[issue.impact.level] !== undefined) {
              impactCounts[issue.impact.level]++;
            }
          }
          
          if (issue.type === 'fail') {
            // Check if this is a critical barrier
            const isCritical = criticalBarrierPatterns.some(pattern => {
              const regex = new RegExp(pattern, 'i');
              return regex.test(issue.title) || regex.test(issue.description);
            });
            if (isCritical) {
              criticalBarriers.push({
                title: issue.title,
                description: issue.description,
                touchpoint: touchpoint
              });
            }
            
            // Extract WCAG criteria from issue
            if (issue.wcag) {
              const key = `${issue.wcag.successCriterion} - ${issue.wcag.level}`;
              wcagCriteriaAtRisk.set(key, {
                criterion: issue.wcag.successCriterion,
                level: issue.wcag.level,
                description: `${issue.wcag.principle} - ${issue.wcag.guideline}`
              });
              
              // Count by WCAG level
              if (issue.wcag.level) {
                ariaLevelCounts[issue.wcag.level] = (ariaLevelCounts[issue.wcag.level] || 0) + 1;
              } else {
                ariaLevelCounts['Unknown']++;
              }
              
              // Track principle violations
              if (issue.wcag.successCriterion) {
                const criterionNumber = issue.wcag.successCriterion.split(' ')[0];
                const principle = getPrincipleFromCriterion(criterionNumber);
                if (principle) {
                  principleViolations[principle]++;
                }
              }
            } else if (issue.wcagCriteria) {
              // Support legacy format if any
              issue.wcagCriteria.forEach(criterion => {
                const key = `${criterion.criterion} - ${criterion.level}`;
                wcagCriteriaAtRisk.set(key, {
                  criterion: criterion.criterion,
                  level: criterion.level,
                  description: criterion.description
                });
                
                // Count by ARIA level
                if (criterion.level) {
                  ariaLevelCounts[criterion.level] = (ariaLevelCounts[criterion.level] || 0) + 1;
                } else {
                  ariaLevelCounts['Unknown']++;
                }
              });
            } else {
              // For touchpoints without explicit WCAG criteria mapping
              ariaLevelCounts['Unknown']++;
            }
          }
        });
      });
      
      // Calculate the three metrics
      const criticalBarriersCount = criticalBarriers.length;
      
      // Breadth Score - percentage of touchpoints with failures
      const breadthScore = touchpointsWithTestableElements > 0 
        ? (touchpointsWithFailures / touchpointsWithTestableElements) * 100 
        : 0;
      
      // Calculate principle weighted score
      const principleWeights = {
        perceivable: 1.0,
        operable: 1.0,
        understandable: 0.8,
        robust: 0.7
      };
      
      let principleWeightedScore = 0;
      Object.entries(principleViolations).forEach(([principle, count]) => {
        principleWeightedScore += count * principleWeights[principle];
      });
      
      // Normalize principle score (assume max of 10 violations per principle for scaling)
      const maxPrincipleScore = 10 * (1.0 + 1.0 + 0.8 + 0.7);
      const normalizedPrincipleScore = Math.min((principleWeightedScore / maxPrincipleScore) * 100, 100);
      
      // Calculate friction score (issue density)
      const frictionScore = totalElementsTested > 0 
        ? (totalIssues / totalElementsTested) * 100 
        : 0;
      
      // A11y Index - combined metric
      const a11yIndex = Math.max(0, 100 - (
        (breadthScore * 0.5) + 
        (frictionScore * 0.3) + 
        (normalizedPrincipleScore * 0.2)
      ));
      
      // Add Summary section with executive summary content
      htmlTemplate += `
  <section aria-labelledby="summary-heading">
    <h2 id="summary-heading"><span class="section-number">1.</span>Summary</h2>
    
    <div class="summary-counts">
      <span class="summary-count fail">${fails} ${fails === 1 ? 'Fail' : 'Fails'}</span>
      <span class="summary-count warning">${warnings} ${warnings === 1 ? 'Warning' : 'Warnings'}</span>
      <span class="summary-count info">${infos} Info</span>
    </div>
    
    <div class="summary-metrics">
      <h3>Accessibility Metrics</h3>
      <div class="metrics-row">
        <div class="metric-item">
          <span class="metric-label">Critical barriers:</span>
          <span class="metric-value ${criticalBarriersCount === 0 ? 'good' : 'fail'}">${criticalBarriersCount}</span>
          <span class="metric-status">${criticalBarriersCount === 0 ? '✓' : '❌'}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Breadth score:</span>
          <span class="metric-value">${Math.round(breadthScore)}%</span>
          <span class="metric-description">of touchpoints with failures</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">A11y index:</span>
          <span class="metric-value">${Math.round(a11yIndex)}</span>
          <span class="metric-description">directional indicator</span>
        </div>
      </div>
    </div>
    
    <div class="charts-row">
      <div class="chart-section">
        <h3>Impact Distribution</h3>
        <div class="chart-container">
          ${generateSVGPieChart(
            'Distribution of issues by impact severity',
            [
              { label: 'High Impact', value: impactCounts.high, color: '#d32f2f', pattern: 'high-impact' },
              { label: 'Medium Impact', value: impactCounts.medium, color: '#f57c00', pattern: 'medium-impact' },
              { label: 'Low Impact', value: impactCounts.low, color: '#388e3c', pattern: 'low-impact' }
            ]
          )}
        </div>
      </div>
      
      <div class="chart-section">
        <h3>Issue Type Distribution</h3>
        <div class="chart-container">
          ${generateSVGPieChart(
            'Distribution of issues by type',
            [
              { label: 'Failures', value: typeCounts.fail, color: '#b71c1c', pattern: 'fail-type' },
              { label: 'Warnings', value: typeCounts.warning, color: '#ff6f00', pattern: 'warning-type' },
              { label: 'Information', value: typeCounts.info, color: '#1976d2', pattern: 'info-type' }
            ]
          )}
        </div>
      </div>
      
      <div class="chart-section">
        <h3>Issues by WCAG Level</h3>
        <div class="chart-container">
          ${generateSVGBarChart(
            'Number of failures by WCAG level',
            [
              { label: 'Level A', value: ariaLevelCounts.A, color: '#b71c1c', pattern: 'level-a' },
              { label: 'Level AA', value: ariaLevelCounts.AA, color: '#ff6f00', pattern: 'level-aa' },
              { label: 'Level AAA', value: ariaLevelCounts.AAA, color: '#388e3c', pattern: 'level-aaa' }
          ]
          )}
        </div>
        ${ariaLevelCounts['Unknown'] > 0 ? `<p><small>Note: ${ariaLevelCounts['Unknown']} issues could not be mapped to specific WCAG levels.</small></p>` : ''}
      </div>
    </div>
    
    ${wcagCriteriaAtRisk.size > 0 ? `
    <div class="wcag-at-risk">
      <h3>WCAG Success Criteria at Risk</h3>
      <ol class="wcag-criteria-list">
        ${Array.from(wcagCriteriaAtRisk.values())
          .sort((a, b) => {
            // Extract numeric parts for sorting (e.g., "1.1.1" from "1.1.1 Non-text Content")
            const getNumericParts = (criterion) => {
              const match = criterion.match(/^(\d+)\.(\d+)\.(\d+)/);
              if (match) {
                return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
              }
              return [999, 999, 999]; // Put non-standard format at end
            };
            
            const aParts = getNumericParts(a.criterion);
            const bParts = getNumericParts(b.criterion);
            
            // Compare each numeric part
            for (let i = 0; i < 3; i++) {
              if (aParts[i] !== bParts[i]) {
                return aParts[i] - bParts[i];
              }
            }
            
            return 0; // Equal
          })
          .map(criterion => `
        <li class="wcag-criterion level-${criterion.level.toLowerCase()}">
          <strong>${escapeHtml(criterion.criterion)}</strong> (Level ${escapeHtml(criterion.level)})
          <br><small>${escapeHtml(criterion.description)}</small>
        </li>`).join('')}
      </ol>
    </div>` : ''}
    
    ${criticalBarriers.length > 0 ? `
    <div class="critical-barriers">
      <h3>Critical Accessibility Barriers</h3>
      <p>The following issues represent significant barriers that may prevent users from accessing content or functionality:</p>
      <ul>
        ${criticalBarriers.map(barrier => `
        <li>
          <strong>${escapeHtml(barrier.title)}</strong> (${escapeHtml(barrier.touchpoint.replace(/_/g, ' '))})<br>
          <small>${escapeHtml(barrier.description)}</small>
        </li>`).join('')}
      </ul>
    </div>` : ''}
  </section>
  
  <section aria-labelledby="details-heading">
    <h2 id="details-heading"><span class="section-number">2.</span>Detailed Results</h2>`;
      
      // Add each touchpoint section
      let sectionIndex = 1;
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
        <h3 class="touchpoint-title" id="${touchpoint}-heading"><span class="section-number">2.${sectionIndex}</span>${displayName}</h3>
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
        sortedIssues.forEach((issue) => {
          htmlTemplate += `
        <div class="issue">
          <div class="issue-header">
            <span class="issue-bullet ${issue.type}" aria-hidden="true">${issue.type === 'fail' ? 'F' : issue.type === 'warning' ? 'W' : 'I'}</span>
            <span class="issue-type-label sr-only">${issue.type === 'fail' ? 'Fail: ' : issue.type === 'warning' ? 'Warning: ' : 'Info: '}</span>
            <h4 class="issue-title">${escapeHtml(issue.title)}</h4>
          </div>
          <div class="issue-body">
            <p class="issue-description">${escapeHtml(issue.description)}</p>`;
          
          // Add impact information (required for fail and warning)
          if ((issue.type === 'fail' || issue.type === 'warning') && issue.impact) {
            htmlTemplate += `
            <div class="issue-section impact">
              <h5>Impact</h5>`;
            
            if (issue.impact.who) {
              htmlTemplate += `
              <div class="impact-who">
                <strong>Affects: </strong>${escapeHtml(issue.impact.who)}
              </div>`;
            }
            
            if (issue.impact.severity) {
              htmlTemplate += `
              <div class="impact-severity">
                <strong>Severity: </strong>${escapeHtml(issue.impact.severity)}
              </div>`;
            }
            
            if (issue.impact.why) {
              htmlTemplate += `
              <div class="impact-why">
                <strong>Why it matters: </strong>${escapeHtml(issue.impact.why)}
              </div>`;
            }
            
            htmlTemplate += `
            </div>`;
          }
          
          // Add WCAG information if present
          if (issue.wcag && (issue.wcag.principle || issue.wcag.guideline || issue.wcag.successCriterion)) {
            htmlTemplate += `
            <div class="issue-section wcag">
              <h5>WCAG Reference</h5>`;
            
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
                <li>${escapeHtml(step)}</li>`;
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
            
            if (issue.selector && issue.selector.trim()) {
              htmlTemplate += `
              <div class="technical-label">CSS Selector:</div>
              <pre>${issue.selector}</pre>`;
            }
            
            if (issue.xpath && issue.xpath.trim()) {
              htmlTemplate += `
              <div class="technical-label">XPath:</div>
              <pre>${issue.xpath}</pre>`;
            }
            
            if (issue.html) {
              htmlTemplate += `
              <div class="technical-label">Current HTML:</div>
              <pre>${escapeHtml(issue.html)}</pre>`;
            }
            
            if (issue.fixedHtml) {
              htmlTemplate += `
              <div class="technical-label">Example Fix:</div>
              <pre>${escapeHtml(issue.fixedHtml)}</pre>`;
            }
            
            htmlTemplate += `
            </div>`;
          }
          
          // Add code examples if present
          if (issue.codeExample && (issue.codeExample.before || issue.codeExample.after)) {
            htmlTemplate += `
            <div class="issue-section code-example">
              <h5>Code Example</h5>`;
            
            if (issue.codeExample.before && issue.codeExample.before.trim()) {
              htmlTemplate += `
              <div class="technical-label">Current Implementation:</div>
              <pre>${escapeHtml(issue.codeExample.before)}</pre>`;
            }
            
            if (issue.codeExample.after && issue.codeExample.after.trim()) {
              htmlTemplate += `
              <div class="technical-label">Accessible Implementation:</div>
              <pre>${escapeHtml(issue.codeExample.after)}</pre>`;
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
                <li><a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.title || resource.url)}</a></li>`;
              } else {
                htmlTemplate += `
                <li>${escapeHtml(resource.title)}</li>`;
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
        sectionIndex++;
      });
      
      // Close the main sections and document
      htmlTemplate += `
  </section>
  
  <section class="about-section" aria-labelledby="about-carnforth">
    <h2 id="about-carnforth"><span class="section-number">3.</span>About Carnforth Web A11y</h2>
    <p>Carnforth Web A11y is an educational Chrome extension designed to help developers understand and fix web accessibility issues.</p>
    
    <h3><span class="section-number">3.1</span>Project Goals</h3>
    <ul>
      <li>Provide clear, actionable feedback about accessibility issues</li>
      <li>Educate developers about WCAG standards and best practices</li>
      <li>Make accessibility testing approachable and understandable</li>
      <li>Demonstrate that accessibility improves usability for everyone</li>
      <li>Encourage proactive accessibility implementation, not just compliance</li>
    </ul>
    
    <h3><span class="section-number">3.2</span>Understanding Automated Testing</h3>
    <p><strong>What automation can do well:</strong></p>
    <ul>
      <li>Detect missing or incorrect HTML attributes</li>
      <li>Find color contrast issues</li>
      <li>Identify structural problems (headings, landmarks)</li>
      <li>Check for keyboard accessibility basics</li>
      <li>Validate ARIA usage</li>
    </ul>
    
    <p><strong>What automation cannot do:</strong></p>
    <ul>
      <li>Judge if alt text is meaningful</li>
      <li>Determine if content makes sense to users</li>
      <li>Test complex interactions</li>
      <li>Evaluate cognitive load</li>
      <li>Assess whether ARIA is used appropriately</li>
    </ul>
    
    <h3><span class="section-number">3.3</span>The 80/20 Rule of Accessibility Testing</h3>
    <ul>
      <li>Automated tools can find about 20-30% of accessibility issues</li>
      <li>The remaining 70-80% require human judgment and testing</li>
      <li>Carnforth focuses on making that 20-30% as educational and actionable as possible</li>
    </ul>
    
    <p>Always complement automated testing with:</p>
    <ul>
      <li>Manual keyboard testing</li>
      <li>Screen reader testing</li>
      <li>Testing with actual users with disabilities</li>
      <li>Cognitive walkthroughs</li>
    </ul>
    
    <h3><span class="section-number">3.4</span>Using Carnforth Effectively</h3>
    <ol>
      <li>Run tests early and often during development</li>
      <li>Read the impact statements to understand who is affected</li>
      <li>Use the code examples as starting points, not complete solutions</li>
      <li>Follow the provided WCAG links to learn more</li>
      <li>Test your fixes with real assistive technology</li>
      <li>Remember: passing automated tests ≠ fully accessible</li>
    </ol>
    
    <h3><span class="section-number">3.5</span>Contributing to Accessibility</h3>
    <ul>
      <li>Accessibility is not a checklist - it's a mindset</li>
      <li>Every improvement helps real people use the web</li>
      <li>Small changes can have significant impact</li>
      <li>Accessibility benefits everyone, not just people with disabilities</li>
      <li>When in doubt, ask users with disabilities for feedback</li>
    </ul>
    
    <div class="about-resources">
      <h3><span class="section-number">3.6</span>Additional Resources</h3>
      <ul>
        <li><a href="https://www.w3.org/WAI/WCAG22/quickref/" target="_blank" rel="noopener noreferrer">Web Content Accessibility Guidelines (WCAG)</a></li>
        <li><a href="https://webaim.org/" target="_blank" rel="noopener noreferrer">WebAIM - Web Accessibility In Mind</a></li>
        <li><a href="https://www.a11yproject.com/" target="_blank" rel="noopener noreferrer">The A11y Project</a></li>
        <li><a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility" target="_blank" rel="noopener noreferrer">MDN Accessibility Documentation</a></li>
      </ul>
    </div>
  </section>
  
  <section aria-labelledby="about-touchpoints">
    <h2 id="about-touchpoints"><span class="section-number">4.</span>About Touchpoints</h2>
    <p>Touchpoints are individual accessibility tests that focus on specific aspects of web accessibility. Each touchpoint checks for compliance with one or more WCAG success criteria.</p>`;
    
    // Add documentation for each implemented touchpoint
    let touchpointDocIndex = 1;
    
    implementedTouchpoints.forEach(touchpoint => {
      const doc = getTouchpointDocumentation(touchpoint);
      if (doc) {
        const displayName = touchpoint
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        htmlTemplate += `
    
    <div class="touchpoint-doc">
      <h3 id="touchpoint-${touchpoint}"><span class="section-number">4.${touchpointDocIndex}</span>${escapeHtml(doc.title || displayName)}</h3>
      <p>${escapeHtml(doc.overview)}</p>`;
      
      if (doc.whatItTests && doc.whatItTests.length > 0) {
        htmlTemplate += `
      <h4><span class="section-number">4.${touchpointDocIndex}.1</span>What it Tests</h4>
      <ul>`;
        doc.whatItTests.forEach(test => {
          htmlTemplate += `
        <li>${escapeHtml(test)}</li>`;
        });
        htmlTemplate += `
      </ul>`;
      }
      
      if (doc.wcagCriteria && doc.wcagCriteria.length > 0) {
        htmlTemplate += `
      <h4><span class="section-number">4.${touchpointDocIndex}.2</span>WCAG Success Criteria</h4>
      <ul>`;
        doc.wcagCriteria.forEach(criteria => {
          htmlTemplate += `
        <li><strong>${escapeHtml(criteria.criterion)}</strong> (Level ${escapeHtml(criteria.level)}) - ${escapeHtml(criteria.description)}</li>`;
        });
        htmlTemplate += `
      </ul>`;
      }
      
      if (doc.commonIssues && doc.commonIssues.length > 0) {
        htmlTemplate += `
      <h4><span class="section-number">4.${touchpointDocIndex}.3</span>Common Issues</h4>
      <ul>`;
        doc.commonIssues.forEach(issue => {
          htmlTemplate += `
        <li>${escapeHtml(issue)}</li>`;
        });
        htmlTemplate += `
      </ul>`;
      }
      
      if (doc.bestPractices && doc.bestPractices.length > 0) {
        htmlTemplate += `
      <h4><span class="section-number">4.${touchpointDocIndex}.4</span>Best Practices</h4>
      <ul>`;
        doc.bestPractices.forEach(practice => {
          htmlTemplate += `
        <li>${escapeHtml(practice)}</li>`;
        });
        htmlTemplate += `
      </ul>`;
      }
      
      if (doc.examples) {
        htmlTemplate += `
      <h4><span class="section-number">4.${touchpointDocIndex}.5</span>Code Examples</h4>`;
        
        if (doc.examples.good && doc.examples.good.length > 0) {
          htmlTemplate += `
      <h5>Good Examples</h5>`;
          doc.examples.good.forEach((example) => {
            htmlTemplate += `
      <div class="code-example">
        <pre>${escapeHtml(example.code)}</pre>
        <p><em>${escapeHtml(example.explanation)}</em></p>
      </div>`;
          });
        }
        
        if (doc.examples.bad && doc.examples.bad.length > 0) {
          htmlTemplate += `
      <h5>Bad Examples</h5>`;
          doc.examples.bad.forEach((example) => {
            htmlTemplate += `
      <div class="code-example">
        <pre>${escapeHtml(example.code)}</pre>
        <p><em>${escapeHtml(example.explanation)}</em></p>
      </div>`;
          });
        }
      }
      
      htmlTemplate += `
    </div>`;
      touchpointDocIndex++;
      }
    });
    
    htmlTemplate += `
  </section>
  
  <section class="metrics-doc" aria-labelledby="metrics-doc-heading">
    <h2 id="accessibility-metrics-explained"><span class="section-number">5.</span>Accessibility Metrics Explained</h2>
    <p class="doc-overview">Carnforth uses three complementary metrics to help you understand and prioritize accessibility improvements. These metrics are directional indicators, not compliance measures.</p>
    
    <h3>Critical Barriers</h3>
    <p><strong>What it measures:</strong> Count of show-stopping issues that prevent access</p>
    <p><strong>Target:</strong> Must be ZERO for accessibility</p>
    <p><strong>Examples:</strong></p>
    <ul>
      <li>Missing labels on form controls</li>
      <li>Keyboard traps that prevent navigation</li>
      <li>Interactive elements hidden from assistive technology</li>
      <li>Images without alt text in critical contexts</li>
    </ul>
    <p><em>Think of these as locked doors - no matter how beautiful your building, if people can't get in, nothing else matters.</em></p>
    
    <h3>Breadth Score</h3>
    <p><strong>What it measures:</strong> Percentage of touchpoints with failures</p>
    <p><strong>How it's calculated:</strong> (Touchpoints with failures / Total testable touchpoints) × 100</p>
    <p><strong>What it tells you:</strong></p>
    <ul>
      <li>Lower percentage = issues are concentrated in fewer areas</li>
      <li>Higher percentage = issues are spread across many aspects</li>
    </ul>
    <p><strong>Example:</strong> If 5 of 20 touchpoints have failures, Breadth Score = 25%</p>
    <p><em>This helps you understand if you have a few problem areas to focus on, or if accessibility issues are widespread throughout your site.</em></p>
    
    <h3>A11y Index</h3>
    <p><strong>What it measures:</strong> Combined directional indicator (0-100, higher is better)</p>
    <p><strong>How it's calculated:</strong></p>
    <ul>
      <li>50% based on breadth (how widespread issues are)</li>
      <li>30% based on friction (severity-weighted issue count)</li>
      <li>20% based on WCAG principles affected</li>
    </ul>
    <p><strong>Principle weights:</strong></p>
    <ul>
      <li>Perceivable & Operable: 1.0 (most critical)</li>
      <li>Understandable: 0.8</li>
      <li>Robust: 0.7</li>
    </ul>
    <p><em>Track this score over time to measure improvement. It's designed to show progress even before achieving full compliance.</em></p>
    
    <h3>Important Philosophy</h3>
    <p><strong>Conformance is Binary:</strong></p>
    <p>"You can no more be 80% conformant than you can be 80% alive" - these metrics don't represent partial compliance.</p>
    
    <p><strong>What these metrics ARE:</strong></p>
    <ul>
      <li>Tools for prioritizing remediation efforts</li>
      <li>Indicators of progress over time</li>
      <li>Ways to understand the scope of work needed</li>
    </ul>
    
    <p><strong>What these metrics ARE NOT:</strong></p>
    <ul>
      <li>Compliance percentages</li>
      <li>Certification scores</li>
      <li>Substitutes for proper accessibility testing</li>
    </ul>
    
    <p><em>Use these metrics to guide your journey toward accessibility, not as a destination.</em></p>
    
    <div class="back-to-toc">
      <a href="#toc-heading" aria-label="Back to Table of Contents">↑ Back to Table of Contents</a>
    </div>
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
  exportDocumentationButton.addEventListener('click', exportDocumentation);
  
  // Preferences modal functionality
  function openPreferencesModal() {
    if (preferencesModal) {
      preferencesModal.classList.remove('hidden');
      // Populate touchpoints list
      populateTouchpointsList();
      // Update form with current preferences
      updatePreferencesForm();
      // Focus on close button for accessibility
      modalClose?.focus();
    }
  }
  
  function closePreferencesModal() {
    if (preferencesModal) {
      preferencesModal.classList.add('hidden');
      // Return focus to preferences button
      preferencesButton?.focus();
    }
  }
  
  function populateTouchpointsList() {
    const touchpointList = document.getElementById('touchpoint-list');
    if (!touchpointList) return;
    
    touchpointList.innerHTML = '';
    touchpoints.forEach(touchpoint => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `pref-touchpoint-${touchpoint}`;
      checkbox.value = touchpoint;
      checkbox.checked = preferences.selectedTouchpoints.includes(touchpoint);
      
      const displayName = touchpoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + displayName));
      
      touchpointList.appendChild(label);
    });
  }
  
  function updatePreferencesForm() {
    // Update WCAG version radio buttons
    document.querySelectorAll('#preferences-modal input[name="pref-wcag-version"]').forEach(radio => {
      if (radio.value === preferences.defaultWcagVersion) {
        radio.checked = true;
      }
    });
    
    // Update WCAG level checkboxes
    document.querySelectorAll('#preferences-modal input[id^="pref-level-"]').forEach(checkbox => {
      if (checkbox.value) {
        checkbox.checked = preferences.defaultWcagLevels.includes(checkbox.value);
      }
    });
    
    // Update issue type checkboxes
    document.querySelectorAll('#preferences-modal input[id^="pref-type-"]').forEach(checkbox => {
      if (checkbox.value) {
        checkbox.checked = preferences.defaultIssueTypes.includes(checkbox.value);
      }
    });
    
    // Update impact level checkboxes
    document.querySelectorAll('#preferences-modal input[id^="pref-impact-"]').forEach(checkbox => {
      if (checkbox.value) {
        checkbox.checked = preferences.defaultImpactLevels.includes(checkbox.value);
      }
    });
    
    // Update accordion default
    const accordionRadio = document.querySelector(`input[name="accordion-default"][value="${preferences.accordionDefault}"]`);
    if (accordionRadio) {
      accordionRadio.checked = true;
    }
    
    // Update grouping radio buttons
    const groupingRadios = document.querySelectorAll('input[name="pref-grouping"]');
    groupingRadios.forEach(radio => {
      radio.checked = radio.value === preferences.defaultGrouping;
    });
    
    // Update select all touchpoints checkbox
    const selectAllCheckbox = document.getElementById('pref-select-all-touchpoints');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = preferences.selectedTouchpoints.length === touchpoints.length;
    }
  }
  
  function handleSavePreferences() {
    // Get WCAG version (radio button)
    const selectedVersionRadio = document.querySelector('#preferences-modal input[name="pref-wcag-version"]:checked');
    if (selectedVersionRadio) {
      preferences.defaultWcagVersion = selectedVersionRadio.value;
    }
    
    // Get WCAG levels
    preferences.defaultWcagLevels = [];
    document.querySelectorAll('#preferences-modal input[id^="pref-level-"]:checked').forEach(checkbox => {
      if (checkbox.value) {
        preferences.defaultWcagLevels.push(checkbox.value);
      }
    });
    
    // Get issue types
    preferences.defaultIssueTypes = [];
    document.querySelectorAll('#preferences-modal input[id^="pref-type-"]:checked').forEach(checkbox => {
      if (checkbox.value) {
        preferences.defaultIssueTypes.push(checkbox.value);
      }
    });
    
    // Get impact levels
    preferences.defaultImpactLevels = [];
    document.querySelectorAll('#preferences-modal input[id^="pref-impact-"]:checked').forEach(checkbox => {
      if (checkbox.value) {
        preferences.defaultImpactLevels.push(checkbox.value);
      }
    });
    
    // Get selected touchpoints
    preferences.selectedTouchpoints = [];
    document.querySelectorAll('#touchpoint-list input:checked').forEach(checkbox => {
      if (checkbox.value) {
        preferences.selectedTouchpoints.push(checkbox.value);
      }
    });
    
    // Get accordion default
    const accordionRadio = document.querySelector('input[name="accordion-default"]:checked');
    if (accordionRadio) {
      preferences.accordionDefault = accordionRadio.value;
    }
    
    // Get grouping preference
    const selectedGrouping = document.querySelector('input[name="pref-grouping"]:checked');
    if (selectedGrouping) {
      preferences.defaultGrouping = selectedGrouping.value;
    }
    
    // Save preferences
    savePreferences().then(() => {
      // Apply new preferences to current filters if no test is running
      if (!currentTestResults) {
        resetUI();
      }
      closePreferencesModal();
    });
  }
  
  function handleResetPreferences() {
    // Reset to defaults
    preferences = {
      defaultWcagVersion: '2.2',
      defaultWcagLevels: ['A', 'AA', 'AAA'],
      defaultIssueTypes: ['fail', 'warning', 'info'],
      defaultImpactLevels: ['high', 'medium', 'low'],
      selectedTouchpoints: [...touchpoints],
      accordionDefault: 'closed',
      groupByRegionDefault: false,
      defaultGrouping: 'none'
    };
    
    // Update form
    updatePreferencesForm();
    populateTouchpointsList();
  }
  
  // Handle select all touchpoints
  const selectAllTouchpoints = document.getElementById('pref-select-all-touchpoints');
  if (selectAllTouchpoints) {
    selectAllTouchpoints.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('#touchpoint-list input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });
  }
  
  // Add event listeners for preferences
  if (preferencesButton) {
    preferencesButton.addEventListener('click', openPreferencesModal);
  }
  
  if (modalClose) {
    modalClose.addEventListener('click', closePreferencesModal);
  }
  
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closePreferencesModal);
  }
  
  if (savePreferencesButton) {
    savePreferencesButton.addEventListener('click', handleSavePreferences);
  }
  
  if (resetPreferencesButton) {
    resetPreferencesButton.addEventListener('click', handleResetPreferences);
  }
  
  // Handle ESC key to close modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && preferencesModal && !preferencesModal.classList.contains('hidden')) {
      closePreferencesModal();
    }
  });
  
  // We're now using patterns by default, so no need for special high contrast handling
});