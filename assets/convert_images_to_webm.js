// Script Node.js pour convertir toutes les images du dossier assets en webm et les compresser
// Nécessite ffmpeg installé sur la machine

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
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

function convertToWebm(imagePath) {
  const outPath = imagePath.replace(/\.[^.]+$/, '.webm');
  // Si le webm existe déjà et est plus récent, on skip
  if (fs.existsSync(outPath)) {
    const imgStat = fs.statSync(imagePath);
    const webmStat = fs.statSync(outPath);
    if (webmStat.mtimeMs > imgStat.mtimeMs) return;
  }
  // Ajout de -loop 1 -t 1 pour générer une vidéo d'1 seconde à partir d'une image statique
  const cmd = `ffmpeg -y -loop 1 -t 1 -i "${imagePath}" -c:v libvpx-vp9 -crf 30 -b:v 0 -an -pix_fmt yuv420p -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" "${outPath}"`;
  try {
    console.log(`Conversion: ${imagePath} -> ${outPath}`);
    execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    console.error(`Erreur lors de la conversion de ${imagePath}:`, e.message);
  }
}

function main() {
  const images = findImages(ROOT_DIR);
  if (images.length === 0) {
    console.log('Aucune image trouvée.');
    return;
  }
  images.forEach(convertToWebm);
  console.log('Conversion terminée.');
}

main();
