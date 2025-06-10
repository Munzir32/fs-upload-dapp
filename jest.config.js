module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:@filoz/synapse-sdk)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@filoz/synapse-sdk$': '<rootDir>/test/__mocks__/synapse-sdk.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};
