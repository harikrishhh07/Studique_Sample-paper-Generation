const fs = require('fs');

// Read CSV
const csv = fs.readFileSync('public/data/resources.csv', 'utf-8');
const lines = csv.split('\n');
const header = lines[0];

// Month order for PYQs
const monthOrder = {
  'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUNE': 6, 'JULY': 7,
  'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
};

// Sort PPTs - Units first (in order), then other items alphabetically
function sortPPTs(items) {
  if (!items || items.length === 0) return [];
  
  const unitItems = [];
  const otherItems = [];
  
  items.forEach(item => {
    const name = item.split('|')[0].trim();
    // Match Unit X, Unit X.Y, Unit X-Y, Unit X and Y, etc.
    const unitMatch = name.match(/^Unit\s*(\d+)(?:[.\-](\d+))?/i);
    if (unitMatch) {
      const mainUnit = parseInt(unitMatch[1]);
      const subUnit = unitMatch[2] ? parseInt(unitMatch[2]) : 0;
      unitItems.push({ item, mainUnit, subUnit, name });
    } else {
      otherItems.push({ item, name });
    }
  });
  
  // Sort units by number, then sub-unit
  unitItems.sort((a, b) => {
    if (a.mainUnit !== b.mainUnit) return a.mainUnit - b.mainUnit;
    return a.subUnit - b.subUnit;
  });
  
  // Sort other items alphabetically
  otherItems.sort((a, b) => a.name.localeCompare(b.name));
  
  return [...unitItems.map(u => u.item), ...otherItems.map(o => o.item)];
}

// Sort PYQs - chronologically (oldest to newest)
function sortPYQs(items) {
  if (!items || items.length === 0) return [];
  
  const pyqItems = [];
  const otherItems = [];
  
  items.forEach(item => {
    const name = item.split('|')[0].trim();
    // Match year_month pattern like 2023_MAY, 2024_NOV, 2023_May
    const match = name.match(/^(\d{4})_([A-Za-z]+)/i);
    if (match) {
      const year = parseInt(match[1]);
      const monthStr = match[2].toUpperCase();
      const month = monthOrder[monthStr] || 0;
      pyqItems.push({ item, year, month, name });
    } else {
      otherItems.push({ item, name });
    }
  });
  
  // Sort chronologically (oldest to newest)
  pyqItems.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  // Sort other items alphabetically
  otherItems.sort((a, b) => a.name.localeCompare(b.name));
  
  return [...pyqItems.map(p => p.item), ...otherItems.map(o => o.item)];
}

// Parse a cell that may contain comma-separated items within quotes
function parseCell(cell) {
  if (!cell || cell === '""' || cell === '') return [];
  // Remove surrounding quotes if present
  cell = cell.replace(/^"|"$/g, '');
  if (!cell) return [];
  // Split by comma
  return cell.split(',').map(s => s.trim()).filter(s => s);
}

// Join items back
function joinItems(items) {
  if (!items || items.length === 0) return '';
  return items.join(',');
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Process each line
const newLines = [header];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  const fields = parseCSVLine(line);
  if (fields.length < 3) {
    newLines.push(line);
    continue;
  }
  
  const [semester, subject, ppts, pyqs, syllabus, channelName, playlistLink] = fields;
  
  // Parse and sort PPTs
  const pptItems = parseCell(ppts);
  const sortedPPTs = sortPPTs(pptItems);
  
  // Parse and sort PYQs
  const pyqItems = parseCell(pyqs);
  const sortedPYQs = sortPYQs(pyqItems);
  
  // Keep syllabus as is (parse and rejoin to normalize)
  const syllabusItems = parseCell(syllabus);
  
  // Reconstruct the line
  const newPPTs = sortedPPTs.length > 0 ? '"' + joinItems(sortedPPTs) + '"' : '';
  const newPYQs = sortedPYQs.length > 0 ? '"' + joinItems(sortedPYQs) + '"' : '';
  const newSyllabus = syllabusItems.length > 0 ? '"' + joinItems(syllabusItems) + '"' : (syllabus || '');
  
  const newLine = [
    semester,
    subject,
    newPPTs,
    newPYQs,
    newSyllabus,
    channelName || '',
    playlistLink || ''
  ].join(',');
  
  newLines.push(newLine);
}

// Write back
fs.writeFileSync('public/data/resources.csv', newLines.join('\n'));
console.log('CSV sorted successfully!');

// Show sample of sorted data
const sampleSubjects = ['Philosophy of Engineering', 'Calculus and Linear Algebra', 'Biology', 'Data Structures and Algorithms'];
sampleSubjects.forEach(subj => {
  const line = newLines.find(l => l.includes(subj));
  if (line) {
    console.log('\n--- ' + subj + ' ---');
    const fields = parseCSVLine(line);
    console.log('PPTs order:', parseCell(fields[2]).map(p => p.split('|')[0]).join(', '));
    console.log('PYQs order:', parseCell(fields[3]).map(p => p.split('|')[0]).join(', '));
  }
});
