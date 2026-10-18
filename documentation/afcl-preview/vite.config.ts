import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StylesGenerator } from '../../adminforth/modules/styleGenerator.js';

// Builds static/afcl-preview: a page which renders one AFCL example of the docs, picked by the URL hash.
// Docs embed it with <AfclPreview id="...">, see src/components/AfclPreview.

const previewDir = fileURLToPath(new URL('.', import.meta.url));
const docsDir = path.join(previewDir, '../docs');
const examplesDir = path.join(previewDir, 'examples');
const spaDir = path.join(previewDir, '../../adminforth/spa');
const spaSrc = path.join(spaDir, 'src');
const afclDir = path.join(spaSrc, 'afcl');
const stubs = path.join(previewDir, 'stubs.ts');

const PREVIEW_RE = /<AfclPreview id="([^"]+)"[^>]*>([\s\S]*?)<\/AfclPreview>/g;
const CODE_BLOCK_RE = /```(\w+)[^\n]*\n([\s\S]*?)```/g;
const DIFF_MARKER_RE = /^\s*\/\/\s*diff-(add|remove)\s*$/;
const AFCL_IMPORT_RE = /^import \{([^}]+)\} from '@\/afcl';?$/gm;
const COMPONENT_TAG_RE = /<([A-Z]\w*)/g;

// code blocks may show a change with //diff-add and //diff-remove lines, the example renders the result
function applyDiff(code: string) {
  const lines: string[] = [];
  let skipNext = false;
  for (const line of code.split('\n')) {
    const marker = line.match(DIFF_MARKER_RE);
    if (marker) {
      skipNext = marker[1] === 'remove';
    } else if (skipNext) {
      skipNext = false;
    } else {
      lines.push(line);
    }
  }
  return lines.join('\n');
}

// every <AfclPreview> of the docs becomes an SFC: its html code blocks form the template, other blocks the script
// nothing is registered globally, an example imports its components from '@/afcl' like an app does. The SFC takes
// each of them from its own file, so an iframe loads only these components and not all of AFCL
function docsExamples(): Plugin {
  return {
    name: 'afcl-docs-examples',
    buildStart() {
      fs.rmSync(examplesDir, { recursive: true, force: true });
      fs.mkdirSync(examplesDir);
      const afclComponents = new Set(fs.readdirSync(afclDir).filter((file) => file.endsWith('.vue')).map((file) => path.basename(file, '.vue')));
      const mdFiles = fs.readdirSync(docsDir, { recursive: true, encoding: 'utf-8' }).filter((file) => file.endsWith('.md'));
      for (const file of mdFiles) {
        for (const [, id, body] of fs.readFileSync(path.join(docsDir, file), 'utf-8').matchAll(PREVIEW_RE)) {
          const blocks = [...body.matchAll(CODE_BLOCK_RE)];
          const code = (html: boolean) => blocks.filter(([, lang]) => (lang === 'html') === html).map(([, , src]) => applyDiff(src)).join('\n');
          const template = code(true);
          const imported: string[] = [];
          const script = code(false).replace(AFCL_IMPORT_RE, (_, names: string) => {
            imported.push(...names.split(',').map((name) => name.trim()));
            return '';
          });
          const notImported = [...template.matchAll(COMPONENT_TAG_RE)].map(([, name]) => name).find((name) => afclComponents.has(name) && !imported.includes(name));
          if (notImported) {
            this.error(`AFCL example "${id}" in ${file} uses <${notImported}> but does not import it from '@/afcl'`);
          }
          const imports = imported.map((name) => `import ${name} from '@/afcl/${name}.vue';\n`).join('');
          // 'wx' fails on a second example with the same id
          fs.writeFileSync(path.join(examplesDir, `${id}.vue`), `<script setup lang="ts">\n${imports}${script}</script>\n\n<template>\n${template}</template>\n`, { flag: 'wx' });
        }
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [docsExamples(), vue()],
  resolve: {
    alias: [
      // the core store and frontend API bring the router and API client along, previews get stand-ins
      { find: /^.*\/stores\/core$/, replacement: stubs },
      { find: '@/adminforth', replacement: stubs },
      { find: '@', replacement: spaSrc },
    ],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          // flowbite JS (datepicker, tooltip) adds its own classes, the SPA scans it as well
          content: [`${spaSrc}/{afcl,components}/**/*.{vue,ts}`, `${spaDir}/node_modules/flowbite/**/*.js`, `${previewDir}/{index.html,main.ts,examples/*.vue}`],
          darkMode: 'class',
          theme: { extend: new StylesGenerator({}).mergeStyles() },
        }),
        autoprefixer(),
      ],
    },
  },
  build: {
    outDir: '../static/afcl-preview',
    emptyOutDir: true,
  },
});
