#!/usr/bin/env zx

process.env.FORCE_COLOR = 3
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/dev'

await $`npx prisma generate`

cd('./.server')
await $`docker-compose up -d`

cd('../')
await $`npx prisma db push --accept-data-loss`

await $`npx concurrently --kill-others --names "server,schema" -c "bgBlue.black,bgYellow.black" "npx nodemon -e ts --watch './**/*' --watch './.server/server.ts' --ignore './node_modules' --ignore '**/generated/**' ./.server/server.ts" "npx nodemon -e prisma,gql,yaml --watch './**/*' --ignore './node_modules' --ignore '**/generated/**' --exec 'npx prisma generate && echo \'Running a GraphQL API server at http://localhost:4000/graphql\'"`