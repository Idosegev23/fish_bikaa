// Script to download images from Supabase storage bucket
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://opzchmjhwzlpfwjatswb.supabase.co';
const BUCKET_NAME = 'fish-images';
const OUTPUT_DIR = './public/fish_img/from-bucket';

// Images from the bucket
const images = [
  '0.01952229389236093.png',
  '0.05200268076854908.png',
  '0.0684213741611508.png',
  '0.11110185890092195.png',
  '0.12280582577922705.png',
  '0.1233544697464386.jpg',
  '0.16501255094903888.jpg',
  '0.18838314113349497.webp',
  '0.22982903868641635.jpg',
  '0.3429469897817742.png',
  '0.471693681399574.webp',
  '0.5075147609055277.webp',
  '0.5518505029301242.png',
  '0.5650750669488764.png',
  '0.6176479190841083.webp',
  '0.6302901526227871.jpg',
  '0.6363768420624675.png',
  '0.700028692216191.jpg',
  '0.7055404047795086.webp',
  '0.7576423869531694.jpeg',
  '0.771681625595384.jpg',
  '0.8856813708444465.png',
  '0.8981796254645168.webp',
  '0.9894029501531447.webp'
];

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
}

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/fish-images/${filename}`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    console.log(`Downloading: ${filename}...`);
    
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${filename}`);
          resolve(filename);
        });
      } else {
        fs.unlink(outputPath, () => {});
        console.log(`✗ Failed to download ${filename}: HTTP ${response.statusCode}`);
        resolve(null);
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      console.log(`✗ Error downloading ${filename}: ${err.message}`);
      resolve(null);
    });
  });
}

async function downloadAll() {
  console.log(`\nDownloading ${images.length} images from Supabase bucket...\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const img of images) {
    const result = await downloadFile(img);
    if (result) success++;
    else failed++;
  }
  
  console.log(`\n========================================`);
  console.log(`Download complete!`);
  console.log(`Success: ${success} | Failed: ${failed}`);
  console.log(`Images saved to: ${OUTPUT_DIR}`);
  console.log(`========================================\n`);
}

downloadAll();

