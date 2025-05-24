/**
 * Documentation System for Carnforth Web A11y
 * 
 * This module provides a reusable documentation mechanism that can be used
 * throughout the extension to provide educational content about touchpoints,
 * WCAG criteria, best practices, and more.
 */

// Documentation about the Carnforth Project
const carnforthProjectDocumentation = {
  title: 'About the Carnforth Project',
  overview: 'Carnforth Web A11y is an educational Chrome extension designed to help developers understand and fix web accessibility issues.',
  sections: [
    {
      heading: 'Project Goals',
      content: [
        'Provide clear, actionable feedback about accessibility issues',
        'Educate developers about WCAG standards and best practices',
        'Make accessibility testing approachable and understandable',
        'Demonstrate that accessibility improves usability for everyone',
        'Encourage proactive accessibility implementation, not just compliance'
      ]
    },
    {
      heading: 'What Makes Carnforth Different',
      content: [
        'Educational focus - every issue includes the "why" and "who" it affects',
        'Real-world analogies to help developers understand impact',
        'Code examples showing both problems and solutions',
        'Comprehensive issue detection beyond basic WCAG compliance',
        'Visual highlighting to quickly locate issues on the page'
      ]
    },
    {
      heading: 'Understanding Automated Testing',
      content: [
        '<strong>What automation can do well:</strong>',
        '• Detect missing or incorrect HTML attributes',
        '• Find color contrast issues',
        '• Identify structural problems (headings, landmarks)',
        '• Check for keyboard accessibility basics',
        '• Validate ARIA usage',
        '',
        '<strong>What automation cannot do:</strong>',
        '• Judge if alt text is meaningful',
        '• Determine if content makes sense to users',
        '• Test complex interactions',
        '• Evaluate cognitive load',
        '• Assess whether ARIA is used appropriately'
      ]
    },
    {
      heading: 'The 80/20 Rule of Accessibility Testing',
      content: [
        'Automated tools can find about 20-30% of accessibility issues',
        'The remaining 70-80% require human judgment and testing',
        'Carnforth focuses on making that 20-30% as educational and actionable as possible',
        'Always complement automated testing with:',
        '• Manual keyboard testing',
        '• Screen reader testing',
        '• Testing with actual users with disabilities',
        '• Cognitive walkthroughs'
      ]
    },
    {
      heading: 'Using Carnforth Effectively',
      content: [
        '1. Run tests early and often during development',
        '2. Read the impact statements to understand who is affected',
        '3. Use the code examples as starting points, not complete solutions',
        '4. Follow the provided WCAG links to learn more',
        '5. Test your fixes with real assistive technology',
        '6. Remember: passing automated tests ≠ fully accessible'
      ]
    },
    {
      heading: 'Contributing to Accessibility',
      content: [
        'Accessibility is not a checklist - it\'s a mindset',
        'Every improvement helps real people use the web',
        'Small changes can have significant impact',
        'Accessibility benefits everyone, not just people with disabilities',
        'When in doubt, ask users with disabilities for feedback'
      ]
    }
  ],
  resources: [
    { title: 'Web Content Accessibility Guidelines (WCAG)', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
    { title: 'WebAIM - Web Accessibility In Mind', url: 'https://webaim.org/' },
    { title: 'A11y Project', url: 'https://www.a11yproject.com/' },
    { title: 'MDN Accessibility', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility' }
  ]
};

// Accessibility Scoring Methodology Documentation
const accessibilityScoringDocumentation = {
  title: 'Accessibility Metrics Explained',
  overview: 'Carnforth uses three complementary metrics to help you understand and prioritize accessibility improvements. These metrics are directional indicators, not compliance measures.',
  sections: [
    {
      heading: 'Critical Barriers',
      content: [
        '<strong>What it measures:</strong> Count of show-stopping issues that prevent access',
        '<strong>Target:</strong> Must be ZERO for accessibility',
        '<strong>Examples:</strong>',
        '• Missing labels on form controls',
        '• Keyboard traps that prevent navigation',
        '• Interactive elements hidden from assistive technology',
        '• Images without alt text in critical contexts',
        '',
        '<em>Think of these as locked doors - no matter how beautiful your building, if people can\'t get in, nothing else matters.</em>'
      ]
    },
    {
      heading: 'Breadth Score',
      content: [
        '<strong>What it measures:</strong> Percentage of touchpoints with failures',
        '<strong>How it\'s calculated:</strong> (Touchpoints with failures / Total testable touchpoints) × 100',
        '<strong>What it tells you:</strong>',
        '• Lower percentage = issues are concentrated in fewer areas',
        '• Higher percentage = issues are spread across many aspects',
        '',
        '<strong>Example:</strong> If 5 of 20 touchpoints have failures, Breadth Score = 25%',
        '',
        '<em>This helps you understand if you have a few problem areas to focus on, or if accessibility issues are widespread throughout your site.</em>'
      ]
    },
    {
      heading: 'A11y Index',
      content: [
        '<strong>What it measures:</strong> Combined directional indicator (0-100, higher is better)',
        '<strong>How it\'s calculated:</strong>',
        '• 50% based on breadth (how widespread issues are)',
        '• 30% based on friction (severity-weighted issue count)',
        '• 20% based on WCAG principles affected',
        '',
        '<strong>Principle weights:</strong>',
        '• Perceivable & Operable: 1.0 (most critical)',
        '• Understandable: 0.8',
        '• Robust: 0.7',
        '',
        '<em>Track this score over time to measure improvement. It\'s designed to show progress even before achieving full compliance.</em>'
      ]
    },
    {
      heading: 'Important Philosophy',
      content: [
        '<strong>Conformance is Binary:</strong>',
        '"You can no more be 80% conformant than you can be 80% alive" - these metrics don\'t represent partial compliance.',
        '',
        '<strong>What these metrics ARE:</strong>',
        '• Tools for prioritizing remediation efforts',
        '• Indicators of progress over time',
        '• Ways to understand the scope of work needed',
        '',
        '<strong>What these metrics ARE NOT:</strong>',
        '• Compliance percentages',
        '• Certification scores',
        '• Substitutes for proper accessibility testing',
        '',
        '<em>Use these metrics to guide your journey toward accessibility, not as a destination.</em>'
      ]
    }
  ],
  relatedLinks: [
    { text: 'WCAG Understanding Conformance', url: 'https://www.w3.org/WAI/WCAG21/Understanding/conformance' },
    { text: 'WebAIM: WCAG 2 Checklist', url: 'https://webaim.org/standards/wcag/checklist' }
  ]
};

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
          code: '<section>\n  <h3>Our Office Location</h3>\n  <h4 class="sr-only">Interactive map of our office</h4>\n  <iframe src="https://maps.google.com/..." title="Interactive map showing office location"></iframe>\n  <h4>Key Information</h4>\n  <ul>\n    <li>Address: 123 Main St...</li>\n  </ul>\n</section>',
          explanation: 'Proper heading structure with sr-only h4 allows skipping the map'
        },
        {
          code: '<h4 id="map-heading" class="sr-only">Store locator map</h4>\n<div role="application" aria-labelledby="map-heading">\n  <!-- Map content -->\n</div>',
          explanation: 'Screen reader-only heading connected via aria-labelledby'
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

// Issue-specific documentation for common violation types
const issueDocumentation = {
  'maps-no-accessible-name': {
    title: 'Map Missing Accessible Name',
    overview: 'This map element lacks a descriptive name that screen reader users can understand.',
    impact: {
      who: 'Users who rely on screen readers to understand page content',
      severity: 'High - Screen reader users cannot understand what the map represents',
      realWorld: 'Imagine trying to navigate a website blindfolded. Without a descriptive name, you would have no idea what this map shows - is it directions to a store, a weather map, or something else entirely?'
    },
    whyItMatters: [
      'Screen readers announce "frame" or "application" without context',
      'Users cannot determine if the map content is relevant to their needs',
      'Navigation becomes frustrating when purposes are unclear',
      'May violate legal accessibility requirements'
    ],
    howToFix: {
      overview: 'Add a descriptive title or aria-label and use proper heading structure',
      steps: [
        'Add a descriptive accessible name (title, aria-label, or alt text)',
        'Place map within a proper heading structure',
        'Add screen reader-only h4 before the map for navigation',
        'Group text alternatives under a Key Information heading'
      ],
      examples: [
        {
          type: 'iframe',
          before: '<iframe src="https://maps.google.com/..."></iframe>',
          after: '<iframe src="https://maps.google.com/..." title="Interactive map showing office location at 123 Main Street"></iframe>',
          explanation: 'The title attribute provides the accessible name for iframes'
        },
        {
          type: 'div',
          before: '<div id="map-container"></div>',
          after: '<div id="map-container" role="application" aria-label="Store locator map for Chicago area"></div>',
          explanation: 'For div-based maps, use aria-label with an appropriate role'
        },
        {
          type: 'img',
          before: '<img src="static-map.png">',
          after: '<img src="static-map.png" alt="Map showing driving directions from Chicago to Milwaukee via I-94">',
          explanation: 'For static map images, use descriptive alt text'
        }
      ]
    },
    resources: [
      { title: 'WebAIM: Creating Accessible Frames', url: 'https://webaim.org/techniques/frames/' },
      { title: 'MDN: ARIA Labels and Descriptions', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label' }
    ]
  },
  
  'generic-map-name': {
    title: 'Map Has Generic Name',
    overview: 'This map uses a generic name like "Map" that doesn\'t provide meaningful context.',
    impact: {
      who: 'All users, but especially those using assistive technologies',
      severity: 'Medium - Users can identify it\'s a map but not its purpose',
      realWorld: 'It\'s like labeling every door in a building as just "Door" - technically correct but not helpful for finding what you need.'
    },
    whyItMatters: [
      'Users need to understand the map\'s purpose before interacting with it',
      'Generic names make it hard to distinguish between multiple maps',
      'Screen reader users hear repetitive, unhelpful announcements',
      'Reduces efficiency for all users navigating the page'
    ],
    howToFix: {
      overview: 'Replace generic names with descriptive ones and use proper heading structure',
      tips: [
        'Include the location: "Map of downtown Seattle"',
        'Mention the purpose: "Delivery area map"',
        'Add relevant context: "Hurricane evacuation routes map"',
        'Be specific but concise: "Campus building locations"',
        'Add screen reader-only headings to make maps skippable',
        'Structure content with clear heading hierarchy'
      ],
      examples: [
        {
          before: '<iframe src="map.html" title="Map"></iframe>',
          after: '<iframe src="map.html" title="Interactive map of Paris Metro system"></iframe>',
          explanation: 'Specify what the map shows'
        },
        {
          before: '<img src="map.png" alt="Map">',
          after: '<img src="map.png" alt="Campus map showing building names and parking locations">',
          explanation: 'Describe the map content and purpose'
        },
        {
          before: '<div aria-label="Map"></div>',
          after: '<div aria-label="Real-time traffic map for Los Angeles freeways"></div>',
          explanation: 'Include type and location information'
        }
      ]
    }
  },
  
  'positive-tabindex': {
    title: 'Positive Tabindex Disrupts Focus Order',
    overview: 'Using positive tabindex values forces a specific tab order that often confuses keyboard users.',
    impact: {
      who: 'Keyboard users, including those with motor disabilities',
      severity: 'High - Creates unpredictable navigation patterns',
      realWorld: 'Imagine reading a book where you\'re forced to jump to page 47 after page 2, then back to page 3. That\'s what positive tabindex does to keyboard navigation.'
    },
    whyItMatters: [
      'Natural reading order (top-to-bottom, left-to-right) is intuitive',
      'Positive values create unexpected jumps in focus order',
      'Maintenance becomes difficult as the page evolves',
      'Users may miss important interactive elements'
    ],
    howToFix: {
      overview: 'Remove positive tabindex values and use proper DOM order instead',
      steps: [
        'Remove all positive tabindex values',
        'Rearrange HTML to match desired focus order',
        'Use CSS for visual positioning if needed',
        'Only use tabindex="0" or tabindex="-1" when necessary'
      ],
      examples: [
        {
          before: '<button tabindex="3">Submit</button>\n<input tabindex="1" type="text">\n<button tabindex="2">Cancel</button>',
          after: '<input type="text">\n<button>Cancel</button>\n<button>Submit</button>',
          explanation: 'Arrange elements in DOM to match logical order'
        }
      ]
    }
  },
  
  'no-accessible-name': {
    title: 'Interactive Element Missing Accessible Name',
    overview: 'This interactive element has no accessible name, making it impossible for screen reader users to understand its purpose.',
    impact: {
      who: 'Screen reader users and voice control users',
      severity: 'Critical - Users cannot interact with unnamed elements',
      realWorld: 'It\'s like having a button with no label - you can see it\'s clickable but have no idea what it does.'
    },
    whyItMatters: [
      'Screen readers announce elements by their accessible names',
      'Voice control users need names to activate controls',
      'Unnamed elements create barriers to interaction',
      'Users may activate the wrong control by mistake'
    ],
    howToFix: {
      overview: 'Add an accessible name using appropriate techniques based on the element type',
      examples: [
        {
          type: 'Button',
          before: '<button><img src="save.png"></button>',
          after: '<button aria-label="Save document"><img src="save.png" alt=""></button>',
          explanation: 'Use aria-label for buttons with only icons'
        },
        {
          type: 'Link',
          before: '<a href="/profile"><img src="user.png"></a>',
          after: '<a href="/profile"><img src="user.png" alt="User profile"></a>',
          explanation: 'Alt text on images provides the link text'
        },
        {
          type: 'Form input',
          before: '<input type="text" placeholder="Email">',
          after: '<label for="email">Email</label>\n<input type="text" id="email" placeholder="email@example.com">',
          explanation: 'Always use proper labels for form inputs'
        }
      ]
    },
    resources: [
      { title: 'WebAIM: Labels and Accessible Names', url: 'https://webaim.org/articles/label-name/' },
      { title: 'WCAG Technique: Providing accessible names', url: 'https://www.w3.org/WAI/WCAG21/Techniques/general/G131' }
    ]
  },
  
  'tabindex-on-non-interactive': {
    title: 'Non-Interactive Element Made Focusable',
    overview: 'This non-interactive element has tabindex="0", making it keyboard focusable even though it has no interactive behavior.',
    impact: {
      who: 'Keyboard users',
      severity: 'Medium - Creates confusing navigation experience',
      realWorld: 'Imagine if every paragraph on a page was a tab stop - you\'d have to press Tab dozens of times to reach the button you want.'
    },
    whyItMatters: [
      'Adds unnecessary tab stops, slowing keyboard navigation',
      'Confuses users when focused elements do nothing',
      'May indicate missing interactive functionality',
      'Makes pages harder to navigate efficiently'
    ],
    howToFix: {
      overview: 'Remove tabindex from non-interactive elements or make them properly interactive',
      steps: [
        'Determine if the element should be interactive',
        'If not interactive, remove tabindex attribute',
        'If it should be interactive, add proper role and keyboard handlers',
        'Consider using semantic HTML instead of div/span with tabindex'
      ],
      examples: [
        {
          before: '<div tabindex="0">Important notice</div>',
          after: '<div>Important notice</div>',
          explanation: 'Static content doesn\'t need to be focusable'
        },
        {
          before: '<div tabindex="0" onclick="doSomething()">Click me</div>',
          after: '<button onclick="doSomething()">Click me</button>',
          explanation: 'Use semantic elements for interactive content'
        }
      ]
    }
  },
  
  'maps-presentation-role': {
    title: 'Map Has Presentation Role Removing Semantics',
    overview: 'This map has role="presentation" which removes its semantic meaning, making it confusing for screen reader users.',
    impact: {
      who: 'Screen reader users',
      severity: 'High - Content lacks semantic context',
      realWorld: 'Imagine looking at a sign where all the text has been erased - you know something is there but have no idea what it is.'
    },
    whyItMatters: [
      'role="presentation" tells assistive technology to ignore the element',
      'Screen readers cannot announce what the element is',
      'Users miss important context about the content',
      'May violate WCAG requirement for proper semantics'
    ],
    howToFix: {
      overview: 'Remove role="presentation" and add proper accessible names',
      steps: [
        'Remove the role="presentation" attribute entirely',
        'For images: Add descriptive alt text',
        'For iframes: Add descriptive title attribute',
        'For divs: Add appropriate ARIA labels',
        'Test with a screen reader to verify proper announcements'
      ],
      examples: [
        {
          before: '<img src="map.png" role="presentation" alt="">',
          after: '<img src="map.png" alt="Campus map showing building locations and parking areas">',
          explanation: 'Removing presentation role and adding alt text restores semantic meaning'
        },
        {
          before: '<iframe src="maps.google.com/..." role="presentation" title=""></iframe>',
          after: '<iframe src="maps.google.com/..." title="Interactive map of office locations in Seattle area"></iframe>',
          explanation: 'Proper title attribute provides context for the map'
        }
      ]
    },
    resources: [
      { title: 'ARIA Presentation Role', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/presentation_role' },
      { title: 'WCAG 4.1.2 Name, Role, Value', url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html' }
    ]
  },
  
  'maps-aria-hidden': {
    title: 'Map Hidden from Assistive Technology',
    overview: 'This map is hidden from screen readers with aria-hidden="true", making it completely inaccessible to blind users.',
    impact: {
      who: 'Screen reader users',
      severity: 'High - Content completely inaccessible',
      realWorld: 'It\'s like putting an "Employees Only" sign on the main entrance - legitimate users are blocked from accessing important content.'
    },
    whyItMatters: [
      'aria-hidden="true" makes content invisible to screen readers',
      'Maps often contain important location or geographic information',
      'Violates fundamental accessibility principle of equal access',
      'May prevent users from accessing critical information'
    ],
    howToFix: {
      overview: 'Remove aria-hidden="true" and provide proper alternative text with heading structure',
      steps: [
        'Remove the aria-hidden="true" attribute',
        'Add a screen reader-only h4 heading before the map for easy skipping',
        'For images: Add descriptive alt text that conveys the map information',
        'For iframes: Add descriptive title attribute',
        'Structure alternatives: h3 for location, sr-only h4 for map, h4 for key information',
        'Include address and important details under the Key Information heading',
        'Only use aria-hidden on truly decorative content'
      ],
      examples: [
        {
          before: '<img src="static-maps.yandex.ru/..." aria-hidden="true" alt="">',
          after: '<img src="static-maps.yandex.ru/..." alt="Map showing office location at 123 Main St, 2 blocks from Central Station">',
          explanation: 'Removing aria-hidden and adding descriptive alt text makes the map information accessible'
        },
        {
          before: '<iframe src="maps.google.com/..." aria-hidden="true" title="Map"></iframe>',
          after: '<iframe src="maps.google.com/..." title="Interactive map of downtown Chicago showing restaurant locations"></iframe>',
          explanation: 'Removing aria-hidden makes interactive maps accessible to all users'
        }
      ]
    },
    resources: [
      { title: 'Using aria-hidden', url: 'https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA7' },
      { title: 'Hiding Content Properly', url: 'https://webaim.org/techniques/css/invisiblecontent/' }
    ]
  },

  'map-control-too-small': {
    title: 'Map Control Touch Target Too Small',
    overview: 'This map control (button, link, etc.) has a touch target size below accessibility standards, making it difficult for users with motor disabilities to activate.',
    impact: {
      who: 'Users with motor disabilities, tremors, elderly users, mobile users',
      severity: 'High - Controls may be unusable',
      why: 'Small touch targets require precise motor control that many users don\'t have. This affects people with Parkinson\'s disease, arthritis, cerebral palsy, and other conditions that impact fine motor control. Mobile users also struggle with small targets.'
    },
    realWorldAnalogy: 'Imagine trying to press a tiny elevator button while wearing thick winter gloves - the small size makes it nearly impossible to hit the right button.',
    whatMatters: 'Touch targets need sufficient size to accommodate users with varying levels of motor control. The WCAG minimum of 24x24 pixels prevents accidental activation of adjacent controls, while the enhanced 44x44 pixel recommendation provides comfortable usability for all users.',
    howToFix: [
      'Increase the touch target size to at least 24x24 CSS pixels (WCAG 2.5.8)',
      'Ideally, make touch targets 44x44 pixels for optimal usability (WCAG 2.5.5)',
      'Use CSS padding to increase the clickable area without changing visual size',
      'Space controls far enough apart to prevent accidental activation',
      'Consider providing alternative large-button controls for essential functions',
      'Test with real users who have motor disabilities'
    ],
    codeExamples: {
      before: '<button class="zoom-control" style="width: 20px; height: 20px;">+</button>',
      after: '<button class="zoom-control" style="width: 20px; height: 20px; padding: 12px;">+</button>\n<!-- Total touch target: 44x44px (20px + 12px*2) -->'
    },
    resources: [
      { title: 'WCAG 2.5.8 Target Size (Minimum)', url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html' },
      { title: 'WCAG 2.5.5 Target Size (Enhanced)', url: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html' },
      { title: 'Touch Target Guidelines', url: 'https://www.nngroup.com/articles/touch-target-size/' }
    ]
  },

  'map-controls-suboptimal-size': {
    title: 'Map Controls Could Benefit from Larger Touch Targets',
    overview: 'While these map controls meet minimum accessibility requirements, larger touch targets would significantly improve usability for all users.',
    impact: {
      who: 'Mobile users, users with minor motor difficulties',
      severity: 'Medium - Usable but not optimal',
      why: 'While technically accessible at 24x24 pixels, smaller touch targets increase error rates and user frustration. This particularly affects mobile users and those with minor tremors or reduced dexterity.'
    },
    realWorldAnalogy: 'Like using chopsticks to pick up small seeds - it\'s possible but requires more concentration and effort than necessary.',
    whatMatters: 'Enhanced touch target sizes (44x44 pixels) represent best practice for modern web design. They reduce errors, increase user confidence, and create a more pleasant experience for everyone.',
    howToFix: [
      'Increase touch targets to 44x44 CSS pixels for optimal usability',
      'This is especially important for frequently-used controls like zoom buttons',
      'Consider mobile-first design principles',
      'Use generous padding around interactive elements',
      'Group related controls with adequate spacing'
    ],
    codeExamples: {
      current: '<button class="map-control" style="width: 24px; height: 24px;">🔍</button>',
      improved: '<button class="map-control" style="width: 32px; height: 32px; padding: 6px;">🔍</button>\n<!-- Total: 44x44px for better usability -->'
    },
    resources: [
      { title: 'Mobile Touch Target Guidelines', url: 'https://material.io/design/usability/accessibility.html#layout-and-typography' },
      { title: 'Apple Human Interface Guidelines', url: 'https://developer.apple.com/design/human-interface-guidelines/components/menus-and-actions/buttons' }
    ]
  }
  
  // Add more issue-specific documentation as needed
};

/**
 * Opens documentation in a modal dialog
 * @param {string} touchpointId - The touchpoint identifier
 * @param {Object} options - Additional options for the modal
 * @param {string} options.issueKey - Specific issue key for issue documentation
 * @param {Object} options.issueData - Issue data to provide context
 */
function openDocumentationModal(touchpointId, options = {}) {
  let doc;
  let modalType = 'touchpoint'; // default
  
  if (touchpointId === 'carnforth-project') {
    // Carnforth Project documentation
    doc = carnforthProjectDocumentation;
    modalType = 'carnforth';
  } else if (touchpointId === 'accessibility-scoring') {
    // Accessibility Scoring Methodology documentation
    doc = accessibilityScoringDocumentation;
    modalType = 'scoring';
  } else if (options.issueKey && issueDocumentation[options.issueKey]) {
    // Issue-specific documentation
    doc = issueDocumentation[options.issueKey];
    modalType = 'issue';
  } else if (touchpointDocumentation[touchpointId]) {
    // Touchpoint documentation
    doc = touchpointDocumentation[touchpointId];
    modalType = 'touchpoint';
  } else {
    console.warn(`No documentation found for: ${options.issueKey || touchpointId}`);
    return;
  }
  
  // Check if modal already exists
  let modal = document.getElementById('carnforth-doc-modal');
  if (!modal) {
    modal = createModal();
    document.body.appendChild(modal);
  }
  
  // Store reference to currently focused element
  const currentlyFocused = document.activeElement;
  if (currentlyFocused) {
    // Store a selector that can be used to find this element later
    if (currentlyFocused.id) {
      modal.dataset.lastFocus = `#${currentlyFocused.id}`;
    } else if (currentlyFocused.className) {
      // Try to create a unique selector based on class and position
      const selector = `.${currentlyFocused.className.split(' ').join('.')}`;
      const allMatching = document.querySelectorAll(selector);
      const index = Array.from(allMatching).indexOf(currentlyFocused);
      modal.dataset.lastFocus = `${selector}:nth-of-type(${index + 1})`;
    }
  }
  
  // Populate modal content based on type
  if (modalType === 'carnforth' || modalType === 'scoring') {
    populateCarnforthModal(modal, doc);
  } else if (modalType === 'issue') {
    populateIssueModal(modal, doc);
  } else {
    populateTouchpointModal(modal, doc);
  }
  
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
  closeButton.textContent = '×';
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
 * Populates the modal with touchpoint documentation content
 */
function populateTouchpointModal(modal, doc) {
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
 * Populates the modal with Carnforth Project documentation
 */
function populateCarnforthModal(modal, doc) {
  const title = modal.querySelector('.modal-title');
  const body = modal.querySelector('.modal-body');
  
  title.textContent = doc.title;
  
  let content = `<div class="doc-content">`;
  
  // Overview
  content += `<p class="doc-overview">${doc.overview}</p>`;
  
  // Sections
  doc.sections.forEach(section => {
    content += `<section class="doc-section">`;
    content += `<h3>${section.heading}</h3>`;
    
    if (Array.isArray(section.content)) {
      const hasHtml = section.content.some(item => item.includes('<'));
      if (hasHtml) {
        // If content contains HTML, join as paragraphs
        content += section.content.map(item => `<p>${item}</p>`).join('');
      } else {
        // Otherwise, create a list
        content += `<ul>`;
        section.content.forEach(item => {
          content += `<li>${item}</li>`;
        });
        content += `</ul>`;
      }
    } else {
      content += `<p>${section.content}</p>`;
    }
    
    content += `</section>`;
  });
  
  // Resources
  if (doc.resources && doc.resources.length > 0) {
    content += `<section class="doc-section">`;
    content += `<h3>Learn More</h3>`;
    content += `<ul class="resource-list">`;
    doc.resources.forEach(resource => {
      content += `<li><a href="${resource.url}" target="_blank" rel="noopener noreferrer">${resource.title}</a></li>`;
    });
    content += `</ul>`;
    content += `</section>`;
  }
  
  content += `</div>`;
  
  body.innerHTML = content;
}

/**
 * Populates the modal with issue-specific documentation content
 */
function populateIssueModal(modal, doc) {
  const title = modal.querySelector('.modal-title');
  const body = modal.querySelector('.modal-body');
  
  title.textContent = doc.title;
  
  // Clear previous content
  body.innerHTML = '';
  
  // Overview section
  const overviewSection = document.createElement('section');
  overviewSection.innerHTML = `
    <h3>What's the Problem?</h3>
    <p>${doc.overview}</p>
  `;
  body.appendChild(overviewSection);
  
  // Impact section
  if (doc.impact) {
    const impactSection = document.createElement('section');
    impactSection.innerHTML = `
      <h3>Who Does This Affect?</h3>
      <div class="impact-details">
        <p><strong>Affected Users:</strong> ${doc.impact.who}</p>
        <p><strong>Severity:</strong> ${doc.impact.severity}</p>
        ${doc.impact.realWorld ? `<p class="real-world-example"><em>${doc.impact.realWorld}</em></p>` : ''}
      </div>
    `;
    body.appendChild(impactSection);
  }
  
  // Why it matters
  if (doc.whyItMatters) {
    const whySection = document.createElement('section');
    whySection.innerHTML = `
      <h3>Why This Matters</h3>
      <ul>
        ${doc.whyItMatters.map(reason => `<li>${reason}</li>`).join('')}
      </ul>
    `;
    body.appendChild(whySection);
  }
  
  // How to fix
  if (doc.howToFix) {
    const fixSection = document.createElement('section');
    let fixContent = `<h3>How to Fix This Issue</h3>`;
    
    if (doc.howToFix.overview) {
      fixContent += `<p>${doc.howToFix.overview}</p>`;
    }
    
    if (doc.howToFix.steps) {
      fixContent += `
        <ol class="fix-steps">
          ${doc.howToFix.steps.map(step => `<li>${step}</li>`).join('')}
        </ol>
      `;
    }
    
    if (doc.howToFix.tips) {
      fixContent += `
        <h4>Tips:</h4>
        <ul>
          ${doc.howToFix.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      `;
    }
    
    if (doc.howToFix.examples) {
      fixContent += `<h4>Code Examples:</h4>`;
      doc.howToFix.examples.forEach(example => {
        fixContent += `
          <div class="code-example">
            ${example.type ? `<h5>${example.type} Example:</h5>` : ''}
            <div class="before-after">
              <div class="before">
                <strong>❌ Before:</strong>
                <pre><code>${escapeHtml(example.before)}</code></pre>
              </div>
              <div class="after">
                <strong>✅ After:</strong>
                <pre><code>${escapeHtml(example.after)}</code></pre>
              </div>
            </div>
            ${example.explanation ? `<p class="example-explanation">${example.explanation}</p>` : ''}
          </div>
        `;
      });
    }
    
    fixSection.innerHTML = fixContent;
    body.appendChild(fixSection);
  }
  
  // Resources
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
    // Store reference to the element that should receive focus
    let elementToFocus = null;
    
    // Check if we have a stored reference to the element that opened the modal
    if (modal.dataset.lastFocus) {
      const lastFocus = document.querySelector(modal.dataset.lastFocus);
      if (lastFocus) {
        elementToFocus = lastFocus;
      }
    }
    
    // If no stored reference, try to find a help button
    if (!elementToFocus) {
      const helpButtons = document.querySelectorAll('.help-button, .issue-info-button');
      if (helpButtons.length > 0) {
        elementToFocus = helpButtons[0];
      }
    }
    
    // Move focus BEFORE hiding the modal to avoid aria-hidden focus trap
    if (elementToFocus) {
      elementToFocus.focus();
    } else {
      // Fallback: blur current element to move focus out of modal
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }
    
    // Now safe to hide the modal after focus has been moved
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
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
  button.textContent = '?';
  button.onclick = (e) => {
    e.stopPropagation(); // Prevent accordion toggle
    openDocumentationModal(touchpointId);
  };
  return button;
}

/**
 * Creates an info button for issue-specific documentation
 */
function createIssueInfoButton(touchpointId, issueKey, issueData) {
  const button = document.createElement('button');
  button.className = 'issue-info-button';
  button.setAttribute('aria-label', `Learn more about this issue`);
  button.textContent = '?';
  button.onclick = (e) => {
    e.stopPropagation(); // Prevent issue disclosure toggle
    openDocumentationModal(touchpointId, {
      issueKey: issueKey,
      issueData: issueData
    });
  };
  return button;
}

// Export functions for use in other modules
window.CarnforthDocumentation = {
  openDocumentationModal,
  createHelpButton,
  createIssueInfoButton,
  touchpointDocumentation,
  issueDocumentation
};