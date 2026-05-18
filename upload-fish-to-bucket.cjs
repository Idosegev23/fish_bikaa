const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://opzchmjhwzlpfwjatswb.supabase.co';
// Service role key for storage access
// Anon key (public)
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wemNobWpod3pscGZ3amF0c3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.i0sVoJLkRfL0VhpvDqMR7MYmMRlGrL2eXdlNrPRcfcc';
const serviceKey = anonKey;

const fishFiles = [
  { file: 'barbunia.png', id: 43 },
  { file: 'barmindi.png', id: 52 },
  { file: 'buri.png', id: 46 },
  { file: 'carpion.png', id: 54 },
  { file: 'denis.png', id: 42 },
  { file: 'frida.png', id: 49 },
  { file: 'intias.png', id: 50 },
  { file: 'lavrak.png', id: 48 },
  { file: 'locus.png', id: 44 },
  { file: 'mosar.png', id: 47 },
  { file: 'musht.png', id: 51 },
  { file: 'nesichat_nilos.png', id: 56 },
  { file: 'red_tuna.png', id: 55 },
  { file: 'salmon.png', id: 45 },
];

const imagesDir = './public/fish_img/bar-yam/new_imgs';

async function uploadFile(filePath, bucketPath) {
  const fileBuffer = fs.readFileSync(filePath);
  
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/fish-images/${bucketPath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true'
      },
      body: fileBuffer
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }
  
  return response.json();
}

async function updateDatabase(id, imageUrl) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/fish_types?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ image_url: imageUrl })
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DB update failed: ${response.status} - ${error}`);
  }
}

async function main() {
  console.log('🐟 Uploading fish images to Supabase bucket...\n');
  
  let success = 0;
  let errors = 0;
  
  for (const fish of fishFiles) {
    const localPath = path.join(imagesDir, fish.file);
    const bucketPath = `fish/${fish.file}`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/fish-images/${bucketPath}`;
    
    try {
      console.log(`📤 Uploading: ${fish.file}`);
      
      if (!fs.existsSync(localPath)) {
        console.log(`  ❌ File not found\n`);
        errors++;
        continue;
      }
      
      await uploadFile(localPath, bucketPath);
      console.log(`  ✅ Uploaded to bucket`);
      
      await updateDatabase(fish.id, publicUrl);
      console.log(`  ✅ Database updated (ID: ${fish.id})`);
      console.log(`  🔗 ${publicUrl}\n`);
      
      success++;
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}\n`);
      errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ❌ Errors: ${errors}`);
}

main().catch(console.error);

