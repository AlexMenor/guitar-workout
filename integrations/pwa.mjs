import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

/** @returns {import('astro').AstroIntegration} */
export default function pwa() {
  return {
    name: 'guitar-workout-pwa',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = [];
        async function walk(directory) {
          for (const entry of await readdir(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) await walk(path);
            else if (/\.(html|js|css|svg|png|webmanifest)$/.test(entry.name) && entry.name !== 'sw.js') files.push(path);
          }
        }
        await walk(root);
        files.sort();
        const template = await readFile(new URL('../scripts/service-worker.template.js', import.meta.url), 'utf8');
        const hash = createHash('sha256').update(template);
        const urls = [];
        for (const file of files) {
          const url = '/' + relative(root, file).split('\\').join('/');
          hash.update(url).update(await readFile(file));
          urls.push(url.endsWith('/index.html') ? url.slice(0, -10) : url);
        }
        const version = hash.digest('hex').slice(0, 16);
        await writeFile(join(root, 'sw.js'), template.replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(urls)));
        logger.info(`Offline cache: ${urls.length} files (${version})`);
      },
    },
  };
}
