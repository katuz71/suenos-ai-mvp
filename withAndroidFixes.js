const { withProjectBuildGradle, withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidFixes(config) {
  // 1. ПРИНУДИТЕЛЬНЫЙ KOTLIN И COMPOSE (решает ошибку 1.9.25)
  config = withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Уничтожаем любые упоминания 1.9.25 в пользу 2.0.21
    contents = contents.replace(/kotlinVersion\s*=\s*.*$/m, "kotlinVersion = '2.0.21'");
    contents = contents.replace(/kotlin_version\s*=\s*.*$/m, "kotlin_version = '2.0.21'");
    
    // Исправляем Compose Compiler, который ищет 1.9.25
    if (!contents.includes('configurations.all')) {
      const forceFix = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force "org.jetbrains.kotlin:kotlin-stdlib:2.0.21"
            // Заставляем систему использовать версию 2.0.21 для Compose, если она ищет 1.9.25
            eachDependency { DependencyResolveDetails details ->
                if (details.requested.group == 'org.jetbrains.kotlin' && details.requested.name.contains('kotlin-compose-compiler-plugin-embeddable')) {
                    details.useVersion "2.0.21"
                }
            }
        }
    }
}
`;
      contents += forceFix;
    }

    config.modResults.contents = contents;
    return config;
  });

  // 2. ФИКС 16 КБ (Манифест) - для Android 15 ставим false
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