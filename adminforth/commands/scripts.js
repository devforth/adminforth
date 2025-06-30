import fs from 'fs';
import path from 'path';

import { execSync } from 'child_process'; 
const spaPath = path.join(import.meta.dirname, 'dist', 'spa');

if (fs.existsSync(spaPath)){ 
    console.log('Installing SPA dependencies...');
    execSync('npm ci', { cwd: spaPath, stdio: 'inherit' });
    console.log('Installed spa dependencies');
}