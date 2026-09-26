const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const secretKey = process.env.KASHIER_SECRET_KEY;
const apiKey = process.env.KASHIER_API_KEY;
const mid = process.env.KASHIER_MERCHANT_ID;

console.log('--- DEBUG ENV ---');
console.log('API Key:', apiKey ? (apiKey.substring(0, 5) + '...' + apiKey.slice(-5)) : 'MISSING');
console.log('Secret Key Length:', secretKey ? secretKey.length : 0);
console.log('Secret Key Start:', secretKey ? secretKey.substring(0, 10) : 'MISSING');
console.log('Secret Key contains $: ', secretKey ? secretKey.includes('$') : 'N/A');
console.log('Merchant ID:', mid);
console.log('-----------------');

if (secretKey && secretKey.length < 50) {
    console.log('WARNING: Secret key seems too short! Possible variable expansion issue.');
}
