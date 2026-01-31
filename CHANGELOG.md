# Changelog

All notable changes to FlowPath will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-31

### Added

#### SI/IS Output Mode Toggle
- **New mode toggle** in Output Preview header - Switch between Save Image (SI) and Image Saver (IS) modes
- **SI mode**: Path becomes filename prefix (for ComfyUI Save Image node)
- **IS mode**: Path is folder only, filename is separate (for Image Saver custom node)
- Mode preference is saved per node and persists across sessions

#### Interactive Output Preview
- **Click-to-copy** - Click the path preview to copy to clipboard with green flash animation feedback
- **Shift+click to open folder** - Opens output folder in your file explorer
  - Creates folder if it doesn't exist (with confirmation prompt)
  - Smart handling for SI mode (strips filename prefix to determine actual folder)
  - Smart handling for seed segment (if seed is last, opens parent folder since seed changes)

#### Preset Improvements
- **Blank preset** - New default preset that clears all segments while preserving SI/IS mode
- **Preset multi-select** - Shift+click for range selection to bulk delete multiple presets
- **Hide Default Presets setting** - Option to hide built-in presets and show only custom ones
- **Preset loading animation setting** - Toggle the diagonal stripe animation (shows toast notification when disabled)

#### New Node Defaults
- **New nodes start blank** - Fresh FlowPath nodes now start with no segments enabled (matching Blank preset)
- Users can quickly load a preset or add segments manually

### Changed
- **Folder opening improved** - Uses window blur trick to reliably bring Explorer to front (bypasses Windows focus-stealing prevention)
- Empty path now defaults to `ComfyUI` in SI mode (prevents saves to unexpected locations)
- Empty path defaults to empty string in IS mode (outputs to root folder)
- Standardized input backgrounds with dark gradients across all 7 themes
- Output Preview uses theme colors for both sticky and non-sticky modes
- Settings now have clean human-readable IDs (removed numeric prefixes)
- Auto-detect immediately re-renders UI (fixes segment row not updating bug)

### Fixed
- SI/IS switch background no longer disappears when toggling
- Consistent styling across all theme gradient backgrounds

### Code Quality
- Removed 84 debug console.log statements from JavaScript (kept only version message)
- Single startup message: `FlowPath v1.2.0 loaded`

---

## [1.1.1] - 2026-01-31

### Fixed
- **Seed detection for SamplerCustomAdvanced workflows** - Now detects seeds from `RandomNoise` and `DisableNoise` nodes which use `noise_seed` instead of `seed`

### Added
- **New example workflow** - `FlowPath Example T2I Workflow (SamplerCustomAdvanced).json` for testing seed detection with advanced samplers

---

## [1.1.0] - 2026-01-30

### Added

#### Dual Outputs (Image Saver Compatibility)
- **Two outputs** - `path` and `filename` for maximum compatibility
- **Filename Builder UI** - New section to build custom filename patterns
- **FlowPath variables** - Use `{name}`, `{label}`, `{lora}`, `{model}`, etc. in filenames
- **Image Saver pass-through** - Support for `%seed`, `%time`, `%counter`, `%model`, etc.
- **Quick-insert buttons** - Click to insert variables at cursor position
- **Live filename preview** - See your filename pattern as you build it

#### How It Works
| Node | Connect | Result |
|------|---------|--------|
| **Save Image** | `path` → `filename_prefix` | `path_#####.png` |
| **Image Saver** | `path` → `path`, `filename` → `filename` | `path/filename_##.png` |

#### How to Use with Image Saver
1. Expand the **📝 Filename** section
2. Build your filename pattern (e.g., `{name}_%seed`)
3. Connect `path` → Image Saver's `path`
4. Connect `filename` → Image Saver's `filename`

Example: `{name}_%seed` → `Umbrael_12345678`

#### New Example Workflow
- **FlowPath Example T2I Workflow (Image Saver).json** - Demonstrates dual output usage with Image Saver

### Changed
- FlowPath now outputs both `path` and `filename`
- Filename section collapsed by default (expand for Image Saver users)
- Presets work seamlessly with filename patterns
- Preview dynamically shows `path` with/without trailing `/` based on filename usage

---

## [1.0.0] - 2026-01-30

### Added

#### Core Features
- **Intelligent Path Organization** - Build structured output paths with drag-and-drop segments
- **Live Preview** - See exactly what your file path will look like as you configure
- **Template Variables** - Use `{model}`, `{lora}`, `{seed}`, `{date}`, `{label}`, and more in custom segments

#### Available Segments
- File Type (Image/Video)
- Project Name
- Category (Characters, Locations, Objects, Concepts, Styles)
- Name
- Content Rating (SFW/NSFW)
- Date (configurable format)
- Series Name
- Resolution
- Model Name
- LoRA Name
- Seed
- Output Label
- Custom Segments (with template variable support)

#### Auto-Detection
- Model detection from CheckpointLoader nodes
- LoRA detection with multiple format options (Primary Only, Primary + Count, All, Separate Folders)
- Resolution detection from EmptyLatentImage and other latent nodes
- Seed detection from KSampler and Seed Generator nodes

#### Preset System
- 4 default presets (Simple Daily, Character Work, Project Organized, Complete Metadata)
- Save/load custom presets
- Global preset storage (available across all workflows)
- Auto-sync presets between FlowPath nodes in the same workflow
- Cross-workflow preset refresh

#### Multi-Output Support
- Output Label segment for differentiating multiple outputs
- `{label}` and `{output}` template variables
- Label preserved when loading presets

#### Themes
- Ocean Blue
- Forest Green
- Pink Pony Club
- Odie (Orange)
- Umbrael's Umbrage (Purple - Default)
- Plain Jane (Gray)
- The Dark Knight (Batman - Black & Yellow)

#### User Experience
- Toast notifications for success/error/warning messages
- Loading spinners for auto-detection
- Red highlighting for empty required fields
- Green highlighting for active presets
- Smooth animations and transitions
- Drag-and-drop segment reordering

#### Compatibility
- Works with standard Save Image node (full control)
- Works with Video Combine node
- Folder organization with Image Saver (filename handled by Image Saver)
- Wireless connections via Anything Everywhere

### Documentation
- Comprehensive README with all features documented
- 5 example workflows (Basic, Wireless, Multi-Output, Image Saver, SamplerCustomAdvanced)
- Troubleshooting guide

---

## Links

- **GitHub:** https://github.com/maartenharms/comfyui-flowpath
- **Ko-fi:** https://ko-fi.com/maarten_harms
- **Discord:** @itsmern
