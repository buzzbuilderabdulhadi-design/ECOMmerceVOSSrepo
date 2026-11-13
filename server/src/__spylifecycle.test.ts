import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

describe('spy lifecycle', () => {
  const spy = vi.spyOn(fs.promises, 'unlink');
  beforeEach(() => {
    vi.resetAllMocks();
    spy.mockResolvedValue(undefined as never);
  });

  it('first', () => {
    spy.mockResolvedValue(undefined as never);
    expect(typeof spy.mockResolvedValue).toBe('function');
    expect(spy.getCalls().length).toBe(0);
  });

  it('second', () => {
    expect(typeof spy.mockResolvedValue).toBe('function');
  });
});