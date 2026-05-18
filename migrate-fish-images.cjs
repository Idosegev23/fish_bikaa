/**
 * One-shot migration: upload local fish images to the new Supabase project's
 * fish-images bucket and update fish_types.image_url accordingly.
 *
 * Run: node migrate-fish-images.cjs
 * Requires SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY) in .env
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

const IMAGES_DIR = path.join(__dirname, 'dist/fish_img/bar-yam/new_imgs');
const BUCKET = 'fish-images';

// Map local files → DB row ID (current fish_types ids on new project)
const mapping = [
  { file: 'denis.png',          id: 17, name: 'דניס' },
  { file: 'lavrak.png',         id: 18, name: 'לברק' },
  { file: 'mosar.png',          id: 19, name: 'מוסר ים' },
  { file: 'locus.png',          id: 21, name: 'לוקוס' },
  { file: 'intias.png',         id: 22, name: 'אינטיאס' },
  { file: 'barbunia.png',       id: 23, name: 'ברבוניה' },
  { file: 'frida.png',          id: 29, name: 'גונבר' },
  { file: 'musht.png',          id: 30, name: 'מושט (אמנון)' },
  { file: 'buri.png',           id: 31, name: 'בורי' },
  { file: 'carpion.png',        id: 32, name: 'קרפיון' },
  { file: 'nesichat_nilos.png', id: 34, name: 'אדמונית' },
  { file: 'barramundi.png',     id: 35, name: 'ברמונדי' },
  { file: 'salmon.png',         id: 36, name: 'סלמון' },
  { file: 'red_tuna.png',       id: 38, name: 'טונה אדומה' },
  { file: 'barmindi.png',       id: null, name: '(extra)' }, // upload only
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

async function updateRow(id, imageUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/fish_types?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ image_url: imageUrl }),
  });
  if (!res.ok) throw new Error(`DB PATCH ${res.status}: ${await res.text()}`);
}

(async () => {
  let ok = 0, skip = 0, err = 0;
  for (const m of mapping) {
    const localPath = path.join(IMAGES_DIR, m.file);
    if (!fs.existsSync(localPath)) {
      console.log(`SKIP missing ${m.file}`);
      skip++;
      continue;
    }
    const objectPath = `fish/${m.file}`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
    try {
      await upload(localPath, objectPath);
      if (m.id != null) {
        await updateRow(m.id, publicUrl);
        console.log(`OK  ${m.file} → id ${m.id} (${m.name})`);
      } else {
        console.log(`OK  ${m.file} (uploaded only, no DB row)`);
      }
      ok++;
    } catch (e) {
      console.log(`ERR ${m.file}: ${e.message}`);
      err++;
    }
  }
  console.log(`\nDone. uploaded=${ok}, skipped=${skip}, errors=${err}`);
})();
