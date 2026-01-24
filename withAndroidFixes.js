const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidFixes(config) {
  // 1. Принудительно разрешаем извлечение нативных библиотек в манифесте
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['android:extractNativeLibs'] = 'true'; // Это ключ к решению для 16 КБ
    return config;
  });

  // 2. Настраиваем Gradle для выравнивания страниц
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('android {')) {
      const packagingFix = `
        packagingOptions {
            jniLibs {
                useLegacyPackaging = true // Включаем для корректного выравнивания
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