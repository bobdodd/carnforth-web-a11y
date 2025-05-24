/**
 * Main panel functionality for Carnforth Web A11y extension
 */

// Store test results globally to be accessed by export functions
let currentTestResults = null;

// The list of touchpoints to run - defined before DOMContentLoaded
const touchpoints = [
  'accessible_name', 'animation', 'audio', 'color_contrast', 
  'color_use', 'dialogs', 'electronic_documents', 'event_handling', 
  'floating_content', 'focus_management', 'fonts', 'forms',
  'headings', 'images', 'landmarks', 'language', 'lists',
  'maps', 'read_more', 'tabindex', 'title_attribute',
  'tables', 'timers', 'touch_and_gestures', 'videos'
];

document.addEventListener('DOMContentLoaded', function() {
  console.log("[Panel] DOMContentLoaded event fired");
  const startTestButton = document.getElementById('start-test');
  const exportBar = document.querySelector('.export-bar');
  const filterBar = document.querySelector('.filter-bar');
  const exportJsonButton = document.getElementById('export-json');
  const exportExcelButton = document.getElementById('export-excel');
  const exportHtmlButton = document.getElementById('export-html');
  const resultsContainer = document.getElementById('results-container');
  const failCount = document.getElementById('fail-count');
  const warningCount = document.getElementById('warning-count');
  const infoCount = document.getElementById('info-count');
  const testStatus = document.getElementById('test-status');
  
  // Filter elements
  const wcagVersionButtons = document.querySelectorAll('[data-wcag-version]');
  const wcagFilterButtons = document.querySelectorAll('[data-wcag-level]');
  const issueTypeButtons = document.querySelectorAll('[data-issue-type]');
  const searchInput = document.getElementById('issue-search');
  const filterResultsText = document.getElementById('filter-results-text');
  const filterStatus = document.getElementById('filter-status');
  const groupByRegionCheckbox = document.getElementById('group-by-region');
  
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
    searchText: ''
  };
  
  // Preferences state
  let preferences = {
    defaultWcagVersion: '2.2', // Single WCAG version (default to latest)
    defaultWcagLevels: ['A', 'AA', 'AAA'],
    defaultIssueTypes: ['fail', 'warning', 'info'],
    selectedTouchpoints: [...touchpoints], // All touchpoints by default
    accordionDefault: 'closed',
    groupByRegionDefault: false // Group by region off by default
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
    
    if (searchInput) {
      searchInput.value = '';
    }
    
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
    
    // Set the group by region checkbox based on preference
    if (groupByRegionCheckbox) {
      groupByRegionCheckbox.checked = preferences.groupByRegionDefault;
    }
    
    // Display results in UI based on preference
    console.log('Displaying results in UI');
    if (preferences.groupByRegionDefault) {
      displayResultsGroupedByRegion(results);
    } else {
      displayResults(results);
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
      if (window.scoringDetails) {
        const details = window.scoringDetails;
        const message = `Accessibility Metrics Explained:\n\n` +
          `1. CRITICAL BARRIERS: ${details.criticalBarriers}\n` +
          `   • Count of show-stopping issues that prevent access\n` +
          `   • Must be ZERO for accessibility\n` +
          `   • Examples: missing labels, keyboard traps, aria-hidden on interactive content\n\n` +
          
          `2. BREADTH SCORE: ${Math.round(details.breadthScore)}%\n` +
          `   • ${details.touchpointsWithFailures} of ${details.touchpointsWithTestableElements} touchpoints have failures\n` +
          `   • Shows how widely issues are distributed\n` +
          `   • Higher % means more diverse areas affected\n\n` +
          
          `3. A11Y INDEX: ${Math.round(details.a11yIndex)}\n` +
          `   • Combined directional indicator (0-100, higher is better)\n` +
          `   • Based on: breadth (50%), friction (30%), principles (20%)\n` +
          `   • Track over time to measure improvement\n\n` +
          
          `IMPORTANT: Conformance to WCAG is binary - you either conform or you don't.\n` +
          `These metrics help prioritize fixes but do NOT represent % compliance.\n\n` +
          
          `See ACCESSIBILITY_SCORING.md for full methodology.`;
        alert(message);
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

  // Handle search input
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      activeFilters.searchText = this.value.toLowerCase();
      applyFilters();
    });
  }
  
  // Handle group by region checkbox
  if (groupByRegionCheckbox) {
    groupByRegionCheckbox.addEventListener('change', function() {
      if (currentTestResults) {
        if (this.checked) {
          displayResultsGroupedByRegion(currentTestResults);
        } else {
          displayResults(currentTestResults);
        }
      }
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

    // Display filtered results
    if (hasVisibleIssues) {
      displayResults(filteredResults);
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
      
      // Sort issues by type
      touchpointIssues.sort((a, b) => {
        const typeOrder = { fail: 0, warning: 1, info: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
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
    
    // Calculate dimensions
    const width = 200;
    const height = 200;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
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
    const legendStartY = height + 10; // Move legend outside main chart area
    const legendG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendG.setAttribute('class', 'chart-legend');
    
    // Calculate legend height based on number of items with 1.5 line spacing
    const legendItemHeight = 21; // 14px font * 1.5 = 21px line height
    const activeItems = data.filter(item => item.value > 0).length;
    const legendHeight = (activeItems * legendItemHeight) + 20; // Add padding
    
    // Update SVG dimensions to accommodate legend with wider width
    const svgWidth = 400; // Increased to prevent text cropping
    svg.setAttribute('width', '100%'); // Use full container width
    svg.setAttribute('height', height + legendHeight);
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${height + legendHeight}`);
    
    // Create legend items vertically to avoid overlap
    let legendY = legendStartY;
    data.forEach((item, index) => {
      if (item.value > 0) {
        // Legend item group
        const itemG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Single pattern indicator that combines color and pattern
        const legendIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        legendIndicator.setAttribute('x', 10);
        legendIndicator.setAttribute('y', legendY - 6); // Center with text baseline
        legendIndicator.setAttribute('width', '20');
        legendIndicator.setAttribute('height', '12');
        legendIndicator.setAttribute('fill', `url(#${item.pattern})`);
        legendIndicator.setAttribute('stroke', '#333');
        legendIndicator.setAttribute('stroke-width', '1');
        legendIndicator.setAttribute('class', 'legend-color');
        itemG.appendChild(legendIndicator);
        
        // Label with percentage
        const percentage = total > 0 ? Math.round(item.value/total*100) : 0;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 35);
        text.setAttribute('y', legendY + 3); // Adjust for better baseline alignment
        text.setAttribute('class', 'legend-text');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = `${item.label}: ${item.value} (${percentage}%)`;
        itemG.appendChild(text);
        
        legendG.appendChild(itemG);
        legendY += 21; // 1.5x line height (14px font * 1.5 = 21px)
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
    
    // Calculate dimensions
    const width = 300;
    const height = 200;
    const padding = 40;
    const barWidth = (width - padding * 2) / data.length - 10;
    
    // Find max value
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
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
      const barHeight = item.value > 0 ? (item.value / maxValue) * (height - padding * 2) : 0;
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
      
      // Draw label
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('x', barX + barWidth / 2);
      labelText.setAttribute('y', height - padding + 15);
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('class', 'chart-label');
      labelText.textContent = item.label;
      barG.appendChild(labelText);
      
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
      </ul>
    </nav>
  </section>

  <main id="main-content">
  <section aria-labelledby="summary-heading">
    <h2 id="summary-heading"><span class="section-number">1.</span>Summary</h2>
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
    
    // Update accordion default
    const accordionRadio = document.querySelector(`input[name="accordion-default"][value="${preferences.accordionDefault}"]`);
    if (accordionRadio) {
      accordionRadio.checked = true;
    }
    
    // Update group by region checkbox
    const groupByRegionCheckbox = document.getElementById('pref-group-by-region');
    if (groupByRegionCheckbox) {
      groupByRegionCheckbox.checked = preferences.groupByRegionDefault;
    }
    
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
    
    // Get group by region default
    const groupByRegionCheckbox = document.getElementById('pref-group-by-region');
    if (groupByRegionCheckbox) {
      preferences.groupByRegionDefault = groupByRegionCheckbox.checked;
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
      selectedTouchpoints: [...touchpoints],
      accordionDefault: 'closed',
      groupByRegionDefault: false
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