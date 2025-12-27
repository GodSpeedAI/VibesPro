# API Mocking Port

This port defines the contract for setting up the API mocking capability.

## Interface

```typescript
interface MockingService {
  /**
   * Initialize the mocking infrastructure.
   * Checks dependencies and creates shared fixtures.
   */
  init(): Promise<InitResult>;

  /**
   * Generate an example test case demonstrating usage.
   */
  createExample(): Promise<FileCreationResult>;
}

interface InitResult {
  dependencyChecked: boolean;
  fixtureCreated: boolean;
}

interface FileCreationResult {
  path: string;
  created: boolean;
}
```
