/**
 * One-shot: upload product images from /Users/idosegev/Downloads/ready
 * to fish-images/products/<english-slug>.png and update
 * additional_products.image_url accordingly.
 *
 * Run: node migrate-product-images.cjs
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env
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
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const SRC_DIR = '/Users/idosegev/Downloads/ready';
const BUCKET = 'fish-images';
const BUCKET_FOLDER = 'products';

// filename (in SRC_DIR) → { slug (english, no extension), product_name_in_db }
const mapping = [
  ['Maharaja Panipuri - אטפצות פני פורי.png',          'pani_puri',                'מטבעות פני פורי (200 גרם)'],
  ['Maxchup - הוי סטיר רוטב פטריות.png',                'hoy_stir_sauce',           'רוטב הוי סטיר (250 מל)'],
  ['Maxchup - רוטב פאד תאי.png',                         'pad_thai_sauce',           'רוטב פאד תאי (250 מל)'],
  ['Maxchup - רוטב קארי אדום.png',                       'red_curry_sauce',          'רוטב קארי אדום (250 מל)'],
  ['אריסה - ממרח פלפלים חריף.png',                       'harissa',                  'אריסה'],
  ['ג\'וליה - בסיס לקובה סלק.png',                       'gulia_kuba_beet_base',     'בסיס למרק קובה סלק Gulia (350 גרם)'],
  ['ג\'וליה - בסיס לשקשוקה.png',                         'gulia_shakshuka_base',     'בסיס לשקשוקה Gulia (540 גרם)'],
  ['זית קלמטה שחור טבעי.png',                            'kalamata_black_natural',   'זיתי קלמטה שחור טבעי (500 גרם)'],
  ['זיתים ירוקים מזן סורי 250 גרם.png',                  'green_olives_syrian_250g', 'זיתים ירוקים מזן סורי (250 גרם)'],
  ['זיתים ירוקים מזן סורי 500 גרם.png',                  'green_olives_syrian_500g', 'זיתים ירוקים מזן סורי (500 גרם)'],
  ['זיתים קלמטה שחורים מגולענים.png',                    'kalamata_pitted',          'זיתי קלמטה (250 גרם)'],
  ['טפנד זית קלמטה.png',                                  'tapenade_kalamata',        'טפנד זיתי קלמטה'],
  ['ממרח ארטישוק.png',                                    'artichoke_spread',         'ממרח ארטישוק'],
  ['ממרח פלפל קלוי.png',                                  'roasted_pepper_spread',    'ממרח פלפל קלוי'],
  ['פנקו פירורי לחם בטעם בטטה סגולה.png',                'panko_sweet_potato',       'פנקו - פירורי לחם עם בטטה סגולה (200 גרם)'],
  ['פנקו פירורי לחם יהובים.png',                          'panko_golden',             'פנקו - פירורי לחם זהובים (200 גרם)'],
  ['פנקו פירורי לחם.png',                                 'panko_breadcrumbs',        'פנקו - פירורי לחם (200 גרם)'],
  ['פסטה Rustichella d\'Abruzzo - Mezzemaniche.png',     'pasta_mezzemaniche',       'מזמניקה (500 גרם)'],
  ['פסטה Rustichella d\'Abruzzo - Pasta al Ceppo.png',   'pasta_al_ceppo',           'פסטה אל ציפו (500 גרם)'],
  ['פסטה Rustichella d\'Abruzzo - Trenne.png',           'pasta_trenne',             'טרנה (500 גרם)'],
  ['פסטו בזיליקום עם אגוזים.png',                        'basil_pesto_nuts',         'פסטו בזיליקום עם אגוזים'],
  ['פרג - בורגול עם עדשים.png',                          'bulgur_lentils',           'בורגול עם עדשים (500 גרם)'],
  ['פרג - זעתר בלאדי.png',                               'zaatar_baladi',            'זעתר בלאדי'],
  ['פרג - מג\'דרה אורז עם עדשים.png',                    'mejadra_rice_lentils',     'מג\'דרה אורז עם עדשים (500 גרם)'],
  ['פרג - קארי הודי.png',                                'indian_curry',             'קארי אדום'],
  ['פרג - קימל טחון כרוויה.png',                         'cumin_caraway',            'קימל טחון (כרוויה)'],
  ['פרג - קינואה עם ירקות.png',                          'quinoa_vegetables',        'קינואה עם ירקות (500 גרם)'],
  ['פרג - קינואה עם עדשים.png',                          'quinoa_lentils',           'קינואה עם עדשים (500 גרם)'],
  ['פרג - תבלין לשווארמה.png',                           'shawarma_spice',           'תבלין שווארמה ופרגית'],
  ['פרג - תיבול על הבייגל.png',                          'bagel_seasoning',          'תיבול על הבייגל'],
  ['קמח טמפורה.png',                                      'tempura_flour',            'טמפורה (500 גרם)'],
  ['שמן זית כתית מעולה - ארבקינה.png',                   'olive_oil_arbequina',      'שמן ארבקינה'],
  ['שמן זית כתית מעולה - נועם.png',                      'olive_oil_noam',           'שמן נעם'],
  ['שמן זית כתית מעולה - סורי.png',                      'olive_oil_souri',          'שמן סורי'],
  ['שמן זית כתית מעולה - פיקואל.png',                    'olive_oil_picual',         'שמן פיקואל'],
  ['שמן זית כתית מעולה - פיקולין.png',                   'olive_oil_picholine',      'שמן פישולן'],
  ['שמן זית כתית מעולה - קורוניקי.png',                  'olive_oil_koroneiki',      'שמן קורונייקי'],
  ['שמן זית כתית מעולה - קורטינה.png',                   'olive_oil_cortina',        'שמן קורטינה'],
  ['שמן זית כתית מעולה - שחר.png',                       'olive_oil_shahar',         'שמן שחר'],
  ['תערובת תבליני ים.png',                                'sea_spice_mix',            'תערובת תבלינית ים'],
];

async function upload(filePath, objectPath) {
  const body = fs.readFileSync(filePath);
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true',
      },
      body,
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function updateRowByName(name, imageUrl) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/additional_products?name=eq.${encodeURIComponent(name)}`,
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
  let ok = 0, skip = 0, err = 0, notFound = 0;
  for (const [filename, slug, productName] of mapping) {
    const localPath = path.join(SRC_DIR, filename);
    if (!fs.existsSync(localPath)) {
      console.log(`SKIP missing file: ${filename}`);
      skip++;
      continue;
    }
    const objectPath = `${BUCKET_FOLDER}/${slug}.png`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
    try {
      await upload(localPath, objectPath);
      const matched = await updateRowByName(productName, publicUrl);
      if (matched === 0) {
        console.log(`WARN no DB match for "${productName}" (uploaded ${slug}.png)`);
        notFound++;
      } else {
        console.log(`OK  ${slug}.png → "${productName}" (${matched} row)`);
        ok++;
      }
    } catch (e) {
      console.log(`ERR ${filename}: ${e.message}`);
      err++;
    }
  }
  console.log(`\nDone. ok=${ok}, no_db_match=${notFound}, skipped=${skip}, errors=${err}`);
})();
