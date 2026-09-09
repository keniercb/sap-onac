module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  extends: ['@sap-onac/shared-config/eslint-base.js', 'plugin:jest/recommended'],
  plugins: ['jest'],
  env: { jest: true },
  root: true,
};
