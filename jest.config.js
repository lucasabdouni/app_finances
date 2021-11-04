module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules', '/android', '/ios'],
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    'jest-styled-components',
  ],
};
