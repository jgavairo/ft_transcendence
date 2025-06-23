// Script d'optimisation des images pour ft_transcendence
// Utilisation : node scripts/optimize-images.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const fg = require('fast-glob');

const SRC_DIR = path.resolve(__dirname, '../../assets');
const DEST_DIR = path.resolve(__dirname, '../../assets_optimized');
const SIZE_LIMIT = 200 * 1024; // 200 Ko
const WEBP_QUALITY = 80;

console.log('SRC_DIR =', SRC_DIR);
console.log('DEST_DIR =', DEST_DIR);

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('[DIR CREATED]', dir);
  }
}

function getDestPath(srcPath) {
  const rel = path.relative(SRC_DIR, srcPath);
  return path.join(DEST_DIR, rel).replace(/\.(png|jpe?g)$/i, '.webp');
}

async function isDuplicate(file1, file2) {
  if (!fs.existsSync(file2)) return false;
  const b1 = fs.readFileSync(file1);
  const b2 = fs.readFileSync(file2);
  return b1.equals(b2);
}

async function optimizeImage(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  const stat = fs.statSync(srcPath);
  const destPath =
    (ext === '.webp') ? path.join(DEST_DIR, path.relative(SRC_DIR, srcPath)) : getDestPath(srcPath);
  await ensureDir(path.dirname(destPath));

  // Doublon exact ?
  if (fs.existsSync(destPath) && await isDuplicate(srcPath, destPath)) {
    console.log(`[DUPLICATE] ${srcPath} (identique à ${destPath})`);
    return;
  }

  if (ext === '.webp' || stat.size < SIZE_LIMIT) {
    // Copie brute si déjà optimisé ou petit
    fs.copyFileSync(srcPath, destPath);
    console.log(`[COPY] ${srcPath} -> ${destPath}`);
    return;
  }

  // Conversion WebP
  try {
    await sharp(srcPath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(destPath);
    console.log(`[OPTIMIZED] ${srcPath} -> ${destPath}`);
  } catch (e) {
    console.error(`[ERROR] ${srcPath}:`, e.message);
  }
}

async function main() {
  await ensureDir(DEST_DIR);
  const files = await fg(['**/*.{png,jpg,jpeg,webp}'], { cwd: SRC_DIR, absolute: true });
  console.log('Images trouvées :', files.length);
  if (files.length === 0) {
    console.log('Aucune image trouvée dans', SRC_DIR);
    return;
  }
  const seenHashes = new Map();
  const crypto = require('crypto');
  for (const file of files) {
    const buf = fs.readFileSync(file);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    if (seenHashes.has(hash)) {
      console.log(`[DUPLICATE] ${file} (identique à ${seenHashes.get(hash)})`);
      continue;
    }
    seenHashes.set(hash, file);
    await optimizeImage(file);
  }
  console.log('Optimisation terminée. Images optimisées dans assets_optimized/.');
}

main();
