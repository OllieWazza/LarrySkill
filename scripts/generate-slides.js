#!/usr/bin/env node
/**
 * Generate 6 TikTok slideshow images using the user's chosen image generation provider.
 * 
 * Supported providers:
 *   - openai (gpt-image-1.5, dall-e-3)
 *   - stability (Stable Diffusion via Stability AI API)
 *   - replicate (any model via Replicate API)
 *   - local (user provides pre-made images, skips generation)
 * 
 * Usage: node generate-slides.js --config <config.json> --output <dir> --prompts <prompts.json>
 * 
 * prompts.json format:
 * {
 *   "base": "Shared base prompt for all slides",
 *   "slides": ["Slide 1 additions", "Slide 2 additions", ...6 total]
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

const provider = config.imageGen?.provider || 'openai';
const model = config.imageGen?.model || 'gpt-image-1.5';
const apiKey = config.imageGen?.apiKey;

if (!apiKey && provider !== 'local') {
  console.error(`ERROR: No API key found in config.imageGen.apiKey for provider "${provider}"`);
  process.exit(1);
}

// ─── Provider: OpenAI ───────────────────────────────────────────────
async function generateOpenAI(prompt, outPath) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: '1024x1536',
      quality: 'high'
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  fs.writeFileSync(outPath, Buffer.from(data.data[0].b64_json, 'base64'));
}

// ─── Provider: Stability AI ─────────────────────────────────────────
async function generateStability(prompt, outPath) {
  const engineId = model || 'stable-diffusion-xl-1024-v1-0';
  const res = await fetch(`https://api.stability.ai/v1/generation/${engineId}/text-to-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale: 7,
      height: 1536,
      width: 1024,
      steps: 30,
      samples: 1
    })
  });
  const data = await res.json();
  if (data.message) throw new Error(data.message);
  fs.writeFileSync(outPath, Buffer.from(data.artifacts[0].base64, 'base64'));
}

// ─── Provider: Replicate ────────────────────────────────────────────
async function generateReplicate(prompt, outPath) {
  const replicateModel = model || 'black-forest-labs/flux-1.1-pro';
  
  // Create prediction
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: replicateModel,
      input: {
        prompt,
        width: 1024,
        height: 1536,
        num_outputs: 1
      }
    })
  });
  let prediction = await createRes.json();
  if (prediction.error) throw new Error(prediction.error.detail || prediction.error);

  // Poll for completion
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(prediction.urls.get, {
      headers: { 'Authorization': `Token ${apiKey}` }
    });
    prediction = await pollRes.json();
  }
  if (prediction.status === 'failed') throw new Error(prediction.error || 'Prediction failed');

  // Download image
  const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  const imgRes = await fetch(imageUrl);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

// ─── Provider: Local (skip generation) ──────────────────────────────
async function generateLocal(prompt, outPath) {
  const slideNum = path.basename(outPath).match(/\d+/)?.[0];
  const localPath = path.join(outputDir, `local_slide${slideNum}.png`);
  if (fs.existsSync(localPath)) {
    fs.copyFileSync(localPath, outPath);
  } else {
    throw new Error(`Place your image at ${localPath} — local provider skips generation`);
  }
}

// ─── Router ─────────────────────────────────────────────────────────
const providers = {
  openai: generateOpenAI,
  stability: generateStability,
  replicate: generateReplicate,
  local: generateLocal
};

async function generate(prompt, outPath) {
  const fn = providers[provider];
  if (!fn) {
    console.error(`Unknown provider: "${provider}". Supported: ${Object.keys(providers).join(', ')}`);
    process.exit(1);
  }
  console.log(`  Generating ${path.basename(outPath)} [${provider}/${model}]...`);
  await fn(prompt, outPath);
  console.log(`  ✅ ${path.basename(outPath)}`);
}

(async () => {
  console.log(`🎬 Generating 6 slides for ${config.app?.name || 'app'} using ${provider}/${model}\n`);
  let success = 0;
  for (let i = 0; i < 6; i++) {
    const fullPrompt = `${prompts.base}\n\n${prompts.slides[i]}`;
    try {
      await generate(fullPrompt, path.join(outputDir, `slide${i + 1}_raw.png`));
      success++;
    } catch (e) {
      console.error(`  ❌ Slide ${i + 1} failed: ${e.message}`);
    }
  }
  console.log(`\n✨ Generated ${success}/6 slides in ${outputDir}`);
  if (success < 6) process.exit(1);
})();
