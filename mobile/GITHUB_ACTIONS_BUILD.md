# GitHub Actions Android Build Setup

## Overview
The mobile app now builds automatically using GitHub Actions when you push changes to the repository.

## Workflow File
Location: `.github/workflows/android-build.yml`

## What It Does

### Triggers
- Pushes to `main` or `master` branch that modify `mobile/**` files
- Manual workflow dispatch

### Build Process
1. Sets up Node.js 18 and Java 17
2. Installs npm dependencies
3. Builds the web app (`npm run build`)
4. Adds Android platform and syncs with Capacitor
5. Automatically adds storage permissions to AndroidManifest.xml
6. Builds Debug APK (always)
7. Builds Release APK (if keystore is configured)
8. Uploads APKs as artifacts

## Getting Started

### 1. Initial Setup

Add the Android platform and permissions locally first:

```bash
cd mobile
npm run cap:add:android
```

Run the permission script:
```powershell
.\add-android-permissions.ps1
```

### 2. Commit and Push

```bash
git add .
git commit -m "Add Android platform with storage permissions"
git push
```

### 3. Download APK

1. Go to your GitHub repository
2. Click "Actions" tab
3. Click on the latest workflow run
4. Scroll down to "Artifacts"
5. Download `marqenconnect-debug-apk`

## Setting Up Release Builds (Optional)

To build signed release APKs, you need to:

### 1. Create a Keystore

```bash
keytool -genkey -v -keystore keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias marqenconnect
```

Save this file as `mobile/keystore.jks` (DO NOT commit to git!)

### 2. Add Secrets to GitHub

Go to: Repository → Settings → Secrets and variables → Actions

Add these secrets:
- `KEYSTORE_PASSWORD`: Your keystore password
- `KEY_ALIAS`: Your key alias (e.g., "marqenconnect")
- `KEY_PASSWORD`: Your key password

### 3. Upload Keystore to GitHub

Since we can't commit the keystore to git, you have two options:

**Option A: Base64 encode and store as secret**

```bash
# Encode keystore
base64 -w 0 mobile/keystore.jks > keystore.txt

# Add the content as secret KEYSTORE_BASE64
# Then modify the workflow to decode it
```

**Option B: Add to .gitignore and upload manually**

Keep keystore locally and only build release APKs manually when needed.

## Artifacts

### Debug APK
- **Name**: `marqenconnect-debug-apk`
- **Retention**: 30 days
- **Use**: Testing and development
- **Signed**: Debug keystore (auto-generated)

### Release APK (if configured)
- **Name**: `marqenconnect-release-apk`
- **Retention**: 90 days
- **Use**: Production distribution
- **Signed**: Your keystore

## Manual Workflow Dispatch

You can trigger builds manually:

1. Go to: Repository → Actions → Android Build
2. Click "Run workflow"
3. Select branch
4. Click "Run workflow"

## Troubleshooting

### Build fails with "No Android platform found"
- Make sure you've run `npm run cap:add:android` locally first
- Commit the `android/` folder to git

### Permissions not added
- The workflow automatically adds permissions
- Check the workflow logs to verify

### Release build skipped
- This is normal if you haven't set up the keystore
- Debug APK will still be built and available

## Updating the App

After making changes:

```bash
cd mobile
git add .
git commit -m "Your changes"
git push
```

GitHub Actions will automatically build a new APK. Download it from the Actions tab.

## Storage Permissions

The workflow automatically adds these permissions to AndroidManifest.xml:

- `READ_EXTERNAL_STORAGE` (Android ≤12)
- `WRITE_EXTERNAL_STORAGE` (Android ≤12)
- `READ_MEDIA_IMAGES` (Android 13+)
- `READ_MEDIA_VIDEO` (Android 13+)
- `READ_MEDIA_AUDIO` (Android 13+)

These are required for users to upload files from their device storage.
