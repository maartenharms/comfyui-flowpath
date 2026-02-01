"""
FlowPath
Intelligent path organization with themes, auto-detection, and template variables
"""

import os
import re
import json
import glob
from datetime import datetime

# Try to import ComfyUI's folder_paths for output directory
try:
    import folder_paths

    COMFYUI_OUTPUT_DIR = folder_paths.get_output_directory()
except ImportError:
    COMFYUI_OUTPUT_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "output",
    )


class FlowPath:
    """
    FlowPath - Intelligent path organization for ComfyUI
    Features: Themes, auto-detection, presets, drag-drop reordering, template variables
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": {
                # Hidden input - managed by widget
                "widget_data": (
                    "STRING",
                    {
                        "default": "{}",
                        "multiline": False,
                    },
                ),
            },
            "hidden": {
                "prompt": "PROMPT",  # Access to workflow data for dynamic seed detection
            },
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("path", "filename")
    FUNCTION = "build_path"
    CATEGORY = "🌊 FlowPath"
    OUTPUT_NODE = False

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # Always return NaN to force re-execution every time
        # This is needed because {counter} must scan the folder each run
        return float("nan")

    def _get_next_counter(self, folder_path, filename_pattern, padding=4):
        """
        Scan output folder and find the next available counter number.

        Args:
            folder_path: The folder to scan (relative to ComfyUI output dir)
            filename_pattern: Filename with {counter} placeholder
            padding: Number of digits for zero-padding (default 4 = 0001)

        Returns:
            int: Next available counter number
        """
        # Build full path to the output folder
        full_folder = (
            os.path.join(COMFYUI_OUTPUT_DIR, folder_path)
            if folder_path
            else COMFYUI_OUTPUT_DIR
        )

        # If folder doesn't exist, start at 1
        if not os.path.exists(full_folder):
            return 1

        # Build regex pattern from filename
        # Replace {counter} with a capture group for digits
        # Escape other regex special chars
        if "{counter}" not in filename_pattern.lower():
            return 1

        # Create regex pattern: escape special chars, then replace {counter} with digit capture
        regex_pattern = re.escape(filename_pattern)
        # Handle both {counter} and {COUNTER} - use string replace to avoid backreference issues
        regex_pattern = regex_pattern.replace(r"\{counter\}", r"(\d+)")
        regex_pattern = regex_pattern.replace(r"\{COUNTER\}", r"(\d+)")
        # Replace Image Saver %variables with wildcards (they get processed by Image Saver)
        # %seed, %time, %date, %model, %width, %height, %counter, etc.
        # Note: % is NOT escaped by re.escape, so match literal %
        # Use [^/\\]* to match any characters except path separators (allows empty or any value)
        regex_pattern = re.sub(r"%\w+", lambda m: r"[^/\\]*", regex_pattern)
        # Match optional Image Saver suffix (_00, _01, etc.) and any extension
        regex_pattern = regex_pattern + r"(_\d+)?\.[a-zA-Z0-9]+"
        regex_pattern = "^" + regex_pattern + "$"

        # Scan folder for matching files
        highest = 0
        try:
            for filename in os.listdir(full_folder):
                match = re.match(regex_pattern, filename, re.IGNORECASE)
                if match:
                    try:
                        num = int(match.group(1))
                        if num > highest:
                            highest = num
                    except (ValueError, IndexError):
                        pass
        except OSError:
            return 1

        return highest + 1

    def _replace_template_vars(self, template, config):
        """
        Replace template variables in a string with actual values.

        Supported variables:
        - {label}, {output}
        - {filetype}, {file_type}
        - {category}, {name}, {content_rating}, {rating}
        - {project}, {series}, {resolution}, {res}
        - {model}, {lora}, {seed}
        - {date}, {year}, {month}, {day}
        - {sfw}, {nsfw}

        Args:
            template: String containing template variables like {model}
            config: Configuration dictionary with values

        Returns:
            str: Template with variables replaced
        """
        if not template or not isinstance(template, str):
            return template

        # Get current date/time
        now = datetime.now()
        date_format = config.get("date_format", "%Y-%m-%d")
        try:
            formatted_date = now.strftime(date_format)
        except:
            formatted_date = now.strftime("%Y-%m-%d")

        # Define available variables
        vars_map = {
            "label": config.get("node_label", ""),
            "output": config.get("node_label", ""),  # Alias for label
            "filetype": config.get("file_type", "Image"),
            "file_type": config.get("file_type", "Image"),
            "category": config.get("category", "Characters"),
            "name": config.get("name", ""),
            "content_rating": config.get("content_rating", "SFW"),
            "rating": config.get("content_rating", "SFW"),
            "sfw": "SFW" if config.get("content_rating") == "SFW" else "",
            "nsfw": "NSFW" if config.get("content_rating") == "NSFW" else "",
            "project": config.get("project_name", ""),
            "series": config.get("series_name", ""),
            "resolution": config.get("resolution", ""),
            "res": config.get("resolution", ""),
            "model": config.get("model_name", ""),
            "lora": config.get("lora_name", ""),
            "seed": config.get("seed", ""),
            "date": formatted_date,
            "year": now.strftime("%Y"),
            "month": now.strftime("%m"),
            "day": now.strftime("%d"),
        }

        # Replace {variable} with actual values (case-insensitive)
        result = template
        for key, value in vars_map.items():
            # Replace both {key} and {KEY}
            result = result.replace(f"{{{key}}}", str(value))
            result = result.replace(f"{{{key.upper()}}}", str(value))

        return result

    def build_path(self, widget_data="{}", prompt=None):
        """
        Build path and filename from widget data (segments + config)

        Args:
            widget_data: JSON string from frontend widget
            prompt: Workflow prompt data (for dynamic seed detection)

        Returns:
            tuple: (constructed_path_string, constructed_filename_string)
        """
        try:
            data = json.loads(widget_data)
        except json.JSONDecodeError:
            # Invalid JSON, return empty path and filename
            return ("", "")

        segments = data.get("segments", [])
        config = data.get("config", {})

        # DYNAMIC SEED DETECTION: Override seed from config with current workflow seed
        try:
            dynamic_seed = self._detect_seed_from_prompt(prompt)
            if dynamic_seed is not None:
                config["seed"] = str(dynamic_seed)
        except Exception:
            pass  # Seed detection failed, use config seed if available

        path_parts = []

        # Process each segment in order
        for segment in segments:
            # Skip disabled segments
            if not segment.get("enabled", True):
                continue

            seg_type = segment.get("type", "")

            # Handle each segment type
            if seg_type == "label":
                value = config.get("node_label", "").strip()
                if value:
                    path_parts.append(self._sanitize(value))

            elif seg_type == "file_type":
                value = config.get("file_type", "Image")
                path_parts.append(value)

            elif seg_type == "project":
                value = config.get("project_name", "").strip()
                if value:
                    path_parts.append(self._sanitize(value))

            elif seg_type == "category":
                value = config.get("category", "Characters")
                path_parts.append(value)

            elif seg_type == "name":
                value = config.get("name", "").strip()
                if value:
                    path_parts.append(self._sanitize(value))

            elif seg_type == "content_rating":
                value = config.get("content_rating", "SFW")
                # Always add content rating (SFW or NSFW)
                path_parts.append(value)

            elif seg_type == "date":
                fmt = config.get("date_format", "%Y-%m-%d")
                try:
                    date_str = datetime.now().strftime(fmt)
                    path_parts.append(date_str)
                except Exception:
                    # Invalid date format, use default
                    path_parts.append(datetime.now().strftime("%Y-%m-%d"))

            elif seg_type == "series":
                value = config.get("series_name", "").strip()
                if value:
                    path_parts.append(self._sanitize(value))

            elif seg_type == "resolution":
                value = config.get("resolution", "").strip()
                if value:
                    path_parts.append(self._sanitize(value))

            elif seg_type == "model":
                value = config.get("model_name", "").strip()
                if value:
                    path_parts.append(self._sanitize(value))

            elif seg_type == "seed":
                value = config.get("seed", "").strip()
                if value:
                    path_parts.append(self._sanitize(value))

            elif seg_type == "lora":
                value = config.get("lora_name", "")

                # Handle different value types
                if isinstance(value, list):
                    # Separate folders mode - add each LoRA as a separate path part
                    for lora in value:
                        lora_str = str(lora).strip()
                        if lora_str:
                            path_parts.append(self._sanitize(lora_str))
                elif isinstance(value, str):
                    # Check for pipe-delimited format (separate mode stored as string)
                    if " | " in value:
                        # Split and add each as separate folder
                        for lora in value.split(" | "):
                            lora_str = lora.strip()
                            if lora_str:
                                path_parts.append(self._sanitize(lora_str))
                    else:
                        # Single string value (all other modes)
                        value_str = value.strip()
                        if value_str:
                            path_parts.append(self._sanitize(value_str))
                else:
                    # Fallback: try to convert to string
                    value_str = str(value).strip()
                    if value_str:
                        path_parts.append(self._sanitize(value_str))

            elif seg_type == "custom":
                value = segment.get("value", "").strip()
                if value:
                    # Support template variables in custom segments
                    processed_value = self._replace_template_vars(value, config)
                    if processed_value and processed_value.strip():
                        path_parts.append(self._sanitize(processed_value))

        # Join all parts with OS-appropriate separator
        if path_parts:
            final_path = os.path.join(*path_parts)
        else:
            # Default depends on output mode:
            # SI mode (saveImage): "ComfyUI" becomes filename prefix
            # IS mode (imageSaver): empty string (uses output folder directly)
            output_mode = config.get("output_mode", "saveImage")
            final_path = "ComfyUI" if output_mode == "saveImage" else ""

        # Build filename from template (for Image Saver compatibility)
        # Supports FlowPath vars {name}, {counter} and Image Saver pass-through vars %seed
        filename_template = config.get("filename_template", "")

        if filename_template:
            # Process FlowPath template variables (Image Saver % vars pass through)
            final_filename = self._replace_template_vars(filename_template, config)

            # Handle {counter} specially - needs to scan folder for existing files
            if "{counter}" in final_filename.lower():
                # Get padding setting (default 4 digits = 0001)
                counter_padding = config.get("counter_padding", 4)

                # Calculate next counter by scanning the output folder
                next_counter = self._get_next_counter(
                    final_path, final_filename, counter_padding
                )

                # Format with zero-padding
                counter_str = str(next_counter).zfill(counter_padding)

                # Replace {counter} and {COUNTER} with the actual value
                final_filename = re.sub(
                    r"\{counter\}", counter_str, final_filename, flags=re.IGNORECASE
                )

            # Sanitize but preserve % variables for Image Saver
            final_filename = self._sanitize_filename(final_filename)
        else:
            final_filename = ""

        return (final_path, final_filename)

    def _detect_seed_from_prompt(self, prompt):
        """
        Detect seed from workflow prompt (dynamic detection at execution time)

        Args:
            prompt: Workflow prompt dictionary

        Returns:
            int or None: Detected seed value
        """
        if not prompt:
            return None

        try:
            # Search for seed generator and sampler nodes in the workflow
            # Priority order: Seed Generator nodes first (explicit seeds), then samplers
            seed_generator_types = [
                "Seed Generator",  # ComfyUI-Image-Saver
            ]

            # Noise generator nodes (for SamplerCustomAdvanced workflows)
            # These nodes generate noise with a seed that we can detect
            noise_generator_types = [
                "RandomNoise",  # Standard ComfyUI noise node
                "DisableNoise",  # Has noise_seed
            ]

            sampler_types = [
                "KSampler",
                "KSamplerAdvanced",
                "SamplerCustom",
                "KSampler (Efficient)",
                "SamplerCustomAdvanced",
            ]

            detected_seeds = []

            for node_id, node_data in prompt.items():
                class_type = node_data.get("class_type", "")

                # Priority 1: Check for Seed Generator nodes (highest priority)
                if any(gen_type in class_type for gen_type in seed_generator_types):
                    inputs = node_data.get("inputs", {})
                    seed = inputs.get("seed")
                    if seed is not None:
                        if isinstance(seed, (list, tuple)):
                            seed = seed[0]
                        try:
                            seed = int(seed)
                        except (ValueError, TypeError):
                            pass
                        detected_seeds.append((0, node_id, seed, class_type))

                # Priority 2: Check for noise generator nodes (for SamplerCustomAdvanced)
                elif any(
                    noise_type in class_type for noise_type in noise_generator_types
                ):
                    inputs = node_data.get("inputs", {})
                    seed = inputs.get("noise_seed")
                    if seed is not None:
                        if isinstance(seed, (list, tuple)):
                            seed = seed[0]
                        try:
                            seed = int(seed)
                        except (ValueError, TypeError):
                            pass
                        detected_seeds.append((1, node_id, seed, class_type))

                # Priority 3: Check for sampler nodes (fallback)
                elif any(sampler_type in class_type for sampler_type in sampler_types):
                    inputs = node_data.get("inputs", {})
                    seed = inputs.get("seed")
                    if seed is not None:
                        if isinstance(seed, (list, tuple)):
                            seed = seed[0]
                        try:
                            seed = int(seed)
                        except (ValueError, TypeError):
                            pass
                        detected_seeds.append((2, node_id, seed, class_type))

            if detected_seeds:
                # Sort by priority (0 = highest), then by node_id (earliest first)
                detected_seeds.sort(key=lambda x: (x[0], x[1]))
                return detected_seeds[0][2]  # Index 2 is the seed value

        except Exception:
            pass

        return None

    def _sanitize(self, name):
        """
        Remove illegal characters from folder names
        Handles Windows/Linux/Mac path restrictions

        Args:
            name: Raw folder name string

        Returns:
            str: Sanitized folder name
        """
        # Illegal characters for Windows: < > : " / \ | ? *
        illegal_chars = '<>:"/\\|?*'
        sanitized = name

        for char in illegal_chars:
            sanitized = sanitized.replace(char, "_")

        # Remove leading/trailing spaces and dots (Windows doesn't like these)
        sanitized = sanitized.strip(" .")

        # Replace multiple spaces with single space
        while "  " in sanitized:
            sanitized = sanitized.replace("  ", " ")

        # Replace multiple underscores with single underscore
        while "__" in sanitized:
            sanitized = sanitized.replace("__", "_")

        return sanitized

    def _sanitize_filename(self, name):
        """
        Sanitize filename while preserving Image Saver % variables.
        Less restrictive than folder sanitization.

        Args:
            name: Raw filename string (may contain %variable patterns)

        Returns:
            str: Sanitized filename
        """
        # For filenames, we only remove truly problematic characters
        # Keep % for Image Saver variables like %seed, %time, %counter
        illegal_chars = '<>:"/\\|?*'
        sanitized = name

        for char in illegal_chars:
            sanitized = sanitized.replace(char, "_")

        # Remove leading/trailing spaces and dots
        sanitized = sanitized.strip(" .")

        # Replace multiple spaces with single space
        while "  " in sanitized:
            sanitized = sanitized.replace("  ", " ")

        # Replace multiple underscores with single underscore
        while "__" in sanitized:
            sanitized = sanitized.replace("__", "_")

        return sanitized


# For ComfyUI registration
NODE_CLASS_MAPPINGS = {
    "FlowPath": FlowPath,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FlowPath": "FlowPath",
}
