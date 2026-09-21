const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function generateCoverPage() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points
  
  const { width, height } = page.getSize();
  
  // Path to your cover image (PNG or JPG)
  // REPLACE THIS WITH YOUR ACTUAL IMAGE PATH
  const imagePath = path.join(__dirname, '..', 'public', 'cover-image.png');
  
  // Check if custom image exists
  if (fs.existsSync(imagePath)) {
    const imageBytes = fs.readFileSync(imagePath);
    
    // Determine image type and embed
    let image;
    if (imagePath.endsWith('.png')) {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(imageBytes);
    }
    
    if (image) {
      // Scale image to fit entire page (full bleed)
      const imgDims = image.scale(1);
      const scale = Math.max(width / imgDims.width, height / imgDims.height);
      
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      
      console.log('✅ Cover page created with custom image!');
    }
  } else {
    console.log('⚠️  No cover-image.png found in /public folder');
    console.log('📝 Please add your image as: /public/cover-image.png or cover-image.jpg');
  }
  
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, '..', 'public', 'cover-page.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  
  console.log('✅ Cover page PDF generated at:', outputPath);
}

generateCoverPage().catch(console.error);
