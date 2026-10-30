import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Set these before importing tools which compute their temp/cache paths once.
const tmp = fileURLToPath(new URL('../.cache/tmp/', import.meta.url));
const browsers = fileURLToPath(new URL('../.cache/browsers/', import.meta.url));
await mkdir(tmp, { recursive: true });
await mkdir(browsers, { recursive: true });
process.env.TEMP = tmp;
process.env.TMP = tmp;
process.env.TMPDIR = tmp;
process.env.PLAYWRIGHT_BROWSERS_PATH = browsers;
