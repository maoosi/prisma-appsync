# 🦄 Concept

## 👉 Why Prisma-AppSync?

**4 reasons why you should consider using Prisma-AppSync:**

| Why? | How? |
|:------------- |:-------------|
| **Drastically improve development velocity** | By auto-generating the API from a single Prisma Schema file, yet still giving you the flexibility to customise everything you need. You can literally [build a fully working GraphQL API in under 10 minutes ↗](https://www.youtube.com/watch?v=k2tjpxC7mrQ). |
| **Reduces GraphQL maintenance burden** | By leveraging AWS AppSync fully managed GraphQL service and auto-generating the API Layer. Meaning you don't have to manage your own and you can fully focus on building your core business logic. |
| **Leverage all the features offered by AWS AppSync** | By working smoothly with AWS AppSync features like real-time subscriptions, offline capabilities, queries caching, advanced multi-authorizations patterns, high availability and scalability. |
| **Benefits from the same developer experience Prisma offers** | By using a fully typed TS Client API and accessing the ever growing open-source community and ecosystem around Prisma. |

## 👉 Under the hood

**Prisma-AppSync** is built around two major parts:

![](/prisma-appsync-diagram.png)

<table>
<tr><td width="800px">

### Prisma-AppSync [ Generator ]

Who's role is to parse your `schema.prisma` and generate a TS Client (to use within Lambda) along with the AWS AppSync config files required to run your GraphQL API (Schema + Resolver mapping).

</td></tr><tr><td>

### Prisma-AppSync [ Client ]

A TypeScript client (think of it as Prisma Client on steroids 💪) ready to use within Lambda (API resolver function for AWS AppSync).  Capable to handle CRUD operations with a single line of code, it also give access to advanced features for extending and customising your GraphQL API.

</td></tr>
</table>
