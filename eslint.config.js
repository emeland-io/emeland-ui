import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
    {
        ignores: ['dist/', 'node_modules/', '.config.js', '.config.ts'],
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
        },
    },

    {
        rules: {
            'no-console': 'warn',
            'no-debugger': 'warn',

            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': 'error',

            'vue/multi-word-component-names': 'off',
            'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
            'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
            'vue/component-api-style': ['error', ['script-setup']],
            'vue/no-unused-refs': 'warn',
        },
    },

    eslintConfigPrettier,
]