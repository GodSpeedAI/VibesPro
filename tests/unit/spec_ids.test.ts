import * as ids from '../../tools/spec/ids';

describe('Spec IDs Tests', () => {
  it('should extract IDs from text', () => {
    const sample = `PRD-001 DEV-PRD-010 ADR-002 DEV-SDS-003`;
    const res = ids.extractIdsFromText(sample, 's.md');

    type IdRecord = { id: string };
    const hasId = (x: unknown, id: string) => {
      if (x && typeof x === 'object' && 'id' in x) {
        return (x as IdRecord).id === id;
      }
      return false;
    };

    expect(res.find((x: unknown) => hasId(x, 'PRD-001'))).toBeTruthy();
    expect(res.find((x: unknown) => hasId(x, 'DEV-PRD-010'))).toBeTruthy();
    expect(res.find((x: unknown) => hasId(x, 'ADR-002'))).toBeTruthy();
    expect(res.find((x: unknown) => hasId(x, 'DEV-SDS-003'))).toBeTruthy();
  });

  it('should validate ID format', () => {
    expect(ids.validateIdFormat('PRD-123')).toBe(true);
    expect(ids.validateIdFormat('DEV-TS-9')).toBe(true);
    expect(ids.validateIdFormat('BAD-9')).toBe(false);
  });
});
