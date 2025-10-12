import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'web', 'src', 'pages');

console.log('🔍 Checking for pages missing usePageTitle hook...\n');

const files = fs.readdirSync(pagesDir).filter(file => file.endsWith('.jsx'));

let missingPages = [];

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('usePageTitle')) {
    missingPages.push(file);
    console.log(`❌ Missing: ${file}`);
  } else {
    console.log(`✅ Has usePageTitle: ${file}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`Total pages: ${files.length}`);
console.log(`Pages with usePageTitle: ${files.length - missingPages.length}`);
console.log(`Missing pages: ${missingPages.length}`);

if (missingPages.length > 0) {
  console.log('\n🔧 Missing pages:');
  missingPages.forEach(page => console.log(`  - ${page}`));
} else {
  console.log('\n🎉 All pages have usePageTitle hook!');
}
