# Concept

# Why Prisma-AppSync?

<aside>
👇 **4 reasons why you should consider using Prisma-AppSync**
</aside>

- Drastically improve development velocity by auto-generating the API from a single Prisma Schema file, yet still giving you the flexibility to customise everything you need. You can literally [build a fully working and secure GraphQL API in under 10 minutes](https://www.notion.so/Getting-started-dabad1a6e090469a8ca715d65caf73a8).
- Reduces the maintenance burden of managing your own GraphQL Server and API Layer by using fully managed GraphQL and Serverless. Instead, you can fully focus on building your core business logic.
- Leverage all the features offered by AWS AppSync, including multiple data-sources, real-time subscriptions, offline capabilities, queries caching, advanced multi-authorizations patterns, high availability and scalability.
- Benefits from the same developer experience Prisma offers, and get access the ever growing open-source community and ecosystem. Prisma-AppSync also comes with [Premium support](https://www.notion.so/Support-c28dfec29ee446558d2312cebf538ed5) for whoever needs it.

# Under the hood

**Prisma-AppSync** is built around two major parts:

- **Prisma-AppSync Generator**, who's role is to parse the `schema.prisma` file, generate the Client, generate files for AWS AppSync (Schema + Resolver mapping settings), and generate the API documentation.
- **Prisma-AppSync Client**, a TypeScript client (think of it as Prisma Client on steroids 💪) ready to use within the API resolver function. Capable to handle CRUD operations with a single line of code, it also give access to advanced features for extending and customising the API.