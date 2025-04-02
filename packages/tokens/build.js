import StyleDictionary from 'style-dictionary';
import { formats, transformGroups } from 'style-dictionary/enums';
import fs from 'fs';
import path from 'path';

const {
  androidColors,
  androidFontDimens,
  androidStrings,
  iosMacros,
  scssVariables,
  cssVariables,
  javascriptModuleFlat,
  jsonFlat,
} = formats;

const { web } = transformGroups;

// Constants
const BRANDS = ['brand-a', 'brand-b', 'brand-a-theme', 'brand-b-theme']; // Add all your brand folders here
const PLATFORMS = ['webGlobal', 'webThemes', 'ios', 'android'];

// Function to dynamically generate TOKEN_CATEGORIES
const generateTokenCategories = (brands) => {
  const tokenCategories = {};

  brands.forEach((brand) => {
    const brandPath = path.join('./sd4/all-tokens', brand);
    const files = fs.readdirSync(brandPath);

    tokenCategories[brand] = {};

    files.forEach((file) => {
      if (file.endsWith('.json')) {
        const category = file.replace('.json', '');
        tokenCategories[brand][category] = {
          attributes: { category: `${category}` },
        };
        console.log(`category: ${category}`);
      }
    });
  });

  console.log(`tokenCategories: ${tokenCategories}`);

  return tokenCategories;
};

const TOKEN_CATEGORIES = generateTokenCategories(BRANDS);

// Theme types
const TOKEN_THEME_TYPES = [
  'themeEDSMUI',
  'themeEDSChameleonMUI',
  'themeAFIMUI',
  'themeAFIChameleonMUI',
];

// File formats
const FILE_FORMATS = {
  web: {
    scss: scssVariables,
    css: cssVariables,
    js: javascriptModuleFlat,
    json: jsonFlat,
  },
  android: {
    xml: {
      tokens: androidStrings,
      colors: androidColors,
      family: androidFontDimens,
    },
  },
  ios: {
    h: iosMacros,
  },
};

// Filter functions - createFilter
const createFilter = (brand, category) => {
  const categoryConfig = TOKEN_CATEGORIES[brand][category];
  return (token) => {
    if (!categoryConfig) return true;
    if (categoryConfig.attributes && token.attributes) {
      const attributeKeys = Object.keys(categoryConfig.attributes);
      return attributeKeys.every(
        (key) => token.attributes[key] === categoryConfig.attributes[key]
      );
    }
    return false;
  };
};

// Filter functions - createThemeFilter - need to optimize
const createThemeFilter = (themeType) => {
  return (token) => {
    // Check if token or any of its parent objects have the specified theme type
    if (!token || typeof token !== 'object') return false;

    // Direct match on the token itself
    if (token.type === themeType) return true;

    // Check nested properties
    if (token.value && token.value.type === themeType) return true;

    // For flattened tokens, check if the path contains the theme type
    if (token.path && token.path.some((part) => part === themeType))
      return true;

    return false;
  };
};

// Platform configurations
const platformConfigs = {
  webGlobal: (brand) => ({
    transformGroup: web,
    buildPath: `build/web/global/`,
    files: [
      // Global files
      ...['scss', 'css', 'js', 'json'].map((format) => ({
        destination: `${brand}/${format}/tokens.${format}`,
        format: FILE_FORMATS.web[format],
      })),
      // Category files
      ...Object.keys(TOKEN_CATEGORIES[brand]).flatMap((category) =>
        ['scss', 'css', 'js', 'json'].map((format) => ({
          destination: `${brand}/${format}/${category}.${format}`,
          format: FILE_FORMATS.web[format],
          filter: createFilter(brand, category),
        }))
      ),
    ],
  }),

  webThemes: (brand) => ({
    transformGroup: web,
    buildPath: `build/web/themes/`,
    files: [
      // Theme files
      ...TOKEN_THEME_TYPES.flatMap((themeType) =>
        ['scss', 'css', 'js', 'json'].map((format) => ({
          destination: `${themeType}/${format}/${themeType}.${format}`,
          format: FILE_FORMATS.web[format],
          filter: createThemeFilter(themeType),
        }))
      ),
    ],
  }),

  android: (brand) => ({
    transformGroup: 'android',
    buildPath: `build/android/${brand}/`,
    files: [
      {
        destination: 'xml/tokens.xml',
        format: FILE_FORMATS.android.xml.tokens,
      },
      {
        destination: 'xml/colors.xml',
        format: FILE_FORMATS.android.xml.colors,
        filter: createFilter(brand, 'color'),
      },
    ],
  }),

  ios: (brand) => ({
    transformGroup: 'ios',
    buildPath: `build/ios/${brand}/`,
    files: [
      {
        destination: 'tokens.h',
        format: FILE_FORMATS.ios.h,
      },
    ],
  }),
};

// Configuration generator
function getStyleDictionaryConfig(brand, platform) {
  return {
    source: [`./sd4/all-tokens/${brand}/**/*.@(json|json5)`],
    platforms: {
      [platform]: platformConfigs[platform](brand),
    },
  };
}

// Logger
const logger = {
  start: () => console.log('Build started...'),
  process: (platform, brand) =>
    console.log(`\nProcessing: [${platform}] [${brand}]`),
  separator: () =>
    console.log('\n=============================================='),
  complete: () => console.log('\nBuild completed!'),
};

// Build process
function buildTokens() {
  logger.start();

  BRANDS.forEach((brand) => {
    PLATFORMS.forEach((platform) => {
      logger.separator();
      logger.process(platform, brand);

      const sd = new StyleDictionary(getStyleDictionaryConfig(brand, platform));
      sd.buildPlatform(platform);
    });
  });

  logger.separator();
  logger.complete();
}

buildTokens();
