export default {
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
            { text: 'Changelog', link: '/changelog/1.0.0' },
            { text: 'Support', link: '/support' },
            {
                text: 'Tools',
                items: [
                    {
                        text: 'AppSync GraphQL Schema Diff',
                        link: '/tools/appsync-gql-schema-diff',
                    },
                ],
            },
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
                items: [
                    { text: 'Lifecycle hooks', link: '/features/hooks' },
                    { text: 'Custom resolvers', link: '/features/resolvers' },
                    { text: 'Tweaking GQL schema', link: '/features/gql-schema' },
                ],
            },
            {
                text: 'Security',
                collapsible: true,
                items: [
                    { text: 'Authorization', link: '/security/appsync-authz' },
                    { text: 'Shield (ACL rules)', link: '/security/shield-acl' },
                    { text: 'XSS sanitizer', link: '/security/xss-sanitizer' },
                    { text: 'Query depth', link: '/security/query-depth' },
                    { text: 'Rate limiter (DOS)', link: '/security/rate-limiter' },
                ],
            },
            {
                text: 'Contributing',
                collapsible: true,
                items: [
                    { text: 'Contributions guide', link: '/contributing' },
                ],
            },
            {
                text: 'Changelog',
                collapsible: true,
                collapsed: true,
                items: [
                    { text: '(latest) v1.0.0', link: '/changelog/1.0.0' },
                    { text: 'Previous', link: '/changelog/' },
                ],
            },
        ],
    },
}