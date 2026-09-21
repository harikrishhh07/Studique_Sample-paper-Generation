const fs = require('fs');
const csv = fs.readFileSync('public/data/resources.csv', 'utf-8');

const lines = csv.split('\n').slice(1); // skip header

// Parse CSV properly
function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuotes = !inQuotes;
    else if (line[i] === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += line[i];
    }
  }
  parts.push(current);
  return parts;
}

let pptCount = 0;
let pyqCount = 0;
let syllabusCount = 0;

lines.forEach(line => {
  if (!line.trim()) return;
  const parts = parseCSVLine(line);
  
  // PPTs is column 3 (index 2)
  if (parts[2]) {
    const matches = parts[2].match(/drive\.google\.com/g);
    if (matches) pptCount += matches.length;
  }
  
  // PYQs is column 4 (index 3)
  if (parts[3]) {
    const matches = parts[3].match(/drive\.google\.com/g);
    if (matches) pyqCount += matches.length;
  }
  
  // Syllabus is column 5 (index 4)
  if (parts[4]) {
    const matches = parts[4].match(/drive\.google\.com/g);
    if (matches) syllabusCount += matches.length;
  }
});

console.log('=== FILE COUNT ANALYSIS ===\n');
console.log('PPTs column:', pptCount, 'files');
console.log('  → These are likely PPT/PPTX files');
console.log('  → Merge NEEDS Google credentials to convert PPT→PDF\n');

console.log('PYQs column:', pyqCount, 'files');
console.log('  → These are likely PDF files (question papers)');
console.log('  → Merge SHOULD WORK (if files are public)\n');

console.log('Syllabus column:', syllabusCount, 'files');
console.log('  → These are likely PDF files');
console.log('  → Merge SHOULD WORK (if files are public)\n');

console.log('TOTAL:', pptCount + pyqCount + syllabusCount, 'files');
console.log('\n=== SUMMARY ===');
console.log('Files that NEED credentials (PPTs):', pptCount);
console.log('Files that MAY work without credentials (PYQs + Syllabus):', pyqCount + syllabusCount);
