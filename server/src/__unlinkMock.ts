import { vi } from 'vitest';

/** Shared mock fn so the controller and the test reference the same object. */
export const unlinkMock = vi.fn();