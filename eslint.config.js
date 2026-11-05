import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // docs/tools holds standalone Node cross-check scripts (not shipped, not typed); the app code is what we lint.
  { ignores: ['dist/**', 'node_modules/**', 'docs/tools/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
);
