module.exports = {
  extends: ['next/core-web-vitals', 'xo', 'xo-react', 'xo-nextjs', 'prettier', 'plugin:prettier/recommended'],
  plugins: ['@stylexjs'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        tabWidth: 2,
        useTabs: false,
        printWidth: 150,
        singleQuote: true,
      },
    ],
    complexity: ['error', 25],
    'no-negated-condition': 'off',
    'capitalized-comments': 'off',
    'react/prop-types': 'off',
    '@stylexjs/valid-styles': 'error',
  },
};
