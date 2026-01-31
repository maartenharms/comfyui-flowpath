"""
FlowPath
Intelligent path organization with themes, auto-detection, and template variables
"""

import os
import json
from datetime import datetime


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
        print(f"\n{'=' * 60}")
        print(f"[FlowPath] build_path called!")
        print(f"[FlowPath] Raw widget_data length: {len(widget_data)} characters")
        print(f"[FlowPath] First 200 chars: {widget_data[:200]}")

        try:
            data = json.loads(widget_data)
            print(f"[FlowPath] JSON parsed successfully")
        except json.JSONDecodeError as e:
            # Invalid JSON, return empty path and filename
            print(f"[FlowPath] JSON parse FAILED: {e}")
            return ("", "")

        segments = data.get("segments", [])
        config = data.get("config", {})

        # Debug: Print all segments and config
        print(f"[FlowPath] Segments received: {segments}")
        print(f"[FlowPath] Config received: {config}")
        print(f"[FlowPath] node_label value: '{config.get('node_label', 'NOT SET')}'")

        # Check if label segment exists and is enabled
        label_segment = next((s for s in segments if s.get("type") == "label"), None)
        if label_segment:
            print(f"[FlowPath] Label segment found: {label_segment}")
            print(
                f"[FlowPath] node_label in config: '{config.get('node_label', 'NOT FOUND')}'"
            )
        else:
            print(f"[FlowPath] WARNING: No label segment in segments array!")

        # DYNAMIC SEED DETECTION: Override seed from config with current workflow seed
        print(f"[FlowPath] Attempting dynamic seed detection...")
        print(f"[FlowPath] Prompt parameter received: {prompt is not None}")
        print(
            f"[FlowPath] Seed in config before detection: {config.get('seed', 'NOT SET')}"
        )

        try:
            dynamic_seed = self._detect_seed_from_prompt(prompt)
            print(f"[FlowPath] Dynamic seed detection returned: {dynamic_seed}")

            if dynamic_seed is not None:
                print(
                    f"[FlowPath] Dynamic seed detected: {dynamic_seed} (overriding config)"
                )
                config["seed"] = str(dynamic_seed)
            elif config.get("seed"):
                print(f"[FlowPath] Using seed from config: {config['seed']}")
            else:
                print(f"[FlowPath] No seed found (dynamic or config)")
        except Exception as e:
            print(f"[FlowPath] ERROR during seed detection: {e}")
            import traceback

            traceback.print_exc()

        path_parts = []

        # Process each segment in order
        print(f"[FlowPath] Processing {len(segments)} segments...")
        for segment in segments:
            print(f"[FlowPath] Segment: {segment}")
            # Skip disabled segments
            if not segment.get("enabled", True):
                print(f"[FlowPath] Skipping disabled segment: {segment.get('type')}")
                continue

            seg_type = segment.get("type", "")
            print(f"[FlowPath] Processing segment type: '{seg_type}'")

            # Handle each segment type
            if seg_type == "label":
                value = config.get("node_label", "").strip()
                print(f"[FlowPath] Processing LABEL segment - value: '{value}'")
                if value:
                    path_parts.append(self._sanitize(value))
                    print(f"[FlowPath] Added label to path: '{value}'")

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
                print(
                    f"[FlowPath] LoRA segment - Raw value: {repr(value)}, Type: {type(value)}"
                )

                # Handle different value types
                if isinstance(value, list):
                    # Separate folders mode - add each LoRA as a separate path part
                    print(f"[FlowPath] Processing as list with {len(value)} items")
                    for lora in value:
                        lora_str = str(lora).strip()
                        if lora_str:
                            sanitized = self._sanitize(lora_str)
                            print(f"[FlowPath] Adding LoRA folder: {sanitized}")
                            path_parts.append(sanitized)
                elif isinstance(value, str):
                    # Check for pipe-delimited format (separate mode stored as string)
                    if " | " in value:
                        # Split and add each as separate folder
                        print(f"[FlowPath] Processing as pipe-delimited string")
                        for lora in value.split(" | "):
                            lora_str = lora.strip()
                            if lora_str:
                                sanitized = self._sanitize(lora_str)
                                print(f"[FlowPath] Adding LoRA folder: {sanitized}")
                                path_parts.append(sanitized)
                    else:
                        # Single string value (all other modes)
                        value_str = value.strip()
                        print(f"[FlowPath] Processing as single string: '{value_str}'")
                        if value_str:
                            sanitized = self._sanitize(value_str)
                            print(f"[FlowPath] Adding LoRA folder: {sanitized}")
                            path_parts.append(sanitized)
                        else:
                            print(f"[FlowPath] LoRA value is empty after strip!")
                else:
                    # Fallback: try to convert to string
                    print(f"[FlowPath] Processing as fallback (unexpected type)")
                    value_str = str(value).strip()
                    if value_str:
                        sanitized = self._sanitize(value_str)
                        print(f"[FlowPath] Adding LoRA folder: {sanitized}")
                        path_parts.append(sanitized)
                    else:
                        print(f"[FlowPath] LoRA value is empty after conversion!")

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

        print(f"[FlowPath] Path parts: {path_parts}")
        print(f"[FlowPath] Final path: {final_path}")

        # Build filename from template (for Image Saver compatibility)
        # Supports FlowPath vars {name} and Image Saver pass-through vars %seed
        filename_template = config.get("filename_template", "")

        if filename_template:
            # Process FlowPath template variables (Image Saver % vars pass through)
            final_filename = self._replace_template_vars(filename_template, config)
            # Sanitize but preserve % variables for Image Saver
            final_filename = self._sanitize_filename(final_filename)
        else:
            final_filename = ""

        print(f"[FlowPath] Filename template: '{filename_template}'")
        print(f"[FlowPath] Final filename: '{final_filename}'")
        print(f"{'=' * 60}\n")

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

            print(f"[FlowPath] Searching for seed in {len(prompt)} nodes...")
            detected_seeds = []

            for node_id, node_data in prompt.items():
                class_type = node_data.get("class_type", "")

                # Priority 1: Check for Seed Generator nodes (highest priority)
                if any(gen_type in class_type for gen_type in seed_generator_types):
                    inputs = node_data.get("inputs", {})
                    print(
                        f"[FlowPath] Found seed generator node {node_id} ({class_type})"
                    )
                    print(f"[FlowPath] Inputs: {inputs}")

                    # Seed generators output the seed directly
                    seed = inputs.get("seed")
                    if seed is not None:
                        # Handle both single values and arrays [seed, batch_index]
                        original_seed = seed
                        if isinstance(seed, (list, tuple)):
                            seed = seed[0]  # Extract actual seed value

                        # Try to convert to int if it's a string
                        try:
                            seed = int(seed)
                        except (ValueError, TypeError):
                            pass

                        print(
                            f"[FlowPath] Found seed in {class_type} node {node_id}: {seed} (original: {original_seed})"
                        )
                        # Prepend with priority marker (0 = highest priority)
                        detected_seeds.append((0, node_id, seed, class_type))

                # Priority 2: Check for noise generator nodes (for SamplerCustomAdvanced)
                elif any(
                    noise_type in class_type for noise_type in noise_generator_types
                ):
                    inputs = node_data.get("inputs", {})
                    print(
                        f"[FlowPath] Found noise generator node {node_id} ({class_type})"
                    )
                    print(f"[FlowPath] Inputs: {inputs}")

                    # Noise generators use "noise_seed" instead of "seed"
                    seed = inputs.get("noise_seed")
                    if seed is not None:
                        # Handle both single values and arrays [seed, batch_index]
                        original_seed = seed
                        if isinstance(seed, (list, tuple)):
                            seed = seed[0]  # Extract actual seed value

                        # Try to convert to int if it's a string
                        try:
                            seed = int(seed)
                        except (ValueError, TypeError):
                            pass

                        print(
                            f"[FlowPath] Found noise_seed in {class_type} node {node_id}: {seed} (original: {original_seed})"
                        )
                        # Priority 1 (between seed generators and samplers)
                        detected_seeds.append((1, node_id, seed, class_type))

                # Priority 3: Check for sampler nodes (fallback)
                elif any(sampler_type in class_type for sampler_type in sampler_types):
                    inputs = node_data.get("inputs", {})
                    print(f"[FlowPath] Found sampler node {node_id} ({class_type})")
                    print(f"[FlowPath] Inputs: {inputs}")

                    # Get seed from inputs
                    seed = inputs.get("seed")
                    if seed is not None:
                        # Handle both single values and arrays [seed, batch_index]
                        original_seed = seed
                        if isinstance(seed, (list, tuple)):
                            seed = seed[0]  # Extract actual seed value

                        # Try to convert to int if it's a string
                        try:
                            seed = int(seed)
                        except (ValueError, TypeError):
                            pass

                        print(
                            f"[FlowPath] Found seed in {class_type} node {node_id}: {seed} (original: {original_seed})"
                        )
                        # Append with lower priority (2 = lowest priority)
                        detected_seeds.append((2, node_id, seed, class_type))

            # Log all detected seeds
            if detected_seeds:
                # Sort by priority (0 = highest), then by node_id (earliest first)
                detected_seeds.sort(key=lambda x: (x[0], x[1]))
                print(f"[FlowPath] All detected seeds: {detected_seeds}")
                # Return the highest priority seed
                return detected_seeds[0][2]  # Index 2 is the seed value
            else:
                print(
                    f"[FlowPath] No seeds found in any seed generator or sampler nodes"
                )

        except Exception as e:
            print(f"[FlowPath] Error detecting seed from prompt: {e}")
            import traceback

            traceback.print_exc()

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
