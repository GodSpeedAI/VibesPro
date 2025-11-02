# Apps Directory

This directory contains application projects (web apps, APIs, CLIs, etc.).

Use Nx generators to create new applications:

```bash
# Next.js app
npx nx g @nx/next:app my-app

# Node API
npx nx g @nx/node:app my-api

# Or use the Just recipe
just ai-scaffold name=@nx/next:app
```

## Structure

Each app should follow hexagonal architecture principles, depending on the core library and other shared
libraries for business logic.

Apps contain:

-   User interface code (UI components, pages, routes)
-   API controllers and endpoints
-   CLI commands
-   Application-specific configuration
