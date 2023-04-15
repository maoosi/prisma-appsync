import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Prisma-AppSync',
    description: 'GraphQL API Generator for AWS and ◭ Prisma',

    head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

    vue: {
        reactivityTransform: true,
    },

    lastUpdated: true,

    themeConfig: {
        logo: '/logo.svg',

        editLink: {
            text: 'Suggest changes to this page',
            pattern: 'https://github.com/maoosi/prisma-appsync/edit/main/docs/:path',
        },

        socialLinks: [{ icon: 'github', link: 'https://github.com/maoosi/prisma-appsync' }],

        lastUpdatedText: 'Updated Date',

        footer: {
            message: 'Released under the BSD 2-Clause License.',
            copyright: 'Copyright © 2021-present Sylvain Simao',
        },

        nav: [
            { text: 'Documentation', link: '/quick-start/getting-started' },
            { text: 'Changelog', link: '/changelog/1.0.0-rc.6' },
            {
                text: 'Links',
                items: [
                    {
                        text: 'Report a bug',
                        link: 'https://github.com/maoosi/prisma-appsync/issues',
                    },
                    {
                        text: 'Sponsor',
                        link: 'https://github.com/sponsors/maoosi',
                    },
                    {
                        text: 'Roadmap',
                        link: 'https://github.com/users/maoosi/projects/1',
                    },
                ],
            },
        ],

        sidebar: [
            {
                text: 'Quick start',
                items: [
                    { text: 'Getting started', link: '/quick-start/getting-started' },
                    { text: 'Installation', link: '/quick-start/installation' },
                    { text: 'Usage', link: '/quick-start/usage' },
                    { text: 'Deploy', link: '/quick-start/deploy' },
                ],
            },
            {
                text: 'Features',
                collapsible: true,
                collapsed: true,
                items: [
                    { text: 'Adding Hooks', link: '/features/hooks' },
                    { text: 'Custom resolvers', link: '/features/resolvers' },
                    { text: 'Tweaking GQL schema', link: '/features/gql-schema' },
                ],
            },
            {
                text: 'Security',
                collapsible: true,
                collapsed: true,
                items: [
                    { text: 'AppSync Authz', link: '/security/appsync-authz' },
                    { text: 'Shield (ACL rules)', link: '/security/shield-acl' },
                    { text: 'XSS sanitizer', link: '/security/xss-sanitizer' },
                    { text: 'Query depth', link: '/security/query-depth' },
                    { text: 'Rate limiter (DOS)', link: '/security/rate-limiter' },
                ],
            },
            {
                text: 'Contributing',
                collapsible: true,
                collapsed: true,
                items: [
                    { text: 'Contributions guide', link: '/contributing' },
                ],
            },
            {
                text: 'Changelog',
                collapsible: true,
                collapsed: true,
                items: [
                    { text: '(latest) 1.0.0-rc.6', link: '/changelog/1.0.0-rc.6' },
                    { text: '1.0.0-rc.5', link: '/changelog/1.0.0-rc.5' },
                    { text: '1.0.0-rc.4', link: '/changelog/1.0.0-rc.4' },
                    { text: '1.0.0-rc.3', link: '/changelog/1.0.0-rc.3' },
                    { text: '1.0.0-rc.2', link: '/changelog/1.0.0-rc.2' },
                    { text: '1.0.0-rc.1', link: '/changelog/1.0.0-rc.1' },
                ],
            },
        ],
    },
})
