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
  project: {
    android: {
      sourceDir: './android',
      manifestPath: 'app/src/main/AndroidManifest.xml',
      buildGradlePath: 'app/build.gradle',
    },
  },
};



















