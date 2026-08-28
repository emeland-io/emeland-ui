import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
    {
        ignores: ['dist/**', 'node_modules/**','.vite/**', '*.config.js', '*nb.config.ts', 'src/api/gen/**'],
    },

    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],

    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
            },
            globals: {
                ...globals.browser,
            }
        },
    },

    {
        rules: {
            'no-console': 'warn',
            'no-debugger': 'warn',

            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': 'error',

            'vue/no-v-html': 'error',

            'vue/multi-word-component-names': 'off',
            'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
            'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
            'vue/component-api-style': ['error', ['script-setup']],
            'vue/no-unused-refs': 'warn',
        },
    },

    // node scripts (e.g. the api:gen generator) run in plain node
    {
        files: ['scripts/**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-console': 'off',
        },
    },

    eslintConfigPrettier,
]