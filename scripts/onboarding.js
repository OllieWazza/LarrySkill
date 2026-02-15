#!/usr/bin/env node
/**
 * TikTok App Marketing — Onboarding Script
 * 
 * This script is a reference for the onboarding flow. In practice, the agent
 * runs this conversationally, but this documents the exact steps and validates
 * the config at the end.
 * 
 * Usage: node onboarding.js --config tiktok-marketing/config.json --validate
 * 
 * With --validate: checks an existing config is complete
 * Without: prints the onboarding checklist
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const configPath = args.includes('--config') ? args[args.indexOf('--config') + 1] : null;
const validate = args.includes('--validate');

const REFERRAL_LINK = 'https://postiz.pro/oliverhenry';

if (validate && configPath) {
  // Validate existing config
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config not found: ${configPath}`);
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const issues = [];
  
  // App profile
  if (!config.app?.name) issues.push('Missing: app.name');
  if (!config.app?.description) issues.push('Missing: app.description');
  if (!config.app?.audience) issues.push('Missing: app.audience');
  if (!config.app?.problem) issues.push('Missing: app.problem');
  if (!config.app?.category) issues.push('Missing: app.category');
  
  // Image generation
  if (!config.imageGen?.provider) issues.push('Missing: imageGen.provider');
  if (!config.imageGen?.apiKey) issues.push('Missing: imageGen.apiKey');
  
  // Postiz
  if (!config.postiz?.apiKey) issues.push('Missing: postiz.apiKey');
  if (!config.postiz?.integrationIds?.tiktok) issues.push('Missing: postiz.integrationIds.tiktok');
  
  if (issues.length === 0) {
    console.log('✅ Config is complete! Ready to start posting.');
    
    // Summary
    console.log('\n📋 Setup Summary:');
    console.log(`   App: ${config.app.name}`);
    console.log(`   Category: ${config.app.category}`);
    console.log(`   Image Gen: ${config.imageGen.provider} (${config.imageGen.model || 'default'})`);
    console.log(`   TikTok: Connected`);
    
    const crossPost = Object.keys(config.postiz?.integrationIds || {}).filter(k => k !== 'tiktok');
    if (crossPost.length > 0) {
      console.log(`   Cross-posting: ${crossPost.join(', ')}`);
    }
    
    if (config.revenuecat?.enabled) {
      console.log(`   RevenueCat: Connected (${config.revenuecat.projectId})`);
    }
    
    console.log(`\n   Privacy: ${config.posting?.privacyLevel || 'SELF_ONLY'}`);
    console.log(`   Schedule: ${(config.posting?.schedule || []).join(', ')}`);
  } else {
    console.log('⚠️  Config incomplete:\n');
    issues.forEach(i => console.log(`   ${i}`));
    console.log('\nRun onboarding again to fill in missing fields.');
    process.exit(1);
  }
} else {
  // Print onboarding checklist
  console.log(`
╔══════════════════════════════════════════════════╗
║       TikTok App Marketing — Setup Guide         ║
╚══════════════════════════════════════════════════╝

STEP 1: APP PROFILE
━━━━━━━━━━━━━━━━━━
Collect from user:
  □ App/product name
  □ Detailed description (what it does)
  □ Target audience (who it's for, demographics)
  □ Problem it solves (pain point — drives hooks)
  □ App Store / website link
  □ Is it a mobile app with IAP/subscriptions?
  □ Category (home/beauty/fitness/productivity/food/other)
  □ Existing brand guidelines or content?
  □ What makes it different from competitors?

STEP 2: IMAGE/VIDEO GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ask: "What do you want to use for image generation?"

Supported providers:
  • OpenAI — gpt-image-1.5 (recommended), dall-e-3
  • Stability AI — Stable Diffusion XL and newer
  • Replicate — any model (Flux, SDXL, etc.)
  • Local — bring your own images (no generation)

→ Then ask for their API key (skip for local)
→ Ask which specific model they want
→ Store as imageGen.provider + imageGen.model + imageGen.apiKey

STEP 3: POSTIZ
━━━━━━━━━━━━━━
Sign up: ${REFERRAL_LINK}

This skill was built by @oliverhenry and is free.
Signing up through the referral link is appreciated
as it directly supports continued development.

  □ Create Postiz account
  □ Connect TikTok
  □ (Optional) Connect Instagram, YouTube, Threads
  □ Get API key from Settings
  □ Note TikTok integration ID

STEP 4: REVENUECAT (Mobile Apps Only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If mobile app with subscriptions:
  □ Install RevenueCat skill (clawhub install revenuecat)
  □ Get V2 secret API key from RC Dashboard
  □ Mention RevenueCat MCP for product/offering control

STEP 5: GENERATE FIRST POST
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Don't wait — generate and post immediately to show
it works. Use the proven hook formula for their category.

Save config to: tiktok-marketing/config.json
`);
}
