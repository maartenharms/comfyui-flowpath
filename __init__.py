"""
FlowPath - Intelligent Path Organization for ComfyUI
Free and Open Source (Donations Welcome!)

Author: Maarten Harms
Support: https://ko-fi.com/maarten_harms
GitHub: https://github.com/maartenharms/comfyui-flowpath
"""

import os
import sys
import subprocess
import time
import logging
import json
import folder_paths
from aiohttp import web
from server import PromptServer

from .nodes.flowpath import FlowPath

# Set up logging
logger = logging.getLogger(__name__)

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
__version__ = (
    "1.3.0"  # Theme dropdown, custom themes, UI/UX improvements, security fixes
)
__license__ = "MIT"  # Free to use - donations appreciated


# Rate limiting for API endpoints
_rate_limit_state = {}
RATE_LIMIT_INTERVAL = 0.5  # Minimum seconds between requests


def _check_rate_limit(endpoint_key):
    """Check if request should be rate limited. Returns True if allowed."""
    now = time.time()
    last_request = _rate_limit_state.get(endpoint_key, 0)
    if now - last_request < RATE_LIMIT_INTERVAL:
        return False
    _rate_limit_state[endpoint_key] = now
    return True


def _validate_path_security(relative_path, base_dir):
    """
    Validate that the resolved path is within the allowed base directory.
    Returns (is_valid, full_path) tuple.

    Security measures:
    - Resolves symlinks to get real path
    - Case-insensitive comparison on Windows
    - Ensures path doesn't escape base directory
    """
    # Build and normalize full path
    full_path = os.path.join(base_dir, relative_path)
    full_path = os.path.normpath(full_path)

    # Resolve symlinks to get the real path
    try:
        real_full_path = os.path.realpath(full_path)
        real_base_dir = os.path.realpath(base_dir)
    except (OSError, ValueError):
        return False, None

    # Ensure base_dir ends with separator for accurate prefix matching
    if not real_base_dir.endswith(os.sep):
        real_base_dir_check = real_base_dir + os.sep
    else:
        real_base_dir_check = real_base_dir

    # Case-insensitive comparison on Windows
    if sys.platform == "win32":
        is_valid = (
            real_full_path.lower() == real_base_dir.lower()
            or real_full_path.lower().startswith(real_base_dir_check.lower())
        )
    else:
        is_valid = real_full_path == real_base_dir or real_full_path.startswith(
            real_base_dir_check
        )

    return is_valid, full_path


def _open_folder_safe(folder_path):
    """
    Safely open a folder in the system file explorer.
    Uses direct executable calls instead of shell commands to prevent injection.
    """
    if not os.path.exists(folder_path):
        return False

    try:
        if sys.platform == "win32":
            # Use explorer.exe directly - safe from command injection
            # The path is passed as a single argument, not interpreted by shell
            subprocess.Popen(
                ["explorer.exe", folder_path],
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        elif sys.platform == "darwin":  # macOS
            subprocess.Popen(["open", folder_path])
        else:  # Linux
            subprocess.Popen(["xdg-open", folder_path])
        return True
    except Exception as e:
        logger.exception("Failed to open folder: %s", folder_path)
        return False


# API Routes for folder operations
@PromptServer.instance.routes.post("/flowpath/open_folder")
async def open_folder(request):
    """Open a folder in the system file explorer"""
    try:
        # Rate limiting
        if not _check_rate_limit("open_folder"):
            return web.json_response(
                {"error": "Rate limited. Please wait."}, status=429
            )

        data = await request.json()
        relative_path = data.get("path", "output")

        # Validate input type
        if not isinstance(relative_path, str):
            return web.json_response({"error": "Invalid path format"}, status=400)

        # Get the ComfyUI output directory as base
        output_dir = folder_paths.get_output_directory()
        base_dir = os.path.dirname(output_dir)  # Go up one level from output

        # Security check: validate path is within allowed directory
        is_valid, full_path = _validate_path_security(relative_path, base_dir)
        if not is_valid or full_path is None:
            logger.warning("Path traversal attempt blocked: %s", relative_path)
            return web.json_response({"error": "Invalid path"}, status=400)

        # Check if path exists
        if not os.path.exists(full_path):
            return web.json_response({"error": "not_found"})

        # Open folder safely
        if _open_folder_safe(full_path):
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": "Failed to open folder"}, status=500)

    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        # Log the full error for debugging, but return generic message to client
        logger.exception("Error in open_folder endpoint")
        return web.json_response({"error": "Internal server error"}, status=500)


@PromptServer.instance.routes.post("/flowpath/create_and_open_folder")
async def create_and_open_folder(request):
    """Create a folder and open it in the system file explorer"""
    try:
        # Rate limiting
        if not _check_rate_limit("create_and_open_folder"):
            return web.json_response(
                {"error": "Rate limited. Please wait."}, status=429
            )

        data = await request.json()
        relative_path = data.get("path", "output")

        # Validate input type
        if not isinstance(relative_path, str):
            return web.json_response({"error": "Invalid path format"}, status=400)

        # Get the ComfyUI output directory as base
        output_dir = folder_paths.get_output_directory()
        base_dir = os.path.dirname(output_dir)  # Go up one level from output

        # Security check: validate path is within allowed directory
        is_valid, full_path = _validate_path_security(relative_path, base_dir)
        if not is_valid or full_path is None:
            logger.warning("Path traversal attempt blocked: %s", relative_path)
            return web.json_response({"error": "Invalid path"}, status=400)

        # Create the directory
        os.makedirs(full_path, exist_ok=True)

        # Open folder safely
        if _open_folder_safe(full_path):
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": "Failed to open folder"}, status=500)

    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        # Log the full error for debugging, but return generic message to client
        logger.exception("Error in create_and_open_folder endpoint")
        return web.json_response({"error": "Internal server error"}, status=500)


print("🌊 FlowPath v1.2.1 loaded - Intelligent path organization for ComfyUI")
