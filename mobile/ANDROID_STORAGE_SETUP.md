# Android Storage Permissions Setup

## Overview
The mobile app now requests storage permissions to allow users to upload files from their device.

## What Was Changed

### 1. Email Field Made Read-Only
- Email field in settings is now disabled and shows "Email cannot be changed"
- Users can still update their name

### 2. Storage Permission Implementation
- Created `src/utils/permissions.ts` with permission handling utilities
- Updated `MobileProjectSpace.tsx` to request permissions before file upload
- Added permission check before opening file picker

### 3. Capacitor Configuration
- Updated `capacitor.config.json` to declare storage permissions

## Android Permissions Setup

After you generate the Android platform (`npm run cap:add:android`), you need to add permissions to the AndroidManifest.xml file.

### Steps:

1. **Navigate to Android manifest:**
   ```
   mobile/android/app/src/main/AndroidManifest.xml
   ```

2. **Add these permissions inside the `<manifest>` tag (before `<application>`):**
   ```xml
   <!-- For Android 12 and below -->
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
   
   <!-- For Android 13+ (API 33+) - More granular permissions -->
   <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
   <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
   <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
   ```

### Example AndroidManifest.xml:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Storage Permissions -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    
    <!-- Internet Permission (already added by Capacitor) -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <!-- ... rest of application config ... -->
    </application>
</manifest>
```

## How It Works

1. **User clicks "Choose File" button** → App requests storage permission
2. **Permission granted** → File picker opens, user can select files
3. **Permission denied** → Toast message shown: "Storage permission is needed to upload files"

## Android Version Compatibility

- **Android 13+ (API 33+)**: Uses new media permissions (READ_MEDIA_*)
- **Android 12 and below**: Uses READ_EXTERNAL_STORAGE/WRITE_EXTERNAL_STORAGE
- The `maxSdkVersion="32"` ensures old permissions only apply to older Android versions

## Testing

After building the APK:
1. Install on Android device
2. Navigate to Projects → Open a project → Files tab
3. Click "Choose File"
4. Android will prompt for storage permission (first time only)
5. Grant permission and select a file to upload

## Building the APK

### Using GitHub Actions (Recommended)

1. **Add Android platform:**
   ```bash
   cd mobile
   npm run cap:add:android
   ```

2. **Add storage permissions:**
   ```bash
   .\add-android-permissions.ps1
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add storage permissions for file uploads"
   git push
   ```

4. **GitHub Actions will automatically:**
   - Build the project
   - Generate signed APK
   - Upload as artifact

### Manual Build (Alternative)

If you need to build locally:

```bash
cd mobile
npm run build
npm run cap:sync
npm run cap:open:android
```

Then in Android Studio:
1. Build → Generate Signed Bundle / APK
2. Follow the signing process
3. Install and test on device
