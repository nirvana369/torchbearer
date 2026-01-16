import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import pluginRouter from '@tanstack/eslint-plugin-router';
import noBigIntInQueryKeys from './eslint-rules/no-bigint-in-query-keys.js';
import requireInternetIdentityProvider from './eslint-rules/require-internet-identity-provider.js';
import pluginTailwindcss from 'eslint-plugin-tailwindcss';

const customRules = {
    rules: {
        'no-bigint-in-query-keys': noBigIntInQueryKeys,
        'require-internet-identity-provider': requireInternetIdentityProvider
    }
};

export default [
    {
        ignores: [
            '**/backend.ts',
            '**/backend.d.ts',
            'dist/**',
            'node_modules/**',
            'build/**',
            '*.config.js',
            'eslint-rules/**'
            // 'components/ui/**'
        ]
    },
    ...pluginRouter.configs['flat/recommended'],
    ...pluginTailwindcss.configs['flat/recommended'],
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021
            }
        },
        plugins: {
            '@typescript-eslint': typescript,
            'react-hooks': reactHooks,
            tailwindcss: pluginTailwindcss,
            custom: customRules
        },
        rules: {
            ...typescript.configs.recommended.rules,
            // Having warns pollutes in case of errors.
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['off', { argsIgnorePattern: '^_' }],
            // '@typescript-eslint/no-floating-promises': 'error', -- enable in the future
            // Additional AI-friendly rules
            'no-useless-escape': 'off',
            '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-ignore when needed
            '@typescript-eslint/no-non-null-assertion': 'off', // Allow ! operator
            'no-console': 'off', // Allow console.log for debugging
            'prefer-const': 'off', // Warn instead of error for let vs const
            // tailwindcss rules
            'tailwindcss/no-custom-classname': 'off', // Allow custom classes
            'tailwindcss/classnames-order': 'off',
            'tailwindcss/no-unnecessary-arbitrary-value': 'off',
            'tailwindcss/enforces-shorthand': 'off',
            // custom rules
            'custom/no-bigint-in-query-keys': 'error',
            'custom/require-internet-identity-provider': 'error'
        },
        settings: {
            tailwindcss: {
                callees: ['cn', 'cva'],
                config: './tailwind.config.js'
            }
        }
    }
];
