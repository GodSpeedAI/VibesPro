# Shared Web Assets

Framework-agnostic utilities for React applications (Next.js, Remix, Expo).

## Features

-   **API Client**: Type-safe HTTP client with error handling
-   **Validation Schemas**: Zod schemas for data validation
-   **Environment Config**: Unified env variable access across frameworks
-   **Error Handling**: Centralized error handling utilities

## Usage

### Next.js (App Router)

```typescript
import { ApiClient, env } from "@vibes-pro/shared-web";

export default async function Page() {
    const client = new ApiClient({ baseUrl: env.API_URL });
    const data = await client.get("/api/users");
    return <div>{/* render data */}</div>;
}
```

### Next.js (Pages Router)

```typescript
import { ApiClient, env } from "@vibes-pro/shared-web";

export async function getServerSideProps() {
    const client = new ApiClient({ baseUrl: env.API_URL });
    const data = await client.get("/api/users");
    return { props: { data } };
}
```

### Remix

```typescript
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { ApiClient, env } from "@vibes-pro/shared-web";

export async function loader({ request }: LoaderFunctionArgs) {
    const client = new ApiClient({ baseUrl: env.API_URL });
    const data = await client.get("/api/users");
    return json({ data });
}
```

### Expo

```typescript
import { useEffect, useState } from "react";
import { ApiClient, env } from "@vibes-pro/shared-web";

export default function App() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const client = new ApiClient({ baseUrl: env.API_URL });
        client.get("/api/users").then(setData);
    }, []);

    return <View>{/* render data */}</View>;
}
```

## Validation

```typescript
import { UserSchema, validate } from "@vibes-pro/shared-web";

const user = validate.user(data); // Throws if invalid
const result = safeParse.user(data); // Returns { success, data, error }
```

## Specifications

-   DEV-ADR-028: Universal React Generator
-   DEV-PRD-029: Framework-specific scaffolds
-   DEV-SDS-028: Shared assets strategy
