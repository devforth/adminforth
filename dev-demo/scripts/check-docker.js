import { execSync } from 'node:child_process';

try {
  execSync('docker --version', { stdio: 'ignore' });
  console.log('✅ Docker is installed');
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch {
    console.error('❌ Docker is installed but not running');
    process.exit(1);
  }
  console.log('✅ Docker is Running');
} catch {
  console.error(
    '❌ Docker is not installed or not available in PATH.\n' +
    'Please install Docker: https://docs.docker.com/get-docker/'
  );
  process.exit(1);
}
