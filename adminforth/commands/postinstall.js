import fs from 'fs';
import path from 'path';

import { execSync } from 'child_process'; 
import { afLogger } from '../modules/logger.js';

const spaPath = path.join(import.meta.dirname, 'dist', 'spa');


if (fs.existsSync(spaPath)){ 
    afLogger.info('Installing SPA dependencies...');
    execSync('npm ci', { cwd: spaPath, stdio: 'inherit' });
    afLogger.info('Installed spa dependencies');
} else {
    afLogger.warn('SPA dependencies not found');
    afLogger.warn(`current directory: ${import.meta.dirname}`);
}