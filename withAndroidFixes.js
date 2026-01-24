const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidFixes(config) {
  // 1. Фикс для NDK (Memory Page Size 16KB)
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Ищем блок android { ... } и вставляем ndkVersion
    if (!buildGradle.includes('ndkVersion')) {
      config.modResults.contents = buildGradle.replace(
        /android\s?{/,
        `android {
    ndkVersion "27.0.12077973"`
      );
    }
    return config;
  });

  // 2. Фикс для Google Ads (Понижение версии и фикс Kotlin)
  config = withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Добавляем resolutionStrategy, если его нет
    if (!buildGradle.includes('force "com.google.android.gms:play-services-ads:23.6.0"')) {
      const fixCode = `
    configurations.all {
        resolutionStrategy {
            force "com.google.android.gms:play-services-ads:23.6.0"
            force "org.jetbrains.kotlin:kotlin-stdlib:1.9.25"
            force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.25"
        }
    }`;
      
      // Вставляем в конец блока allprojects
      config.modResults.contents = buildGradle.replace(
        /allprojects\s?{([\s\S]*?)}/,
        (match) => {
            // Вставляем перед закрывающей скобкой блока allprojects
            const lastBrace = match.lastIndexOf('}');
            return match.substring(0, lastBrace) + fixCode + "\n}";
        }
      );
    }
    return config;
  });

  return config;
};