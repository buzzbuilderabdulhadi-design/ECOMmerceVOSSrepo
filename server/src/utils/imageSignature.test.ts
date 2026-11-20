import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { assertImageSignature } from './imageSignature';

async function withTempFile(bytes: Buffer, run: (filePath: string) => Promise<void>) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'zoya-signature-'));
  const filePath = path.join(dir, 'upload');
  await fs.promises.writeFile(filePath, bytes);
  try {
    await run(filePath);
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
}

describe('assertImageSignature', () => {
  it('accepts a valid PNG signature', async () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    await withTempFile(bytes, async (filePath) => {
      await expect(assertImageSignature(filePath, 'image/png')).resolves.toBeUndefined();
    });
  });

  it('accepts a valid WebP signature', async () => {
    const bytes = Buffer.from('RIFF0000WEBPVP8 ');
    await withTempFile(bytes, async (filePath) => {
      await expect(assertImageSignature(filePath, 'image/webp')).resolves.toBeUndefined();
    });
  });

  it('rejects a spoofed file', async () => {
    const bytes = Buffer.from('not an image at all');
    await withTempFile(bytes, async (filePath) => {
      await expect(assertImageSignature(filePath, 'image/jpeg')).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
