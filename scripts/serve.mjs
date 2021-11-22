#!/usr/bin/env zx

// set DATABASE_URL env variable to docker instance
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/tests'

// concurrently run a local GraphQL server + a watcher for Prisma-AppSync Client build
console.log(chalk.blue('Serve :: Watcher + Local server\n'))
await $`concurrently --kill-others --names "SRC,INTEGRATION" -c "bgBlue.black,bgYellow.black" "nodemon --watch 'packages/**/*' -e ts --exec 'pnpm build && cd tests/integration && npx prisma generate'" "nodemon tests/integration/server.ts"`
