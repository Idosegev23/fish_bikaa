// דרוש: SUPABASE_URL ו-SUPABASE_KEY (או SUPABASE_SERVICE_KEY) במשתני הסביבה. אין לשמור מפתחות בקוד.
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BUCKET_NAME = 'fish-images';

// Files to upload
const fishImages = fs.readdirSync('./public/fish_img/renamed').map(f => ({
  localPath: `./public/fish_img/renamed/${f}`,
  remotePath: `fish/${f}`
}));

const productImages = fs.readdirSync('./public/fish_pro_imgs')
  .filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'))
  .map((f, i) => ({
    localPath: `./public/fish_pro_imgs/${f}`,
    remotePath: `products/product_${String(i + 1).padStart(2, '0')}.jpeg`
  }));

const allFiles = [...fishImages, ...productImages];

console.log(`\n📤 Uploading ${fishImages.length} fish images + ${productImages.length} product images\n`);

function uploadFile(localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${remotePath}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': contentType,
        'Content-Length': fileData.length,
        'x-upsert': 'true'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, remotePath });
        } else {
          resolve({ success: false, remotePath, error: data, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({ success: false, remotePath, error: e.message });
    });
    
    req.write(fileData);
    req.end();
  });
}

async function uploadAll() {
  let success = 0;
  let failed = 0;
  const results = { fish: [], products: [] };
  
  for (const file of allFiles) {
    process.stdout.write(`Uploading ${file.remotePath}... `);
    const result = await uploadFile(file.localPath, file.remotePath);
    
    if (result.success) {
      console.log('✓');
      success++;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${file.remotePath}`;
      if (file.remotePath.startsWith('fish/')) {
        results.fish.push({ name: path.basename(file.remotePath, path.extname(file.remotePath)), url: publicUrl });
      } else {
        results.products.push({ index: file.remotePath, url: publicUrl });
      }
    } else {
      console.log(`✗ (${result.status}: ${result.error})`);
      failed++;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`✓ Success: ${success} | ✗ Failed: ${failed}`);
  console.log(`========================================\n`);
  
  // Output SQL for fish
  console.log('-- SQL to update fish_types with bucket URLs:\n');
  const fishMapping = {
    'lavrak': 'לברק',
    'nesihat-nilus': 'נסיכת נילוס',
    'barramundi': 'ברמונדי',
    'tuna-aduma': 'טונה אדומה',
    'karpion': 'קרפיון',
    'frida': 'פרידה',
    'denis': 'דניס',
    'buri': 'בורי',
    'barbunya': 'ברבוניה',
    'salmon': 'סלמון',
    'musar-yam': 'מוסר ים',
    'musht': 'מושט (אמנון)',
    'forel': 'פורל',
    'lokus-lavan': 'לוקוס לבן',
    'intias': 'אינטיאס'
  };
  
  results.fish.forEach(f => {
    const hebrewName = fishMapping[f.name];
    if (hebrewName) {
      console.log(`UPDATE fish_types SET image_url = '${f.url}' WHERE name = '${hebrewName}';`);
    }
  });
  
  // Save product URLs to file
  fs.writeFileSync('./product-urls.json', JSON.stringify(results.products, null, 2));
  console.log('\n-- Product URLs saved to product-urls.json');
}

uploadAll();

