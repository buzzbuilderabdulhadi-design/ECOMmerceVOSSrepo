import { describe, it, expect, vi } from 'vitest';
import { authorizeAdmin } from './auth.middleware';

describe('auth.middleware.authorizeAdmin', () => {
  it('allows ADMIN role', () => {
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    const req: any = { user: { userId: 'u1', role: 'ADMIN' }, originalUrl: '/admin/media/upload' };
    authorizeAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects non-ADMIN role with 403', () => {
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    const req: any = { user: { userId: 'u2', role: 'CUSTOMER' }, originalUrl: '/admin/media/upload' };
    authorizeAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects missing user with 403', () => {
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    const req: any = { user: undefined, originalUrl: '/admin/media/upload' };
    authorizeAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});