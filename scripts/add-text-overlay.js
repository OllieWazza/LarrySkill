#!/usr/bin/env node
/**
 * Add text overlays to slideshow images using node-canvas.
 * 
 * Usage: node add-text-overlay.js --input <dir> --texts <texts.json>
 * 
 * texts.json format:
 * [
 *   "Slide 1 text\nwith line breaks",
 *   "Slide 2 text",
 *   ... 6 total
 * ]
 * 
 * Reads slide1_raw.png through slide6_raw.png, outputs slide1.png through slide6.png.
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}

const inputDir = getArg('input');
const textsPath = getArg('texts');

if (!inputDir || !textsPath) {
  console.error('Usage: node add-text-overlay.js --input <dir> --texts <texts.json>');
  process.exit(1);
}

const texts = JSON.parse(fs.readFileSync(textsPath, 'utf-8'));
if (texts.length !== 6) {
  console.error('ERROR: texts.json must have exactly 6 entries');
  process.exit(1);
}

async function addTextOverlay(imgPath, text, outPath) {
  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const fontSize = Math.round(img.width * 0.065);  // 6.5% of width
  const outlineWidth = Math.round(fontSize * 0.15); // 15% of font size
  const maxWidth = img.width * 0.75;                // 75% max width
  const lineHeight = fontSize * 1.25;

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Strip emoji (canvas can't render them reliably)
  const cleanText = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
  const lines = cleanText.split('\n');
  const x = img.width / 2;
  const startY = img.height * 0.30;  // 30% from top

  for (let i = 0; i < lines.length; i++) {
    const y = startY + (i * lineHeight);
    // Black outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = outlineWidth;
    ctx.lineJoin = 'round';
    ctx.strokeText(lines[i], x, y, maxWidth);
    // White fill
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines[i], x, y, maxWidth);
  }

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`  ✅ ${path.basename(outPath)}`);
}

(async () => {
  console.log('📝 Adding text overlays...');
  for (let i = 0; i < 6; i++) {
    const rawPath = path.join(inputDir, `slide${i + 1}_raw.png`);
    const outPath = path.join(inputDir, `slide${i + 1}.png`);
    if (!fs.existsSync(rawPath)) {
      console.error(`  ❌ Missing: ${rawPath}`);
      continue;
    }
    await addTextOverlay(rawPath, texts[i], outPath);
  }
  console.log('✨ Done!');
})();
