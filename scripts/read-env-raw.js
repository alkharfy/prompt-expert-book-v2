const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const line = content.split('\n').find(l => l.startsWith('KASHIER_SECRET_KEY'));
console.log('Line in file:', line);
console.log('Contains \\$: ', line.includes('\\$'));
