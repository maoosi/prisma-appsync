#!/usr/bin/env zx

process.env.FORCE_COLOR = 3
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/dev'

await $`npx prisma generate`

await $`docker-compose up -d`
await $`npx prisma db push --accept-data-loss`

await $`npx concurrently --kill-others --names "server,schema" -c "bgBlue.black,bgYellow.black" "npx nodemon -e ts --watch './**/*' --watch './.server/server.ts' ./.server/server.ts" "npx nodemon -e prisma,gql,yaml --watch './**/*' --exec 'npx prisma generate'"`