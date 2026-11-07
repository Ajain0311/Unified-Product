import React, { useEffect } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

interface GitHubReleaseResponse {
  tag_name: string;
  name: string;
  body: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

const GITHUB_REPO = 'Ajain0311/Unified-Product';
const DISMISSED_TAG_KEY = '@superapp_dismissed_update_tag';
const INSTALLED_TAG_KEY = '@superapp_installed_update_tag';
const LAST_CHECK_TIME_KEY = '@superapp_last_update_check_timestamp';
const CHECK_THROTTLE_MS = 6 * 60 * 60 * 1000; // Check at most once every 6 hours

export function parseSemver(v: string): [number, number, number] {
  if (!v) return [0, 0, 0];
  const clean = v.replace(/^[vV]/, '').split('-')[0].trim();
  const parts = clean.split('.').map((p) => parseInt(p, 10));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
    Number.isFinite(parts[2]) ? parts[2] : 0,
  ];
}

export function isRemoteVersionNewer(remoteTag: string, installedVersion: string): boolean {
  const [rMaj, rMin, rPat] = parseSemver(remoteTag);
  const [iMaj, iMin, iPat] = parseSemver(installedVersion);

  if (rMaj > iMaj) return true;
  if (rMaj < iMaj) return false;
  if (rMin > iMin) return true;
  if (rMin < iMin) return false;
  return rPat > iPat;
}

export function useAppUpdateChecker(): void {
  useEffect(() => {
    let isMounted = true;

    async function checkForUpdate() {
      try {
        // Throttle check to avoid hitting GitHub API on every screen mount / focus
        const lastCheckRaw = await AsyncStorage.getItem(LAST_CHECK_TIME_KEY);
        const lastCheck = lastCheckRaw ? parseInt(lastCheckRaw, 10) : 0;
        const now = Date.now();
        if (now - lastCheck < CHECK_THROTTLE_MS) {
          return;
        }

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) return;

        const data: GitHubReleaseResponse = await response.json();
        const latestTag = (data.tag_name || '').trim();

        if (!latestTag || !isMounted) return;

        // Current installed version from app.json / Expo manifest
        const currentVersion =
          Constants.expoConfig?.version ||
          (Constants.manifest as any)?.version ||
          (Constants.manifest2 as any)?.extra?.expoClient?.version ||
          '1.0.4';

        // Check if user already dismissed or installed this exact release tag
        const [dismissedTag, installedTag] = await Promise.all([
          AsyncStorage.getItem(DISMISSED_TAG_KEY),
          AsyncStorage.getItem(INSTALLED_TAG_KEY),
        ]);

        if (latestTag === dismissedTag || latestTag === installedTag) {
          return;
        }

        // Semver validation: Only prompt if remote version is strictly newer than installed version
        if (!isRemoteVersionNewer(latestTag, currentVersion)) {
          // Record check timestamp so we don't re-query GitHub until throttle expires
          await AsyncStorage.setItem(LAST_CHECK_TIME_KEY, now.toString());
          return;
        }

        const apkAsset =
          data.assets?.find((a) => a.name === 'zupify-release.apk') ||
          data.assets?.find((a) => a.name === 'app-release.apk') ||
          data.assets?.find((a) => a.name.endsWith('.apk'));

        if (!apkAsset) return;

        await AsyncStorage.setItem(LAST_CHECK_TIME_KEY, now.toString());

        Alert.alert(
          'New Update Available! 🚀',
          `A new build (${data.name || latestTag}) is available. Update now to install the latest features!`,
          [
            {
              text: 'Later',
              style: 'cancel',
              onPress: () => {
                void AsyncStorage.setItem(DISMISSED_TAG_KEY, latestTag);
              },
            },
            {
              text: 'Update & Install Now',
              style: 'default',
              onPress: () => {
                void downloadAndInstallApk(apkAsset.browser_download_url, latestTag);
              },
            },
          ],
          { cancelable: true }
        );
      } catch {
        // Silent on network failure
      }
    }

    const timer = setTimeout(() => {
      void checkForUpdate();
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);
}

async function downloadAndInstallApk(downloadUrl: string, latestTag: string): Promise<void> {
  if (Platform.OS !== 'android') {
    void Linking.openURL(downloadUrl);
    return;
  }

  try {
    const fileUri = `${FileSystem.documentDirectory}update.apk`;

    Alert.alert('Downloading Update ⏳', 'Downloading the latest APK in the background. Please wait a moment...');

    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      fileUri,
      {},
      () => {}
    );

    const result = await downloadResumable.downloadAsync();

    if (result && result.uri) {
      // Mark as installed tag so it won't prompt repeatedly
      await AsyncStorage.setItem(INSTALLED_TAG_KEY, latestTag);

      // Get content URI using Android FileProvider
      const cUri = await FileSystem.getContentUriAsync(result.uri);

      // FLAG_GRANT_READ_URI_PERMISSION = 1, FLAG_ACTIVITY_NEW_TASK = 0x10000000 (268435456)
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: cUri,
        flags: 268435457,
        type: 'application/vnd.android.package-archive',
      });
    }
  } catch (error: any) {
    console.warn('[AutoUpdate] In-app installer direct launch error, falling back to browser:', error);
    try {
      await Linking.openURL(downloadUrl);
    } catch {
      Alert.alert(
        'Installation Help',
        'Could not open installer directly. Please allow "Install unknown apps" for Zupify in phone settings or download via browser.'
      );
    }
  }
}
