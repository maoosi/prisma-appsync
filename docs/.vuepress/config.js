const { description } = require('../../package')

module.exports = {
    title: 'Prisma-AppSync',
    description: description,
    head: [
        ['meta', {
            name: 'theme-color',
            content: '#3eaf7c'
        }],
        ['meta', {
            name: 'apple-mobile-web-app-capable',
            content: 'yes'
        }],
        ['meta', {
            name: 'apple-mobile-web-app-status-bar-style',
            content: 'black'
        }]
    ],
    theme: './.vuepress/vuepress-theme-maoosi',
    themeConfig: {
        repo: '',
        editLinks: false,
        docsDir: '',
        editLinkText: '',
        lastUpdated: false,
        searchPlaceholder: 'Press "/" to focus',
        logo: '/prisma-appsync-logo.png',
        nav: [
            {
                text: 'Github',
                link: 'https://github.com/maoosi/prisma-appsync'
            }
        ],
        sidebar: [
            {
                title: 'Prisma-AppSync',
                path: '/',
                collapsable: false,
            },
            {
                title: 'Guides',
                path: '/guides/',
                collapsable: false,
                children:  [
                    '/guides/getting-started',
                    '/guides/installation',
                    '/guides/extending-api',
                    '/guides/securing-api',
                    '/guides/ignore',
                    '/guides/hooks',
                    '/guides/debugging',
                ]
            },
            {
                title: 'Reference',
                path: '/reference/',
                collapsable: false,
                children:  [
                    '/reference/generator',
                    '/reference/client-api',
                    '/reference/client-types',
                ]
            },
            {
                title: 'Demo',
                path: '/demo/',
                collapsable: false,
                children:  [
                    '/demo/User',
                    '/demo/Post',
                ]
            }
        ]
    },
    plugins: [
        '@vuepress/plugin-back-to-top',
        '@vuepress/plugin-medium-zoom'
    ]
}
