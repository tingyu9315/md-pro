#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generate() {
  const projectRoot = resolve(__dirname, '..');
  const srcSvgPath = resolve(projectRoot, 'assets', 'icon.svg');
  const smallSvgPath = resolve(projectRoot, 'assets', 'icon-small.svg');
  const sizes = [16, 48, 128];

  await readFile(srcSvgPath, 'utf8');
  await readFile(smallSvgPath, 'utf8');

  const tasks = sizes.map(async (size) => {
    const source = size < 64 ? smallSvgPath : srcSvgPath;
    const out = resolve(projectRoot, 'assets', `icon-${size}.png`);
    const buf = await sharp(source)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(out, buf);
    return out;
  });

  const outputs = await Promise.all(tasks);
  console.log('Generated icons:', outputs.map((p) => p.replace(projectRoot + '/', '')).join(', '));
}

generate().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

