#!/usr/bin/env zx

// set DATABASE_URL env variable to docker instance
process.env.DATABASE_URL = "postgresql://prisma:prisma@localhost:5433/tests"

// build local version of prisma-appsync
await $`concurrently --kill-others --names \"SRC,INTEGRATION\" -c \"bgBlue.black.bold,bgYellow.black.bold\" \"nodemon --watch 'src/**/*' -e ts --exec 'pnpm build && cd tests/integration && npx prisma generate'\" \"nodemon tests/integration/server.ts\"`
