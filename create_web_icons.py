#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create web icons from the source icon
"""

from PIL import Image
import os
import sys

# Force UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

SOURCE_ICON = r"c:\Users\abhis\AppData\Roaming\Code\agentSessionData\36364b22-552b-488b-8353-91d9d5ab464a\attachments\c6754bd3-d2a1-4784-bd10-de59f77895eb\Pasted Image.png"
PUBLIC_FOLDER = r"C:\Git\public"

# Web icon sizes
WEB_SIZES = {
    "favicon-16x16.png": (16, 16),
    "favicon-32x32.png": (32, 32),
    "favicon-48x48.png": (48, 48),
    "apple-touch-icon.png": (180, 180),
    "icon-192x192.png": (192, 192),
    "icon-512x512.png": (512, 512),
    "icon.png": (192, 192),
}

def create_web_icons():
    print("=" * 70)
    print("PocketTracker Web Icon Generator")
    print("=" * 70)
    print()
    
    # Check if source exists
    if not os.path.exists(SOURCE_ICON):
        print("[ERROR] Source icon not found: " + SOURCE_ICON)
        return False
    
    # Create public folder
    os.makedirs(PUBLIC_FOLDER, exist_ok=True)
    print("[INFO] Creating web icons in: " + PUBLIC_FOLDER)
    print()
    
    success_count = 0
    total_count = len(WEB_SIZES)
    
    try:
        img = Image.open(SOURCE_ICON).convert('RGBA')
        print("[INFO] Source icon size: {}x{}".format(img.size[0], img.size[1]))
        print()
        
        for filename, size in WEB_SIZES.items():
            # Create new image with transparent background
            new_img = Image.new('RGBA', size, (0, 0, 0, 0))
            
            # Resize and center
            resized = img.copy()
            resized.thumbnail(size, Image.Resampling.LANCZOS)
            offset = ((size[0] - resized.size[0]) // 2, (size[1] - resized.size[1]) // 2)
            new_img.paste(resized, offset, resized)
            
            target_path = os.path.join(PUBLIC_FOLDER, filename)
            new_img.save(target_path, 'PNG')
            print("[OK] Created: {} ({}x{})".format(filename, size[0], size[1]))
            success_count += 1
    except Exception as e:
        print("[ERROR] {}".format(e))
        return False
    
    print()
    print("=" * 70)
    print("[SUCCESS] {}/{} web icons created".format(success_count, total_count))
    print("=" * 70)
    
    return success_count == total_count

if __name__ == '__main__':
    success = create_web_icons()
    exit(0 if success else 1)
