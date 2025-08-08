/**
 * Jest config scoped to serverless functions tests only.
 * Uses babel-jest with preset-env to transform ESM to CJS for Node.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/netlify/functions/__tests__'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }],
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: ['/node_modules/'],
};
