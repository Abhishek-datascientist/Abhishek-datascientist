#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Icon resizer for Android mipmap directories
Resizes web icon to all required Android DPI buckets
"""

from PIL import Image
import os
import sys
from pathlib import Path

# Force UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Source icon path (from user's pasted image)
SOURCE_ICON = r"c:\Users\abhis\AppData\Roaming\Code\agentSessionData\36364b22-552b-488b-8353-91d9d5ab464a\attachments\c6754bd3-d2a1-4784-bd10-de59f77895eb\Pasted Image.png"

# Android icon specifications
ICON_SPECS = {
    'mdpi': {
        'dpi': 160,
        'ic_launcher': (48, 48),
        'ic_launcher_round': (48, 48),
        'ic_launcher_foreground': (108, 108),
        'folder': r'C:\Git\android\app\src\main\res\mipmap-mdpi'
    },
    'hdpi': {
        'dpi': 240,
        'ic_launcher': (72, 72),
        'ic_launcher_round': (72, 72),
        'ic_launcher_foreground': (162, 162),
        'folder': r'C:\Git\android\app\src\main\res\mipmap-hdpi'
    },
    'xhdpi': {
        'dpi': 320,
        'ic_launcher': (96, 96),
        'ic_launcher_round': (96, 96),
        'ic_launcher_foreground': (216, 216),
        'folder': r'C:\Git\android\app\src\main\res\mipmap-xhdpi'
    },
    'xxhdpi': {
        'dpi': 480,
        'ic_launcher': (144, 144),
        'ic_launcher_round': (144, 144),
        'ic_launcher_foreground': (324, 324),
        'folder': r'C:\Git\android\app\src\main\res\mipmap-xxhdpi'
    },
    'xxxhdpi': {
        'dpi': 640,
        'ic_launcher': (192, 192),
        'ic_launcher_round': (192, 192),
        'ic_launcher_foreground': (432, 432),
        'folder': r'C:\Git\android\app\src\main\res\mipmap-xxxhdpi'
    }
}

def resize_icon(source_path, target_path, size, is_foreground=False):
    """Resize icon with padding for square icons"""
    try:
        # Open source image
        img = Image.open(source_path).convert('RGBA')
        
        if is_foreground:
            # Foreground images should fill the entire space
            # Resize to fit
            img = img.resize(size, Image.Resampling.LANCZOS)
        else:
            # Regular icons: add padding to maintain aspect ratio
            # Create a new image with padding
            target_img = Image.new('RGBA', size, (0, 0, 0, 0))
            
            # Calculate dimensions to maintain aspect ratio
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Center the image
            offset = ((size[0] - img.size[0]) // 2, (size[1] - img.size[1]) // 2)
            target_img.paste(img, offset, img)
            img = target_img
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        # Save the resized image
        img.save(target_path, 'PNG')
        print("[OK] Created: {} ({}x{})".format(target_path, size[0], size[1]))
        return True
    except Exception as e:
        print("[ERROR] Error creating {}: {}".format(target_path, e))
        return False

def main():
    print("=" * 70)
    print("PocketTracker Icon Resizer for Android")
    print("=" * 70)
    print()
    
    # Check if source exists
    if not os.path.exists(SOURCE_ICON):
        print("[ERROR] Source icon not found: " + SOURCE_ICON)
        return False
    
    print("[INFO] Source icon: " + SOURCE_ICON)
    
    # Get source image info
    try:
        source_img = Image.open(SOURCE_ICON)
        print("[INFO] Source size: {}x{} pixels".format(source_img.size[0], source_img.size[1]))
        print()
    except Exception as e:
        print("[ERROR] Error reading source: {}".format(e))
        return False
    
    success_count = 0
    total_count = 0
    
    # Process each DPI bucket
    for density, specs in ICON_SPECS.items():
        print("\n[PROCESS] {} ({} DPI):".format(density.upper(), specs['dpi']))
        print("-" * 70)
        
        folder = specs['folder']
        
        # Create ic_launcher (square icon)
        total_count += 1
        target = os.path.join(folder, 'ic_launcher.png')
        if resize_icon(SOURCE_ICON, target, specs['ic_launcher']):
            success_count += 1
        
        # Create ic_launcher_round (rounded icon)
        total_count += 1
        target = os.path.join(folder, 'ic_launcher_round.png')
        if resize_icon(SOURCE_ICON, target, specs['ic_launcher_round']):
            success_count += 1
        
        # Create ic_launcher_foreground (adaptive icon)
        total_count += 1
        target = os.path.join(folder, 'ic_launcher_foreground.png')
        if resize_icon(SOURCE_ICON, target, specs['ic_launcher_foreground'], is_foreground=True):
            success_count += 1
    
    print()
    print("=" * 70)
    print("[SUCCESS] {}/{} files created successfully".format(success_count, total_count))
    print("=" * 70)
    
    if success_count == total_count:
        print("\n[COMPLETE] All icons resized and updated!")
        print("[READY] Ready for APK build")
        return True
    else:
        print("\n[WARNING] {} files failed".format(total_count - success_count))
        return False

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
