// React Native config for Expo projects
// Note: Expo uses its own config system (app.config.ts/app.json)
// This file is mainly for React Native CLI tools compatibility
// The project.android section is not used by Expo and may cause conflicts
module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-vector-icons/android',
          packageImportPath: 'import io.github.react-native-vector-icons.VectorIconsPackage;',
          packageInstance: 'new VectorIconsPackage()',
        },
      },
    },
  },
  // Removed project.android section - Expo manages Android config via app.config.ts
  // This prevents "project.android.buildGradlePath is not allowed" errors
  // project: {
  //   android: {
  //     sourceDir: './android',
  //     manifestPath: 'app/src/main/AndroidManifest.xml',
  //     buildGradlePath: 'app/build.gradle',
  //   },
  // },
};



















