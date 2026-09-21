#!/usr/bin/env node

/**
 * Test script to verify that search engine crawlers can access protected pages
 * This simulates a Googlebot request to ensure SEO indexing works properly
 */

const https = require('https');
const http = require('http');

const testUrls = [
  'http://localhost:3000/',
  'http://localhost:3000/trackr',
  'http://localhost:3000/schedule',
  'http://localhost:3000/calcgpa',
  'http://localhost:3000/finder',
  'http://localhost:3000/mealmap',
  'http://localhost:3000/unitwise',
];

const testUrl = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    };

    protocol.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const isSuccess = res.statusCode === 200;
        const hasContent = data.length > 1000; // Basic check for actual content
  const hasTitle = /<title\b[^>]*>/i.test(data);
        
        resolve({
          url,
          statusCode: res.statusCode,
          isSuccess,
          hasContent,
          hasTitle,
          contentLength: data.length,
        });
      });
    }).on('error', (err) => {
      reject({ url, error: err.message });
    });
  });
};

async function runTests() {
  console.log('🤖 Testing crawler access to pages...\n');
  console.log('This simulates how Googlebot sees your pages.\n');
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      const result = await testUrl(url);
      results.push(result);
      
      const status = result.isSuccess ? '✅' : '❌';
      const pageName = url.split('/').pop() || 'home';
      
      console.log(`${status} ${pageName.padEnd(15)} | Status: ${result.statusCode} | Size: ${result.contentLength} bytes`);
      
      if (!result.isSuccess) {
        console.log(`   ⚠️  Page returned ${result.statusCode} - Google may not index this page`);
      }
      if (!result.hasTitle) {
        console.log(`   ⚠️  No <title> tag found - SEO may be impacted`);
      }
    } catch (error) {
      console.log(`❌ ${error.url} | Error: ${error.error}`);
      results.push({ ...error, isSuccess: false });
    }
  }
  
  console.log('\n' + '='.repeat(70));
  const successCount = results.filter(r => r.isSuccess).length;
  console.log(`\n📊 Results: ${successCount}/${results.length} pages accessible to crawlers`);
  
  if (successCount === results.length) {
    console.log('✅ All pages are crawler-friendly! Google can index your site.\n');
  } else {
    console.log('⚠️  Some pages may not be indexed by Google.\n');
  }
}

runTests().catch(console.error);
