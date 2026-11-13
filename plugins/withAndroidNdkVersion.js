const { withProjectBuildGradle } = require('@expo/config-plugins');

const withAndroidNdkVersion = (config, ndkVersion = '27.0.12077973') => {
  return withProjectBuildGradle(config, (projectConfig) => {
    let contents = projectConfig.modResults.contents;
    if (!contents.includes('ndkVersion =')) {
      contents = contents.replace(
        /buildscript\s*\{/,
        `buildscript {\n    ext.ndkVersion = "${ndkVersion}"`
      );
    } else {
      contents = contents.replace(
        /ndkVersion\s*=\s*["'][^"']+["']/,
        `ndkVersion = "${ndkVersion}"`
      );
    }
    projectConfig.modResults.contents = contents;
    return projectConfig;
  });
};

module.exports = withAndroidNdkVersion;
