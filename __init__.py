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
import folder_paths
from aiohttp import web
from server import PromptServer

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
__version__ = "1.2.0"  # SI/IS output modes, folder opening, preset loading animation
__license__ = "MIT"  # Free to use - donations appreciated


# API Routes for folder operations
@PromptServer.instance.routes.post("/flowpath/open_folder")
async def open_folder(request):
    """Open a folder in the system file explorer"""
    try:
        data = await request.json()
        relative_path = data.get("path", "output")

        # Get the ComfyUI output directory as base
        output_dir = folder_paths.get_output_directory()
        base_dir = os.path.dirname(output_dir)  # Go up one level from output

        # Build full path
        full_path = os.path.join(base_dir, relative_path)
        full_path = os.path.normpath(full_path)

        # Security check: ensure path is within ComfyUI directory
        if not full_path.startswith(base_dir):
            return web.json_response({"error": "Invalid path"}, status=400)

        # Check if path exists
        if not os.path.exists(full_path):
            return web.json_response({"error": "not_found"})

        # Open folder in system file explorer
        if sys.platform == "win32":
            # Open folder, try to bring to front, and flash taskbar
            ps_cmd = f"""
                Add-Type @'
                using System;
                using System.Runtime.InteropServices;
                public class Win32 {{
                    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
                    [DllImport("user32.dll")] public static extern bool FlashWindow(IntPtr hWnd, bool bInvert);
                    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
                    public const int SW_SHOWNORMAL = 1;
                }}
'@
                $shell = New-Object -ComObject Shell.Application
                $shell.Explore('{full_path}')
                Start-Sleep -Milliseconds 500
                
                # Find the newest explorer window
                $explorer = Get-Process explorer -ErrorAction SilentlyContinue | 
                    Where-Object {{ $_.MainWindowHandle -ne 0 }} |
                    Sort-Object StartTime -Descending |
                    Select-Object -First 1
                
                if ($explorer) {{
                    $hwnd = $explorer.MainWindowHandle
                    [Win32]::ShowWindow($hwnd, [Win32]::SW_SHOWNORMAL)
                    [Win32]::SetForegroundWindow($hwnd)
                    # Flash taskbar 3 times to get attention
                    for ($i = 0; $i -lt 6; $i++) {{
                        [Win32]::FlashWindow($hwnd, $true)
                        Start-Sleep -Milliseconds 100
                    }}
                }}
            """
            subprocess.Popen(
                ["powershell", "-WindowStyle", "Hidden", "-Command", ps_cmd],
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        elif sys.platform == "darwin":  # macOS
            subprocess.Popen(["open", full_path])
        else:  # Linux
            subprocess.Popen(["xdg-open", full_path])

        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@PromptServer.instance.routes.post("/flowpath/create_and_open_folder")
async def create_and_open_folder(request):
    """Create a folder and open it in the system file explorer"""
    try:
        data = await request.json()
        relative_path = data.get("path", "output")

        # Get the ComfyUI output directory as base
        output_dir = folder_paths.get_output_directory()
        base_dir = os.path.dirname(output_dir)  # Go up one level from output

        # Build full path
        full_path = os.path.join(base_dir, relative_path)
        full_path = os.path.normpath(full_path)

        # Security check: ensure path is within ComfyUI directory
        if not full_path.startswith(base_dir):
            return web.json_response({"error": "Invalid path"}, status=400)

        # Create the directory
        os.makedirs(full_path, exist_ok=True)

        # Open folder in system file explorer
        if sys.platform == "win32":
            # Open folder, try to bring to front, and flash taskbar
            ps_cmd = f"""
                Add-Type @'
                using System;
                using System.Runtime.InteropServices;
                public class Win32 {{
                    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
                    [DllImport("user32.dll")] public static extern bool FlashWindow(IntPtr hWnd, bool bInvert);
                    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
                    public const int SW_SHOWNORMAL = 1;
                }}
'@
                $shell = New-Object -ComObject Shell.Application
                $shell.Explore('{full_path}')
                Start-Sleep -Milliseconds 500
                
                # Find the newest explorer window
                $explorer = Get-Process explorer -ErrorAction SilentlyContinue | 
                    Where-Object {{ $_.MainWindowHandle -ne 0 }} |
                    Sort-Object StartTime -Descending |
                    Select-Object -First 1
                
                if ($explorer) {{
                    $hwnd = $explorer.MainWindowHandle
                    [Win32]::ShowWindow($hwnd, [Win32]::SW_SHOWNORMAL)
                    [Win32]::SetForegroundWindow($hwnd)
                    # Flash taskbar 3 times to get attention
                    for ($i = 0; $i -lt 6; $i++) {{
                        [Win32]::FlashWindow($hwnd, $true)
                        Start-Sleep -Milliseconds 100
                    }}
                }}
            """
            subprocess.Popen(
                ["powershell", "-WindowStyle", "Hidden", "-Command", ps_cmd],
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        elif sys.platform == "darwin":  # macOS
            subprocess.Popen(["open", full_path])
        else:  # Linux
            subprocess.Popen(["xdg-open", full_path])

        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


print("🌊 FlowPath v1.2.0 loaded - Intelligent path organization for ComfyUI")
