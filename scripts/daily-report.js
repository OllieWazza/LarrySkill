#!/usr/bin/env node
/**
 * Daily Marketing Report
 * 
 * Cross-references TikTok post analytics (via Postiz) with RevenueCat conversions
 * to identify which hooks drive views AND revenue.
 * 
 * Data sources:
 * 1. Postiz API → per-post TikTok analytics (views, likes, comments, shares)
 * 2. Postiz API → platform-level stats (followers, total views) for delta tracking
 * 3. RevenueCat API (optional) → trials, conversions, revenue
 * 
 * The diagnostic framework:
 * - High views + High conversions → SCALE (make variations of winning hooks)
 * - High views + Low conversions → FIX CTA (hook works, downstream is broken)  
 * - Low views + High conversions → FIX HOOKS (content converts, needs more eyeballs)
 * - Low views + Low conversions → FULL RESET (try radically different approach)
 * 
 * Usage: node daily-report.js --config <config.json> [--days 3]
 * Output: tiktok-marketing/reports/YYYY-MM-DD.md
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
const POSTIZ_URL = 'https://api.postiz.com/public/v1';

async function postizAPI(endpoint) {
  const res = await fetch(`${POSTIZ_URL}${endpoint}`, {
    headers: { 'Authorization': config.postiz.apiKey }
  });
  return res.json();
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// RevenueCat API (if configured)
async function getRevenueCatMetrics(startDate, endDate) {
  if (!config.revenuecat?.enabled || !config.revenuecat?.v2SecretKey) {
    return null;
  }
  
  const RC_URL = 'https://api.revenuecat.com/v2';
  const headers = {
    'Authorization': `Bearer ${config.revenuecat.v2SecretKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // Get overview metrics
    const overviewRes = await fetch(`${RC_URL}/projects/${config.revenuecat.projectId}/metrics/overview`, {
      headers
    });
    const overview = await overviewRes.json();

    // Get recent transactions for conversion attribution
    const txRes = await fetch(`${RC_URL}/projects/${config.revenuecat.projectId}/transactions?start_from=${startDate.toISOString()}&limit=100`, {
      headers
    });
    const transactions = await txRes.json();

    // Extract key metrics from overview array
    const metricsMap = {};
    if (overview.metrics) {
      overview.metrics.forEach(m => { metricsMap[m.id] = m.value; });
    }

    return {
      overview,
      transactions: transactions.items || [],
      mrr: metricsMap.mrr || 0,
      activeTrials: metricsMap.active_trials || 0,
      activeSubscribers: metricsMap.active_subscriptions || 0,
      activeUsers: metricsMap.active_users || 0,
      newCustomers: metricsMap.new_customers || 0,
      revenue: metricsMap.revenue || 0
    };
  } catch (e) {
    console.log(`  ⚠️ RevenueCat API error: ${e.message}`);
    return null;
  }
}

// Load previous day's snapshot for delta tracking
function loadPreviousSnapshot() {
  const snapshotPath = path.join(baseDir, 'analytics-snapshot.json');
  if (fs.existsSync(snapshotPath)) {
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  }
  return null;
}

// Load previous platform stats for delta tracking
function loadPreviousPlatformStats() {
  const statsPath = path.join(baseDir, 'platform-stats.json');
  if (fs.existsSync(statsPath)) {
    return JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
  }
  return null;
}

function savePlatformStats(stats) {
  const statsPath = path.join(baseDir, 'platform-stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

(async () => {
  const now = new Date();
  const startDate = new Date(now - days * 86400000);
  const dateStr = now.toISOString().slice(0, 10);

  console.log(`📊 Daily Report — ${dateStr} (last ${days} days)\n`);

  // ==========================================
  // 1. POSTIZ: Per-post analytics
  // ==========================================
  const postsData = await postizAPI(`/posts?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`);
  let posts = (postsData.posts || []).filter(p => 
    p.integration?.providerIdentifier === 'tiktok' &&
    p.releaseId && p.releaseId !== 'missing'
  );
  posts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

  console.log(`  📱 Found ${posts.length} connected TikTok posts\n`);

  const postResults = [];
  for (const post of posts) {
    const analytics = await postizAPI(`/analytics/post/${post.id}`);
    const metrics = {};
    if (Array.isArray(analytics)) {
      analytics.forEach(m => {
        const latest = m.data?.[m.data.length - 1];
        if (latest) metrics[m.label.toLowerCase()] = parseInt(latest.total) || 0;
      });
    }
    postResults.push({
      id: post.id,
      date: post.publishDate?.slice(0, 10),
      hook: (post.content || '').substring(0, 70),
      app: post.integration?.name,
      views: metrics.views || 0,
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0
    });
    await sleep(300);
  }

  // ==========================================
  // 2. POSTIZ: Platform-level stats (delta tracking)
  // ==========================================
  const platformStats = {};
  for (const [platform, intId] of Object.entries(config.postiz?.integrationIds || {})) {
    const stats = await postizAPI(`/analytics/${intId}`);
    if (Array.isArray(stats)) {
      platformStats[platform] = {};
      stats.forEach(m => {
        const latest = m.data?.[m.data.length - 1];
        platformStats[platform][m.label] = parseInt(latest?.total) || 0;
      });
    }
  }

  const prevPlatformStats = loadPreviousPlatformStats();
  savePlatformStats({ date: dateStr, stats: platformStats });

  // ==========================================
  // 3. REVENUECAT: Conversion metrics (optional)
  // ==========================================
  let rcMetrics = null;
  let rcPrevMetrics = null;
  
  if (config.revenuecat?.enabled) {
    console.log(`  💰 Fetching RevenueCat metrics...`);
    rcMetrics = await getRevenueCatMetrics(startDate, now);
    
    // Load previous RC snapshot for deltas
    const rcSnapshotPath = path.join(baseDir, 'rc-snapshot.json');
    if (fs.existsSync(rcSnapshotPath)) {
      rcPrevMetrics = JSON.parse(fs.readFileSync(rcSnapshotPath, 'utf-8'));
    }
    if (rcMetrics) {
      fs.writeFileSync(rcSnapshotPath, JSON.stringify({ date: dateStr, ...rcMetrics }, null, 2));
    }
  }

  // ==========================================
  // 4. GENERATE REPORT
  // ==========================================
  let report = `# Daily Marketing Report — ${dateStr}\n\n`;

  // Per-app breakdown
  const apps = [...new Set(postResults.map(p => p.app))];
  
  for (const app of apps) {
    const appPosts = postResults.filter(p => p.app === app);
    appPosts.sort((a, b) => b.views - a.views);

    report += `## ${app}\n\n`;
    report += `| Date | Hook | Views | Likes | Comments | Shares |\n`;
    report += `|------|------|------:|------:|---------:|-------:|\n`;
    
    for (const p of appPosts) {
      const viewStr = p.views > 1000 ? `${(p.views / 1000).toFixed(1)}K` : `${p.views}`;
      report += `| ${p.date} | ${p.hook.substring(0, 45)}... | ${viewStr} | ${p.likes} | ${p.comments} | ${p.shares} |\n`;
    }

    const totalViews = appPosts.reduce((s, p) => s + p.views, 0);
    const avgViews = appPosts.length > 0 ? Math.round(totalViews / appPosts.length) : 0;
    report += `\n**Total views:** ${totalViews.toLocaleString()} | **Avg per post:** ${avgViews.toLocaleString()}\n\n`;
  }

  // Platform deltas
  if (prevPlatformStats) {
    report += `## Platform Growth (since last report)\n\n`;
    for (const [platform, stats] of Object.entries(platformStats)) {
      const prev = prevPlatformStats.stats?.[platform];
      if (prev) {
        const followerDelta = (stats.Followers || 0) - (prev.Followers || 0);
        const viewDelta = (stats.Views || 0) - (prev.Views || 0);
        report += `**${platform}:** +${followerDelta} followers, +${viewDelta.toLocaleString()} views\n`;
      } else {
        report += `**${platform}:** ${stats.Followers || 0} followers, ${(stats.Views || 0).toLocaleString()} total views\n`;
      }
    }
    report += '\n';
  }

  // RevenueCat section
  if (rcMetrics) {
    report += `## Conversions (RevenueCat)\n\n`;
    report += `- **MRR:** $${rcMetrics.mrr}\n`;
    report += `- **Active subscribers:** ${rcMetrics.activeSubscribers}\n`;
    report += `- **Active trials:** ${rcMetrics.activeTrials}\n`;
    report += `- **Active users (28d):** ${rcMetrics.activeUsers}\n`;
    report += `- **New customers (28d):** ${rcMetrics.newCustomers}\n`;
    report += `- **Revenue (28d):** $${rcMetrics.revenue}\n`;

    if (rcPrevMetrics) {
      const mrrDelta = rcMetrics.mrr - (rcPrevMetrics.mrr || 0);
      const subDelta = rcMetrics.activeSubscribers - (rcPrevMetrics.activeSubscribers || 0);
      const trialDelta = rcMetrics.activeTrials - (rcPrevMetrics.activeTrials || 0);
      const userDelta = rcMetrics.activeUsers - (rcPrevMetrics.activeUsers || 0);
      const customerDelta = rcMetrics.newCustomers - (rcPrevMetrics.newCustomers || 0);

      report += `\n**Changes since last report:**\n`;
      report += `- MRR: ${mrrDelta >= 0 ? '+' : ''}$${mrrDelta}\n`;
      report += `- Subscribers: ${subDelta >= 0 ? '+' : ''}${subDelta}\n`;
      report += `- Trials: ${trialDelta >= 0 ? '+' : ''}${trialDelta}\n`;
      report += `- Active users: ${userDelta >= 0 ? '+' : ''}${userDelta}\n`;
      report += `- New customers: ${customerDelta >= 0 ? '+' : ''}${customerDelta}\n`;

      // Funnel diagnostic
      report += `\n**Funnel health:**\n`;
      if (customerDelta > 10 && subDelta === 0) {
        report += `- ⚠️ Users are downloading (${customerDelta > 0 ? '+' : ''}${customerDelta} new customers) but nobody is subscribing → **App issue** (onboarding/paywall/pricing)\n`;
      } else if (customerDelta > 10 && subDelta > 0) {
        report += `- ✅ Funnel working: +${customerDelta} customers → +${subDelta} subscribers (${((subDelta / customerDelta) * 100).toFixed(1)}% conversion)\n`;
      } else if (customerDelta <= 5) {
        report += `- ⚠️ Few new customers (${customerDelta > 0 ? '+' : ''}${customerDelta}) → **Marketing issue** (views not converting to downloads — check App Store page, link in bio)\n`;
      }
      if (userDelta > 20 && subDelta === 0) {
        report += `- 🔴 ${userDelta} active users but zero new subs → Users are trying the app but not paying. Check: Is the paywall too aggressive? Is the free experience too good? Is the value proposition clear?\n`;
      }
    }

    // Attribution: compare conversion spikes with post timing
    if (rcMetrics.transactions?.length > 0) {
      report += `\n### Conversion Attribution (last ${days} days)\n\n`;
      report += `Found ${rcMetrics.transactions.length} transactions. Cross-referencing with post timing:\n\n`;

      for (const p of postResults.slice(0, 10)) { // top 10 posts
        const postDate = new Date(p.date);
        const windowEnd = new Date(postDate.getTime() + 72 * 3600000);
        const nearbyTx = rcMetrics.transactions.filter(tx => {
          const txDate = new Date(tx.purchase_date || tx.created_at);
          return txDate >= postDate && txDate <= windowEnd;
        });
        if (nearbyTx.length > 0) {
          report += `- "${p.hook.substring(0, 40)}..." (${p.views.toLocaleString()} views) → **${nearbyTx.length} conversions within 72h**\n`;
        }
      }
    }
    report += '\n';
  }

  // ==========================================
  // 5. DIAGNOSTIC FRAMEWORK
  // ==========================================
  report += `## Diagnosis\n\n`;

  for (const app of apps) {
    const appPosts = postResults.filter(p => p.app === app);
    const avgViews = appPosts.length > 0 
      ? appPosts.reduce((s, p) => s + p.views, 0) / appPosts.length : 0;
    
    // Determine conversion quality (if RC available)
    let conversionGood = false;
    let hasConversionData = false;
    let usersGrowing = false;
    if (rcMetrics && rcPrevMetrics) {
      hasConversionData = true;
      const subDelta = rcMetrics.activeSubscribers - (rcPrevMetrics.activeSubscribers || 0);
      const trialDelta = rcMetrics.activeTrials - (rcPrevMetrics.activeTrials || 0);
      const userDelta = rcMetrics.activeUsers - (rcPrevMetrics.activeUsers || 0);
      conversionGood = (subDelta + trialDelta) > 2;
      usersGrowing = userDelta > 10;
    }

    const viewsGood = avgViews > 10000;

    report += `### ${app}\n\n`;

    if (viewsGood && (!hasConversionData || conversionGood)) {
      report += `🟢 **Views good${hasConversionData ? ' + Conversions good' : ''}** → SCALE IT\n`;
      report += `- Average ${Math.round(avgViews).toLocaleString()} views per post\n`;
      report += `- Make 3 variations of the top-performing hooks\n`;
      report += `- Test different posting times for optimization\n`;
      report += `- Cross-post to Instagram Reels & YouTube Shorts\n`;
    } else if (viewsGood && hasConversionData && !conversionGood) {
      report += `🟡 **Views good + Conversions poor** → FIX THE CTA\n`;
      report += `- People are watching (avg ${Math.round(avgViews).toLocaleString()} views) but not converting\n`;
      report += `- Try different CTAs on slide 6 (direct vs subtle)\n`;
      report += `- Check if app landing page matches the slideshow promise\n`;
      report += `- Test different caption structures\n`;
      report += `- DO NOT change the hooks — they're working\n`;
    } else if (!viewsGood && hasConversionData && conversionGood) {
      report += `🟡 **Views poor + Conversions good** → FIX THE HOOKS\n`;
      report += `- People who see it convert, but not enough see it (avg ${Math.round(avgViews).toLocaleString()} views)\n`;
      report += `- Test radically different hook categories\n`;
      report += `- Try person+conflict, POV, listicle, mistakes formats\n`;
      report += `- Test different posting times and slide 1 thumbnails\n`;
      report += `- DO NOT change the CTA — it's converting\n`;
    } else if (!viewsGood && (!hasConversionData || !conversionGood)) {
      report += `🔴 **Views poor${hasConversionData ? ' + Conversions poor' : ''}** → NEEDS WORK\n`;
      report += `- Average ${Math.round(avgViews).toLocaleString()} views per post\n`;
      report += `- Try radically different format/approach\n`;
      report += `- Research what's trending in the niche RIGHT NOW\n`;
      report += `- Consider different target audience angle\n`;
      report += `- Test new hook categories from scratch\n`;
      if (!hasConversionData) {
        report += `- ⚠️ No conversion data — consider connecting RevenueCat for full picture\n`;
      }
    }
    report += '\n';
  }

  // ==========================================
  // 6. HOOK PERFORMANCE TRACKING
  // ==========================================
  const hookPath = path.join(baseDir, 'hook-performance.json');
  let hookData = { hooks: [], rules: { doubleDown: [], testing: [], dropped: [] } };
  if (fs.existsSync(hookPath)) {
    hookData = JSON.parse(fs.readFileSync(hookPath, 'utf-8'));
  }

  // Update hook performance
  for (const p of postResults) {
    const existing = hookData.hooks.find(h => h.postId === p.id);
    if (existing) {
      existing.views = p.views;
      existing.likes = p.likes;
      existing.lastChecked = dateStr;
    } else {
      hookData.hooks.push({
        postId: p.id,
        text: p.hook,
        app: p.app,
        date: p.date,
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        lastChecked: dateStr
      });
    }
  }
  fs.writeFileSync(hookPath, JSON.stringify(hookData, null, 2));

  // ==========================================
  // 7. RECOMMENDATIONS
  // ==========================================
  report += `## Recommendations\n\n`;

  for (const app of apps) {
    const appPosts = postResults.filter(p => p.app === app);
    appPosts.sort((a, b) => b.views - a.views);

    report += `### ${app}\n\n`;
    
    if (appPosts.length > 0) {
      const best = appPosts[0];
      report += `**Best:** "${best.hook.substring(0, 50)}..." — ${best.views.toLocaleString()} views\n`;
      if (best.views >= 50000) {
        report += `→ 🔥 DOUBLE DOWN — make 3 variations of this hook immediately\n`;
      }

      const worst = appPosts[appPosts.length - 1];
      if (worst.views < 1000 && appPosts.length > 1) {
        report += `**Drop:** "${worst.hook.substring(0, 50)}..." — ${worst.views} views\n`;
      }
    }

    report += `\n**Suggested hooks for today:**\n`;
    report += `- [Variation of top performer]\n`;
    report += `- [New hook from untested category]\n`;
    report += `- [Competitor-inspired hook]\n\n`;
  }

  // ==========================================
  // 8. SAVE REPORT
  // ==========================================
  const reportsDir = path.join(baseDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `${dateStr}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`\n📋 Report saved to ${reportPath}`);
  console.log('\n' + report);
})();
