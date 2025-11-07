# Generator Development

## Idempotent Generator Checklist

When creating a new generator, it is important to ensure that it is idempotent. An idempotent generator can be run multiple times without changing the result beyond the initial application. This is important for ensuring that generators are predictable and that they don't cause unexpected side effects.

To ensure that your generator is idempotent, please follow these steps:

1.  **Wrap your generator with `withIdempotency`:** The `withIdempotency` wrapper will ensure that `formatFiles` is always called, which will make your generator's output deterministic.

2.  **Use `ensureIdempotentWrite` for all file operations:** The `ensureIdempotentWrite` function will ensure that you don't overwrite existing files without checking their content. A typical usage pattern looks like this:

    ```ts
    import { ensureIdempotentWrite } from "../../src/generators/utils/idempotency";

    try {
        ensureIdempotentWrite(tree, targetPath, templateContent, {
            merge: true,
            preserveMarkers: ["// <example:start>", "// <example:end>"],
        });
        // The helper skips the write when the normalized content is unchanged.
    } catch (error) {
        // Surface conflicts or IO errors so tests can fail fast.
        logger.error(`Unable to update ${targetPath}`, error);
        throw error;
    }
    ```

    When the content hasn't changed, the call is a no-op; if a write occurs (for example after merging preserved regions), handle any thrown errors the same way you would for a normal `tree.write`.

3.  **Add a double-run test to the regression suite:** The double-run test will run your generator twice and assert that there are no changes after the second run. This will provide an additional layer of testing to ensure that your generator is idempotent.

4.  **Verify with `just test-generators`:** The `just test-generators` command will run all the generator-related tests, including the double-run tests.

## Failure Remediation

If your generator is not idempotent, you will see a test failure in the double-run test. The test will fail with a message similar to this:

```
FAIL tests/generators/idempotency.test.ts
  ● Generator idempotency › my-generator generator should be idempotent

    expect(received).toEqual(expected) // deep equality

    - Expected
    + Received

      Object {
        "apps/my-generator/src/index.ts": "...",
      }
```

This message indicates that the `apps/my-generator/src/index.ts` file was changed after the second run of the generator. To fix this, you will need to debug your generator to determine why it is not idempotent.

### Common causes of non-idempotency

-   **Timestamp or version stamping:** Avoid `Date.now()` or commit hashes; inject fixed timestamps from context or strip them entirely.
-   **Random identifiers:** Seed randomness with a deterministic value (e.g., generator options) or remove it so the same inputs always produce the same outputs.
-   **Unsorted filesystem reads:** Always sort directory listings before writing aggregate files so order does not depend on the OS.
-   **Environment or CWD leakage:** Read required env vars once and default to explicit values; avoid using the caller’s working directory implicitly.
-   **Whitespace/formatting drift:** Normalize line endings and run `formatFiles` so formatting tools generate the same output every time.
-   **Async race conditions:** Await all asynchronous writes and avoid mutating shared state from parallel promises; serialize writes when order matters.
