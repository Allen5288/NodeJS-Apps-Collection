
# `1. Project Architecture Practices`

## ![✔] 1.1 Structure your solution by business components

### `📝 #updated`

**TL;DR:** The root of a system should contain folders or repositories that represent reasonably sized business modules. Each component represents a product domain (i.e., bounded context), like 'user-component', 'order-component', etc. Each component has its own API, logic, and logical database. What is the significant merit? With an autonomous component, every change is performed over a granular and smaller scope - the mental overload, development friction, and deployment fear are much smaller and better. As a result, developers can move much faster. This does not necessarily demand physical separation and can be achieved using a Monorepo or with a multi-repo

```bash
my-system
├─ apps (components)
│  ├─ orders
│  ├─ users
│  ├─ payments
├─ libraries (generic cross-component functionality)
│  ├─ logger
│  ├─ authenticator
```

**Otherwise:** when artifacts from various modules/topics are mixed together, there are great chances of a tightly-coupled 'spaghetti' system. For example, in an architecture where 'module-a controller' might call 'module-b service', there are no clear modularity borders - every code change might affect anything else. With this approach, developers who code new features struggle to realize the scope and impact of their change. Consequently, they fear breaking other modules, and each deployment becomes slower and riskier

🔗 [**Read More: structure by components**](./sections/breakintcomponents.md)

<br/><br/>

## ![✔] 1.2 Layer your components with 3-tiers, keep the web layer within its boundaries

### `📝 #updated`

**TL;DR:** Each component should contain 'layers' - a dedicated folder for common concerns: 'entry-point' where controller lives, 'domain' where the logic lives, and 'data-access'. The primary principle of the most popular architectures is to separate the technical concerns (e.g., HTTP, DB, etc) from the pure logic of the app so a developer can code more features without worrying about infrastructural concerns. Putting each concern in a dedicated folder, also known as the [3-Tier pattern](https://en.wikipedia.org/wiki/Multitier_architecture), is the _simplest_ way to meet this goal

```bash
my-system
├─ apps (components)
│  ├─ component-a
   │  ├─ entry-points
   │  │  ├─ api # controller comes here
   │  │  ├─ message-queue # message consumer comes here
   │  ├─ domain # features and flows: DTO, services, logic
   │  ├─ data-access # DB calls w/o ORM
```

**Otherwise:** It's often seen that developer pass web objects like request/response to functions in the domain/logic layer - this violates the separation principle and makes it harder to access later the logic code by other clients like testing code, scheduled jobs, message queues, etc

🔗 [**Read More: layer your app**](./sections/createlayers.md)

<br/><br/>

## ![✔] 1.3 Wrap common utilities as packages, consider publishing

**TL;DR:** Place all reusable modules in a dedicated folder, e.g., "libraries", and underneath each module in its own folder, e.g., "/libraries/logger". Make the module an independent package with its own package.json file to increase the module encapsulation, and allows future publishing to a repository. In a Monorepo setup, modules can be consumed by 'npm linking' to their physical paths, using ts-paths or by publishing and installing from a package manager repository like the npm registry

```bash
my-system
├─ apps (components)
  │  ├─ component-a
├─ libraries (generic cross-component functionality)
│  ├─ logger
│  │  ├─ package.json
│  │  ├─ src
│  │  │ ├─ index.js

```

**Otherwise:** Clients of a module might import and get coupled to internal functionality of a module. With a package.json at the root, one can set a package.json.main or package.json.exports to explicitly tell which files and functions are part of the public interface

🔗 [**Read More: Structure by feature**](./sections/wraputilities.md)

<br/><br/>

## ![✔] 1.4 Use environment aware, secure and hierarchical config

### `📝 #updated`

**TL;DR:** A flawless configuration setup should ensure (a) keys can be read from file AND from environment variable (b) secrets are kept outside committed code (c) config is hierarchical for easier findability (d) typing support (e) validation for failing fast (f) Specify default for each key. There are a few packages that can help tick most of those boxes like [convict](https://www.npmjs.com/package/convict), [env-var](https://github.com/evanshortiss/env-var), [zod](https://github.com/colinhacks/zod), and others

**Otherwise:** Consider a mandatory environment variable that wasn't provided. The app starts successfully and serve requests, some information is already persisted to DB. Then, it's realized that without this mandatory key the request can't complete, leaving the app in a dirty state

🔗 [**Read More: configuration best practices**](./sections/configguide.md)

<br/><br/>

## ![✔] 1.5 Consider all the consequences when choosing the main framework

### `🌟 #new`

**TL;DR:** When building apps and APIs, using a framework is mandatory. It's easy to overlook alternative frameworks or important considerations and then finally land on a sub optimal option. As of 2023/2024, we believe that these four frameworks are worth considering: [Nest.js](https://nestjs.com/), [Fastify](https://www.fastify.io/), [express](https://expressjs.com/), and [Koa](https://koajs.com/). Click read more below for a detailed pros/cons of each framework. Simplistically, we believe that Nest.js is the best match for teams who wish to go OOP and/or build large-scale apps that can't get partitioned into smaller _autonomous_ components. Fastify is our recommendation for apps with reasonably-sized components (e.g., Microservices) that are built around simple Node.js mechanics. Read our [full considerations guide here](./sections/projectstructre/choose-framework.md)

**Otherwise:** Due to the overwhelming amount of considerations, it's easy to make decisions based on partial information and compare apples with oranges. For example, it's believed that Fastify is a minimal web-server that should get compared with express only. In reality, it's a rich framework with many official plugins that cover many concerns

🔗 [**Read More: Choosing the right framework**](./sections/choose-framework.md)

## ![✔] 1.6 Use TypeScript sparingly and thoughtfully

### `🌟 #new`

**TL;DR:** Coding without type safety is no longer an option, TypeScript is the most popular option for this mission. Use it to define variables and functions return types. With that, it is also a double edge sword that can greatly _encourage_ complexity with its additional ~ 50 keywords and sophisticated features. Consider using it sparingly, mostly with simple types, and utilize advanced features only when a real need arises

**Otherwise:** [Researches](https://earlbarr.com/publications/typestudy.pdf) show that using TypeScript can help in detecting ~20% bugs earlier. Without it, also the developer experience in the IDE is intolerable. On the flip side, 80% of other bugs were not discovered using types. Consequently, typed syntax is valuable but limited. Only efficient tests can discover the whole spectrum of bugs, including type-related bugs. It might also defeat its purpose: sophisticated code features are likely to increase the code complexity, which by itself increases both the amount of bugs and the average bug fix time

🔗 [**Read More: TypeScript considerations**](./sections/typescript-considerations.md)

<br/><br/><br/>

<p align="right"><a href="#table-of-contents">⬆ Return to top</a></p>
