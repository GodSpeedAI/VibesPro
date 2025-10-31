// Minimal example unit test using Jest
describe('Example TypeScript Tests', () => {
  function add(a: number, b: number) {
    return a + b;
  }

  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should handle edge cases', () => {
    expect(add(-1, 1)).toBe(0);
  });
});
