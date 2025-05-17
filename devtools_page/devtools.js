/**
 * Creates the DevTools panel for Carnforth Web A11y
 */
chrome.devtools.panels.create(
  "Carnforth Web A11y", // Panel title
  "../icons/icon48.png", // Panel icon
  "../panel/panel.html", // Panel HTML page
  function(panel) {
    // Optional callback when panel is created
    console.log("Carnforth Web A11y panel created");
  }
);