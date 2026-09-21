import { isNodeVersionSupported, SUPPORTED_NODE_VERSIONS } from '../../adminforth/commands/nodeVersion.js';

if (!isNodeVersionSupported()) {
  console.error(
    `❌ Node.js ${process.versions.node} detected.\n` +
    `AdminForth does not support Node.js 20 or 21. Please use Node.js ${SUPPORTED_NODE_VERSIONS}.`,
  );
  process.exit(1);
}

console.log(`✅ Node.js ${process.versions.node}`);
