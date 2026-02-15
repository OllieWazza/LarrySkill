#!/usr/bin/env node
/**
 * Check TikTok post analytics via Postiz API.
 * 
 * Usage: node check-analytics.js --config <config.json> [--days 7]
 * 
 * Pulls post-level analytics and platform-level stats.
 * Updates hook-performance.json with latest data.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}

const configPath = getArg('config');
const days = parseInt(getArg('days') || '7');

if (!configPath) {
  console.error('Usage: node check-analytics.js --config <config.json> [--days 7]');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const BASE_URL = 'https://api.postiz.com/public/v1';

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { 'Authorization': config.postiz.apiKey }
  });
  return res.json();
}

(async () => {
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - days * 86400000).toISOString();

  console.log(`📊 Fetching analytics (last ${days} days)...\n`);

  // Platform-level analytics
  console.log('=== Platform Stats ===');
  try {
    const platform = await fetchJSON(
      `${BASE_URL}/analytics/${config.postiz.integrationId}`
    );
    if (Array.isArray(platform)) {
      platform.forEach(metric => {
        const latest = metric.data?.[metric.data.length - 1];
        console.log(`  ${metric.label}: ${latest?.total || 'N/A'} (${metric.percentageChange > 0 ? '+' : ''}${metric.percentageChange}%)`);
      });
    }
  } catch (e) {
    console.log('  ⚠️  Platform analytics unavailable');
  }

  // Post-level analytics
  console.log('\n=== Post Analytics ===');
  try {
    const posts = await fetchJSON(
      `${BASE_URL}/posts?startDate=${startDate}&endDate=${endDate}`
    );
    
    if (posts?.posts && Array.isArray(posts.posts)) {
      console.log(`  Found ${posts.posts.length} posts\n`);
      
      const performanceFile = path.join(path.dirname(configPath), 'hook-performance.json');
      let performance = { posts: [] };
      if (fs.existsSync(performanceFile)) {
        performance = JSON.parse(fs.readFileSync(performanceFile, 'utf-8'));
      }

      posts.posts.forEach(post => {
        console.log(`  📌 ${post.content?.substring(0, 60)}...`);
        console.log(`     Date: ${post.publishDate || post.createdAt}`);
        if (post.analytics) {
          Object.entries(post.analytics).forEach(([key, val]) => {
            console.log(`     ${key}: ${val}`);
          });
        }
        console.log('');
      });

      fs.writeFileSync(performanceFile, JSON.stringify(performance, null, 2));
      console.log(`📋 Performance data saved to ${performanceFile}`);
    } else {
      console.log('  No posts found in date range');
    }
  } catch (e) {
    console.log(`  ⚠️  Post analytics error: ${e.message}`);
  }

  console.log('\n✨ Analytics check complete');
})();
