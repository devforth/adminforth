const [major] = process.versions.node.split('.').map(Number);

if (major < 20) {
  console.error(
    `❌ Node.js ${process.versions.node} detected.\n` +
    `Please install Node.js 20 or newer.`
  );
  process.exit(1);
}

console.log(`✅ Node.js ${process.versions.node}`);
