// Script Node.js pour convertir toutes les images du dossier assets en webp et les compresser
// Nécessite le package sharp (npm install sharp)

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
const ROOT_DIR = __dirname;

function findImages(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findImages(filePath));
    } else {
      if (IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
        results.push(filePath);
      }
    }
  });
  return results;
}

async function convertToWebp(imagePath) {
  const outPath = imagePath.replace(/\.[^.]+$/, '.webp');
  // Si le webp existe déjà et est plus récent, on skip
  if (fs.existsSync(outPath)) {
    const imgStat = fs.statSync(imagePath);
    const webpStat = fs.statSync(outPath);
    if (webpStat.mtimeMs > imgStat.mtimeMs) return;
  }
  try {
    await sharp(imagePath)
      .webp({ quality: 75 }) // qualité ajustable
      .toFile(outPath);
    console.log(`Conversion: ${imagePath} -> ${outPath}`);
  } catch (e) {
    console.error(`Erreur lors de la conversion de ${imagePath}:`, e.message);
  }
}

async function main() {
  const images = findImages(ROOT_DIR);
  if (images.length === 0) {
    console.log('Aucune image trouvée.');
    return;
  }
  for (const img of images) {
    await convertToWebp(img);
  }
  console.log('Conversion terminée.');
}

main();
