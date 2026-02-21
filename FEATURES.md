# Xcellent - Feature Spec (v2)

Based on SuperX competitor analysis + Ollie's feedback.

## Sidebar Navigation
- **Dashboard** (Home)
- **Queue** (Scheduled / Drafts / Posted / Failed)
- **Analytics**
- **Context** (About You, Interests, Favourite Creators, Products)
- **Create** section:
  - Daily Mix (auto-generated posts daily)
  - AI Writer (advanced: styles, threads, scheduling)
  - Viral Library (high-performing tweets in your niche)
- **Discover** section:
  - Trends (WOEID-based)
  - Niche Search
  - Monitored Accounts

## Onboarding Flow (8 steps)
1. **Welcome** - what Xcellent is, pricing breakdown (free vs SuperX $39/mo)
2. **Writing DNA** - Tinder-style swipe on 12-15 curated tweets (Pass/Like). Learns voice.
3. **About You** - free text bio (500 chars). "Used to personalize content"
4. **Your Interests** - tag picker by category (Business, Technology, Creativity, Lifestyle, Science, Finance). "Refresh from tweets" button.
5. **Favourite Creators** - pick up to 3 @handles. Suggested based on Writing DNA likes. Auto-added to Monitored Accounts.
6. **Your Products** - name, URL, one-liner. So AI can weave in natural CTAs.
7. **API Key** - Bearer token + OAuth creds entry + test connection
8. **Postiz** (optional) - for scheduling. Affiliate link.
9. **Launch** - personalized welcome modal with profile pic

## Dashboard
- AI Ghostwriter box at top
- 4 stat cards: Views (7d, hero), Followers (with sparkline), Top Post, Engagements
- Follower growth chart
- Posting streak (GitHub-style heatmap)
- Upcoming scheduled posts preview
- Daily Mix prompt ("Your daily mix awaits")
- Popular posts for you (from Viral Library)
- Trending Now

## Analytics Page
- Period selector (7d / 30d / 90d)
- 4 big stat cards with sparklines: Followers, Posts, Impressions, Engagements (each with change delta)
- Posting streak heatmap (GitHub contribution style)
- Engagement breakdown: Likes / RTs / Replies / Bookmarks with %
- Follower Gain chart (line/area)
- Best tweets table (sortable)
- Most followed followers

## Queue Page
- Tabs: Scheduled / Drafts / Posted / Failed
- Calendar view with time slots per day
- "Edit Queue" to set default posting times
- Drag tweets into slots
- Powered by Postiz API

## Context Settings Page
- About You (free text, 500 chars)
- Your Interests (tag picker by category, "Refresh from tweets")
- Favourite Creators (up to 3, search + add)
- Your Products (name, URL, description)
- Writing DNA (re-do the swipe flow)
- All stored in local data/config.json

## Viral Library Page
- Curated high-performing tweets from your niche
- Filtered by interest tags + monitored accounts
- Sorted by engagement rate
- "Use as inspiration" button → opens AI Writer with that tweet as seed

## Daily Mix
- Auto-generates 3-5 tweets daily based on:
  - Writing DNA (liked tweet styles)
  - About You + Interests
  - Products (occasional natural CTAs)
  - Trending topics
  - Favourite creators' recent posts
- "Post now" / "Schedule" / "Regenerate" buttons

## Caching Strategy
- Dashboard: 15min
- Analytics: 30min per period
- Trends: 30min
- Followers list: 1hr
- Monitored accounts: 15min
- Search/discover: 1hr per query
- All cached to data/cache.json

## Tech Stack
- Frontend: React + Tailwind + Vite (dark glass morphism theme)
- Backend: Express on single port
- Storage: JSON files (data/config.json, data/history.json, data/cache.json)
- Scheduling: Postiz API
- AI: OpenAI API (user's key) or OpenClaw agent
- Hosting: systemd user service on localhost
