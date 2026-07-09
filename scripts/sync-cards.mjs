#!/usr/bin/env node

// sync-cards.mjs
// Sincroniza shared/ui/cards/ -> apps/*/public/shared/cards/
// Se ejecuta como prebuild para evitar releases con codigo viejo.
// Uso: node scripts/sync-cards.mjs

import { cp, readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE = join(ROOT, 'shared', 'ui', 'cards');
const TARGETS = [
  join(ROOT, 'apps', 'android-new', 'public', 'shared', 'cards'),
  join(ROOT, 'apps', 'app-ios', 'public', 'shared', 'cards'),
];

async function sync() {
  const files = await readdir(SOURCE);
  console.log('[sync-cards] Source:', SOURCE);
  console.log('[sync-cards] Archivos:', files.join(', '));

  for (const target of TARGETS) {
    await mkdir(target, { recursive: true });
    for (const file of files) {
      const src = join(SOURCE, file);
      const dst = join(target, file);
      await cp(src, dst, { force: true });
    }
    console.log('[sync-cards] OK:', target);
  }

  console.log('[sync-cards] Listo.');
}

sync().catch((err) => {
  console.error('[sync-cards] Error:', err.message);
  process.exit(1);
});
