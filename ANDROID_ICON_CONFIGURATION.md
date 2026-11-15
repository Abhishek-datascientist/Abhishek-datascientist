# Android App Icon Configuration Guide

## 📍 Where the Icon is Configured

### 1. **Main Configuration: AndroidManifest.xml**

**Location:** `android/app/src/main/AndroidManifest.xml`

**Configuration Lines:**
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"                 <!-- ← Main icon reference
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"      <!-- ← Rounded icon reference
    android:supportsRtl="true"
    android:theme="@style/AppTheme">
```

**What This Means:**
- `android:icon="@mipmap/ic_launcher"` → References the main app icon
- `android:roundIcon="@mipmap/ic_launcher_round"` → References the rounded version of the icon
- The `@mipmap/` prefix tells Android to look for these resources in the `mipmap-*` directories

---

## 🗂️ Icon Files Structure

All icon files are located in: `android/app/src/main/res/`

### Icon Directories by Screen Density:

```
android/app/src/main/res/
├── mipmap-mdpi/                    (Medium DPI - 160 dpi)
│   ├── ic_launcher.png             (48x48 pixels)
│   ├── ic_launcher_round.png       (48x48 pixels - rounded)
│   └── ic_launcher_foreground.png  (108x108 pixels - for adaptive)
│
├── mipmap-hdpi/                    (High DPI - 240 dpi)
│   ├── ic_launcher.png             (72x72 pixels)
│   ├── ic_launcher_round.png       (72x72 pixels - rounded)
│   └── ic_launcher_foreground.png  (162x162 pixels - for adaptive)
│
├── mipmap-xhdpi/                   (Extra High DPI - 320 dpi)
│   ├── ic_launcher.png             (96x96 pixels)
│   ├── ic_launcher_round.png       (96x96 pixels - rounded)
│   └── ic_launcher_foreground.png  (216x216 pixels - for adaptive)
│
├── mipmap-xxhdpi/                  (Extra Extra High DPI - 480 dpi)
│   ├── ic_launcher.png             (144x144 pixels)
│   ├── ic_launcher_round.png       (144x144 pixels - rounded)
│   └── ic_launcher_foreground.png  (324x324 pixels - for adaptive)
│
├── mipmap-xxxhdpi/                 (Extra Extra Extra High DPI - 640 dpi)
│   ├── ic_launcher.png             (192x192 pixels)
│   ├── ic_launcher_round.png       (192x192 pixels - rounded)
│   └── ic_launcher_foreground.png  (432x432 pixels - for adaptive)
│
└── mipmap-anydpi-v26/              (Adaptive icon for Android 8.0+)
    ├── ic_launcher.xml             (Adaptive icon definition)
    └── ic_launcher_round.xml       (Adaptive rounded icon definition)
```

---

## 🎨 Adaptive Icon Configuration (Android 8+)

**Location:** `android/app/src/main/res/mipmap-anydpi-v26/`

### ic_launcher.xml:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

### ic_launcher_round.xml:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

**What This Means:**
- Adaptive icons use a **background color** + **foreground image** design
- This allows Android to apply different icon shapes (circle, rounded square, etc.)
- Both adaptive and regular icons reference the same foreground image
- The background color is defined in a color resource file

---

## 🎯 How Android Selects the Right Icon

### Selection Process:

1. **Android 8.0+ devices (API 26+)**
   - Uses adaptive icon from `mipmap-anydpi-v26/` (ic_launcher.xml)
   - Applies system-defined shapes (circle, rounded square, etc.)
   - Uses ic_launcher_foreground.png + background color

2. **Android 7.x and older**
   - Selects based on device screen density:
     - **mdpi devices** → Uses `mipmap-mdpi/ic_launcher.png`
     - **hdpi devices** → Uses `mipmap-hdpi/ic_launcher.png`
     - **xhdpi devices** → Uses `mipmap-xhdpi/ic_launcher.png`
     - **xxhdpi devices** → Uses `mipmap-xxhdpi/ic_launcher.png`
     - **xxxhdpi devices** → Uses `mipmap-xxxhdpi/ic_launcher.png`

3. **Rounded Icon Option**
   - Some Android versions/devices use `ic_launcher_round.png` for app shortcuts
   - Same selection logic applies for rounded versions

---

## 📋 Complete Icon File Inventory

| Directory | Files | Purpose |
|-----------|-------|---------|
| **mipmap-mdpi** | 3 files | 160 dpi devices (small phones) |
| **mipmap-hdpi** | 3 files | 240 dpi devices (old tablets) |
| **mipmap-xhdpi** | 3 files | 320 dpi devices (medium phones) |
| **mipmap-xxhdpi** | 3 files | 480 dpi devices (large phones) |
| **mipmap-xxxhdpi** | 3 files | 640 dpi devices (large tablets) |
| **mipmap-anydpi-v26** | 2 files | Adaptive icon (Android 8+) |
| **TOTAL** | **17 files** | Complete icon coverage |

---

## 🔧 How to Update the Icon

### Step 1: Prepare Your New Icon
- Create icon files at each resolution (48x48, 72x72, 96x96, 144x144, 192x192)
- Create rounded versions (same size, rounded corners)
- Create foreground images for adaptive icons (higher resolution)
- Define background color in colors resource file

### Step 2: Replace the Files
```bash
# Replace each icon file in its respective directory
cp my_icon_48x48.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp my_icon_72x72.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
# ... and so on for all resolutions
```

### Step 3: Update Adaptive Icon (if needed)
- Edit `mipmap-anydpi-v26/ic_launcher.xml`
- Update the background color reference if needed
- Update foreground image references

### Step 4: Rebuild and Test
```bash
cd android
./gradlew assembleRelease
# Test on devices with different screen densities
```

---

## 🎨 Icon Design Best Practices

### Safe Area
- Keep important icon elements within the safe zone (center of the icon)
- For adaptive icons, the foreground image must be 108x108dp (hardware dp)

### Colors
- Background color should be defined in `android/app/src/main/res/values/colors.xml`
- Make sure contrast is sufficient for visibility

### Formats
- Use **PNG format** (supports transparency)
- PNG files are lossless and compress well

### Size Ratios
The ratios between icon sizes should be consistent:
- mdpi = 1x (baseline)
- hdpi = 1.5x
- xhdpi = 2x
- xxhdpi = 3x
- xxxhdpi = 4x

---

## 🔍 Verification Checklist

- [x] **AndroidManifest.xml** - Icon references configured
- [x] **mipmap-mdpi/** - Contains ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
- [x] **mipmap-hdpi/** - Contains ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
- [x] **mipmap-xhdpi/** - Contains ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
- [x] **mipmap-xxhdpi/** - Contains ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
- [x] **mipmap-xxxhdpi/** - Contains ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
- [x] **mipmap-anydpi-v26/** - Contains ic_launcher.xml and ic_launcher_round.xml (adaptive)
- [x] **Background color** - Defined in values/colors.xml

---

## 📱 Icon Display on Different Devices

### On Android 8.0+ (Adaptive Icons)
```
╔════════════════╗
║  ╔══════════╗  ║
║  ║  YOUR    ║  ║
║  ║  ICON    ║  ║
║  ║  HERE    ║  ║
║  ╚══════════╝  ║
║ (System shapes: round, square, rounded-square, etc.) ║
╚════════════════╝
```

### On Android 7.x and Older
```
╔════════════════╗
║                ║
║   YOUR ICON    ║
║   (Square)     ║
║                ║
╚════════════════╝
```

---

## 🚀 Current Status: ✅ READY

The PocketTracker Android app icon is:
- ✅ Configured in AndroidManifest.xml
- ✅ All PNG files present (17 total)
- ✅ All DPI densities covered (mdpi → xxxhdpi)
- ✅ Adaptive icon support (Android 8+)
- ✅ Ready for APK build and Play Store deployment

**No additional icon configuration needed!**

---

## 📞 Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Main Config | `android/app/src/main/AndroidManifest.xml` | References which icon files to use |
| MDPI Icons | `mipmap-mdpi/` | 160 dpi devices (48x48 px) |
| HDPI Icons | `mipmap-hdpi/` | 240 dpi devices (72x72 px) |
| XHDPI Icons | `mipmap-xhdpi/` | 320 dpi devices (96x96 px) |
| XXHDPI Icons | `mipmap-xxhdpi/` | 480 dpi devices (144x144 px) |
| XXXHDPI Icons | `mipmap-xxxhdpi/` | 640 dpi devices (192x192 px) |
| Adaptive Icons | `mipmap-anydpi-v26/` | Android 8+ adaptive icon |
| Colors | `values/colors.xml` | Adaptive icon background color |

