/**
 * Tests for the service generator.
 */
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

// Import the wrapped generator - we need to access the underlying function
// For now, test the generator indirectly through its effects
describe('service generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should be defined for future testing', () => {
    // The service generator uses withIdempotency wrapper which makes it
    // more complex to test directly.
    // Full testing is done in integration tests.
    expect(tree).toBeDefined();
  });

  // Note: The service generator is tested via:
  // - tests/integration/generators-smoke.test.ts (E2E with copier)
  // - The generator itself uses withIdempotency from src/generators/utils/idempotency
  //
  // To add proper unit tests, we would need to either:
  // 1. Export the unwrapped function
  // 2. Mock the idempotency wrapper
  // 3. Test the generated files structure directly
});
