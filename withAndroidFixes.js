const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidFixes(config) {
  // 1. Указываем системе НЕ извлекать библиотеки (важно для 16 КБ!)
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    // В 2026 году для SDK 35 значение ДОЛЖНО быть false
    mainApplication.$['android:extractNativeLibs'] = 'false'; 
    return config;
  });

  // 2. Настраиваем упаковку так, чтобы библиотеки не сжимались
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('android {')) {
      const packagingFix = `
        packagingOptions {
            jniLibs {
                useLegacyPackaging = false // false заставляет библиотеки лежать несжатыми
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