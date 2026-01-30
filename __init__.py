"""
FlowPath - Intelligent Path Organization for ComfyUI
Free and Open Source (Donations Welcome!)

Author: Maarten Harms
Support: https://ko-fi.com/maarten_harms
GitHub: https://github.com/maartenharms/comfyui-flowpath
"""

from .nodes.flowpath import FlowPath

# Register FlowPath node
NODE_CLASS_MAPPINGS = {
    "FlowPath": FlowPath,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FlowPath": "FlowPath",
}

WEB_DIRECTORY = "./web/comfyui"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]

# Version
__version__ = "1.1.0"  # Dual outputs (path + filename) for Image Saver compatibility
__license__ = "MIT"  # Free to use - donations appreciated

print("🌊 FlowPath v1.1.0 loaded - Free & Open Source")
print("   ✨ Template variables, auto-detection, intelligent path organization")
print("   📝 Dual outputs: path + filename for Image Saver compatibility")
print("   💝 Support development: https://ko-fi.com/maarten_harms")
