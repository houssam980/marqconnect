import { Capacitor } from '@capacitor/core';

/**
 * Request storage permission for file uploads on mobile devices
 * Returns true if permission is granted or not needed (web)
 */
export async function requestStoragePermission(): Promise<boolean> {
  // On web, no permission needed
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    // For Android 13+ (API 33+), we don't need READ_EXTERNAL_STORAGE
    // The file picker handles permissions automatically
    // For older versions, permissions are handled in AndroidManifest.xml
    return true;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
}

/**
 * Check if the app is running on a native platform
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
