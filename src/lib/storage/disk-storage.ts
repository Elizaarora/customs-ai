import 'server-only';
import { mkdir, readFile as fsReadFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StorageDriver } from './types';

// Local disk — the dev driver. Never selected in production (see storage.ts).
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

export const diskStorage: StorageDriver = {
  async saveFile(bytes, relativePath) {
    const target = path.join(UPLOAD_ROOT, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    return relativePath;
  },

  async readFile(relativePath) {
    return fsReadFile(path.join(UPLOAD_ROOT, relativePath));
  },
};
