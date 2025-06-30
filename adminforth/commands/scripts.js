const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process'); 
const spaPath = path.join(__dirname, 'dist', 'spa');

if (fs.existsSync(spaPath)){ 
    console.log('Installing SPA dependencies...');
    execSync('npm ci', { cwd: spaPath, stdio: 'inherit' });
    console.log('Installed spa dependencies');
}