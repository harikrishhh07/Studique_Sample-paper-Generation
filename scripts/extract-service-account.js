// scripts/extract-service-account.js
// Helper script to extract credentials from service-account.json
// Usage: node scripts/extract-service-account.js

const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ service-account.json not found in project root!');
  console.error('Please download your service account key from Google Cloud Console');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  console.log('\n✅ Service account credentials extracted!\n');
  console.log('Add these to your .env.local file:\n');
  console.log('─'.repeat(80));
  console.log(`GOOGLE_CLIENT_EMAIL=${serviceAccount.client_email}`);
  console.log(`GOOGLE_PRIVATE_KEY="${serviceAccount.private_key}"`);
  console.log('─'.repeat(80));
  console.log('\n📋 For AWS Amplify, add these as environment variables:');
  console.log('─'.repeat(80));
  console.log(`GOOGLE_CLIENT_EMAIL = ${serviceAccount.client_email}`);
  console.log(`GOOGLE_PRIVATE_KEY = ${serviceAccount.private_key.replace(/\n/g, '\\n')}`);
  console.log('─'.repeat(80));
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('1. Never commit service-account.json to git (already in .gitignore)');
  console.log('2. Never commit .env.local to git (already in .gitignore)');
  console.log('3. Keep these credentials secure and rotate them periodically');
  console.log('4. Delete service-account.json after copying credentials to .env.local\n');
  
} catch (error) {
  console.error('❌ Error reading service-account.json:', error.message);
  process.exit(1);
}
