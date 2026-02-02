const [major] = process.versions.node.split('.').map(Number);

if (major < 20 || major > 22) {
  console.error(
    `❌ Node.js ${process.versions.node} detected.\n` +
    `Please use Node.js version 20, 21, or 22.`,
  );
  process.exit(1);
}

console.log(`✅ Node.js ${process.versions.node}`);
