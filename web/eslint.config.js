import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.*'],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // Use TypeScript's type information for accurate linting
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Use TypeScript-aware rules which don't require browser globals for DOM types
      ...tsPlugin.configs['eslint-recommended'].overrides?.[0]?.rules,
      ...tsPlugin.configs.recommended.rules,
      // Disable no-undef since TypeScript handles this via tsconfig lib: DOM
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty interface extensions (common pattern in UI component libraries)
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // Relax rules for auto-generated shadcn/ui files
  {
    files: ['src/components/ui/**/*.ts', 'src/components/ui/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
