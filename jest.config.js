module.exports = {
  preset: 'react-native',
  // The stock RN preset doesn't transform ESM shipped by these packages, so
  // anything that imports @react-navigation crashes at require time. Transform
  // them (and any react-native-* scoped deps) instead of ignoring them.
  transformIgnorePatterns: [
    'node_modules/(?!((react-native|@react-native|@react-navigation|react-native-.*|@react-native-community|@react-native-async-storage)/))',
  ],
};
