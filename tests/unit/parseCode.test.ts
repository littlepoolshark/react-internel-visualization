import { describe, it, expect } from 'vitest';
import { parseCode } from '../../src/features/internals-viz/parser/parseCode';

describe('parseCode', () => {
  it('returns success for valid TSX code', () => {
    const code = `const App = () => <div />;`;
    const result = parseCode(code);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.ast.type).toBe('File');
    }
  });

  it('returns error for syntax error with user-facing message', () => {
    const code = `const App = ( => <div />;`; // missing )
    const result = parseCode(code);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain('语法错误');
    }
  });

  it('error result does not include ast', () => {
    const code = `!!!`;
    const result = parseCode(code);
    expect(result.success).toBe(false);
    expect((result as { ast?: unknown }).ast).toBeUndefined();
  });
});

