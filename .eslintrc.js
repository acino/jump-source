module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ['prettier', 'prettier/@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/member-delimiter-style': [
      'warn',
      {
        multiline: {
          delimiter: 'semi',
          requireLast: true
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }
    ],
    '@typescript-eslint/no-unused-expressions': 'warn',
    '@typescript-eslint/semi': ['warn', 'always'],
    curly: 'warn',
    eqeqeq: ['warn', 'always'],
    'no-redeclare': 'warn',
    'no-throw-literal': 'warn',
    'no-shadow': 'warn'
  }
};
