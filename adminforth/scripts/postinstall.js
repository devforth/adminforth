import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nodeBinary = process.execPath;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const spaPath=path.join(__dirname,'dist','spa');

const pnpmPotentionalPath=path.join(nodeBinary,'..','pnpm');
const doesUserProjectHasPnpm = fs.existsSync(pnpmPotentionalPath)
console.log('doesUserProjectHasPnpm', doesUserProjectHasPnpm);
if (doesUserProjectHasPnpm) {
  if(fs.existsSync(spaPath) && !process.env.PNPM_INSTALL_SPA){
    process.env.PNPM_INSTALL_SPA=1;
    require('child_process').execSync('pnpm install --frozen-lockfile',{cwd:spaPath,stdio:'inherit'});
  }
} else {
  if(fs.existsSync(spaPath)){
    process.chdir(spaPath);
    require('child_process').execSync('npm ci',{stdio:'inherit'});
  }
}

console.log('installed spa dependencies');