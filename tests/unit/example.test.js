// Minimal example unit test using Jest

// Example function under test (inline for demo)
function add(a, b) {
  return a + b;
}

describe('Example Tests', function () {
  it('should add two numbers correctly', function () {
    expect(add(2, 3)).toBe(5);
  });

  it('should handle edge cases', function () {
    expect(add(-1, 1)).toBe(0);
  });
});
