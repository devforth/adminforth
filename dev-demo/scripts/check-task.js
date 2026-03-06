import { execSync } from 'node:child_process';

try {
  execSync('task --version', { stdio: 'ignore' });
  console.log('✅ Taskfile is installed');
} catch {
  console.error(
    '❌ Taskfile is not installed or not available in PATH.\n' +
    'Please install Task: https://taskfile.dev/#/installation'
  );
  process.exit(1);
}