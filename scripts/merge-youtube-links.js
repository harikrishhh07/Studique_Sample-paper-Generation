const fs = require('fs');
const Papa = require('papaparse');

// Read both CSV files
const oldCsvPath = 'public/data/resources.csv';
const newCsvPath = 'public/resources-new.csv';
const outputPath = 'public/data/resources.csv';

console.log('Reading old CSV with YouTube links...');
const oldCsvContent = fs.readFileSync(oldCsvPath, 'utf-8');

console.log('Reading new CSV with CloudFront URLs...');
const newCsvContent = fs.readFileSync(newCsvPath, 'utf-8');

// Parse old CSV
const oldData = Papa.parse(oldCsvContent, { header: true, skipEmptyLines: true }).data;

// Parse new CSV
const newData = Papa.parse(newCsvContent, { header: true, skipEmptyLines: true }).data;

// Create a map of YouTube links by subject
// Key: "semester-subject", Value: { channelName, playlistLink }
const youtubeMap = new Map();

oldData.forEach(row => {
  const key = `${row.semester}-${row.subject}`;
  if (row.channelName || row.playlistLink) {
    youtubeMap.set(key, {
      channelName: row.channelName || '',
      playlistLink: row.playlistLink || ''
    });
  }
});

console.log(`Found ${youtubeMap.size} subjects with YouTube links`);

// Add YouTube columns to new data
const mergedData = newData.map(row => {
  // Convert "Sem 1" to "Semester 1" to match old format
  const semesterMatch = row.Semester.match(/Sem\s*(\d+)/);
  const semester = semesterMatch ? `Semester ${semesterMatch[1]}` : row.Semester;
  
  const key = `${semester}-${row.Subject}`;
  const youtubeData = youtubeMap.get(key);
  
  return {
    ...row,
    channelName: youtubeData?.channelName || '',
    playlistLink: youtubeData?.playlistLink || ''
  };
});

// Generate CSV with all columns
const csv = Papa.unparse(mergedData);

// Write merged CSV
fs.writeFileSync(outputPath, csv);

console.log('\n✅ Merge complete!');
console.log(`📄 Output: ${outputPath}`);
console.log(`📊 Total rows: ${mergedData.length}`);

// Count how many rows have YouTube data
const withYoutube = mergedData.filter(r => r.channelName || r.playlistLink).length;
console.log(`🎥 Rows with YouTube links: ${withYoutube}`);
