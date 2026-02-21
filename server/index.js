const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');
const CACHE_PATH = path.join(DATA_DIR, 'cache.json');
const QUEUE_PATH = path.join(DATA_DIR, 'queue.json');
const SNAPSHOTS_PATH = path.join(DATA_DIR, 'snapshots.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); } catch { return {}; }
}
function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}
function loadHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8')); } catch { return { followerSnapshots: [], tweetCache: [], usage: {} }; }
}
function saveHistory(h) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2));
}

// ===== CACHE SYSTEM =====
// Stores in data/cache.json with TTL support
function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')); } catch { return {}; }
}
function saveCache(c) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(c, null, 2));
}
function loadQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8')); }
  catch { return { scheduled: [], drafts: [], posted: [], failed: [] }; }
}
function saveQueue(q) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2));
}
function loadSnapshots() {
  try { return JSON.parse(fs.readFileSync(SNAPSHOTS_PATH, 'utf-8')); }
  catch { return { tweets: {}, daily: {} }; }
}
function saveSnapshots(s) {
  fs.writeFileSync(SNAPSHOTS_PATH, JSON.stringify(s, null, 2));
}
function getCached(key, ttlMs) {
  const cache = loadCache();
  const entry = cache[key];
  if (entry && (Date.now() - entry.ts) < ttlMs) return entry.data;
  return null;
}
function setCache(key, data) {
  const cache = loadCache();
  cache[key] = { data, ts: Date.now() };
  saveCache(cache);
}

// ===== INTEREST MAP =====
// Maps category names → keywords used for fuzzy matching
const INTEREST_MAP = {
  'Startups':       ['startup', 'founder', 'bootstrapped', 'indie hacker', 'saas', 'building in public', 'solopreneur'],
  'AI/ML':          ['ai', 'artificial intelligence', 'machine learning', 'gpt', 'llm', 'neural', 'deep learning', 'openai', 'claude', 'chatgpt'],
  'Marketing':      ['marketing', 'growth hacking', 'seo', 'content marketing', 'social media', 'ads', 'viral', 'copywriting', 'funnel'],
  'SaaS':           ['saas', 'mrr', 'arr', 'churn', 'subscription', 'b2b', 'recurring revenue'],
  'Web3':           ['web3', 'crypto', 'blockchain', 'defi', 'nft', 'ethereum', 'bitcoin', 'token'],
  'Design':         ['design', 'ui ', 'ux ', 'figma', 'typography', 'branding', 'visual design', 'product design'],
  'Mobile':         ['ios', 'android', 'mobile app', 'app store', 'swift', 'react native', 'flutter'],
  'Investing':      ['invest', 'venture capital', 'angel invest', 'portfolio', 'funding round', 'raise', 'vc'],
  'Sales':          ['sales', 'revenue', 'pipeline', 'crm', 'outreach', 'conversion rate', 'close deals'],
  'Leadership':     ['leadership', 'management', 'team culture', 'hiring', 'ceo', 'exec', 'delegation'],
  'Entrepreneurship': ['entrepreneur', 'bootstrapped', 'startup', 'side project', 'solopreneur', 'indie'],
  'Cybersecurity':  ['cybersecurity', 'hacking', 'vulnerability', 'cyber attack', 'breach', 'encryption', 'infosec'],
  'DevOps':         ['devops', 'kubernetes', 'docker', 'ci/cd', 'deployment', 'infrastructure', 'cloud'],
  'Writing':        ['writing', 'newsletter', 'copywriting', 'storytelling', 'blog', 'content creator'],
  'Photography':    ['photography', 'photo', 'camera', 'lightroom', 'shoot'],
  'Music':          ['music', 'song', 'artist', 'producer', 'spotify'],
  'Film':           ['film', 'movie', 'cinema', 'director', 'video'],
  'Art':            ['art', 'artist', 'illustration', 'sketch', 'gallery'],
  'Fitness':        ['fitness', 'gym', 'workout', 'nutrition', 'training', 'running'],
  'Travel':         ['travel', 'nomad', 'remote work', 'country', 'digital nomad'],
  'Food':           ['food', 'restaurant', 'recipe', 'cooking', 'chef'],
  'Fashion':        ['fashion', 'style', 'outfit', 'clothing', 'streetwear'],
  'Wellness':       ['wellness', 'mental health', 'wellbeing', 'self care'],
  'Mindfulness':    ['mindfulness', 'meditation', 'calm', 'anxiety', 'stress', 'zen'],
  'Physics':        ['physics', 'quantum', 'particle', 'relativity'],
  'Biology':        ['biology', 'genetics', 'evolution', 'dna', 'cells'],
  'Space':          ['space', 'nasa', 'rocket', 'planet', 'galaxy', 'astronomy'],
  'Climate':        ['climate', 'environment', 'carbon', 'sustainability', 'renewable', 'green energy'],
  'Medicine':       ['medicine', 'healthcare', 'doctor', 'treatment', 'disease', 'pharma'],
  'Psychology':     ['psychology', 'behavior', 'cognition', 'mental health', 'therapy'],
  'Crypto':         ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'web3', 'token'],
  'Stocks':         ['stocks', 'stock market', 'equity', 'trading', 'wall street', 'nasdaq'],
  'Real Estate':    ['real estate', 'property', 'mortgage', 'housing', 'landlord'],
  'Personal Finance': ['personal finance', 'saving', 'budget', 'debt free', 'fire movement', 'money'],
  'Economics':      ['economics', 'economy', 'gdp', 'inflation', 'policy', 'recession'],
  'Trading':        ['trading', 'forex', 'options', 'futures', 'technical analysis', 'chart'],
};

// Detect which interest categories match a blob of text
function detectInterestsFromText(text) {
  const lower = text.toLowerCase();
  const matched = new Set();
  for (const [category, keywords] of Object.entries(INTEREST_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matched.add(category);
        break;
      }
    }
  }
  return [...matched];
}

// Check if a trend string matches any of the user's interests (using INTEREST_MAP)
function trendMatchesInterests(trend, interests) {
  const trendLower = trend.toLowerCase();
  for (const interest of interests) {
    if (trendLower.includes(interest.toLowerCase())) return interest;
    const keywords = INTEREST_MAP[interest] || [];
    for (const kw of keywords) {
      if (trendLower.includes(kw)) return interest;
    }
  }
  return null;
}

// Track API usage locally
function trackUsage(type, count = 1) {
  const history = loadHistory();
  const today = new Date().toISOString().slice(0, 10);
  if (!history.usage) history.usage = {};
  if (!history.usage[today]) history.usage[today] = { postReads: 0, userLookups: 0, postsCreated: 0, searches: 0 };
  history.usage[today][type] = (history.usage[today][type] || 0) + count;
  saveHistory(history);
}

// ===== COOKIE AUTH for real metrics =====
// Uses auth_token + ct0 cookies to access non_public_metrics via X's internal API
const X_INTERNAL_BEARER = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

function hasCookieAuth(config) {
  // Cookie auth doesn't work for v2 endpoints (returns 403 "Unsupported Authentication")
  // Need OAuth 2.0 User Context or OAuth 1.0a for non_public_metrics
  // Disabled until proper OAuth is implemented
  return false;
  // return !!(config.authToken && config.ct0);
}

async function xCookieGet(path, config, params = {}) {
  const url = new URL(`https://x.com/i/api${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      'authorization': `Bearer ${X_INTERNAL_BEARER}`,
      'cookie': `auth_token=${config.authToken}; ct0=${config.ct0}`,
      'x-csrf-token': config.ct0,
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Cookie auth error ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

// Fetch real metrics (non_public_metrics) for tweet IDs using cookie auth
async function fetchRealMetrics(tweetIds, config) {
  if (!hasCookieAuth(config) || tweetIds.length === 0) return {};

  const metrics = {};
  // API allows up to 100 IDs per request
  for (let i = 0; i < tweetIds.length; i += 100) {
    const batch = tweetIds.slice(i, i + 100);
    try {
      const data = await xCookieGet('/2/tweets', config, {
        'ids': batch.join(','),
        'tweet.fields': 'public_metrics,non_public_metrics,organic_metrics,created_at'
      });
      (data.data || []).forEach(t => {
        metrics[t.id] = {
          non_public: t.non_public_metrics || null,
          organic: t.organic_metrics || null,
          public: t.public_metrics || null,
        };
      });
    } catch (e) {
      console.error('[cookie-auth] fetchRealMetrics error:', e.message);
      break; // Don't keep trying if cookies are invalid
    }
  }
  return metrics;
}

// Get the best impression count — prefer non_public_metrics over public_metrics
function getBestImpressions(tweetId, publicMetrics, realMetricsMap) {
  const real = realMetricsMap?.[tweetId];
  if (real?.non_public?.impression_count != null) return real.non_public.impression_count;
  if (real?.organic?.impression_count != null) return real.organic.impression_count;
  return publicMetrics?.impression_count || 0;
}

// X API helpers
async function xGet(endpoint, config, params = {}) {
  const url = new URL(`https://api.x.com/2${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${config.bearerToken}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.title || `X API error ${res.status}`);
  }
  return res.json();
}

async function xPost(endpoint, config, body) {
  // OAuth 1.0a for user-context endpoints (posting)
  const oauth = generateOAuth(config, 'POST', `https://api.x.com/2${endpoint}`, {});
  const res = await fetch(`https://api.x.com/2${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': oauth,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

// Simple OAuth 1.0a signature generation
function generateOAuth(config, method, url, params) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const oauthParams = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: config.accessToken,
    oauth_version: '1.0'
  };
  
  const allParams = { ...oauthParams, ...params };
  const sortedParams = Object.keys(allParams).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`).join('&');
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(config.apiSecret)}&${encodeURIComponent(config.accessSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  
  oauthParams.oauth_signature = signature;
  const header = Object.keys(oauthParams).sort().map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`).join(', ');
  return `OAuth ${header}`;
}

// ===== API ROUTES =====

// Config check (used by App to redirect to onboarding)
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  const history = loadHistory();
  const monthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthUsage = {};
  Object.entries(history.usage || {}).forEach(([date, counts]) => {
    if (date.startsWith(monthPrefix)) {
      Object.entries(counts).forEach(([k, v]) => {
        monthUsage[k] = (monthUsage[k] || 0) + v;
      });
    }
  });
  
  res.json({
    configured: !!config.bearerToken,
    user: config.username ? { username: config.username, name: config.displayName } : null,
    credits: {
      balance: config.creditBalance || null,
      calls: Object.values(monthUsage).reduce((a, b) => a + b, 0),
      limit: 10000,
      xUsage: null // populated by /api/x-usage
    }
  });
});

// Save config
app.post('/api/config', (req, res) => {
  const existing = loadConfig();
  const updated = { ...existing, ...req.body };
  saveConfig(updated);
  res.json({ ok: true });
});

// Test cookie auth connection
app.post('/api/test-cookie-auth', async (req, res) => {
  try {
    const config = loadConfig();
    const authToken = req.body.authToken || config.authToken;
    const ct0 = req.body.ct0 || config.ct0;
    if (!authToken || !ct0) return res.json({ success: false, error: 'authToken and ct0 are required' });

    const testConfig = { ...config, authToken, ct0 };
    const data = await xCookieGet('/2/tweets/search/recent', testConfig, {
      'query': `from:${config.username || 'twitter'}`,
      'max_results': '1',
      'tweet.fields': 'non_public_metrics,public_metrics'
    });

    const hasNonPublic = !!(data.data?.[0]?.non_public_metrics);
    res.json({
      success: true,
      hasNonPublicMetrics: hasNonPublic,
      message: hasNonPublic
        ? '✅ Cookie auth working — real impression data available!'
        : '⚠️ Connected but non_public_metrics not returned. Cookies may need refreshing.'
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Verify Twitter bearer token connection
app.get('/api/twitter/verify', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.bearerToken) return res.json({ ok: false, error: 'No bearer token' });
    const data = await xGet(`/users/by/username/${config.username || 'twitter'}`, config);
    res.json({ ok: !!data.data });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Test connection
app.post('/api/test-connection', async (req, res) => {
  try {
    const username = req.body.username?.replace('@', '').trim();
    if (!username) throw new Error('Please enter your X username');
    
    const data = await xGet(`/users/by/username/${username}`, req.body, {
      'user.fields': 'public_metrics,description,profile_image_url'
    });
    trackUsage('userLookups');
    
    if (!data.data) throw new Error(data.errors?.[0]?.detail || 'User not found');
    
    // Save the user info
    const config = loadConfig();
    config.userId = data.data.id;
    config.username = data.data.username;
    config.displayName = data.data.name;
    saveConfig({ ...config, ...req.body });
    
    res.json({
      success: true,
      username: data.data.username,
      name: data.data.name,
      followers: data.data.public_metrics?.followers_count,
      tweets: data.data.public_metrics?.tweet_count
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Dashboard — cache 15 minutes
app.get('/api/dashboard', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({});

  const period = req.query.period || '7d';
  const days   = period === '90d' ? 90 : period === '30d' ? 30 : 7;

  const cacheKey = `dashboard:${config.username}:${period}`;
  const cached = getCached(cacheKey, 900000); // 15 min
  if (cached) return res.json({ ...cached, lastUpdated: 'cached' });

  console.log('[dashboard] fetching fresh data...');
  try {
    // Get user info
    console.log('[dashboard] fetching user info...');
    const me = await xGet(`/users/by/username/${config.username}`, config, {
      'user.fields': 'public_metrics,created_at'
    });
    trackUsage('userLookups');
    
    if (!me.data) throw new Error('User not found');
    config.userId = me.data.id;
    saveConfig(config);
    const metrics = me.data.public_metrics;

    // Get tweets for selected period (max_results 100)
    const startTime = new Date(Date.now() - days * 86400000).toISOString();
    console.log('[dashboard] fetching tweets...');
    const tweets = await xGet(`/users/${me.data.id}/tweets`, config, {
      'max_results': '100',
      'tweet.fields': 'public_metrics,created_at',
      'exclude': 'retweets,replies',
      'start_time': startTime
    });
    console.log(`[dashboard] got ${tweets.data?.length || 0} tweets`);
    trackUsage('postReads', tweets.data?.length || 0);
    
    // Save follower snapshot on every dashboard load (once per day)
    const history = loadHistory();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (!history.followerSnapshots) history.followerSnapshots = [];
    const existingToday = history.followerSnapshots.find(s => s.date === today);
    if (!existingToday) {
      history.followerSnapshots.push({ date: today, followers: metrics.followers_count });
      // Keep last 90 days
      if (history.followerSnapshots.length > 90) history.followerSnapshots = history.followerSnapshots.slice(-90);
    }
    
    // Always cache tweets for voice-matching / analysis
    history.tweetCache = (tweets.data || []).map(t => ({
      id: t.id,
      text: t.text,
      ...t.public_metrics,
      created_at: t.created_at
    }));
    saveHistory(history);
    
    // Calculate best posting times from recent tweets
    const tweetsByHour = {};
    (tweets.data || []).forEach(t => {
      const d = new Date(t.created_at);
      const day = d.toLocaleDateString('en-US', { weekday: 'short' });
      const hour = d.getHours();
      const key = `${day} ${hour}:00`;
      if (!tweetsByHour[key]) tweetsByHour[key] = [];
      const eng = (t.public_metrics.like_count + t.public_metrics.retweet_count + t.public_metrics.reply_count);
      tweetsByHour[key].push(eng);
    });
    
    const bestTimes = Object.entries(tweetsByHour)
      .map(([key, engs]) => {
        const [day, time] = key.split(' ');
        return { day, time, avgEngagement: Math.round(engs.reduce((a, b) => a + b, 0) / engs.length) };
      })
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);
    
    // Fetch real metrics via cookie auth if available
    let realMetrics = {};
    if (hasCookieAuth(config) && tweets.data?.length > 0) {
      try {
        realMetrics = await fetchRealMetrics(tweets.data.map(t => t.id), config);
        console.log(`[dashboard] fetched real metrics for ${Object.keys(realMetrics).length} tweets via cookie auth`);
      } catch (e) {
        console.error('[dashboard] cookie auth metrics error:', e.message);
      }
    }
    const usingRealMetrics = Object.keys(realMetrics).length > 0;

    // Format recent tweets
    const recentTweets = (tweets.data || [])
      .map(t => ({
        text: t.text,
        impressions: getBestImpressions(t.id, t.public_metrics, realMetrics),
        likes: t.public_metrics.like_count,
        retweets: t.public_metrics.retweet_count,
        replies: t.public_metrics.reply_count,
        timeAgo: timeAgo(new Date(t.created_at)),
        realMetrics: !!realMetrics[t.id]?.non_public
      }))
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
    
    // Calculate daily views + engagement from tweets (using real metrics when available)
    const dailyEngagement = {};
    (tweets.data || []).forEach(t => {
      const day = t.created_at?.slice(0, 10);
      if (!day) return;
      if (!dailyEngagement[day]) dailyEngagement[day] = { date: day.slice(5), views: 0, likes: 0, retweets: 0, replies: 0 };
      dailyEngagement[day].views += getBestImpressions(t.id, t.public_metrics, realMetrics);
      dailyEngagement[day].likes += t.public_metrics.like_count || 0;
      dailyEngagement[day].retweets += t.public_metrics.retweet_count || 0;
      dailyEngagement[day].replies += t.public_metrics.reply_count || 0;
    });

    // Aggregate stats — totalViews uses real metrics when available
    const totalViews = (tweets.data || []).reduce((s, t) => s + getBestImpressions(t.id, t.public_metrics, realMetrics), 0);
    const totalEng = (tweets.data || []).reduce((s, t) => s + (t.public_metrics.like_count || 0) + (t.public_metrics.retweet_count || 0) + (t.public_metrics.reply_count || 0), 0);
    const engagementRate = totalViews > 0 ? Math.round((totalEng / totalViews) * 1000) / 10 : 0;

    // New followers (today) — diff between today's and yesterday's snapshot
    const todaySnap     = history.followerSnapshots?.find(s => s.date === today);
    const yesterdaySnap = history.followerSnapshots?.find(s => s.date === yesterday);
    // Only show delta if we have both today + yesterday (so one snapshot won't give wrong data)
    const newFollowers = (todaySnap && yesterdaySnap)
      ? todaySnap.followers - yesterdaySnap.followers
      : null;

    const result = {
      stats: {
        followers: metrics.followers_count,
        followersChange: calcChange(history.followerSnapshots, 'followers'),
        newFollowers,
        totalViews,
        engagementRate,
        period,
      },
      dailyEngagement: Object.values(dailyEngagement).sort((a, b) => a.date.localeCompare(b.date)),
      followerHistory: (history.followerSnapshots || []).slice(-days).map(s => ({
        date: s.date.slice(5),
        followers: s.followers
      })),
      bestTimes,
      recentTweets: recentTweets.slice(0, 10),
      usingRealMetrics,
      lastUpdated: 'just now'
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Analytics — cache 30 minutes per period key (v2: full SuperX-style payload)
app.get('/api/analytics', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken || !config.userId) return res.json({ tweets: [], dailyViews: [] });

  const period    = req.query.period || '7d';
  const days      = period === '90d' ? 90 : period === '30d' ? 30 : 7;
  const startTime = new Date(Date.now() - days * 86400000).toISOString();
  const prevStart = new Date(Date.now() - days * 2 * 86400000).toISOString();

  const cacheKey = `analytics_v2:${config.username}:${period}`;
  const cached   = getCached(cacheKey, 1800000); // 30 min
  if (cached) return res.json(cached);

  try {
    // ── Fetch current period ──────────────────────────────────────
    const currentResp = await xGet(`/users/${config.userId}/tweets`, config, {
      'max_results': '100',
      'tweet.fields': 'public_metrics,created_at',
      'exclude':      'retweets,replies',
      'start_time':   startTime
    });
    trackUsage('postReads', currentResp.data?.length || 0);
    const currentTweets = currentResp.data || [];

    // ── Fetch previous period (for change deltas) ──────────────────
    let prevTweets = [];
    try {
      const prevResp = await xGet(`/users/${config.userId}/tweets`, config, {
        'max_results': '100',
        'tweet.fields': 'public_metrics,created_at',
        'exclude':      'retweets,replies',
        'start_time':   prevStart,
        'end_time':     startTime
      });
      trackUsage('postReads', prevResp.data?.length || 0);
      prevTweets = prevResp.data || [];
    } catch (e) {
      console.error('[analytics] prev-period fetch error:', e.message);
    }

    // ── Fetch real metrics via cookie auth ──────────────────────────
    let realMetrics = {};
    if (hasCookieAuth(config) && currentTweets.length > 0) {
      try {
        const allIds = [...currentTweets, ...prevTweets].map(t => t.id);
        realMetrics = await fetchRealMetrics(allIds, config);
        console.log(`[analytics] fetched real metrics for ${Object.keys(realMetrics).length} tweets via cookie auth`);
      } catch (e) {
        console.error('[analytics] cookie auth metrics error:', e.message);
      }
    }
    const usingRealMetrics = Object.keys(realMetrics).length > 0;

    // ── Aggregate helper ──────────────────────────────────────────
    function sumMetrics(tweets) {
      return tweets.reduce((acc, t) => {
        const m = t.public_metrics;
        acc.impressions += getBestImpressions(t.id, m, realMetrics);
        acc.likes       += m.like_count        || 0;
        acc.retweets    += m.retweet_count     || 0;
        acc.replies     += m.reply_count       || 0;
        acc.bookmarks   += m.bookmark_count    || 0;
        return acc;
      }, { impressions: 0, likes: 0, retweets: 0, replies: 0, bookmarks: 0 });
    }

    const cur  = sumMetrics(currentTweets);
    const prev = sumMetrics(prevTweets);

    // ── Follower counts from history ──────────────────────────────
    const history       = loadHistory();
    const currentFollowers = history.followerSnapshots?.slice(-1)?.[0]?.followers ?? 0;
    const prevSnap         = history.followerSnapshots?.[
      Math.max(0, (history.followerSnapshots?.length ?? 0) - 1 - days)
    ];
    const prevFollowers    = prevSnap?.followers ?? currentFollowers;

    // ── Build calendar from ALL known tweet dates ─────────────────
    const allTweets = [
      ...(history.tweetCache || []),
      ...currentTweets.map(t => ({ created_at: t.created_at })),
      ...prevTweets.map(t  => ({ created_at: t.created_at  })),
    ];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const calendarMap = {};
    allTweets.forEach(t => {
      if (!t.created_at) return;
      const d = new Date(t.created_at);
      if (d < sixMonthsAgo) return;
      const ds = d.toISOString().slice(0, 10);
      calendarMap[ds] = (calendarMap[ds] || 0) + 1;
    });

    // ── Streak (consecutive posting days, going back from today) ──
    const dateSet  = new Set(Object.keys(calendarMap).filter(k => calendarMap[k] > 0));
    let streak     = 0;
    const todayDt  = new Date(); todayDt.setHours(0, 0, 0, 0);
    let checkDate  = new Date(todayDt);
    if (!dateSet.has(checkDate.toISOString().slice(0, 10))) {
      checkDate.setDate(checkDate.getDate() - 1); // allow yesterday if not posted today yet
    }
    while (dateSet.has(checkDate.toISOString().slice(0, 10))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // ── Daily aggregation ─────────────────────────────────────────
    const dailyMap = {};
    currentTweets.forEach(t => {
      const day = t.created_at?.slice(0, 10);
      if (!day) return;
      if (!dailyMap[day]) dailyMap[day] = { date: day.slice(5), views: 0, posts: 0, engagements: 0, likes: 0, retweets: 0, replies: 0, bookmarks: 0 };
      const m = t.public_metrics;
      dailyMap[day].views       += getBestImpressions(t.id, m, realMetrics);
      dailyMap[day].posts       += 1;
      dailyMap[day].likes       += m.like_count       || 0;
      dailyMap[day].retweets    += m.retweet_count    || 0;
      dailyMap[day].replies     += m.reply_count      || 0;
      dailyMap[day].bookmarks   += m.bookmark_count   || 0;
      dailyMap[day].engagements += (m.like_count || 0) + (m.retweet_count || 0) + (m.reply_count || 0) + (m.bookmark_count || 0);
    });
    const dailyViews = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // ── Follower history ──────────────────────────────────────────
    const followerHistory = (history.followerSnapshots || []).slice(-days).map(s => ({
      date: s.date.slice(5), followers: s.followers
    }));

    // ── Engagement breakdown ──────────────────────────────────────
    const totalEng = cur.likes + cur.retweets + cur.replies + cur.bookmarks;
    const pct = (part) => totalEng > 0 ? Math.round(part / totalEng * 100) : 0;

    // ── Formatted tweets for table ────────────────────────────────
    const formattedTweets = currentTweets.map((t, i) => {
      const m          = t.public_metrics;
      const impressions = getBestImpressions(t.id, m, realMetrics);
      const engagement  = m.like_count + m.retweet_count + m.reply_count;
      return {
        id:            t.id,
        text:          t.text,
        date:          new Date(t.created_at).toLocaleDateString(),
        impressions,
        likes:         m.like_count,
        retweets:      m.retweet_count,
        replies:       m.reply_count,
        bookmarks:     m.bookmark_count || 0,
        engagementRate: impressions > 0 ? parseFloat((engagement / impressions * 100).toFixed(2)) : 0
      };
    });

    // ── Persist tweet cache to history for future streak calc ─────
    if (currentTweets.length > 0) {
      history.tweetCache = currentTweets.map(t => ({
        id: t.id, text: t.text, ...t.public_metrics, created_at: t.created_at
      }));
      saveHistory(history);
    }

    const result = {
      stats: {
        followers:        currentFollowers,
        followersChange:  currentFollowers - prevFollowers,
        posts:            currentTweets.length,
        postsChange:      currentTweets.length - prevTweets.length,
        impressions:      cur.impressions,
        impressionsChange:cur.impressions - prev.impressions,
        engagements:      totalEng,
        engagementsChange:totalEng - (prev.likes + prev.retweets + prev.replies + prev.bookmarks)
      },
      streak: { current: streak, calendar: calendarMap },
      engagementBreakdown: {
        likes:     { total: cur.likes,     change: cur.likes     - prev.likes,     pct: pct(cur.likes)     },
        retweets:  { total: cur.retweets,  change: cur.retweets  - prev.retweets,  pct: pct(cur.retweets)  },
        replies:   { total: cur.replies,   change: cur.replies   - prev.replies,   pct: pct(cur.replies)   },
        bookmarks: { total: cur.bookmarks, change: cur.bookmarks - prev.bookmarks, pct: pct(cur.bookmarks) }
      },
      followerHistory,
      dailyViews,
      tweets: formattedTweets,
      usingRealMetrics,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    // API failed (e.g. no credits) — still return streak/calendar from cached data
    const history = loadHistory();
    const allCached = history.tweetCache || [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const calendarMap = {};
    allCached.forEach(t => {
      if (!t.created_at) return;
      const d = new Date(t.created_at);
      if (d < sixMonthsAgo) return;
      const ds = d.toISOString().slice(0, 10);
      calendarMap[ds] = (calendarMap[ds] || 0) + 1;
    });
    const dateSet = new Set(Object.keys(calendarMap).filter(k => calendarMap[k] > 0));
    let streak = 0;
    const todayDt = new Date(); todayDt.setHours(0, 0, 0, 0);
    let checkDate = new Date(todayDt);
    if (!dateSet.has(checkDate.toISOString().slice(0, 10))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (dateSet.has(checkDate.toISOString().slice(0, 10))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    const currentFollowers = history.followerSnapshots?.slice(-1)?.[0]?.followers ?? 0;
    res.json({
      tweets: [],
      dailyViews: [],
      error: err.message,
      streak: { current: streak, calendar: calendarMap },
      stats: { followers: currentFollowers },
      followerHistory: (history.followerSnapshots || []).map(s => ({ date: s.date?.slice(5), followers: s.followers })),
    });
  }
});

// Analytics — top followers (most-followed people who follow the user), cache 1 hour
app.get('/api/analytics/followers', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken || !config.userId) return res.json({ followers: [] });

  const cacheKey = `analytics_followers:${config.username}`;
  const cached = getCached(cacheKey, 3600000); // 1 hour
  if (cached) return res.json(cached);

  try {
    const data = await xGet(`/users/${config.userId}/followers`, config, {
      'max_results': '100',
      'user.fields': 'public_metrics,description,profile_image_url'
    });
    trackUsage('userLookups', data.data?.length || 0);

    const followers = (data.data || [])
      .map(u => ({
        name: u.name,
        username: u.username,
        followers: u.public_metrics?.followers_count || 0,
        description: u.description || ''
      }))
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 20);

    const result = { followers };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({ followers: [], error: err.message });
  }
});

// Niche discovery — uses user's configured interests + auto-detected topics
app.get('/api/discover/suggested', (req, res) => {
  const config = loadConfig();
  const interests = config.interests || [];
  const aboutYou = config.aboutYou || '';

  // Build niche suggestions from user's actual interests
  let niches = [];
  if (interests.length > 0) {
    niches = interests.slice(0, 6);
  } else if (aboutYou) {
    // Fall back to detecting from aboutYou text
    niches = detectInterestsFromText(aboutYou).slice(0, 6);
  }
  // Last resort: generic but useful defaults
  if (niches.length === 0) {
    niches = ['indie hackers', 'AI tools', 'SaaS growth', 'web development', 'startup founders', 'creator economy'];
  }

  res.json({
    niches,
    topAccounts: [] // Populated after first search
  });
});

// Discover search — cache 1 hour per query
app.get('/api/discover/search', async (req, res) => {
  const config = loadConfig();
  const q = req.query.q;
  if (!config.bearerToken || !q) return res.json({ accounts: [], tweets: [] });

  const cacheKey = `discover:${q.toLowerCase().trim()}`;
  const cached = getCached(cacheKey, 3600000); // 1 hour
  if (cached) return res.json(cached);

  try {
    // Search recent tweets
    const tweetResults = await xGet('/tweets/search/recent', config, {
      'query': `${q} -is:retweet -is:reply lang:en`,
      'max_results': '20',
      'tweet.fields': 'public_metrics,created_at,author_id',
      'expansions': 'author_id',
      'user.fields': 'public_metrics,description'
    });
    trackUsage('searches');
    trackUsage('postReads', tweetResults.data?.length || 0);
    
    // Extract unique authors
    const usersMap = {};
    (tweetResults.includes?.users || []).forEach(u => { usersMap[u.id] = u; });
    
    const accounts = Object.values(usersMap)
      .map(u => ({
        name: u.name,
        username: u.username,
        description: u.description,
        followers: u.public_metrics?.followers_count
      }))
      .sort((a, b) => (b.followers || 0) - (a.followers || 0))
      .slice(0, 15);
    
    const tweets = (tweetResults.data || [])
      .map(t => ({
        text: t.text,
        author: usersMap[t.author_id]?.username || 'unknown',
        date: timeAgo(new Date(t.created_at)),
        impressions: t.public_metrics?.impression_count,
        likes: t.public_metrics?.like_count,
        retweets: t.public_metrics?.retweet_count
      }))
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 15);

    const result = { accounts, tweets };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({ accounts: [], tweets: [], error: err.message });
  }
});

// AI Writer
app.post('/api/writer/generate', async (req, res) => {
  const config = loadConfig();
  const { topic, style } = req.body;
  
  // Get recent tweets for voice matching
  const history = loadHistory();
  const recentTexts = (history.tweetCache || []).slice(0, 10).map(t => t.text).join('\n---\n');
  
  const prompt = `You are an AI tweet writer. Generate exactly 3 tweet drafts about: "${topic}"

Style: ${style}

${recentTexts ? `Here are the user's recent tweets for voice matching:\n${recentTexts}\n\nMatch their tone, vocabulary, and writing style.` : ''}

Rules:
- Each tweet must be under 280 characters
- Make them engaging and likely to get interactions
- Don't use hashtags unless the style calls for it
- Be authentic, not corporate
- Return ONLY a JSON array: [{"text": "..."}, {"text": "..."}, {"text": "..."}]`;

  try {
    // Try OpenAI first (most common), fall back to Anthropic
    const apiKey = config.openaiKey || process.env.OPENAI_API_KEY;
    if (apiKey) {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9
        })
      });
      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content || '[]';
      const drafts = JSON.parse(content.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
      return res.json({ drafts });
    }
    
    // Fallback: generate simple drafts without AI
    res.json({ drafts: [
      { text: `💡 ${topic}\n\nThis is a draft. Connect an AI API key in settings for real generation.` },
      { text: `Thread: ${topic}\n\n1/ Here's what most people get wrong about ${topic}...\n\n2/ The key insight is simpler than you think.\n\n3/ Let me break it down:` },
      { text: `Hot take: ${topic}\n\nAdd your AI API key in settings to generate real tweets.` }
    ]});
  } catch (err) {
    res.json({ drafts: [], error: err.message });
  }
});

// Improve a tweet
app.post('/api/writer/improve', async (req, res) => {
  const config = loadConfig();
  const { text } = req.body;
  
  const prompt = `Improve this tweet. Make it more engaging, punchy, and likely to get interactions. Keep the same meaning and tone. Return ONLY the improved tweet text, nothing else. Keep it under 280 characters.

Original tweet:
${text}`;

  try {
    const apiKey = config.openaiKey || process.env.OPENAI_API_KEY;
    if (apiKey) {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.8 })
      });
      const aiData = await aiRes.json();
      return res.json({ improved: aiData.choices?.[0]?.message?.content?.trim() });
    }
    res.json({ improved: req.body.text || 'Could not improve tweet.' });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Schedule via Postiz
app.post('/api/writer/schedule', async (req, res) => {
  const config = loadConfig();
  if (!config.postizKey) return res.json({ error: 'Postiz not configured' });
  
  try {
    const postRes = await fetch('https://api.postiz.com/public/v1/posts', {
      method: 'POST',
      headers: { 'Authorization': config.postizKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'now',
        date: new Date().toISOString(),
        posts: [{
          value: [{ content: req.body.text }],
          settings: { __type: 'x' }
        }]
      })
    });
    const result = await postRes.json();
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Recommendations — cache 1 hour
app.get('/api/recommendations', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({ recommendations: [] });

  const cacheKey = `recommendations:${config.username}`;
  const cached = getCached(cacheKey, 3600000); // 1 hour
  if (cached) return res.json(cached);

  try {
    const interests = config.interests || [];
    const aboutYou  = config.aboutYou  || '';

    // Fetch trends
    const woeid = config.woeid || 23424975;
    let trends = [];
    try {
      const trendData = await xGet(`/trends/by/woeid/${woeid}`, config);
      trends = (trendData.data || []).slice(0, 30).map(t => t.trend_name);
    } catch (e) {
      console.error('[recommendations] trends fetch error:', e.message);
    }

    let matched = [];

    // ── 1. Match global trends against user interests (broad INTEREST_MAP fuzzy match) ──
    if (trends.length > 0 && interests.length > 0) {
      trends.forEach(trend => {
        const matchedInterest = trendMatchesInterests(trend, interests);
        if (matchedInterest) {
          matched.push({ trend, reason: `Trending + matches your interest in "${matchedInterest}"`, source: 'global' });
        }
      });
    }

    // ── 2. If fewer than 3 matches, search X for popular tweets in user's niche ──
    if (matched.length < 3 && interests.length > 0) {
      try {
        const nicheQuery = interests.slice(0, 4).join(' OR ');
        const nicheData = await xGet('/tweets/search/recent', config, {
          'query':        `(${nicheQuery}) -is:retweet lang:en`,
          'max_results':  '20',
          'tweet.fields': 'public_metrics,entities,author_id',
          'expansions':   'author_id',
          'user.fields':  'username',
          'sort_order':   'relevancy',
        });
        trackUsage('searches');

        // Extract top hashtags from niche tweets
        const hashtagCounts = {};
        (nicheData.data || []).forEach(t => {
          (t.entities?.hashtags || []).forEach(h => {
            const tag = h.tag.toLowerCase();
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          });
        });

        const topHashtags = Object.entries(hashtagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => `#${tag}`);

        // Add hashtag-based recommendations
        for (const tag of topHashtags) {
          if (matched.length >= 3) break;
          if (!matched.some(m => m.trend === tag)) {
            const relatedInterest = interests.find(i => {
              const kws = INTEREST_MAP[i] || [i.toLowerCase()];
              return kws.some(kw => tag.toLowerCase().includes(kw) || kw.includes(tag.replace('#', '')));
            }) || interests[0];
            matched.push({ trend: tag, reason: `Popular in ${relatedInterest}`, source: 'niche' });
          }
        }

        // If still short, use top-liked niche tweets to create recommendations
        if (matched.length < 3) {
          const topTweets = (nicheData.data || [])
            .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0))
            .slice(0, 3 - matched.length);

          topTweets.forEach(tweet => {
            if (matched.length >= 3) return;
            const interestTopic = detectInterestsFromText(tweet.text)[0] || interests[0] || 'your niche';
            matched.push({
              trend: interestTopic,
              reason: `Popular in ${interestTopic}`,
              source: 'niche',
              nicheContext: tweet.text.slice(0, 120),
            });
          });
        }
      } catch (e) {
        console.error('[recommendations] niche search error:', e.message);
      }
    }

    // ── 3. Last resort: use interests as topics directly ──
    if (matched.length === 0 && interests.length > 0) {
      interests.slice(0, 3).forEach(interest => {
        matched.push({ trend: interest, reason: `One of your top interests`, source: 'interests' });
      });
    }

    const top3 = matched.slice(0, 3);
    if (top3.length === 0) return res.json({ recommendations: [] });

    // ── 4. Generate AI tweet suggestions ──
    const apiKey = config.openaiKey || process.env.OPENAI_API_KEY;
    const userContext = [
      aboutYou ? `About the user: ${aboutYou}` : '',
      interests.length ? `Their interests: ${interests.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    const recommendations = await Promise.all(top3.map(async ({ trend, reason, nicheContext }) => {
      if (apiKey) {
        try {
          const contextHint = nicheContext ? `\nContext (popular tweet in this niche): "${nicheContext}"` : '';
          const prompt = `Write a single engaging tweet (under 280 chars) about: "${trend}".
${userContext}${contextHint}
Be authentic, conversational, and opinionated — like a real person sharing insight. No hashtags unless totally natural. Return ONLY the tweet text.`;
          const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.9, max_tokens: 120 })
          });
          const aiData = await aiRes.json();
          const suggestion = aiData.choices?.[0]?.message?.content?.trim() || `Share your perspective on "${trend}" — your audience cares about this!`;
          return { trend, suggestion, reason };
        } catch (e) {
          return { trend, suggestion: `Share your perspective on "${trend}" — your audience cares about this!`, reason };
        }
      } else {
        return { trend, suggestion: `Share your perspective on "${trend}" — your audience cares about this!`, reason };
      }
    }));

    const result = { recommendations };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({ recommendations: [], error: err.message });
  }
});

// Trends — cache 30 minutes
app.get('/api/trends', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({ trends: [] });

  const cacheKey = `trends:${config.woeid || 23424975}`;
  const cached = getCached(cacheKey, 1800000); // 30 min
  if (cached) return res.json(cached);

  const woeid = config.woeid || 23424975; // UK default

  try {
    // X API v2 trends endpoint
    const data = await xGet(`/trends/by/woeid/${woeid}`, config);
    const trends = (data.data || []).slice(0, 20).map(t => ({
      name: t.trend_name,
      tweet_count: t.tweet_count || null
    }));
    const result = { trends, location: woeid === 23424975 ? 'United Kingdom' : woeid === 1 ? 'Worldwide' : `WOEID ${woeid}` };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({ trends: [], error: err.message });
  }
});

// Niche Trends — cache 30 minutes
// Searches X for popular tweets in user's interest areas, extracts topics/hashtags
app.get('/api/trends/niche', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({ nicheTrends: [] });

  const interests = (config.interests || []).slice(0, 3);
  if (interests.length === 0) return res.json({ nicheTrends: [] });

  const cacheKey = `trends_niche:${config.username}`;
  const cached = getCached(cacheKey, 1800000); // 30 min
  if (cached) return res.json(cached);

  try {
    const nicheTrends = [];

    for (const interest of interests) {
      try {
        const data = await xGet('/tweets/search/recent', config, {
          'query':        `${interest} min_faves:20 -is:retweet lang:en`,
          'max_results':  '10',
          'tweet.fields': 'public_metrics,created_at,author_id,entities',
          'expansions':   'author_id',
          'user.fields':  'public_metrics,name,username',
          'sort_order':   'relevancy',
        });
        trackUsage('searches');

        const usersMap = {};
        (data.includes?.users || []).forEach(u => { usersMap[u.id] = u; });

        // Extract hashtags sorted by frequency
        const hashtagCounts = {};
        (data.data || []).forEach(t => {
          (t.entities?.hashtags || []).forEach(h => {
            const tag = '#' + h.tag;
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          });
        });
        const relatedHashtags = Object.entries(hashtagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag);

        const tweets = (data.data || [])
          .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0))
          .slice(0, 3)
          .map(t => {
            const author = usersMap[t.author_id];
            return {
              author: {
                name:     author?.name     || 'Unknown',
                username: author?.username || 'unknown',
              },
              text:        t.text,
              likes:       t.public_metrics?.like_count       || 0,
              impressions: t.public_metrics?.impression_count || 0,
            };
          });

        nicheTrends.push({ topic: interest, tweets, relatedHashtags });
      } catch (e) {
        console.error(`[trends/niche] error for interest "${interest}":`, e.message);
      }
    }

    const result = { nicheTrends };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({ nicheTrends: [], error: err.message });
  }
});

// Monitored Accounts — GET
app.get('/api/monitored', (req, res) => {
  const config = loadConfig();
  const history = loadHistory();

  const handles = config.monitoredAccounts || [];
  const cache = history.monitoredCache || {};

  const accounts = handles.map(handle => ({
    handle,
    tweets: cache[handle] || []
  }));

  res.json({ accounts });
});

// Monitored Accounts — add / remove
app.post('/api/monitored', async (req, res) => {
  const config = loadConfig();
  const { handle, action } = req.body;
  if (!handle) return res.json({ error: 'Handle required' });

  const cleanHandle = handle.replace('@', '').trim().toLowerCase();
  if (!config.monitoredAccounts) config.monitoredAccounts = [];

  if (action === 'add') {
    if (!config.monitoredAccounts.includes(cleanHandle)) {
      config.monitoredAccounts.push(cleanHandle);
    }
  } else if (action === 'remove') {
    config.monitoredAccounts = config.monitoredAccounts.filter(h => h !== cleanHandle);
  }

  saveConfig(config);

  const history = loadHistory();
  if (!history.monitoredCache) history.monitoredCache = {};

  // On add, eagerly fetch tweets for this handle
  if (action === 'add' && config.bearerToken) {
    try {
      const userData = await xGet(`/users/by/username/${cleanHandle}`, config, {
        'user.fields': 'public_metrics'
      });
      if (userData.data) {
        const tweetsData = await xGet(`/users/${userData.data.id}/tweets`, config, {
          'max_results': '5',
          'tweet.fields': 'public_metrics,created_at',
          'exclude': 'retweets,replies'
        });
        history.monitoredCache[cleanHandle] = (tweetsData.data || []).map(t => ({
          text: t.text,
          likes: t.public_metrics.like_count,
          retweets: t.public_metrics.retweet_count,
          replies: t.public_metrics.reply_count,
          impressions: t.public_metrics.impression_count,
          timeAgo: timeAgo(new Date(t.created_at))
        }));
        saveHistory(history);
      }
    } catch (err) {
      console.error(`[monitored] fetch error for @${cleanHandle}:`, err.message);
    }
  }

  const accounts = config.monitoredAccounts.map(h => ({
    handle: h,
    tweets: history.monitoredCache[h] || []
  }));

  res.json({ accounts });
});

// Monitored Accounts — refresh all, cache 15 minutes
app.get('/api/monitored/refresh', async (req, res) => {
  const config = loadConfig();
  const handles = config.monitoredAccounts || [];

  if (!handles.length) return res.json({ accounts: [] });

  const cacheKey = `monitored_refresh:${config.username}`;
  const cached = getCached(cacheKey, 900000); // 15 min
  if (cached) return res.json(cached);

  const history = loadHistory();
  if (!history.monitoredCache) history.monitoredCache = {};

  for (const handle of handles) {
    try {
      const userData = await xGet(`/users/by/username/${handle}`, config, {
        'user.fields': 'public_metrics'
      });
      if (userData.data) {
        const tweetsData = await xGet(`/users/${userData.data.id}/tweets`, config, {
          'max_results': '5',
          'tweet.fields': 'public_metrics,created_at',
          'exclude': 'retweets,replies'
        });
        history.monitoredCache[handle] = (tweetsData.data || []).map(t => ({
          text: t.text,
          likes: t.public_metrics.like_count,
          retweets: t.public_metrics.retweet_count,
          replies: t.public_metrics.reply_count,
          impressions: t.public_metrics.impression_count,
          timeAgo: timeAgo(new Date(t.created_at))
        }));
      }
    } catch (err) {
      console.error(`[monitored/refresh] error for @${handle}:`, err.message);
    }
  }

  saveHistory(history);

  const accounts = handles.map(h => ({
    handle: h,
    tweets: history.monitoredCache[h] || []
  }));

  const result = { accounts };
  setCache(cacheKey, result);
  res.json(result);
});

// Settings
app.get('/api/settings', (req, res) => {
  const config = loadConfig();
  const history = loadHistory();
  const today = new Date().toISOString().slice(0, 10);
  
  // Mask credentials
  const masked = { ...config };
  ['bearerToken', 'apiKey', 'apiSecret', 'accessToken', 'accessSecret', 'postizKey', 'authToken', 'ct0'].forEach(k => {
    if (masked[k]) masked[k] = masked[k].slice(0, 6) + '...' + masked[k].slice(-4);
  });
  
  res.json({
    config: masked,
    usage: {
      balance: config.creditBalance,
      used: Object.values(history.usage?.[today] || {}).reduce((a, b) => a + b, 0) * 0.007,
      limit: config.spendingLimit,
      daily: history.usage?.[today]
    }
  });
});

// Usage tracking endpoint — returns real X API usage + cost estimate
app.get('/api/usage', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({});
  
  try {
    const data = await xGet('/usage/tweets', config);
    // Add cost estimate based on X pay-per-usage pricing
    // Typical rate: ~$1 per 1,000 tweet reads (varies by endpoint)
    const usage = parseInt(data?.data?.project_usage || '0');
    const cap = parseInt(data?.data?.project_cap || '0');
    const resetDay = data?.data?.cap_reset_day;
    res.json({
      ...data,
      estimate: {
        usage,
        cap,
        resetDay,
        // X charges per resource read, deduped per 24h UTC window
        // Rough estimate — actual cost depends on endpoint mix
        estimatedCost: parseFloat((usage * 0.001).toFixed(2)),
        pricingUrl: 'https://developer.x.com/#pricing',
        pricingDocsUrl: 'https://docs.x.com/x-api/getting-started/pricing',
        note: 'Cost is charged by X directly to your developer account, not by Xcellent.'
      }
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Helpers
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function calcEngagementRate(tweets) {
  if (!tweets.length) return 0;
  let totalEng = 0, totalImp = 0;
  tweets.forEach(t => {
    const m = t.public_metrics;
    totalEng += m.like_count + m.retweet_count + m.reply_count;
    totalImp += m.impression_count || 1;
  });
  return Math.round((totalEng / totalImp) * 1000) / 10;
}

function calcChange(snapshots, key) {
  if (!snapshots || snapshots.length < 2) return undefined;
  const latest = snapshots[snapshots.length - 1][key];
  const weekAgo = snapshots[Math.max(0, snapshots.length - 8)]?.[key];
  if (!weekAgo) return undefined;
  return Math.round(((latest - weekAgo) / weekAgo) * 1000) / 10;
}

// ── Viral Library ── upgraded v2 ── cache 1 hour ───────────────────────────
app.get('/api/viral', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({ tweets: [] });

  // Support both old (interests) and new (q) params for backward compat
  const q          = req.query.q || req.query.interests || 'AI,technology';
  const period     = req.query.period  || 'all';
  const minLikes   = parseInt(req.query.minLikes) || 100;
  const account    = req.query.account || 'all';
  const includeReplies = req.query.includeReplies === '1';

  // Resolve days for period (X recent search = last 7 days max on basic tier)
  let days = null;
  if (period === 'week' || period === '7d') days = 7;
  else if (period === 'month' || period === '30d') days = 30;
  else if (period === 'year' || period === '90d') days = 90;
  // 'all' → no start_time filter (API defaults to last 7 days)

  const cacheKey = `viral_v2:${q}:${period}:${minLikes}:${account}`;
  const cached   = getCached(cacheKey, 3600000); // 1 hour
  if (cached) return res.json(cached);

  try {
    const keywords = q.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
    const keyQuery = keywords.length === 1
      ? `"${keywords[0]}"`
      : `(${keywords.map(k => `"${k}"`).join(' OR ')})`;
    const replyFilter = includeReplies ? '' : ' -is:reply';
    const query = `${keyQuery} min_faves:${minLikes} -is:retweet${replyFilter} lang:en`;

    const params = {
      'query':        query,
      'max_results':  '50',
      'tweet.fields': 'public_metrics,created_at,author_id,entities',
      'expansions':   'author_id',
      'user.fields':  'public_metrics,name,username,profile_image_url',
      'sort_order':   'relevancy',
    };
    if (days && days <= 7) {
      params['start_time'] = new Date(Date.now() - days * 86400000).toISOString();
    }

    const data = await xGet('/tweets/search/recent', config, params);
    trackUsage('searches');
    trackUsage('postReads', data.data?.length || 0);

    const usersMap = {};
    (data.includes?.users || []).forEach(u => { usersMap[u.id] = u; });

    const monitoredSet = new Set((config.monitoredAccounts || []).map(h => h.toLowerCase()));

    let tweets = (data.data || []).map(t => ({
      id:          t.id,
      text:        t.text,
      author: usersMap[t.author_id] ? {
        name:      usersMap[t.author_id].name,
        username:  usersMap[t.author_id].username,
        followers: usersMap[t.author_id].public_metrics?.followers_count ?? 0,
      } : { name: 'Unknown', username: 'unknown', followers: 0 },
      impressions: t.public_metrics?.impression_count || 0,
      likes:       t.public_metrics?.like_count       || 0,
      retweets:    t.public_metrics?.retweet_count    || 0,
      replies:     t.public_metrics?.reply_count      || 0,
      bookmarks:   t.public_metrics?.bookmark_count   || 0,
      hasLinks:    !!(t.entities?.urls?.length),
      date:        timeAgo(new Date(t.created_at)),
    }));

    // Filter to monitored accounts only if requested
    if (account === 'monitored' && monitoredSet.size > 0) {
      tweets = tweets.filter(t => monitoredSet.has(t.author?.username?.toLowerCase()));
    }

    tweets = tweets.sort((a, b) => b.impressions - a.impressions).slice(0, 20);

    const result = { tweets };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({ tweets: [], error: err.message });
  }
});

// ── Inspiration ── cache 30 minutes ────────────────────────────────────────
// Primary source: searches ALL accounts matching user interests (not just monitored)
// Secondary source: high-performing tweets from monitored accounts
app.get('/api/inspiration', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({ posts: [], noInterests: true });

  const tab = req.query.tab || 'all';
  const interests = config.interests || [];
  const monitoredAccounts = config.monitoredAccounts || [];

  if (interests.length === 0 && monitoredAccounts.length === 0) {
    return res.json({ posts: [], noInterests: true });
  }

  const cacheKey = `inspiration:${config.username}`;
  const cached   = getCached(cacheKey, 1800000); // 30 min
  if (cached) {
    let posts = cached.posts || [];
    if (tab === 'articles') posts = posts.filter(p => p.hasLinks);
    if (tab === 'media')    posts = posts.filter(p => p.hasMedia);
    return res.json({ posts });
  }

  try {
    let posts = [];

    // ── Primary: search X for popular tweets across ALL accounts in user's niche
    if (interests.length > 0) {
      // If interests list is long, pick top 5 and rotate each cache period
      const allInterests = interests.slice(0, 10);
      let keywords;
      if (allInterests.length <= 5) {
        keywords = allInterests;
      } else {
        const rotateOffset = Math.floor(Date.now() / 1800000) % (allInterests.length - 4);
        keywords = allInterests.slice(rotateOffset, rotateOffset + 5);
      }

      const query = `(${keywords.join(' OR ')}) -is:retweet -is:reply lang:en`;

      const data = await xGet('/tweets/search/recent', config, {
        'query':        query,
        'max_results':  '20',
        'tweet.fields': 'public_metrics,created_at,author_id,entities,attachments',
        'expansions':   'author_id',
        'user.fields':  'public_metrics,description,profile_image_url',
        'sort_order':   'relevancy',
      });
      trackUsage('searches');
      trackUsage('postReads', data.data?.length || 0);

      const usersMap = {};
      (data.includes?.users || []).forEach(u => { usersMap[u.id] = u; });

      posts = (data.data || [])
        .filter(t => (t.public_metrics?.like_count || 0) >= 50)
        .map(t => ({
        author: {
          name:     usersMap[t.author_id]?.name     || 'Unknown',
          username: usersMap[t.author_id]?.username || 'unknown',
        },
        text:        t.text,
        replies:     t.public_metrics?.reply_count      || 0,
        retweets:    t.public_metrics?.retweet_count    || 0,
        likes:       t.public_metrics?.like_count       || 0,
        bookmarks:   t.public_metrics?.bookmark_count   || 0,
        impressions: t.public_metrics?.impression_count || 0,
        timeAgo:     timeAgo(new Date(t.created_at)),
        hasMedia:    !!(t.attachments?.media_keys?.length),
        hasLinks:    !!(t.entities?.urls?.length),
      }));
    }

    // ── Secondary: merge high-performing tweets from monitored accounts
    if (monitoredAccounts.length > 0) {
      const history = loadHistory();
      const monCache = history.monitoredCache || {};
      for (const handle of monitoredAccounts.slice(0, 3)) {
        const monTweets = monCache[handle] || [];
        const highPerf = monTweets
          .filter(t => t.likes > 10)
          .map(t => ({
            author:      { name: handle, username: handle },
            text:        t.text,
            replies:     t.replies    || 0,
            retweets:    t.retweets   || 0,
            likes:       t.likes      || 0,
            bookmarks:   0,
            impressions: t.impressions || 0,
            timeAgo:     t.timeAgo    || '',
            hasMedia:    false,
            hasLinks:    t.text.includes('http'),
          }));
        posts = [...posts, ...highPerf];
      }
    }

    // Sort all results by impression_count descending, return top 20
    posts = posts.sort((a, b) => b.impressions - a.impressions).slice(0, 20);

    const result = { posts };
    setCache(cacheKey, result);

    let filteredPosts = posts;
    if (tab === 'articles') filteredPosts = posts.filter(p => p.hasLinks);
    if (tab === 'media')    filteredPosts = posts.filter(p => p.hasMedia);

    res.json({ posts: filteredPosts });
  } catch (err) {
    res.json({ posts: [], error: err.message });
  }
});

// ── Daily Mix ── GET (returns cached or empty) ─────────────────────────────
app.get('/api/daily-mix', (req, res) => {
  const config   = loadConfig();
  const cacheKey = `daily_mix:${config.username}`;
  const cached   = getCached(cacheKey, 21600000); // 6 hours
  if (cached) return res.json(cached);
  res.json({ posts: [] });
});

// ── Daily Mix ── POST /generate ─────────────────────────────────────────────
app.post('/api/daily-mix/generate', async (req, res) => {
  const config   = loadConfig();
  const cacheKey = `daily_mix:${config.username}`;

  const openaiKey  = config.openaiKey || process.env.OPENAI_API_KEY;
  const aboutYou   = config.aboutYou   || '';
  const interests  = config.interests  || [];
  const products   = config.products   || [];

  // Helper: call OpenAI and parse JSON array
  async function callOpenAI(prompt, temperature = 0.9) {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        messages:    [{ role: 'user', content: prompt }],
        temperature,
        max_tokens:  1200,
      }),
    });
    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || '[]';
    return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  }

  // Fetch trending topics
  let trendNames = [];
  try {
    const woeid = config.woeid || 23424975;
    const trendData = await xGet(`/trends/by/woeid/${woeid}`, config);
    trendNames = (trendData.data || []).slice(0, 5).map(t => t.trend_name);
  } catch {
    trendNames = interests.slice(0, 3);
  }

  // Fetch viral tweets for rewriting
  let viralTweets = [];
  if (interests.length > 0) {
    try {
      const kw  = interests.slice(0, 2).map(k => `"${k}"`).join(' OR ');
      const vData = await xGet('/tweets/search/recent', config, {
        'query':        `(${kw}) min_faves:300 -is:retweet lang:en`,
        'max_results':  '10',
        'tweet.fields': 'public_metrics,author_id',
        'expansions':   'author_id',
        'user.fields':  'username,name',
        'sort_order':   'relevancy',
      });
      const um = {};
      (vData.includes?.users || []).forEach(u => { um[u.id] = u; });
      viralTweets = (vData.data || [])
        .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0))
        .slice(0, 3)
        .map(t => ({
          text:        t.text,
          username:    um[t.author_id]?.username || 'unknown',
          likes:       t.public_metrics?.like_count    || 0,
          retweets:    t.public_metrics?.retweet_count || 0,
          impressions: t.public_metrics?.impression_count || 0,
        }));
    } catch (e) {
      console.error('[daily-mix] viral fetch error:', e.message);
    }
  }

  const userContext = [
    aboutYou   ? `About: ${aboutYou}` : '',
    interests.length ? `Interests: ${interests.join(', ')}` : '',
    products.length  ? `Products: ${products.map(p => typeof p === 'string' ? p : (p.name || p)).join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const posts = [];

  if (!openaiKey) {
    // Return placeholder posts when no API key
    const placeholderSets = [
      { category: 'for-you',  text: `Hot take: ${interests[0] || 'your niche'} is changing faster than most people realise.\n\nThe ones paying attention right now will be years ahead.` },
      { category: 'for-you',  text: `The number one mistake I see in ${interests[0] || 'my field'}? Not shipping fast enough.\n\nDone beats perfect. Every single time.` },
      { category: 'trending', text: `${trendNames[0] || 'Trending topic'} is blowing up right now.\n\nHere's why it matters and what most people are missing:` },
      { category: 'media',    text: `This is what consistency looks like.\n\n365 days. No breaks. Just showing up.\n\nThe compound effect is real.` },
      { category: 'viral',    text: `Most people overcomplicate ${interests[0] || 'success'}.\n\nThe actual formula:\n→ Show up\n→ Do the work\n→ Repeat\n\nThat's it.` },
    ];
    if (products.length > 0) {
      const prod = typeof products[0] === 'string' ? products[0] : (products[0]?.name || 'my product');
      placeholderSets.push({ category: 'products', text: `Just shipped a big update to ${prod}.\n\nHere's what changed and why it matters:` });
    }
    const result = { posts: placeholderSets };
    setCache(cacheKey, result);
    return res.json(result);
  }

  // ─── For You (6) ────────────────────────────────────────────────────────
  try {
    const drafts = await callOpenAI(
      `You write tweets in this person's voice.\n${userContext}\n\n` +
      `Write 6 engaging tweets about their interests. Personal, conversational, authentic — like a real human sharing insights. No hashtags unless totally natural. Each under 280 chars.\n\n` +
      `Return JSON array: [{"text": "..."}, ...]`
    );
    drafts.slice(0, 6).forEach(d => d.text && posts.push({ category: 'for-you', text: d.text }));
  } catch (e) {
    console.error('[daily-mix] for-you error:', e.message);
  }

  // ─── Products (3 max) ────────────────────────────────────────────────────
  if (products.length > 0) {
    try {
      const productList = products.slice(0, 3)
        .map(p => typeof p === 'string' ? p : `${p.name}${p.description ? ': ' + p.description : ''}`)
        .join('\n');
      const drafts = await callOpenAI(
        `Write subtle, authentic promotional tweets for these products:\n${productList}\n\nUser context:\n${userContext}\n\n` +
        `Write 3 tweets (one per product max). Natural, not salesy — mention it as if you're genuinely recommending it. Each under 280 chars.\n\n` +
        `Return JSON: [{"text": "..."}, ...]`,
        0.85
      );
      drafts.slice(0, 3).forEach(d => d.text && posts.push({ category: 'products', text: d.text }));
    } catch (e) {
      console.error('[daily-mix] products error:', e.message);
    }
  }

  // ─── Trending (3) ────────────────────────────────────────────────────────
  if (trendNames.length > 0) {
    try {
      const top3 = trendNames.slice(0, 3);
      const drafts = await callOpenAI(
        `Write 3 engaging tweets, one about each trending topic below.\n\nTrending:\n${top3.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nUser context:\n${userContext}\n\n` +
        `Make them timely and opinionated. Each under 280 chars. Include the trend naturally.\n\n` +
        `Return JSON: [{"text": "...", "trend": "...", "sourceUrl": null}, ...]`,
        0.85
      );
      drafts.slice(0, 3).forEach(d => d.text && posts.push({
        category:  'trending',
        text:      d.text,
        sourceUrl: d.sourceUrl || null,
      }));
    } catch (e) {
      console.error('[daily-mix] trending error:', e.message);
    }
  }

  // ─── Media (3) ───────────────────────────────────────────────────────────
  try {
    const drafts = await callOpenAI(
      `Write 3 tweets designed to be paired with an image or video.\n\nUser context:\n${userContext}\n\n` +
      `These should describe or complement a visual: "This is what X looks like...", behind-the-scenes captions, before/after, results. Each under 280 chars.\n\n` +
      `Return JSON: [{"text": "..."}, ...]`
    );
    drafts.slice(0, 3).forEach(d => d.text && posts.push({ category: 'media', text: d.text }));
  } catch (e) {
    console.error('[daily-mix] media error:', e.message);
  }

  // ─── Viral rewrites (3) ──────────────────────────────────────────────────
  if (viralTweets.length > 0) {
    try {
      const viralList = viralTweets
        .map((t, i) => `${i + 1}. [by @${t.username}, ${t.likes} likes]\n"${t.text}"`)
        .join('\n\n');
      const drafts = await callOpenAI(
        `Rewrite these viral tweets in this person's authentic voice:\n\n${userContext}\n\nViral originals:\n${viralList}\n\n` +
        `Rewrite each one — keep the core insight but make it sound like this person. Each under 280 chars.\n\n` +
        `Return JSON: [{"text": "...", "originalUsername": "...", "originalLikes": 0, "originalRetweets": 0, "originalImpressions": 0}, ...]`,
        0.85
      );
      drafts.slice(0, 3).forEach((d, i) => {
        if (!d.text) return;
        const orig = viralTweets[i] || viralTweets[0];
        posts.push({
          category: 'viral',
          text:     d.text,
          original: {
            username:    d.originalUsername    || orig.username,
            text:        orig.text,
            likes:       d.originalLikes       || orig.likes,
            retweets:    d.originalRetweets    || orig.retweets,
            impressions: d.originalImpressions || orig.impressions,
          },
        });
      });
    } catch (e) {
      console.error('[daily-mix] viral rewrite error:', e.message);
    }
  }

  const result = { posts };
  setCache(cacheKey, result);
  res.json(result);
});

// ── Context settings ────────────────────────────────────────────────────────
app.get('/api/context', (req, res) => {
  const config = loadConfig();
  res.json({
    aboutYou:          config.aboutYou          || '',
    interests:         config.interests         || [],
    favouriteCreators: config.favouriteCreators || [],
    products:          config.products          || [],
    writingDNA:        config.writingDNA        || { liked: [], passed: [] },
    queueTimes:        config.queueTimes        || {}
  });
});

app.post('/api/context', (req, res) => {
  const config  = loadConfig();
  const updated = { ...config, ...req.body };
  saveConfig(updated);
  res.json({ ok: true });
});

// ── Auto-detect context from X account + OpenClaw agent files ───────────────
app.post('/api/context/auto-detect', async (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({ error: 'Not configured — connect X first' });

  const cacheKey = `auto_detect:${config.username}`;
  const forceRefresh = req.body?.force === true;
  if (!forceRefresh) {
    const cached = getCached(cacheKey, 86400000); // 24 hours
    if (cached) return res.json(cached);
  }

  try {
    // 1. Fetch user profile
    const profileData = await xGet(`/users/by/username/${config.username}`, config, {
      'user.fields': 'description,entities,public_metrics'
    });
    trackUsage('userLookups');
    if (!profileData.data) throw new Error(profileData.errors?.[0]?.detail || 'User not found');

    const userId  = profileData.data.id;
    const bio     = profileData.data.description || '';
    const metrics = profileData.data.public_metrics;

    // 2. Fetch recent 50 tweets
    const tweetsData = await xGet(`/users/${userId}/tweets`, config, {
      'max_results':  '100',
      'tweet.fields': 'public_metrics,entities,created_at',
      'exclude':      'retweets,replies'
    });
    trackUsage('postReads', tweetsData.data?.length || 0);
    const tweets = tweetsData.data || [];

    // 3. Analyse tweets for topics/hashtags
    const hashtagCounts = {};
    const wordCounts    = {};
    const stopWords = new Set(['about', 'these', 'their', 'there', 'where', 'would', 'could', 'should',
      'think', 'going', 'every', 'first', 'still', 'start', 'which', 'being', 'after', 'other',
      'people', 'really', 'things', 'right', 'great', 'just', 'with', 'that', 'this', 'have', 'from']);

    tweets.forEach(t => {
      (t.entities?.hashtags || []).forEach(h => {
        const tag = h.tag.toLowerCase();
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
      t.text.toLowerCase()
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4 && !stopWords.has(w))
        .forEach(w => { wordCounts[w] = (wordCounts[w] || 0) + 1; });
    });

    const topHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 15).map(([tag]) => tag);

    const detectedTopics = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 20).map(([word]) => word);

    // 4. Detect interest categories
    const allText = bio + ' ' + tweets.map(t => t.text).join(' ');
    const detectedInterests = detectInterestsFromText(allText);

    // 5. Auto-set config fields if not already set
    const currentConfig = loadConfig();
    let updated = false;
    if (!currentConfig.aboutYou && bio) {
      currentConfig.aboutYou = bio;
      updated = true;
    }
    if ((!currentConfig.interests || currentConfig.interests.length === 0) && detectedInterests.length > 0) {
      currentConfig.interests = detectedInterests;
      updated = true;
    }
    if (updated) saveConfig(currentConfig);

    // 6. Read OpenClaw agent context files
    let agentContext = null;
    const agentParts = [];
    try {
      const userMd = fs.readFileSync('/home/ollie/.openclaw/workspace/USER.md', 'utf-8');
      // Extract key lines (skip boilerplate headings, grab actual content)
      const userLines = userMd.split('\n')
        .filter(l => l.trim() && !l.startsWith('# ') && !l.startsWith('---'))
        .slice(0, 20)
        .join('\n');
      if (userLines.trim()) agentParts.push({ source: 'USER.md', content: userLines.slice(0, 800) });
    } catch {}
    // SOUL.md intentionally not read — agent personality should not be inherited
    if (agentParts.length > 0) agentContext = agentParts;

    const result = {
      bio,
      detectedInterests,
      detectedTopics,
      topHashtags,
      agentContext,
      followers: metrics?.followers_count,
      tweetsAnalyzed: tweets.length,
      autoSet: { aboutYou: !currentConfig.aboutYou && !!bio, interests: !currentConfig.interests?.length && detectedInterests.length > 0 }
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[auto-detect]', err.message);
    res.json({ error: err.message });
  }
});

// ── Queue ─ GET ─────────────────────────────────────────────────────────────
app.get('/api/queue', (req, res) => {
  const config = loadConfig();
  const queue  = loadQueue();
  res.json({
    scheduled:  queue.scheduled  || [],
    drafts:     queue.drafts     || [],
    posted:     queue.posted     || [],
    failed:     queue.failed     || [],
    queueTimes: config.queueTimes || {}
  });
});

// ── Queue ─ POST ────────────────────────────────────────────────────────────
app.post('/api/queue', (req, res) => {
  const { text, scheduledFor, status = 'draft' } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  const queue = loadQueue();
  const item  = {
    id:           Date.now().toString(),
    text,
    scheduledFor: scheduledFor || null,
    status,
    createdAt:    new Date().toISOString()
  };

  if (status === 'scheduled') {
    if (!queue.scheduled) queue.scheduled = [];
    queue.scheduled.push(item);
  } else {
    if (!queue.drafts) queue.drafts = [];
    queue.drafts.push(item);
  }

  saveQueue(queue);
  res.json({ ok: true, item });
});

// ── Agent Analytics ── reads from cache only, no fresh API calls ── cache 15 min
app.get('/api/agent/analytics', (req, res) => {
  const config = loadConfig();
  if (!config.bearerToken) return res.json({ error: 'Not configured' });

  const cacheKey = `agent_analytics:${config.username}`;
  const cached = getCached(cacheKey, 900000); // 15 min
  if (cached) return res.json(cached);

  try {
    const history = loadHistory();
    const cache   = loadCache();

    // Tweet cache from history
    const tweets = history.tweetCache || [];

    // Sort by impressions
    const byImpressions = [...tweets].sort((a, b) => (b.impression_count || 0) - (a.impression_count || 0));

    const mapTweet = (t) => {
      const impressions = t.impression_count || 0;
      const engagements = (t.like_count || 0) + (t.retweet_count || 0) + (t.reply_count || 0);
      return {
        text:           t.text || '',
        impressions,
        likes:          t.like_count || 0,
        engagementRate: impressions > 0 ? parseFloat((engagements / impressions * 100).toFixed(2)) : 0,
        postedAt:       t.created_at || null,
      };
    };

    const topTweets   = byImpressions.slice(0, 5).map(mapTweet);
    const worstTweets = byImpressions.slice(-5).reverse().map(mapTweet);

    // Follower data from snapshots
    const snapshots       = history.followerSnapshots || [];
    const latestFollowers = snapshots.length > 0 ? snapshots[snapshots.length - 1].followers : null;
    const weekAgoSnap     = snapshots.length >= 8 ? snapshots[snapshots.length - 8] : snapshots[0];
    const weekAgoFollowers = weekAgoSnap?.followers ?? null;

    // Best posting times — aggregate by hour
    const hourEngagement = {};
    tweets.forEach(t => {
      if (!t.created_at) return;
      const hour = new Date(t.created_at).getHours();
      const key  = `${hour.toString().padStart(2, '0')}:00`;
      const eng  = (t.like_count || 0) + (t.retweet_count || 0) + (t.reply_count || 0);
      if (!hourEngagement[key]) hourEngagement[key] = { total: 0, count: 0 };
      hourEngagement[key].total += eng;
      hourEngagement[key].count += 1;
    });
    const bestPostingTimes = Object.entries(hourEngagement)
      .map(([hour, d]) => ({ hour, avg: d.total / d.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map(e => e.hour);

    // Overall engagement rate
    const totalImpressions = tweets.reduce((s, t) => s + (t.impression_count || 0), 0);
    const totalEngagements = tweets.reduce((s, t) => s + (t.like_count || 0) + (t.retweet_count || 0) + (t.reply_count || 0), 0);
    const avgEngagementRate = totalImpressions > 0
      ? parseFloat((totalEngagements / totalImpressions * 100).toFixed(2))
      : 0;

    // Total views 7d — from dashboard cache if available
    const dashCache7d  = cache[`dashboard:${config.username}:7d`]?.data;
    const totalViews7d = dashCache7d?.stats?.totalViews ?? totalImpressions;

    // Recent global trends
    const trendsCache  = cache[`trends:${config.woeid || 23424975}`]?.data;
    const recentTrends = (trendsCache?.trends || []).slice(0, 10).map(t => t.name);

    // Niche trend topics + hashtags
    const nicheCache  = cache[`trends_niche:${config.username}`]?.data;
    const nicheTrends = (nicheCache?.nicheTrends || [])
      .flatMap(n => [n.topic, ...n.relatedHashtags.slice(0, 2)])
      .slice(0, 10);

    // Best topics — from interests config
    const bestTopics = (config.interests || []).slice(0, 5);

    const result = {
      account: {
        username:  config.username  || null,
        followers: latestFollowers,
      },
      period: '7d',
      topTweets,
      worstTweets,
      patterns: {
        bestPostingTimes,
        bestTopics,
        avgEngagementRate,
        totalViews7d,
        followersGained7d: latestFollowers != null && weekAgoFollowers != null
          ? latestFollowers - weekAgoFollowers
          : null,
      },
      recentTrends,
      nicheTrends,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ── Fetch up to 200 tweets with pagination ──────────────────────────────────
async function fetchTweetsPaginated(config, maxTweets = 200, params = {}) {
  let allTweets = [];
  let nextToken = null;
  const perPage = 100;
  const maxPages = Math.ceil(maxTweets / perPage);

  for (let page = 0; page < maxPages; page++) {
    const reqParams = {
      'max_results': String(Math.min(perPage, maxTweets - allTweets.length)),
      'tweet.fields': 'public_metrics,created_at,text',
      'exclude': 'retweets,replies',
      ...params,
    };
    if (nextToken) reqParams['pagination_token'] = nextToken;

    const resp = await xGet(`/users/${config.userId}/tweets`, config, reqParams);
    trackUsage('postReads', resp.data?.length || 0);
    allTweets = allTweets.concat(resp.data || []);

    nextToken = resp.meta?.next_token;
    if (!nextToken || allTweets.length >= maxTweets) break;
  }
  return allTweets;
}

// ── Snapshot polling ─────────────────────────────────────────────────────────
async function pollSnapshots() {
  const config = loadConfig();
  if (!config.bearerToken || !config.userId) {
    console.log('[snapshots] skipping poll — not configured');
    return { skipped: true };
  }

  const snapshots = loadSnapshots();
  if (!snapshots.cumulative) snapshots.cumulative = {};
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const now = Date.now();

  // 1. Fetch current follower count + profile metrics
  let currentFollowers = null;
  let profileMetrics = null;
  try {
    const me = await xGet(`/users/by/username/${config.username}`, config, {
      'user.fields': 'public_metrics'
    });
    profileMetrics = me.data?.public_metrics ?? null;
    currentFollowers = profileMetrics?.followers_count ?? null;
    trackUsage('userLookups');
  } catch (e) {
    console.error('[snapshots] follower fetch error:', e.message);
  }

  // 2. Fetch last 200 tweets (paginated) to get ALL current public_metrics
  let tweets = [];
  try {
    tweets = await fetchTweetsPaginated(config, 200);
  } catch (e) {
    console.error('[snapshots] tweets fetch error:', e.message);
    return { error: e.message };
  }

  // 3. Compute cumulative totals across ALL fetched tweets
  const cumTotals = { impressions: 0, likes: 0, retweets: 0, replies: 0, bookmarks: 0 };
  for (const tweet of tweets) {
    const m = tweet.public_metrics;
    cumTotals.impressions += m.impression_count || 0;
    cumTotals.likes       += m.like_count || 0;
    cumTotals.retweets    += m.retweet_count || 0;
    cumTotals.replies     += m.reply_count || 0;
    cumTotals.bookmarks   += m.bookmark_count || 0;
  }

  // Store cumulative snapshot with timestamp
  snapshots.cumulative[today] = snapshots.cumulative[today] || [];
  snapshots.cumulative[today].push({ ts: now, ...cumTotals, followers: currentFollowers, tweetsPolled: tweets.length });
  // Keep max 10 cumulative snapshots per day
  if (snapshots.cumulative[today].length > 10) {
    snapshots.cumulative[today] = snapshots.cumulative[today].slice(-10);
  }

  // 4. Compute daily deltas by comparing current cumulative vs previous day's LAST cumulative
  // Find previous day's last cumulative snapshot
  let prevCum = null;
  const sortedDates = Object.keys(snapshots.cumulative).sort();
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const d = sortedDates[i];
    if (d < today && snapshots.cumulative[d]?.length > 0) {
      prevCum = snapshots.cumulative[d][snapshots.cumulative[d].length - 1];
      break;
    }
  }

  // Also find today's FIRST cumulative to get intra-day delta
  const todayCumSnapshots = snapshots.cumulative[today] || [];
  const todayFirstCum = todayCumSnapshots.length > 1 ? todayCumSnapshots[0] : prevCum;
  const baselineCum = todayFirstCum || prevCum;

  let dailyDelta = { impressions: 0, likes: 0, retweets: 0, replies: 0, bookmarks: 0 };
  if (baselineCum) {
    dailyDelta = {
      impressions: Math.max(0, cumTotals.impressions - (baselineCum.impressions || 0)),
      likes:       Math.max(0, cumTotals.likes       - (baselineCum.likes || 0)),
      retweets:    Math.max(0, cumTotals.retweets    - (baselineCum.retweets || 0)),
      replies:     Math.max(0, cumTotals.replies     - (baselineCum.replies || 0)),
      bookmarks:   Math.max(0, cumTotals.bookmarks   - (baselineCum.bookmarks || 0)),
    };
  }

  // 5. Update daily entry (overwrite with latest delta calculation)
  const newFollowers = (currentFollowers !== null && snapshots.daily[yesterday]?.followers != null)
    ? currentFollowers - snapshots.daily[yesterday].followers
    : (snapshots.daily[today]?.newFollowers ?? 0);

  snapshots.daily[today] = {
    impressions: dailyDelta.impressions,
    likes:       dailyDelta.likes,
    retweets:    dailyDelta.retweets,
    replies:     dailyDelta.replies,
    bookmarks:   dailyDelta.bookmarks,
    followers:   currentFollowers,
    newFollowers,
  };

  // 6. Also store per-tweet snapshots for detailed tracking
  for (const tweet of tweets) {
    const tid = tweet.id;
    const m = tweet.public_metrics;
    const newSnap = {
      ts: now,
      impressions: m.impression_count || 0,
      likes: m.like_count || 0,
      retweets: m.retweet_count || 0,
      replies: m.reply_count || 0,
      bookmarks: m.bookmark_count || 0
    };

    if (!snapshots.tweets[tid]) {
      snapshots.tweets[tid] = { text: tweet.text, snapshots: [] };
    }

    const existing = snapshots.tweets[tid].snapshots;
    const lastTs = existing.length > 0 ? existing[existing.length - 1].ts : 0;
    if (now - lastTs > 30 * 60 * 1000) {
      existing.push(newSnap);
      if (existing.length > 200) existing.splice(0, existing.length - 200);
    }
    snapshots.tweets[tid].text = tweet.text;
  }

  // Keep daily data for last 365 days only
  const cutoff = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  for (const date of Object.keys(snapshots.daily)) {
    if (date < cutoff) delete snapshots.daily[date];
  }
  for (const date of Object.keys(snapshots.cumulative)) {
    if (date < cutoff) delete snapshots.cumulative[date];
  }

  saveSnapshots(snapshots);

  console.log(`[snapshots] poll complete: cumulative ${cumTotals.impressions} impressions across ${tweets.length} tweets, daily delta +${dailyDelta.impressions}`);
  return {
    ok: true,
    date: today,
    tweetsPolled: tweets.length,
    cumulative: cumTotals,
    dailyDelta,
    daily: snapshots.daily[today]
  };
}

// ── Backfill missing days from tweet-level data ─────────────────────────────
async function backfillMissingDays() {
  const config = loadConfig();
  if (!config.bearerToken || !config.userId) return;

  const snapshots = loadSnapshots();
  const daily = snapshots.daily || {};

  // Check for missing days in last 7 days
  const missingDays = [];
  for (let i = 7; i >= 1; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    if (!daily[d] || (daily[d].impressions === 0 && !daily[d]._backfilled)) {
      missingDays.push(d);
    }
  }

  if (missingDays.length === 0) {
    console.log('[backfill] no missing days');
    return;
  }

  console.log(`[backfill] attempting to fill ${missingDays.length} missing days: ${missingDays.join(', ')}`);

  try {
    // Fetch tweets from the earliest missing day
    const startTime = new Date(missingDays[0] + 'T00:00:00Z').toISOString();
    const endTime = new Date(Date.now()).toISOString();

    const tweets = await fetchTweetsPaginated(config, 200, {
      'start_time': startTime,
    });

    // Group tweets by the day they were posted
    const byDay = {};
    for (const t of tweets) {
      const day = t.created_at?.slice(0, 10);
      if (!day) continue;
      if (!byDay[day]) byDay[day] = { impressions: 0, likes: 0, retweets: 0, replies: 0, bookmarks: 0 };
      const m = t.public_metrics;
      byDay[day].impressions += m.impression_count || 0;
      byDay[day].likes       += m.like_count || 0;
      byDay[day].retweets    += m.retweet_count || 0;
      byDay[day].replies     += m.reply_count || 0;
      byDay[day].bookmarks   += m.bookmark_count || 0;
    }

    // Fill missing days with tweet-level estimates
    for (const d of missingDays) {
      const dayData = byDay[d];
      if (dayData && dayData.impressions > 0) {
        snapshots.daily[d] = {
          ...dayData,
          followers: daily[d]?.followers ?? null,
          newFollowers: daily[d]?.newFollowers ?? 0,
          _backfilled: true, // mark as estimate
        };
        console.log(`[backfill] filled ${d}: ${dayData.impressions} impressions from ${Object.keys(byDay).length} tweet days`);
      }
    }

    saveSnapshots(snapshots);
  } catch (e) {
    console.error('[backfill] error:', e.message);
  }
}

// POST /api/snapshots/poll — manual trigger
app.post('/api/snapshots/poll', async (req, res) => {
  try {
    const result = await pollSnapshots();
    res.json(result);
  } catch (err) {
    console.error('[snapshots/poll]', err.message);
    res.json({ error: err.message });
  }
});

// GET /api/snapshots/daily — returns daily aggregates for chart
app.get('/api/snapshots/daily', (req, res) => {
  const period = req.query.period || '7d';
  const days   = period === '90d' ? 90 : period === '30d' ? 30 : 7;

  const snapshots = loadSnapshots();
  const daily = snapshots.daily || {};

  // Build a sorted list of days covering the requested period
  const result = [];
  let daysWithData = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const entry = daily[d] || null;
    const hasData = !!(entry && (entry.impressions > 0 || entry._backfilled));
    if (hasData) daysWithData++;
    result.push({
      date:         d.slice(5), // MM-DD
      fullDate:     d,
      impressions:  entry?.impressions  ?? 0,
      newFollowers: entry?.newFollowers ?? 0,
      followers:    entry?.followers    ?? null,
      likes:        entry?.likes        ?? 0,
      retweets:     entry?.retweets     ?? 0,
      replies:      entry?.replies      ?? 0,
      bookmarks:    entry?.bookmarks    ?? 0,
      hasData,
      backfilled:   entry?._backfilled ?? false,
    });
  }

  // Include latest cumulative totals so the UI can fall back to them
  const cumDates = Object.keys(snapshots.cumulative || {}).sort();
  const latestCum = cumDates.length > 0
    ? (snapshots.cumulative[cumDates[cumDates.length - 1]] || []).slice(-1)[0]
    : null;

  const hasAnyData = result.some(r => r.hasData);
  res.json({
    days: result,
    hasData: hasAnyData,
    daysWithData,
    period,
    cumulativeTotals: latestCum ? {
      impressions: latestCum.impressions,
      likes: latestCum.likes,
      retweets: latestCum.retweets,
      replies: latestCum.replies,
      bookmarks: latestCum.bookmarks,
    } : null,
  });
});

// Serve static files in production
const distPath = path.join(__dirname, '..', 'ui', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3848;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🚀 Xcellent server running at http://localhost:${PORT}`);
  console.log(`  📊 Dashboard: http://localhost:3847 (dev) or http://localhost:${PORT} (prod)\n`);
});

// Auto-poll snapshots: 5 min after boot (delay to avoid rate-limiting dashboard), then every 4 hours
// Also run backfill once on boot for missing historical days
setTimeout(async () => {
  console.log('[snapshots] running first poll (boot+5min)...');
  try {
    await pollSnapshots();
    console.log('[backfill] running one-time backfill check...');
    await backfillMissingDays();
  } catch (e) {
    console.error('[snapshots] boot poll error:', e.message);
  }
}, 5 * 60 * 1000);

setInterval(() => {
  console.log('[snapshots] running scheduled poll...');
  pollSnapshots().catch(e => console.error('[snapshots] scheduled poll error:', e.message));
}, 4 * 60 * 60 * 1000);
