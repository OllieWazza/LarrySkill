#!/usr/bin/env node
/**
 * Generate 6 TikTok slideshow images using OpenAI gpt-image-1.5
 * 
 * Usage: node generate-slides.js --config path/to/config.json --output path/to/output/ --prompts path/to/prompts.json
 * 
 * prompts.json format:
 * {
 *   "base": "Shared base prompt for all slides (architecture, camera, lighting)",
 *   "slides": [
 *     "Slide 1 style-specific additions",
 *     "Slide 2 style-specific additions",
 *     ...6 total
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}

const configPath = getArg('config');
const outputDir = getArg('output');
const promptsPath = getArg('prompts');

if (!configPath || !outputDir || !promptsPath) {
  console.error('Usage: node generate-slides.js --config <config.json> --output <dir> --prompts <prompts.json>');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));

if (!prompts.slides || prompts.slides.length !== 6) {
  console.error('ERROR: prompts.json must have exactly 6 slides');
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

async function generate(prompt, outPath) {
  console.log(`Generating ${path.basename(outPath)}...`);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openai.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-image-1.5',
      prompt,
      n: 1,
      size: '1024x1536',
      quality: 'high'
    })
  });
  const data = await res.json();
  if (data.error) {
    console.error(`ERROR: ${data.error.message}`);
    return false;
  }
  const buf = Buffer.from(data.data[0].b64_json, 'base64');
  fs.writeFileSync(outPath, buf);
  console.log(`  ✅ ${path.basename(outPath)}`);
  return true;
}

(async () => {
  console.log(`🎬 Generating 6 slides for ${config.app?.name || 'app'}...`);
  let success = 0;
  for (let i = 0; i < 6; i++) {
    const fullPrompt = `${prompts.base}\n\n${prompts.slides[i]}`;
    const ok = await generate(fullPrompt, path.join(outputDir, `slide${i + 1}_raw.png`));
    if (ok) success++;
  }
  console.log(`\n✨ Generated ${success}/6 slides in ${outputDir}`);
  if (success < 6) {
    console.error('⚠️  Some slides failed — check errors above and retry');
    process.exit(1);
  }
})();
