const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

// Supabase credentials
const supabaseUrl = 'https://opzchmjhwzlpfwjatswb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wemNobWpod3pscGZ3amF0c3diIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.UfArDsLUxgkSBqfazOrTwJCaZ0T5MQ-V2MgN79n_EgE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Hebrew to English transliteration
function transliterate(hebrewName) {
  const map = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
    'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
    'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f',
    'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
    '׳': '', '״': '', ' ': '-', '(': '', ')': '', '"': '', "'": '',
    'גרם': 'gram', 'ק"ג': 'kg'
  };
  
  let result = hebrewName.toLowerCase();
  
  // Replace common Hebrew words
  result = result.replace(/תבליני פרג/g, 'tavlinei-pereg');
  result = result.replace(/שמן זית/g, 'shemen-zait');
  result = result.replace(/רוטב/g, 'rotev');
  result = result.replace(/תערובת/g, 'taarovet');
  result = result.replace(/ג׳וליה/g, 'julia');
  result = result.replace(/ג'וליה/g, 'julia');
  
  // Transliterate remaining Hebrew characters
  for (const [heb, eng] of Object.entries(map)) {
    result = result.split(heb).join(eng);
  }
  
  // Clean up
  result = result
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  
  return result || 'product';
}

// Download file from URL
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Products mapping
const products = [
  { id: 51, name: 'אריסה', oldFile: 'product_01.jpeg' },
  { id: 52, name: 'טפנד זיתי קלמטה', oldFile: 'product_02.jpeg' },
  { id: 17, name: 'תערובת תבלינית ים', oldFile: 'product_03.jpeg' },
  { id: 7, name: 'ממרח פלפל קלוי', oldFile: 'product_04.jpeg' },
  { id: 14, name: 'פסטו בזיליקום עם אגוזים', oldFile: 'product_05.jpeg' },
  { id: 12, name: 'ממרח ארטישוק', oldFile: 'product_06.jpeg' },
  { id: 5, name: 'פנקו בטטה סגולה', oldFile: 'product_07.jpeg' },
  { id: 3, name: 'פנקו', oldFile: 'product_08.jpeg' },
  { id: 9, name: 'פנקו לבן', oldFile: 'product_09.jpeg' },
  { id: 6, name: 'תערובת להכנת טמפורה', oldFile: 'product_10.jpeg' },
  { id: 1, name: 'זיתים ירוקים מזן סורי', oldFile: 'product_11.jpeg' },
  { id: 8, name: 'זיתי קלמטה', oldFile: 'product_12.jpeg' },
  { id: 13, name: 'קלמטה מגולענים', oldFile: 'product_13.jpeg' },
  { id: 4, name: 'שמן זית קורטינה', oldFile: 'product_15.jpeg' },
  { id: 11, name: 'שמן זית שחר', oldFile: 'product_16.jpeg' },
  { id: 16, name: 'שמן זית סורי', oldFile: 'product_17.jpeg' },
  { id: 10, name: 'שמן זית פישולין', oldFile: 'product_18.jpeg' },
  { id: 45, name: 'שמן זית פיקואל', oldFile: 'product_19.jpeg' },
  { id: 44, name: 'שמן זית נעם', oldFile: 'product_20.jpeg' },
  { id: 43, name: 'שמן זית ארבקינה', oldFile: 'product_21.jpeg' },
  { id: 46, name: 'שמן זית קורינייקי', oldFile: 'product_22.jpeg' },
  { id: 54, name: 'ג׳וליה בסיס לשקשוקה', oldFile: 'product_23.jpeg' },
  { id: 53, name: 'ג׳וליה בסיס לקובה סלק', oldFile: 'product_24.jpeg' },
  { id: 68, name: 'פני פורי', oldFile: 'product_25.jpeg' },
  { id: 64, name: 'רוטב פאד תאי', oldFile: 'product_26.jpeg' },
  { id: 66, name: 'רוטב הוי סטיר', oldFile: 'product_27.jpeg' },
  { id: 65, name: 'רוטב קארי אדום', oldFile: 'product_28.jpeg' },
  { id: 69, name: 'תבליני פרג קארי הודי', oldFile: 'product_29.jpeg' },
  { id: 70, name: 'תבליני פרג תיבול על הבייגל', oldFile: 'product_30.jpeg' },
  { id: 71, name: 'תבליני אליטה לפוטטוס', oldFile: 'product_31.jpeg' },
  { id: 60, name: 'תבליני פרג ראס אל חנות', oldFile: 'product_32.jpeg' },
  { id: 56, name: 'תבליני פרג תבלין על האש', oldFile: 'product_33.jpeg' },
  { id: 57, name: 'תבליני פרג זעתר בלאדי', oldFile: 'product_34.jpeg' },
  { id: 58, name: 'תבליני פרג קימל', oldFile: 'product_35.jpeg' },
  { id: 59, name: 'פסטה טרנה', oldFile: 'product_36.jpeg' },
  { id: 55, name: 'פסטה מזימניצ׳ה', oldFile: 'product_37.jpeg' },
  { id: 63, name: 'פסטה אל קאפו', oldFile: 'product_38.jpeg' },
  { id: 61, name: 'תבליני פרג קינואה עם ירקות', oldFile: 'product_39.jpeg' },
  { id: 67, name: 'תבליני פרג מג׳דרה אורז עם עדשים', oldFile: 'product_40.jpeg' },
  { id: 62, name: 'תבליני פרג קינואה עם עדשים', oldFile: 'product_41.jpeg' },
  { id: 40, name: 'תבליני פרג בורגול עם עדשים', oldFile: 'product_42.jpeg' },
  { id: 23, name: 'תבליני פרג תבלין לשווארמה', oldFile: 'product_43.jpeg' },
  { id: 39, name: 'תבליני פרג פפריקה מתוקה בשמן', oldFile: 'product_44.jpeg' },
  { id: 33, name: 'תבליני פרג פלפל שחור טחון', oldFile: 'product_45.jpeg' },
  { id: 29, name: 'תבליני פרג פפריקה מתוקה', oldFile: 'product_46.jpeg' },
  { id: 32, name: 'תבליני פרג פטרוזיליה', oldFile: 'product_47.jpeg' },
  { id: 38, name: 'תבליני פרג פילדלפיה', oldFile: 'product_48.jpeg' },
  { id: 34, name: 'תבליני פרג כמון טחון', oldFile: 'product_49.jpeg' },
  { id: 31, name: 'תבליני פרג עלי כוסברה', oldFile: 'product_50.jpeg' },
  { id: 30, name: 'תבליני פרג עלי דפנה ופלפל אנגלי', oldFile: 'product_51.jpeg' },
  { id: 27, name: 'תבליני פרג כורכום טחון', oldFile: 'product_52.jpeg' },
  { id: 41, name: 'ג׳ינג׳ר כבוש ורוד', oldFile: 'product_53.jpeg' },
  { id: 36, name: 'תבליני פרג פפריקה חריפה', oldFile: 'product_54.jpeg' },
  { id: 25, name: 'תבליני פרג טוסקנה', oldFile: 'product_55.jpeg' },
  { id: 26, name: 'תבליני פרג טימין', oldFile: 'product_56.jpeg' },
  { id: 37, name: 'תבליני פרג תבלין לעוף בגריל', oldFile: 'product_57.jpeg' },
  { id: 20, name: 'תבליני פרג צ׳ילי מקסיקני', oldFile: 'product_58.jpeg' },
  { id: 22, name: 'רוטב מירין', oldFile: 'product_59.jpeg' },
  { id: 24, name: 'תבליני פרג תערובת לציפוי שניצל וינאי', oldFile: 'product_60.jpeg' },
  { id: 42, name: 'קרם קוקוס', oldFile: 'product_61.jpeg' },
  { id: 35, name: 'נודלס', oldFile: 'product_62.jpeg' },
  { id: 21, name: 'תבליני פרג תערובת לציפוי שניצל קלאסי', oldFile: 'product_63.jpeg' },
  { id: 18, name: 'תבליני פרג תערובת לציפוי שניצל מוזהב', oldFile: 'product_64.jpeg' },
  { id: 28, name: 'תבליני פרג תערובת לציפוי שניצל אמריקאי', oldFile: 'product_65.jpeg' },
  { id: 19, name: 'רוטב סויה מופחת נתרן', oldFile: 'product_66.jpeg' },
  { id: 47, name: 'ווסאבי', oldFile: 'product_67.jpeg' },
  { id: 49, name: 'שומשום בציפוי סויה', oldFile: 'product_68.jpeg' },
  { id: 48, name: 'תבליני פרג אורגנו', oldFile: 'product_69.jpeg' },
  { id: 50, name: 'תבליני פרג תבלין לדגים', oldFile: 'product_70.jpeg' },
  { id: 72, name: 'אצבעות בקלה', oldFile: 'product_72.jpeg' },
  { id: 73, name: 'משולשי בקלה', oldFile: 'product_73.jpeg' },
  { id: 74, name: 'נתחי בקלה', oldFile: 'product_74.jpeg' },
  { id: 75, name: 'בקלה ללא גלוטן', oldFile: 'product_75.jpeg' },
  { id: 76, name: 'נאגטס אלסקה פולוק', oldFile: 'product_76.jpeg' },
  { id: 77, name: 'מושט קפוא', oldFile: 'product_77.jpeg' },
  { id: 78, name: 'פוטטו', oldFile: 'product_78.jpeg' },
  { id: 79, name: 'טבעות בצל', oldFile: 'product_79.jpeg' },
  { id: 80, name: 'ציפס קוביות', oldFile: 'product_80.jpeg' },
  { id: 81, name: 'מיני נגיסי אמנון', oldFile: 'product_81.jpeg' },
  { id: 82, name: 'נאגטס אמנון פירורי לחם', oldFile: 'product_82.jpeg' },
  { id: 83, name: 'נאגטס אמנון טמפורה', oldFile: 'product_83.jpeg' },
  { id: 84, name: 'כדורי פירה', oldFile: 'product_84.jpeg' },
  { id: 85, name: 'סטיק ציפס', oldFile: 'product_85.jpeg' },
  { id: 86, name: 'מוצי שוקלד', oldFile: 'product_86.jpeg' },
  { id: 87, name: 'מוצי וניל', oldFile: 'product_87.jpeg' },
  { id: 88, name: 'ציפס טוגן', oldFile: 'product_88.jpeg' },
  { id: 89, name: 'דפי אורז', oldFile: 'product_90.jpeg' },
];

async function renameImages() {
  console.log('🔄 Starting image rename process...\n');
  
  const usedNames = new Set();
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of products) {
    try {
      // Generate new filename
      let newName = transliterate(product.name);
      
      // Ensure unique name
      let finalName = newName;
      let counter = 1;
      while (usedNames.has(finalName)) {
        finalName = `${newName}-${counter}`;
        counter++;
      }
      usedNames.add(finalName);
      
      const newFileName = `${finalName}.jpeg`;
      const oldPath = `products/${product.oldFile}`;
      const newPath = `products/${newFileName}`;
      const oldUrl = `${supabaseUrl}/storage/v1/object/public/fish-images/${oldPath}`;
      const newUrl = `${supabaseUrl}/storage/v1/object/public/fish-images/${newPath}`;
      
      console.log(`Processing: ${product.name}`);
      console.log(`  Old: ${product.oldFile} -> New: ${newFileName}`);
      
      // Download the image
      const imageData = await downloadFile(oldUrl);
      
      // Upload with new name
      const { error: uploadError } = await supabase.storage
        .from('fish-images')
        .upload(newPath, imageData, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (uploadError) {
        console.log(`  ❌ Upload error: ${uploadError.message}`);
        errorCount++;
        continue;
      }
      
      // Update database
      const { error: dbError } = await supabase
        .from('additional_products')
        .update({ image_url: newUrl })
        .eq('id', product.id);
      
      if (dbError) {
        console.log(`  ❌ DB error: ${dbError.message}`);
        errorCount++;
        continue;
      }
      
      // Delete old file
      const { error: deleteError } = await supabase.storage
        .from('fish-images')
        .remove([oldPath]);
      
      if (deleteError) {
        console.log(`  ⚠️ Delete error (continuing): ${deleteError.message}`);
      }
      
      console.log(`  ✅ Success!\n`);
      successCount++;
      
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}\n`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
}

renameImages().catch(console.error);


