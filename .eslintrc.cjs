module.exports = {
    extends: ['alloy', 'alloy/typescript'],
    env: {
        browser: false,
        node: true,
    },
    globals: {
        $: true,
    },
    rules: {
        'no-unused-vars': 'off',
        'no-console': 'off',
        'comma-dangle': 'off',
        'brace-style': 'off',
        indent: 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/indent': ['error', 4, { offsetTernaryExpressions: true }],
        '@typescript-eslint/explicit-member-accessibility': 'off',
        ignoredNodes: ['Decorator'],
    },
    plugins: [],
}
