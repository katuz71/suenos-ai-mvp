const { withAndroidManifest, withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidFixes(config) {
  // 1. Фикс для 16 КБ в Манифесте
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['android:extractNativeLibs'] = 'false'; 
    return config;
  });

  // 2. Фикс для 16 КБ в build.gradle приложения
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

  // 3. ПРИНУДИТЕЛЬНЫЙ Kotlin 2.0.21 для всего проекта (решает ошибку KSP)
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('ext {')) {
      // Заменяем любую версию Kotlin на 2.0.21
      config.modResults.contents = config.modResults.contents.replace(
        /kotlinVersion\s*=\s*['"].*['"]/,
        "kotlinVersion = '2.0.21'"
      );
    }
    return config;
  });

  return config;
};