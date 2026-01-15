import { describe, it, expect } from 'vitest';
import {
  fiberId,
  hookId,
  effectId,
  valueId,
  fieldAnchorId,
  edgeId,
} from '../../src/features/internals-viz/domain/stableId';

describe('stableId helpers', () => {
  it('fiberId is deterministic', () => {
    expect(fiberId()).toBe('fiber');
    expect(fiberId()).toBe(fiberId());
  });

  it('hookId is deterministic for same index', () => {
    expect(hookId(0)).toBe('hook-0');
    expect(hookId(3)).toBe('hook-3');
    expect(hookId(3)).toBe(hookId(3));
  });

  it('effectId is deterministic for same hookIndex', () => {
    expect(effectId(1)).toBe('effect-1');
    expect(effectId(1)).toBe(effectId(1));
  });

  it('valueId is deterministic for same parent + key', () => {
    expect(valueId('hook-0', 'memoizedState')).toBe('hook-0:val:memoizedState');
    expect(valueId('hook-0', 'memoizedState')).toBe(
      valueId('hook-0', 'memoizedState'),
    );
  });

  it('fieldAnchorId is deterministic', () => {
    expect(fieldAnchorId('hook-0', 'next')).toBe('hook-0:anchor:next');
  });

  it('edgeId is deterministic', () => {
    expect(edgeId('fiber', 'hook-0')).toBe('edge:fiber->hook-0');
  });
});

