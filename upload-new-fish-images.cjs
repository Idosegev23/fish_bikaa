const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabaseUrl = 'https://opzchmjhwzlpfwjatswb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wemNobWpod3pscGZ3amF0c3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.i0sVoJLkRfL0VhpvDqMR7MYmMRlGrL2eXdlNrPRcfcc';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping of file names to database fish names
const fishMapping = [
  { file: 'barbunia.png', dbName: 'ברבוניה', id: 43 },
  { file: 'barmindi.png', dbName: 'ברמונדי', id: 52 },
  { file: 'buri.png', dbName: 'בורי', id: 46 },
  { file: 'carpion.png', dbName: 'קרפיון', id: 54 },
  { file: 'denis.png', dbName: 'דניס', id: 42 },
  { file: 'frida.png', dbName: 'פרידה', id: 49 },
  { file: 'intias.png', dbName: 'אינטיאס', id: 50 },
  { file: 'lavrak.png', dbName: 'לברק', id: 48 },
  { file: 'locus.png', dbName: 'לוקוס לבן', id: 44 },
  { file: 'mosar.png', dbName: 'מוסר ים', id: 47 },
  { file: 'musht.png', dbName: 'מושט (אמנון)', id: 51 },
  { file: 'nesichat_nilos.png', dbName: 'נסיכת נילוס', id: 56 },
  { file: 'red_tuna.png', dbName: 'טונה אדומה', id: 55 },
  { file: 'salmon.png', dbName: 'סלמון', id: 45 },
];

const imagesDir = './public/fish_img/bar-yam/new_imgs';

async function uploadFishImages() {
  console.log('🐟 Starting fish image upload process...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const fish of fishMapping) {
    const filePath = path.join(imagesDir, fish.file);
    
    try {
      console.log(`Processing: ${fish.dbName} (${fish.file})`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`  ❌ File not found: ${filePath}\n`);
        errorCount++;
        continue;
      }
      
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      
      // New filename in bucket
      const bucketPath = `fish/${fish.file}`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/fish-images/${bucketPath}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('fish-images')
        .upload(bucketPath, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.log(`  ❌ Upload error: ${uploadError.message}`);
        errorCount++;
        continue;
      }
      
      console.log(`  ✅ Uploaded to: ${bucketPath}`);
      
      // Update database
      const { error: dbError } = await supabase
        .from('fish_types')
        .update({ image_url: publicUrl })
        .eq('id', fish.id);
      
      if (dbError) {
        console.log(`  ❌ DB update error: ${dbError.message}`);
        errorCount++;
        continue;
      }
      
      console.log(`  ✅ Database updated for ID ${fish.id}\n`);
      successCount++;
      
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}\n`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  ⚠️ Note: פורל (forel) was not included as mentioned`);
}

uploadFishImages().catch(console.error);


