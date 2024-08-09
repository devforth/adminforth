import { admin } from './index.js';

await admin.bundleNow({ hotReload: false});
console.log('Bundling AdminForth done.');