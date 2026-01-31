import { app } from "../../scripts/app.js";

console.log("🎯 FlowPath Widget JavaScript file loaded!");

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
    background: "rgba(0, 0, 0, 0.05)" // Subtle dark background
  },
  forest: {
    name: "Forest Green",
    primary: "#10b981",
    primaryLight: "rgba(16, 185, 129, 0.3)",
    primaryDark: "rgba(16, 185, 129, 0.6)",
    gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(217, 119, 6, 0.1))",
    accent: "#d97706", // Amber/Earth
    secondary: "#34d399",
    background: "rgba(0, 0, 0, 0.05)" // Subtle dark background
  },
  pinkpony: {
    name: "Pink Pony Club",
    primary: "#ec4899",
    primaryLight: "rgba(236, 72, 153, 0.3)",
    primaryDark: "rgba(236, 72, 153, 0.6)",
    gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(255, 255, 255, 0.15))",
    accent: "#ffffff", // White
    secondary: "#f472b6",
    background: "rgba(255, 255, 255, 0.08)" // Light premium background
  },
  odie: {
    name: "Odie",
    primary: "#f97316",
    primaryLight: "rgba(249, 115, 22, 0.3)",
    primaryDark: "rgba(249, 115, 22, 0.6)",
    gradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(212, 165, 116, 0.15))",
    accent: "#d4a574", // Sandy tan/cream
    secondary: "#fb923c",
    background: "rgba(255, 247, 237, 0.05)" // Warm light background
  },
  umbrael: {
    name: "Umbrael's Umbrage",
    primary: "#9333ea",
    primaryLight: "rgba(147, 51, 234, 0.3)",
    primaryDark: "rgba(147, 51, 234, 0.6)",
    gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(251, 191, 36, 0.1))",
    accent: "#fbbf24", // Gold
    secondary: "#a855f7",
    background: "rgba(17, 24, 39, 0.6)" // Dark royal background
  },
  plainjane: {
    name: "Plain Jane",
    primary: "#6b7280",
    primaryLight: "rgba(107, 114, 128, 0.3)",
    primaryDark: "rgba(107, 114, 128, 0.6)",
    gradient: "linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(156, 163, 175, 0.1))",
    accent: "#9ca3af", // Light gray
    secondary: "#4b5563",
    background: "rgba(243, 244, 246, 0.03)" // Very subtle gray background
  },
  batman: {
    name: "The Dark Knight",
    primary: "#1a1a1a",
    primaryLight: "rgba(26, 26, 26, 0.5)",
    primaryDark: "rgba(0, 0, 0, 0.8)",
    gradient: "linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(255, 204, 0, 0.1))",
    accent: "#ffcc00", // Batman yellow
    secondary: "#333333",
    background: "rgba(0, 0, 0, 0.7)" // Deep dark background
  }
};

// Global settings storage
let globalSettings = {
  theme: "umbrael",
  enableScrolling: true, // Scrolling enabled by default for reliable display
  autoDetectModel: "manual", // "manual" or "auto"
  autoDetectLora: true,
  loraPathFormat: "primary" // "primary", "primaryCount", "all", "separate"
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
  `;
  document.head.appendChild(style);
}

console.log("🎯 Registering FlowPath extension...");

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
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px;">${style.icon}</span>
      <span style="flex: 1;">${message}</span>
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
function detectModelFromWorkflow(graph) {
  console.log("[FlowPath] Detecting model from workflow...");
  
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

  // Search for all checkpoint nodes
  for (const node of graph._nodes) {
    if (checkpointNodeTypes.includes(node.type)) {
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
    console.log("[FlowPath] No checkpoint node found in workflow");
    return null;
  }

  console.log("[FlowPath] Detected models:", foundModels);
  
  // Return first model, but include count for notification
  return {
    model: foundModels[0],
    total: foundModels.length,
    allModels: foundModels
  };
}

function detectSeedFromWorkflow(graph) {
  console.log("[FlowPath] Detecting seed from workflow...");
  
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

  // First, check for noise generator nodes (higher priority for SamplerCustomAdvanced workflows)
  for (const node of graph._nodes) {
    if (noiseGeneratorTypes.some(type => node.type.includes(type) || type.includes(node.type))) {
      // Find the widget that contains the noise_seed
      const seedWidget = node.widgets?.find(w => w.name === "noise_seed");
      
      if (seedWidget && seedWidget.value !== undefined && seedWidget.value !== null) {
        const seed = String(seedWidget.value);
        console.log("[FlowPath] Detected noise_seed from", node.type, ":", seed);
        return seed;
      }
    }
  }

  // Search for sampler nodes (fallback)
  for (const node of graph._nodes) {
    if (samplerNodeTypes.some(type => node.type.includes(type) || type.includes(node.type))) {
      // Find the widget that contains the seed
      const seedWidget = node.widgets?.find(w => w.name === "seed");
      
      if (seedWidget && seedWidget.value !== undefined && seedWidget.value !== null) {
        const seed = String(seedWidget.value);
        console.log("[FlowPath] Detected seed:", seed);
        return seed;
      }
    }
  }

  console.log("[FlowPath] No sampler or noise generator node with seed found in workflow");
  return null;
}

function detectLorasFromWorkflow(graph) {
  console.log("[FlowPath] Detecting LoRAs from workflow...");
  
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

  // Search for all nodes in the workflow
  for (const node of graph._nodes) {
    console.log("[FlowPath] Checking node:", node.type);
    
    // Handle Lora Manager nodes specially
    if (node.type === "Lora Loader (LoraManager)" || 
        node.comfyClass === "Lora Loader (LoraManager)" ||
        node.type === "lora") {  // LoRA Manager may also appear as lowercase "lora"
      console.log("[FlowPath] Found LoRA Manager node:", node.type);
      
      // LoRA Manager stores structured data in lorasWidget
      const lorasWidget = node.lorasWidget;
      
      if (lorasWidget && lorasWidget.value && Array.isArray(lorasWidget.value)) {
        const lorasData = lorasWidget.value;
        console.log("[FlowPath] LoRA Manager data:", lorasData);
        
        // Only extract LoRAs that are active (checked)
        lorasData.forEach(lora => {
          if (lora && lora.name && lora.active) {
            const loraName = lora.name;
            if (!loraNames.includes(loraName)) {
              console.log("[FlowPath] Extracted ACTIVE LoRA from Manager:", loraName);
              loraNames.push(loraName);
            }
          } else if (lora && lora.name && !lora.active) {
            console.log("[FlowPath] Skipping INACTIVE LoRA:", lora.name);
          }
        });
      } else {
        // Fallback: parse from inputWidget text if lorasWidget not available
        const inputWidget = node.inputWidget || node.widgets?.find(w => w.name === "loras");
        
        if (inputWidget && inputWidget.value) {
          const loraText = inputWidget.value;
          console.log("[FlowPath] LoRA Manager text (fallback):", loraText);
          
          // Parse LoRA syntax: <lora:name:strength>
          LORA_PATTERN.lastIndex = 0; // Reset regex
          let match;
          while ((match = LORA_PATTERN.exec(loraText)) !== null) {
            const loraName = match[1]; // First capture group is the name
            if (loraName && !loraNames.includes(loraName)) {
              console.log("[FlowPath] Extracted LoRA from Manager (fallback):", loraName);
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
      console.log("[FlowPath] Found standard LoRA node:", node.type);
      
      // Find the widget that contains the LoRA name
      const loraWidget = node.widgets?.find(w => 
        w.name === "lora_name" || w.name === "lora" || w.name.toLowerCase().includes("lora")
      );
      
      if (loraWidget) {
        console.log("[FlowPath] LoRA widget found:", loraWidget.name, "value type:", typeof loraWidget.value, "value:", loraWidget.value);
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
          console.log("[FlowPath] Added standard LoRA:", loraName);
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
      console.log("[FlowPath] Checking text node for embedded LoRAs:", node.type);
      
      // Check all widgets for text content
      if (node.widgets) {
        for (const widget of node.widgets) {
          if (widget.value && typeof widget.value === 'string' && widget.value.includes('<lora:')) {
            console.log("[FlowPath] Found embedded LoRA syntax in widget:", widget.name);
            
            // Parse LoRA syntax: <lora:name:strength>
            LORA_PATTERN.lastIndex = 0; // Reset regex
            let match;
            while ((match = LORA_PATTERN.exec(widget.value)) !== null) {
              const loraName = match[1]; // First capture group is the name
              if (loraName && !loraNames.includes(loraName)) {
                console.log("[FlowPath] Extracted embedded LoRA:", loraName);
                loraNames.push(loraName);
              }
            }
          }
        }
      }
    }
  }

  console.log("[FlowPath] Detected LoRAs:", loraNames);
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
  console.log("[FlowPath] Detecting resolution from workflow...");
  
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

  // Search for all latent image nodes
  for (const node of graph._nodes) {
    if (latentNodeTypes.some(type => node.type === type || node.comfyClass === type)) {
      console.log("[FlowPath] Found latent node:", node.type);
      
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
    console.log("[FlowPath] No latent node with resolution found in workflow");
    return null;
  }

  console.log("[FlowPath] Detected resolutions:", foundResolutions);
  
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
    // Add theme setting to ComfyUI's settings menu
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.theme",
      name: "Theme",
      type: "combo",
      tooltip: "Choose a color theme for the FlowPath node. Each theme has unique colors and gradients.",
      options: [
        { value: "ocean", text: "Ocean Blue" },
        { value: "forest", text: "Forest Green" },
        { value: "pinkpony", text: "Pink Pony Club" },
        { value: "odie", text: "Odie" },
        { value: "umbrael", text: "Umbrael's Umbrage" },
        { value: "plainjane", text: "Plain Jane" },
        { value: "batman", text: "The Dark Knight" }
      ],
      defaultValue: "umbrael",
      onChange: (value) => {
        globalSettings.theme = value;
        console.log("[FlowPath] Theme changed to:", value);
        
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
      id: "🌊 FlowPath.autoDetectModel",
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
        console.log("[FlowPath] Auto-detect model changed to:", value);
      }
    });

    // Add auto-detect LoRA setting
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.autoDetectLora",
      name: "Auto-Detect LoRAs",
      type: "boolean",
      tooltip: "Automatically detect LoRAs from your workflow including LoRA Manager support. Respects active/inactive state.",
      defaultValue: true,
      onChange: (value) => {
        globalSettings.autoDetectLora = value;
        console.log("[FlowPath] Auto-detect LoRA changed to:", value);
      }
    });

    // Add LoRA path format setting
    app.ui.settings.addSetting({
      id: "🌊 FlowPath.loraPathFormat",
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
        console.log("[FlowPath] LoRA path format changed to:", value);
        
        // Update all nodes
        const nodes = app.graph._nodes.filter(n => n.comfyClass === "FlowPath");
        nodes.forEach(node => {
          if (node.genSortRender) {
            node.genSortRender();
          }
        });
      }
    });

    // Load saved settings
    const savedTheme = app.ui.settings.getSettingValue("🌊 FlowPath.theme", "umbrael");
    const savedAutoDetectModel = app.ui.settings.getSettingValue("🌊 FlowPath.autoDetectModel", "manual");
    const savedAutoDetectLora = app.ui.settings.getSettingValue("🌊 FlowPath.autoDetectLora", true);
    const savedLoraPathFormat = app.ui.settings.getSettingValue("🌊 FlowPath.loraPathFormat", "primary");
    
    globalSettings.theme = savedTheme;
    globalSettings.autoDetectModel = savedAutoDetectModel;
    globalSettings.autoDetectLora = savedAutoDetectLora;
    globalSettings.loraPathFormat = savedLoraPathFormat;
  },

  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    console.log("🎯 beforeRegisterNodeDef called for:", nodeType.comfyClass);
    if (nodeType.comfyClass === "FlowPath") {
      chainCallback(nodeType.prototype, "onNodeCreated", function () {
        console.log("[FlowPath] Node created, adding custom widget");

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

        // Category-specific name placeholder examples
        const categoryNameExamples = {
          "Characters": "Example: Umbrael",
          "Concepts": "Example: Magic",
          "Locations": "Example: Whiterun",
          "Objects": "Example: Ebony Blade",
          "Other": "Example: Experiment"
        };

        const defaultSegments = [
          { type: "category", enabled: true },
          { type: "name", enabled: true },
          { type: "content_rating", enabled: true },
          { type: "date", enabled: true }
        ];

        // Parse current value
        let currentData = {};
        try {
          currentData = JSON.parse(dataWidget.value || "{}");
        } catch (e) {
          console.warn("[FlowPath] Failed to parse widget_data:", e);
        }

        let segments = currentData.segments || defaultSegments;
        let config = currentData.config || {
          node_label: "", // Label to identify this FlowPath node when using multiple
          file_type: "Image",
          category: "Characters",
          name: "",
          content_rating: "SFW", // Changed from is_nsfw boolean to dropdown
          date_format: "%Y-%m-%d",
          project_name: "",
          series_name: "",
          resolution: "1024x1024",
          model_name: "",
          lora_name: "",
          filename_template: "" // Filename pattern - supports FlowPath vars {name} and Image Saver vars %seed
          // seed is NOT stored in config - always detected dynamically from KSampler
        };
        
        // Default presets for common use cases
        const defaultPresets = {
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
              return JSON.parse(stored);
            }
          } catch (e) {
            console.warn("[FlowPath] Failed to load global presets from localStorage:", e);
          }
          return {};
        };
        
        const saveGlobalPresets = (globalPresets) => {
          try {
            localStorage.setItem(GLOBAL_PRESETS_KEY, JSON.stringify(globalPresets));
            console.log("[FlowPath] Global presets saved to localStorage");
          } catch (e) {
            console.warn("[FlowPath] Failed to save global presets to localStorage:", e);
          }
        };
        
        // Load global presets
        const globalPresets = loadGlobalPresets();
        console.log("[FlowPath] Loaded global presets:", Object.keys(globalPresets));
        
        // Merge: default presets < global presets < workflow presets (workflow has highest priority)
        let presets = { ...defaultPresets, ...globalPresets, ...(currentData.presets || {}) };
        
        // Track currently active/loaded preset for visual highlighting
        let activePresetName = currentData.activePresetName || null;

        // MIGRATION: Convert old is_nsfw boolean to new content_rating dropdown
        if (config.hasOwnProperty('is_nsfw')) {
          console.log("[FlowPath] Migrating old is_nsfw boolean to content_rating dropdown");
          const oldNsfw = config.is_nsfw;
          if (oldNsfw === true) {
            config.content_rating = "NSFW";
          } else if (oldNsfw === false) {
            config.content_rating = "SFW";
          }
          delete config.is_nsfw; // Remove old property
          console.log("[FlowPath] Migrated to content_rating:", config.content_rating);
        }
        
        // Ensure file_type exists (for old workflows)
        if (!config.file_type) {
          config.file_type = "Image";
          console.log("[FlowPath] Set default file_type: Image");
        }
        
        // Ensure content_rating exists and is valid (for old workflows)
        if (!config.content_rating || config.content_rating === "None") {
          config.content_rating = "SFW";
          console.log("[FlowPath] Set default content_rating: SFW");
        }

        // Auto-detection on node creation/workflow load
        const runAutoDetection = () => {
          try {
            console.log("[FlowPath] Running auto-detection on load...");
            console.log("[FlowPath] Settings - autoDetectModel:", globalSettings.autoDetectModel);
            console.log("[FlowPath] Settings - autoDetectLora:", globalSettings.autoDetectLora);

            // Auto-detect model if setting is "auto" and model_name is empty
            if (globalSettings.autoDetectModel === "auto" && !config.model_name) {
              const detectedModel = detectModelFromWorkflow(app.graph);
              if (detectedModel) {
                config.model_name = detectedModel;
                console.log("[FlowPath] Auto-detected model on load:", detectedModel);
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
                console.log("[FlowPath] Auto-detected LoRAs on load:", config.lora_name);
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
        let configExpanded = true;
        let segmentsExpanded = true;
        let filenameExpanded = false;  // Filename section collapsed by default (for Image Saver users)
        let presetsExpanded = false;
        let defaultPresetsExpanded = true;  // Sub-accordion for default presets
        let customPresetsExpanded = true;   // Sub-accordion for custom presets

        // Get current theme from global settings
        const getTheme = () => THEMES[globalSettings.theme] || THEMES.umbrael;

        // Template variable replacement function
        const replaceTemplateVars = (template, showPlaceholders = true) => {
          if (!template || typeof template !== 'string') return template;
          
          // Define available variables - show placeholder text when empty if showPlaceholders is true
          const getVal = (value, placeholder) => {
            if (value && value.trim()) return value;
            return showPlaceholders ? `[${placeholder}]` : "";
          };
          
          const vars = {
            label: getVal(config.node_label, "label"),
            output: getVal(config.node_label, "label"), // Alias
            filetype: config.file_type || "Image",
            file_type: config.file_type || "Image", // Alias
            category: config.category || "Characters",
            name: getVal(config.name, "name"),
            content_rating: config.content_rating || "SFW",
            rating: config.content_rating || "SFW", // Alias
            sfw: config.content_rating === "SFW" ? "SFW" : "",
            nsfw: config.content_rating === "NSFW" ? "NSFW" : "",
            project: getVal(config.project_name, "project"),
            series: getVal(config.series_name, "series"),
            resolution: getVal(config.resolution, "resolution"),
            res: getVal(config.resolution, "resolution"), // Alias
            model: getVal(config.model_name, "model"),
            lora: getVal(config.lora_name, "lora"),
            seed: "[seed-auto]", // Seed is always dynamic
            date: "2026-01-30", // Preview date
            year: "2026",
            month: "01",
            day: "30"
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
                parts.push("2026-01-30");
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
          
          console.log("[FlowPath] Widget data updated:", {
            segments: segments.map(s => ({type: s.type, enabled: s.enabled})),
            config: config
          });
        };

        // Function to update presets from external sync (called by other nodes)
        const updatePresetsFromSync = (newPresetName, presetData, deletedPresetName) => {
          if (deletedPresetName) {
            // Remove the preset from our local presets
            if (presets[deletedPresetName]) {
              delete presets[deletedPresetName];
              console.log(`[FlowPath] Node ${node.id}: Removed synced preset "${deletedPresetName}"`);
            }
          } else if (newPresetName && presetData) {
            // Add/update the preset in our local presets
            presets[newPresetName] = JSON.parse(JSON.stringify(presetData));
            console.log(`[FlowPath] Node ${node.id}: Added synced preset "${newPresetName}"`);
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
            
            console.log(`[FlowPath] Syncing presets to ${allFlowPathNodes.length} other FlowPath nodes`);
            
            let syncedCount = 0;
            allFlowPathNodes.forEach(otherNode => {
              try {
                // Use the dedicated sync function if available (preferred method)
                if (otherNode.flowPathSyncPreset) {
                  const presetData = newPresetName ? presets[newPresetName] : null;
                  otherNode.flowPathSyncPreset(newPresetName, presetData, deletedPresetName);
                  syncedCount++;
                  console.log(`[FlowPath] Synced preset to node ${otherNode.id} via flowPathSyncPreset`);
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
                  console.log(`[FlowPath] Synced preset to node ${otherNode.id} via fallback`);
                }
              } catch (e) {
                console.warn(`[FlowPath] Failed to sync preset to node ${otherNode.id}:`, e);
              }
            });
            
            if (syncedCount > 0) {
              if (newPresetName) {
                showToast(`Preset synced to ${syncedCount} other FlowPath node(s)`, "info", 2000);
              } else if (deletedPresetName) {
                showToast(`Preset removed from ${syncedCount} other FlowPath node(s)`, "info", 2000);
              }
            }
          } catch (error) {
            console.error("[FlowPath] Error syncing presets:", error);
          }
        };

        const showInputDialog = (title, defaultValue = "", placeholder = "") => {
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
            `;

            const titleEl = document.createElement("div");
            titleEl.textContent = title;
            titleEl.style.cssText = `
              color: #fff;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 16px;
            `;
            dialog.appendChild(titleEl);

            const input = document.createElement("input");
            input.type = "text";
            input.value = defaultValue;
            input.placeholder = placeholder;
            input.style.cssText = `
              width: 100%;
              padding: 10px;
              background: rgba(0, 0, 0, 0.4);
              border: 2px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: #fff;
              font-size: 14px;
              margin-bottom: 16px;
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
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.05);
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
          
          container.style.cssText = `
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

          // PATH & FILENAME PREVIEW
          const preview = document.createElement("div");
          preview.style.cssText = `
            margin-bottom: 12px;
            padding: 12px 14px;
            background: ${theme.gradient};
            border-radius: 8px;
            border-left: 4px solid ${theme.primary};
            color: ${theme.accent};
            font-size: 12px;
            word-break: break-all;
            font-family: 'Consolas', 'Monaco', monospace;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
          `;
          const previewPath = buildPreviewPath();
          console.log("[FlowPath] Building preview with segments:", segments.map(s => `${s.type}${s.enabled === false ? '(disabled)' : ''}`).join(', '));
          console.log("[FlowPath] Preview path:", previewPath);
          
          // Build filename preview - check raw template, not processed value
          const hasFilenameTemplate = config.filename_template && config.filename_template.trim();
          let filenamePreviewStr = "";
          if (hasFilenameTemplate) {
            filenamePreviewStr = replaceTemplateVars(config.filename_template, true);
          }
          
          let previewHtml = "";
          
          if (hasFilenameTemplate) {
            // Filename template is set - path is folders only (show trailing / to indicate folder)
            previewHtml = `<strong style="color: ${theme.accent};">📁 path:</strong> <span style="color: #fff; font-weight: 500;">${previewPath || "(empty)"} /</span>`;
            previewHtml += `<br><strong style="color: ${theme.accent};">📝 filename:</strong> <span style="color: #fff; font-weight: 500;">${filenamePreviewStr || config.filename_template}_##.[ext]</span>`;
            previewHtml += `<br><span style="color: rgba(255,255,255,0.4); font-size: 10px; margin-top: 4px; display: block;">Image Saver result: ${previewPath} / ${filenamePreviewStr || config.filename_template}_##.[ext]</span>`;
          } else {
            // No filename - path acts as filename prefix for Save Image
            previewHtml = `<strong style="color: ${theme.accent};">📁 path:</strong> <span style="color: #fff; font-weight: 500;">${previewPath || "(empty)"}_#####.[ext]</span>`;
            previewHtml += `<br><span style="color: rgba(255,255,255,0.4); font-size: 10px;">For Image Saver: expand 📝 Filename section below</span>`;
          }
          
          preview.innerHTML = previewHtml;
          container.appendChild(preview);

          // PATH SEGMENTS SECTION
          const segmentsSection = createSection("📋 Path Segments", segmentsExpanded, () => {
            segmentsExpanded = !segmentsExpanded;
            renderUI();
            updateNodeSize();
          });
          container.appendChild(segmentsSection.section);

          if (segmentsExpanded) {
            segments.forEach((segment, index) => {
              const segInfo = SEGMENT_TYPES[segment.type] || { icon: "❓", label: segment.type };
              
              const row = document.createElement("div");
              row.draggable = true;
              row.dataset.index = index;
              row.title = segInfo.tooltip || ""; // Add tooltip
              row.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px;
                margin: 3px 0;
                background: ${segment.enabled ? theme.gradient : 'rgba(255, 255, 255, 0.03)'};
                border-radius: 6px;
                cursor: move;
                transition: all 0.2s;
                border-left: 3px solid ${segment.enabled ? theme.primary : 'transparent'};
                border: 1px solid ${segment.enabled ? theme.primaryLight : 'rgba(255, 255, 255, 0.05)'};
                position: relative;
              `;
              
              // Show/hide delete button on hover (for cleaner UI)
              row.onmouseenter = () => {
                const deleteBtn = row.querySelector('.gensort-delete-btn');
                if (deleteBtn) {
                  deleteBtn.style.opacity = '1';
                  deleteBtn.style.pointerEvents = 'auto';
                }
                // Subtle highlight on hover
                if (segment.enabled) {
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
                // Reset border
                if (segment.enabled) {
                  row.style.borderColor = theme.primaryLight;
                } else {
                  row.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }
              };

              row.addEventListener('dragstart', (e) => {
                draggedIndex = index;
                row.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
              });

              // Track drop position (before or after current row)
              let dropPosition = 'after';

              row.addEventListener('dragend', (e) => {
                row.style.opacity = '1';
                draggedIndex = null;
                container.querySelectorAll('.gensort-drag-over').forEach(el => {
                  el.classList.remove('gensort-drag-over');
                  el.style.borderTop = '';
                  el.style.borderBottom = '';
                });
              });

              row.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== index) {
                  // Determine if we're in the top or bottom half of the row
                  const rect = row.getBoundingClientRect();
                  const midpoint = rect.top + rect.height / 2;
                  const mouseY = e.clientY;
                  
                  // Clear previous highlights
                  row.style.borderTop = '';
                  row.style.borderBottom = '';
                  
                  if (mouseY < midpoint) {
                    // Top half - insert BEFORE this item
                    row.classList.add('gensort-drag-over');
                    row.style.borderTop = `3px solid ${theme.primary}`;
                    dropPosition = 'before';
                  } else {
                    // Bottom half - insert AFTER this item
                    row.classList.add('gensort-drag-over');
                    row.style.borderBottom = `3px solid ${theme.primary}`;
                    dropPosition = 'after';
                  }
                }
              });

              row.addEventListener('dragleave', (e) => {
                row.classList.remove('gensort-drag-over');
                row.style.borderTop = '';
                row.style.borderBottom = '';
              });

              row.addEventListener('drop', (e) => {
                e.preventDefault();
                row.classList.remove('gensort-drag-over');
                row.style.borderTop = '';
                row.style.borderBottom = '';
                
                if (draggedIndex !== null && draggedIndex !== index) {
                  const [movedItem] = segments.splice(draggedIndex, 1);
                  
                  // Calculate correct insert index based on drop position
                  let insertIndex;
                  if (dropPosition === 'before') {
                    insertIndex = draggedIndex < index ? index - 1 : index;
                  } else {
                    insertIndex = draggedIndex < index ? index : index + 1;
                  }
                  
                  segments.splice(insertIndex, 0, movedItem);
                  
                  console.log("[FlowPath] Segments reordered from index", draggedIndex, "to", insertIndex);
                  console.log("[FlowPath] New segment order:", segments.map(s => s.type).join(', '));
                  
                  // Clear active preset on user modification
                  activePresetName = null;
                  
                  // Update widget data and re-render
                  updateWidgetData();
                  renderUI();
                  updateNodeSize();
                }
              });

              const dragHandle = document.createElement("span");
              dragHandle.textContent = "⋮⋮";
              dragHandle.style.cssText = `
                margin-right: 10px;
                color: rgba(255, 255, 255, 0.5);
                user-select: none;
                font-size: 16px;
              `;
              row.appendChild(dragHandle);

              const icon = document.createElement("span");
              icon.textContent = segInfo.icon;
              icon.style.cssText = `
                margin-right: 8px;
                font-size: 16px;
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

              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.checked = segment.enabled !== false;
              checkbox.style.cssText = `
                width: ${btnSize};
                height: ${btnSize};
                cursor: pointer;
                accent-color: ${theme.accent};
              `;
              checkbox.onclick = (e) => {
                e.stopPropagation();
              };
              checkbox.onchange = () => {
                segment.enabled = checkbox.checked;
                activePresetName = null; // Clear active preset on user modification
                updateWidgetData();
                renderUI();
                updateNodeSize();
              };
              row.appendChild(checkbox);

              segmentsSection.content.appendChild(row);
            });

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

            const addSelect = document.createElement("select");
            addSelect.className = "gensort-pro-select";
            addSelect.style.cssText = `
              flex: 1;
              padding: 6px 10px;
              background: #1a1a1a;
              border: 1px solid ${theme.primaryLight};
              border-radius: 6px;
              color: #fff;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            `;

            // Default option
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "-- Select to add --";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            addSelect.appendChild(defaultOption);

            // Get ALL segment types that aren't currently in segments
            const allSegmentTypes = Object.keys(SEGMENT_TYPES).filter(type => type !== 'custom');
            const availableTypes = allSegmentTypes.filter(
              type => !segments.some(s => s.type === type)
            );

            // Add options for available segment types
            availableTypes.forEach(type => {
              const segInfo = SEGMENT_TYPES[type];
              const option = document.createElement("option");
              option.value = type;
              option.textContent = `${segInfo.icon} ${segInfo.label}`;
              option.title = segInfo.tooltip || ""; // Add tooltip
              addSelect.appendChild(option);
            });

            // Always add "Custom" option
            const customOption = document.createElement("option");
            customOption.value = "custom";
            customOption.textContent = "✨ Custom";
            addSelect.appendChild(customOption);

            addSelect.onchange = async () => {
              const selectedType = addSelect.value;
              
              if (selectedType === "custom") {
                const name = await showInputDialog("Custom Template", "", "Example: {model}_{resolution}");
                if (name) {
                  segments.push({ type: "custom", value: name, enabled: true });
                  activePresetName = null; // Clear active preset on user modification
                  updateWidgetData();
                  renderUI();
                  updateNodeSize();
                }
              } else if (selectedType) {
                segments.push({ type: selectedType, enabled: true });
                activePresetName = null; // Clear active preset on user modification
                updateWidgetData();
                renderUI();
                updateNodeSize();
              }
              
              // Reset dropdown
              addSelect.value = "";
            };

            addSelect.onfocus = () => {
              addSelect.style.borderColor = theme.primary;
              addSelect.style.boxShadow = `0 0 0 2px ${theme.primaryLight}`;
            };
            
            addSelect.onblur = () => {
              addSelect.style.borderColor = theme.primaryLight;
              addSelect.style.boxShadow = 'none';
            };

            addSegmentContainer.appendChild(addSelect);
            segmentsSection.content.appendChild(addSegmentContainer);
          }

          // CONFIGURATION SECTION
          const configSection = createSection("⚙️ Configuration", configExpanded, () => {
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
          
          // Make sure header content is above the overlay
          Array.from(configSection.header.children).forEach(child => {
            if (child !== headerWarningOverlay) {
              child.style.position = 'relative';
              child.style.zIndex = '1';
            }
          });

          // Function to check for empty fields and update header styling
          const updateConfigHeaderWarning = () => {
            const textFieldTypes = ["name", "project", "series", "resolution", "model", "lora"];
            const hasEmptyFields = segments.some(seg => {
              if (seg.enabled === false) return false;
              if (textFieldTypes.includes(seg.type)) {
                const configKeys = { name: "name", project: "project_name", series: "series_name", resolution: "resolution", model: "model_name", lora: "lora_name" };
                const key = configKeys[seg.type];
                return !config[key] || !config[key].trim();
              }
              if (seg.type === "custom") {
                return !seg.value || !seg.value.trim();
              }
              return false;
            });

            // Animate the overlay opacity
            headerWarningOverlay.style.opacity = hasEmptyFields ? '1' : '0';
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
                  label: "✨ Custom Template",
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
                    background: #1a1a1a;
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
                    background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.1));
                    border: 1px solid ${isCustomEmpty ? 'rgba(239, 68, 68, 0.7)' : 'rgba(168, 85, 247, 0.5)'};
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
                      // Input styling - red border and glow (keep purple background)
                      input.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                      input.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.4), inset 0 0 8px rgba(239, 68, 68, 0.15)';
                      // Row styling - red background and glow
                      row.style.background = 'rgba(239, 68, 68, 0.08)';
                      row.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.05)';
                      // Label styling - red color
                      label.style.color = 'rgba(248, 113, 113, 0.9)';
                    } else {
                      // Input styling - normal purple
                      input.style.borderColor = 'rgba(168, 85, 247, 0.5)';
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
                      input.style.borderColor = 'rgba(168, 85, 247, 0.8)';
                      input.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.3)';
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
                  preview.innerHTML = `<strong style="color: ${theme.accent};">📁 Output Path:</strong><br><span style="color: #fff; font-weight: 500;">${buildPreviewPath()}</span>`;
                };

                // Store references to category and name inputs for dynamic updates
                if (item.key === "category") {
                  categoryInput = input;
                } else if (item.key === "name") {
                  nameInput = input;
                }

                row.appendChild(input);

                // Add auto-detect button for Model, LoRA, and Resolution fields
                if (item.key === "model_name" || item.key === "lora_name" || item.key === "resolution") {
                  console.log("[FlowPath] Creating auto-detect button for:", item.key);
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
                    console.log("[FlowPath] ===== BUTTON CLICKED =====");
                    console.log("[FlowPath] Field type:", item.key);
                    
                    // Show loading spinner
                    detectBtn.textContent = "⏳";
                    detectBtn.disabled = true;
                    detectBtn.style.cursor = "wait";
                    
                    // Use setTimeout to allow UI to update before detection
                    setTimeout(() => {
                      try {
                        console.log("[FlowPath] Auto-detect button clicked for:", item.key);
                        console.log("[FlowPath] Current graph:", app.graph);
                        
                        if (item.key === "model_name") {
                        // Detect model
                        const detected = detectModelFromWorkflow(app.graph);
                        
                        if (detected) {
                          const modelName = detected.model || detected; // Handle both old string and new object format
                          input.value = modelName;
                          config[item.key] = modelName;
                          activePresetName = null; // Clear active preset on auto-detect modification
                          updateWidgetData();
                          preview.innerHTML = `<strong style="color: ${theme.accent};">📁 Output Path:</strong><br><span style="color: #fff; font-weight: 500;">${buildPreviewPath()}</span>`;
                          
                          // Remove red highlight since field is now filled - input, row, and label
                          input.style.borderColor = theme.primaryLight;
                          input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                          row.style.background = 'transparent';
                          row.style.boxShadow = 'none';
                          label.style.color = 'rgba(255, 255, 255, 0.8)';
                          
                          // Update config header warning
                          updateConfigHeaderWarning();
                          
                          // Visual feedback
                          detectBtn.textContent = "✅";
                          setTimeout(() => { detectBtn.textContent = "↻"; }, 1000);
                          
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
                        console.log("[FlowPath] Detection result:", detected);
                        console.log("[FlowPath] Current LoRA format setting:", globalSettings.loraPathFormat);
                        
                        if (detected && detected.length > 0) {
                          const formatted = formatLoraPath(detected, globalSettings.loraPathFormat);
                          console.log("[FlowPath] Formatted LoRAs:", formatted, "Type:", typeof formatted);
                          
                          // Handle separate folders mode (returns array)
                          if (Array.isArray(formatted)) {
                            // For separate mode, join with special delimiter that backend can split
                            const joinedValue = formatted.join(" | ");
                            input.value = formatted.join(", "); // Display with commas
                            config[item.key] = joinedValue; // Store as delimited string for backend
                            console.log("[FlowPath] Stored as pipe-delimited:", joinedValue);
                          } else {
                            input.value = formatted;
                            config[item.key] = formatted;
                            console.log("[FlowPath] Stored as string:", formatted);
                          }
                          
                          console.log("[FlowPath] Final config.lora_name:", config.lora_name);
                          activePresetName = null; // Clear active preset on auto-detect modification
                          updateWidgetData();
                          
                          const previewPath = buildPreviewPath();
                          console.log("[FlowPath] Preview path:", previewPath);
                          preview.innerHTML = `<strong style="color: ${theme.accent};">📁 Output Path:</strong><br><span style="color: #fff; font-weight: 500;">${previewPath}</span>`;
                          
                          // Remove red highlight since field is now filled - input, row, and label
                          input.style.borderColor = theme.primaryLight;
                          input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                          row.style.background = 'transparent';
                          row.style.boxShadow = 'none';
                          label.style.color = 'rgba(255, 255, 255, 0.8)';
                          
                          // Update config header warning
                          updateConfigHeaderWarning();
                          
                          // Visual feedback
                          detectBtn.textContent = "✅";
                          setTimeout(() => { detectBtn.textContent = "↻"; }, 1000);
                          
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
                          preview.innerHTML = `<strong style="color: ${theme.accent};">📁 Output Path:</strong><br><span style="color: #fff; font-weight: 500;">${buildPreviewPath()}</span>`;
                          
                          // Remove red highlight since field is now filled - input, row, and label
                          input.style.borderColor = theme.primaryLight;
                          input.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.3)';
                          row.style.background = 'transparent';
                          row.style.boxShadow = 'none';
                          label.style.color = 'rgba(255, 255, 255, 0.8)';
                          
                          // Update config header warning
                          updateConfigHeaderWarning();
                          
                          // Visual feedback
                          detectBtn.textContent = "✅";
                          setTimeout(() => { detectBtn.textContent = "↻"; }, 1000);
                          
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

          // FILENAME SECTION (for Image Saver compatibility)
          const filenameSection = createSection("📝 Filename (for Image Saver)", filenameExpanded, () => {
            filenameExpanded = !filenameExpanded;
            renderUI();
            updateNodeSize();
          });
          container.appendChild(filenameSection.section);

          if (filenameExpanded) {
            // Description
            const filenameDesc = document.createElement("div");
            filenameDesc.style.cssText = `
              color: rgba(255, 255, 255, 0.6);
              font-size: 11px;
              margin-bottom: 10px;
              line-height: 1.4;
            `;
            filenameDesc.innerHTML = `Build filename pattern for Image Saver. Use <span style="color: ${theme.accent};">{variables}</span> for FlowPath values and <span style="color: ${theme.secondary};">%variables</span> for Image Saver values.`;
            filenameSection.content.appendChild(filenameDesc);

            // Filename input
            const filenameInputRow = document.createElement("div");
            filenameInputRow.style.cssText = `
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            `;

            const filenameLabel = document.createElement("label");
            filenameLabel.textContent = "Pattern:";
            filenameLabel.style.cssText = `
              flex: 0 0 60px;
              color: rgba(255, 255, 255, 0.8);
              font-size: 12px;
              font-weight: 500;
            `;
            filenameInputRow.appendChild(filenameLabel);

            const filenameInput = document.createElement("input");
            filenameInput.type = "text";
            filenameInput.value = config.filename_template || "";
            filenameInput.placeholder = "Example: {name}_%seed or {label}_%time_%seed";
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
            filenameInput.onchange = () => {
              config.filename_template = filenameInput.value;
              activePresetName = null;
              updateWidgetData();
              renderUI();
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
              { var: "{name}", label: "Name" },
              { var: "{label}", label: "Label" },
              { var: "{lora}", label: "LoRA" },
              { var: "{model}", label: "Model" },
              { var: "{category}", label: "Category" },
              { var: "{date}", label: "Date" },
              { var: "{resolution}", label: "Resolution" }
            ];

            const flowPathBtnsRow = document.createElement("div");
            flowPathBtnsRow.style.cssText = `
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
            `;

            flowPathVars.forEach(item => {
              const btn = document.createElement("button");
              btn.textContent = item.var;
              btn.title = `Insert ${item.label}`;
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
              btn.onclick = () => {
                // Insert at cursor position or end
                const cursorPos = filenameInput.selectionStart;
                const textBefore = filenameInput.value.substring(0, cursorPos);
                const textAfter = filenameInput.value.substring(cursorPos);
                filenameInput.value = textBefore + item.var + textAfter;
                config.filename_template = filenameInput.value;
                activePresetName = null;
                updateWidgetData();
                filenameInput.focus();
                filenameInput.setSelectionRange(cursorPos + item.var.length, cursorPos + item.var.length);
                renderUI();
              };
              flowPathBtnsRow.appendChild(btn);
            });
            quickInsertContainer.appendChild(flowPathBtnsRow);

            // Image Saver variables section
            const imageSaverVarsLabel = document.createElement("div");
            imageSaverVarsLabel.style.cssText = `
              color: ${theme.secondary};
              font-size: 11px;
              font-weight: 600;
              margin-top: 6px;
              margin-bottom: 2px;
            `;
            imageSaverVarsLabel.textContent = "Image Saver Variables (pass-through):";
            quickInsertContainer.appendChild(imageSaverVarsLabel);

            const imageSaverVars = [
              { var: "%seed", label: "Seed" },
              { var: "%time", label: "Time" },
              { var: "%date", label: "Date" },
              { var: "%counter", label: "Counter" },
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
              btn.title = `Insert ${item.label} (processed by Image Saver)`;
              btn.style.cssText = `
                padding: 4px 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid ${theme.secondary};
                border-radius: 4px;
                color: ${theme.secondary};
                font-size: 10px;
                font-family: 'Consolas', 'Monaco', monospace;
                cursor: pointer;
                transition: all 0.2s;
              `;
              btn.onmouseover = () => {
                btn.style.background = theme.secondary;
                btn.style.color = '#fff';
                btn.style.transform = 'scale(1.05)';
              };
              btn.onmouseout = () => {
                btn.style.background = 'rgba(255, 255, 255, 0.1)';
                btn.style.color = theme.secondary;
                btn.style.transform = 'scale(1)';
              };
              btn.onclick = () => {
                // Insert at cursor position or end
                const cursorPos = filenameInput.selectionStart;
                const textBefore = filenameInput.value.substring(0, cursorPos);
                const textAfter = filenameInput.value.substring(cursorPos);
                filenameInput.value = textBefore + item.var + textAfter;
                config.filename_template = filenameInput.value;
                activePresetName = null;
                updateWidgetData();
                filenameInput.focus();
                filenameInput.setSelectionRange(cursorPos + item.var.length, cursorPos + item.var.length);
                renderUI();
              };
              imageSaverBtnsRow.appendChild(btn);
            });
            quickInsertContainer.appendChild(imageSaverBtnsRow);

            filenameSection.content.appendChild(quickInsertContainer);

            // Filename preview
            const filenamePreview = document.createElement("div");
            filenamePreview.style.cssText = `
              margin-top: 10px;
              padding: 8px 10px;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 6px;
              border-left: 3px solid ${theme.secondary};
              font-family: 'Consolas', 'Monaco', monospace;
              font-size: 11px;
            `;
            
            // Build filename preview
            let filenamePreviewText = config.filename_template || "(empty - Image Saver will use its default)";
            if (config.filename_template) {
              // Replace FlowPath variables for preview
              filenamePreviewText = replaceTemplateVars(config.filename_template, true);
            }
            
            filenamePreview.innerHTML = `<span style="color: rgba(255, 255, 255, 0.6);">Preview:</span> <span style="color: #fff;">${filenamePreviewText}</span>`;
            filenameSection.content.appendChild(filenamePreview);
          }

          // PRESETS SECTION
          const presetsSection = createSection("💾 Presets", presetsExpanded, () => {
            presetsExpanded = !presetsExpanded;
            
            // When opening presets section, refresh global presets from localStorage
            if (presetsExpanded) {
              const freshGlobalPresets = loadGlobalPresets();
              
              // Add any new global presets that don't exist locally
              Object.keys(freshGlobalPresets).forEach(presetName => {
                if (!presets[presetName]) {
                  presets[presetName] = freshGlobalPresets[presetName];
                  console.log(`[FlowPath] Loaded new global preset: "${presetName}"`);
                }
              });
              
              // Remove any custom presets that were deleted from global storage
              // (only remove custom presets, not default presets)
              Object.keys(presets).forEach(presetName => {
                const isDefaultPreset = defaultPresets.hasOwnProperty(presetName);
                const existsInGlobal = freshGlobalPresets.hasOwnProperty(presetName);
                
                // If it's a custom preset and it's not in global storage, it was deleted
                if (!isDefaultPreset && !existsInGlobal) {
                  delete presets[presetName];
                  console.log(`[FlowPath] Removed deleted global preset: "${presetName}"`);
                  
                  // Clear active preset if it was the deleted one
                  if (activePresetName === presetName) {
                    activePresetName = null;
                  }
                }
              });
              
              // Update widget data to reflect changes
              updateWidgetData();
            }
            
            renderUI();
            updateNodeSize();
          });
          container.appendChild(presetsSection.section);

          if (presetsExpanded) {
            // Separate default and custom presets
            const defaultPresetNames = Object.keys(defaultPresets);
            const customPresetNames = Object.keys(presets).filter(name => !defaultPresets.hasOwnProperty(name));
            
            // Helper function to render preset row
            const renderPresetRow = (name, isDefaultPreset, parentContainer) => {
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
                  if (!isActive) {
                    presetRow.style.background = 'rgba(255, 255, 255, 0.06)';
                    presetRow.style.borderColor = theme.primaryLight;
                  } else {
                    presetRow.style.background = 'rgba(34, 197, 94, 0.2)';
                    presetRow.style.borderColor = 'rgba(34, 197, 94, 0.7)';
                  }
                  // Show delete button on hover (only for custom presets)
                  const deleteBtn = presetRow.querySelector('.preset-delete-btn');
                  if (deleteBtn) {
                    deleteBtn.style.opacity = '1';
                    deleteBtn.style.pointerEvents = 'auto';
                  }
                };
                presetRow.onmouseleave = () => {
                  if (!isActive) {
                    presetRow.style.background = 'rgba(255, 255, 255, 0.03)';
                    presetRow.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  } else {
                    presetRow.style.background = 'rgba(34, 197, 94, 0.15)';
                    presetRow.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                  }
                  // Hide delete button when not hovering
                  const deleteBtn = presetRow.querySelector('.preset-delete-btn');
                  if (deleteBtn) {
                    deleteBtn.style.opacity = '0';
                    deleteBtn.style.pointerEvents = 'none';
                  }
                };

                const presetName = document.createElement("span");
                presetName.textContent = isActive ? `${name}` : name;
                presetName.style.cssText = `
                  flex: 1;
                  color: ${isActive ? 'rgba(134, 239, 172, 1)' : '#fff'};
                  font-size: 12px;
                  font-weight: ${isActive ? '600' : '500'};
                  transition: color 0.4s ease-in-out;
                `;
                presetRow.appendChild(presetName);
                
                // Add active indicator checkmark for loaded preset
                if (isActive) {
                  const activeIndicator = document.createElement("span");
                  activeIndicator.textContent = "✓";
                  activeIndicator.style.cssText = `
                    color: rgba(34, 197, 94, 1);
                    font-size: 14px;
                    font-weight: bold;
                    margin-right: 8px;
                  `;
                  presetRow.insertBefore(activeIndicator, presetName);
                }

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
                loadBtn.onclick = () => {
                  const preset = presets[name];
                  // Preserve the node_label since it identifies this specific node, not the preset
                  const currentLabel = config.node_label;
                  
                  segments = JSON.parse(JSON.stringify(preset.segments));
                  config = JSON.parse(JSON.stringify(preset.config));
                  
                  // Restore the node label
                  config.node_label = currentLabel;
                  
                  // Set this preset as active for visual highlighting
                  activePresetName = name;
                  
                  updateWidgetData();
                  renderUI();
                  updateNodeSize();
                  
                  // Show success toast
                  showToast(`Preset "${name}" loaded successfully!`, "success", 2000);
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
                  cancelBtn.onclick = () => {
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
                  confirmBtn.onclick = () => {
                    const deletedName = name; // Capture the name before deleting
                    delete presets[name];
                    
                    // Remove from global storage
                    const currentGlobalPresets = loadGlobalPresets();
                    if (currentGlobalPresets[deletedName]) {
                      delete currentGlobalPresets[deletedName];
                      saveGlobalPresets(currentGlobalPresets);
                    }
                    
                    updateWidgetData();
                    renderUI();
                    updateNodeSize();
                    container.focus();
                    
                    // Sync the deletion to all other FlowPath nodes in this workflow
                    syncPresetsToAllNodes(null, deletedName);
                    
                    // Show success toast
                    showToast(`Preset "${name}" deleted successfully!`, "success", 2000);
                  };

                  confirmBtns.appendChild(cancelBtn);
                  confirmBtns.appendChild(confirmBtn);
                  confirmRow.appendChild(confirmBtns);

                  deleteBtn.onclick = () => {
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
                  // Default preset - add reset button if modified, then load button
                  const currentPreset = presets[name];
                  const originalPreset = defaultPresets[name];
                  const isModified = JSON.stringify(currentPreset) !== JSON.stringify(originalPreset);
                  
                  if (isModified) {
                    const resetBtn = document.createElement("button");
                    resetBtn.className = 'preset-reset-btn';
                    resetBtn.textContent = "↺";
                    resetBtn.title = "Reset to default";
                    resetBtn.style.cssText = `
                      width: 24px;
                      height: 24px;
                      padding: 0;
                      background: rgba(251, 191, 36, 0.3);
                      border: 1px solid rgba(251, 191, 36, 0.5);
                      border-radius: 4px;
                      color: #fbbf24;
                      cursor: pointer;
                      font-size: 14px;
                      font-weight: bold;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      transition: all 0.2s;
                      margin-right: 6px;
                    `;
                    resetBtn.onmouseover = () => {
                      resetBtn.style.background = 'rgba(251, 191, 36, 0.5)';
                      resetBtn.style.color = '#fff';
                      resetBtn.style.transform = 'scale(1.1)';
                    };
                    resetBtn.onmouseout = () => {
                      resetBtn.style.background = 'rgba(251, 191, 36, 0.3)';
                      resetBtn.style.color = '#fbbf24';
                      resetBtn.style.transform = 'scale(1)';
                    };
                    resetBtn.onclick = async () => {
                      const shouldReset = await showConfirmDialog(
                        "Reset Default Preset?",
                        `Reset "${name}" to its original default settings?`,
                        "Reset",
                        "Cancel"
                      );
                      if (shouldReset) {
                        // Restore original default preset
                        presets[name] = JSON.parse(JSON.stringify(defaultPresets[name]));
                        updateWidgetData();
                        renderUI();
                        updateNodeSize();
                        showToast(`Preset "${name}" reset to default!`, "success", 2000);
                      }
                    };
                    presetRow.appendChild(resetBtn);
                  }
                  
                  presetRow.appendChild(loadBtn);
                  presetWrapper.appendChild(presetRow);
                }

                parentContainer.appendChild(presetWrapper);
                return presetWrapper;
            };
            
            // DEFAULT PRESETS SUB-ACCORDION
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
            defaultPresetsTitle.textContent = `⭐ Default Presets (${defaultPresetNames.length})`;
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
            customPresetsTitle.textContent = `✨ Custom Presets (${customPresetNames.length})`;
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
          }

          // Save Preset Button (always visible, outside accordion)
          const savePresetBtn = document.createElement("button");
          savePresetBtn.textContent = "💾 Save Current as Preset";
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
            
            // Show warning if there are empty fields
            if (emptyFields.length > 0) {
              showToast(`Warning: Empty fields: ${emptyFields.join(", ")}`, "warning", 4000);
            }
            
            const name = await showInputDialog("Enter Preset Name", "", "Example: Character Portrait");
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
        
        console.log("[FlowPath] Custom widget added successfully!");
      });
    }
  }
});
