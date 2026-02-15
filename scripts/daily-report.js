#!/usr/bin/env node
/**
 * Daily marketing report: cross-reference TikTok performance with RevenueCat conversions.
 * 
 * Usage: node daily-report.js --config <config.json> [--days 3]
 * 
 * Pulls:
 * 1. TikTok post analytics from Postiz (last N days)
 * 2. Conversion data from rc-events.json (RevenueCat webhook log)
 * 3. Cross-references to identify which hooks drive revenue
 * 
 * Outputs: tiktok-marketing/reports/YYYY-MM-DD.md
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
}

const configPath = getArg('config');
const days = parseInt(getArg('days') || '3');

if (!configPath) {
  console.error('Usage: node daily-report.js --config <config.json> [--days 3]');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const baseDir = path.dirname(configPath);
const BASE_URL = 'https://api.postiz.com/public/v1';

async function fetchJSON(url, headers = {}) {
  const res = await fetch(url, { headers });
  return res.json();
}

(async () => {
  const now = new Date();
  const startDate = new Date(now - days * 86400000);
  const dateStr = now.toISOString().slice(0, 10);

  console.log(`📊 Generating daily report for ${dateStr} (last ${days} days)...\n`);

  // 1. Pull TikTok posts from Postiz
  let posts = [];
  try {
    const data = await fetchJSON(
      `${BASE_URL}/posts?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`,
      { 'Authorization': config.postiz.apiKey }
    );
    posts = data?.posts || [];
    console.log(`  📱 Found ${posts.length} TikTok posts`);

    // Fetch per-post analytics
    for (const post of posts) {
      try {
        const postAnalytics = await fetchJSON(
          `${BASE_URL}/analytics/post/${post.id}`,
          { 'Authorization': config.postiz.apiKey }
        );
        if (Array.isArray(postAnalytics) && postAnalytics.length > 0) {
          post.analytics = {};
          postAnalytics.forEach(metric => {
            const latest = metric.data?.[metric.data.length - 1];
            if (latest) post.analytics[metric.label.toLowerCase()] = parseInt(latest.total) || 0;
          });
        }
      } catch (e) { /* per-post analytics may not be available */ }
    }
  } catch (e) {
    console.log(`  ⚠️  Could not fetch Postiz data: ${e.message}`);
  }

  // Also pull platform-level stats for delta tracking
  let platformStats = {};
  for (const intId of [config.postiz.integrationId]) {
    try {
      const platform = await fetchJSON(
        `${BASE_URL}/analytics/${intId}`,
        { 'Authorization': config.postiz.apiKey }
      );
      if (Array.isArray(platform)) {
        platformStats[intId] = {};
        platform.forEach(m => {
          const latest = m.data?.[m.data.length - 1];
          platformStats[intId][m.label] = latest?.total || '0';
        });
      }
    } catch (e) { /* skip */ }
  }
  if (Object.keys(platformStats).length > 0) {
    console.log('  📈 Platform stats:', JSON.stringify(platformStats));
  }

  // 2. Pull RevenueCat events from webhook log
  let rcEvents = [];
  const rcPath = path.join(baseDir, 'rc-events.json');
  if (fs.existsSync(rcPath)) {
    const allEvents = JSON.parse(fs.readFileSync(rcPath, 'utf-8'));
    rcEvents = allEvents.filter(e => new Date(e.timestamp) >= startDate);
    console.log(`  💰 Found ${rcEvents.length} RC events in window`);
  } else {
    console.log(`  ⚠️  No rc-events.json found — skipping conversion data`);
    console.log(`     Create ${rcPath} with RevenueCat webhook events or manual entries`);
  }

  // 3. Calculate metrics
  const trials = rcEvents.filter(e => e.event === 'TRIAL_STARTED').length;
  const conversions = rcEvents.filter(e => 
    e.event === 'INITIAL_PURCHASE' || e.event === 'TRIAL_CONVERTED'
  ).length;
  const revenue = rcEvents
    .filter(e => e.event === 'INITIAL_PURCHASE' || e.event === 'TRIAL_CONVERTED' || e.event === 'RENEWAL')
    .reduce((sum, e) => sum + (e.revenue || 0), 0);

  // 4. Cross-reference: for each post, count conversions within 24h
  const postPerformance = posts.map(post => {
    const postDate = new Date(post.publishDate || post.createdAt);
    const windowEnd = new Date(postDate.getTime() + 24 * 3600000);
    const nearbyConversions = rcEvents.filter(e => {
      const t = new Date(e.timestamp);
      return t >= postDate && t <= windowEnd && 
        (e.event === 'INITIAL_PURCHASE' || e.event === 'TRIAL_CONVERTED' || e.event === 'TRIAL_STARTED');
    }).length;

    const views = post.analytics?.views || 0;
    const convRate = views > 0 ? (nearbyConversions / (views / 1000)).toFixed(2) : 'N/A';

    return {
      date: postDate.toISOString().slice(0, 10),
      hook: (post.content || '').substring(0, 60),
      views,
      likes: post.analytics?.likes || 0,
      saves: post.analytics?.saves || 0,
      comments: post.analytics?.comments || 0,
      conversions24h: nearbyConversions,
      convPer1kViews: convRate
    };
  });

  // Sort by views descending
  postPerformance.sort((a, b) => b.views - a.views);

  // 5. Generate report
  let report = `# Daily Marketing Report — ${dateStr}\n\n`;
  report += `## TikTok Performance (Last ${days} Days)\n`;
  report += `| Date | Hook | Views | Likes | Saves | Conv (24h) | Conv/1K Views |\n`;
  report += `|------|------|-------|-------|-------|------------|---------------|\n`;
  postPerformance.forEach(p => {
    report += `| ${p.date} | ${p.hook}... | ${p.views.toLocaleString()} | ${p.likes} | ${p.saves} | ${p.conversions24h} | ${p.convPer1kViews} |\n`;
  });

  report += `\n## Conversions (Last ${days} Days)\n`;
  report += `- New trials: ${trials}\n`;
  report += `- Paid conversions: ${conversions}\n`;
  report += `- Revenue: $${revenue.toFixed(2)}\n`;

  // 6. Diagnostic & Recommendations
  const avgViews = postPerformance.length > 0 
    ? postPerformance.reduce((s, p) => s + p.views, 0) / postPerformance.length : 0;
  const totalConversions = trials + conversions;
  const viewsGood = avgViews > 5000;
  const convsGood = totalConversions > 2;

  report += `\n## Diagnosis\n`;
  if (viewsGood && convsGood) {
    report += `✅ **Views good + Conversions good** — SCALE IT\n`;
    report += `- More of the same winning hooks\n`;
    report += `- Test different posting times for optimization\n`;
    report += `- Consider cross-posting to Instagram Reels & YouTube Shorts\n`;
  } else if (viewsGood && !convsGood) {
    report += `⚠️ **Views good + Conversions bad** — FIX THE CTA\n`;
    report += `- Hook is working but people aren't converting\n`;
    report += `- Try different CTAs on slide 6 (direct vs subtle)\n`;
    report += `- Check if app landing page matches the promise\n`;
    report += `- Test different caption structures\n`;
  } else if (!viewsGood && convsGood) {
    report += `⚠️ **Views bad + Conversions good** — FIX THE HOOKS\n`;
    report += `- People who see it DO convert — need more eyeballs\n`;
    report += `- Test radically different hook categories\n`;
    report += `- Try person+conflict, POV, listicle, mistakes formats\n`;
    report += `- Test different posting times and slide 1 thumbnails\n`;
  } else {
    report += `🔴 **Views bad + Conversions bad** — FULL RESET\n`;
    report += `- Try a completely different format/approach\n`;
    report += `- Study what's trending in the niche right now\n`;
    report += `- Consider different target audience angle\n`;
    report += `- Test new hook categories from scratch\n`;
  }

  report += `\n## Recommendations\n`;
  if (postPerformance.length > 0) {
    const best = postPerformance[0];
    report += `- Best performing: "${best.hook}..." (${best.views.toLocaleString()} views)\n`;
    if (best.conversions24h > 0) {
      report += `  → This hook drove ${best.conversions24h} conversions — DOUBLE DOWN\n`;
    }
    const worst = postPerformance[postPerformance.length - 1];
    if (worst.views < 1000) {
      report += `- Drop: "${worst.hook}..." (${worst.views} views — below 1K threshold)\n`;
    }
  }
  report += `\n### Suggested Next Hooks\n`;
  report += `Based on performance data, generate 3-5 new hooks:\n`;
  report += `- Variations of top performers (same formula, different character/room/scenario)\n`;
  report += `- 1 experimental hook from an untested category\n`;
  report += `- Ask user: "Want to use what's working, or try something new?"\n`;

  // Save report
  const reportsDir = path.join(baseDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `${dateStr}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`\n📋 Report saved to ${reportPath}`);

  // Also print to stdout
  console.log('\n' + report);
})();
