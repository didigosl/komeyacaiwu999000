import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const now = new Date();
const yyyy = String(now.getFullYear());
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const version = `v${yyyy}${mm}${dd}`;

await fs.writeFile(path.join(root, 'version.txt'), `${version}\n`, 'utf8');
process.stdout.write(`${version}\n`);
