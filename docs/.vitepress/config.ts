import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Prisma-AppSync',
    description: 'GraphQL API Generator for AWS and ◭ Prisma',

    head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

    vue: {
        reactivityTransform: true,
    },

    themeConfig: {
        logo: '/logo.svg',

        editLink: {
            text: 'Suggest changes to this page',
            pattern: 'https://github.com/maoosi/prisma-appsync/edit/main/docs/:path',
        },

        socialLinks: [{ icon: 'github', link: 'https://github.com/maoosi/prisma-appsync' }],

        footer: {
            message: 'Released under the BSD 2-Clause License.',
            copyright: 'Copyright © 2021-present Sylvain Simao',
        },

        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Config', link: '/config/' },
            {
                text: 'Links',
                items: [
                    {
                        text: 'Changelog',
                        link: 'https://github.com/maoosi/prisma-appsync/blob/main/CHANGELOG.md',
                    },
                ],
            },
        ],

        sidebar: {
            '/guide/': [
                {
                    text: 'Guide',
                    items: [
                        {
                            text: 'Why Vite',
                            link: '/guide/concept',
                        },
                        {
                            text: 'Getting Started',
                            link: '/guide/',
                        },
                    ],
                },
                {
                    text: 'APIs',
                    items: [
                        {
                            text: 'Plugin API',
                            link: '/guide/api-plugin',
                        },
                        {
                            text: 'HMR API',
                            link: '/guide/api-hmr',
                        },
                        {
                            text: 'JavaScript API',
                            link: '/guide/api-javascript',
                        },
                        {
                            text: 'Config Reference',
                            link: '/config/',
                        },
                    ],
                },
            ],
        },
    },
})
