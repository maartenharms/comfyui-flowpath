import { app } from "../../scripts/app.js";

console.log("🌊 FlowPath v1.2.1 loaded");

// Security: HTML escape function to prevent XSS attacks
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Security: Validate that an object has expected structure
function isValidThemeObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const requiredKeys = ['name', 'primary', 'primaryLight', 'primaryDark', 'gradient', 'accent', 'secondary', 'background'];
  return requiredKeys.every(key => typeof obj[key] === 'string');
}

// Security: Validate preset object structure
function isValidPresetObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  // Presets should have segments array and config object
  if (obj.segments && !Array.isArray(obj.segments)) return false;
  if (obj.config && typeof obj.config !== 'object') return false;
  return true;
}

// Helper function to chain callbacks
function chainCallback(object, property, callback) {
  if (object[property]) {
    const originalCallback = object[property];
    object[property] = function () {
      originalCallback.apply(this, arguments);
      callback.apply(this, arguments);
    };
  } else {
    object[property] = callback;
  }
}

// Theme definitions
const THEMES = {
  ocean: {
    name: "Ocean Blue",
    primary: "#4299e1",
    primaryLight: "rgba(66, 153, 225, 0.3)",
    primaryDark: "rgba(66, 153, 225, 0.6)",
    gradient: "linear-gradient(135deg, rgba(66, 153, 225, 0.2), rgba(20, 184, 166, 0.1))",
    accent: "#14b8a6", // Teal
    secondary: "#60a5fa",
    background: "linear-gradient(180deg, rgba(10, 30, 50, 0.5) 0%, rgba(20, 60, 80, 0.3) 100%)"
  },
  forest: {
    name: "Forest Green",
    primary: "#10b981",
    primaryLight: "rgba(16, 185, 129, 0.3)",
    primaryDark: "rgba(16, 185, 129, 0.6)",
    gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(217, 119, 6, 0.1))",
    accent: "#d97706", // Amber/Earth
    secondary: "#34d399",
    background: "linear-gradient(180deg, rgba(10, 30, 20, 0.5) 0%, rgba(30, 50, 30, 0.3) 100%)"
  },
  pinkpony: {
    name: "Pink Pony Club",
    primary: "#ec4899",
    primaryLight: "rgba(236, 72, 153, 0.3)",
    primaryDark: "rgba(236, 72, 153, 0.6)",
    gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(255, 255, 255, 0.15))",
    accent: "#ffffff", // White
    secondary: "#f472b6",
    background: "linear-gradient(180deg, rgba(50, 20, 40, 0.5) 0%, rgba(80, 30, 60, 0.3) 100%)"
  },
  odie: {
    name: "Odie",
    primary: "#f97316",
    primaryLight: "rgba(249, 115, 22, 0.3)",
    primaryDark: "rgba(249, 115, 22, 0.6)",
    gradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(212, 165, 116, 0.15))",
    accent: "#d4a574", // Sandy tan/cream
    secondary: "#fb923c",
    background: "linear-gradient(180deg, rgba(40, 25, 15, 0.5) 0%, rgba(60, 40, 25, 0.3) 100%)"
  },
  umbrael: {
    name: "Umbrael's Umbrage",
    primary: "#9333ea",
    primaryLight: "rgba(147, 51, 234, 0.3)",
    primaryDark: "rgba(147, 51, 234, 0.6)",
    gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(251, 191, 36, 0.1))",
    accent: "#fbbf24", // Gold
    secondary: "#a855f7",
    background: "linear-gradient(180deg, rgba(17, 24, 39, 0.6) 0%, rgba(30, 20, 50, 0.4) 100%)"
  },
  plainjane: {
    name: "Plain Jane",
    primary: "#6b7280",
    primaryLight: "rgba(107, 114, 128, 0.3)",
    primaryDark: "rgba(107, 114, 128, 0.6)",
    gradient: "linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(156, 163, 175, 0.1))",
    accent: "#9ca3af", // Light gray
    secondary: "#4b5563",
    background: "linear-gradient(180deg, rgba(30, 30, 35, 0.5) 0%, rgba(40, 40, 45, 0.3) 100%)"
  },
  batman: {
    name: "The Dark Knight",
    primary: "#1a1a1a",
    primaryLight: "rgba(26, 26, 26, 0.5)",
    primaryDark: "rgba(0, 0, 0, 0.8)",
    gradient: "linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(255, 204, 0, 0.05))",
    accent: "#ffcc00", // Batman yellow
    secondary: "#333333",
    background: "linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(15, 15, 8, 0.6) 100%)"
  }
};

// Custom themes storage (loaded from localStorage with validation)
let customThemes = {};
try {
  const stored = localStorage.getItem('flowpath_custom_themes');
  if (stored) {
    const parsed = JSON.parse(stored);
    // Validate structure: should be an object with theme objects as values
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Validate each theme
      for (const [key, theme] of Object.entries(parsed)) {
        if (isValidThemeObject(theme)) {
          customThemes[key] = theme;
        } else {
          console.warn(`[FlowPath] Invalid custom theme "${key}" - skipping`);
        }
      }
    }
  }
} catch (e) {
  console.warn('[FlowPath] Failed to load custom themes, resetting:', e);
  localStorage.removeItem('flowpath_custom_themes');
}

// Save custom themes to localStorage
function saveCustomThemes() {
  try {
    localStorage.setItem('flowpath_custom_themes', JSON.stringify(customThemes));
  } catch (e) {
    console.warn('[FlowPath] Failed to save custom themes:', e);
  }
}

// Get all themes (built-in + custom)
function getAllThemes() {
  return { ...THEMES, ...customThemes };
}

// Helper to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 147, g: 51, b: 234 }; // Default purple
}

// Helper to convert RGB to hex
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Helper to darken/lighten a color
function adjustColor(hex, percent) {
  const rgb = hexToRgb(hex);
  const factor = percent / 100;
  return rgbToHex(
    Math.min(255, Math.max(0, rgb.r + (rgb.r * factor))),
    Math.min(255, Math.max(0, rgb.g + (rgb.g * factor))),
    Math.min(255, Math.max(0, rgb.b + (rgb.b * factor)))
  );
}

// Helper to get contrasting text color for a background
function getContrastColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Theme Editor Modal - Side-by-side layout with dummy node preview
function openThemeEditor(existingThemeKey = null) {
  const isEditing = existingThemeKey && customThemes[existingThemeKey];
  
  // Get the theme to use as base - either the one being edited, or the current active theme
  const getAllThemesLocal = () => ({ ...THEMES, ...customThemes });
  const currentThemeKey = globalSettings.theme || 'umbrael';
  const baseTheme = isEditing 
    ? customThemes[existingThemeKey] 
    : (getAllThemesLocal()[currentThemeKey] || THEMES.umbrael);
  
  // Initialize with base theme values
  let themeName = isEditing ? baseTheme.name : 'My Custom Theme';
  let primaryColor = baseTheme.primary || '#9333ea';
  let accentColor = baseTheme.accent || '#fbbf24';
  let secondaryColor = baseTheme.secondary || '#a855f7';
  
  // Default opacity values
  let primaryLightOpacity = 0.3;
  let primaryDarkOpacity = 0.6;
  let gradientColor2 = accentColor;
  let gradientOpacity1 = 0.2;
  let gradientOpacity2 = 0.1;
  let bgColor1 = '#111827';
  let bgColor2 = '#1e1432';
  let bgOpacity1 = 0.6;
  let bgOpacity2 = 0.4;

  // Parse theme values from the base theme
  if (baseTheme) {
    // Parse primaryLight opacity
    const plMatch = baseTheme.primaryLight?.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (plMatch) primaryLightOpacity = parseFloat(plMatch[4]);
    
    // Parse primaryDark opacity
    const pdMatch = baseTheme.primaryDark?.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (pdMatch) primaryDarkOpacity = parseFloat(pdMatch[4]);
    
    // Parse gradient colors and opacities
    const gradMatch = baseTheme.gradient?.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\).*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (gradMatch) {
      gradientOpacity1 = parseFloat(gradMatch[4]);
      gradientColor2 = rgbToHex(parseInt(gradMatch[5]), parseInt(gradMatch[6]), parseInt(gradMatch[7]));
      gradientOpacity2 = parseFloat(gradMatch[8]);
    }
    
    // Parse background colors and opacities
    const bgMatch = baseTheme.background?.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\).*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (bgMatch) {
      bgColor1 = rgbToHex(parseInt(bgMatch[1]), parseInt(bgMatch[2]), parseInt(bgMatch[3]));
      bgOpacity1 = parseFloat(bgMatch[4]);
      bgColor2 = rgbToHex(parseInt(bgMatch[5]), parseInt(bgMatch[6]), parseInt(bgMatch[7]));
      bgOpacity2 = parseFloat(bgMatch[8]);
    }
  }

  // Generate preview theme
  const getPreviewTheme = () => {
    const rgb = hexToRgb(primaryColor);
    const rgb2 = hexToRgb(gradientColor2);
    const bgRgb1 = hexToRgb(bgColor1);
    const bgRgb2 = hexToRgb(bgColor2);
    return {
      name: themeName,
      primary: primaryColor,
      primaryLight: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${primaryLightOpacity})`,
      primaryDark: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${primaryDarkOpacity})`,
      gradient: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${gradientOpacity1}), rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, ${gradientOpacity2}))`,
      accent: accentColor,
      secondary: secondaryColor,
      background: `linear-gradient(180deg, rgba(${bgRgb1.r}, ${bgRgb1.g}, ${bgRgb1.b}, ${bgOpacity1}) 0%, rgba(${bgRgb2.r}, ${bgRgb2.g}, ${bgRgb2.b}, ${bgOpacity2}) 100%)`
    };
  };

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  `;

  // Main container - side by side layout
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    gap: 24px;
    max-height: 90vh;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  // LEFT SIDE: Controls panel (plain styling)
  const controlsPanel = document.createElement('div');
  controlsPanel.className = 'flowpath-theme-editor-panel';
  controlsPanel.style.cssText = `
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 12px;
    padding: 24px;
    width: 420px;
    max-height: 90vh;
    overflow-y: auto;
  `;

  // RIGHT SIDE: Dummy node preview with ComfyUI-like background
  const previewContainer = document.createElement('div');
  previewContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px;
    background: #1e1e1e;
    border-radius: 12px;
    border: 1px solid #333;
    min-width: 440px;
  `;
  
  // Label above preview
  const previewLabel = document.createElement('div');
  previewLabel.textContent = 'Live Preview';
  previewLabel.style.cssText = `
    color: #888;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
  `;
  previewContainer.appendChild(previewLabel);

  // Create dummy FlowPath node - ComfyUI style frame
  const dummyNode = document.createElement('div');
  dummyNode.style.cssText = `
    width: 380px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    background: #353535;
  `;

  // Node title bar (ComfyUI style - matches actual node chrome)
  const nodeTitleBar = document.createElement('div');
  nodeTitleBar.style.cssText = `
    background: linear-gradient(180deg, #454545 0%, #353535 100%);
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #ddd;
    border-bottom: 1px solid #2a2a2a;
    display: flex;
    align-items: center;
    gap: 6px;
  `;
  nodeTitleBar.innerHTML = '<span style="font-size: 14px;">🌊</span> FlowPath';

  // Node content area (the main container)
  const nodeContent = document.createElement('div');
  nodeContent.className = 'dummy-node-content';

  // Output preview section (at top)
  const outputPreview = document.createElement('div');
  outputPreview.className = 'dummy-output-preview';
  outputPreview.innerHTML = `
    <div class="dummy-output-header">
      <span class="dummy-output-icon">📁</span>
      <span class="dummy-output-label">Output Preview</span>
      <div class="dummy-mode-toggle">
        <span class="dummy-mode-btn dummy-mode-active">SI</span>
        <span class="dummy-mode-btn">IS</span>
      </div>
    </div>
    <div class="dummy-output-path">
      <span class="dummy-path-segment">output</span>
      <span class="dummy-path-sep">/</span>
      <span class="dummy-path-segment">Characters</span>
      <span class="dummy-path-sep">/</span>
      <span class="dummy-path-segment">Umbrael</span>
      <span class="dummy-path-sep">/</span>
      <span class="dummy-path-segment dummy-path-last">IllustriousXL</span>
    </div>
  `;

  // Segments section header with arrow
  const segmentsHeader = document.createElement('div');
  segmentsHeader.className = 'dummy-section-header';
  segmentsHeader.innerHTML = `
    <span class="dummy-arrow">▼</span>
    <span class="dummy-header-text">📋 Path Segments</span>
  `;

  // Segment rows with drag handle, toggle, icon, label
  const createSegmentRow = (icon, label) => {
    const row = document.createElement('div');
    row.className = 'dummy-segment-row';
    row.innerHTML = `
      <span class="dummy-drag-handle">⋮⋮</span>
      <span class="dummy-toggle"></span>
      <span class="dummy-segment-icon">${icon}</span>
      <span class="dummy-segment-label">${label}</span>
    `;
    return row;
  };

  const segmentRow1 = createSegmentRow('📂', 'Category');
  const segmentRow2 = createSegmentRow('✏️', 'Name');
  const segmentRow3 = createSegmentRow('🎯', 'Model');

  // Add segment dropdown (matching real styling)
  const addSegmentRow = document.createElement('div');
  addSegmentRow.className = 'dummy-add-segment';
  addSegmentRow.innerHTML = `
    <span class="dummy-add-label">Add Segment:</span>
    <span class="dummy-add-select">-- Select to add --</span>
  `;

  // Config section header (collapsed)
  const configHeader = document.createElement('div');
  configHeader.className = 'dummy-section-header';
  configHeader.innerHTML = `
    <span class="dummy-arrow">▶</span>
    <span class="dummy-header-text">⚙️ Configuration</span>
  `;

  // Presets section header (collapsed)
  const presetsHeader = document.createElement('div');
  presetsHeader.className = 'dummy-section-header';
  presetsHeader.innerHTML = `
    <span class="dummy-arrow">▶</span>
    <span class="dummy-header-text">💾 Presets</span>
  `;

  // Save Preset button
  const savePresetBtn = document.createElement('div');
  savePresetBtn.className = 'dummy-save-btn';
  savePresetBtn.innerHTML = `💾 Save Current as Preset`;

  // Filename preview section (shows secondary color usage)
  const filenameSection = document.createElement('div');
  filenameSection.className = 'dummy-filename-section';
  filenameSection.innerHTML = `
    <div class="dummy-filename-preview">
      <span class="dummy-filename-label">Preview:</span>
      <span class="dummy-filename-text">MyProject_001</span>
    </div>
    <div class="dummy-secondary-indicator">← Secondary color</div>
  `;

  // Donation banner - matches actual node exactly
  const donationBanner = document.createElement('div');
  donationBanner.className = 'dummy-banner';
  donationBanner.innerHTML = `
    <div class="dummy-banner-content">
      <span class="dummy-banner-icon">💝</span>
      <div class="dummy-banner-text">
        <strong class="dummy-banner-title">FlowPath is free & open source!</strong><br>
        <span class="dummy-banner-subtext">If you find it useful, consider </span><span class="dummy-banner-link">supporting development</span><span class="dummy-banner-subtext"> ☕</span>
      </div>
    </div>
    <span class="dummy-banner-close">×</span>
  `;

  // Assemble dummy node
  nodeContent.appendChild(outputPreview);
  nodeContent.appendChild(segmentsHeader);
  nodeContent.appendChild(segmentRow1);
  nodeContent.appendChild(segmentRow2);
  nodeContent.appendChild(segmentRow3);
  nodeContent.appendChild(addSegmentRow);
  nodeContent.appendChild(configHeader);
  nodeContent.appendChild(filenameSection);
  nodeContent.appendChild(presetsHeader);
  nodeContent.appendChild(savePresetBtn);
  nodeContent.appendChild(donationBanner);
  dummyNode.appendChild(nodeTitleBar);
  dummyNode.appendChild(nodeContent);
  previewContainer.appendChild(dummyNode);

  // Update dummy node styling to match real node exactly
  const updateDummyNode = () => {
    const t = getPreviewTheme();
    
    // Main container - uses background gradient (matches actual node)
    nodeContent.style.cssText = `
      background: ${t.background};
      padding: 10px;
      border: 1px solid ${t.primaryLight};
      border-radius: 6px;
      margin: 6px;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    // Section headers - subtle gradient background
    const headerStyle = `
      display: flex;
      align-items: center;
      padding: 8px 10px;
      background: ${t.gradient};
      border-radius: 6px;
      border: 1px solid ${t.primaryLight};
      margin-bottom: 8px;
      cursor: pointer;
    `;
    segmentsHeader.style.cssText = headerStyle;
    configHeader.style.cssText = headerStyle + 'margin-top: 10px;';
    presetsHeader.style.cssText = headerStyle;
    
    // Arrow styling - accent color
    nodeContent.querySelectorAll('.dummy-arrow').forEach(arrow => {
      arrow.style.cssText = `
        margin-right: 8px;
        font-size: 10px;
        color: ${t.accent};
      `;
    });
    
    // Header text
    nodeContent.querySelectorAll('.dummy-header-text').forEach(text => {
      text.style.cssText = `
        font-weight: 600;
        color: #fff;
        font-size: 13px;
      `;
    });
    
    // Segment rows - subtle gradient, not bright
    const segmentRowStyle = `
      display: flex;
      align-items: center;
      padding: 8px;
      margin: 3px 0;
      background: ${t.gradient};
      border-radius: 6px;
      border: 1px solid ${t.primaryLight};
    `;
    segmentRow1.style.cssText = segmentRowStyle;
    segmentRow2.style.cssText = segmentRowStyle;
    segmentRow3.style.cssText = segmentRowStyle;
    
    // Drag handles
    nodeContent.querySelectorAll('.dummy-drag-handle').forEach(handle => {
      handle.style.cssText = `
        margin-right: 8px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 16px;
      `;
    });
    
    // Toggle boxes - accent color
    nodeContent.querySelectorAll('.dummy-toggle').forEach(toggle => {
      toggle.style.cssText = `
        width: 12px;
        height: 12px;
        margin-right: 8px;
        border-radius: 3px;
        border: 2px solid ${t.accent};
        background: ${t.accent};
        flex-shrink: 0;
      `;
    });
    
    // Segment icons
    nodeContent.querySelectorAll('.dummy-segment-icon').forEach(icon => {
      icon.style.cssText = `
        margin-right: 8px;
        font-size: 16px;
      `;
    });
    
    // Segment labels
    nodeContent.querySelectorAll('.dummy-segment-label').forEach(label => {
      label.style.cssText = `
        flex: 1;
        color: #fff;
        font-size: 13px;
        font-weight: 500;
      `;
    });
    
    // Add segment row - label + select style
    addSegmentRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      margin-bottom: 8px;
    `;
    addSegmentRow.querySelector('.dummy-add-label').style.cssText = `
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      font-weight: 500;
    `;
    addSegmentRow.querySelector('.dummy-add-select').style.cssText = `
      flex: 1;
      padding: 6px 10px;
      background: #1a1a1a;
      border: 1px solid ${t.primaryLight};
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    `;
    
    // Output preview
    outputPreview.style.cssText = `
      background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.3));
      border: 1px solid ${t.primaryLight};
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 10px;
    `;
    outputPreview.querySelector('.dummy-output-header').style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    `;
    outputPreview.querySelector('.dummy-output-icon').style.cssText = `
      font-size: 16px;
    `;
    outputPreview.querySelector('.dummy-output-label').style.cssText = `
      color: ${t.accent};
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    outputPreview.querySelector('.dummy-mode-toggle').style.cssText = `
      margin-left: auto;
      display: flex;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
      padding: 2px;
      border: 1px solid rgba(255,255,255,0.1);
    `;
    outputPreview.querySelectorAll('.dummy-mode-btn').forEach((btn, i) => {
      const isActive = btn.classList.contains('dummy-mode-active');
      btn.style.cssText = `
        padding: 3px 6px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 3px;
        background: ${isActive ? t.accent : 'rgba(0,0,0,0.2)'};
        color: ${isActive ? getContrastColor(t.accent) : 'rgba(255,255,255,0.6)'};
      `;
    });
    outputPreview.querySelector('.dummy-output-path').style.cssText = `
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      padding: 10px 12px;
      background: rgba(0,0,0,0.3);
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.05);
      line-height: 1.6;
    `;
    outputPreview.querySelectorAll('.dummy-path-segment').forEach(seg => {
      seg.style.cssText = `color: #fff;`;
    });
    outputPreview.querySelector('.dummy-path-last').style.fontWeight = '600';
    outputPreview.querySelectorAll('.dummy-path-sep').forEach(sep => {
      sep.style.cssText = `color: ${t.accent}; opacity: 0.7;`;
    });
    
    // Save preset button - green gradient
    savePresetBtn.style.cssText = `
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
      border: 1px solid rgba(34, 197, 94, 0.6);
      border-radius: 6px;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
    `;
    
    // Filename section - shows secondary color usage (matches actual node)
    filenameSection.style.cssText = `
      margin-top: 8px;
      padding: 8px 10px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      border-left: 3px solid ${t.secondary};
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 11px;
    `;
    filenameSection.querySelector('.dummy-filename-preview').style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    filenameSection.querySelector('.dummy-filename-label').style.cssText = `
      color: rgba(255, 255, 255, 0.6);
      font-size: 11px;
    `;
    filenameSection.querySelector('.dummy-filename-text').style.cssText = `
      color: #fff;
      font-size: 11px;
    `;
    filenameSection.querySelector('.dummy-secondary-indicator').style.cssText = `
      color: ${t.secondary};
      font-size: 9px;
      font-family: system-ui, sans-serif;
      margin-top: 4px;
      opacity: 0.8;
    `;

    // Donation banner - matches actual node styling
    const bannerGradient = `linear-gradient(135deg, ${t.primaryLight}, ${t.primaryDark.replace(/[\d.]+\)$/, '0.25)')})`;
    donationBanner.style.cssText = `
      margin-top: 12px;
      padding: 12px;
      background: ${bannerGradient};
      border: 1px solid ${t.primary};
      border-radius: 8px;
      position: relative;
    `;
    donationBanner.querySelector('.dummy-banner-content').style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    donationBanner.querySelector('.dummy-banner-icon').style.cssText = `
      font-size: 20px;
    `;
    donationBanner.querySelector('.dummy-banner-text').style.cssText = `
      flex: 1;
      color: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      line-height: 1.4;
    `;
    donationBanner.querySelector('.dummy-banner-title').style.cssText = `
      color: ${t.accent};
    `;
    donationBanner.querySelector('.dummy-banner-subtext').style.cssText = `
      color: rgba(255, 255, 255, 0.9);
    `;
    donationBanner.querySelectorAll('.dummy-banner-subtext').forEach(el => {
      el.style.cssText = `color: rgba(255, 255, 255, 0.9);`;
    });
    donationBanner.querySelector('.dummy-banner-link').style.cssText = `
      color: ${t.accent};
      text-decoration: underline;
    `;
    donationBanner.querySelector('.dummy-banner-close').style.cssText = `
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      cursor: pointer;
    `;
    
    // Node frame border - matches ComfyUI node chrome, not the inner content
    dummyNode.style.border = `1px solid #2a2a2a`;
  };

  // Helper: create color row
  const createColorRow = (label, initialValue, onChange) => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = 'width: 120px; color: #ccc; font-size: 12px;';
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = initialValue;
    colorInput.style.cssText = 'width: 40px; height: 28px; border: 1px solid #555; border-radius: 4px; cursor: pointer; background: transparent;';
    
    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.value = initialValue;
    hexInput.style.cssText = 'width: 80px; padding: 6px; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; color: #fff; font-family: monospace; font-size: 12px;';
    
    colorInput.oninput = () => { hexInput.value = colorInput.value; onChange(colorInput.value); updateDummyNode(); };
    hexInput.oninput = () => { if (/^#[0-9a-f]{6}$/i.test(hexInput.value)) { colorInput.value = hexInput.value; onChange(hexInput.value); updateDummyNode(); }};
    
    row.appendChild(labelEl);
    row.appendChild(colorInput);
    row.appendChild(hexInput);
    return row;
  };

  // Helper: create slider row
  const createSliderRow = (label, initialValue, min, max, step, onChange) => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = 'width: 120px; color: #ccc; font-size: 12px;';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min; slider.max = max; slider.step = step; slider.value = initialValue;
    slider.style.cssText = 'flex: 1; cursor: pointer;';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = initialValue;
    valueDisplay.style.cssText = 'width: 40px; color: #999; font-size: 12px; text-align: right;';
    
    slider.oninput = () => { valueDisplay.textContent = slider.value; onChange(parseFloat(slider.value)); updateDummyNode(); };
    
    row.appendChild(labelEl);
    row.appendChild(slider);
    row.appendChild(valueDisplay);
    return row;
  };

  // Build controls panel
  const title = document.createElement('h2');
  title.textContent = isEditing ? 'Edit Theme' : 'Create Custom Theme';
  title.style.cssText = 'margin: 0 0 16px 0; color: #fff; font-size: 18px; font-weight: 600;';
  controlsPanel.appendChild(title);

  // Theme name
  const nameRow = document.createElement('div');
  nameRow.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 16px;';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Theme Name';
  nameLabel.style.cssText = 'width: 120px; color: #ccc; font-size: 12px;';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = themeName;
  nameInput.maxLength = 24; // Limit theme name length
  nameInput.placeholder = 'Max 24 characters';
  nameInput.style.cssText = 'flex: 1; padding: 8px; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; color: #fff; font-size: 13px;';
  nameInput.oninput = () => { themeName = nameInput.value; };
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  controlsPanel.appendChild(nameRow);

  // Section: Colors
  const colorsTitle = document.createElement('div');
  colorsTitle.textContent = 'Colors';
  colorsTitle.style.cssText = 'color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 10px 0; padding-top: 12px; border-top: 1px solid #333;';
  controlsPanel.appendChild(colorsTitle);

  controlsPanel.appendChild(createColorRow('Primary', primaryColor, (v) => { primaryColor = v; }));
  controlsPanel.appendChild(createColorRow('Accent', accentColor, (v) => { accentColor = v; gradientColor2 = v; }));
  controlsPanel.appendChild(createColorRow('Secondary', secondaryColor, (v) => { secondaryColor = v; }));

  // Section: Background
  const bgSection = document.createElement('div');
  bgSection.textContent = 'Background';
  bgSection.style.cssText = 'color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 10px 0; padding-top: 12px; border-top: 1px solid #333;';
  controlsPanel.appendChild(bgSection);

  controlsPanel.appendChild(createColorRow('Top Color', bgColor1, (v) => { bgColor1 = v; }));
  controlsPanel.appendChild(createColorRow('Bottom Color', bgColor2, (v) => { bgColor2 = v; }));
  controlsPanel.appendChild(createSliderRow('Top Opacity', bgOpacity1, 0.2, 1.0, 0.05, (v) => { bgOpacity1 = v; }));
  controlsPanel.appendChild(createSliderRow('Bottom Opacity', bgOpacity2, 0.1, 0.8, 0.05, (v) => { bgOpacity2 = v; }));

  // Section: Opacity
  const opacitySection = document.createElement('div');
  opacitySection.textContent = 'Element Opacity';
  opacitySection.style.cssText = 'color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 10px 0; padding-top: 12px; border-top: 1px solid #333;';
  controlsPanel.appendChild(opacitySection);

  controlsPanel.appendChild(createSliderRow('Border Light', primaryLightOpacity, 0.1, 0.8, 0.05, (v) => { primaryLightOpacity = v; }));
  controlsPanel.appendChild(createSliderRow('Border Dark', primaryDarkOpacity, 0.2, 1.0, 0.05, (v) => { primaryDarkOpacity = v; }));
  controlsPanel.appendChild(createSliderRow('Gradient Start', gradientOpacity1, 0.05, 0.5, 0.05, (v) => { gradientOpacity1 = v; }));
  controlsPanel.appendChild(createSliderRow('Gradient End', gradientOpacity2, 0.02, 0.3, 0.02, (v) => { gradientOpacity2 = v; }));

  // Buttons
  const buttonRow = document.createElement('div');
  buttonRow.style.cssText = 'display: flex; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #333;';

  if (isEditing) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.cssText = 'padding: 10px 16px; background: transparent; border: 1px solid #ef4444; border-radius: 6px; color: #ef4444; font-size: 13px; cursor: pointer; transition: all 0.2s;';
    deleteBtn.onmouseover = () => { deleteBtn.style.background = 'rgba(239,68,68,0.1)'; };
    deleteBtn.onmouseout = () => { deleteBtn.style.background = 'transparent'; };
    deleteBtn.onclick = () => {
      if (confirm(`Delete theme "${themeName}"?`)) {
        delete customThemes[existingThemeKey];
        saveCustomThemes();
        globalSettings.theme = 'umbrael';
        app.graph._nodes.filter(n => n.comfyClass === "FlowPath").forEach(n => n.genSortRender?.());
        showToast('Theme deleted', 'success');
        overlay.remove();
      }
    };
    buttonRow.appendChild(deleteBtn);
  }

  const spacer = document.createElement('div');
  spacer.style.flex = '1';
  buttonRow.appendChild(spacer);

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'padding: 10px 20px; background: transparent; border: 1px solid #555; border-radius: 6px; color: #aaa; font-size: 13px; cursor: pointer; transition: all 0.2s;';
  cancelBtn.onmouseover = () => { cancelBtn.style.borderColor = '#777'; cancelBtn.style.color = '#fff'; };
  cancelBtn.onmouseout = () => { cancelBtn.style.borderColor = '#555'; cancelBtn.style.color = '#aaa'; };
  cancelBtn.onclick = () => overlay.remove();

  const saveBtn = document.createElement('button');
  saveBtn.textContent = isEditing ? 'Update Theme' : 'Save Theme';
  saveBtn.style.cssText = 'padding: 10px 20px; background: #10b981; border: none; border-radius: 6px; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;';
  saveBtn.onmouseover = () => { saveBtn.style.background = '#059669'; };
  saveBtn.onmouseout = () => { saveBtn.style.background = '#10b981'; };
  saveBtn.onclick = () => {
    if (!themeName.trim()) {
      // Flash name input red
      nameInput.style.borderColor = '#ef4444';
      nameInput.style.background = 'rgba(239, 68, 68, 0.15)';
      setTimeout(() => {
        nameInput.style.borderColor = '#444';
        nameInput.style.background = '#1a1a1a';
      }, 300);
      return;
    }
    
    // Limit custom themes to 10
    const MAX_CUSTOM_THEMES = 10;
    const currentCount = Object.keys(customThemes).length;
    if (!isEditing && currentCount >= MAX_CUSTOM_THEMES) {
      // Flash save button red
      saveBtn.style.background = '#ef4444';
      saveBtn.textContent = 'Limit reached!';
      setTimeout(() => {
        saveBtn.style.background = '#10b981';
        saveBtn.textContent = 'Save Theme';
      }, 1000);
      return;
    }
    
    const themeKey = isEditing ? existingThemeKey : 'custom_' + Date.now();
    customThemes[themeKey] = getPreviewTheme();
    saveCustomThemes();
    globalSettings.theme = themeKey;
    app.ui.settings.setSettingValue("🌊 FlowPath.Theme", themeKey);
    app.graph._nodes.filter(n => n.comfyClass === "FlowPath").forEach(n => n.genSortRender?.());
    overlay.remove();
  };

  buttonRow.appendChild(cancelBtn);
  buttonRow.appendChild(saveBtn);
  controlsPanel.appendChild(buttonRow);

  // Assemble
  container.appendChild(controlsPanel);
  container.appendChild(previewContainer);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Initial update
  updateDummyNode();

  // Close handlers
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const escHandler = (e) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }};
  document.addEventListener('keydown', escHandler);
}

// Global settings storage
let globalSettings = {
  theme: "umbrael",
  enableScrolling: true, // Scrolling enabled by default for reliable display
  autoDetectModel: "manual", // "manual" or "auto"
  autoDetectLora: true,
  loraPathFormat: "primary", // "primary", "primaryCount", "all", "separate"
  stickyPreview: true, // Keep output preview visible at top when scrolling
   showEmojis: true, // Show emojis in section headers and UI elements
   hideDefaultPresets: false, // Hide default presets in the presets list
   showLoadingAnimation: false // Show animation when loading presets
 };

// Inject global CSS for dropdown styling (only once)
if (!document.getElementById('gensort-pro-styles')) {
  const style = document.createElement('style');
  style.id = 'gensort-pro-styles';
  style.textContent = `
    /* GenSort Pro dropdown styling */
    .gensort-pro-select {
      background: #1a1a1a !important;
      color: #fff !important;
    }
    
    .gensort-pro-select option {
      background: #1a1a1a !important;
      color: #fff !important;
      padding: 6px !important;
    }
    
    .gensort-pro-select option:hover,
    .gensort-pro-select option:checked {
      background: #2a2a2a !important;
    }
    
    /* FlowPath Theme Dropdown - base styles, colors applied inline */
    .flowpath-theme-dropdown {
      position: fixed;
      z-index: 10000;
      min-width: 180px;
      max-height: 280px;
      overflow-y: auto;
      background: rgba(20, 20, 28, 0.98);
      border-radius: 6px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      padding: 4px 0;
    }
    
    .flowpath-theme-dropdown-title {
      padding: 6px 10px;
      font-size: 9px;
      font-weight: 600;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .flowpath-theme-item {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      font-size: 11px;
      color: #fff;
      cursor: pointer;
      transition: all 0.15s;
      border-left: 3px solid transparent;
      gap: 8px;
    }
    
    .flowpath-theme-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .flowpath-theme-item.active {
      background: rgba(34, 197, 94, 0.15);
      border-left-color: #22c55e;
    }
    
    .flowpath-theme-item.active:hover {
      background: rgba(34, 197, 94, 0.25);
    }
    
    .flowpath-theme-item-swatch {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid rgba(255,255,255,0.3);
      flex-shrink: 0;
    }
    
    .flowpath-theme-item-name {
      flex: 1;
      font-weight: 500;
    }
    
    .flowpath-theme-divider {
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin: 4px 0;
    }
    
    .flowpath-theme-create {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      font-size: 11px;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      transition: all 0.15s;
      gap: 8px;
    }
    
    .flowpath-theme-create:hover {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }
  `;
  document.head.appendChild(style);
}

// Themed scrollbar styling - updates dynamically with theme changes
function updateThemedScrollbar(theme) {
  let scrollbarStyle = document.getElementById('flowpath-scrollbar-styles');
  if (!scrollbarStyle) {
    scrollbarStyle = document.createElement('style');
    scrollbarStyle.id = 'flowpath-scrollbar-styles';
    document.head.appendChild(scrollbarStyle);
  }
  
  // Extract colors from theme
  const primary = theme.primary || '#9333ea';
  const primaryLight = theme.primaryLight || 'rgba(147, 51, 234, 0.3)';
  const primaryDark = theme.primaryDark || 'rgba(147, 51, 234, 0.6)';
  const accent = theme.accent || '#fbbf24';
  
  scrollbarStyle.textContent = `
    /* FlowPath themed scrollbar */
    .gensort-pro-container::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }
    
    .gensort-pro-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      margin: 2px;
    }
    
    .gensort-pro-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.18);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: background 0.2s;
    }
    
    .gensort-pro-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.28);
    }
    
    .gensort-pro-container::-webkit-scrollbar-thumb:active {
      background: rgba(255, 255, 255, 0.35);
    }
    
    .gensort-pro-container::-webkit-scrollbar-corner {
      background: transparent;
    }
    
    /* Firefox scrollbar */
    .gensort-pro-container {
      scrollbar-width: auto;
      scrollbar-color: rgba(255, 255, 255, 0.18) rgba(255, 255, 255, 0.03);
    }
    
    /* Theme editor scrollbar */
    .flowpath-theme-editor-panel::-webkit-scrollbar {
      width: 12px;
    }
    
    .flowpath-theme-editor-panel::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
    }
    
    .flowpath-theme-editor-panel::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.18);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .flowpath-theme-editor-panel::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.28);
    }
  `;
}


// Toast notification system
function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  
  const colors = {
    success: { bg: "rgba(16, 185, 129, 0.95)", border: "#10b981", icon: "✅" },
    error: { bg: "rgba(239, 68, 68, 0.95)", border: "#ef4444", icon: "❌" },
    warning: { bg: "rgba(245, 158, 11, 0.95)", border: "#f59e0b", icon: "⚠️" },
    info: { bg: "rgba(66, 153, 225, 0.95)", border: "#4299e1", icon: "ℹ️" }
  };
  
  const style = colors[type] || colors.info;
  
  // Security: escape user-controlled content to prevent XSS
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px;">${style.icon}</span>
      <span style="flex: 1;">${escapeHtml(message)}</span>
    </div>
  `;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${style.bg};
    color: #fff;
    padding: 14px 18px;
    border-radius: 8px;
    border-left: 4px solid ${style.border};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    z-index: 10000;
    min-width: 280px;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in ${duration - 300}ms;
    pointer-events: auto;
    cursor: pointer;
  `;
  
  // Add animations
  if (!document.getElementById('gensort-toast-animations')) {
    const animStyle = document.createElement('style');
    animStyle.id = 'gensort-toast-animations';
    animStyle.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(animStyle);
  }
  
  // Click to dismiss
  toast.onclick = () => {
    toast.style.animation = 'fadeOut 0.2s ease-out';
    setTimeout(() => toast.remove(), 200);
  };
  
  document.body.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, duration);
}

// Detection helper functions (defined outside extension for accessibility)

/**
 * Recursively collect all nodes from a graph, including nodes inside subgraphs/group nodes.
 * This enables auto-detection to work with workflows that use Group Nodes.
 * @param {Object} graph - The LiteGraph graph object
 * @returns {Array} - Flat array of all nodes including nested ones
 */
function getAllNodesIncludingSubgraphs(graph) {
  if (!graph || !graph._nodes) {
    return [];
  }
  
  const allNodes = [];
  const visitedNodes = new Set();  // Prevent infinite recursion from circular references
  const visitedGraphs = new Set(); // Track visited graphs to avoid cycles
  
  function collectNodes(nodes, currentGraph) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    for (const node of nodes) {
      // Skip if we've already visited this node (cycle detection)
      if (!node || visitedNodes.has(node)) continue;
      visitedNodes.add(node);
      
      allNodes.push(node);
      
      // Check for subgraph/group node patterns used by ComfyUI
      // Pattern 1: node.subgraph (some group node implementations)
      if (node.subgraph && node.subgraph._nodes && !visitedGraphs.has(node.subgraph)) {
        visitedGraphs.add(node.subgraph);
        collectNodes(node.subgraph._nodes, node.subgraph);
      }
      
      // Pattern 2: node.getInnerNodes() method (ComfyUI group nodes / subgraphs)
      if (typeof node.getInnerNodes === 'function') {
        try {
          const innerNodes = node.getInnerNodes();
          if (Array.isArray(innerNodes) && innerNodes.length > 0) {
            collectNodes(innerNodes, currentGraph);
          }
        } catch (e) {
          // Silently ignore if method fails
        }
      }
      
      // Pattern 3: ComfyUI's GroupNode with inner_nodes array
      if (node.inner_nodes && Array.isArray(node.inner_nodes)) {
        collectNodes(node.inner_nodes, currentGraph);
      }
      
      // Pattern 4: Check for serialized group node data (workflow/ prefixed nodes)
      if (node.type && node.type.startsWith("workflow/")) {
        // Try getNonRecursiveInnerNodes first (safer, no recursion into nested groups)
        if (typeof node.getNonRecursiveInnerNodes === 'function') {
          try {
            const innerNodes = node.getNonRecursiveInnerNodes();
            if (Array.isArray(innerNodes) && innerNodes.length > 0) {
              collectNodes(innerNodes, currentGraph);
            }
          } catch (e) {
            // Silently ignore
          }
        }
      }
      
      // Note: We deliberately skip node.graph to avoid circular references back to parent
    }
  }
  
  visitedGraphs.add(graph);
  collectNodes(graph._nodes, graph);
  return allNodes;
}

function detectModelFromWorkflow(graph) {
  
  if (!graph || !graph._nodes) {
    console.warn("[FlowPath] No graph available for model detection");
    return null;
  }

  // Node types that contain checkpoint/model information
  const checkpointNodeTypes = [
    "CheckpointLoaderSimple",
    "CheckpointLoader", 
    "UNETLoader",
    "CheckpointLoaderNF4",
    "Checkpoint Loader with Name (Image Saver)"  // comfy-image-saver custom node
  ];

  const foundModels = [];
  
  // Get all nodes including those inside subgraphs/group nodes
  const allNodes = getAllNodesIncludingSubgraphs(graph);

  // Search for all checkpoint nodes
  for (const node of allNodes) {
    if (checkpointNodeTypes.includes(node.type) || checkpointNodeTypes.includes(node.comfyClass)) {
      // Find the widget that contains the model name
      const ckptWidget = node.widgets?.find(w => 
        w.name === "ckpt_name" || w.name === "unet_name" || w.name === "model_name"
      );
      
      if (ckptWidget && ckptWidget.value) {
        let modelName = ckptWidget.value;
        
        // Clean up the model name
        // Remove file extension
        modelName = modelName.replace(/\.(safetensors|ckpt|pt|bin)$/i, "");
        // Remove path separators
        modelName = modelName.split(/[\/\\]/).pop();
        
        foundModels.push(modelName);
      }
    }
  }

  if (foundModels.length === 0) {
    return null;
  }

  
  // Return first model, but include count for notification
  return {
    model: foundModels[0],
    total: foundModels.length,
    allModels: foundModels
  };
}

function detectSeedFromWorkflow(graph) {
  
  if (!graph || !graph._nodes) {
    console.warn("[FlowPath] No graph available for seed detection");
    return null;
  }

  // Node types that contain seed information
  const samplerNodeTypes = [
    "KSampler",
    "KSamplerAdvanced",
    "SamplerCustom",
    "KSampler (Efficient)",
    "SamplerCustomAdvanced"
  ];
  
  // Noise generator nodes (for SamplerCustomAdvanced workflows)
  const noiseGeneratorTypes = [
    "RandomNoise",
    "DisableNoise"
  ];
  
  // Get all nodes including those inside subgraphs/group nodes
  const allNodes = getAllNodesIncludingSubgraphs(graph);

  // First, check for noise generator nodes (higher priority for SamplerCustomAdvanced workflows)
  for (const node of allNodes) {
    const nodeType = node.type || node.comfyClass || '';
    if (noiseGeneratorTypes.some(type => nodeType.includes(type) || type.includes(nodeType))) {
      // Find the widget that contains the noise_seed
      const seedWidget = node.widgets?.find(w => w.name === "noise_seed");
      
      if (seedWidget && seedWidget.value !== undefined && seedWidget.value !== null) {
        const seed = String(seedWidget.value);
        return seed;
      }
    }
  }

  // Search for sampler nodes (fallback)
  for (const node of allNodes) {
    const nodeType = node.type || node.comfyClass || '';
    if (samplerNodeTypes.some(type => nodeType.includes(type) || type.includes(nodeType))) {
      // Find the widget that contains the seed
      const seedWidget = node.widgets?.find(w => w.name === "seed");
      
      if (seedWidget && seedWidget.value !== undefined && seedWidget.value !== null) {
        const seed = String(seedWidget.value);
        return seed;
      }
    }
  }

  return null;
}

function detectLorasFromWorkflow(graph) {
  
  if (!graph || !graph._nodes) {
    console.warn("[FlowPath] No graph available for LoRA detection");
    return [];
  }

  const loraNames = [];

  // NOTE: GenSort Pro does NOT require LoRA Manager to be installed.
  // It works with standard LoRA Loader nodes out of the box.
  // This code adds OPTIONAL support for LoRA Manager IF it's installed.
  
  // LoRA Manager pattern: <lora:name:strength> or <lora:name:strength:clip>
  const LORA_PATTERN = /<lora:([^:>]+):([-\d\.]+)(?::([-\d\.]+))?>/g;
  
  // Get all nodes including those inside subgraphs/group nodes
  const allNodes = getAllNodesIncludingSubgraphs(graph);

  // Search for all nodes in the workflow
  for (const node of allNodes) {
    
    // Handle Lora Manager nodes specially
    if (node.type === "Lora Loader (LoraManager)" || 
        node.comfyClass === "Lora Loader (LoraManager)" ||
        node.type === "lora") {  // LoRA Manager may also appear as lowercase "lora"
      
      // LoRA Manager stores structured data in lorasWidget
      const lorasWidget = node.lorasWidget;
      
      if (lorasWidget && lorasWidget.value && Array.isArray(lorasWidget.value)) {
        const lorasData = lorasWidget.value;
        
        // Only extract LoRAs that are active (checked)
        lorasData.forEach(lora => {
          if (lora && lora.name && lora.active) {
            const loraName = lora.name;
            if (!loraNames.includes(loraName)) {
              loraNames.push(loraName);
            }
          } else if (lora && lora.name && !lora.active) {
          }
        });
      } else {
        // Fallback: parse from inputWidget text if lorasWidget not available
        const inputWidget = node.inputWidget || node.widgets?.find(w => w.name === "loras");
        
        if (inputWidget && inputWidget.value) {
          const loraText = inputWidget.value;
          
          // Parse LoRA syntax: <lora:name:strength>
          LORA_PATTERN.lastIndex = 0; // Reset regex
          let match;
          while ((match = LORA_PATTERN.exec(loraText)) !== null) {
            const loraName = match[1]; // First capture group is the name
            if (loraName && !loraNames.includes(loraName)) {
              loraNames.push(loraName);
            }
          }
        }
      }
      continue; // Skip standard widget processing for LoRA Manager
    }
    
    // Handle standard LoRA Loader nodes
    const standardLoraTypes = [
      "LoraLoader",
      "LoraLoaderModelOnly",
      "LoRA Stacker",
      "Power Lora Loader (rgthree)"
    ];
    
    if (standardLoraTypes.some(type => node.type.includes(type) || type.includes(node.type))) {
      
      // Find the widget that contains the LoRA name
      const loraWidget = node.widgets?.find(w => 
        w.name === "lora_name" || w.name === "lora" || w.name.toLowerCase().includes("lora")
      );
      
      if (loraWidget) {
      }
      
      if (loraWidget && loraWidget.value && loraWidget.value !== "None") {
        let loraValue = loraWidget.value;
        
        // Handle different value types
        let loraName;
        if (typeof loraValue === 'string') {
          loraName = loraValue;
        } else if (Array.isArray(loraValue)) {
          // Some LoRA nodes use arrays
          loraName = loraValue[0];
        } else if (typeof loraValue === 'object' && loraValue.content) {
          // Some nodes use object with content property
          loraName = loraValue.content;
        } else {
          // Try to convert to string
          console.warn("[FlowPath] Unexpected LoRA value type:", typeof loraValue, loraValue);
          loraName = String(loraValue);
        }
        
        // Ensure we have a valid string
        if (!loraName || typeof loraName !== 'string') {
          continue;
        }
        
        // Clean up the LoRA name
        // Remove file extension
        loraName = loraName.replace(/\.(safetensors|ckpt|pt|bin)$/i, "");
        // Remove path separators
        loraName = loraName.split(/[\/\\]/).pop();
        
        // Only add if not already in the list and not empty
        if (loraName && !loraNames.includes(loraName)) {
          loraNames.push(loraName);
        }
      }
    }
    
    // Handle embedded LoRA syntax in text/prompt nodes
    // Supports: <lora:name:weight> pattern in prompts
    const textNodeTypes = [
      "ImpactWildcardEncode",
      "CLIPTextEncode", 
      "BNK_CLIPTextEncodeAdvanced",
      "CLIPTextEncodeSDXL",
      "CLIPTextEncodeSDXLRefiner",
      "String Literal",
      "Text Multiline",
      "ShowText"
    ];
    
    if (textNodeTypes.some(type => node.type === type || node.type.includes("TextEncode") || node.type.includes("Wildcard"))) {
      
      // Check all widgets for text content
      if (node.widgets) {
        for (const widget of node.widgets) {
          if (widget.value && typeof widget.value === 'string' && widget.value.includes('<lora:')) {
            
            // Parse LoRA syntax: <lora:name:strength>
            LORA_PATTERN.lastIndex = 0; // Reset regex
            let match;
            while ((match = LORA_PATTERN.exec(widget.value)) !== null) {
              const loraName = match[1]; // First capture group is the name
              if (loraName && !loraNames.includes(loraName)) {
                loraNames.push(loraName);
              }
            }
          }
        }
      }
    }
  }

  return loraNames;
}

function formatLoraPath(loraArray, mode) {
  if (!loraArray || loraArray.length === 0) {
    return "";
  }

  switch (mode) {
    case "primary":
      // Just the first LoRA
      return loraArray[0];
      
    case "primaryCount":
      // First LoRA + count of additional
      if (loraArray.length === 1) {
        return loraArray[0];
      }
      return `${loraArray[0]}_+${loraArray.length - 1}more`;
      
    case "all":
      // All LoRAs comma-separated
      return loraArray.join(",");
      
    case "separate":
      // Return as array for separate folder handling
      return loraArray;
      
    default:
      return loraArray[0];
  }
}

function detectResolutionFromWorkflow(graph) {
  
  if (!graph || !graph._nodes) {
    console.warn("[FlowPath] No graph available for resolution detection");
    return null;
  }

  // Node types that contain resolution/dimension information
  const latentNodeTypes = [
    "EmptyLatentImage",
    "LatentUpscale",
    "LatentUpscaleBy"
  ];

  const foundResolutions = [];
  
  // Get all nodes including those inside subgraphs/group nodes
  const allNodes = getAllNodesIncludingSubgraphs(graph);

  // Search for all latent image nodes
  for (const node of allNodes) {
    if (latentNodeTypes.some(type => node.type === type || node.comfyClass === type)) {
      
      // Try to find width and height widgets
      const widthWidget = node.widgets?.find(w => w.name === "width");
      const heightWidget = node.widgets?.find(w => w.name === "height");
      
      if (widthWidget && heightWidget) {
        const width = widthWidget.value;
        const height = heightWidget.value;
        const resolution = `${width}x${height}`;
        foundResolutions.push({ resolution, nodeType: node.type });
      }
    }
  }

  if (foundResolutions.length === 0) {
    return null;
  }

  
  // Return first resolution, but include count for notification
  return {
    resolution: foundResolutions[0].resolution,
    total: foundResolutions.length,
    allResolutions: foundResolutions
  };
}

app.registerExtension({
  name: "FlowPath.BuilderWidget",

  async setup() {
    // Build theme options dynamically (built-in + custom)
    const getThemeOptions = () => {
      const options = [
        { value: "ocean", text: "🌊 Ocean Blue" },
        { value: "forest", text: "🌲 Forest Green" },
        { value: "pinkpony", text: "🎠 Pink Pony Club" },
        { value: "odie", text: "🧡 Odie" },
        { value: "umbrael", text: "💜 Umbrael's Umbrage" },
        { value: "plainjane", text: "⚪ Plain Jane" },
        { value: "batman", text: "🦇 The Dark Knight" }
      ];
      
      // Add custom themes
      const customKeys = Object.keys(customThemes);
      if (customKeys.length > 0) {
        options.push({ value: "_divider", text: "─── Custom Themes ───", disabled: true });
        customKeys.forEach(key => {
          options.push({ value: key, text: "✨ " + customThemes[key].name });
        });
      }
      
      return options;
    };

    // Add theme setting to ComfyUI's settings menu
    // To create/edit themes, right-click the FlowPath node
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.Theme",
      name: "Theme",
      type: "combo",
      tooltip: "Choose a color theme for the FlowPath node. Right-click the node to create or edit custom themes.",
      options: getThemeOptions(),
      defaultValue: "umbrael",
      onChange: (value) => {
        // Ignore divider selection
        if (value === "_divider") return;
        
        globalSettings.theme = value;
        
        // Trigger re-render of all FlowPath nodes
        const nodes = app.graph._nodes.filter(n => n.comfyClass === "FlowPath");
        nodes.forEach(node => {
          if (node.genSortRender) {
            node.genSortRender();
          }
        });
      }
    });

    // Scrolling is always enabled for reliable display - no setting needed

    // Add auto-detect model setting
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.Auto-Detect Model",
      name: "Auto-Detect Model",
      type: "combo",
      tooltip: "Choose when to auto-detect the model from your workflow. 'Manual' requires clicking the detect button.",
      options: [
        { value: "manual", text: "Manual Button Only" },
        { value: "auto", text: "On Workflow Load" }
      ],
      defaultValue: "manual",
      onChange: (value) => {
        globalSettings.autoDetectModel = value;
      }
    });

    // Add auto-detect LoRA setting
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.Auto-Detect LoRAs",
      name: "Auto-Detect LoRAs",
      type: "boolean",
      tooltip: "Automatically detect LoRAs from your workflow including LoRA Manager support. Respects active/inactive state.",
      defaultValue: true,
      onChange: (value) => {
        globalSettings.autoDetectLora = value;
      }
    });

    // Add LoRA path format setting
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.LoRA Path Format",
      name: "LoRA Path Format",
      type: "combo",
      tooltip: "Primary Only: Uses first LoRA name | Primary + Count: Adds total count (e.g., LoraName_3) | All: Lists all LoRAs comma-separated | Separate: Creates individual folders per LoRA",
      options: [
        { value: "primary", text: "Primary Only (Recommended)" },
        { value: "primaryCount", text: "Primary + Count" },
        { value: "all", text: "All (Comma-Separated)" },
        { value: "separate", text: "Separate Folders" }
      ],
      defaultValue: "primary",
      onChange: (value) => {
        globalSettings.loraPathFormat = value;
        
        // Update all nodes
        const nodes = app.graph._nodes.filter(n => n.comfyClass === "FlowPath");
        nodes.forEach(node => {
          if (node.genSortRender) {
            node.genSortRender();
          }
        });
      }
    });

    // Add sticky preview setting
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.Sticky Output Preview",
      name: "Sticky Output Preview",
      type: "boolean",
      tooltip: "Keep the output preview visible at the top of the node when scrolling through segments, config, and presets.",
      defaultValue: true,
      onChange: (value) => {
        globalSettings.stickyPreview = value;
        
        // Update all nodes
        const nodes = app.graph._nodes.filter(n => n.comfyClass === "FlowPath");
        nodes.forEach(node => {
          if (node.genSortRender) {
            node.genSortRender();
          }
        });
      }
    });

    // Add show emojis setting
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.Show Emojis",
      name: "Show Emojis",
      type: "boolean",
      tooltip: "Show emojis in section headers and UI elements. Disable for a cleaner, text-only look.",
      defaultValue: true,
      onChange: (value) => {
        globalSettings.showEmojis = value;
        
        // Update all nodes
        const nodes = app.graph._nodes.filter(n => n.comfyClass === "FlowPath");
        nodes.forEach(node => {
          if (node.genSortRender) {
            node.genSortRender();
          }
        });
      }
    });

    // Add hide default presets setting
     app.ui.settings.addSetting({
       id: "🌊 FlowPath.Hide Default Presets",
       name: "Hide Default Presets",
       type: "boolean",
       tooltip: "Hide the default presets section in the Presets list. Only your custom presets will be shown.",
       defaultValue: false,
       onChange: (value) => {
         globalSettings.hideDefaultPresets = value;
         
         // Update all nodes
         const nodes = app.graph._nodes.filter(n => n.comfyClass === "FlowPath");
         nodes.forEach(node => {
           if (node.genSortRender) {
             node.genSortRender();
           }
         });
       }
     });

     // Add show loading animation setting
      app.ui.settings.addSetting({
        id: "🌊 FlowPath.Preset Loading Animation",
        name: "Preset Loading Animation",
        type: "boolean",
        tooltip: "Show a visual animation when loading presets. When disabled, a toast notification is shown instead.",
        defaultValue: false,
        onChange: (value) => {
          globalSettings.showLoadingAnimation = value;
        }
      });

     // Load saved settings
    const savedTheme = app.ui.settings.getSettingValue("🌊 FlowPath.Theme", "umbrael");
      const savedAutoDetectModel = app.ui.settings.getSettingValue("🌊 FlowPath.Auto-Detect Model", "manual");
      const savedAutoDetectLora = app.ui.settings.getSettingValue("🌊 FlowPath.Auto-Detect LoRAs", true);
      const savedLoraPathFormat = app.ui.settings.getSettingValue("🌊 FlowPath.LoRA Path Format", "primary");
      const savedStickyPreview = app.ui.settings.getSettingValue("🌊 FlowPath.Sticky Output Preview", true);
      const savedShowEmojis = app.ui.settings.getSettingValue("🌊 FlowPath.Show Emojis", true);
      const savedHideDefaultPresets = app.ui.settings.getSettingValue("🌊 FlowPath.Hide Default Presets", false);
       const savedShowLoadingAnimation = app.ui.settings.getSettingValue("🌊 FlowPath.Preset Loading Animation", false);
     
     globalSettings.theme = savedTheme;
     globalSettings.autoDetectModel = savedAutoDetectModel;
     globalSettings.autoDetectLora = savedAutoDetectLora;
     globalSettings.loraPathFormat = savedLoraPathFormat;
     globalSettings.stickyPreview = savedStickyPreview;
     globalSettings.showEmojis = savedShowEmojis;
     globalSettings.hideDefaultPresets = savedHideDefaultPresets;
     globalSettings.showLoadingAnimation = savedShowLoadingAnimation;
  },

  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeType.comfyClass === "FlowPath") {
      // Add right-click context menu option for theme editor
      chainCallback(nodeType.prototype, "getExtraMenuOptions", function(_, options) {
        const currentThemeKey = globalSettings.theme || 'umbrael';
        const isCustomTheme = currentThemeKey.startsWith('custom_');
        
        options.unshift(
          {
            content: isCustomTheme ? "🎨 Edit Current Theme" : "🎨 Create Custom Theme",
            callback: () => {
              if (isCustomTheme) {
                openThemeEditor(currentThemeKey);
              } else {
                openThemeEditor();
              }
            }
          },
          null // Separator
        );
      });

      chainCallback(nodeType.prototype, "onNodeCreated", function () {

        const node = this;
        node.serialize_widgets = true;

        // Find the widget_data widget
        const dataWidget = node.widgets.find(w => w.name === "widget_data");
        if (!dataWidget) {
          console.error("[FlowPath] widget_data not found!");
          return;
        }

        // AGGRESSIVELY HIDE the JSON widget
        dataWidget.type = "converted-widget";
        dataWidget.hidden = true;
        dataWidget.computeSize = () => [0, -4];
        dataWidget.draw = function() {};
        if (dataWidget.element) {
          dataWidget.element.style.display = "none";
        }

        // Create main container
        const container = document.createElement("div");
        container.className = "gensort-pro-container";
        container.tabIndex = 0; // Make focusable

        // Helper function to conditionally show emoji based on setting
        const emoji = (emojiChar) => globalSettings.showEmojis ? emojiChar : '';
        const emojiWithSpace = (emojiChar) => globalSettings.showEmojis ? `${emojiChar} ` : '';
        
        // Available segment types
        const SEGMENT_TYPES = {
          label: { icon: "🏷️", label: "Output Label", configKey: "node_label", tooltip: "Label for this output - useful when using multiple FlowPath nodes (e.g., Main, Upscaled, Depth)" },
          file_type: { icon: "📁", label: "File Type", configKey: "file_type", tooltip: "Organize by output type: Image, Video, Audio, 3D Model, etc." },
          project: { icon: "📦", label: "Project", configKey: "project_name", tooltip: "Group images by project name" },
          category: { icon: "📂", label: "Category", configKey: "category", tooltip: "Organize by image type: Characters, Concepts, Locations, Objects, etc." },
          name: { icon: "✏️", label: "Name", configKey: "name", tooltip: "Specific name or subject for the image" },
          content_rating: { icon: "🔒", label: "Content Rating", configKey: "content_rating", tooltip: "Mark images as SFW or NSFW for safe organization" },
          date: { icon: "📅", label: "Date", configKey: "date_format", tooltip: "Add timestamp to organize chronologically (uses Python strftime format)" },
          series: { icon: "📚", label: "Series", configKey: "series_name", tooltip: "Group related images into a series" },
          resolution: { icon: "🖼️", label: "Resolution", configKey: "resolution", tooltip: "Include image dimensions. Auto-detects from EmptyLatentImage" },
          model: { icon: "🤖", label: "Model", configKey: "model_name", tooltip: "Checkpoint model used for generation. Auto-detects from workflow" },
          seed: { icon: "🎲", label: "Seed (Auto)", configKey: "seed", tooltip: "Automatically captures the seed value from KSampler at generation time" },
          lora: { icon: "🎨", label: "LoRA", configKey: "lora_name", tooltip: "LoRA models used in generation. Auto-detects from workflow (supports LoRA Manager)" },
          custom: { icon: "✨", label: "Custom", configKey: null, tooltip: "Custom path segment with template variables: {label}, {model}, {category}, {date}, {lora}, {resolution}, {filetype}, etc." }
        };
        
        // Helper to get segment icon (respects emoji setting)
        const getSegmentIcon = (type) => {
          const seg = SEGMENT_TYPES[type];
          return seg && globalSettings.showEmojis ? seg.icon : '';
        };

        // Category-specific name placeholder examples
        const categoryNameExamples = {
          "Characters": "Example: Umbrael",
          "Concepts": "Example: Magic",
          "Locations": "Example: Whiterun",
          "Objects": "Example: Ebony Blade",
          "Other": "Example: Experiment"
        };

        // New nodes start blank - users can load a preset or add segments manually
        const defaultSegments = [];

        // Parse current value
        let currentData = {};
        try {
          currentData = JSON.parse(dataWidget.value || "{}");
        } catch (e) {
          console.warn("[FlowPath] Failed to parse widget_data:", e);
        }

        let segments = currentData.segments || defaultSegments;
        
        // Default config - used for new nodes and as fallback for missing fields
        const defaultConfig = {
          node_label: "", // Label to identify this FlowPath node when using multiple
          file_type: "Image",
          category: "Characters",
          name: "",
          content_rating: "SFW", // Changed from is_nsfw boolean to dropdown
          date_format: "%Y-%m-%d",
          project_name: "",
          series_name: "",
          resolution: "", // Empty by default - can be auto-detected
          model_name: "",
          lora_name: "",
          filename_template: "", // Filename pattern - supports FlowPath vars {name} and Image Saver vars %seed
          output_mode: "saveImage" // "saveImage" = path only, "imageSaver" = path + filename
          // seed is NOT stored in config - always detected dynamically from KSampler
        };
        
        // Merge loaded config with defaults to ensure all fields exist (backward compatibility)
        let config = { ...defaultConfig, ...(currentData.config || {}) };
        
        // Default presets for common use cases
          const defaultPresets = {
            "Blank": {
               segments: [],
               config: {
                 file_type: "Image",
                 category: "Characters",
                 name: "",
                 content_rating: "SFW",
                 date_format: "%Y-%m-%d",
                 project_name: "",
                 series_name: "",
                 resolution: "",
                 model_name: "",
                 lora_name: "",
                 filename_template: ""
                 // Note: output_mode intentionally omitted to preserve current mode
               }
             },
           "Simple Daily": {
            segments: [
              { type: "file_type", enabled: true },
              { type: "category", enabled: true },
              { type: "name", enabled: true },
              { type: "date", enabled: true }
            ],
            config: {
              file_type: "Image",
              category: "Characters",
              content_rating: "SFW",
              date_format: "%Y-%m-%d"
            }
          },
          "Character Work": {
            segments: [
              { type: "file_type", enabled: true },
              { type: "category", enabled: true },
              { type: "name", enabled: true },
              { type: "content_rating", enabled: true },
              { type: "date", enabled: true }
            ],
            config: {
              file_type: "Image",
              category: "Characters",
              name: "",
              content_rating: "SFW",
              date_format: "%Y-%m-%d"
            }
          },
          "Project Organized": {
            segments: [
              { type: "file_type", enabled: true },
              { type: "project", enabled: true },
              { type: "category", enabled: true },
              { type: "name", enabled: true },
              { type: "date", enabled: true }
            ],
            config: {
              file_type: "Image",
              project_name: "",
              category: "Characters",
              name: "",
              date_format: "%Y-%m-%d"
            }
          },
          "Complete Metadata": {
            segments: [
              { type: "file_type", enabled: true },
              { type: "category", enabled: true },
              { type: "name", enabled: true },
              { type: "date", enabled: true },
              { type: "content_rating", enabled: true },
              { type: "model", enabled: true },
              { type: "lora", enabled: true },
              { type: "seed", enabled: true }
            ],
            config: {
              file_type: "Image",
              category: "Characters",
              name: "",
              content_rating: "SFW",
              date_format: "%Y-%m-%d",
              model_name: "",
              lora_name: ""
            }
          }
        };
        
        // Load global presets from localStorage (persists across all workflows)
        const GLOBAL_PRESETS_KEY = "flowpath_global_presets";
        
        const loadGlobalPresets = () => {
          try {
            const stored = localStorage.getItem(GLOBAL_PRESETS_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              // Security: Validate structure - should be an object with preset objects as values
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const validated = {};
                for (const [key, preset] of Object.entries(parsed)) {
                  // Validate each preset has expected structure
                  if (isValidPresetObject(preset)) {
                    validated[key] = preset;
                  } else {
                    console.warn(`[FlowPath] Invalid preset "${key}" - skipping`);
                  }
                }
                return validated;
              }
            }
          } catch (e) {
            console.warn("[FlowPath] Failed to load global presets from localStorage, resetting:", e);
            localStorage.removeItem(GLOBAL_PRESETS_KEY);
          }
          return {};
        };
        
        const saveGlobalPresets = (globalPresets) => {
          try {
            localStorage.setItem(GLOBAL_PRESETS_KEY, JSON.stringify(globalPresets));
          } catch (e) {
            console.warn("[FlowPath] Failed to save global presets to localStorage:", e);
          }
        };
        
        // Load global presets
        const globalPresets = loadGlobalPresets();
        
        // Merge: default presets < global presets < workflow presets (workflow has highest priority)
        let presets = { ...defaultPresets, ...globalPresets, ...(currentData.presets || {}) };
        
        // Track currently active/loaded preset for visual highlighting
        let activePresetName = currentData.activePresetName || null;

        // MIGRATION: Convert old is_nsfw boolean to new content_rating dropdown
        if (config.hasOwnProperty('is_nsfw')) {
          const oldNsfw = config.is_nsfw;
          if (oldNsfw === true) {
            config.content_rating = "NSFW";
          } else if (oldNsfw === false) {
            config.content_rating = "SFW";
          }
          delete config.is_nsfw; // Remove old property
        }
        
        // Ensure file_type exists (for old workflows)
        if (!config.file_type) {
          config.file_type = "Image";
        }
        
        // Ensure content_rating exists and is valid (for old workflows)
        if (!config.content_rating || config.content_rating === "None") {
          config.content_rating = "SFW";
        }

        // Auto-detection on node creation/workflow load
        const runAutoDetection = () => {
          try {

            // Auto-detect model if setting is "auto" and model_name is empty
            if (globalSettings.autoDetectModel === "auto" && !config.model_name) {
              const detectedModel = detectModelFromWorkflow(app.graph);
              if (detectedModel) {
                config.model_name = detectedModel;
              }
            }

            // Auto-detect LoRAs if setting is enabled and lora_name is empty
            if (globalSettings.autoDetectLora && !config.lora_name) {
              const detectedLoras = detectLorasFromWorkflow(app.graph);
              if (detectedLoras && detectedLoras.length > 0) {
                const formatted = formatLoraPath(detectedLoras, globalSettings.loraPathFormat);
                
                // Handle separate folders mode (returns array)
                if (Array.isArray(formatted)) {
                  // For separate mode, join with special delimiter that backend can split
                  config.lora_name = formatted.join(" | ");
                } else {
                  config.lora_name = formatted;
                }
              }
            }
            
            // NOTE: Seed is NOT auto-detected on load - it's detected dynamically
            // at execution time by the Python backend for maximum accuracy
          } catch (error) {
            console.error("[FlowPath] Auto-detection on load failed:", error);
            console.error("[FlowPath] Error stack:", error.stack);
          }
        };

        // Run auto-detection after a short delay to ensure graph is loaded
        setTimeout(() => {
          runAutoDetection();
        }, 500);

        // UI state
        let draggedIndex = null;
        let segmentsContentEl = null;
        let configExpanded = true;
        let segmentsExpanded = true;
        let filenameExpanded = false;  // Filename section collapsed by default (for Image Saver users)
        let presetsExpanded = false;
        let defaultPresetsExpanded = true;  // Sub-accordion for default presets
        let customPresetsExpanded = true;   // Sub-accordion for custom presets

        // Track drop indicator state at document level for smooth UX
        let docDropTarget = null;
        let docDropPosition = null;
        
        // Store references to config input elements for click-to-focus from segment rows
        let configInputElements = {};
        

        
        const updateDropIndicator = (clientY) => {
          if (draggedIndex === null || !segmentsContentEl) return;
          
          const rowElements = Array.from(segmentsContentEl.querySelectorAll('[data-index]'));
          if (rowElements.length === 0) return;
          
          // Get the bounds of the segments area
          const firstRow = rowElements[0];
          const lastRow = rowElements[rowElements.length - 1];
          const firstRect = firstRow.getBoundingClientRect();
          const lastRect = lastRow.getBoundingClientRect();
          
          let targetRow = null;
          let position = null;
          let insertIndex = null;
          
          // If cursor is above all rows, insert at top
          if (clientY <= firstRect.top + firstRect.height / 2) {
            targetRow = firstRow;
            position = 'before';
            insertIndex = 0;
          }
          // If cursor is below all rows, insert at bottom
          else if (clientY >= lastRect.top + lastRect.height / 2) {
            targetRow = lastRow;
            position = 'after';
            insertIndex = rowElements.length;
          }
          // Otherwise find the right position between rows
          else {
            for (let i = 0; i < rowElements.length; i++) {
              const rowEl = rowElements[i];
              const idx = parseInt(rowEl.dataset.index, 10);
              if (Number.isNaN(idx)) continue;
              
              const rect = rowEl.getBoundingClientRect();
              const midpoint = rect.top + rect.height / 2;
              
              if (clientY < midpoint) {
                targetRow = rowEl;
                position = 'before';
                insertIndex = idx;
                break;
              }
            }
            
            // Fallback to end if nothing matched
            if (targetRow === null) {
              targetRow = lastRow;
              position = 'after';
              insertIndex = rowElements.length;
            }
          }
          
          // Calculate final index after move
          let finalIndex = insertIndex;
          if (insertIndex > draggedIndex) {
            finalIndex = insertIndex - 1;
          }
          
          // Don't show indicator if it would result in same position
          if (finalIndex === draggedIndex) {
            targetRow = null;
            position = null;
          }
          
          // Only update if changed
          if (targetRow !== docDropTarget || position !== docDropPosition) {
            const theme = getTheme();
            
            // Clear previous indicator styling
            if (docDropTarget) {
              // Restore original box-shadow
              const restoreShadow = docDropTarget.dataset.originalBoxShadow;
              docDropTarget.style.boxShadow = (restoreShadow && restoreShadow !== 'none') ? restoreShadow : '';
            }
            
            // Apply indicator using box-shadow (doesn't affect layout)
            if (targetRow && position) {
              // Store original box-shadow if not already stored
              if (targetRow.dataset.originalBoxShadow === undefined) {
                const currentShadow = targetRow.style.boxShadow;
                // Store empty string if shadow is 'none' or empty
                targetRow.dataset.originalBoxShadow = (currentShadow && currentShadow !== 'none') ? currentShadow : '';
              }
              
              const originalShadow = targetRow.dataset.originalBoxShadow;
              
              // Use theme accent color for the indicator
              const indicatorColor = theme.accent;
              
              // Build the shadow - indicator first, then original (if any)
              const indicatorShadow = position === 'before'
                ? `0 -4px 0 0 ${indicatorColor}, 0 -8px 16px 0 ${indicatorColor}`
                : `0 4px 0 0 ${indicatorColor}, 0 8px 16px 0 ${indicatorColor}`;
              
              targetRow.style.boxShadow = originalShadow 
                ? `${indicatorShadow}, ${originalShadow}`
                : indicatorShadow;
            }
            
            docDropTarget = targetRow;
            docDropPosition = position;
          }
        };
        
        const clearDropIndicator = () => {
          // Restore original box-shadow on the target row
          if (docDropTarget) {
            const restoreShadow = docDropTarget.dataset.originalBoxShadow;
            docDropTarget.style.boxShadow = (restoreShadow && restoreShadow !== 'none') ? restoreShadow : '';
          }
          docDropTarget = null;
          docDropPosition = null;
        };

        document.addEventListener('dragover', (e) => {
          if (draggedIndex === null || !segmentsContentEl) return;

          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          e.preventDefault();
          
          // Update visual indicator based on Y position (works even outside container)
          updateDropIndicator(e.clientY);
        }, true);

        document.addEventListener('drop', (e) => {
          if (draggedIndex === null) return;
          if (!segmentsContentEl) return;

          // If the drop target is inside the list, row/container handlers will take care of it.
          if (e.target && segmentsContentEl.contains(e.target)) return;

          e.preventDefault();
          clearDropIndicator();

          const rowElements = Array.from(segmentsContentEl.querySelectorAll('[data-index]'));
          if (rowElements.length === 0) return;

          let insertIndex = rowElements.length;
          for (const rowEl of rowElements) {
            const idx = parseInt(rowEl.dataset.index, 10);
            if (Number.isNaN(idx)) continue;

            const r = rowEl.getBoundingClientRect();
            const midpoint = r.top + r.height / 2;
            if (e.clientY < midpoint) {
              insertIndex = idx;
              break;
            }
          }

          // Check if move would result in same position
          const finalIndex = insertIndex > draggedIndex ? insertIndex - 1 : insertIndex;
          if (finalIndex === draggedIndex) return;

          const [movedItem] = segments.splice(draggedIndex, 1);
          if (insertIndex > draggedIndex) insertIndex -= 1;
          segments.splice(insertIndex, 0, movedItem);


          activePresetName = null;
          updateWidgetData();
          renderUI();
          updateNodeSize();
        }, true);
        
        document.addEventListener('dragend', (e) => {
          clearDropIndicator();
        }, true);

        // Get current theme from global settings (includes custom themes)
        const getTheme = () => getAllThemes()[globalSettings.theme] || THEMES.umbrael;

        // Template variable replacement function
        // showPlaceholders: true = show [placeholder], false = show empty string
        // highlightEmpty: true = show empty vars in red HTML (for output preview)
        const replaceTemplateVars = (template, showPlaceholders = true, highlightEmpty = false) => {
          if (!template || typeof template !== 'string') return template;
          
          // Track which variables are empty for highlighting
          const emptyVars = new Set();
          
          // Helper to check if a segment exists and is enabled
          const segmentExists = (segmentType) => segments.some(s => s.type === segmentType && s.enabled);
          
          // Define available variables - show placeholder text when empty if showPlaceholders is true
          // Now also checks if the corresponding segment exists
          const getVal = (value, placeholder, segmentType) => {
            // If segment type specified and segment doesn't exist, treat as empty
            if (segmentType && !segmentExists(segmentType)) {
              emptyVars.add(placeholder);
              if (highlightEmpty) {
                return `<span style="color: #ef4444; font-style: italic;">[${placeholder}]</span>`;
              }
              return showPlaceholders ? `[${placeholder}]` : "";
            }
            if (value && value.trim()) return value;
            emptyVars.add(placeholder);
            if (highlightEmpty) {
              return `<span style="color: #ef4444; font-style: italic;">[${placeholder}]</span>`;
            }
            return showPlaceholders ? `[${placeholder}]` : "";
          };
          
          const vars = {
            counter: "####", // Preview placeholder - actual value calculated by scanning folder at runtime
            label: getVal(config.node_label, "label", "output_label"),
            output: getVal(config.node_label, "label", "output_label"), // Alias
            filetype: segmentExists("file_type") ? (config.file_type || "Image") : (showPlaceholders ? "[filetype]" : ""),
            file_type: segmentExists("file_type") ? (config.file_type || "Image") : (showPlaceholders ? "[filetype]" : ""), // Alias
            category: getVal(config.category, "category", "category"),
            name: getVal(config.name, "name", "name"),
            content_rating: getVal(config.content_rating, "rating", "content_rating"),
            rating: getVal(config.content_rating, "rating", "content_rating"), // Alias
            sfw: segmentExists("content_rating") && config.content_rating === "SFW" ? "SFW" : "",
            nsfw: segmentExists("content_rating") && config.content_rating === "NSFW" ? "NSFW" : "",
            project: getVal(config.project_name, "project", "project"),
            series: getVal(config.series_name, "series", "series"),
            resolution: getVal(config.resolution, "resolution", "resolution"),
            res: getVal(config.resolution, "resolution", "resolution"), // Alias
            model: getVal(config.model_name, "model", "model"),
            lora: getVal(config.lora_name, "lora", "lora"),
            seed: segmentExists("seed") ? "[seed-auto]" : (showPlaceholders ? "[seed]" : ""),
            date: segmentExists("date") ? new Date().toISOString().split('T')[0] : (showPlaceholders ? "[date]" : ""),
            year: new Date().getFullYear().toString(), // Always available
            month: String(new Date().getMonth() + 1).padStart(2, '0'), // Always available
            day: String(new Date().getDate()).padStart(2, '0') // Always available
          };
          
          // Replace {variable} with actual values
          let result = template;
          for (const [key, value] of Object.entries(vars)) {
            const regex = new RegExp(`\\{${key}\\}`, 'gi');
            result = result.replace(regex, value);
          }
          
          return result;
        };

        const buildPreviewPath = () => {
          const parts = [];
          
          segments.forEach(seg => {
            if (seg.enabled === false) return;
            
            switch (seg.type) {
              case "label":
                if (config.node_label && config.node_label.trim()) {
                  parts.push(config.node_label);
                }
                break;
              case "file_type":
                parts.push(config.file_type || "Image");
                break;
              case "category":
                parts.push(config.category || "Characters");
                break;
              case "name":
                // Only show if name is actually filled in
                if (config.name && config.name.trim()) {
                  parts.push(config.name);
                }
                break;
              case "content_rating":
                // Always add content rating (SFW or NSFW)
                parts.push(config.content_rating || "SFW");
                break;
              case "date":
                // Show actual current date based on date_format config
                const dateFormat = config.date_format || "%Y-%m-%d";
                const now = new Date();
                const pad = (n) => n.toString().padStart(2, '0');
                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
                const weekNum = Math.floor(dayOfYear / 7);
                
                // Convert Python strftime to actual current date
                let dateSample = dateFormat
                  .replace(/%Y/g, now.getFullYear().toString())
                  .replace(/%m/g, pad(now.getMonth() + 1))
                  .replace(/%d/g, pad(now.getDate()))
                  .replace(/%H/g, pad(now.getHours()))
                  .replace(/%M/g, pad(now.getMinutes()))
                  .replace(/%S/g, pad(now.getSeconds()))
                  .replace(/%y/g, now.getFullYear().toString().slice(-2))
                  .replace(/%B/g, months[now.getMonth()])
                  .replace(/%b/g, monthsShort[now.getMonth()])
                  .replace(/%A/g, days[now.getDay()])
                  .replace(/%a/g, daysShort[now.getDay()])
                  .replace(/%j/g, dayOfYear.toString().padStart(3, '0'))
                  .replace(/%U/g, pad(weekNum))
                  .replace(/%W/g, pad(weekNum));
                parts.push(dateSample);
                break;
              case "project":
                if (config.project_name) parts.push(config.project_name);
                break;
              case "series":
                if (config.series_name) parts.push(config.series_name);
                break;
              case "resolution":
                if (config.resolution) parts.push(config.resolution);
                break;
              case "model":
                if (config.model_name) parts.push(config.model_name);
                break;
              case "seed":
                // Seed is always dynamic - show placeholder in preview
                parts.push("[seed-auto]");  // Indicates it will be auto-detected
                break;
              case "lora":
                if (config.lora_name) {
                  // Handle pipe-delimited separate mode for preview
                  if (typeof config.lora_name === 'string' && config.lora_name.includes(" | ")) {
                    parts.push(...config.lora_name.split(" | "));
                  } else {
                    parts.push(config.lora_name);
                  }
                }
                break;
              case "custom":
                // Support template variables in custom segments
                const customValue = seg.value || "Custom";
                const processedValue = replaceTemplateVars(customValue);
                if (processedValue && processedValue.trim()) {
                  parts.push(processedValue);
                }
                break;
            }
          });
          
          // Return just the folder path - filename is now handled separately
          return parts.join(" / ");
        };

        const updateWidgetData = () => {
          const newData = {
            segments: segments,
            config: config,
            presets: presets,
            activePresetName: activePresetName
          };
          const jsonData = JSON.stringify(newData);
          dataWidget.value = jsonData;
          
          // Force ComfyUI to recognize the change
          if (dataWidget.callback) {
            dataWidget.callback(jsonData);
          }
          
          // Mark node as modified
          if (node.setDirtyCanvas) {
            node.setDirtyCanvas(true, true);
          }
         };

        // Function to update presets from external sync (called by other nodes)
        const updatePresetsFromSync = (newPresetName, presetData, deletedPresetName) => {
          if (deletedPresetName) {
            // Remove the preset from our local presets
            if (presets[deletedPresetName]) {
              delete presets[deletedPresetName];
            }
          } else if (newPresetName && presetData) {
            // Add/update the preset in our local presets
            presets[newPresetName] = JSON.parse(JSON.stringify(presetData));
          }
          
          // Update widget data and re-render
          updateWidgetData();
          renderUI();
        };
        
        // Expose the sync function on the node so other nodes can call it
        node.flowPathSyncPreset = updatePresetsFromSync;

        // Sync presets to all other FlowPath nodes in the workflow
        const syncPresetsToAllNodes = (newPresetName = null, deletedPresetName = null) => {
          try {
            const allFlowPathNodes = app.graph._nodes.filter(n => 
              n.comfyClass === "FlowPath" && n.id !== node.id
            );
            
            
            let syncedCount = 0;
            allFlowPathNodes.forEach(otherNode => {
              try {
                // Use the dedicated sync function if available (preferred method)
                if (otherNode.flowPathSyncPreset) {
                  const presetData = newPresetName ? presets[newPresetName] : null;
                  otherNode.flowPathSyncPreset(newPresetName, presetData, deletedPresetName);
                  syncedCount++;
                } else {
                  // Fallback: update widget_data directly (for older nodes that haven't refreshed)
                  const otherDataWidget = otherNode.widgets?.find(w => w.name === "widget_data");
                  if (!otherDataWidget) return;
                  
                  const otherData = JSON.parse(otherDataWidget.value || "{}");
                  
                  if (deletedPresetName) {
                    if (otherData.presets && otherData.presets[deletedPresetName]) {
                      delete otherData.presets[deletedPresetName];
                    }
                  } else if (newPresetName && presets[newPresetName]) {
                    if (!otherData.presets) otherData.presets = {};
                    otherData.presets[newPresetName] = JSON.parse(JSON.stringify(presets[newPresetName]));
                  }
                  
                  otherDataWidget.value = JSON.stringify(otherData);
                  
                  if (otherNode.genSortRender) {
                    otherNode.genSortRender();
                  }
                  syncedCount++;
                }
              } catch (e) {
                console.warn(`[FlowPath] Failed to sync preset to node ${otherNode.id}:`, e);
              }
            });
            
            // Log sync count but don't show separate toast (main action toast is sufficient)
            if (syncedCount > 0) {
            }
          } catch (error) {
            console.error("[FlowPath] Error syncing presets:", error);
          }
        };

        const showInputDialog = (title, defaultValue = "", placeholder = "", options = {}) => {
          const { maxLength = 0, warningMessage = "" } = options;
          
          return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10000;
              backdrop-filter: blur(4px);
            `;

            const theme = getTheme();
            const dialog = document.createElement("div");
            dialog.style.cssText = `
              background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
              border: 2px solid ${theme.primary};
              border-radius: 12px;
              padding: 24px;
              min-width: 320px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
              transition: border-color 0.15s, box-shadow 0.15s;
            `;
            
            // Store original border for reset
            const originalBorder = `2px solid ${theme.primary}`;
            const originalShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';

            const titleEl = document.createElement("div");
            titleEl.textContent = title;
            titleEl.style.cssText = `
              color: #fff;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 16px;
            `;
            dialog.appendChild(titleEl);
            
            // Warning message area (for empty fields, etc.)
            const warningEl = document.createElement("div");
            warningEl.style.cssText = `
              display: ${warningMessage ? 'block' : 'none'};
              padding: 10px 12px;
              margin-bottom: 12px;
              background: rgba(234, 179, 8, 0.15);
              border: 1px solid rgba(234, 179, 8, 0.5);
              border-left: 3px solid rgba(234, 179, 8, 0.8);
              border-radius: 6px;
              color: rgba(253, 224, 71, 0.95);
              font-size: 12px;
              line-height: 1.4;
            `;
            // Security: escape content to prevent XSS (defense in depth)
            warningEl.innerHTML = warningMessage ? `⚠️ ${escapeHtml(warningMessage)}` : '';
            dialog.appendChild(warningEl);

            const input = document.createElement("input");
            input.type = "text";
            input.value = defaultValue;
            input.placeholder = placeholder;
            if (maxLength > 0) {
              input.maxLength = maxLength;
            }
            input.style.cssText = `
              width: 100%;
              padding: 10px;
              background: rgba(0, 0, 0, 0.4);
              border: 2px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: #fff;
              font-size: 14px;
              margin-bottom: 8px;
              box-sizing: border-box;
              transition: all 0.3s;
            `;
            input.onfocus = () => {
              input.style.borderColor = theme.primary;
              input.style.boxShadow = `0 0 0 3px ${theme.primaryLight}`;
            };
            input.onblur = () => {
              input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              input.style.boxShadow = 'none';
            };
            dialog.appendChild(input);
            
            // Character count and limit warning
            const inputInfoRow = document.createElement("div");
            inputInfoRow.style.cssText = `
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              min-height: 20px;
            `;
            
            const limitWarning = document.createElement("div");
            limitWarning.style.cssText = `
              color: rgba(239, 68, 68, 0.9);
              font-size: 11px;
              font-weight: 500;
              opacity: 0;
              transition: opacity 0.2s;
            `;
            limitWarning.textContent = `Maximum ${maxLength} characters`;
            inputInfoRow.appendChild(limitWarning);
            
            const charCount = document.createElement("div");
            charCount.style.cssText = `
              color: rgba(255, 255, 255, 0.5);
              font-size: 11px;
              margin-left: auto;
            `;
            if (maxLength > 0) {
              charCount.textContent = `${input.value.length}/${maxLength}`;
            }
            inputInfoRow.appendChild(charCount);
            
            dialog.appendChild(inputInfoRow);
            
            // Shake animation function
            const shakeDialog = () => {
              dialog.style.animation = 'none';
              dialog.offsetHeight; // Trigger reflow
              dialog.style.animation = 'dialogShake 0.4s ease-in-out';
            };
            
            // Flash red function
            const flashRed = () => {
              dialog.style.border = '2px solid rgba(239, 68, 68, 0.9)';
              dialog.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.4)';
              limitWarning.style.opacity = '1';
              
              setTimeout(() => {
                dialog.style.border = originalBorder;
                dialog.style.boxShadow = originalShadow;
              }, 300);
            };
            
            // Add shake keyframes if not already present
            if (!document.querySelector('#flowpath-dialog-animations')) {
              const style = document.createElement('style');
              style.id = 'flowpath-dialog-animations';
              style.textContent = `
                @keyframes dialogShake {
                  0%, 100% { transform: translateX(0); }
                  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
                  20%, 40%, 60%, 80% { transform: translateX(6px); }
                }
              `;
              document.head.appendChild(style);
            }
            
            // Input handler for character limit
            input.oninput = () => {
              if (maxLength > 0) {
                charCount.textContent = `${input.value.length}/${maxLength}`;
                
                // Check if at limit
                if (input.value.length >= maxLength) {
                  charCount.style.color = 'rgba(239, 68, 68, 0.9)';
                  flashRed();
                  shakeDialog();
                } else if (input.value.length >= maxLength * 0.8) {
                  charCount.style.color = 'rgba(234, 179, 8, 0.9)';
                  limitWarning.style.opacity = '0';
                } else {
                  charCount.style.color = 'rgba(255, 255, 255, 0.5)';
                  limitWarning.style.opacity = '0';
                }
              }
            };

            const btnContainer = document.createElement("div");
            btnContainer.style.cssText = `
              display: flex;
              gap: 10px;
              justify-content: flex-end;
            `;

            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Cancel";
            cancelBtn.style.cssText = `
              padding: 8px 20px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 6px;
              color: #fff;
              cursor: pointer;
              transition: all 0.2s;
              font-weight: 500;
            `;
            cancelBtn.onmouseover = () => {
              cancelBtn.style.background = 'rgba(255, 255, 255, 0.15)';
            };
            cancelBtn.onmouseout = () => {
              cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            };
            cancelBtn.onclick = () => {
              document.body.removeChild(overlay);
              container.focus();
              resolve(null);
            };

            const okBtn = document.createElement("button");
            okBtn.textContent = "OK";
            okBtn.style.cssText = `
              padding: 8px 20px;
              background: ${theme.primary};
              border: none;
              border-radius: 6px;
              color: #fff;
              cursor: pointer;
              font-weight: bold;
              transition: all 0.2s;
              box-shadow: 0 2px 8px ${theme.primaryLight};
            `;
            okBtn.onmouseover = () => {
              okBtn.style.transform = 'translateY(-2px)';
              okBtn.style.boxShadow = `0 4px 12px ${theme.primaryLight}`;
            };
            okBtn.onmouseout = () => {
              okBtn.style.transform = 'translateY(0)';
              okBtn.style.boxShadow = `0 2px 8px ${theme.primaryLight}`;
            };
            okBtn.onclick = () => {
              const value = input.value.trim();
              document.body.removeChild(overlay);
              container.focus();
              resolve(value);
            };

            btnContainer.appendChild(cancelBtn);
            btnContainer.appendChild(okBtn);
            dialog.appendChild(btnContainer);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            setTimeout(() => {
              input.focus();
              input.select();
            }, 100);

            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                okBtn.click();
              } else if (e.key === 'Escape') {
                cancelBtn.click();
              }
            });
          });
        };

        const showConfirmDialog = (title, message, confirmText = "Yes", cancelText = "No") => {
          return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10000;
              backdrop-filter: blur(4px);
            `;

            const theme = getTheme();
            const dialog = document.createElement("div");
            dialog.style.cssText = `
              background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
              border: 2px solid ${theme.primary};
              border-radius: 12px;
              padding: 24px;
              min-width: 320px;
              max-width: 400px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            `;

            const titleEl = document.createElement("div");
            titleEl.textContent = title;
            titleEl.style.cssText = `
              color: #fff;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 12px;
            `;
            dialog.appendChild(titleEl);

            const messageEl = document.createElement("div");
            messageEl.textContent = message;
            messageEl.style.cssText = `
              color: rgba(255, 255, 255, 0.8);
              font-size: 14px;
              margin-bottom: 20px;
              line-height: 1.5;
            `;
            dialog.appendChild(messageEl);

            const btnContainer = document.createElement("div");
            btnContainer.style.cssText = `
              display: flex;
              gap: 10px;
              justify-content: flex-end;
            `;

            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = cancelText;
            cancelBtn.style.cssText = `
              padding: 8px 20px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 6px;
              color: #fff;
              cursor: pointer;
              transition: all 0.2s;
              font-weight: 500;
            `;
            cancelBtn.onmouseover = () => {
              cancelBtn.style.background = 'rgba(255, 255, 255, 0.15)';
            };
            cancelBtn.onmouseout = () => {
              cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            };
            // Handle keyboard shortcuts
            const handleKeydown = (e) => {
              if (e.key === 'Enter') {
                cleanup();
                resolve(true);
              } else if (e.key === 'Escape') {
                cleanup();
                resolve(false);
              }
            };
            
            const cleanup = () => {
              document.removeEventListener('keydown', handleKeydown);
              if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
              }
              container.focus();
            };
            
            cancelBtn.onclick = () => {
              cleanup();
              resolve(false);
            };

            const confirmBtn = document.createElement("button");
            confirmBtn.textContent = confirmText;
            confirmBtn.style.cssText = `
              padding: 8px 20px;
              background: rgba(239, 68, 68, 0.8);
              border: none;
              border-radius: 6px;
              color: #fff;
              cursor: pointer;
              font-weight: bold;
              transition: all 0.2s;
              box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
            `;
            confirmBtn.onmouseover = () => {
              confirmBtn.style.transform = 'translateY(-2px)';
              confirmBtn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
              confirmBtn.style.background = 'rgba(239, 68, 68, 1)';
            };
            confirmBtn.onmouseout = () => {
              confirmBtn.style.transform = 'translateY(0)';
              confirmBtn.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
              confirmBtn.style.background = 'rgba(239, 68, 68, 0.8)';
            };
            confirmBtn.onclick = () => {
              cleanup();
              resolve(true);
            };

            btnContainer.appendChild(cancelBtn);
            btnContainer.appendChild(confirmBtn);
            dialog.appendChild(btnContainer);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            document.addEventListener('keydown', handleKeydown);
          });
        };

        const createSection = (title, isExpanded, onToggle) => {
          const theme = getTheme();
          const section = document.createElement("div");
          section.style.cssText = `margin-bottom: 10px;`;

          const header = document.createElement("div");
          header.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 10px;
            background: ${theme.gradient};
            border-radius: 6px;
            cursor: pointer;
            user-select: none;
            transition: all 0.2s;
            border: 1px solid ${theme.primaryLight};
          `;
          header.onmouseover = () => {
            header.style.background = theme.primaryLight;
            header.style.transform = 'translateX(2px)';
          };
          header.onmouseout = () => {
            header.style.background = theme.gradient;
            header.style.transform = 'translateX(0)';
          };
          header.onclick = onToggle;

          const arrow = document.createElement("span");
          arrow.textContent = isExpanded ? "▼" : "▶";
          arrow.style.cssText = `
            margin-right: 8px;
            font-size: 10px;
            color: ${theme.accent};
          `;
          header.appendChild(arrow);

          const titleEl = document.createElement("span");
          titleEl.textContent = title;
          titleEl.style.cssText = `
            font-weight: 600;
            color: #fff;
            font-size: 13px;
          `;
          header.appendChild(titleEl);

          section.appendChild(header);

          const content = document.createElement("div");
          content.style.cssText = `
            margin-top: 8px;
            padding: 10px;
            background: ${theme.background};
            border-radius: 6px;
            border: 1px solid ${theme.primaryLight};
            display: ${isExpanded ? 'block' : 'none'};
          `;

          section.appendChild(content);
          return { section, content, arrow, header };
        };

        // Calculate height based on content - fixed calculation (zoom-independent)
        // No auto-resize - content scrolls within the node
        // User can manually resize the node as needed
        const updateNodeSize = () => {};
        node.genSortUpdateSize = updateNodeSize;

        const renderUI = () => {
          const theme = getTheme();
          
          // Update themed scrollbar CSS
          updateThemedScrollbar(theme);
          
          // Clear config input references (will be repopulated during render)
          configInputElements = {};
          
          // Reset drop indicator state
          docDropTarget = null;
          docDropPosition = null;
          
          container.style.cssText = `
            position: relative;
            background: ${theme.background || 'linear-gradient(180deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.2))'};
            border: 1px solid ${theme.primaryLight};
            border-radius: 8px;
            padding: 10px;
            margin: 4px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow-y: auto;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          `;
          
          container.innerHTML = "";
          
          // Helper to convert hex color to rgba
          const hexToRgba = (hex, alpha = 1) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };
          
          // Helper to show full container loading animation (like opening folder)
          const showContainerLoadingAnimation = (message) => {
            // Add keyframes if not already added
            if (!document.getElementById('flowpath-diagonal-keyframes')) {
              const style = document.createElement('style');
              style.id = 'flowpath-diagonal-keyframes';
              style.textContent = `
                @keyframes flowpathStripeMove {
                  from { transform: translateX(-28px); }
                  to { transform: translateX(0); }
                }
              `;
              document.head.appendChild(style);
            }
            
            // Remove existing overlay if any
            const existingOverlay = container.querySelector('.container-loading-overlay');
            if (existingOverlay) existingOverlay.remove();
            
            const overlay = document.createElement('div');
             overlay.className = 'container-loading-overlay';
             overlay.style.cssText = `
               position: absolute;
               top: 0;
               left: 0;
               right: 0;
               bottom: 0;
               background: rgba(34, 197, 94, 0.95);
               border-radius: 8px;
               display: flex;
               align-items: center;
               justify-content: center;
               z-index: 100;
               opacity: 1;
               transition: opacity 0.5s ease-out;
               pointer-events: none;
               overflow: hidden;
             `;
            
            // Add diagonal stripes animation
            const stripes = document.createElement('div');
            stripes.style.cssText = `
              position: absolute;
              top: 0;
              left: -28px;
              right: -28px;
              bottom: 0;
              background: repeating-linear-gradient(
                -45deg,
                rgba(0, 0, 0, 0.15),
                rgba(0, 0, 0, 0.15) 7px,
                transparent 7px,
                transparent 14px
              );
              animation: flowpathStripeMove 0.5s linear infinite;
              pointer-events: none;
            `;
            overlay.appendChild(stripes);
            
            const text = document.createElement('span');
            text.textContent = message;
            text.style.cssText = `
              color: #fff;
              font-size: 14px;
              font-weight: 600;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
              position: relative;
              z-index: 1;
            `;
            overlay.appendChild(text);
            
            container.appendChild(overlay);
             
             // Fade out and remove - show for 1.5s then fade over 0.5s
             setTimeout(() => {
               overlay.style.opacity = '0';
               setTimeout(() => overlay.remove(), 500);
             }, 1500);
           };
          
          // Helper function to build preview HTML
          const buildPreviewHtml = () => {
            const previewPath = buildPreviewPath();
            const isImageSaverMode = config.output_mode === 'imageSaver';
            const hasFilenameTemplate = config.filename_template && config.filename_template.trim();
            let filenamePreviewStr = "";
            if (hasFilenameTemplate) {
              // Use highlightEmpty=true to show empty variables in red in output preview
              filenamePreviewStr = replaceTemplateVars(config.filename_template, false, true);
            }
            
            // Split path into segments for breadcrumb display, always start with "output/"
             // When empty: SI mode shows "ComfyUI" (filename prefix), IS mode shows just "output"
             const emptyDefault = isImageSaverMode ? ['output'] : ['output', 'ComfyUI'];
             const pathParts = previewPath ? ['output', ...previewPath.split(' / ')] : emptyDefault;
            // Security: escape user-controlled path parts to prevent XSS
            const breadcrumbHtml = pathParts.map((part, i) => {
                const isLast = i === pathParts.length - 1;
                return `<span style="color: #fff; font-weight: ${isLast ? '600' : '400'};">${escapeHtml(part)}</span>`;
              }).join(`<span style="color: ${theme.accent}; opacity: 0.7;">/</span>`);
            
            let html = "";
            
            // Header row with icon and mode toggle
            const saveImageActive = !isImageSaverMode;
            const imageSaverActive = isImageSaverMode;
            
            // Build the copyable path (output/ + path segments)
             // When empty: SI mode shows "ComfyUI" (filename prefix), IS mode shows just "output"
             const emptyPathDefault = isImageSaverMode ? 'output' : 'output/ComfyUI';
             const copyablePath = previewPath ? `output/${previewPath.replace(/ \/ /g, '/')}` : emptyPathDefault;
            
            html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              ${globalSettings.showEmojis ? '<span style="font-size: 16px;">📁</span>' : ''}
              <span style="color: ${theme.accent}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Output Preview</span>
              <div style="margin-left: auto; display: flex; align-items: center; gap: 6px;">
                <span class="mode-info-icon" style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: rgba(255,255,255,0.1);
                  border: 1px solid rgba(255,255,255,0.2);
                  color: rgba(255,255,255,0.5);
                  font-size: 10px;
                  font-weight: bold;
                  font-style: italic;
                  font-family: Georgia, serif;
                  cursor: help;
                  transition: all 0.2s;
                " title="Output Modes:&#10;&#10;• SI (Save Image): Default mode, works with most workflows. The path becomes a filename prefix with auto-numbering.&#10;&#10;• IS (Image Saver): For the Image Saver node which supports separate folder paths and filenames with variables.&#10;&#10;Use SI unless your workflow specifically uses the Image Saver node.">i</span>
                <div style="display: flex; align-items: center; background: rgba(0,0,0,0.3); border-radius: 4px; padding: 2px; border: 1px solid rgba(255,255,255,0.1);">
                  <button class="mode-btn-save" style="
                     padding: 3px 6px;
                     font-size: 10px;
                     font-weight: 600;
                     border: none;
                     border-radius: 3px;
                     cursor: pointer;
                     transition: all 0.2s;
                     background: ${saveImageActive ? (theme.accent || '#d97706') : 'rgba(0,0,0,0.2)'};
                     color: ${saveImageActive ? '#000' : 'rgba(255,255,255,0.6)'};
                   " title="Save Image mode: Path acts as filename prefix">SI</button>
                   <button class="mode-btn-saver" style="
                     padding: 3px 6px;
                     font-size: 10px;
                     font-weight: 600;
                     border: none;
                     border-radius: 3px;
                     cursor: pointer;
                     transition: all 0.2s;
                     background: ${imageSaverActive ? (theme.accent || '#d97706') : 'rgba(0,0,0,0.2)'};
                     color: ${imageSaverActive ? '#000' : 'rgba(255,255,255,0.6)'};
                   " title="Image Saver mode: Separate path and filename">IS</button>
                   <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2); margin: 0 3px;"></div>
                   <button class="theme-dropdown-btn" style="
                      padding: 3px 6px;
                      font-size: 10px;
                      border: none;
                      border-radius: 3px;
                      cursor: pointer;
                      transition: all 0.2s;
                      background: rgba(0,0,0,0.2);
                      color: rgba(255,255,255,0.6);
                    " title="Theme settings">⚙</button>
                </div>
              </div>
            </div>`;
            
            if (isImageSaverMode) {
              // Image Saver mode: Show path and filename merged
              // Don't show _## if user already has %counter or {counter} in their template
              const hasCounter = config.filename_template && 
                (config.filename_template.includes('%counter') || config.filename_template.toLowerCase().includes('{counter}'));
              const counterSuffix = hasCounter ? '.[ext]' : '_##.[ext]';
              // Security: escape user-controlled filename template to prevent XSS
              const filenameDisplay = hasFilenameTemplate 
                ? `<span style="color: #fff; font-weight: 600;">${escapeHtml(filenamePreviewStr || config.filename_template)}</span><span style="color: rgba(255,255,255,0.3);">${counterSuffix}</span>`
                : `<span style="color: rgba(255,255,255,0.4); font-style: italic;">&lt;filename&gt;</span><span style="color: rgba(255,255,255,0.3);">_##.[ext]</span>`;
              
              html += `<div class="path-string-container" style="
                padding: 10px 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                cursor: pointer;
                position: relative;
                transition: background 0.2s;
              ">
                <div style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 12px; line-height: 1.8; display: flex; flex-wrap: wrap; align-items: center;">
                  ${breadcrumbHtml}<span style="color: ${theme.accent}; margin: 0 2px; opacity: 0.7;">/</span>${filenameDisplay}
                </div>
              </div>`;
              
              if (!hasFilenameTemplate) {
                html += `<div style="
                  margin-top: 8px;
                  padding: 6px 10px;
                  background: ${hexToRgba(theme.accent, 0.1)};
                  border-radius: 4px;
                  border-left: 2px solid ${theme.accent};
                ">
                  <span style="color: rgba(255,255,255,0.6); font-size: 10px;">💡 Expand the <strong>Filename</strong> section below to set your filename pattern.</span>
                </div>`;
              }
            } else {
              // Save Image mode: Path acts as filename prefix
              html += `<div class="path-string-container" style="
                padding: 10px 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                cursor: pointer;
                position: relative;
                transition: background 0.2s;
              ">
                <div style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 12px; line-height: 1.8; display: flex; flex-wrap: wrap; align-items: center;">
                  ${breadcrumbHtml}<span style="color: rgba(255,255,255,0.3);">_#####.[ext]</span>
                </div>
              </div>`;
            }
            
            return html;
          };

          // PATH & FILENAME PREVIEW - Clean, modern design (optionally sticky at top)
          const preview = document.createElement("div");
          const isSticky = globalSettings.stickyPreview;
          preview.style.cssText = `
            ${isSticky ? 'position: sticky; top: 0; z-index: 10;' : ''}
            margin-bottom: 12px;
            padding: 10px;
            background-color: ${isSticky ? '#0a0a0c' : 'transparent'};
            background-image: ${theme.background};
            border-radius: 6px;
            border: 1px solid ${theme.primaryLight};
            box-shadow: ${isSticky ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'};
          `;
          
          
          // Helper to open theme dropdown
          const openThemeDropdown = (targetBtn) => {
            // Check if dropdown already exists (toggle behavior)
            const existingDropdown = document.querySelector('.flowpath-theme-dropdown');
            if (existingDropdown) {
              existingDropdown.remove();
              return;
            }
            
            const dropdown = document.createElement('div');
            dropdown.className = 'flowpath-theme-dropdown';
            
            // Apply solid background to dropdown (not transparent)
            dropdown.style.cssText = `
              position: fixed;
              z-index: 10000;
              min-width: 180px;
              max-height: 280px;
              overflow-y: auto;
              background: #1a1a1f;
              border: 1px solid ${theme.primary};
              border-radius: 6px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05);
              padding: 4px 0;
              scrollbar-color: rgba(255, 255, 255, 0.18) rgba(255, 255, 255, 0.03);
            `;
            
            // Add themed scrollbar via inline style element (subtle glass style)
            const scrollStyle = document.createElement('style');
            scrollStyle.textContent = `
              .flowpath-theme-dropdown::-webkit-scrollbar {
                width: 10px;
              }
              .flowpath-theme-dropdown::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 5px;
              }
              .flowpath-theme-dropdown::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.18);
                border-radius: 5px;
                border: 1px solid rgba(255, 255, 255, 0.08);
              }
              .flowpath-theme-dropdown::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.28);
              }
            `;
            dropdown.appendChild(scrollStyle);
            
            // Title
            const title = document.createElement('div');
            title.className = 'flowpath-theme-dropdown-title';
            title.style.cssText = `
              padding: 6px 10px;
              font-size: 9px;
              font-weight: 600;
              color: ${theme.accent};
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid ${theme.primaryLight};
            `;
            title.textContent = 'Select Theme';
            dropdown.appendChild(title);
            
            // Get all themes
            const allThemes = getAllThemes();
            const currentThemeKey = globalSettings.theme || 'umbrael';
            
            // Built-in themes first (no emojis - swatch shows color)
            const builtInThemes = [
              { key: 'ocean', name: 'Ocean Blue' },
              { key: 'forest', name: 'Forest Green' },
              { key: 'pinkpony', name: 'Pink Pony Club' },
              { key: 'odie', name: 'Odie' },
              { key: 'umbrael', name: 'Umbrael\'s Umbrage' },
              { key: 'plainjane', name: 'Plain Jane' },
              { key: 'batman', name: 'The Dark Knight' }
            ];
            
            builtInThemes.forEach(({ key, name }) => {
              const themeData = allThemes[key];
              if (!themeData) return;
              
              const item = document.createElement('div');
              item.className = 'flowpath-theme-item' + (currentThemeKey === key ? ' active' : '');
              
              const swatch = document.createElement('div');
              swatch.className = 'flowpath-theme-item-swatch';
              swatch.style.background = `linear-gradient(135deg, ${themeData.primary}, ${themeData.accent})`;
              
              const nameEl = document.createElement('span');
              nameEl.className = 'flowpath-theme-item-name';
              nameEl.textContent = name;
              
              item.appendChild(swatch);
              item.appendChild(nameEl);
              
              // Hover effect using theme color
              item.onmouseenter = () => {
                if (currentThemeKey !== key) {
                  item.style.background = theme.primaryLight;
                }
              };
              item.onmouseleave = () => {
                if (currentThemeKey !== key) {
                  item.style.background = '';
                }
              };
              
              item.onclick = () => {
                globalSettings.theme = key;
                app.ui.settings.setSettingValue("🌊 FlowPath.Theme", key);
                app.graph._nodes.filter(n => n.comfyClass === "FlowPath").forEach(n => n.genSortRender?.());
                dropdown.remove();
              };
              
              dropdown.appendChild(item);
            });
            
            // Custom themes
            const customKeys = Object.keys(customThemes);
            if (customKeys.length > 0) {
              const divider = document.createElement('div');
              divider.className = 'flowpath-theme-divider';
              divider.style.cssText = `height: 1px; background: ${theme.primaryLight}; margin: 4px 0;`;
              dropdown.appendChild(divider);
              
              customKeys.forEach(key => {
                const themeData = customThemes[key];
                const item = document.createElement('div');
                item.className = 'flowpath-theme-item' + (currentThemeKey === key ? ' active' : '');
                item.style.position = 'relative';
                
                const swatch = document.createElement('div');
                swatch.className = 'flowpath-theme-item-swatch';
                swatch.style.background = `linear-gradient(135deg, ${themeData.primary}, ${themeData.accent})`;
                
                const nameEl = document.createElement('span');
                nameEl.className = 'flowpath-theme-item-name';
                nameEl.textContent = themeData.name;
                
                // Delete button for custom themes
                const deleteBtn = document.createElement('div');
                deleteBtn.className = 'flowpath-theme-delete';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.style.cssText = `
                  position: absolute;
                  right: 8px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 18px;
                  height: 18px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 4px;
                  font-size: 14px;
                  color: rgba(255,255,255,0.4);
                  cursor: pointer;
                  opacity: 0;
                  transition: opacity 0.15s, background 0.15s, color 0.15s;
                `;
                
                deleteBtn.onmouseenter = () => {
                  deleteBtn.style.background = 'rgba(239, 68, 68, 0.3)';
                  deleteBtn.style.color = '#ef4444';
                };
                deleteBtn.onmouseleave = () => {
                  deleteBtn.style.background = '';
                  deleteBtn.style.color = 'rgba(255,255,255,0.4)';
                };
                deleteBtn.onclick = (e) => {
                  e.stopPropagation();
                  
                  // Store position before re-render destroys the button
                  const btnRect = targetBtn.getBoundingClientRect();
                  
                  // Remove from localStorage
                  delete customThemes[key];
                  localStorage.setItem('flowpath_custom_themes', JSON.stringify(customThemes));
                  
                  // If this was the active theme, switch to default
                  if (currentThemeKey === key) {
                    globalSettings.theme = 'umbrael';
                    app.ui.settings.setSettingValue("🌊 FlowPath.Theme", 'umbrael');
                  }
                  
                  // Re-render all FlowPath nodes
                  app.graph._nodes.filter(n => n.comfyClass === "FlowPath").forEach(n => n.genSortRender?.());
                  
                  // Close dropdown - don't try to reopen as button is recreated
                  dropdown.remove();
                };
                
                item.appendChild(swatch);
                item.appendChild(nameEl);
                item.appendChild(deleteBtn);
                
                // Hover effect using theme color - also show delete button
                item.onmouseenter = () => {
                  if (currentThemeKey !== key) {
                    item.style.background = theme.primaryLight;
                  }
                  deleteBtn.style.opacity = '1';
                };
                item.onmouseleave = () => {
                  if (currentThemeKey !== key) {
                    item.style.background = '';
                  }
                  deleteBtn.style.opacity = '0';
                };
                
                item.onclick = () => {
                  globalSettings.theme = key;
                  app.ui.settings.setSettingValue("🌊 FlowPath.Theme", key);
                  app.graph._nodes.filter(n => n.comfyClass === "FlowPath").forEach(n => n.genSortRender?.());
                  dropdown.remove();
                };
                
                dropdown.appendChild(item);
              });
            }
            
            // Create new theme option
            const divider2 = document.createElement('div');
            divider2.className = 'flowpath-theme-divider';
            divider2.style.cssText = `height: 1px; background: ${theme.primaryLight}; margin: 4px 0;`;
            dropdown.appendChild(divider2);
            
            const createItem = document.createElement('div');
            createItem.className = 'flowpath-theme-create';
            const MAX_CUSTOM_THEMES = 10;
            const atLimit = Object.keys(customThemes).length >= MAX_CUSTOM_THEMES;
            createItem.innerHTML = `<span>+</span><span>Create Custom Theme...${atLimit ? ' (limit reached)' : ''}</span>`;
            createItem.style.cssText = `
              padding: 8px 12px;
              cursor: ${atLimit ? 'not-allowed' : 'pointer'};
              display: flex;
              align-items: center;
              gap: 8px;
              color: ${atLimit ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)'};
              font-size: 12px;
              transition: all 0.15s;
            `;
            
            if (!atLimit) {
              createItem.onmouseenter = () => {
                createItem.style.background = 'rgba(34, 197, 94, 0.15)';
                createItem.style.color = '#22c55e';
              };
              createItem.onmouseleave = () => {
                createItem.style.background = '';
                createItem.style.color = 'rgba(255,255,255,0.7)';
              };
              createItem.onclick = () => {
                dropdown.remove();
                openThemeEditor();
              };
            } else {
              // At limit - flash red on click
              createItem.onclick = () => {
                createItem.style.background = 'rgba(239, 68, 68, 0.3)';
                createItem.style.color = '#ef4444';
                setTimeout(() => {
                  createItem.style.background = '';
                  createItem.style.color = 'rgba(255,255,255,0.4)';
                }, 300);
              };
            }
            dropdown.appendChild(createItem);
            
            // Position dropdown
            const rect = targetBtn.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + 4}px`;
            dropdown.style.left = `${rect.left}px`;
            
            document.body.appendChild(dropdown);
            
            // Adjust if off-screen
            const dropRect = dropdown.getBoundingClientRect();
            if (dropRect.right > window.innerWidth) {
              dropdown.style.left = `${window.innerWidth - dropRect.width - 10}px`;
            }
            
            // Close on outside click or canvas interaction (but allow dropdown scrolling)
            const closeDropdown = () => {
              if (!document.body.contains(dropdown)) return; // Already removed
              dropdown.remove();
              document.removeEventListener('mousedown', closeHandler, true);
              document.removeEventListener('pointerdown', closeHandler, true);
              document.removeEventListener('wheel', wheelHandler, true);
              window.removeEventListener('blur', closeDropdown);
            };
            
            const closeHandler = (e) => {
              // Close on any click outside dropdown (left, middle, right)
              if (!dropdown.contains(e.target) && e.target !== targetBtn) {
                closeDropdown();
              }
            };
            
            const wheelHandler = (e) => {
              // Only close if scrolling outside the dropdown
              if (!dropdown.contains(e.target)) {
                closeDropdown();
              }
            };
            
            setTimeout(() => {
              // Use capture phase to get events before canvas handles them
              document.addEventListener('mousedown', closeHandler, true);
              document.addEventListener('pointerdown', closeHandler, true);
              document.addEventListener('wheel', wheelHandler, true);
              window.addEventListener('blur', closeDropdown);
            }, 0);
          };

          // Helper to attach mode button listeners
          const attachModeButtonListeners = () => {
            const saveBtn = preview.querySelector('.mode-btn-save');
            const saverBtn = preview.querySelector('.mode-btn-saver');
            const themeBtn = preview.querySelector('.theme-dropdown-btn');
            
            // Theme dropdown button
            if (themeBtn) {
              themeBtn.onclick = (e) => {
                e.stopPropagation();
                openThemeDropdown(themeBtn);
              };
              themeBtn.onmouseenter = () => {
                themeBtn.style.background = 'rgba(255,255,255,0.15)';
                themeBtn.style.color = '#fff';
              };
              themeBtn.onmouseleave = () => {
                themeBtn.style.background = 'rgba(0,0,0,0.2)';
                themeBtn.style.color = 'rgba(255,255,255,0.6)';
              };
            }
            
            if (saveBtn) {
              saveBtn.onclick = () => {
                if (config.output_mode !== 'saveImage') {
                  config.output_mode = 'saveImage';
                  updateWidgetData();
                  renderUI();
                  updateNodeSize();
                }
              };
              saveBtn.onmouseenter = () => {
                 if (config.output_mode !== 'saveImage') {
                   saveBtn.style.background = 'rgba(255,255,255,0.15)';
                 } else {
                   // Keep active state background on hover
                   saveBtn.style.background = theme.accent || '#d97706';
                 }
               };
               saveBtn.onmouseleave = () => {
                 if (config.output_mode !== 'saveImage') {
                   saveBtn.style.background = 'rgba(0,0,0,0.2)';
                 } else {
                   // Maintain active state background
                   saveBtn.style.background = theme.accent || '#d97706';
                 }
               };
            }
            
            if (saverBtn) {
              saverBtn.onclick = () => {
                if (config.output_mode !== 'imageSaver') {
                  config.output_mode = 'imageSaver';
                  // Auto-expand filename section when switching to Image Saver mode
                  if (!filenameExpanded) {
                    filenameExpanded = true;
                  }
                  updateWidgetData();
                  renderUI();
                  updateNodeSize();
                }
              };
              saverBtn.onmouseenter = () => {
                 if (config.output_mode !== 'imageSaver') {
                   saverBtn.style.background = 'rgba(255,255,255,0.15)';
                 } else {
                   // Keep active state background on hover
                   saverBtn.style.background = theme.accent || '#d97706';
                 }
               };
               saverBtn.onmouseleave = () => {
                 if (config.output_mode !== 'imageSaver') {
                   saverBtn.style.background = 'rgba(0,0,0,0.2)';
                 } else {
                   // Maintain active state background
                   saverBtn.style.background = theme.accent || '#d97706';
                 }
               };
            }
          };
          
          // Helper to get current copyable path
            const getCurrentCopyablePath = () => {
              const currentPreviewPath = buildPreviewPath();
              // When empty: SI mode shows "ComfyUI" (filename prefix), IS mode shows just "output"
              const isIS = config.output_mode === 'imageSaver';
              const emptyDefault = isIS ? 'output' : 'output/ComfyUI';
              return currentPreviewPath ? `output/${currentPreviewPath.replace(/ \/ /g, '/')}` : emptyDefault;
            };
          
          // Helper to show flash overlay on the path string container
          const showPathFlash = (message, color, textColor = '#fff', animated = false) => {
            const pathContainer = preview.querySelector('.path-string-container');
            if (!pathContainer) return;
            
            // Remove existing overlay if any
            const existingOverlay = pathContainer.querySelector('.path-flash-overlay');
            if (existingOverlay) existingOverlay.remove();
            
            const overlay = document.createElement('div');
            overlay.className = 'path-flash-overlay';
            overlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: ${color};
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100;
              opacity: 1;
              transition: opacity 0.4s ease-out;
              pointer-events: none;
              overflow: hidden;
            `;
            
            // Add construction-style warning diagonal stripes animation
            if (animated) {
              // Add keyframes if not already added
              if (!document.getElementById('flowpath-diagonal-keyframes')) {
                const style = document.createElement('style');
                style.id = 'flowpath-diagonal-keyframes';
                style.textContent = `
                  @keyframes flowpathStripeMove {
                    from { transform: translateX(-28px); }
                    to { transform: translateX(0); }
                  }
                `;
                document.head.appendChild(style);
              }
              
              const stripes = document.createElement('div');
              stripes.style.cssText = `
                position: absolute;
                top: 0;
                left: -28px;
                right: -28px;
                bottom: 0;
                background: repeating-linear-gradient(
                  -45deg,
                  rgba(0, 0, 0, 0.15),
                  rgba(0, 0, 0, 0.15) 7px,
                  transparent 7px,
                  transparent 14px
                );
                animation: flowpathStripeMove 0.5s linear infinite;
                pointer-events: none;
              `;
              overlay.appendChild(stripes);
            }
            
            const text = document.createElement('span');
            text.textContent = message;
            text.style.cssText = `
              color: ${textColor};
              font-size: 12px;
              font-weight: 600;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
              position: relative;
              z-index: 1;
            `;
            overlay.appendChild(text);
            
            pathContainer.appendChild(overlay);
            
            // Fade out and remove
            setTimeout(() => {
              overlay.style.opacity = '0';
              setTimeout(() => overlay.remove(), 400);
            }, 1000);
          };
          
          // Container for action prompts (shown below preview)
          let actionPromptBox = null;
          
          // Helper to show action prompt below preview
          const showActionPrompt = (message, actions) => {
            // Remove existing prompt
            if (actionPromptBox) {
              actionPromptBox.remove();
              actionPromptBox = null;
            }
            
            actionPromptBox = document.createElement('div');
            actionPromptBox.style.cssText = `
              margin-top: -8px;
              margin-bottom: 12px;
              padding: 10px 12px;
              background: ${hexToRgba(theme.accent, 0.15)};
              border: 1px solid ${hexToRgba(theme.accent, 0.4)};
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
            `;
            
            const msgSpan = document.createElement('span');
            msgSpan.textContent = message;
            msgSpan.style.cssText = `
              color: rgba(255, 255, 255, 0.9);
              font-size: 11px;
              flex: 1;
            `;
            actionPromptBox.appendChild(msgSpan);
            
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = `display: flex; gap: 6px;`;
            
            actions.forEach(action => {
              const btn = document.createElement('button');
              btn.textContent = action.label;
              btn.style.cssText = `
                padding: 5px 10px;
                font-size: 11px;
                font-weight: 600;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                background: ${action.primary ? hexToRgba(theme.accent, 0.8) : 'rgba(255,255,255,0.1)'};
                color: ${action.primary ? '#000' : 'rgba(255,255,255,0.8)'};
              `;
              btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.filter = 'brightness(1.1)';
              };
              btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.filter = 'brightness(1)';
              };
              btn.onclick = () => {
                action.onClick();
                if (actionPromptBox) {
                  actionPromptBox.remove();
                  actionPromptBox = null;
                }
              };
              btnContainer.appendChild(btn);
            });
            
            actionPromptBox.appendChild(btnContainer);
            
            // Insert after preview
            preview.parentNode.insertBefore(actionPromptBox, preview.nextSibling);
          };
          
          // Helper to hide action prompt
          const hideActionPrompt = () => {
            if (actionPromptBox) {
              actionPromptBox.remove();
              actionPromptBox = null;
            }
          };
          
          // Attach click handler to path container after preview is built
          const attachPathClickHandler = () => {
            const pathContainer = preview.querySelector('.path-string-container');
            if (!pathContainer) return;
            
            // Update tooltip based on mode and seed segment
             const currentPath = getCurrentCopyablePath();
             const hasSeedSegment = currentPath.includes('[seed-auto]');
             const enabledSegs = segments.filter(s => s.enabled);
             const seedIsLast = enabledSegs.length > 0 && enabledSegs[enabledSegs.length - 1].type === 'seed';
             const isSIMode = config.output_mode !== 'imageSaver';
             
             let folderTooltip = 'Click to copy path • Shift+click to open folder';
             if (isSIMode && enabledSegs.length > 0) {
               folderTooltip = 'Click to copy path • Shift+click to open folder (last segment is filename prefix)';
             }
             if (hasSeedSegment) {
               const seedCanBeSkipped = isSIMode 
                 ? (enabledSegs.length > 1 && enabledSegs[enabledSegs.length - 2]?.type === 'seed')
                 : seedIsLast;
               folderTooltip = seedCanBeSkipped
                 ? 'Click to copy path • Shift+click to open parent folder (seed excluded)'
                 : 'Click to copy path • Shift+click disabled (seed in middle of path)';
             }
             pathContainer.title = folderTooltip;
            pathContainer.style.userSelect = 'none';
            pathContainer.style.webkitUserSelect = 'none';
            
            pathContainer.onmouseenter = () => {
              pathContainer.style.background = 'rgba(255, 255, 255, 0.08)';
            };
            pathContainer.onmouseleave = () => {
              pathContainer.style.background = 'rgba(0, 0, 0, 0.3)';
            };
            
            pathContainer.onclick = async (e) => {
               const pathToCopy = getCurrentCopyablePath();
               
               if (e.shiftKey) {
                 // Shift+click: Try to open the folder
                 let folderPath = pathToCopy;
                 
                 // In SI (Save Image) mode, the last segment is the filename prefix, not a folder
                 // We need to open the parent folder where images are actually saved
                 const isImageSaverMode = config.output_mode === 'imageSaver';
                 if (!isImageSaverMode && folderPath.includes('/')) {
                   // SI mode: strip the last component (filename prefix) to get actual folder
                   folderPath = folderPath.substring(0, folderPath.lastIndexOf('/'));
                   if (!folderPath || folderPath === 'output') {
                     folderPath = 'output';
                   }
                 }
                 
                 // Check if path contains seed (only known at generation time)
                 if (folderPath.includes('[seed-auto]')) {
                   // Check if seed is the last enabled segment - if so, we can open the parent folder
                   const enabledSegments = segments.filter(s => s.enabled);
                   const lastEnabledSegment = enabledSegments[enabledSegments.length - 1];
                   
                   // In SI mode we already stripped one level, so check second-to-last for seed
                   const segmentToCheck = isImageSaverMode ? lastEnabledSegment : enabledSegments[enabledSegments.length - 2];
                   
                   if (segmentToCheck && segmentToCheck.type === 'seed') {
                     // Seed is at the folder level we're trying to open - strip it too
                     folderPath = folderPath.replace(/\/?\[seed-auto\]$/, '');
                     if (!folderPath || folderPath === 'output/') {
                       folderPath = 'output';
                     }
                   } else if (folderPath.includes('[seed-auto]')) {
                     // Seed is in the middle of path - can't determine folder
                     showPathFlash('Cannot open: seed is in middle of path', 'rgba(245, 158, 11, 0.95)', '#000');
                     return;
                   }
                 }
                 
                  try {
                    // Blur the window first to allow Explorer to take focus
                    // (Windows blocks focus-stealing when the requesting app has focus)
                    window.blur();
                    
                    const response = await fetch('/flowpath/open_folder', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ path: folderPath })
                    });
                   
                   const result = await response.json();
                   
                   if (result.error === 'not_found') {
                     // Show yellow flash with "not found" message
                     showPathFlash('Folder not found', hexToRgba(theme.accent, 0.95), '#000');
                     
                     // Show action prompt below preview
                     showActionPrompt(`Create "${folderPath}" and open it?`, [
                       { label: 'Cancel', primary: false, onClick: hideActionPrompt },
                       { 
                         label: 'Create & Open', 
                         primary: true, 
                          onClick: async () => {
                            try {
                              // Blur window to allow Explorer to take focus
                              window.blur();
                              
                              const createResponse = await fetch('/flowpath/create_and_open_folder', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ path: folderPath })
                              });
                             const createResult = await createResponse.json();
                             if (createResult.success) {
                               showPathFlash('Folder created and opening folder...', 'rgba(34, 197, 94, 0.95)', '#fff', true);
                             } else if (createResult.error) {
                               showPathFlash('Failed: ' + createResult.error, 'rgba(239, 68, 68, 0.95)');
                             }
                           } catch (err) {
                             console.error('[FlowPath] Failed to create folder:', err);
                             showPathFlash('Failed to create folder', 'rgba(239, 68, 68, 0.95)');
                           }
                         }
                       }
                     ]);
                  } else if (result.success) {
                    // Show themed flash with animated diagonal lines
                    showPathFlash('Opening folder...', 'rgba(34, 197, 94, 0.95)', '#fff', true);
                  } else if (result.error) {
                    showPathFlash('Error: ' + result.error, 'rgba(239, 68, 68, 0.95)');
                  }
                } catch (err) {
                  console.error('[FlowPath] Failed to open folder:', err);
                  showPathFlash('Backend not available', 'rgba(239, 68, 68, 0.95)');
                }
              } else {
                // Regular click: Copy to clipboard
                try {
                  await navigator.clipboard.writeText(pathToCopy);
                  showPathFlash('Copied to clipboard', 'rgba(34, 197, 94, 0.95)');
                } catch (err) {
                  console.error('[FlowPath] Failed to copy path:', err);
                  showPathFlash('Failed to copy', 'rgba(239, 68, 68, 0.95)');
                }
              }
            };
          };
          
          // Helper to update preview and reattach listeners
          const updatePreview = () => {
            preview.innerHTML = buildPreviewHtml();
            attachModeButtonListeners();
            attachPathClickHandler();
          };
          
          updatePreview();
          container.appendChild(preview);

          // PATH SEGMENTS SECTION
          const segmentsSection = createSection(`${emojiWithSpace('📋')}Path Segments`, segmentsExpanded, () => {
            segmentsExpanded = !segmentsExpanded;
            renderUI();
            updateNodeSize();
          });
          container.appendChild(segmentsSection.section);
          
          // Add red warning overlay to segments header (for animated transitions)
          segmentsSection.header.style.position = 'relative';
          segmentsSection.header.style.overflow = 'hidden';
          
          const segmentsWarningOverlay = document.createElement("div");
          segmentsWarningOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, rgba(153, 27, 27, 0.8) 0%, rgba(220, 38, 38, 0.7) 50%, rgba(239, 68, 68, 0.8) 100%);
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            pointer-events: none;
            border-radius: 5px;
            z-index: 0;
          `;
          segmentsSection.header.insertBefore(segmentsWarningOverlay, segmentsSection.header.firstChild);
          
          // Make sure header content is above the overlay
          Array.from(segmentsSection.header.children).forEach(child => {
            if (child !== segmentsWarningOverlay) {
              child.style.position = 'relative';
              child.style.zIndex = '1';
            }
          });
          
          // Add warning text element inside segments header
          const segmentsWarningText = document.createElement("span");
          segmentsWarningText.style.cssText = `
            display: none;
            margin-left: auto;
            padding: 2px 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 10px;
            font-weight: 500;
            position: relative;
            z-index: 1;
          `;
          segmentsSection.header.appendChild(segmentsWarningText);

          if (segmentsExpanded) {
            segmentsContentEl = segmentsSection.content;

            // Simple handlers - document-level handles visual feedback
            const onSegmentsDragEnter = (e) => {
              if (draggedIndex === null) return;
              e.preventDefault();
              e.stopPropagation();
            };

            const onSegmentsDragOver = (e) => {
              if (draggedIndex === null) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
              // Visual feedback handled by document-level dragover
            };

            const onSegmentsDrop = (e) => {
              if (draggedIndex === null) return;
              e.preventDefault();
              e.stopPropagation();
              clearDropIndicator();

              const rowElements = Array.from(segmentsSection.content.querySelectorAll('[data-index]'));
              if (rowElements.length === 0) return;

              let insertIndex = rowElements.length;
              for (const rowEl of rowElements) {
                const idx = parseInt(rowEl.dataset.index, 10);
                if (Number.isNaN(idx)) continue;

                const rect = rowEl.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;

                if (e.clientY < midpoint) {
                  insertIndex = idx;
                  break;
                }
              }

              // Check if move would result in same position
              const finalIndex = insertIndex > draggedIndex ? insertIndex - 1 : insertIndex;
              if (finalIndex === draggedIndex) return;

              const [movedItem] = segments.splice(draggedIndex, 1);
              if (insertIndex > draggedIndex) insertIndex -= 1;
              segments.splice(insertIndex, 0, movedItem);


              activePresetName = null;
              updateWidgetData();
              renderUI();
              updateNodeSize();
            };

            // Use capture phase: ComfyUI/LiteGraph may intercept drag events on bubble phase.
            segmentsSection.content.addEventListener('dragenter', onSegmentsDragEnter, { capture: true });
            segmentsSection.content.addEventListener('dragover', onSegmentsDragOver, { capture: true });
            segmentsSection.content.addEventListener('drop', onSegmentsDrop, { capture: true });

            segments.forEach((segment, index) => {
              const segInfo = SEGMENT_TYPES[segment.type] || { icon: "❓", label: segment.type };
              
              // Check if this segment's config value is empty (for enabled segments with config)
              const configKey = segInfo.configKey;
              // For custom segments, the config key is dynamically generated
              const effectiveConfigKey = segment.type === 'custom' ? `custom_segment_${index}` : configKey;
              
              let isConfigEmpty = false;
              if (segment.enabled && segment.type !== 'seed') {
                // seed is auto-detected - don't mark as empty
                if (segment.type === 'custom') {
                  // For custom segments, check the segment.value
                  isConfigEmpty = !segment.value || !segment.value.trim();
                } else if (configKey) {
                  // For other segments, check the config value
                  const configValue = config[configKey];
                  isConfigEmpty = !configValue || (typeof configValue === 'string' && !configValue.trim());
                }
              }
              
              const row = document.createElement("div");
              row.draggable = true;
              row.dataset.index = index;
              row.dataset.configKey = effectiveConfigKey || ''; // Store config key for click handler
              row.title = segInfo.tooltip || ""; // Add tooltip
              
              // Base styling with red highlight if config is empty
              const baseBackground = segment.enabled ? theme.gradient : 'rgba(255, 255, 255, 0.03)';
              const emptyBackground = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))';
              const baseBorder = segment.enabled ? theme.primaryLight : 'rgba(255, 255, 255, 0.05)';
              const emptyBorder = 'rgba(239, 68, 68, 0.5)';
              
              // Start with base styling, then animate to red if empty
              row.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px;
                margin: 3px 0;
                background: ${baseBackground};
                border-radius: 6px;
                cursor: ${segment.enabled ? 'pointer' : 'move'};
                transition: background 0.4s ease-in-out, border-color 0.4s ease-in-out, box-shadow 0.4s ease-in-out;
                border: 1px solid ${baseBorder};
                position: relative;
              `;
              
              // Store reference for delayed red animation
              if (isConfigEmpty) {
                row.dataset.needsRedAnimation = 'true';
              }
              
              // Helper to check if config is currently empty (dynamic check)
              const checkConfigEmpty = () => {
                if (!segment.enabled || segment.type === 'seed') return false;
                if (segment.type === 'custom') {
                  return !segment.value || !segment.value.trim();
                } else if (configKey) {
                  const configValue = config[configKey];
                  return !configValue || (typeof configValue === 'string' && !configValue.trim());
                }
                return false;
              };
              
              // Show/hide delete button on hover (for cleaner UI)
              row.onmouseenter = () => {
                const deleteBtn = row.querySelector('.gensort-delete-btn');
                if (deleteBtn) {
                  deleteBtn.style.opacity = '1';
                  deleteBtn.style.pointerEvents = 'auto';
                }
                // Subtle highlight on hover (respect empty state - check dynamically)
                if (checkConfigEmpty()) {
                  row.style.borderColor = 'rgba(239, 68, 68, 0.8)';
                } else if (segment.enabled) {
                  row.style.borderColor = theme.primary;
                } else {
                  row.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }
              };
              
              row.onmouseleave = () => {
                const deleteBtn = row.querySelector('.gensort-delete-btn');
                // Hide delete button for all segments on mouse leave
                if (deleteBtn) {
                  deleteBtn.style.opacity = '0';
                  deleteBtn.style.pointerEvents = 'none';
                }
                // Reset border (respect empty state - check dynamically)
                if (checkConfigEmpty()) {
                  row.style.borderColor = emptyBorder;
                } else if (segment.enabled) {
                  row.style.borderColor = theme.primaryLight;
                } else {
                  row.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }
              };
              
              // Click handler to focus the corresponding config input
              row.onclick = (e) => {
                // Don't trigger if clicking on toggle, delete button, or drag handle
                if (e.target.closest('.gensort-delete-btn') || 
                    e.target.closest('input[type="checkbox"]') ||
                    e.target.textContent === '⋮⋮') {
                  return;
                }
                
                // Only navigate for enabled segments with config
                if (!segment.enabled || !effectiveConfigKey) return;
                
                // Skip segments that don't have editable config (seed is auto-detected)
                if (segment.type === 'seed') return;
                
                // Helper to scroll and focus input
                const scrollAndFocus = (inputKey, delay = 100) => {
                  setTimeout(() => {
                    const input = configInputElements[inputKey];
                    if (input) {
                      // Get the input's row/parent for better scroll positioning
                      const inputRow = input.closest('div[style*="display: flex"]') || input;
                      
                      // Flash highlight effect on the target row
                      const originalBg = inputRow.style.background;
                      inputRow.style.transition = 'background 0.15s ease-out';
                      inputRow.style.background = `${theme.accent}33`;
                      
                      // Scroll the input into view - centered for visibility
                      inputRow.scrollIntoView({ behavior: 'instant', block: 'center' });
                      
                      // Focus immediately after snap scroll
                      setTimeout(() => {
                        input.focus();
                        if (input.select) input.select();
                        
                        // Fade out highlight
                        setTimeout(() => {
                          inputRow.style.background = originalBg;
                        }, 300);
                      }, 50);
                    }
                  }, delay);
                };
                
                // Expand config section if collapsed
                if (!configExpanded) {
                  configExpanded = true;
                  renderUI();
                  updateNodeSize();
                  // Wait for render then scroll and focus
                  scrollAndFocus(effectiveConfigKey, 150);
                } else {
                  // Config already expanded, just scroll and focus
                  scrollAndFocus(effectiveConfigKey, 50);
                }
              };

              row.addEventListener('dragstart', (e) => {
                draggedIndex = index;
                row.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(index));
                e.stopPropagation();
              });

              // Track drop position (before or after current row)
              let dropPosition = 'after';

              row.addEventListener('dragend', (e) => {
                row.style.opacity = '1';
                draggedIndex = null;
                clearDropIndicator();
                e.stopPropagation();
              });

              row.addEventListener('dragenter', (e) => {
                if (draggedIndex === null) return;
                e.preventDefault();
                e.stopPropagation();
              }, { capture: true });

              row.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                if (draggedIndex !== null && draggedIndex !== index) {
                  // Track drop position for the drop handler
                  const rect = row.getBoundingClientRect();
                  const midpoint = rect.top + rect.height / 2;
                  dropPosition = e.clientY < midpoint ? 'before' : 'after';
                  // Visual feedback handled by document-level dragover
                }
              }, { capture: true });

              row.addEventListener('dragleave', (e) => {
                // Don't clear styles here - document-level handler manages all visual feedback
                e.stopPropagation();
              });

              row.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                clearDropIndicator();
                
                if (draggedIndex !== null && draggedIndex !== index) {
                  // Calculate correct insert index based on drop position
                  let insertIndex;
                  if (dropPosition === 'before') {
                    insertIndex = draggedIndex < index ? index - 1 : index;
                  } else {
                    insertIndex = draggedIndex < index ? index : index + 1;
                  }
                  
                  // Check if move would result in same position
                  if (insertIndex === draggedIndex) return;
                  
                  const [movedItem] = segments.splice(draggedIndex, 1);
                  if (insertIndex > draggedIndex) insertIndex -= 1;
                  segments.splice(insertIndex, 0, movedItem);
                  
                  
                  // Clear active preset on user modification
                  activePresetName = null;
                  
                  // Update widget data and re-render
                  updateWidgetData();
                  renderUI();
                  updateNodeSize();
                }
              }, { capture: true });

              const dragHandle = document.createElement("span");
              dragHandle.textContent = "⋮⋮";
              dragHandle.style.cssText = `
                margin-right: 8px;
                color: rgba(255, 255, 255, 0.5);
                user-select: none;
                font-size: 16px;
              `;
              row.appendChild(dragHandle);

              // Toggle indicator (filled/unfilled box) - positioned after drag handle
              const isEnabled = segment.enabled !== false;
              const toggleBox = document.createElement("div");
              toggleBox.className = "segment-toggle";
              toggleBox.title = isEnabled ? "Click to disable" : "Click to enable";
              toggleBox.style.cssText = `
                width: 12px;
                height: 12px;
                margin-right: 8px;
                border-radius: 3px;
                border: 2px solid ${isEnabled ? theme.accent : 'rgba(255, 255, 255, 0.3)'};
                background: ${isEnabled ? theme.accent : 'transparent'};
                cursor: pointer;
                transition: all 0.15s ease;
                flex-shrink: 0;
              `;
              toggleBox.onclick = (e) => {
                e.stopPropagation();
                segment.enabled = !segment.enabled;
                activePresetName = null;
                updateWidgetData();
                renderUI();
                updateNodeSize();
              };
              row.appendChild(toggleBox);

              const icon = document.createElement("span");
              icon.textContent = globalSettings.showEmojis ? segInfo.icon : '';
              icon.style.cssText = `
                margin-right: ${globalSettings.showEmojis ? '8px' : '0'};
                font-size: 16px;
                min-width: ${globalSettings.showEmojis ? '20px' : '0'};
              `;
              row.appendChild(icon);

              const label = document.createElement("span");
              if (segment.type === "custom" && segment.value) {
                label.textContent = segment.value;
              } else {
                label.textContent = segInfo.label;
              }
              label.style.cssText = `
                flex: 1;
                color: #fff;
                font-size: 13px;
                font-weight: 500;
              `;
              row.appendChild(label);

              const btnSize = "20px";
              
              // Edit button removed - custom segments now edited in Configuration section

              // Delete button (for ALL segments)
              const deleteBtn = document.createElement("button");
              deleteBtn.className = 'gensort-delete-btn';
              deleteBtn.textContent = "×";
              deleteBtn.title = "Remove this segment";
              deleteBtn.style.cssText = `
                width: ${btnSize};
                height: ${btnSize};
                padding: 0;
                background: rgba(255, 0, 0, 0.2);
                border: 1px solid rgba(255, 0, 0, 0.5);
                border-radius: 4px;
                color: #ff6b6b;
                cursor: pointer;
                margin-right: 6px;
                font-size: 16px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                opacity: 0;
                pointer-events: none;
              `;
              deleteBtn.onmouseover = () => {
                deleteBtn.style.background = 'rgba(255, 0, 0, 0.4)';
                deleteBtn.style.color = '#fff';
                deleteBtn.style.transform = 'scale(1.1)';
              };
              deleteBtn.onmouseout = () => {
                deleteBtn.style.background = 'rgba(255, 0, 0, 0.2)';
                deleteBtn.style.color = '#ff6b6b';
                deleteBtn.style.transform = 'scale(1)';
              };
              deleteBtn.onclick = (e) => {
                e.stopPropagation();
                segments.splice(index, 1);
                activePresetName = null; // Clear active preset on user modification
                updateWidgetData();
                renderUI();
                updateNodeSize();
              };
              row.appendChild(deleteBtn);

              segmentsSection.content.appendChild(row);
            });
            
            // Trigger smooth red animation for empty segments after DOM is ready
            setTimeout(() => {
              const rowsNeedingAnimation = segmentsSection.content.querySelectorAll('[data-needs-red-animation="true"]');
              rowsNeedingAnimation.forEach(row => {
                row.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))';
                row.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                row.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.3), inset 0 0 8px rgba(239, 68, 68, 0.05)';
              });
            }, 50);

            // Add segment dropdown
            const addSegmentContainer = document.createElement("div");
            addSegmentContainer.style.cssText = `
              margin-top: 12px;
              display: flex;
              gap: 8px;
              align-items: center;
            `;

            const addLabel = document.createElement("label");
            addLabel.textContent = "Add Segment:";
            addLabel.style.cssText = `
              color: rgba(255, 255, 255, 0.8);
              font-size: 12px;
              font-weight: 500;
            `;
            addSegmentContainer.appendChild(addLabel);

            // Custom dropdown button (solid background)
            const addSelectBtn = document.createElement("div");
            addSelectBtn.className = "flowpath-segment-dropdown-btn";
            addSelectBtn.style.cssText = `
              flex: 1;
              padding: 6px 12px;
              background: #1a1a1f;
              border: 1px solid ${theme.primaryLight};
              border-radius: 6px;
              color: rgba(255, 255, 255, 0.6);
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: space-between;
              user-select: none;
            `;
            addSelectBtn.innerHTML = `
              <span>-- Select to add --</span>
              <span style="font-size: 8px; opacity: 0.6;">▼</span>
            `;
            
            addSelectBtn.onmouseenter = () => {
              addSelectBtn.style.borderColor = theme.primary;
              addSelectBtn.style.background = '#252529';
            };
            addSelectBtn.onmouseleave = () => {
              addSelectBtn.style.borderColor = theme.primaryLight;
              addSelectBtn.style.background = '#1a1a1f';
            };

            // Get ALL segment types that aren't currently in segments
            const allSegmentTypes = Object.keys(SEGMENT_TYPES).filter(type => type !== 'custom');
            const availableTypes = allSegmentTypes.filter(
              type => !segments.some(s => s.type === type)
            );

            // Toggle dropdown on click
            addSelectBtn.onclick = (e) => {
              e.stopPropagation();
              
              // Check if dropdown already exists (toggle behavior)
              const existingDropdown = document.querySelector('.flowpath-segment-dropdown');
              if (existingDropdown) {
                existingDropdown.remove();
                return;
              }
              
              const dropdown = document.createElement('div');
              dropdown.className = 'flowpath-segment-dropdown';
              dropdown.style.cssText = `
                position: fixed;
                z-index: 10000;
                min-width: 200px;
                max-height: 280px;
                overflow-y: auto;
                background: #1a1a1f;
                border: 1px solid ${theme.primary};
                border-radius: 6px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05);
                padding: 4px 0;
                scrollbar-color: rgba(255, 255, 255, 0.18) rgba(255, 255, 255, 0.03);
              `;
              
              // Add themed scrollbar via inline style element (subtle glass style)
              const scrollStyle = document.createElement('style');
              scrollStyle.textContent = `
                .flowpath-segment-dropdown::-webkit-scrollbar {
                  width: 10px;
                }
                .flowpath-segment-dropdown::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.03);
                  border-radius: 5px;
                }
                .flowpath-segment-dropdown::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.18);
                  border-radius: 5px;
                  border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .flowpath-segment-dropdown::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.28);
                }
              `;
              dropdown.appendChild(scrollStyle);
              
              // Title
              const title = document.createElement('div');
              title.style.cssText = `
                padding: 6px 10px;
                font-size: 9px;
                font-weight: 600;
                color: ${theme.accent};
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 1px solid ${theme.primaryLight};
              `;
              title.textContent = 'Add Segment';
              dropdown.appendChild(title);
              
              // Add available segment options
              availableTypes.forEach(type => {
                const segInfo = SEGMENT_TYPES[type];
                const item = document.createElement('div');
                item.style.cssText = `
                  padding: 8px 12px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  transition: background 0.15s;
                `;
                
                if (globalSettings.showEmojis) {
                  const icon = document.createElement('span');
                  icon.textContent = segInfo.icon;
                  icon.style.fontSize = '14px';
                  item.appendChild(icon);
                }
                
                const label = document.createElement('span');
                label.textContent = segInfo.label;
                label.style.cssText = 'color: rgba(255, 255, 255, 0.9); font-size: 12px;';
                item.appendChild(label);
                
                if (segInfo.tooltip) {
                  item.title = segInfo.tooltip;
                }
                
                item.onmouseenter = () => {
                  item.style.background = theme.primaryLight;
                };
                item.onmouseleave = () => {
                  item.style.background = '';
                };
                
                item.onclick = () => {
                  segments.push({ type: type, enabled: true });
                  activePresetName = null;
                  updateWidgetData();
                  renderUI();
                  updateNodeSize();
                  dropdown.remove();
                };
                
                dropdown.appendChild(item);
              });
              
              // Divider before Custom
              const divider = document.createElement('div');
              divider.style.cssText = `height: 1px; background: ${theme.primaryLight}; margin: 4px 0;`;
              dropdown.appendChild(divider);
              
              // Custom option
              const customItem = document.createElement('div');
              customItem.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.15s;
              `;
              
              if (globalSettings.showEmojis) {
                const customIcon = document.createElement('span');
                customIcon.textContent = '✨';
                customIcon.style.fontSize = '14px';
                customItem.appendChild(customIcon);
              }
              
              const customLabel = document.createElement('span');
              customLabel.textContent = 'Custom';
              customLabel.style.cssText = 'color: rgba(255, 255, 255, 0.9); font-size: 12px;';
              customItem.appendChild(customLabel);
              
              customItem.onmouseenter = () => {
                customItem.style.background = theme.primaryLight;
              };
              customItem.onmouseleave = () => {
                customItem.style.background = '';
              };
              
              customItem.onclick = async () => {
                dropdown.remove();
                const name = await showInputDialog("Custom Template", "", "Example: {model}_{resolution}");
                if (name) {
                  segments.push({ type: "custom", value: name, enabled: true });
                  activePresetName = null;
                  updateWidgetData();
                  renderUI();
                  updateNodeSize();
                }
              };
              
              dropdown.appendChild(customItem);
              
              // Position dropdown
              const rect = addSelectBtn.getBoundingClientRect();
              dropdown.style.top = `${rect.bottom + 4}px`;
              dropdown.style.left = `${rect.left}px`;
              dropdown.style.minWidth = `${rect.width}px`;
              
              document.body.appendChild(dropdown);
              
              // Adjust if off-screen
              const dropRect = dropdown.getBoundingClientRect();
              if (dropRect.right > window.innerWidth) {
                dropdown.style.left = `${window.innerWidth - dropRect.width - 10}px`;
              }
              if (dropRect.bottom > window.innerHeight) {
                dropdown.style.top = `${rect.top - dropRect.height - 4}px`;
              }
              
              // Close handlers
              const closeDropdown = () => {
                if (!document.body.contains(dropdown)) return;
                dropdown.remove();
                document.removeEventListener('mousedown', closeHandler, true);
                document.removeEventListener('pointerdown', closeHandler, true);
                document.removeEventListener('wheel', wheelHandler, true);
                window.removeEventListener('blur', closeDropdown);
              };
              
              const closeHandler = (e) => {
                if (!dropdown.contains(e.target) && e.target !== addSelectBtn) {
                  closeDropdown();
                }
              };
              
              const wheelHandler = (e) => {
                if (!dropdown.contains(e.target)) {
                  closeDropdown();
                }
              };
              
              setTimeout(() => {
                document.addEventListener('mousedown', closeHandler, true);
                document.addEventListener('pointerdown', closeHandler, true);
                document.addEventListener('wheel', wheelHandler, true);
                window.addEventListener('blur', closeDropdown);
              }, 0);
            };

            addSegmentContainer.appendChild(addSelectBtn);
            segmentsSection.content.appendChild(addSegmentContainer);
          } else {
            segmentsContentEl = null;
          }

          // CONFIGURATION SECTION
          const configSection = createSection(`${emojiWithSpace('⚙️')}Configuration`, configExpanded, () => {
            configExpanded = !configExpanded;
            renderUI();
            updateNodeSize();
          });
          container.appendChild(configSection.section);

          // Add red warning overlay to header (for animated transitions)
          configSection.header.style.position = 'relative';
          configSection.header.style.overflow = 'hidden';
          
          const headerWarningOverlay = document.createElement("div");
          headerWarningOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, rgba(153, 27, 27, 0.8) 0%, rgba(220, 38, 38, 0.7) 50%, rgba(239, 68, 68, 0.8) 100%);
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            pointer-events: none;
            border-radius: 5px;
            z-index: 0;
          `;
          configSection.header.insertBefore(headerWarningOverlay, configSection.header.firstChild);
          
          // Add warning text element inside config header
          const configWarningText = document.createElement("span");
          configWarningText.style.cssText = `
            display: none;
            margin-left: auto;
            padding: 2px 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 10px;
            font-weight: 500;
            position: relative;
            z-index: 1;
          `;
          configSection.header.appendChild(configWarningText);
          
          // Make sure header content is above the overlay
          Array.from(configSection.header.children).forEach(child => {
            if (child !== headerWarningOverlay) {
              child.style.position = 'relative';
              child.style.zIndex = '1';
            }
          });

          // Function to check for empty fields and update header styling
          const updateConfigHeaderWarning = () => {
            const textFieldTypes = ["name", "project", "series", "resolution", "model", "lora", "date", "label"];
            const configKeys = { 
              name: "name", 
              project: "project_name", 
              series: "series_name", 
              resolution: "resolution", 
              model: "model_name", 
              lora: "lora_name",
              date: "date_format",
              label: "node_label"
            };
            
            const emptyFields = [];
            segments.forEach(seg => {
              if (seg.enabled === false) return;
              if (textFieldTypes.includes(seg.type)) {
                const key = configKeys[seg.type];
                if (!config[key] || !config[key].trim()) {
                  const segInfo = SEGMENT_TYPES[seg.type];
                  emptyFields.push(segInfo ? segInfo.label : seg.type);
                }
              }
              if (seg.type === "custom") {
                if (!seg.value || !seg.value.trim()) {
                  emptyFields.push("Custom Template");
                }
              }
            });
            
            const hasEmptyFields = emptyFields.length > 0;

            // Animate the overlay opacity
            headerWarningOverlay.style.opacity = hasEmptyFields ? '1' : '0';
            segmentsWarningOverlay.style.opacity = hasEmptyFields ? '1' : '0';
            
            // Update header borders to red when warning is active
            const warningBorder = 'rgba(239, 68, 68, 0.8)';
            const normalBorder = theme.primaryLight;
            configSection.header.style.borderColor = hasEmptyFields ? warningBorder : normalBorder;
            segmentsSection.header.style.borderColor = hasEmptyFields ? warningBorder : normalBorder;
            
            // Update warning text in both headers
            if (hasEmptyFields) {
              const fieldCount = emptyFields.length;
              const shortList = emptyFields.slice(0, 3).join(', ') + (emptyFields.length > 3 ? ` +${emptyFields.length - 3}` : '');
              const warningText = `⚠️ ${fieldCount} empty`;
              
              segmentsWarningText.textContent = warningText;
              segmentsWarningText.title = `Fields needing attention: ${emptyFields.join(', ')}. Click a segment to configure it.`;
              segmentsWarningText.style.display = 'inline-block';
              
              configWarningText.textContent = warningText;
              configWarningText.title = `Fields needing attention: ${emptyFields.join(', ')}`;
              configWarningText.style.display = 'inline-block';
            } else {
              segmentsWarningText.style.display = 'none';
              configWarningText.style.display = 'none';
            }
          };
          
          // Initial header styling check
          updateConfigHeaderWarning();

          if (configExpanded) {
            // Store references to inputs for dynamic updates
            let categoryInput = null;
            let nameInput = null;
            
            // Helper function to get appropriate name placeholder based on category
            const getNamePlaceholder = (category) => {
              return categoryNameExamples[category] || "Example: Umbrael";
            };
            
            // Map segment types to their config input definitions
            const configInputMap = {
              label: { key: "node_label", label: "Output Label", type: "text", placeholder: "Example: Main, Upscaled, Depth" },
              file_type: { key: "file_type", label: "File Type", type: "select", options: ["Image", "Video", "Audio", "3D Model", "Other"] },
              category: { key: "category", label: "Category", type: "select", options: ["Characters", "Concepts", "Locations", "Objects", "Other"] },
              name: { key: "name", label: "Name", type: "text", placeholder: getNamePlaceholder(config.category || "Characters") },
              content_rating: { key: "content_rating", label: "Content Rating", type: "select", options: ["SFW", "NSFW"] },
              project: { key: "project_name", label: "Project Name", type: "text", placeholder: "Example: Commission2024" },
              series: { key: "series_name", label: "Series Name", type: "text", placeholder: "Example: FantasyCollection" },
              resolution: { key: "resolution", label: "Resolution", type: "text", placeholder: "Example: 1024x1024" },
              model: { key: "model_name", label: "Model Name", type: "text", placeholder: "Example: waiIllustriousSDXL_v160" },
              // seed is EXCLUDED - it's always dynamic from KSampler, no manual input needed
              lora: { key: "lora_name", label: "LoRA Name", type: "text", placeholder: "Example: Umbrael_Prime_Illustrious_V1" },
              date: { key: "date_format", label: "Date Format", type: "text", placeholder: "Example: %Y-%m-%d" }
            };

            // Build config inputs in the same order as segments
            const configInputs = [];
            segments.forEach((segment, segIndex) => {
              if (segment.enabled && configInputMap[segment.type]) {
                configInputs.push(configInputMap[segment.type]);
              }
              // Add custom segments to config inputs for editing their template
              if (segment.type === "custom" && segment.enabled) {
                configInputs.push({
                  key: `custom_segment_${segIndex}`,
                  label: "Custom Segment",
                  type: "custom_segment",
                  segmentIndex: segIndex,
                  placeholder: "Template: {label}_{model}_{resolution}",
                  currentValue: segment.value || ""
                });
              }
            });

            if (configInputs.length === 0) {
              const emptyMsg = document.createElement("div");
              emptyMsg.textContent = "Enable segments to configure them";
              emptyMsg.style.cssText = `
                color: rgba(255, 255, 255, 0.4);
                font-size: 11px;
                font-style: italic;
                text-align: center;
                padding: 12px;
              `;
              configSection.content.appendChild(emptyMsg);
            } else {
              configInputs.forEach(item => {
                const row = document.createElement("div");
                
                // Check if this field is empty (for text fields)
                const isTextField = item.type === "text" || item.type === "custom_segment";
                let isRowEmpty = false;
                if (isTextField) {
                  if (item.type === "custom_segment") {
                    isRowEmpty = !item.currentValue || !item.currentValue.trim();
                  } else {
                    isRowEmpty = !config[item.key] || !config[item.key].trim();
                  }
                }
                
                row.style.cssText = `
                  display: flex;
                  align-items: center;
                  margin-bottom: 6px;
                  padding: 6px 8px;
                  border-radius: 6px;
                  transition: box-shadow 0.4s ease-in-out, background 0.4s ease-in-out;
                  background: ${isRowEmpty ? 'rgba(239, 68, 68, 0.08)' : 'transparent'};
                  box-shadow: ${isRowEmpty ? '0 0 10px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.05)' : 'none'};
                `;
                
                // Store reference for updating
                row.dataset.fieldKey = item.key || item.segmentIndex;

                const label = document.createElement("label");
                label.textContent = item.label + ":";
                label.style.cssText = `
                  flex: 0 0 120px;
                  color: ${isRowEmpty ? 'rgba(248, 113, 113, 0.9)' : 'rgba(255, 255, 255, 0.8)'};
                  font-size: 12px;
                  font-weight: 500;
                  transition: color 0.4s ease-in-out;
                `;
                row.appendChild(label);

                let input;
                if (item.type === "select") {
                  input = document.createElement("select");
                  input.className = "gensort-pro-select";
                  item.options.forEach(opt => {
                    const option = document.createElement("option");
                    option.value = opt;
                    option.textContent = opt;
                    option.style.cssText = `
                      background: #1a1a1a;
                      color: #fff;
                      padding: 4px;
                    `;
                    input.appendChild(option);
                  });
                  input.value = config[item.key] || item.options[0];
                  input.style.cssText = `
                    flex: 1;
                    padding: 6px 10px;
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3));
                    border: 1px solid ${theme.primaryLight};
                    border-radius: 6px;
                    color: #fff;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
                  `;
                  input.onfocus = () => {
                    input.style.borderColor = theme.primary;
                    input.style.boxShadow = `0 0 0 2px ${theme.primaryLight}`;
                  };
                  input.onblur = () => {
                    input.style.borderColor = theme.primaryLight;
                    input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                  };
                } else if (item.type === "checkbox") {
                  input = document.createElement("input");
                  input.type = "checkbox";
                  input.checked = config[item.key] || false;
                  input.style.cssText = `
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    accent-color: ${theme.accent};
                  `;
                } else if (item.type === "custom_segment") {
                  // Custom segment template input
                  input = document.createElement("input");
                  input.type = "text";
                  input.value = item.currentValue;
                  input.placeholder = item.placeholder || "Template: {model}_{resolution}";
                  
                  // Check if empty for initial styling
                  const isCustomEmpty = !item.currentValue || !item.currentValue.trim();
                  
                  input.style.cssText = `
                    flex: 1;
                    padding: 6px 10px;
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3));
                    border: 1px solid ${isCustomEmpty ? 'rgba(239, 68, 68, 0.7)' : theme.primaryLight};
                    border-radius: 6px;
                    color: #fff;
                    font-size: 12px;
                    transition: border-color 0.4s ease-in-out, box-shadow 0.4s ease-in-out;
                    box-shadow: ${isCustomEmpty ? '0 0 8px rgba(239, 68, 68, 0.4), inset 0 0 8px rgba(239, 68, 68, 0.15)' : 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'};
                  `;
                  
                  // Update function for empty state - updates input, row, and label
                  const updateCustomEmptyStyle = () => {
                    const isNowEmpty = !input.value || !input.value.trim();
                    if (isNowEmpty) {
                      // Input styling - red border and glow
                      input.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                      input.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.4), inset 0 0 8px rgba(239, 68, 68, 0.15)';
                      // Row styling - red background and glow
                      row.style.background = 'rgba(239, 68, 68, 0.08)';
                      row.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.05)';
                      // Label styling - red color
                      label.style.color = 'rgba(248, 113, 113, 0.9)';
                    } else {
                      // Input styling - normal (matches other inputs)
                      input.style.borderColor = theme.primaryLight;
                      input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                      // Row styling - normal
                      row.style.background = 'transparent';
                      row.style.boxShadow = 'none';
                      // Label styling - normal
                      label.style.color = 'rgba(255, 255, 255, 0.8)';
                    }
                  };
                  
                  input.onfocus = () => {
                    const isNowEmpty = !input.value || !input.value.trim();
                    if (isNowEmpty) {
                      input.style.borderColor = 'rgba(239, 68, 68, 0.9)';
                      input.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6), inset 0 0 8px rgba(239, 68, 68, 0.2)';
                    } else {
                      input.style.borderColor = theme.primary;
                      input.style.boxShadow = `0 0 0 2px ${theme.primaryLight}`;
                    }
                  };
                  input.onblur = () => {
                    updateCustomEmptyStyle();
                    updateConfigHeaderWarning();
                  };
                  input.oninput = () => {
                    updateCustomEmptyStyle();
                    updateConfigHeaderWarning();
                  };
                  // Special onchange for custom segments - update segment.value instead of config
                  input.onchange = () => {
                    segments[item.segmentIndex].value = input.value;
                    activePresetName = null; // Clear active preset on user modification
                    updateWidgetData();
                    updateConfigHeaderWarning();
                    renderUI(); // Re-render to update segment label in Path Segments section
                    updateNodeSize();
                  };
                  row.appendChild(input);
                  
                  // Store reference for click-to-focus from segment rows
                  configInputElements[item.key] = input;
                  
                  configSection.content.appendChild(row);
                  return; // Skip the default onchange and auto-detect button logic
                } else {
                  input = document.createElement("input");
                  input.type = "text";
                  input.value = config[item.key] || "";
                  input.placeholder = item.placeholder || item.label;
                  
                  // Check if field is empty and should be highlighted
                  const isEmpty = !config[item.key] || !config[item.key].trim();
                  
                  input.style.cssText = `
                    flex: 1;
                    padding: 6px 10px;
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3));
                    border: 1px solid ${isEmpty ? 'rgba(239, 68, 68, 0.7)' : theme.primaryLight};
                    border-radius: 6px;
                    color: #fff;
                    font-size: 12px;
                    transition: border-color 0.4s ease-in-out, box-shadow 0.4s ease-in-out;
                    box-shadow: ${isEmpty ? '0 0 8px rgba(239, 68, 68, 0.4), inset 0 0 8px rgba(239, 68, 68, 0.15)' : 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'};
                  `;
                  
                  // Store the updateEmptyStyle function for use in event handlers
                  // This updates input, row, and label styling based on empty state
                  const updateEmptyStyle = () => {
                    const isNowEmpty = !input.value || !input.value.trim();
                    if (isNowEmpty) {
                      // Input styling - red border and glow
                      input.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                      input.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.4), inset 0 0 8px rgba(239, 68, 68, 0.15)';
                      // Row styling - red background and glow
                      row.style.background = 'rgba(239, 68, 68, 0.08)';
                      row.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.05)';
                      // Label styling - red color
                      label.style.color = 'rgba(248, 113, 113, 0.9)';
                    } else {
                      // Input styling - normal
                      input.style.borderColor = theme.primaryLight;
                      input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                      // Row styling - normal
                      row.style.background = 'transparent';
                      row.style.boxShadow = 'none';
                      // Label styling - normal
                      label.style.color = 'rgba(255, 255, 255, 0.8)';
                    }
                  };
                  
                  input.onfocus = () => {
                    const isNowEmpty = !input.value || !input.value.trim();
                    if (isNowEmpty) {
                      input.style.borderColor = 'rgba(239, 68, 68, 0.9)';
                      input.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6), inset 0 0 8px rgba(239, 68, 68, 0.2)';
                    } else {
                      input.style.borderColor = theme.primary;
                      input.style.boxShadow = `0 0 0 2px ${theme.primaryLight}`;
                    }
                  };
                  input.onblur = () => {
                    updateEmptyStyle();
                    updateConfigHeaderWarning(); // Update header when field loses focus
                  };
                  // Also update on input to give immediate feedback
                  input.oninput = () => {
                    updateEmptyStyle();
                    config[item.key] = input.value; // Update config immediately for header check
                    updateConfigHeaderWarning(); // Update header in real-time
                    updateWidgetData();
                    
                    // Update output preview in real-time
                    updatePreview();
                    
                    // Update segment row styling in real-time
                    // Find the segment row with matching config key and update its styling
                    if (segmentsContentEl) {
                      const segmentRows = segmentsContentEl.querySelectorAll('[data-config-key]');
                      segmentRows.forEach(row => {
                        if (row.dataset.configKey === item.key) {
                          const isEmpty = !input.value || !input.value.trim();
                          const emptyBackground = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))';
                          const emptyBorder = 'rgba(239, 68, 68, 0.5)';
                          const baseBackground = theme.gradient;
                          const baseBorder = theme.primaryLight;
                          
                          if (isEmpty) {
                            row.style.background = emptyBackground;
                            row.style.borderColor = emptyBorder;
                            row.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.3), inset 0 0 8px rgba(239, 68, 68, 0.05)';
                          } else {
                            row.style.background = baseBackground;
                            row.style.borderColor = baseBorder;
                            row.style.boxShadow = '';
                          }
                        }
                      });
                    }
                  };
                }

                input.onchange = () => {
                  if (item.type === "checkbox") {
                    config[item.key] = input.checked;
                  } else {
                    config[item.key] = input.value;
                  }
                  
                  // Clear active preset on user modification
                  activePresetName = null;
                  
                  // Update header warning state
                  updateConfigHeaderWarning();
                  
                  // If category changed, update name placeholder
                  if (item.key === "category" && nameInput) {
                    const newPlaceholder = getNamePlaceholder(input.value);
                    nameInput.placeholder = newPlaceholder;
                  }
                  
                  updateWidgetData();
                  
                  // Update preview (don't call renderUI to avoid double-click accordion issue)
                  updatePreview();
                  
                  // For select inputs (dropdowns), update the corresponding segment row styling
                  if (item.type === "select" && segmentsContentEl) {
                    const segmentRows = segmentsContentEl.querySelectorAll('[data-config-key]');
                    segmentRows.forEach(row => {
                      if (row.dataset.configKey === item.key) {
                        // Select fields are never "empty" since they have default values
                        row.style.background = theme.gradient;
                        row.style.borderColor = theme.primaryLight;
                        row.style.boxShadow = '';
                      }
                    });
                  }
                };

                // Store references to category and name inputs for dynamic updates
                if (item.key === "category") {
                  categoryInput = input;
                } else if (item.key === "name") {
                  nameInput = input;
                }

                row.appendChild(input);
                
                // Store reference for click-to-focus from segment rows
                configInputElements[item.key] = input;

                // Add auto-detect button for Model, LoRA, and Resolution fields
                if (item.key === "model_name" || item.key === "lora_name" || item.key === "resolution") {
                  const detectBtn = document.createElement("button");
                  detectBtn.textContent = "↻";
                  let titleText = "Auto-detect from workflow";
                  if (item.key === "model_name") titleText = "Auto-detect model from workflow";
                  else if (item.key === "lora_name") titleText = "Auto-detect LoRAs from workflow";
                  else if (item.key === "resolution") titleText = "Auto-detect resolution from workflow";
                  detectBtn.title = titleText;
                  detectBtn.style.cssText = `
                    margin-left: 6px;
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    background: ${theme.accent};
                    border: 1px solid ${theme.accent};
                    border-radius: 6px;
                    color: rgba(0, 0, 0, 0.8);
                    font-size: 20px;
                    font-weight: 900;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    -webkit-text-stroke: 1.5px rgba(0, 0, 0, 0.8);
                    paint-order: stroke fill;
                  `;
                  
                  detectBtn.onmouseenter = () => {
                    detectBtn.style.background = theme.accent;
                    detectBtn.style.transform = "scale(1.15)";
                    detectBtn.style.filter = 'brightness(1.2)';
                    detectBtn.style.boxShadow = `0 2px 8px ${theme.accent}`;
                  };
                  
                  detectBtn.onmouseleave = () => {
                    detectBtn.style.background = theme.accent;
                    detectBtn.style.transform = "scale(1)";
                    detectBtn.style.filter = 'brightness(1)';
                    detectBtn.style.boxShadow = 'none';
                  };

                  detectBtn.onclick = () => {
                    
                    // Show loading spinner
                    detectBtn.textContent = "⏳";
                    detectBtn.disabled = true;
                    detectBtn.style.cursor = "wait";
                    
                    // Use setTimeout to allow UI to update before detection
                    setTimeout(() => {
                      try {
                        
                        if (item.key === "model_name") {
                        // Detect model
                        const detected = detectModelFromWorkflow(app.graph);
                        
                        if (detected) {
                          const modelName = detected.model || detected; // Handle both old string and new object format
                          input.value = modelName;
                          config[item.key] = modelName;
                          activePresetName = null; // Clear active preset on auto-detect modification
                          updateWidgetData();
                          updatePreview();
                          
                          // Remove red highlight since field is now filled - input, row, and label
                          input.style.borderColor = theme.primaryLight;
                          input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                          row.style.background = 'transparent';
                          row.style.boxShadow = 'none';
                          label.style.color = 'rgba(255, 255, 255, 0.8)';
                          
                          // Update config header warning
                           updateConfigHeaderWarning();
                           
                           // Re-render UI to update segment row styling (removes red warning)
                           renderUI();
                           updateNodeSize();
                           
                           // Toast notification with multiple model warning
                           if (detected.total > 1) {
                             showToast(`Model detected: ${modelName} (${detected.total} checkpoint nodes found, using first)`, "success", 4000);
                           } else {
                             showToast(`Model detected: ${modelName}`, "success");
                           }
                        } else {
                          // No model found
                          detectBtn.textContent = "❌";
                          setTimeout(() => { detectBtn.textContent = "↻"; }, 1000);
                          console.warn("[FlowPath] No checkpoint node found in workflow");
                          
                          // Toast notification
                          showToast("No checkpoint node found in workflow", "error");
                        }
                      } else if (item.key === "lora_name") {
                        // Detect LoRAs
                        const detected = detectLorasFromWorkflow(app.graph);
                        
                        if (detected && detected.length > 0) {
                          const formatted = formatLoraPath(detected, globalSettings.loraPathFormat);
                          
                          // Handle separate folders mode (returns array)
                          if (Array.isArray(formatted)) {
                            // For separate mode, join with special delimiter that backend can split
                            const joinedValue = formatted.join(" | ");
                            input.value = formatted.join(", "); // Display with commas
                            config[item.key] = joinedValue; // Store as delimited string for backend
                          } else {
                            input.value = formatted;
                            config[item.key] = formatted;
                          }
                          
                          activePresetName = null; // Clear active preset on auto-detect modification
                          updateWidgetData();
                          
                          updatePreview();
                          
                          // Remove red highlight since field is now filled - input, row, and label
                          input.style.borderColor = theme.primaryLight;
                          input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                          row.style.background = 'transparent';
                          row.style.boxShadow = 'none';
                          label.style.color = 'rgba(255, 255, 255, 0.8)';
                          
                          // Update config header warning
                           updateConfigHeaderWarning();
                           
                           // Re-render UI to update segment row styling (removes red warning)
                           renderUI();
                           updateNodeSize();
                           
                           // Toast notification
                           const loraCount = Array.isArray(detected) ? detected.length : 1;
                           showToast(`Detected ${loraCount} LoRA${loraCount > 1 ? 's' : ''}`, "success");
                         } else {
                           // No LoRAs found
                          detectBtn.textContent = "❌";
                          setTimeout(() => { detectBtn.textContent = "↻"; }, 1000);
                          console.warn("[FlowPath] No LoRA nodes found in workflow");
                          
                          // Toast notification
                          showToast("No LoRA nodes found in workflow", "error");
                        }
                      } else if (item.key === "resolution") {
                        // Detect Resolution
                        const detected = detectResolutionFromWorkflow(app.graph);
                        
                        if (detected) {
                          const resolutionValue = detected.resolution || detected; // Handle both old string and new object format
                          input.value = resolutionValue;
                          config[item.key] = resolutionValue;
                          activePresetName = null; // Clear active preset on auto-detect modification
                          updateWidgetData();
                          updatePreview();
                          
                          // Remove red highlight since field is now filled - input, row, and label
                          input.style.borderColor = theme.primaryLight;
                          input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                          row.style.background = 'transparent';
                          row.style.boxShadow = 'none';
                          label.style.color = 'rgba(255, 255, 255, 0.8)';
                          
                          // Update config header warning
                           updateConfigHeaderWarning();
                           
                           // Re-render UI to update segment row styling (removes red warning)
                           renderUI();
                           updateNodeSize();
                           
                           // Toast notification with multiple node warning
                           if (detected.total > 1) {
                             showToast(`Resolution detected: ${resolutionValue} (${detected.total} latent nodes found, using first)`, "success", 4000);
                           } else {
                             showToast(`Resolution detected: ${resolutionValue}`, "success");
                           }
                         } else {
                           // No resolution found
                          detectBtn.textContent = "❌";
                          setTimeout(() => { detectBtn.textContent = "↻"; }, 1000);
                          console.warn("[FlowPath] No latent image node found in workflow");
                          
                          // Toast notification
                          showToast("No latent image node found in workflow", "error");
                        }
                        }
                      } catch (error) {
                        console.error("[FlowPath] Auto-detection error:", error);
                        console.error("[FlowPath] Error stack:", error.stack);
                        detectBtn.textContent = "⚠️";
                        setTimeout(() => { 
                          detectBtn.textContent = "↻";
                          detectBtn.disabled = false;
                          detectBtn.style.cursor = "pointer";
                        }, 1500);
                        
                        // Toast notification for error
                        showToast(`Detection failed: ${error.message}`, "error", 4000);
                      } finally {
                        // Re-enable button after a short delay
                        setTimeout(() => {
                          detectBtn.disabled = false;
                          detectBtn.style.cursor = "pointer";
                        }, 1100);
                      }
                    }, 50); // Small delay to allow UI update
                  };

                  row.appendChild(detectBtn);
                }

                configSection.content.appendChild(row);
              });
            }
          }

          // FILENAME SECTION (for Image Saver compatibility) - only show in Image Saver mode
          const isImageSaverMode = config.output_mode === 'imageSaver';
          const isFilenameEmpty = !config.filename_template || !config.filename_template.trim();
          
          if (isImageSaverMode) {
            const filenameSection = createSection(`${emojiWithSpace('📝')}Filename`, filenameExpanded, () => {
              filenameExpanded = !filenameExpanded;
              renderUI();
              updateNodeSize();
            });
            
            // Add red warning overlay to filename header (same as segments/config)
            filenameSection.header.style.position = 'relative';
            filenameSection.header.style.overflow = 'hidden';
            filenameSection.header.style.transition = 'border-color 0.5s ease-in-out';
            
            const filenameWarningOverlay = document.createElement("div");
            filenameWarningOverlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(90deg, rgba(153, 27, 27, 0.8) 0%, rgba(220, 38, 38, 0.7) 50%, rgba(239, 68, 68, 0.8) 100%);
              opacity: ${isFilenameEmpty ? '1' : '0'};
              transition: opacity 0.5s ease-in-out;
              pointer-events: none;
              border-radius: 5px;
              z-index: 0;
            `;
            filenameSection.header.insertBefore(filenameWarningOverlay, filenameSection.header.firstChild);
            
            // Update header border based on warning state
            filenameSection.header.style.borderColor = isFilenameEmpty ? 'rgba(239, 68, 68, 0.8)' : theme.primaryLight;
            
            // Add warning text element inside filename header
            const filenameWarningText = document.createElement("span");
            filenameWarningText.style.cssText = `
              display: ${isFilenameEmpty ? 'inline-block' : 'none'};
              margin-left: auto;
              padding: 2px 8px;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 4px;
              color: rgba(255, 255, 255, 0.9);
              font-size: 10px;
              font-weight: 500;
              position: relative;
              z-index: 1;
            `;
            // Helper to count empty variables in filename template
            const countEmptyVarsInFilename = () => {
              const template = config.filename_template || "";
              if (!template) return { isEmpty: true, emptyVars: 0 };
              
              // Variables that require both segment AND config value
              const varMappings = [
                { var: '{name}', configKey: 'name', segmentType: 'name' },
                { var: '{project}', configKey: 'project_name', segmentType: 'project' },
                { var: '{series}', configKey: 'series_name', segmentType: 'series' },
                { var: '{label}', configKey: 'node_label', segmentType: 'output_label' },
                { var: '{lora}', configKey: 'lora_name', segmentType: 'lora' },
                { var: '{model}', configKey: 'model_name', segmentType: 'model' },
                { var: '{category}', configKey: 'category', segmentType: 'category' },
                { var: '{rating}', configKey: 'content_rating', segmentType: 'content_rating' },
                { var: '{resolution}', configKey: 'resolution', segmentType: 'resolution' },
                { var: '{seed}', configKey: null, segmentType: 'seed' }, // Dynamic, but needs segment
                { var: '{date}', configKey: null, segmentType: 'date' }, // Needs date segment
                // {counter}, {year}, {month}, {day} are always available - no segment required
              ];
              
              let emptyCount = 0;
              const templateLower = template.toLowerCase();
              
              for (const item of varMappings) {
                if (templateLower.includes(item.var)) {
                  // Check if segment exists and is enabled
                  const segmentExists = segments.some(s => s.type === item.segmentType && s.enabled);
                  // Check if config has value (for vars with configKey)
                  const hasConfigValue = item.configKey === null || (config[item.configKey] && config[item.configKey].trim());
                  
                  // Count as empty if segment doesn't exist OR config is empty
                  if (!segmentExists || !hasConfigValue) {
                    emptyCount++;
                  }
                }
              }
              return { isEmpty: false, emptyVars: emptyCount };
            };
            
            // Helper to update filename warning state
            // Gradient definitions for warnings
            const redGradient = 'linear-gradient(90deg, rgba(153, 27, 27, 0.8) 0%, rgba(220, 38, 38, 0.7) 50%, rgba(239, 68, 68, 0.8) 100%)';
            const yellowGradient = 'linear-gradient(90deg, rgba(133, 100, 4, 0.8) 0%, rgba(180, 140, 20, 0.7) 50%, rgba(250, 204, 21, 0.8) 100%)';
            
            const updateFilenameWarning = () => {
              const { isEmpty, emptyVars } = countEmptyVarsInFilename();
              const templateEmpty = !config.filename_template || !config.filename_template.trim();
              const templateLower = (config.filename_template || "").toLowerCase();
              const hasCounter = templateLower.includes('{counter}');
              const hasTime = templateLower.includes('%time');
              const hasCounterAndTime = hasCounter && hasTime;
              
              const hasRedWarning = templateEmpty || emptyVars > 0;
              const hasYellowWarning = hasCounterAndTime && !hasRedWarning;
              const hasWarning = hasRedWarning || hasYellowWarning;
              
              filenameWarningOverlay.style.opacity = hasWarning ? '1' : '0';
              filenameWarningOverlay.style.background = hasRedWarning ? redGradient : yellowGradient;
              filenameWarningText.style.display = hasWarning ? 'inline-block' : 'none';
              filenameWarningText.style.color = 'rgba(255, 255, 255, 0.9)';
              
              if (templateEmpty) {
                filenameWarningText.textContent = "⚠️ empty";
                filenameWarningText.title = "Filename pattern is empty";
              } else if (emptyVars > 0) {
                filenameWarningText.textContent = `⚠️ ${emptyVars} empty var${emptyVars > 1 ? 's' : ''}`;
                filenameWarningText.title = `${emptyVars} variable${emptyVars > 1 ? 's' : ''} in pattern ${emptyVars > 1 ? 'have' : 'has'} no value set`;
              } else if (hasCounterAndTime) {
                filenameWarningText.textContent = "⚠️ redundant";
                filenameWarningText.title = "Both {counter} and %time provide uniqueness. Counter may not increment reliably when combined with %time.";
              }
              
              const borderColor = hasRedWarning ? 'rgba(239, 68, 68, 0.8)' : (hasYellowWarning ? 'rgba(250, 204, 21, 0.6)' : theme.primaryLight);
              filenameSection.header.style.borderColor = borderColor;
            };
            
            const { isEmpty: initialIsEmpty, emptyVars: initialEmptyVars } = countEmptyVarsInFilename();
            const initialTemplateLower = (config.filename_template || "").toLowerCase();
            const initialHasCounter = initialTemplateLower.includes('{counter}');
            const initialHasTime = initialTemplateLower.includes('%time');
            const initialHasCounterAndTime = initialHasCounter && initialHasTime;
            const initialHasRedWarning = isFilenameEmpty || initialEmptyVars > 0;
            const initialHasYellowWarning = initialHasCounterAndTime && !initialHasRedWarning;
            const initialHasWarning = initialHasRedWarning || initialHasYellowWarning;
            // Update initial display state to include warnings
            filenameWarningOverlay.style.opacity = initialHasWarning ? '1' : '0';
            filenameWarningOverlay.style.background = initialHasRedWarning ? redGradient : yellowGradient;
            filenameWarningText.style.display = initialHasWarning ? 'inline-block' : 'none';
            filenameWarningText.style.color = 'rgba(255, 255, 255, 0.9)';
            filenameSection.header.style.borderColor = initialHasRedWarning ? 'rgba(239, 68, 68, 0.8)' : (initialHasYellowWarning ? 'rgba(250, 204, 21, 0.6)' : theme.primaryLight);
            if (isFilenameEmpty) {
              filenameWarningText.textContent = "⚠️ empty";
              filenameWarningText.title = "Filename pattern is empty";
            } else if (initialEmptyVars > 0) {
              filenameWarningText.textContent = `⚠️ ${initialEmptyVars} empty var${initialEmptyVars > 1 ? 's' : ''}`;
              filenameWarningText.title = `${initialEmptyVars} variable${initialEmptyVars > 1 ? 's' : ''} in pattern ${initialEmptyVars > 1 ? 'have' : 'has'} no value set`;
            } else if (initialHasCounterAndTime) {
              filenameWarningText.textContent = "⚠️ redundant";
              filenameWarningText.title = "Both {counter} and %time provide uniqueness. Counter may not increment reliably when combined with %time.";
            }
            filenameSection.header.appendChild(filenameWarningText);
            
            // Make sure header content is above the overlay
            Array.from(filenameSection.header.children).forEach(child => {
              if (child !== filenameWarningOverlay) {
                child.style.position = 'relative';
                child.style.zIndex = '1';
              }
            });
            
            container.appendChild(filenameSection.section);

            if (filenameExpanded) {
            // Filename preview (moved to top, above pattern input)
            const filenamePreview = document.createElement("div");
            const previewIsEmpty = isFilenameEmpty;
            filenamePreview.style.cssText = `
              margin-bottom: 10px;
              padding: 8px 10px;
              background: ${previewIsEmpty ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.3)'};
              border-radius: 6px;
              border-left: 3px solid ${previewIsEmpty ? 'rgba(239, 68, 68, 0.7)' : theme.secondary};
              font-family: 'Consolas', 'Monaco', monospace;
              font-size: 11px;
              transition: all 0.3s ease;
            `;
            
            // Build filename preview
            let filenamePreviewText = config.filename_template || "(empty - Image Saver will use its default)";
            if (config.filename_template) {
              filenamePreviewText = replaceTemplateVars(config.filename_template, true);
            }
            
            const previewColor = previewIsEmpty ? 'rgba(239, 68, 68, 0.8)' : '#fff';
            // Security: escape user content to prevent XSS
            filenamePreview.innerHTML = `<span style="color: rgba(255, 255, 255, 0.6);">Preview:</span> <span style="color: ${previewColor}; ${previewIsEmpty ? 'font-style: italic;' : ''}">${escapeHtml(filenamePreviewText)}</span>`;
            filenameSection.content.appendChild(filenamePreview);

            // Filename input row with info icon
            const filenameInputRow = document.createElement("div");
            filenameInputRow.style.cssText = `
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              gap: 6px;
            `;

            const filenameLabel = document.createElement("label");
            filenameLabel.textContent = "Pattern:";
            filenameLabel.style.cssText = `
              flex: 0 0 auto;
              color: rgba(255, 255, 255, 0.8);
              font-size: 12px;
              font-weight: 500;
            `;
            filenameInputRow.appendChild(filenameLabel);
            
            // Info icon with tooltip
            const infoIcon = document.createElement("span");
            infoIcon.textContent = "i";
            infoIcon.title = "Build filename pattern for Image Saver.\\n\\n• {variables} - FlowPath values (replaced before saving)\\n• %variables - Image Saver values (processed by Image Saver)\\n\\n{counter} - Scans output folder and continues from highest number (0001, 0002...)\\n%counter - Image Saver's counter (starts at 0, less reliable)\\n\\nExample: {counter}_{name} or {name}_%seed";
            infoIcon.style.cssText = `
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: rgba(255,255,255,0.1);
              border: 1px solid rgba(255,255,255,0.2);
              color: rgba(255,255,255,0.5);
              font-size: 9px;
              font-weight: bold;
              font-style: italic;
              font-family: Georgia, serif;
              cursor: help;
              flex-shrink: 0;
            `;
            filenameInputRow.appendChild(infoIcon);

            const filenameInput = document.createElement("input");
            filenameInput.type = "text";
            filenameInput.value = config.filename_template || "";
            filenameInput.placeholder = "Example: {counter}_{name} or {name}_%seed";
            filenameInput.style.cssText = `
              flex: 1;
              padding: 8px 10px;
              background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3));
              border: 1px solid ${theme.primaryLight};
              border-radius: 6px;
              color: #fff;
              font-size: 12px;
              font-family: 'Consolas', 'Monaco', monospace;
              transition: all 0.2s;
            `;
            filenameInput.onfocus = () => {
              filenameInput.style.borderColor = theme.primary;
              filenameInput.style.boxShadow = `0 0 0 2px ${theme.primaryLight}`;
            };
            filenameInput.onblur = () => {
              filenameInput.style.borderColor = theme.primaryLight;
              filenameInput.style.boxShadow = 'none';
            };
            // Real-time preview update as user types
            filenameInput.oninput = () => {
              config.filename_template = filenameInput.value;
              updateWidgetData();
              updatePreview();
              // Update the local preview in filename section
              const isEmpty = !filenameInput.value.trim();
              let previewText = filenameInput.value || "(empty - Image Saver will use its default)";
              if (filenameInput.value) {
                previewText = replaceTemplateVars(filenameInput.value, true);
              }
              const pColor = isEmpty ? 'rgba(239, 68, 68, 0.8)' : '#fff';
              // Security: escape user content to prevent XSS
              filenamePreview.innerHTML = `<span style="color: rgba(255, 255, 255, 0.6);">Preview:</span> <span style="color: ${pColor}; ${isEmpty ? 'font-style: italic;' : ''}">${escapeHtml(previewText)}</span>`;
              filenamePreview.style.background = isEmpty ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.3)';
              filenamePreview.style.borderLeftColor = isEmpty ? 'rgba(239, 68, 68, 0.7)' : theme.secondary;
              
              // Update warning for empty template or empty variables
              updateFilenameWarning();
            };
            filenameInput.onchange = () => {
              config.filename_template = filenameInput.value;
              activePresetName = null;
              updateWidgetData();
              // Don't call renderUI() here - it breaks variable button clicks
              // The oninput handler already updates the preview
            };
            filenameInputRow.appendChild(filenameInput);
            filenameSection.content.appendChild(filenameInputRow);

            // Quick-insert buttons container
            const quickInsertContainer = document.createElement("div");
            quickInsertContainer.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 8px;
            `;

            // FlowPath variables section
            const flowPathVarsLabel = document.createElement("div");
            flowPathVarsLabel.style.cssText = `
              color: ${theme.accent};
              font-size: 11px;
              font-weight: 600;
              margin-bottom: 2px;
            `;
            flowPathVarsLabel.textContent = "FlowPath Variables:";
            quickInsertContainer.appendChild(flowPathVarsLabel);

            const flowPathVars = [
              { var: "{counter}", label: "Counter (scans folder)", configKey: null, segmentType: null }, // Always available
              { var: "{name}", label: "Name", configKey: "name", segmentType: "name" },
              { var: "{project}", label: "Project", configKey: "project_name", segmentType: "project" },
              { var: "{series}", label: "Series", configKey: "series_name", segmentType: "series" },
              { var: "{label}", label: "Label", configKey: "node_label", segmentType: "output_label" },
              { var: "{model}", label: "Model", configKey: "model_name", segmentType: "model" },
              { var: "{lora}", label: "LoRA", configKey: "lora_name", segmentType: "lora" },
              { var: "{seed}", label: "Seed (dynamic)", configKey: null, segmentType: "seed" }, // Dynamic at runtime
              { var: "{category}", label: "Category", configKey: "category", segmentType: "category" },
              { var: "{rating}", label: "Rating (SFW/NSFW)", configKey: "content_rating", segmentType: "content_rating" },
              { var: "{resolution}", label: "Resolution", configKey: "resolution", segmentType: "resolution" },
              { var: "{date}", label: "Date", configKey: null, segmentType: "date" },
              { var: "{year}", label: "Year", configKey: null, segmentType: null }, // Always available
              { var: "{month}", label: "Month", configKey: null, segmentType: null }, // Always available
              { var: "{day}", label: "Day", configKey: null, segmentType: null } // Always available
            ];

            const flowPathBtnsRow = document.createElement("div");
            flowPathBtnsRow.style.cssText = `
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
            `;

            flowPathVars.forEach(item => {
              // Check if segment exists and is enabled (for segment-based vars)
              const segmentExists = item.segmentType === null || segments.some(s => s.type === item.segmentType && s.enabled);
              // Check if variable has a value (config has data)
              const hasConfigValue = item.configKey === null || (config[item.configKey] && config[item.configKey].trim());
              // Variable is "active" only if segment exists AND has value (or is always-available like counter/year/month/day)
              const hasValue = segmentExists && hasConfigValue;
              
              const btn = document.createElement("button");
              btn.textContent = item.var;
              let tooltip = `Insert ${item.label}`;
              if (!hasValue) {
                if (!segmentExists && item.segmentType) {
                  tooltip += ` (segment not added - add "${item.segmentType}" segment first)`;
                } else if (!hasConfigValue && item.configKey) {
                  tooltip += ` (currently empty - set value in segments)`;
                }
              }
              btn.title = tooltip;
              btn.style.cssText = `
                padding: 4px 8px;
                background: ${hasValue ? theme.primaryLight : 'rgba(100, 100, 100, 0.3)'};
                border: 1px solid ${hasValue ? theme.primary : 'rgba(150, 150, 150, 0.4)'};
                border-radius: 4px;
                color: ${hasValue ? '#fff' : 'rgba(255, 255, 255, 0.4)'};
                font-size: 10px;
                font-family: 'Consolas', 'Monaco', monospace;
                cursor: pointer;
                transition: all 0.2s;
              `;
              btn.onmouseover = () => {
                btn.style.background = hasValue ? theme.primary : 'rgba(120, 120, 120, 0.4)';
                btn.style.transform = 'scale(1.05)';
              };
              btn.onmouseout = () => {
                btn.style.background = hasValue ? theme.primaryLight : 'rgba(100, 100, 100, 0.3)';
                btn.style.transform = 'scale(1)';
              };
              btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Insert at cursor position or end
                const cursorPos = filenameInput.selectionStart ?? filenameInput.value.length;
                const textBefore = filenameInput.value.substring(0, cursorPos);
                const textAfter = filenameInput.value.substring(cursorPos);
                filenameInput.value = textBefore + item.var + textAfter;
                config.filename_template = filenameInput.value;
                activePresetName = null;
                updateWidgetData();
                // Update preview without full re-render
                updatePreview();
                // Update filename section preview and warning
                const previewText = replaceTemplateVars(filenameInput.value, true);
                // Security: escape user content to prevent XSS
                filenamePreview.innerHTML = `<span style="color: rgba(255, 255, 255, 0.6);">Preview:</span> <span style="color: #fff;">${escapeHtml(previewText)}</span>`;
                filenamePreview.style.background = 'rgba(0, 0, 0, 0.3)';
                filenamePreview.style.borderLeftColor = theme.secondary;
                updateFilenameWarning();
                filenameInput.focus();
                filenameInput.setSelectionRange(cursorPos + item.var.length, cursorPos + item.var.length);
              };
              flowPathBtnsRow.appendChild(btn);
            });
            quickInsertContainer.appendChild(flowPathBtnsRow);

            // Image Saver variables section - same styling as FlowPath vars
            const imageSaverVarsLabel = document.createElement("div");
            imageSaverVarsLabel.style.cssText = `
              color: ${theme.accent};
              font-size: 11px;
              font-weight: 600;
              margin-top: 8px;
              margin-bottom: 2px;
              padding-top: 6px;
              border-top: 1px solid ${theme.primaryLight};
            `;
            imageSaverVarsLabel.textContent = "Image Saver Variables (pass-through):";
            quickInsertContainer.appendChild(imageSaverVarsLabel);

            const imageSaverVars = [
              { var: "%seed", label: "Seed" },
              { var: "%time", label: "Time" },
              { var: "%date", label: "Date" },
              { var: "%model", label: "Model" },
              { var: "%width", label: "Width" },
              { var: "%height", label: "Height" }
            ];

            const imageSaverBtnsRow = document.createElement("div");
            imageSaverBtnsRow.style.cssText = `
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
            `;

            imageSaverVars.forEach(item => {
              const btn = document.createElement("button");
              btn.textContent = item.var;
              btn.title = `Insert ${item.label} (processed by Image Saver node)`;
              btn.style.cssText = `
                padding: 4px 8px;
                background: ${theme.primaryLight};
                border: 1px solid ${theme.primary};
                border-radius: 4px;
                color: #fff;
                font-size: 10px;
                font-family: 'Consolas', 'Monaco', monospace;
                cursor: pointer;
                transition: all 0.2s;
              `;
              btn.onmouseover = () => {
                btn.style.background = theme.primary;
                btn.style.transform = 'scale(1.05)';
              };
              btn.onmouseout = () => {
                btn.style.background = theme.primaryLight;
                btn.style.transform = 'scale(1)';
              };
              btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Insert at cursor position or end
                const cursorPos = filenameInput.selectionStart ?? filenameInput.value.length;
                const textBefore = filenameInput.value.substring(0, cursorPos);
                const textAfter = filenameInput.value.substring(cursorPos);
                filenameInput.value = textBefore + item.var + textAfter;
                config.filename_template = filenameInput.value;
                activePresetName = null;
                updateWidgetData();
                // Update preview without full re-render
                updatePreview();
                // Update filename section preview and warning
                const previewText = replaceTemplateVars(filenameInput.value, true);
                // Security: escape user content to prevent XSS
                filenamePreview.innerHTML = `<span style="color: rgba(255, 255, 255, 0.6);">Preview:</span> <span style="color: #fff;">${escapeHtml(previewText)}</span>`;
                filenamePreview.style.background = 'rgba(0, 0, 0, 0.3)';
                filenamePreview.style.borderLeftColor = theme.secondary;
                updateFilenameWarning();
                filenameInput.focus();
                filenameInput.setSelectionRange(cursorPos + item.var.length, cursorPos + item.var.length);
              };
              imageSaverBtnsRow.appendChild(btn);
            });
            quickInsertContainer.appendChild(imageSaverBtnsRow);

            filenameSection.content.appendChild(quickInsertContainer);
            }
          }

          // PRESETS SECTION
          const presetsSection = createSection(`${emojiWithSpace('💾')}Presets`, presetsExpanded, () => {
            presetsExpanded = !presetsExpanded;
            
            // When opening presets section, refresh global presets from localStorage
            if (presetsExpanded) {
              const freshGlobalPresets = loadGlobalPresets();
              
              // Only ADD new global presets that don't exist locally
              // Don't delete existing presets - they may be from the workflow or unsaved
              let addedCount = 0;
              Object.keys(freshGlobalPresets).forEach(presetName => {
                if (!presets[presetName]) {
                  presets[presetName] = freshGlobalPresets[presetName];
                  addedCount++;
                }
              });
              
              if (addedCount > 0) {
                // Update widget data to reflect changes
                updateWidgetData();
              }
            }
            
            renderUI();
            updateNodeSize();
          });
          container.appendChild(presetsSection.section);

          if (presetsExpanded) {
           try {
            // Separate default and custom presets
            const defaultPresetNames = Object.keys(defaultPresets);
            const customPresetNames = Object.keys(presets).filter(name => !defaultPresets.hasOwnProperty(name));
            
            // Multi-select tracking for custom presets
            const selectedPresets = new Set();
            let lastSelectedIndex = -1;
            const presetRowElements = new Map(); // Map preset name to its row element
            
            // Helper to update selection visuals
            const updateSelectionVisuals = () => {
              presetRowElements.forEach((rowEl, presetName) => {
                const isSelected = selectedPresets.has(presetName);
                const selectionBox = rowEl.querySelector('.preset-checkbox');
                if (selectionBox) {
                  // Update filled/unfilled box style
                  selectionBox.style.background = isSelected ? theme.accent : 'transparent';
                  selectionBox.style.borderColor = isSelected ? theme.accent : 'rgba(255, 255, 255, 0.3)';
                }
                // Update row styling for selection
                if (isSelected) {
                  rowEl.style.background = 'rgba(168, 85, 247, 0.2)';
                  rowEl.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                } else if (activePresetName === presetName) {
                  rowEl.style.background = 'rgba(34, 197, 94, 0.15)';
                  rowEl.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                } else {
                  rowEl.style.background = 'rgba(255, 255, 255, 0.03)';
                  rowEl.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }
              });
              
              // Show/hide delete selected button
              const deleteSelectedBtn = presetsSection.content.querySelector('.delete-selected-btn');
              if (deleteSelectedBtn) {
                deleteSelectedBtn.style.display = selectedPresets.size > 0 ? 'flex' : 'none';
                deleteSelectedBtn.textContent = `Delete Selected (${selectedPresets.size})`;
              }
            };
            
            // Helper function to render preset row
            const renderPresetRow = (name, isDefaultPreset, parentContainer) => {
              try {
                // Check if this preset is currently active
                const isActive = activePresetName === name;
                
                // Wrapper for preset + confirmation
                const presetWrapper = document.createElement("div");
                presetWrapper.style.cssText = `margin-bottom: 6px;`;

                const presetRow = document.createElement("div");
                presetRow.style.cssText = `
                  display: flex;
                  align-items: center;
                  padding: 6px 8px;
                  background: ${isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
                  border-radius: 6px;
                  border: 1px solid ${isActive ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.05)'};
                  transition: all 0.4s ease-in-out;
                  box-shadow: ${isActive ? '0 0 12px rgba(34, 197, 94, 0.3), inset 0 0 12px rgba(34, 197, 94, 0.08)' : 'none'};
                `;
                presetRow.onmouseenter = () => {
                  // Only check selection for custom presets
                  const isSelected = !isDefaultPreset && selectedPresets.has(name);
                  if (isSelected) {
                    presetRow.style.background = 'rgba(168, 85, 247, 0.3)';
                    presetRow.style.borderColor = 'rgba(168, 85, 247, 0.6)';
                  } else if (isActive) {
                    presetRow.style.background = 'rgba(34, 197, 94, 0.2)';
                    presetRow.style.borderColor = 'rgba(34, 197, 94, 0.7)';
                  } else {
                    presetRow.style.background = 'rgba(255, 255, 255, 0.06)';
                    presetRow.style.borderColor = theme.primaryLight;
                  }
                  // Show delete button on hover (only for custom presets)
                  const deleteBtn = presetRow.querySelector('.preset-delete-btn');
                  if (deleteBtn) {
                    deleteBtn.style.opacity = '1';
                    deleteBtn.style.pointerEvents = 'auto';
                  }
                };
                presetRow.onmouseleave = () => {
                  // Only check selection for custom presets
                  const isSelected = !isDefaultPreset && selectedPresets.has(name);
                  if (isSelected) {
                    presetRow.style.background = 'rgba(168, 85, 247, 0.2)';
                    presetRow.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                  } else if (isActive) {
                    presetRow.style.background = 'rgba(34, 197, 94, 0.15)';
                    presetRow.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                  } else {
                    presetRow.style.background = 'rgba(255, 255, 255, 0.03)';
                    presetRow.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }
                  // Hide delete button when not hovering
                  const deleteBtn = presetRow.querySelector('.preset-delete-btn');
                  if (deleteBtn) {
                    deleteBtn.style.opacity = '0';
                    deleteBtn.style.pointerEvents = 'none';
                  }
                };

                // Add selection indicator for custom presets (filled/unfilled box)
                if (!isDefaultPreset) {
                  const isSelected = selectedPresets.has(name);
                  const selectionBox = document.createElement("div");
                  selectionBox.className = "preset-checkbox";
                  selectionBox.style.cssText = `
                    width: 12px;
                    height: 12px;
                    margin-right: 8px;
                    border-radius: 3px;
                    border: 2px solid ${isSelected ? theme.accent : 'rgba(255, 255, 255, 0.3)'};
                    background: ${isSelected ? theme.accent : 'transparent'};
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                  `;
                  presetRow.appendChild(selectionBox);
                  
                  // Store row reference for selection updates
                  presetRowElements.set(name, presetRow);
                  
                  // Make entire row clickable for selection
                  presetRow.style.cursor = 'pointer';
                  presetRow.onclick = (e) => {
                    // Don't trigger selection if clicking on buttons
                    if (e.target.closest('button')) return;
                    
                    const currentIndex = customPresetNames.indexOf(name);
                    
                    if (e.shiftKey && lastSelectedIndex !== -1) {
                      // Shift+click: select range
                      const start = Math.min(lastSelectedIndex, currentIndex);
                      const end = Math.max(lastSelectedIndex, currentIndex);
                      for (let i = start; i <= end; i++) {
                        selectedPresets.add(customPresetNames[i]);
                      }
                    } else {
                      // Regular click: toggle selection
                      if (selectedPresets.has(name)) {
                        selectedPresets.delete(name);
                      } else {
                        selectedPresets.add(name);
                      }
                    }
                    lastSelectedIndex = currentIndex;
                    updateSelectionVisuals();
                  };
                }
                
                const presetNameEl = document.createElement("span");
                presetNameEl.textContent = isActive ? `${name}` : name;
                presetNameEl.style.cssText = `
                  color: ${isActive ? 'rgba(134, 239, 172, 1)' : '#fff'};
                  font-size: 12px;
                  font-weight: ${isActive ? '600' : '500'};
                  transition: color 0.4s ease-in-out;
                `;
                presetRow.appendChild(presetNameEl);
                 
                 // Add mode badge to show which output mode the preset was saved in (skip for Blank preset)
                 if (name !== "Blank") {
                   const presetData = presets[name];
                   const presetMode = presetData?.config?.output_mode || 'saveImage';
                   const modeBadge = document.createElement("span");
                   modeBadge.textContent = presetMode === 'imageSaver' ? 'IS' : 'SI';
                   modeBadge.title = presetMode === 'imageSaver' ? 'Image Saver mode' : 'Save Image mode';
                   const badgeColor = presetMode === 'imageSaver' ? theme.accent : 'rgba(59, 130, 246, 0.8)';
                   modeBadge.style.cssText = `
                     margin-left: 8px;
                     padding: 2px 6px;
                     background: ${badgeColor}20;
                     border: 1px solid ${badgeColor};
                     border-radius: 4px;
                     color: ${badgeColor};
                     font-size: 9px;
                     font-weight: 600;
                     letter-spacing: 0.5px;
                     flex-shrink: 0;
                   `;
                   presetRow.appendChild(modeBadge);
                 }
                
                // Spacer to push buttons to the right
                const spacer = document.createElement("div");
                spacer.style.cssText = `flex: 1;`;
                presetRow.appendChild(spacer);

                const loadBtn = document.createElement("button");
                loadBtn.textContent = "▼";
                loadBtn.title = "Load preset";
                loadBtn.style.cssText = `
                  width: 28px;
                  height: 28px;
                  padding: 0;
                  background: ${theme.accent};
                  border: 1px solid ${theme.accent};
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 900;
                  color: rgba(0, 0, 0, 0.9);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  line-height: 1;
                  transition: all 0.2s;
                `;
                loadBtn.onmouseover = () => {
                  loadBtn.style.background = theme.accent;
                  loadBtn.style.transform = 'scale(1.15)';
                  loadBtn.style.filter = 'brightness(1.2)';
                  loadBtn.style.boxShadow = `0 2px 8px ${theme.accent}`;
                };
                loadBtn.onmouseout = () => {
                  loadBtn.style.background = theme.accent;
                  loadBtn.style.transform = 'scale(1)';
                  loadBtn.style.filter = 'brightness(1)';
                  loadBtn.style.boxShadow = 'none';
                };
                loadBtn.onclick = (e) => {
                   e.stopPropagation(); // Prevent row selection
                   // For default presets, use defaultPresets directly since they might not be in the merged presets
                   const preset = presets[name] || defaultPresets[name];
                   if (!preset) {
                     console.error("[FlowPath] Preset not found:", name);
                     showToast(`Preset "${name}" not found!`, "error", 2000);
                     return;
                   }
                   // Preserve certain settings that shouldn't be overwritten by presets
                    const currentLabel = config.node_label;
                    const currentOutputMode = config.output_mode;
                   
                   segments = JSON.parse(JSON.stringify(preset.segments));
                   config = JSON.parse(JSON.stringify(preset.config));
                   
                   // Restore preserved settings
                   config.node_label = currentLabel;
                   // Only restore output_mode if preset doesn't specify one (e.g., Blank preset)
                   if (!preset.config.output_mode) {
                     config.output_mode = currentOutputMode;
                   }
                  
                  // Set this preset as active for visual highlighting
                  activePresetName = name;
                  
                  updateWidgetData();
                   
                   // Render the new UI first, then show animation overlay on top
                   renderUI();
                   updateNodeSize();
                   // Scroll to top after loading preset so user sees the new configuration
                   container.scrollTop = 0;
                   
                   // Show loading animation AFTER renderUI so it doesn't get removed by innerHTML = ""
                    if (globalSettings.showLoadingAnimation) {
                      showContainerLoadingAnimation(`Loaded "${name}"`);
                    } else {
                      // Show toast notification instead
                      showToast(`Loaded preset "${name}"`, "success", 2000);
                    }
                 };

                // Only add delete button for custom presets (not default presets)
                if (!isDefaultPreset) {
                  const deleteBtn = document.createElement("button");
                  deleteBtn.className = 'preset-delete-btn';
                  deleteBtn.textContent = "×";
                  deleteBtn.title = "Delete preset";
                  deleteBtn.style.cssText = `
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    background: rgba(255, 0, 0, 0.2);
                    border: 1px solid rgba(255, 0, 0, 0.4);
                    border-radius: 4px;
                    color: #ff6b6b;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    opacity: 0;
                    pointer-events: none;
                    margin-right: 6px;
                  `;
                  deleteBtn.onmouseover = () => {
                    deleteBtn.style.background = 'rgba(255, 0, 0, 0.4)';
                    deleteBtn.style.color = '#fff';
                    deleteBtn.style.transform = 'scale(1.1)';
                  };
                  deleteBtn.onmouseout = () => {
                    deleteBtn.style.background = 'rgba(255, 0, 0, 0.2)';
                    deleteBtn.style.color = '#ff6b6b';
                    deleteBtn.style.transform = 'scale(1)';
                  };
                  
                  // Confirmation row (hidden by default)
                  const confirmRow = document.createElement("div");
                  confirmRow.style.cssText = `
                    display: none;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px;
                    margin-top: 4px;
                    background: rgba(255, 0, 0, 0.1);
                    border-radius: 6px;
                    border: 1px solid rgba(255, 0, 0, 0.3);
                    animation: slideDown 0.2s ease-out;
                  `;

                  const confirmText = document.createElement("span");
                  confirmText.textContent = `Delete "${name}"?`;
                  confirmText.style.cssText = `
                    color: #ff6b6b;
                    font-size: 11px;
                    font-weight: 500;
                  `;
                  confirmRow.appendChild(confirmText);

                  const confirmBtns = document.createElement("div");
                  confirmBtns.style.cssText = `
                    display: flex;
                    gap: 6px;
                  `;

                  const cancelBtn = document.createElement("button");
                  cancelBtn.textContent = "Cancel";
                  cancelBtn.style.cssText = `
                    padding: 3px 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    color: #fff;
                    cursor: pointer;
                    font-size: 10px;
                    font-weight: 500;
                    transition: all 0.2s;
                  `;
                  cancelBtn.onmouseover = () => {
                    cancelBtn.style.background = 'rgba(255, 255, 255, 0.15)';
                  };
                  cancelBtn.onmouseout = () => {
                    cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                  };
                  cancelBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent row selection
                    confirmRow.style.display = 'none';
                    deleteBtn.textContent = "×";
                    deleteBtn.style.background = 'rgba(255, 0, 0, 0.2)';
                  };

                  const confirmBtn = document.createElement("button");
                  confirmBtn.textContent = "Delete";
                  confirmBtn.style.cssText = `
                    padding: 3px 10px;
                    background: rgba(255, 0, 0, 0.5);
                    border: 1px solid rgba(255, 0, 0, 0.8);
                    border-radius: 4px;
                    color: #fff;
                    cursor: pointer;
                    font-size: 10px;
                    font-weight: 600;
                    transition: all 0.2s;
                  `;
                  confirmBtn.onmouseover = () => {
                    confirmBtn.style.background = 'rgba(255, 0, 0, 0.7)';
                    confirmBtn.style.transform = 'scale(1.05)';
                  };
                  confirmBtn.onmouseout = () => {
                    confirmBtn.style.background = 'rgba(255, 0, 0, 0.5)';
                    confirmBtn.style.transform = 'scale(1)';
                  };
                  confirmBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent row selection
                    const deletedName = name; // Capture the name before deleting
                    delete presets[name];
                    
                    // Remove from global storage
                    const currentGlobalPresets = loadGlobalPresets();
                    if (currentGlobalPresets[deletedName]) {
                      delete currentGlobalPresets[deletedName];
                      saveGlobalPresets(currentGlobalPresets);
                    }
                    
                    updateWidgetData();
                    
                    // Defer renderUI to avoid DOM conflicts
                    setTimeout(() => {
                      renderUI();
                      updateNodeSize();
                      container.focus();
                    }, 0);
                    
                    // Sync the deletion to all other FlowPath nodes in this workflow
                    syncPresetsToAllNodes(null, deletedName);
                    
                    // Show success toast
                    showToast(`Preset "${name}" deleted successfully!`, "success", 2000);
                  };

                  confirmBtns.appendChild(cancelBtn);
                  confirmBtns.appendChild(confirmBtn);
                  confirmRow.appendChild(confirmBtns);

                  deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent row selection
                    confirmRow.style.display = 'flex';
                    deleteBtn.textContent = "⚠";
                    deleteBtn.style.background = 'rgba(255, 0, 0, 0.5)';
                  };
                  
                  // Add delete button BEFORE load button (left to right: delete, load)
                  presetRow.appendChild(deleteBtn);
                  presetRow.appendChild(loadBtn);
                  presetWrapper.appendChild(presetRow);
                  presetWrapper.appendChild(confirmRow);
                } else {
                   // Default preset - just add load button
                   presetRow.appendChild(loadBtn);
                   presetWrapper.appendChild(presetRow);
                 }

                parentContainer.appendChild(presetWrapper);
                return presetWrapper;
              } catch (error) {
                console.error("[FlowPath] Error rendering preset row:", name, error);
                return null;
              }
            };
            
            // DEFAULT PRESETS SUB-ACCORDION (only show if not hidden in settings)
            if (!globalSettings.hideDefaultPresets) {
              const defaultPresetsHeader = document.createElement("div");
              defaultPresetsHeader.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid rgba(255, 255, 255, 0.1);
              `;
              defaultPresetsHeader.onmouseenter = () => {
                defaultPresetsHeader.style.background = 'rgba(255, 255, 255, 0.08)';
                defaultPresetsHeader.style.borderColor = theme.primaryLight;
              };
              defaultPresetsHeader.onmouseleave = () => {
                defaultPresetsHeader.style.background = 'rgba(255, 255, 255, 0.05)';
                defaultPresetsHeader.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              };
              
              const defaultPresetsToggle = document.createElement("span");
              defaultPresetsToggle.textContent = defaultPresetsExpanded ? "▼" : "▶";
              defaultPresetsToggle.style.cssText = `
                margin-right: 8px;
                color: ${theme.accent};
                font-size: 10px;
              `;
              
              const defaultPresetsTitle = document.createElement("span");
              defaultPresetsTitle.textContent = `${emojiWithSpace('⭐')}Default Presets (${defaultPresetNames.length})`;
              defaultPresetsTitle.style.cssText = `
                flex: 1;
                color: #fff;
                font-size: 12px;
                font-weight: 600;
              `;
              
              defaultPresetsHeader.appendChild(defaultPresetsToggle);
              defaultPresetsHeader.appendChild(defaultPresetsTitle);
              defaultPresetsHeader.onclick = () => {
                defaultPresetsExpanded = !defaultPresetsExpanded;
                renderUI();
                updateNodeSize();
              };
              presetsSection.content.appendChild(defaultPresetsHeader);
              
              if (defaultPresetsExpanded) {
                const defaultPresetsContainer = document.createElement("div");
                defaultPresetsContainer.style.cssText = `
                  margin-bottom: 12px;
                  padding-left: 8px;
                `;
                defaultPresetNames.forEach(name => {
                  renderPresetRow(name, true, defaultPresetsContainer);
                });
                presetsSection.content.appendChild(defaultPresetsContainer);
              }
            }
            
            // CUSTOM PRESETS SUB-ACCORDION
            const customPresetsHeader = document.createElement("div");
            customPresetsHeader.style.cssText = `
              display: flex;
              align-items: center;
              padding: 8px 10px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 6px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: all 0.2s;
              border: 1px solid rgba(255, 255, 255, 0.1);
            `;
            customPresetsHeader.onmouseenter = () => {
              customPresetsHeader.style.background = 'rgba(255, 255, 255, 0.08)';
              customPresetsHeader.style.borderColor = theme.primaryLight;
            };
            customPresetsHeader.onmouseleave = () => {
              customPresetsHeader.style.background = 'rgba(255, 255, 255, 0.05)';
              customPresetsHeader.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            const customPresetsToggle = document.createElement("span");
            customPresetsToggle.textContent = customPresetsExpanded ? "▼" : "▶";
            customPresetsToggle.style.cssText = `
              margin-right: 8px;
              color: ${theme.accent};
              font-size: 10px;
            `;
            
            const customPresetsTitle = document.createElement("span");
            customPresetsTitle.textContent = `${emojiWithSpace('✨')}Custom Presets (${customPresetNames.length})`;
            customPresetsTitle.style.cssText = `
              flex: 1;
              color: #fff;
              font-size: 12px;
              font-weight: 600;
            `;
            
            customPresetsHeader.appendChild(customPresetsToggle);
            customPresetsHeader.appendChild(customPresetsTitle);
            customPresetsHeader.onclick = () => {
              customPresetsExpanded = !customPresetsExpanded;
              renderUI();
              updateNodeSize();
            };
            presetsSection.content.appendChild(customPresetsHeader);
            
            if (customPresetsExpanded) {
              const customPresetsContainer = document.createElement("div");
              customPresetsContainer.style.cssText = `
                margin-bottom: 8px;
                padding-left: 8px;
              `;
              
              if (customPresetNames.length > 0) {
                customPresetNames.forEach(name => {
                  renderPresetRow(name, false, customPresetsContainer);
                });
                
                // Add "Delete Selected" button (hidden by default)
                const deleteSelectedBtn = document.createElement("button");
                deleteSelectedBtn.className = "delete-selected-btn";
                deleteSelectedBtn.textContent = "Delete Selected (0)";
                deleteSelectedBtn.style.cssText = `
                  display: none;
                  align-items: center;
                  justify-content: center;
                  width: 100%;
                  margin-top: 8px;
                  padding: 8px 12px;
                  background: rgba(239, 68, 68, 0.2);
                  border: 1px solid rgba(239, 68, 68, 0.5);
                  border-radius: 6px;
                  color: rgba(239, 68, 68, 0.9);
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s;
                `;
                deleteSelectedBtn.onmouseover = () => {
                  deleteSelectedBtn.style.background = 'rgba(239, 68, 68, 0.3)';
                  deleteSelectedBtn.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                  deleteSelectedBtn.style.color = '#fff';
                };
                deleteSelectedBtn.onmouseout = () => {
                  deleteSelectedBtn.style.background = 'rgba(239, 68, 68, 0.2)';
                  deleteSelectedBtn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  deleteSelectedBtn.style.color = 'rgba(239, 68, 68, 0.9)';
                };
                deleteSelectedBtn.onclick = async () => {
                  if (selectedPresets.size === 0) return;
                  
                  const count = selectedPresets.size;
                  const shouldDelete = await showConfirmDialog(
                    "Delete Selected Presets?",
                    `Are you sure you want to delete ${count} preset${count > 1 ? 's' : ''}?`,
                    "Delete All",
                    "Cancel"
                  );
                  
                  if (shouldDelete) {
                    const deletedNames = Array.from(selectedPresets);
                    const currentGlobalPresets = loadGlobalPresets();
                    
                    deletedNames.forEach(presetName => {
                      delete presets[presetName];
                      if (currentGlobalPresets[presetName]) {
                        delete currentGlobalPresets[presetName];
                      }
                      if (activePresetName === presetName) {
                        activePresetName = null;
                      }
                    });
                    
                    saveGlobalPresets(currentGlobalPresets);
                    updateWidgetData();
                    renderUI();
                    updateNodeSize();
                    
                    // Sync deletions to all other FlowPath nodes
                    deletedNames.forEach(name => syncPresetsToAllNodes(null, name));
                    
                    showToast(`Deleted ${count} preset${count > 1 ? 's' : ''} successfully!`, "success", 2000);
                  }
                };
                customPresetsContainer.appendChild(deleteSelectedBtn);
              } else {
                const emptyMsg = document.createElement("div");
                emptyMsg.textContent = "No custom presets yet";
                emptyMsg.style.cssText = `
                  color: rgba(255, 255, 255, 0.4);
                  font-size: 11px;
                  font-style: italic;
                  text-align: center;
                  padding: 12px 0;
                `;
                customPresetsContainer.appendChild(emptyMsg);
              }
              presetsSection.content.appendChild(customPresetsContainer);
            }
           } catch (error) {
            console.error("[FlowPath] Error rendering presets section:", error);
           }
          }

          // Save Preset Button (always visible, outside accordion)
          const savePresetBtn = document.createElement("button");
          savePresetBtn.textContent = `${emojiWithSpace('💾')}Save Current as Preset`;
          savePresetBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 8px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3));
            border: 1px solid rgba(34, 197, 94, 0.6);
            border-radius: 6px;
            color: #fff;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
          `;
          savePresetBtn.onmouseover = () => {
            savePresetBtn.style.transform = 'translateY(-2px)';
            savePresetBtn.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
          };
          savePresetBtn.onmouseout = () => {
            savePresetBtn.style.transform = 'translateY(0)';
            savePresetBtn.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.2)';
          };
          savePresetBtn.onclick = async () => {
            // Check for empty required fields based on enabled segments
            const emptyFields = [];
            const configFieldMap = {
              name: { key: "name", label: "Name" },
              project: { key: "project_name", label: "Project Name" },
              series: { key: "series_name", label: "Series Name" },
              resolution: { key: "resolution", label: "Resolution" },
              model: { key: "model_name", label: "Model Name" },
              lora: { key: "lora_name", label: "LoRA Name" }
            };
            
            segments.forEach(seg => {
              if (seg.enabled !== false && configFieldMap[seg.type]) {
                const field = configFieldMap[seg.type];
                if (!config[field.key] || !config[field.key].trim()) {
                  emptyFields.push(field.label);
                }
              }
              // Check custom segments for empty templates
              if (seg.type === "custom" && seg.enabled !== false) {
                if (!seg.value || !seg.value.trim()) {
                  emptyFields.push("Custom Template");
                }
              }
            });
            
            // Build warning message if there are empty fields
            const warningMessage = emptyFields.length > 0 
              ? `Empty fields: ${emptyFields.join(", ")}` 
              : "";
            
            const name = await showInputDialog("Enter Preset Name", "", "Example: Character Portrait", {
              maxLength: 32,
              warningMessage: warningMessage
            });
            if (name) {
              // Check if this is a default preset - these cannot be overwritten
              const isDefaultPreset = defaultPresets.hasOwnProperty(name);
              if (isDefaultPreset) {
                showToast(`Cannot overwrite default preset "${name}". Please choose a different name.`, "error", 4000);
                return;
              }
              
              // Check if a custom preset with this name already exists
              const presetExists = presets.hasOwnProperty(name);
              let shouldSave = true;
              
              if (presetExists) {
                // Show confirmation dialog for overwriting custom preset
                shouldSave = await showConfirmDialog(
                  "Overwrite Preset?",
                  `A preset named "${name}" already exists. Do you want to overwrite it?`,
                  "Overwrite",
                  "Cancel"
                );
              }
              
              if (shouldSave) {
                presets[name] = {
                  segments: JSON.parse(JSON.stringify(segments)),
                  config: JSON.parse(JSON.stringify(config))
                };
                
                // Save to global storage (persists across all workflows)
                const currentGlobalPresets = loadGlobalPresets();
                currentGlobalPresets[name] = presets[name];
                saveGlobalPresets(currentGlobalPresets);
                
                // Set as active preset since we just saved it
                activePresetName = name;
                
                updateWidgetData();
                renderUI();
                updateNodeSize();
                
                // Sync the new preset to all other FlowPath nodes in this workflow
                syncPresetsToAllNodes(name, null);
                
                // Show success toast
                const action = presetExists ? "updated" : "saved";
                showToast(`Preset "${name}" ${action} successfully!`, "success", 2000);
              }
            }
          };
          container.appendChild(savePresetBtn);

          // DONATION BANNER - Per-workflow dismissal
          const workflowId = app.graph?.serialize ? JSON.stringify(app.graph.serialize()).substring(0, 100) : "default";
          const bannerDismissKey = `flowpath_banner_dismissed_${workflowId}`;
          const isBannerDismissed = localStorage.getItem(bannerDismissKey) === "true";

          if (!isBannerDismissed) {
            const donationBanner = document.createElement("div");
            
            // Use blue/purple gradient for Umbrael's Umbrage, otherwise use theme colors
            const bannerGradient = globalSettings.theme === "umbrael" 
              ? "linear-gradient(135deg, rgba(66, 153, 225, 0.25), rgba(168, 85, 247, 0.25))"
              : `linear-gradient(135deg, ${theme.primaryLight}, ${theme.primaryDark.replace('0.6', '0.25')})`;
            
            donationBanner.style.cssText = `
              margin-top: 12px;
              padding: 12px;
              background: ${bannerGradient};
              border: 1px solid ${theme.primary};
              border-radius: 8px;
              position: relative;
            `;

            const bannerContent = document.createElement("div");
            bannerContent.style.cssText = `
              display: flex;
              align-items: center;
              gap: 10px;
            `;

            const heartIcon = document.createElement("span");
            heartIcon.textContent = "💝";
            heartIcon.style.cssText = `
              font-size: 20px;
            `;

            const bannerText = document.createElement("div");
            bannerText.style.cssText = `
              flex: 1;
              color: rgba(255, 255, 255, 0.9);
              font-size: 12px;
              line-height: 1.4;
            `;
            bannerText.innerHTML = `
              <strong style="color: ${theme.accent};">FlowPath is free & open source!</strong><br>
              If you find it useful, consider <a href="https://ko-fi.com/maarten_harms" target="_blank" style="color: ${theme.accent}; text-decoration: underline;">supporting development</a> ☕
            `;

            const closeBtn = document.createElement("button");
            closeBtn.textContent = "×";
            closeBtn.title = "Dismiss (for this workflow)";
            closeBtn.style.cssText = `
              position: absolute;
              top: 4px;
              right: 4px;
              width: 20px;
              height: 20px;
              padding: 0;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 4px;
              color: rgba(255, 255, 255, 0.7);
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            `;
            
            closeBtn.onmouseenter = () => {
              closeBtn.style.background = "rgba(255, 255, 255, 0.2)";
              closeBtn.style.color = "#fff";
            };
            
            closeBtn.onmouseleave = () => {
              closeBtn.style.background = "rgba(255, 255, 255, 0.1)";
              closeBtn.style.color = "rgba(255, 255, 255, 0.7)";
            };

            closeBtn.onclick = () => {
              localStorage.setItem(bannerDismissKey, "true");
              donationBanner.style.animation = "fadeOut 0.3s ease-out";
              setTimeout(() => {
                donationBanner.remove();
                updateNodeSize();
              }, 300);
            };

            bannerContent.appendChild(heartIcon);
            bannerContent.appendChild(bannerText);
            donationBanner.appendChild(bannerContent);
            donationBanner.appendChild(closeBtn);
            container.appendChild(donationBanner);
            
            // Make the Ko-fi link actually clickable (canvas may block default behavior)
            const kofiLink = bannerText.querySelector('a');
            if (kofiLink) {
              kofiLink.style.cursor = 'pointer';
              kofiLink.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open('https://ko-fi.com/maarten_harms', '_blank');
              };
            }
          }

          updateNodeSize();
        };

        // Store render function on node for global re-renders
        node.genSortRender = renderUI;

        // Add the DOM widget
        const widget = node.addDOMWidget("path_builder_ui", "custom", container, {
          getValue: () => ({ segments, config, presets }),
          setValue: (v) => {
            if (v && v.segments) segments = v.segments;
            if (v && v.config) config = v.config;
            if (v && v.presets) presets = v.presets;
            renderUI();
          },
          hideOnZoom: true,
          serialize: false
        });

        // Fixed widget size - content scrolls within
        const DEFAULT_HEIGHT = 600;
        widget.computeSize = () => [node.size[0], DEFAULT_HEIGHT];

        renderUI();
        
        // Set initial size - user can resize as needed
        node.setSize([Math.max(node.size[0], 560), DEFAULT_HEIGHT + 40]);
        
      });
    }
  }
});
