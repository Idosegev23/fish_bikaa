/**
 * Reset + reload product images from /Users/idosegev/Downloads/ready/catalog_final/webp.
 * 1) NULL out all additional_products.image_url
 * 2) Delete old png files in fish-images/products/
 * 3) Upload 85 new .webp files (keeping their filenames)
 * 4) PATCH image_url for each matched product by Hebrew name
 *
 * Run: node migrate-product-images-v2.cjs
 */
const fs = require('fs');
const path = require('path');

function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(__dirname, '.env'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const SRC_DIR = '/Users/idosegev/Downloads/ready/catalog_final/webp';
const BUCKET = 'fish-images';
const FOLDER = 'products';

// Mapping: webp filename → DB product name (must match additional_products.name exactly)
const mapping = [
  ['American_Seasoned_Breadcrumbs.webp',          'תערובת לציפוי שניצל אמריקאי (400 גרם)'],
  ['Arbequina_Extra_Virgin_Olive_Oil.webp',       'שמן ארבקינה'],
  ['Artichoke_Spread.webp',                       'ממרח ארטישוק'],
  ['Baladi_Zaatar_Seasoning.webp',                'זעתר בלאדי'],
  ['Basil_Pesto_With_Nuts.webp',                  'פסטו בזיליקום עם אגוזים'],
  ['Bay_Leaves_and_Allspice.webp',                'עלי דפנה ופלפל אנגלי'],
  ['Beet_Kubbeh_Soup_Base.webp',                  'בסיס למרק קובה סלק Gulia (350 גרם)'],
  ['Breaded_Alaska_Pollock.webp',                 'נאגטס אלסקה פולוק (600 גרם)'],
  ['Breaded_Fish_Fingers.webp',                   'אצבעות בקלה (500 גרם)'],
  ['Breaded_Hake_Fillets.webp',                   'נתחי בקלה (800 גרם)'],
  ['Breaded_Hake_Fillets_2.webp',                 'משולשי בקלה (500 גרם)'],
  ['Breaded_Onion_Rings.webp',                    'טבעות בצל'],
  ['Burgul_With_Lentils.webp',                    'בורגול עם עדשים (500 גרם)'],
  ['Chaokoh_Coconut_Cream.webp',                  'קרם קוקוס'],
  ['Classic_Seasoned_Bread_Crumbs.webp',          'תערובת לציפוי שניצל קלאסי (400 גרם)'],
  ['Coarse_Ground_Black_Pepper.webp',             'פלפל שחור גרוס'],
  ['Coratina_Extra_Virgin_Olive_Oil.webp',        'שמן קורטינה'],
  ['Crispy_Potato_Bites.webp',                    'כדורי פירה'],
  ['Dried_Oregano_Leaves.webp',                   'אורגנו'],
  ['Dried_Thyme_Leaves.webp',                     'עלי טימין'],
  ['Dry_Parsley.webp',                            'פטרוזיליה'],
  ['Everything_But_The_Bagel.webp',               'תיבול על הבייגל'],
  ['Extra_Crispy_Potato_Wedges.webp',             'טוגני תפוחי אדמה'],
  ['Fish_Nuggets.webp',                           'נאגטס דג אמנון בציפוי טמפורה (350 גרם)'],
  ['Fish_Nuggets_2.webp',                         'נאגטס דג אמנון בציפוי פירורי לחם (350 גרם)'],
  ['Fish_Nuggets_3.webp',                         'מיני נגיסי אמנון בציפוי פירורי לחם (350 גרם)'],
  ['Fresh_Wheat_Noodles.webp',                    'אטריות מהירות'],
  ['Frozen_Potato_Cubes.webp',                    'ציפס קוביות'],
  ['Frozen_Tilapia_Fillet.webp',                  'מושט קפוא (לק"ג)'],
  ['Gluten_Free_Fish_Fillets.webp',               'בקלה ללא גלוטן (500 גרם)'],
  ['Golden_Panko_Breadcrumbs.webp',               'פנקו - פירורי לחם זהובים (200 גרם)'],
  ['Golden_Seasoned_Bread_Crumbs.webp',           'תערובת לציפוי שניצל מוזהב (400 גרם)'],
  ['Green_Coriander_Leaves.webp',                 'עלי כוסברה'],
  ['Grilled_Chicken_Spice_Blend.webp',            'תבלין לעוף בגריל'],
  ['Ground_Black_Pepper.webp',                    'פלפל שחור טחון'],
  ['Ground_Caraway_Seeds.webp',                   'קימל טחון (כרוויה)'],
  ['Ground_Cumin.webp',                           'כמון טחון'],
  ['Hoisin_Mushroom_Sauce.webp',                  'רוטב הוי סטיר (250 מל)'],
  ['Hot_Red_Paprika.webp',                        'פפריקה חריפה'],
  ['Indian_Curry_Spice.webp',                     'קארי אדום'],
  ['Kalamata_Olive_Tapenade.webp',                'טפנד זיתי קלמטה'],
  ['Koroneiki_Extra_Virgin_Olive_Oil.webp',       'שמן קורונייקי'],
  ['Maharaja_Panipuri_Kit.webp',                  'מטבעות פני פורי (200 גרם)'],
  ['Majadara_Rice_With_Lentils.webp',             'מג\'דרה אורז עם עדשים (500 גרם)'],
  ['Maxchup_Red_Curry_Sauce.webp',                'רוטב קארי אדום (250 מל)'],
  ['Mexican_Chili_Peppers.webp',                  'צ\'ילי מתוק'],
  ['Mezzemaniche_Durum_Pasta.webp',               'מזמניקה (500 גרם)'],
  ['Mirin_Style_Seasoning.webp',                  'רוטב מירין לתיבול'],
  ['Mixed_Shawarma_Spices.webp',                  'תבלין שווארמה ופרגית'],
  ['Mixed_Spices_For_Potatoes.webp',              'תבלין פוטטו'],
  ['Mixed_Spices_Meatballs.webp',                 'ראס אל חנות'],
  ['Mixed_Spices_for_Barbecue.webp',              'תבלין על האש'],
  ['Mixed_Spices_for_Fish.webp',                  'תבלין לדגים'],
  ['Natural_Kalamata_Olives.webp',                'זיתי קלמטה שחור טבעי (500 גרם)'],
  ['Noam_Extra_Virgin_Olive_Oil.webp',            'שמן נעם'],
  ['Pad_Thai_Cooking_Sauce.webp',                 'רוטב פאד תאי (250 מל)'],
  ['Panko_Breadcrumbs.webp',                      'פנקו - פירורי לחם (200 גרם)'],
  ['Philadelphia_Mixed_Spices.webp',              'פילדלפיה'],
  ['Picholine_Extra_Virgin_Olive_Oil.webp',       'שמן פישולן'],
  ['Picual_Extra_Virgin_Olive_Oil.webp',          'שמן פיקואל'],
  ['Pink_Pickled_Ginger.webp',                    'ג\'ינג\'ר כבוש ורוד'],
  ['Pitted_Kalamata_Olives.webp',                 'זיתי קלמטה (250 גרם)'],
  ['Purple_Sweet_Potato_Panko.webp',              'פנקו - פירורי לחם עם בטטה סגולה (200 גרם)'],
  ['Quinoa_With_Lentils.webp',                    'קינואה עם עדשים (500 גרם)'],
  ['Quinoa_With_Vegetables.webp',                 'קינואה עם ירקות (500 גרם)'],
  ['Reduced_Sodium_Soy_Sauce.webp',               'רוטב סויה מופחת נתרן ומלח (500 מל)'],
  ['Roasted_Pepper_Spread.webp',                  'ממרח פלפל קלוי'],
  ['Rustichella_Ceppo_Pasta.webp',                'פסטה אל ציפו (500 גרם)'],
  ['Rustichella_Trenne_Pasta.webp',               'טרנה (500 גרם)'],
  ['Sea_Spice_Blend.webp',                        'תערובת תבלינית ים'],
  ['Shahar_Extra_Virgin_Olive_Oil.webp',          'שמן שחר'],
  ['Shakshuka_Base_Sauce.webp',                   'בסיס לשקשוקה Gulia (540 גרם)'],
  ['Sour_Green_Olives.webp',                      'זיתים ירוקים מזן סורי (250 גרם)'],
  ['Souri_Extra_Virgin_Olive_Oil.webp',           'שמן סורי'],
  ['Souri_Green_Olives.webp',                     'זיתים ירוקים מזן סורי (500 גרם)'],
  ['Soy_Sauce_Sesame_Seeds.webp',                 'שומשום בציפוי בטעם רוטב סויה'],
  ['Spicy_Harissa_Paste.webp',                    'אריסה'],
  ['Steak_Fries.webp',                            'סטיק ציפס'],
  ['Sweet_Red_Paprika.webp',                      'פפריקה מתוקה'],
  ['Sweet_Red_Paprika_2.webp',                    'פפריקה מתוקה בשמן'],
  ['Tempura_Flour_Mix.webp',                      'טמפורה (500 גרם)'],
  ['Toscana_Mixed_Spices.webp',                   'טוסקנה'],
  ['Turmeric_Powder.webp',                        'כורכום טחון'],
  ['Viennese_Seasoned_Breadcrumbs.webp',          'תערובת לציפוי שניצל וינאי (400 גרם)'],
  ['Wasabi_Paste.webp',                           'וואסבי (חדש)'],
];

async function listProducts() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix: `${FOLDER}/`, limit: 200 }),
  });
  if (!res.ok) throw new Error(`list: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function deleteObjects(paths) {
  if (paths.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!res.ok) throw new Error(`delete: ${res.status} ${await res.text()}`);
}

async function clearAllImageUrls() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/additional_products?id=gt.0`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ image_url: null }),
    }
  );
  if (!res.ok) throw new Error(`clear: ${res.status} ${await res.text()}`);
}

async function upload(filePath, objectPath) {
  const body = fs.readFileSync(filePath);
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'image/webp',
        'x-upsert': 'true',
      },
      body,
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
}

async function setImageUrl(productName, imageUrl) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/additional_products?name=eq.${encodeURIComponent(productName)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    }
  );
  if (!res.ok) throw new Error(`PATCH ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows.length;
}

(async () => {
  console.log('Step 1: List existing files in bucket products/');
  const existing = await listProducts();
  const oldPaths = existing.map((o) => `${FOLDER}/${o.name}`);
  console.log(`  Found ${oldPaths.length} existing objects`);

  if (oldPaths.length > 0) {
    console.log('Step 2: Delete old objects');
    await deleteObjects(oldPaths);
    console.log('  Deleted.');
  }

  console.log('Step 3: NULL out all image_url in DB');
  await clearAllImageUrls();

  console.log('Step 4: Upload new webp files + set image_url');
  let ok = 0, miss = 0, err = 0;
  for (const [filename, productName] of mapping) {
    const localPath = path.join(SRC_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.log(`SKIP missing local file: ${filename}`);
      err++;
      continue;
    }
    const objectPath = `${FOLDER}/${filename}`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
    try {
      await upload(localPath, objectPath);
      const matched = await setImageUrl(productName, publicUrl);
      if (matched === 0) {
        console.log(`WARN no DB match: "${productName}" (uploaded ${filename})`);
        miss++;
      } else {
        console.log(`OK  ${filename} → "${productName}"`);
        ok++;
      }
    } catch (e) {
      console.log(`ERR ${filename}: ${e.message}`);
      err++;
    }
  }
  console.log(`\nDone. linked=${ok}, no_db_match=${miss}, errors=${err}`);
})();
