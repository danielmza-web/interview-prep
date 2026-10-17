import fs from 'node:fs';
import path from 'node:path';
const forbidden=[/danielmza1@gmail\.com/i,/NV36/i,/Model precision:\s*89/i,/Manager Only Performance/i,/secret.?team/i,/Senior Engineering Technician in Vision Automation/i,/sb_secret_[a-zA-Z0-9]+/];
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const publicFiles=walk('dist');
for(const file of publicFiles){const body=fs.readFileSync(file,'utf8');for(const re of forbidden)if(re.test(body))throw Error(`Private content or privileged credential in ${file}`);}
if(publicFiles.some(f=>f.endsWith('.map')||f.endsWith('.json')))throw Error('Unexpected source map or data export in public build.');
console.log(`Public build checked: ${publicFiles.length} application files; no private seed or privileged credential.`);
