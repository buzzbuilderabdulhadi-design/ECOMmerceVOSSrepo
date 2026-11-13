import { describe, it, expect, vi } from 'vitest';

let factoryRan = false;

vi.mock('fs', () => {
  factoryRan = true;
  return {
    promises: {
      unlink: vi.fn(),
    },
  };
});

import fs from 'fs';

describe('factory probe', () => {
  it('ran', () => {
    console.log('factory ran:', factoryRan);
    console.log('unlink type:', typeof fs.promises?.unlink);
    expect(true).toBe(true);
  });
});