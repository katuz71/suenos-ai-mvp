const { withProjectBuildGradle, withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidFixes(config) {
  // 1. Синхронизируем Kotlin и KSP под версию 2.1.20 (как просит твой лог)
  config = withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    contents = contents.replace(/kotlinVersion\s*=\s*.*$/m, "kotlinVersion = '2.1.20'");
    contents = contents.replace(/kspVersion\s*=\s*.*$/m, "kspVersion = '2.1.20-1.0.29'");
    config.modResults.contents = contents;
    return config;
  });

  // 2. ФИКС 16 КБ (Манифест)
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['android:extractNativeLibs'] = 'false'; 
    return config;
  });

  // 3. ФИКС 16 КБ (Gradle приложения)
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('android {')) {
      const packagingFix = `
        packagingOptions {
            jniLibs {
                useLegacyPackaging = false
            }
        }
      `;
      config.modResults.contents = config.modResults.contents.replace(
        'android {',
        `android {${packagingFix}`
      );
    }
    return config;
  });

  return config;
};