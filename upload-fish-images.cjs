// Script to rename, copy and prepare fish images for upload
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = './public/fish_img';
const OUTPUT_DIR = './public/fish_img/renamed';

// Mapping from image name patterns to Hebrew fish names
const fishMapping = {
  'European_seabass': 'lavrak',
  'Nile_perch': 'nesihat-nilus',
  'barramundi': 'barramundi',
  'bluefin_tuna': 'tuna-aduma',
  'carp': 'karpion',
  'common_pandora': 'frida',
  'gilthead_sea_bream': 'denis',
  'mullet': 'buri',
  'red_mullet': 'barbunya',
  'salmon': 'salmon',
  'striped_sea_bream': 'musar-yam',
  'tilapia': 'musht',
  'trout': 'forel',
  'white_grouper': 'lokus-lavan',
  'amberjack': 'intias'
};

// Hebrew names for database
const hebrewNames = {
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

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get all doido5760 files
const files = fs.readdirSync(SOURCE_DIR).filter(f => f.startsWith('doido5760'));

console.log(`Found ${files.length} fish images to process\n`);

const results = [];

files.forEach(file => {
  // Find matching fish
  let matchedFish = null;
  for (const [pattern, fishName] of Object.entries(fishMapping)) {
    if (file.toLowerCase().includes(pattern.toLowerCase())) {
      matchedFish = fishName;
      break;
    }
  }
  
  if (matchedFish) {
    const ext = path.extname(file);
    const newName = `${matchedFish}${ext}`;
    const sourcePath = path.join(SOURCE_DIR, file);
    const destPath = path.join(OUTPUT_DIR, newName);
    
    fs.copyFileSync(sourcePath, destPath);
    
    console.log(`✓ ${file.substring(0, 50)}... → ${newName}`);
    
    results.push({
      original: file,
      newName: newName,
      fishKey: matchedFish,
      hebrewName: hebrewNames[matchedFish]
    });
  } else {
    console.log(`✗ No match for: ${file}`);
  }
});

console.log(`\n========================================`);
console.log(`Processed ${results.length} images`);
console.log(`Images saved to: ${OUTPUT_DIR}`);
console.log(`========================================\n`);

// Output SQL for updating database
console.log('\n-- SQL to update fish_types with image URLs:\n');
results.forEach(r => {
  const url = `/fish_img/renamed/${r.newName}`;
  console.log(`UPDATE fish_types SET image_url = '${url}' WHERE name = '${r.hebrewName}';`);
});

