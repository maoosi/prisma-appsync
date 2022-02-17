#!/usr/bin/env zx

// build local version of Prisma-AppSync
import './docker.mjs'

// set DATABASE_URL env variable to docker instance
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/tests'

// concurrently run a local GraphQL server + a watcher for Prisma-AppSync Client build
console.log(chalk.blue('Serve :: Watcher + Local server\n'))
await $`concurrently --kill-others --names "SRC,E2E" -c "bgBlue.black,bgYellow.black" "nodemon --watch 'packages/**/*' --watch 'tests/e2e/prisma/schema.prisma' -e ts --exec 'pnpm build && cd tests/e2e && npx prisma generate'" "nodemon tests/e2e/server.ts"`
