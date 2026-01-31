# FlowPath Example Workflows

This folder contains example workflows demonstrating how to use FlowPath in your ComfyUI projects.

## 📁 Available Examples

### 1. **FlowPath Example T2I Workflow.json**
**Basic Direct Connection Method**

This workflow demonstrates the simplest way to use FlowPath:
- Direct wire connection from FlowPath to Save Image node
- Perfect for beginners learning FlowPath
- Clean, visible connection that's easy to understand

**How it works:**
1. FlowPath node organizes your output path structure
2. Connect FlowPath's `path` output directly to Save Image's `filename_prefix` input
3. ComfyUI automatically creates folders and numbers your files

---

### 2. **FlowPath Example T2I Workflow (Wireless).json**
**Advanced Wireless Connection Method**

This workflow shows how to use FlowPath with wireless connections for cleaner, more complex workflows:
- Uses "Anything Everywhere" node for wireless connection
- No visible wires cluttering your canvas
- Great for advanced workflows with multiple save points

**How it works:**
1. Right-click the Save Image node
2. Select **UE connectable inputs** > Enable **filename_prefix**
3. Connect FlowPath's `path` output to an **Anything Everywhere** node
4. The path wirelessly connects to Save Image!

**Requirements:**
- Custom node: [cg-use-everywhere](https://github.com/chrisgoringe/cg-use-everywhere) (Anything Everywhere)

---

### 3. **FlowPath Example T2I Workflow (Multi Output).json**
**Multiple Outputs with Output Labels**

This workflow demonstrates how to handle multiple outputs using the Output Label feature:
- 3 FlowPath nodes, each with a unique Output Label (Bottle1, Bottle2, Bottle3)
- 3 Save Image nodes, each connected to its own FlowPath
- All outputs share the same folder structure but are differentiated by their labels

**How it works:**
1. Add a separate FlowPath node for each output you want to save
2. Enable the **Output Label** segment on each FlowPath node
3. Set a unique label for each node (e.g., "Main", "Upscaled", "Depth")
4. Connect each FlowPath's `path` output to its corresponding Save Image node
5. All images are organized in the same structure but with different label folders

**Preset Syncing:**
- Save a preset in one FlowPath node and it **automatically syncs** to all other FlowPath nodes in the workflow!
- Presets are stored **globally** - they're available across ALL your workflows
- Open the **Presets section** to refresh and see presets saved in other workflows

**Example Output:**
```
Objects/Bottle/2026-01-30/Bottle1/Bottle1_00001.png
Objects/Bottle/2026-01-30/Bottle2/Bottle2_00001.png
Objects/Bottle/2026-01-30/Bottle3/Bottle3_00001.png
```

---

### 4. **FlowPath Example T2I Workflow (Image Saver).json**
**Image Saver Compatibility with Dual Outputs**

This workflow demonstrates how to use FlowPath with ComfyUI-Image-Saver:
- Uses FlowPath's dual outputs (`path` + `filename`) for full Image Saver control
- Shows how to build custom filename patterns with the Filename section
- Supports FlowPath variables ({name}, {label}) and Image Saver variables (%seed, %time)

**How it works:**
1. Add a FlowPath node and expand the **📝 Filename** section
2. Build your filename pattern using variables (e.g., `{name}_%seed`)
3. Connect FlowPath's `path` output to Image Saver's `path` input
4. Connect FlowPath's `filename` output to Image Saver's `filename` input
5. Image Saver uses FlowPath for both folder structure AND filename!

**FlowPath Outputs:**
- **path** → Folder structure (e.g., `Objects/Bottle/2026-01-30`)
- **filename** → Filename pattern (e.g., `Bottle_%seed`)

**Filename Variables:**
- FlowPath: `{name}`, `{label}`, `{lora}`, `{model}`, `{category}`, `{date}`
- Image Saver: `%seed`, `%time`, `%date`, `%counter`, `%model`

**Example Output:**
```
Objects/Bottle/2026-01-30/Bottle_12345678_01.png
```

**Requirements:**
- Custom node: [ComfyUI-Image-Saver](https://github.com/alexopus/ComfyUI-Image-Saver)

---

### 5. **FlowPath Example T2I Workflow (SamplerCustomAdvanced).json**
**Seed Detection with SamplerCustomAdvanced**

This workflow demonstrates FlowPath's seed detection with the advanced sampling workflow:
- Uses `SamplerCustomAdvanced` instead of `KSampler`
- Shows seed detection from `RandomNoise` node
- Perfect for testing FlowPath with advanced/Flux-style workflows

**How it works:**
1. `RandomNoise` node generates noise with a `noise_seed`
2. FlowPath detects the seed from the `RandomNoise` node (not the sampler)
3. The seed is included in your output path

**Nodes included:**
- `CheckpointLoaderSimple` - Loads model, VAE, CLIP
- `RandomNoise` - Generates noise with seed (FlowPath detects this!)
- `BasicGuider` + `KSamplerSelect` + `BasicScheduler`
- `SamplerCustomAdvanced` - Advanced sampler
- `FlowPath` - With Seed segment enabled
- `SaveImage` - Saves with organized path

**Example Output:**
```
Test/SeedTest/123456789/2026-01-31_00001.png
```

**Note:** You may need to change the checkpoint to one you have installed.

---

## 🚀 Getting Started

1. Download one of the example workflows
2. Open ComfyUI and drag the JSON file onto the canvas
3. Read the note node in the workflow for specific instructions
4. Configure FlowPath segments to match your organization needs
5. Queue prompt and watch your files organize automatically!

---

## 💡 Tips

- **Start with the basic workflow** if you're new to FlowPath
- **Use the wireless workflow** when you have complex canvases with many nodes
- **Use the multi-output workflow** when you need to save multiple versions of the same image
- **Use the Image Saver workflow** if you want full control over filenames with Image Saver
- **Use the SamplerCustomAdvanced workflow** for Flux-style or advanced sampling setups
- **Customize the segments** in FlowPath to match your personal workflow
- **Experiment with different segment orders** to find what works best for you
- **Save presets** to quickly apply your favorite configurations across all workflows
- **Open the Presets section** to refresh and see presets from other workflows

---

## 📚 More Information

For full documentation, visit the [FlowPath GitHub repository](https://github.com/maartenharms/comfyui-flowpath)
