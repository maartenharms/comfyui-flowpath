# Contributing to FlowPath 🌊

Thank you for your interest in contributing to FlowPath! This document will help you get started.

## 🎯 How Can I Contribute?

### Reporting Bugs
Found a bug? Please open an issue using the Bug Report template. Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Your ComfyUI version
- Screenshots if applicable

### Suggesting Features
Have an idea? Open a Feature Request issue! Describe:
- The problem you're trying to solve
- Your proposed solution
- Why it would benefit other users

### Code Contributions
Want to contribute code? Awesome! Here's how:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit** (`git commit -m 'Add amazing feature'`)
6. **Push to your fork** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

## 📋 Contribution Guidelines

### What We're Looking For

✅ **Bug fixes** - Always welcome!  
✅ **New node type support** - CheckpointLoaders, LoraLoaders, etc.  
✅ **Auto-detection improvements** - Better detection logic  
✅ **New themes** - More color schemes  
✅ **Documentation improvements** - Typos, clarity, examples  
✅ **Performance optimizations** - Faster, more efficient code  
✅ **UI/UX improvements** - Better user experience  

### What to Avoid

❌ Breaking changes without discussion  
❌ Massive refactors without prior approval  
❌ Removing existing features  
❌ Adding dependencies without good reason  
❌ Code without comments or documentation  

## 🎨 Code Style

### JavaScript
- Use clear, descriptive variable names
- Add comments for complex logic
- Use `const` and `let`, not `var`
- Prefer template literals over string concatenation
- Keep functions focused (do one thing well)

### Python
- Follow PEP 8 style guide
- Add docstrings to functions
- Use type hints where helpful
- Keep functions small and focused

### Example
```javascript
// Good ✅
const detectModelFromWorkflow = (graph) => {
  // Check if graph exists before processing
  if (!graph || !graph._nodes) {
    console.warn("[FlowPath] No graph available");
    return null;
  }
  // ... rest of function
};

// Bad ❌
function d(g) {
  if(!g||!g._nodes)return null;
  // ... no comments, unclear
}
```

## 🧪 Testing Your Changes

Before submitting a PR:

1. **Test in ComfyUI** - Actually load and use your changes
2. **Test multiple scenarios** - Different node types, workflows
3. **Test error cases** - What happens when detection fails?
4. **Check console** - No unexpected errors or warnings
5. **Test with existing workflows** - Don't break backward compatibility

### Common Test Cases

- [ ] Model auto-detection works
- [ ] LoRA auto-detection works
- [ ] Resolution auto-detection works
- [ ] Presets load/save correctly
- [ ] Theme changes apply immediately
- [ ] Path preview updates correctly
- [ ] Filename preview updates correctly
- [ ] Drag & drop works smoothly
- [ ] Settings persist after restart
- [ ] Dual outputs work (path + filename)

## 📝 Commit Messages

Write clear, descriptive commit messages:

```bash
# Good ✅
git commit -m "Add support for DreamShaperLoader node"
git commit -m "Fix LoRA detection for LoRA Stack nodes"
git commit -m "Update README with installation instructions"

# Bad ❌
git commit -m "fix"
git commit -m "updates"
git commit -m "asdf"
```

### Commit Message Format
```
<type>: <short description>

<optional longer description>

<optional footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring without behavior change
- `test:` Adding tests
- `chore:` Maintenance tasks

**Example:**
```
feat: Add support for CustomCheckpointLoader

- Adds CustomCheckpointLoader to recognized node types
- Updates model detection to handle custom node format
- Tested with workflows using this node type

Closes #42
```

## 🤝 Pull Request Process

1. **Open an Issue First** (for major changes)
   - Discuss your approach
   - Get feedback before coding
   - Avoid wasted effort

2. **Keep PRs Focused**
   - One feature/fix per PR
   - Don't mix unrelated changes
   - Smaller PRs = faster reviews

3. **Update Documentation**
   - Update README if needed
   - Add comments to complex code
   - Update CHANGELOG if applicable

4. **Fill Out PR Template**
   - Describe what changed
   - Explain why it's needed
   - Link related issues

5. **Be Patient and Responsive**
   - I'll review as soon as possible
   - Be open to feedback
   - Make requested changes promptly

## 🏷️ Adding Support for New Node Types

This is one of the most common contributions! Here's how:

### For Checkpoint Loaders:
```javascript
// In detectModelFromWorkflow function
const checkpointNodeTypes = [
  "CheckpointLoaderSimple",
  "CheckpointLoader",
  "YourNewNodeType"  // Add here
];
```

### For LoRA Loaders:
```javascript
// In detectLorasFromWorkflow function
const standardLoraTypes = [
  "LoraLoader",
  "YourNewLoRANode"  // Add here
];
```

### For Samplers (Seed Detection):
```javascript
// In detectSeedFromWorkflow function (Python backend)
sampler_types = [
  "KSampler",
  "YourNewSampler"  # Add here
]
```

**Then test it!** Load a workflow with that node and verify auto-detection works.

## 🎨 Adding New Themes

Want to add a new color theme? Here's how:

```javascript
// In flowpath_widget.js, add to THEMES object
const THEMES = {
  // ... existing themes
  your_theme_name: {
    primary: "#yourPrimaryColor",
    primaryLight: "#yourPrimaryLightColor",
    accent: "#yourAccentColor",
    background: "#yourBackgroundColor",
    text: "#yourTextColor"
  }
};
```

**Guidelines:**
- Choose colors with good contrast
- Test readability (text on backgrounds)
- Pick a memorable name
- Consider light/dark mode users

## 📚 Resources

- [ComfyUI Documentation](https://docs.comfy.org/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)

## 💬 Questions?

- **Open an Issue** - For feature ideas or questions
- **Discussions** - For general questions (if enabled)
- **Ko-fi** - For direct support: https://ko-fi.com/maarten_harms

## 🙏 Recognition

All contributors will be credited in:
- Release notes
- README (if significant contribution)
- Git commit history (forever)

Thank you for making FlowPath better <3 🌊

---

**By contributing, you agree that your contributions will be licensed under the MIT License.**
