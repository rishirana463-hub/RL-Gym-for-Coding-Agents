import fs from 'node:fs';
import path from 'node:path';
import { initial } from './engine.mjs';

export function openStore(directory) {
  fs.mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, 'stockroom.json');
  return {
    load: () => fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : initial(),
    persist(next) {
      const temporary = path.join(directory, 'stockroom.tmp');
      const fd = fs.openSync(temporary, 'w', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify(next)); fs.fsyncSync(fd); }
      finally { fs.closeSync(fd); }
      fs.renameSync(temporary, filename);
      if (process.platform !== 'win32') {
        const dirfd = fs.openSync(directory, 'r');
        try { fs.fsyncSync(dirfd); } finally { fs.closeSync(dirfd); }
      }
    }
  };
}
