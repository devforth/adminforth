const [major] = process.versions.node.split('.').map(Number);

if (major < 20 || major > 24) {
  console.error(
    `❌ Node.js ${process.versions.node} detected.\n` +
    `Please use Node.js version 20, 21, 22, 23, or 24.`,
  );
  process.exit(1);
}

console.log(`✅ Node.js ${process.versions.node}`);
