# Generator Development

## Idempotent Generator Checklist

When creating a new generator, it is important to ensure that it is idempotent. An idempotent generator can be run multiple times without changing the result beyond the initial application. This is important for ensuring that generators are predictable and that they don't cause unexpected side effects.

To ensure that your generator is idempotent, please follow these steps:

1.  **Wrap your generator with `withIdempotency`:** The `withIdempotency` wrapper will ensure that `formatFiles` is always called, which will make your generator's output deterministic.

2.  **Use `ensureIdempotentWrite` for all file operations:** The `ensureIdempotentWrite` function will ensure that you don't overwrite existing files without checking their content.

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
