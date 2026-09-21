// Script to generate resources.csv from S3 bucket structure
// This lists all files in S3 and creates a CSV with CloudFront URLs

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configuration
const BUCKET_NAME = 'studique-resources';
const CLOUDFRONT_DOMAIN = 'di7f5btp4oe2y.cloudfront.net';
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'resources-new.csv');

// Initialize S
const s3 = new AWS.S3({
  region: 'ap-south-1', // Change to your bucket's region
});

async function listAllFiles() {
  console.log('Fetching files from S3...');
  const allFiles = [];
  let continuationToken = null;

  do {
    const params = {
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
    };

    const response = await s3.listObjectsV2(params).promise();
    
    // Filter only files (not folders)
    const files = response.Contents.filter(item => !item.Key.endsWith('/'));
    allFiles.push(...files);

    continuationToken = response.NextContinuationToken;
    console.log(`Fetched ${allFiles.length} files so far...`);
  } while (continuationToken);

  return allFiles;
}

function parseFileInfo(key) {
  // Parse path: Year X/Sem X/Subject/(PPTs|PYQs|Syllabus.pdf)
  const parts = key.split('/');
  
  if (parts.length < 3) {
    return null; // Skip invalid paths
  }

  const year = parts[0]; // "Year 1", "Year 2", "Year 3"
  const semester = parts[1]; // "Sem 1", "Sem 2", etc.
  const subject = parts[2]; // "Biochemistry", "Physics", etc.
  const filename = parts[parts.length - 1];
  
  // Determine type and unit
  let type = 'Other';
  let unit = '';
  
  if (parts.length === 4 && filename === 'Syllabus.pdf') {
    // Year X/Sem X/Subject/Syllabus.pdf
    type = 'Syllabus';
    unit = '';
  } else if (parts.length >= 4) {
    // Year X/Sem X/Subject/PPTs/... or Year X/Sem X/Subject/PYQs/...
    type = parts[3]; // "PPTs" or "PYQs"
    
    // If there's a subfolder (like "Unit 1 Introduction"), use it
    if (parts.length > 5) {
      unit = parts.slice(4, -1).join(' / '); // Everything between type and filename
    }
  }
  
  // Determine resource type from file extension
  const ext = path.extname(filename).toLowerCase();
  let resourceType = 'pdf';
  if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) resourceType = 'video';
  if (['.ppt', '.pptx'].includes(ext)) resourceType = 'ppt';
  if (['.doc', '.docx'].includes(ext)) resourceType = 'doc';

  // Create a clean description from filename
  const description = filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
    .trim();

  return {
    year,
    semester,
    subject,
    type,
    unit,
    filename,
    description,
    resourceType,
    key,
  };
}

async function generateCSV() {
  try {
    const files = await listAllFiles();
    console.log(`Total files found: ${files.length}`);

    // Parse all files
    const resources = files
      .map(file => parseFileInfo(file.Key))
      .filter(info => info !== null);

    // Sort resources: Year → Semester → Subject → Type
    resources.sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      if (a.semester !== b.semester) return a.semester.localeCompare(b.semester);
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.unit.localeCompare(b.unit);
    });

    // Generate CSV content
    const headers = 'Year,Semester,Subject,Type,Unit,Description,Resource Type,URL\n';
    const rows = resources.map(r => {
      const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${r.key}`;
      
      return [
        r.year,
        r.semester,
        r.subject,
        r.type,
        r.unit,
        r.description,
        r.resourceType,
        cloudFrontUrl,
      ]
        .map(field => `"${field}"`) // Quote all fields
        .join(',');
    }).join('\n');

    const csvContent = headers + rows;

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
    console.log(`\n✅ CSV generated successfully!`);
    console.log(`📄 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Total resources: ${resources.length}`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the generated CSV`);
    console.log(`2. Update any descriptions/metadata as needed`);
    console.log(`3. Rename resources-new.csv to resources.csv`);
    console.log(`4. Remove the Drive API code from your app`);

  } catch (error) {
    console.error('Error generating CSV:', error);
    process.exit(1);
  }
}

// Run
generateCSV();
