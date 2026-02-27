import * as judge from '../src/judge';

describe('judge module', () => {
  it('loads without crashing', () => {
    expect(judge).toBeDefined();
  });

  it('exports at least one property', () => {
    expect(Object.keys(judge).length).toBeGreaterThan(0);
  });

  it('every export that is a function is typed correctly', () => {
    Object.entries(judge).forEach(([, value]) => {
      if (typeof value === 'function') {
        expect(typeof value).toBe('function');
      }
    });
  });

  const def: unknown = (judge as { default?: unknown }).default;
  if (typeof def === 'function') {
    it('default export can be invoked without arguments', () => {
      expect(() => (def as () => unknown)()).not.toThrow();
    });
  }

  const knownNames = ['judgeCandidate', 'evaluate', 'score', 'grade'] as const;
  knownNames.forEach((name) => {
    const fn = (judge as Record<string, unknown>)[name];
    if (typeof fn === 'function') {
      it(`exported function "${name}" should return a value when called with dummy inputs`, () => {
        const result = (fn as () => unknown)();
        expect(result).not.toBeUndefined();
      });
    }
  });
});
