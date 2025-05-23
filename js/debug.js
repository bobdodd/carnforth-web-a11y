/**
 * Carnforth Web A11y Debug Mode
 * 
 * Educational debugging system that helps developers understand:
 * 1. How accessibility tests work
 * 2. What detection strategies are being used
 * 3. Why certain decisions were made
 * 4. How to troubleshoot issues
 * 
 * Enable debug mode by setting: window.CARNFORTH_DEBUG = true
 * Or via Chrome DevTools console: localStorage.setItem('carnforth_debug', 'true')
 */

(function() {
  'use strict';

  // Debug configuration
  const DEBUG_CONFIG = {
    // Check multiple sources for debug flag
    isEnabled: () => {
      return window.CARNFORTH_DEBUG === true || 
             localStorage.getItem('carnforth_debug') === 'true' ||
             new URLSearchParams(window.location.search).has('carnforth_debug');
    },
    
    // Verbosity levels
    levels: {
      INFO: { color: '#0066cc', emoji: 'ℹ️' },
      DETECTION: { color: '#009900', emoji: '🔍' },
      ANALYSIS: { color: '#ff6600', emoji: '📊' },
      WARNING: { color: '#ff9900', emoji: '⚠️' },
      ERROR: { color: '#cc0000', emoji: '❌' },
      SUCCESS: { color: '#006600', emoji: '✅' },
      EDUCATIONAL: { color: '#9900cc', emoji: '📚' }
    }
  };

  // Main debug logger class
  class CarnforthDebugger {
    constructor() {
      this.enabled = DEBUG_CONFIG.isEnabled();
      this.logHistory = [];
      this.timers = new Map();
      
      // Expose to global scope for easy access
      window.CarnforthDebug = this;
      
      if (this.enabled) {
        this.showWelcomeBanner();
      }
    }

    /**
     * Show welcome banner when debug mode is activated
     */
    showWelcomeBanner() {
      console.log('%c🦢 Carnforth Web A11y - Debug Mode Enabled 🦢', 
        'background: #4a0080; color: white; padding: 10px 20px; font-size: 16px; font-weight: bold;');
      
      console.log('%c📚 Educational Mode Active - You\'ll see detailed explanations of:', 
        'color: #9900cc; font-size: 14px; padding: 5px;');
      
      console.log(`
  • How elements are detected
  • Why certain WCAG criteria apply
  • What accessibility issues mean
  • How to fix identified problems
  • Chrome extension architecture insights
      `);
      
      console.log('%cTip: Disable debug mode by running: CarnforthDebug.disable()', 
        'color: #666; font-style: italic;');
    }

    /**
     * Main logging method with educational context
     */
    log(level, message, data = {}, educational = null) {
      if (!this.enabled) return;
      
      const config = DEBUG_CONFIG.levels[level] || DEBUG_CONFIG.levels.INFO;
      const timestamp = new Date().toISOString();
      
      // Build log entry
      const logEntry = {
        timestamp,
        level,
        message,
        data,
        educational
      };
      
      // Store in history
      this.logHistory.push(logEntry);
      
      // Console output with styling
      const prefix = `${config.emoji} [${level}]`;
      console.log(
        `%c${prefix} ${message}`,
        `color: ${config.color}; font-weight: bold;`,
        data
      );
      
      // Add educational note if provided
      if (educational) {
        console.log(
          '%c📚 Learn: ' + educational,
          'color: #9900cc; font-style: italic; margin-left: 20px;'
        );
      }
    }

    /**
     * Log element detection with explanation
     */
    logDetection(elementType, selector, count, strategy) {
      this.log('DETECTION', 
        `Found ${count} ${elementType}(s) using selector: ${selector}`,
        { selector, count, elements: strategy.elements },
        `This detection uses ${strategy.method}. ${strategy.explanation}`
      );
    }

    /**
     * Log accessibility analysis with WCAG context
     */
    logAnalysis(element, checkType, result, wcagInfo) {
      const elementDesc = this.describeElement(element);
      
      this.log('ANALYSIS',
        `Checking ${checkType} for ${elementDesc}`,
        { 
          element, 
          checkType, 
          result,
          wcag: wcagInfo.criterion
        },
        `WCAG ${wcagInfo.criterion}: ${wcagInfo.title} - ${wcagInfo.explanation}`
      );
    }

    /**
     * Log violations with remediation guidance
     */
    logViolation(violation, element, remediation) {
      this.log('WARNING',
        `Accessibility violation: ${violation.type}`,
        {
          violation,
          element,
          severity: violation.severity
        },
        `How to fix: ${remediation.steps.join(' → ')}`
      );
    }

    /**
     * Start a performance timer
     */
    startTimer(label) {
      if (!this.enabled) return;
      
      this.timers.set(label, performance.now());
      this.log('INFO', `Timer started: ${label}`);
    }

    /**
     * End a performance timer and log duration
     */
    endTimer(label) {
      if (!this.enabled) return;
      
      const start = this.timers.get(label);
      if (!start) return;
      
      const duration = performance.now() - start;
      this.timers.delete(label);
      
      this.log('INFO', 
        `Timer ended: ${label}`,
        { duration: `${duration.toFixed(2)}ms` },
        duration > 1000 ? 'Consider optimizing this operation for better performance' : null
      );
    }

    /**
     * Log Chrome extension specific issues
     */
    logExtensionIssue(issue, workaround) {
      this.log('WARNING',
        `Chrome Extension Constraint: ${issue}`,
        { issue },
        `Workaround: ${workaround}`
      );
    }

    /**
     * Create a detailed element description for logging
     */
    describeElement(element) {
      if (!element) return 'null element';
      
      const tag = element.tagName?.toLowerCase() || 'unknown';
      const id = element.id ? `#${element.id}` : '';
      const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
      const role = element.getAttribute('role') ? `[role="${element.getAttribute('role')}"]` : '';
      
      return `<${tag}${id}${classes}${role}>`;
    }

    /**
     * Export debug log for analysis
     */
    exportLog() {
      const logData = {
        sessionStart: this.logHistory[0]?.timestamp,
        sessionEnd: new Date().toISOString(),
        totalEntries: this.logHistory.length,
        entries: this.logHistory
      };
      
      const blob = new Blob([JSON.stringify(logData, null, 2)], 
        { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carnforth-debug-${Date.now()}.json`;
      a.click();
      
      this.log('SUCCESS', 'Debug log exported', { entries: this.logHistory.length });
    }

    /**
     * Clear debug log
     */
    clearLog() {
      const count = this.logHistory.length;
      this.logHistory = [];
      this.timers.clear();
      console.clear();
      this.log('INFO', `Cleared ${count} log entries`);
    }

    /**
     * Enable debug mode
     */
    enable() {
      this.enabled = true;
      localStorage.setItem('carnforth_debug', 'true');
      window.CARNFORTH_DEBUG = true;
      this.showWelcomeBanner();
    }

    /**
     * Disable debug mode
     */
    disable() {
      this.enabled = false;
      localStorage.removeItem('carnforth_debug');
      window.CARNFORTH_DEBUG = false;
      console.log('🦢 Carnforth debug mode disabled');
    }

    /**
     * Educational helper: Explain a WCAG criterion
     */
    explainWCAG(criterion) {
      const explanations = {
        '1.1.1': {
          title: 'Non-text Content',
          level: 'A',
          explanation: 'All non-text content must have a text alternative that serves the equivalent purpose.',
          examples: ['Images need alt text', 'Videos need captions', 'Icons need labels'],
          impact: 'Screen reader users cannot understand images without text alternatives'
        },
        '1.3.1': {
          title: 'Info and Relationships',
          level: 'A',
          explanation: 'Information, structure, and relationships must be programmatically determined.',
          examples: ['Form labels must be associated with inputs', 'Table headers must be marked up correctly', 'Lists must use proper list markup'],
          impact: 'Assistive technology cannot convey the structure and relationships in content'
        },
        '4.1.2': {
          title: 'Name, Role, Value',
          level: 'A',
          explanation: 'All UI components must have accessible names and roles, and states must be programmatically set.',
          examples: ['Buttons need accessible names', 'Custom widgets need ARIA roles', 'Checkboxes must expose checked state'],
          impact: 'Screen readers cannot announce what an element is or its current state'
        },
        '2.1.1': {
          title: 'Keyboard',
          level: 'A',
          explanation: 'All functionality must be available from a keyboard.',
          examples: ['Click handlers also need keyboard handlers', 'Custom controls must be focusable', 'Drag and drop needs keyboard alternative'],
          impact: 'Keyboard-only users cannot access mouse-only functionality'
        },
        '2.4.7': {
          title: 'Focus Visible',
          level: 'AA',
          explanation: 'Keyboard focus indicator must be visible.',
          examples: ['Links and buttons show focus outline', 'Custom focus styles are clearly visible', 'Focus is not suppressed with outline:none'],
          impact: 'Keyboard users cannot see where they are on the page'
        }
      };
      
      const info = explanations[criterion];
      if (!info) {
        this.log('INFO', `No explanation available for WCAG ${criterion}`);
        return;
      }
      
      console.log(`%c📚 WCAG ${criterion}: ${info.title} (Level ${info.level})`, 
        'color: #9900cc; font-size: 14px; font-weight: bold;');
      console.log(`%c${info.explanation}`, 'color: #666; font-style: italic;');
      console.log('%cExamples:', 'font-weight: bold;');
      info.examples.forEach(ex => console.log(`  • ${ex}`));
      console.log(`%cImpact: ${info.impact}`, 'color: #cc0000;');
    }

    /**
     * Educational helper: Explain detection strategies
     */
    explainDetectionStrategy(strategy) {
      const strategies = {
        'multi-signal': {
          name: 'Multi-Signal Detection',
          description: 'Combines multiple indicators to reduce false positives',
          example: 'Maps are detected by checking class names AND data attributes AND visual characteristics',
          benefit: 'More accurate detection with fewer false positives'
        },
        'semantic-html': {
          name: 'Semantic HTML Detection',
          description: 'Relies on proper HTML element usage',
          example: '<button> elements are inherently focusable and have button role',
          benefit: 'Fast and reliable when developers use semantic HTML'
        },
        'aria-role': {
          name: 'ARIA Role Detection',
          description: 'Uses ARIA roles to identify element purposes',
          example: 'role="navigation" identifies navigation regions',
          benefit: 'Works with custom elements that have proper ARIA'
        },
        'heuristic': {
          name: 'Heuristic Analysis',
          description: 'Uses patterns and context clues to infer element purpose',
          example: 'A div with inputs and a submit button is likely a form',
          benefit: 'Catches elements that lack proper semantics'
        }
      };
      
      const info = strategies[strategy];
      if (!info) {
        this.log('INFO', `No explanation available for strategy: ${strategy}`);
        return;
      }
      
      console.log(`%c🔍 Detection Strategy: ${info.name}`, 
        'color: #009900; font-size: 14px; font-weight: bold;');
      console.log(`%c${info.description}`, 'color: #666;');
      console.log(`%cExample: ${info.example}`, 'color: #666; font-style: italic;');
      console.log(`%cBenefit: ${info.benefit}`, 'color: #006600;');
    }
  }

  // Initialize debugger
  const debugger = new CarnforthDebugger();

  // Helper functions for touchpoints to use
  window.CarnforthDebugHelpers = {
    /**
     * Log detection with educational context
     */
    logDetection: (type, elements, strategy) => {
      debugger.logDetection(type, strategy.selector, elements.length, {
        method: strategy.method,
        explanation: strategy.explanation,
        elements: elements
      });
    },

    /**
     * Log analysis step
     */
    logAnalysis: (element, check, result, wcag) => {
      debugger.logAnalysis(element, check, result, wcag);
    },

    /**
     * Log violation found
     */
    logViolation: (violation, element, remediation) => {
      debugger.logViolation(violation, element, remediation);
    },

    /**
     * Start performance measurement
     */
    startTimer: (label) => {
      debugger.startTimer(label);
    },

    /**
     * End performance measurement
     */
    endTimer: (label) => {
      debugger.endTimer(label);
    },

    /**
     * Log Chrome extension issue
     */
    logExtensionIssue: (issue, workaround) => {
      debugger.logExtensionIssue(issue, workaround);
    }
  };

})();