const fs = require('fs');
const path = require('path');

// --- КОНФИГУРАЦИЯ СТРАТЕГИИ (из STRATEGY.md и LUNA_PERSONA.md) ---
const CONFIG = {
  monetization: {
    targetFile: 'useMonetization.ts',
    prices: { weekly: '1.99', lifetime: '39.99' },
    trialDays: '3',
    keywords: ['offering', 'package', 'purchase', 'restore'] // Маркеры RevenueCat
  },
  persona: {
    targetFile: 'energy.tsx',
    forbidden: ['AI', 'Bot', 'Model', 'Algorithm', 'GPT', 'Assistant'],
    required: ['Luna', 'Energy', 'Universe', 'Stars', 'Sign'],
    systemPromptMarker: 'Soy la energía que interpreta las señales del universo para ti'
  },
  analytics: {
    // Ищем вызовы аналитики (Supabase, Firebase, Amplitude или кастомные)
    markers: ['logEvent', 'track', 'analytics.', 'sendEvent', 'identify'],
    criticalEvents: ['app_open', 'purchase_attempt', 'dream_interpreted', 'paywall_view']
  },
  ignoreDirs: ['node_modules', '.git', '.expo', 'android', 'ios', 'web-build'],
  sourceExt: ['.ts', '.tsx', '.js']
};

let stats = { errors: 0, warnings: 0 };

function logError(file, msg) {
  console.error(`❌ ERROR [${file}]: ${msg}`);
  stats.errors++;
}
function logWarn(file, msg) {
  console.warn(`⚠️  WARNING [${file}]: ${msg}`);
  stats.warnings++;
}
function logSuccess(file, msg) {
  console.log(`✅ OK [${file}]: ${msg}`);
}

// Рекурсивный поиск файлов
function findFile(dir, targetName) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (CONFIG.ignoreDirs.includes(file)) return;
    
    if (stat.isDirectory()) {
      results = results.concat(findFile(filePath, targetName));
    } else if (file === targetName) {
      results.push(filePath);
    }
  });
  return results;
}

// 1. ПРОВЕРКА МОНЕТИЗАЦИИ (useMonetization.ts)
function checkMonetizationLogic() {
  console.log('\n--- 1. Checking Monetization Logic ---');
  const files = findFile('./', CONFIG.monetization.targetFile);
  
  if (files.length === 0) {
    logError('General', `Critical file '${CONFIG.monetization.targetFile}' NOT FOUND!`);
    return;
  }

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Проверка цен (Decoy Pricing)
    if (!content.includes(CONFIG.monetization.prices.weekly)) {
      logWarn(path.basename(filePath), `Weekly price $${CONFIG.monetization.prices.weekly} not explicitly found. Ensure it's fetched correctly.`);
    }
    if (!content.includes(CONFIG.monetization.prices.lifetime)) {
      logWarn(path.basename(filePath), `Lifetime price $${CONFIG.monetization.prices.lifetime} not explicitly found. Check anchor pricing logic.`);
    }
    
    // Проверка триала
    if (!content.includes(CONFIG.monetization.trialDays)) {
      logWarn(path.basename(filePath), `Trial period (${CONFIG.monetization.trialDays} days) logic not explicitly found.`);
    }

    // Проверка использования библиотек покупок (RevenueCat)
    const hasRevenueLogic = CONFIG.monetization.keywords.some(kw => content.toLowerCase().includes(kw));
    if (hasRevenueLogic) {
      logSuccess(path.basename(filePath), 'RevenueCat/Purchase logic detected.');
    } else {
      logError(path.basename(filePath), 'No purchase logic keywords found (offering, package, etc).');
    }
  });
}

// 2. ПРОВЕРКА ПЕРСОНЫ (energy.tsx)
function checkEnergyLogic() {
  console.log('\n--- 2. Checking Persona Logic (Energy) ---');
  const files = findFile('./', CONFIG.persona.targetFile);

  if (files.length === 0) {
    logWarn('General', `File '${CONFIG.persona.targetFile}' not found. Skipping specific persona check.`);
  }

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // Forbidden Words
    CONFIG.persona.forbidden.forEach(word => {
      if (new RegExp(`\\b${word}\\b`, 'i').test(content)) {
        logError(fileName, `Contains FORBIDDEN word: "${word}". Replace with mystical terms.`);
      }
    });

    // Required Vocabulary
    const foundRequired = CONFIG.persona.required.filter(word => content.includes(word));
    if (foundRequired.length < 2) { // Хотя бы 2 "мистических" слова должны быть
      logWarn(fileName, `Low mystical density. Found only: [${foundRequired.join(', ')}]. Consider adding: ${CONFIG.persona.required.join(', ')}`);
    } else {
      logSuccess(fileName, 'Mystical vocabulary check passed.');
    }
  });
}

// 3. ПРОВЕРКА АНАЛИТИКИ (Global Scan)
function checkAnalyticsImplementation(dir) {
  const list = fs.readdirSync(dir);
  let analyticsFoundCount = 0;

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (CONFIG.ignoreDirs.includes(file)) return;

    if (stat.isDirectory()) {
      analyticsFoundCount += checkAnalyticsImplementation(filePath);
    } else if (CONFIG.sourceExt.includes(path.extname(file))) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Ищем вызовы аналитики
      const foundMarker = CONFIG.analytics.markers.find(m => content.includes(m));
      if (foundMarker) {
        // Проверяем, не логируются ли критические события
        // Например: analytics.logEvent('purchase')
        CONFIG.analytics.criticalEvents.forEach(event => {
            if (content.includes(event)) {
                 console.log(`ℹ️  [Analytics] Found event '${event}' in ${file}`);
            }
        });
        analyticsFoundCount++;
      }
    }
  });
  return analyticsFoundCount;
}

// --- ЗАПУСК ---
console.log("🚀 STARTING DEEP LOGIC VERIFICATION...\n");

checkMonetizationLogic();
checkEnergyLogic();

console.log('\n--- 3. Scanning Analytics Implementation ---');
const totalAnalyticsCalls = checkAnalyticsImplementation('./');
if (totalAnalyticsCalls === 0) {
  logError('Analytics', 'NO ANALYTICS CALLS FOUND in the entire project! You are flying blind.');
} else {
  logSuccess('Analytics', `Found traces of analytics logic in ${totalAnalyticsCalls} files.`);
}

console.log("\n------------------------------------------------");
console.log(`Scan Complete. Errors: ${stats.errors}, Warnings: ${stats.warnings}`);
if (stats.errors > 0) process.exit(1);