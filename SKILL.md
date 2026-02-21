---
name: xcellent
description: Free, open-source X (Twitter) growth tool. Analytics dashboard, niche discovery, AI tweet writer, best posting times, and credit usage monitoring — all running locally on your machine. BYOK (Bring Your Own Key) model means users only pay X directly for API usage (~$5-15/mo). A free alternative to SuperX ($39/mo), Typefully, and Tweet Hunter.
---

# Xcellent

Free X growth tool that runs as a **local web app in your browser**. No cloud, no database, no login, no subscription. Everything stays on your machine.

**Important:** Xcellent is a web-based dashboard that runs on localhost. When you start it, it launches a local web server and you access it at `http://localhost:3848` in your browser. It is NOT a CLI tool — it has a full visual UI with charts, tables, and interactive features. Always open the browser URL after starting the server.

## What It Does

1. **Dashboard** — Follower growth, impressions, engagement rate, profile visits
2. **Analytics** — Per-tweet performance, sortable by impressions/likes/engagement
3. **Niche Discovery** — Find accounts and trending content in any niche
4. **AI Tweet Writer** — Generate tweets in the user's voice, with style options
5. **Best Posting Times** — Calculated from the user's actual tweet data
6. **Credit Monitor** — Real-time X API usage tracking in the sidebar
7. **Scheduling** — Post via Postiz integration (optional)

## Architecture

- **Frontend:** React + Tailwind CSS + Vite (beautiful dark UI)
- **Backend:** Express.js (serves API + built UI)
- **Storage:** JSON files in `data/` directory (no database)
- **Runs on:** localhost:3848 (production) or localhost:3847 (dev)

## Quick Start

When the user installs this skill, clone the repo and run the start script:

```bash
# Clone the Xcellent repo
git clone https://github.com/OllieWazza/LarrySkill.git xcellent
cd xcellent

# Install dependencies
cd server && npm install && cd ..
cd ui && npm install && cd ..

# Build UI and start server
bash start.sh
```

This builds the UI and starts the server. Then **open http://localhost:3848 in the browser** — this is where the full dashboard lives. The terminal just runs the server; all the actual UI is in the browser.

If the repo is already cloned, just run `cd xcellent && bash start.sh` to start it.

The onboarding flow will guide the user through:
1. Why Xcellent exists and pricing comparison
2. How to get an X API key (step-by-step with links)
3. Real cost breakdown ($0.005/read, $0.01/user lookup, $0.01/post)
4. Entering credentials (stored locally only)
5. Optional Postiz connection for scheduling

## X API Pricing (for users)

Since January 2026, X uses pay-per-use pricing:
- $0.005 per post read
- $0.01 per user lookup  
- $0.01 per post created
- New accounts get a $10 free voucher
- Users can set spending limits in the X Developer Console

Typical creator usage: **$5-15/month** (vs $39/mo for SuperX, Typefully etc.)

## AI Tweet Writer

The writer uses the user's OpenAI API key (or falls back to placeholders). It:
- Analyzes the user's recent tweets for voice matching
- Generates 3 drafts per request in the chosen style
- Shows character count with 280-char limit indicator
- Can schedule directly via Postiz

## Development

```bash
# Dev mode (hot reload)
cd ui && npm run dev      # Frontend on :3847
cd server && node index.js # Backend on :3848
```

## Files

- `server/index.js` — Express API server with X API integration
- `ui/src/pages/Onboarding.jsx` — 6-step onboarding flow
- `ui/src/pages/Dashboard.jsx` — Main analytics dashboard
- `ui/src/pages/Analytics.jsx` — Per-tweet analytics table
- `ui/src/pages/NicheDiscovery.jsx` — Search & discover accounts
- `ui/src/pages/TweetWriter.jsx` — AI-powered tweet generation
- `ui/src/pages/Settings.jsx` — Credentials & usage management
- `data/config.json` — User credentials (local only)
- `data/history.json` — Follower snapshots, tweet cache, usage tracking

## macOS Local Network Permission

On macOS Sequoia (15.0+), Chrome needs **Local Network** permission to access `localhost` sites. Without it, Chrome will silently fail to connect to the local server (Safari works by default).

To enable: **System Settings → Privacy & Security → Local Network → enable Google Chrome**
