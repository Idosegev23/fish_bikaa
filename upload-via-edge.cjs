// דרוש: SUPABASE_URL ו-SUPABASE_KEY (או SUPABASE_SERVICE_KEY) במשתני הסביבה. אין לשמור מפתחות בקוד.
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_KEY;

const fishFiles = [
  { file: 'barbunia.png', id: 43, name: 'ברבוניה' },
  { file: 'barmindi.png', id: 52, name: 'ברמונדי' },
  { file: 'buri.png', id: 46, name: 'בורי' },
  { file: 'carpion.png', id: 54, name: 'קרפיון' },
  { file: 'denis.png', id: 42, name: 'דניס' },
  { file: 'frida.png', id: 49, name: 'פרידה' },
  { file: 'intias.png', id: 50, name: 'אינטיאס' },
  { file: 'lavrak.png', id: 48, name: 'לברק' },
  { file: 'locus.png', id: 44, name: 'לוקוס לבן' },
  { file: 'mosar.png', id: 47, name: 'מוסר ים' },
  { file: 'musht.png', id: 51, name: 'מושט' },
  { file: 'nesichat_nilos.png', id: 56, name: 'נסיכת נילוס' },
  { file: 'red_tuna.png', id: 55, name: 'טונה אדומה' },
  { file: 'salmon.png', id: 45, name: 'סלמון' },
];

const imagesDir = './public/fish_img/bar-yam/new_imgs';

async function uploadViaEdgeFunction(imageBase64, fileName) {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/upload-image`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        fileName,
        bucket: 'fish-images',
        folder: 'fish'
      })
    }
  );
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

async function updateDatabase(id, imageUrl) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/fish_types?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
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
  console.log('🐟 Uploading fish images via Edge Function...\n');
  
  let success = 0;
  let errors = 0;
  
  for (const fish of fishFiles) {
    const localPath = path.join(imagesDir, fish.file);
    
    try {
      console.log(`📤 Uploading: ${fish.name} (${fish.file})`);
      
      if (!fs.existsSync(localPath)) {
        console.log(`  ❌ File not found\n`);
        errors++;
        continue;
      }
      
      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(localPath);
      const base64 = fileBuffer.toString('base64');
      
      // Upload via Edge Function
      const result = await uploadViaEdgeFunction(base64, fish.file);
      console.log(`  ✅ Uploaded: ${result.path}`);
      
      // Update database
      await updateDatabase(fish.id, result.publicUrl);
      console.log(`  ✅ Database updated (ID: ${fish.id})`);
      console.log(`  🔗 ${result.publicUrl}\n`);
      
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


