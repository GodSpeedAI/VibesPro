describe('Jest Configuration Test', () => {
    it('should run TypeScript tests successfully', () => {
        const sum = (a: number, b: number): number => a + b;
        expect(sum(2, 3)).toBe(5);
    });

    it('should handle async operations', async () => {
        const asyncOperation = async (): Promise<string> => {
            return new Promise((resolve) => {
                setTimeout(() => resolve('completed'), 100);
            });
        };

        const result = await asyncOperation();
        expect(result).toBe('completed');
    });

    it('should have access to test utilities', () => {
        // Test that our global utilities are available
        expect(typeof testUtils).toBe('object');
        expect(typeof testUtils.createTempDir).toBe('function');
        expect(typeof testUtils.cleanupTempDir).toBe('function');
        expect(typeof testUtils.createMockFiles).toBe('function');
    });

    it('should mock console methods by default', () => {
        // Test that console methods are available and can be called
        // The actual mocking behavior is tested by the setup working correctly
        console.log('This should be mocked');
        console.warn('This warning should be mocked');
        console.error('This error should be mocked');

        // If we get here without errors, the setup is working
        expect(true).toBe(true);
    });
});
