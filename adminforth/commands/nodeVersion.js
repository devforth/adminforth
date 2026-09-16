export const SUPPORTED_NODE_VERSIONS = '22.12+, 24, or 26';

export function isNodeVersionSupported(version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number);
  return (major === 22 && minor >= 12) || major === 24 || major === 26;
}

export function checkNodeVersion(version = process.versions.node) {
  if (!isNodeVersionSupported(version)) {
    throw new Error(
      `AdminForth does not support Node.js ${version}. ` +
      `Please use Node.js ${SUPPORTED_NODE_VERSIONS}. Node.js 20 and 21 are no longer supported.`
    );
  }
}
