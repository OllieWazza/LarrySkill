---
name: tiktok-app-marketing
description: Automate TikTok slideshow marketing for any app or product. Researches competitors, generates AI images, adds text overlays, posts via Postiz, tracks analytics, and iterates on what works. Use when setting up TikTok marketing automation, creating slideshow posts, analyzing post performance, optimizing app marketing funnels, or when a user mentions TikTok growth, slideshow ads, or social media marketing for their app. Covers competitor research (browser-based), image generation, text overlays, TikTok posting (Postiz API), cross-posting to Instagram/YouTube/Threads, analytics tracking, hook testing, CTA optimization, conversion tracking with RevenueCat, and a full feedback loop that adjusts hooks and CTAs based on views vs conversions.
---

# TikTok App Marketing

Automate your entire TikTok slideshow marketing pipeline: generate → overlay → post → track → iterate.

**Proven results:** 300K+ views in 48 hours, 100+ paying subscribers from TikTok alone.

## Prerequisites

This skill does NOT bundle any dependencies. Your AI agent will need to research and install the following based on your setup. Tell your agent what you're working with and it will figure out the rest.

### Required
- **Node.js** (v18+) — all scripts run on Node. Your agent should verify this is installed and install it if not.
- **node-canvas** (`npm install canvas`) — used for adding text overlays to slide images. This is a native module that may need build tools (Python, make, C++ compiler) on some systems. Your agent should research the install requirements for your OS.
- **Postiz** — this is the backbone of the whole system. Postiz handles posting to TikTok (and 28+ other platforms), but more importantly, it provides the **analytics API** that powers the daily feedback loop. Without Postiz, the agent can post but can't track what's working — and the feedback loop is what makes this skill actually grow your account instead of just posting blindly. Sign up at [postiz.pro/oliverhenry](https://postiz.pro/oliverhenry).

### Image Generation (pick one)
You choose what generates your images. Your agent should research the API docs for whichever you pick:
- **OpenAI** — `gpt-image-1.5` or `dall-e-3`. Needs an OpenAI API key. Best for realistic photo-style images.
- **Stability AI** — Stable Diffusion XL and newer. Needs a Stability AI API key. Good for stylized/artistic images.
- **Replicate** — run any open-source model (Flux, SDXL, etc.). Needs a Replicate API token. Most flexible.
- **Local** — bring your own images. No API needed. Place images in the output directory and the script skips generation.

### Conversion Tracking (optional but recommended for mobile apps)
- **RevenueCat** — this is what completes the intelligence loop. Postiz tells you which posts get views. RevenueCat tells you which posts drive **paying users**. Combined, the agent can distinguish between a viral post that makes no money and a modest post that actually converts — and optimize accordingly. Install the RevenueCat skill from ClaWHub (`clawhub install revenuecat`) for full API access to subscribers, MRR, trials, churn, and revenue. There's also a **RevenueCat MCP** for programmatic control over products and offerings from your agent/IDE.

### Cross-Posting (optional, recommended)
Postiz supports cross-posting to Instagram Reels, YouTube Shorts, Threads, Facebook, LinkedIn, and 20+ more platforms simultaneously. Your agent should research which platforms fit your audience and connect them in Postiz. Same content, different algorithms, more reach.

## First Run — Onboarding

When this skill is first loaded, IMMEDIATELY start a conversation with the user. Don't dump a checklist — talk to them like a human marketing partner would. The flow below is a guide, not a script. Be natural. Ask one or two things at a time. React to what they say. Build on their answers.

**Important:** Use `scripts/onboarding.js --validate` at the end to confirm the config is complete.

### Phase 1: Get to Know Their App (Conversational)

Start casual. Something like:

> "Hey! Let's get your TikTok marketing set up. First — tell me about your app. What's it called, what does it do?"

Then FOLLOW UP based on what they say. Don't ask all 9 questions at once. Pull the thread:

- They mention what it does → ask who it's for ("Who's your ideal user?")
- They describe the audience → ask about the pain point ("What's the main problem it solves for them?")
- They explain the problem → ask what makes them different ("What makes yours stand out vs alternatives?")
- Get the App Store / website link naturally ("Can you drop me the link?")
- Figure out if it's a mobile app with subscriptions (often obvious from context, otherwise ask)
- Determine category (home/beauty/fitness/productivity/food/other) — often inferable

**Don't ask for "brand guidelines" robotically.** Instead: "Do you have any existing content or a vibe you're going for? Or are we starting fresh?"

Store everything in `tiktok-marketing/app-profile.json`.

### Phase 2: Competitor Research (Requires Browser Permission)

Before building any content strategy, research what competitors are doing on TikTok. This is critical — you need to know the landscape.

Ask the user:

> "Before we start creating content, I want to research what your competitors are doing on TikTok — what's getting views in your niche, what hooks they're using, what's working and what's not. Can I use the browser to look around TikTok and the App Store?"

**Wait for permission.** Then:

1. **Search TikTok** for the app's niche (e.g. "interior design app", "lip filler filter", "fitness transformation app")
2. **Find 3-5 competitor accounts** posting similar content
3. **Analyze their top-performing content:**
   - What hooks are they using?
   - What slide format? (before/after, listicle, POV, tutorial)
   - How many views on their best vs average posts?
   - What's their posting frequency?
   - What CTAs are they using?
   - What music/sounds are trending in the niche?
4. **Check the App Store** for the app's category — look at competitor apps, their screenshots, descriptions, ratings
5. **Compile findings** into `tiktok-marketing/competitor-research.json`:

```json
{
  "researchDate": "2026-02-16",
  "competitors": [
    {
      "name": "CompetitorApp",
      "tiktokHandle": "@competitor",
      "followers": 50000,
      "topHooks": ["hook 1", "hook 2"],
      "avgViews": 15000,
      "bestVideo": { "views": 500000, "hook": "..." },
      "format": "before-after slideshows",
      "postingFrequency": "daily",
      "cta": "link in bio",
      "notes": "Strong at X, weak at Y"
    }
  ],
  "nicheInsights": {
    "trendingSounds": [],
    "commonFormats": [],
    "gapOpportunities": "What competitors AREN'T doing that we could",
    "avoidPatterns": "What's clearly not working"
  }
}
```

6. **Share findings with the user** conversationally:

> "So I looked at what's out there. [Competitor A] is doing well with [format] — their best post got [X] views using [hook type]. But I noticed nobody's really doing [gap]. That's our angle."

This research directly informs hook generation and content strategy. Reference it when creating posts.

### Phase 3: Image/Video Generation

Ask naturally:

> "For the slideshows, we need images. What do you want to use? I can work with OpenAI (gpt-image-1.5 is great for realistic photos), Stability AI, Replicate, or you can bring your own images."

Let them pick. Get their API key. If they're unsure, recommend based on their category (e.g. "For realistic room photos, OpenAI's gpt-image-1.5 is the best I've seen").

Store in config as `imageGen` with provider, apiKey, and model.

**Then — and this is critical — work through the image style with them.** Don't just use a generic prompt. Bad images = nobody watches. Ask these naturally, one or two at a time:

> "Now let's figure out what these images should actually look like. Do you want them to look like real photos someone took on their phone, or more like polished graphics or illustrations?"

Then based on their answer, dig deeper:

- **What's the subject?** "What are we actually showing? Rooms? Faces? Products? Before/after comparisons?"
- **What vibe?** "Cozy and warm? Clean and minimal? Luxurious? Think about what your audience relates to or aspires to."
- **Consistency:** "Should all 6 slides look like the same place or person? If yes — I need to lock down specific details so each slide doesn't look totally different."
- **Must-have elements?** "Anything that HAS to be in every image? A specific product? Certain furniture? A pet?"

Build the base prompt WITH them. A good base prompt looks like:

```
iPhone photo of a [specific room/scene], [specific style], [specific details].
Realistic lighting, natural colors, taken on iPhone 15 Pro.
No text, no watermarks, no logos.
[Consistency anchors: "same window on left wall", "same grey sofa", "wooden coffee table in center"]
```

**Save the agreed prompt style to config as `imageGen.basePrompt`** so every future post uses it.

**Key prompt rules (explain these as they come up, don't lecture):**
- "iPhone photo" + "realistic lighting" = looks real, not AI-generated
- Lock architecture/layout in EVERY slide prompt or each slide looks like a different place
- Include everyday objects (mugs, remotes, magazines) for lived-in feel
- For before/after: "before" = modern but tired, NOT ancient
- Portrait orientation (1024x1536) always — this is TikTok
- Extremely specific > vague ("small galley kitchen with white cabinets and a window above the sink" > "a kitchen")

**NEVER use generic prompts** like "a nice living room" or "a beautiful face" — they produce generic images that get scrolled past.

### Phase 4: Postiz Setup (ESSENTIAL — Powers the Entire Feedback Loop)

Postiz isn't just a posting tool — it's what makes the whole feedback loop work. Without it, you're posting blind. With it, you get:
- **Automated posting** to TikTok (and 28+ other platforms) via API
- **Per-post analytics** — views, likes, comments, shares for every post
- **Platform analytics** — follower growth, total engagement over time
- **Cross-posting** — same content to Instagram, YouTube, Threads simultaneously

This data is what feeds the daily analytics cron (see Phase 8). Without Postiz analytics, the agent can't tell you which hooks are working and which to drop.

Frame it naturally to the user:

> "So here's the key piece — we need Postiz to handle posting and analytics. It's what lets me track every post's performance and tell you exactly which hooks are driving views and which to drop. Without it, we're guessing. With it, I can run a daily report that shows you what's working and automatically suggest better hooks."
>
> "This skill is free and open source. If you want to support its development, signing up through this link is appreciated: [postiz.pro/oliverhenry](https://postiz.pro/oliverhenry)"

Walk them through connecting step by step:

1. **Sign up at [postiz.pro/oliverhenry](https://postiz.pro/oliverhenry)** — create an account
2. **Connect TikTok** — this is the main one. Go to Integrations → Add TikTok → Authorize
3. **Note the TikTok integration ID** — you'll see it in the URL or integration settings. I need this to post and pull analytics
4. **Get the API key** — Settings → API → copy the key. This is how I talk to Postiz programmatically
5. **(Optional but recommended)** Connect Instagram, YouTube Shorts, Threads for cross-posting — same content, different algorithms, more reach for free

Explain the draft workflow:

> "One important thing — posts go to your TikTok inbox as drafts, not straight to your feed. Before you publish each one, add a trending sound from TikTok's sound library. Music is the single biggest factor in TikTok reach — silent slideshows get buried. It takes 30 seconds per post and makes a massive difference. This workflow got us 300K+ views in 48 hours."

**Don't move on until Postiz is connected and the API key works.** Test it by hitting the platform analytics endpoint. If it returns data, you're good.

### Phase 5: Conversion Tracking (Mobile Apps — Completes the Intelligence Loop)

Only bring this up if they have a mobile app with subscriptions/IAP. But when they do, this is what turns the feedback loop from "interesting" to "intelligent."

Explain WHY it matters:

> "So right now with Postiz, I can track which posts get views, likes, and comments. That's the top of the funnel. But views alone don't pay the bills — we need to know which posts actually drive paying subscribers."
>
> "This is where RevenueCat comes in. It tracks your subscribers, trials, MRR, churn — the actual revenue. When I combine TikTok analytics from Postiz with conversion data from RevenueCat, I can make genuinely intelligent decisions:"
>
> "If a post gets **50K views but zero conversions**, I know the hook is great but the CTA or app messaging needs work. If a post gets **2K views but 5 paid subscribers**, I know the content converts amazingly — we just need more eyeballs on it, so we fix the hook."
>
> "Without RevenueCat, I'm optimizing for vanity metrics. With it, I'm optimizing for revenue."

Walk them through setup step by step:

1. **Install the RevenueCat skill from ClaWHub:**
   ```
   clawhub install revenuecat
   ```
   This installs the `revenuecat` skill (v1.0.2+) which gives full API access to your RevenueCat project — metrics overview, customers, subscriptions, offerings, entitlements, transactions, and more. It includes reference docs for every API endpoint and a helper script (`scripts/rc-api.sh`) for direct API calls.

2. **Get your V2 secret API key** from the RevenueCat dashboard:
   - Go to your RC project → Settings → API Keys
   - Generate a **V2 secret key** (starts with `sk_`)
   - ⚠️ This is a SECRET key — don't commit it to public repos

3. **Set the environment variable:**
   ```
   export RC_API_KEY=sk_your_key_here
   ```

4. **Verify it works:** Run `./skills/revenuecat/scripts/rc-api.sh /projects` — should return your project details.

5. **Optional: RevenueCat MCP** — for programmatic control over products, offerings, and entitlements from your agent or IDE. Ask your agent to research setting this up.

**What RevenueCat gives the daily report:**
- `GET /projects/{id}/metrics/overview` → MRR, active subscribers, active trials, churn rate
- `GET /projects/{id}/transactions` → individual purchases with timestamps (for conversion attribution)
- The daily cron cross-references transaction timestamps with post publish times (24-72h window) to identify which posts drove which conversions

**The intelligence this unlocks:**
- "This hook got 50K views but zero conversions" → hook is great, CTA needs work
- "This hook got 5K views but 3 paid subscribers" → content converts amazingly, fix the hook for more reach
- "Conversions are consistently poor across all posts" → might be an app issue (onboarding, paywall, pricing) not a content issue — the skill flags this for investigation

**Without RevenueCat:** The loop still works on Postiz analytics (views/likes/comments). You can optimize for engagement. But you're flying blind on revenue.

**With RevenueCat:** You optimize for actual paying users. That's the whole point.

If they don't use RevenueCat or don't have subscriptions, skip this entirely.

### Phase 6: Content Strategy (Built from Research)

Using the competitor research AND the app profile, build an initial content strategy:

> "Based on what I found and what your app does, here's my plan for the first week..."

Present:
1. **3-5 hook ideas** tailored to their niche + competitor gaps
2. **Posting schedule** recommendation (default: 7:30am, 4:30pm, 9pm — their timezone)
3. **Which hook categories to test first** (reference what worked for competitors)
4. **Cross-posting plan** (which platforms, same or adapted content)

Save the strategy to `tiktok-marketing/strategy.json`.

### Phase 7: Set Up the Daily Analytics Cron

This is what makes the whole system self-improving. Set up a daily cron job that:

1. Pulls the last 3 days of post analytics from Postiz
2. Pulls conversion data from RevenueCat (if connected)
3. Cross-references views with conversions to diagnose what's working
4. Generates a report with specific recommendations
5. Suggests new hooks based on performance patterns

Explain to the user:

> "I'm going to set up a daily check that runs every morning. It looks at how your posts from the last 3 days performed — views, engagement, and if you've got RevenueCat connected, actual conversions. Then it tells you exactly what's working and what to change."
>
> "Posts typically peak at 24-48 hours, and conversions take up to 72 hours to attribute, so checking a 3-day window gives us the full picture."

**Set up the cron:**

Use the agent's cron system to schedule a daily analytics job. Run it every morning before the first post of the day (e.g. 7:00 AM in the user's timezone) so the report informs that day's content:

```
Schedule: daily at 07:00 (user's timezone)
Task: Run scripts/daily-report.js --config tiktok-marketing/config.json --days 3
Output: tiktok-marketing/reports/YYYY-MM-DD.md + message to user with summary
```

The daily report uses the diagnostic framework:
- **High views + High conversions** → Scale it — more of the same, test posting times
- **High views + Low conversions** → Hook works, CTA is broken — test new CTAs on slide 6, check app landing page
- **Low views + High conversions** → Content converts but nobody sees it — test radically different hooks, keep the CTA
- **Low views + Low conversions** → Full reset — new format, new audience angle, new hook categories

This is the intelligence layer. Without it, you're just posting and hoping. With it, every day's content is informed by data.

### Phase 8: Save Config & First Post

Store everything in `tiktok-marketing/config.json` (this is the source of truth for the entire pipeline):

```json
{
  "app": {
    "name": "AppName",
    "description": "Detailed description",
    "audience": "Target demographic",
    "problem": "Pain point it solves",
    "differentiator": "What makes it unique",
    "appStoreUrl": "https://...",
    "category": "home|beauty|fitness|productivity|food|other",
    "isMobileApp": true
  },
  "imageGen": {
    "provider": "openai",
    "apiKey": "sk-...",
    "model": "gpt-image-1.5"
  },
  "postiz": {
    "apiKey": "your-postiz-key",
    "integrationIds": {
      "tiktok": "id-here",
      "instagram": "id-here-optional",
      "youtube": "id-here-optional"
    }
  },
  "revenuecat": {
    "enabled": false,
    "v2SecretKey": "sk_...",
    "projectId": "proj..."
  },
  "posting": {
    "privacyLevel": "SELF_ONLY",
    "schedule": ["07:30", "16:30", "21:00"],
    "crossPost": ["instagram", "youtube"]
  },
  "competitors": "tiktok-marketing/competitor-research.json",
  "strategy": "tiktok-marketing/strategy.json"
}
```

Then immediately generate and post the first slideshow. Don't wait — show them it works. Use the hook strategy built from competitor research and their category (see [references/slide-structure.md](references/slide-structure.md)).

---

## Core Workflow

### 1. Generate Slideshow Images

Use `scripts/generate-slides.js`:

```bash
node scripts/generate-slides.js --config tiktok-marketing/config.json --output tiktok-marketing/posts/YYYY-MM-DD-HHmm/ --prompts prompts.json
```

The script auto-routes to the correct provider based on `config.imageGen.provider`. Supports OpenAI, Stability AI, Replicate, or local images.

**⚠️ Timeout warning:** Generating 6 images takes 3-9 minutes total (30-90 seconds each for gpt-image-1.5). Set your exec timeout to at least **600 seconds (10 minutes)**. If you get `spawnSync ETIMEDOUT`, the exec timeout is too short. The script supports resume — if it fails partway, re-run it and completed slides will be skipped.

**Critical image rules (all providers):**
- ALWAYS portrait aspect ratio (1024x1536 or 9:16 equivalent) — fills TikTok screen
- Include "iPhone photo" and "realistic lighting" in prompts (for AI providers)
- ALL 6 slides share the EXACT same base description (only style/feature changes)
- Lock key elements across all slides (architecture, face shape, camera angle)
- See [references/slide-structure.md](references/slide-structure.md) for the 6-slide formula

### 2. Add Text Overlays

Use `scripts/add-text-overlay.js`:

```bash
node scripts/add-text-overlay.js --input tiktok-marketing/posts/YYYY-MM-DD-HHmm/ --texts texts.json
```

Uses `node-canvas` to render text directly onto slide images. All dimensions are relative to image size so they work at any resolution.

**Text overlay spec:**
- **Font size:** 6.5% of image width (~66px on 1024w)
- **Position:** Centered horizontally, centered vertically around 30% from top
- **Style:** White fill (`#FFFFFF`) with thick black outline (15% of font size)
- **Max width:** 75% of image (padding both sides for TikTok UI)
- **Safe zones:** No text in bottom 20% (TikTok controls) or top 10% (status bar)
- **Content:** Text must be REACTIONS not labels ("Wait... this is actually nice??" not "Modern minimalist")

**⚠️ LINE BREAKS ARE CRITICAL — Read This:**

The `texts.json` file must contain text with `\n` line breaks to control where lines wrap. If you pass a single long string without line breaks, the script will auto-wrap, but **manual breaks look much better** because you control the rhythm.

**Good (manual breaks, 4-6 words per line):**
```json
[
  "I showed my landlord\nwhat AI thinks our\nkitchen should look like",
  "She said you can't\nchange anything\nchallenge accepted",
  "So I downloaded\nthis app and\ntook one photo",
  "Wait... is this\nactually the same\nkitchen??",
  "Okay I'm literally\nobsessed with\nthis one",
  "Snugly showed me\nwhat's possible\nlink in bio"
]
```

**Bad (no breaks — will auto-wrap but looks worse):**
```json
[
  "I showed my landlord what AI thinks our kitchen should look like",
  ...
]
```

**Rules for writing overlay text:**
1. **4-6 words per line MAX** — short lines are scannable at a glance
2. **Use `\n` to break lines** — gives you control over the rhythm
3. **3-4 lines per slide is ideal** — more lines are fine, they won't overflow
4. **Read it out loud** — each line should feel like a natural pause
5. **No emoji** — canvas can't render them, they'll show as blank
6. **REACTIONS not labels** — "Wait... this is nice??" not "Modern minimalist"

The script auto-wraps any line that exceeds 75% width as a safety net, but always prefer manual `\n` breaks for the best visual result.

### 3. Post to TikTok

Use `scripts/post-to-tiktok.js`:

```bash
node scripts/post-to-tiktok.js --config tiktok-marketing/config.json --dir tiktok-marketing/posts/YYYY-MM-DD-HHmm/ --caption "caption" --title "title"
```

### Why We Post as Drafts (SELF_ONLY) — Best Practice

Posts go to your TikTok inbox as drafts, NOT published directly. This is intentional and critical:

1. **Music is everything on TikTok.** Trending sounds massively boost reach. The algorithm favours posts using popular audio. An API can't pick the right trending sound — you need to browse TikTok's sound library and pick what's hot RIGHT NOW in your niche.
2. **You add the music manually**, then publish from your TikTok inbox. Takes 30 seconds per post.
3. **Posts without music get buried.** Silent slideshows look like ads and get skipped. A trending sound makes your content feel native.
4. **Creative control.** You can preview the final slideshow with music before it goes live. If something looks off, fix it before publishing.

This is the workflow that got us 300K+ views in 48 hours. Don't skip the music step.

**Tell the user during onboarding:** "Posts will land in your TikTok inbox as drafts. Before publishing each one, add a trending sound from TikTok's library — this is the single biggest factor in reach. It takes 30 seconds and makes a massive difference."

Cross-posts to any connected platforms (Instagram, YouTube, etc.) automatically via Postiz.

**Caption rules:** Long storytelling captions (3x more views). Structure: Hook → Problem → Discovery → What it does → Result → max 5 hashtags. Conversational tone.

### 4. Connect Post Analytics (After User Publishes)

After the user publishes from their TikTok inbox, the post needs to be connected to its TikTok video ID before per-post analytics work.

**⚠️ CRITICAL: Wait at least 1-2 hours after publishing before connecting.** TikTok's API has an indexing delay — if you try to connect immediately, the new video won't be in the list yet, and you might connect to the wrong video. This mistake is hard to undo (Postiz doesn't easily allow overwriting a release ID once set).

Use `scripts/check-analytics.js` to automate the connection:

```bash
node scripts/check-analytics.js --config tiktok-marketing/config.json --days 3 --connect
```

The script:
1. Fetches all Postiz posts from the last N days
2. Skips posts published less than 2 hours ago (indexing delay)
3. For unconnected posts, calls `GET /posts/{id}/missing` to get all TikTok videos on the account
4. Matches posts to videos chronologically (TikTok IDs are sequential: higher number = newer video)
5. Excludes already-connected video IDs to avoid duplicates
6. Connects each post via `PUT /posts/{id}/release-id`
7. Pulls per-post analytics (views, likes, comments, shares)

**How the matching works:**
- TikTok video IDs are sequential integers (e.g. `7605531854921354518`, `7605630185727118614`)
- Higher number = more recently published
- Sort both Postiz posts (by publish date) and TikTok IDs (numerically) in the same order
- Match them up: oldest post → lowest unconnected ID, newest post → highest unconnected ID
- This is reliable because both Postiz and TikTok maintain chronological order

**Manual connection (if needed):**
1. `GET /posts/{id}/missing` — returns all TikTok videos with thumbnail URLs
2. Identify the correct video by thumbnail or timing
3. `PUT /posts/{id}/release-id` with `{"releaseId": "tiktok-video-id"}`
4. `GET /analytics/post/{id}` now returns views/likes/comments/shares

**The daily cron handles all of this automatically.** It runs in the morning, checks posts from the last 3 days (all well past the 2-hour indexing window), connects any unconnected posts, and generates the report.

### ⚠️ Known Issue: Release ID Cannot Be Overwritten

Once a Postiz post is connected to a TikTok video ID via `PUT /posts/{id}/release-id`, **it cannot be changed**. If you connect the wrong video, the analytics will permanently show the wrong video's stats for that post. The PUT endpoint appears to accept the update but silently keeps the original ID.

**This is why the 2-hour wait is non-negotiable.** If you connect too early (before TikTok has indexed the new video), the `missing` endpoint will show older videos and you'll connect the wrong one. There is no undo.

**Best practice:**
1. Post as draft → user publishes with music
2. Wait at least 2 hours (the daily morning cron handles this naturally)
3. The newest unconnected TikTok video ID (highest number) corresponds to the most recently published video
4. Always verify: the number of unconnected Postiz posts should match the number of new TikTok video IDs since the last connection run
5. If something looks wrong, ask the user to confirm by checking the video thumbnail

See [references/analytics-loop.md](references/analytics-loop.md) for full Postiz analytics API docs.

---

## The Feedback Loop (CRITICAL — This is What Makes It Work)

This is what separates "posting TikToks" from "running a marketing machine." The daily cron pulls data from two sources:

1. **Postiz** → per-post TikTok analytics (views, likes, comments, shares)
2. **RevenueCat** (if connected) → conversion data (trial starts, paid subscriptions, revenue)

Combined, the agent can make intelligent decisions about what to do next — not guessing, not vibes, actual data-driven optimization.

### The Daily Cron (Set Up During Onboarding)

Every morning before the first post, the cron runs `scripts/daily-report.js`:

1. Pulls the last 3 days of posts from Postiz (posts peak at 24-48h)
2. Fetches per-post analytics for each (views, likes, comments, shares)
3. If RevenueCat is connected, pulls conversion events in the same window (24-72h attribution)
4. Cross-references: which posts drove views AND which drove paying users
5. Applies the diagnostic framework (below) to determine what's working
6. Generates `tiktok-marketing/reports/YYYY-MM-DD.md` with findings
7. Messages the user with a summary + suggested hooks for today

### The Diagnostic Framework

This is the core intelligence. Two axes: **views** (are people seeing it?) and **conversions** (are people paying?).

**High views + High conversions** → 🟢 SCALE IT
- This is working. Make 3 variations of the winning hook immediately
- Test different posting times to find the sweet spot
- Cross-post to more platforms for extra reach
- Don't change anything about the CTA — it's converting

**High views + Low conversions** → 🟡 FIX THE CTA
- The hook is doing its job — people are watching. But they're not downloading/subscribing
- Try different CTAs on slide 6 (direct vs subtle, "download" vs "search on App Store")
- Check if the app landing page matches the promise in the slideshow
- Test different caption structures — maybe the CTA is buried
- The hook is gold — don't touch it. Fix everything downstream

**Low views + High conversions** → 🟡 FIX THE HOOKS
- The people who DO see it are converting — the content and CTA are great
- But not enough people are seeing it, so the hook/thumbnail isn't stopping the scroll
- Test radically different hooks (person+conflict, POV, listicle, mistakes format)
- Try different posting times and different slide 1 images
- Keep the CTA and content structure identical — just change the hook

**Low views + Low conversions** → 🔴 FULL RESET
- Neither the hook nor the conversion path is working
- Try a completely different format or approach
- Research what's trending in the niche RIGHT NOW (use browser)
- Consider a different target audience angle
- Test new hook categories from scratch
- Reference competitor research for what's working for others

**Consistently poor conversions across ALL hooks** → 🔴 APP ISSUE
- If multiple high-view posts all have poor conversions, the problem isn't the content — it's downstream
- Check the app's onboarding flow (is it confusing? too long? too short?)
- Check the paywall (is it shown too early? too expensive? unclear value?)
- Check the App Store page (does it match what the TikTok posts promise?)
- Check if the "link in bio" actually works and goes to the right place
- Consider A/B testing the paywall or onboarding before making more content
- This is a signal to pause posting and fix the app experience first

### Hook Evolution

Track in `tiktok-marketing/hook-performance.json`:

```json
{
  "hooks": [
    {
      "text": "My boyfriend said our flat looks like a catalogue",
      "category": "person-conflict-ai",
      "attempts": 3,
      "avgViews": 45000,
      "avgConversions": 4,
      "status": "winner"
    }
  ],
  "rules": {
    "doubleDown": ["person-conflict-ai", "landlord-hooks"],
    "testing": ["listicle", "pov-format"],
    "dropped": ["self-complaint", "price-comparison"]
  }
}
```

**Decision rules:**
- 50K+ views → DOUBLE DOWN — make 3 variations immediately
- 10K-50K → Good — keep in rotation
- 1K-10K → Try 1 more variation
- <1K twice → DROP — try something radically different

### CTA Testing

When views are good but conversions are low, cycle through CTAs:
- "Download [App] — link in bio"
- "[App] is free to try — link in bio"
- "I used [App] for this — link in bio"
- "Search [App] on the App Store"
- No explicit CTA (just app name visible)

Track which CTAs convert best per hook category.

---

## Posting Schedule

Optimal times (adjust for audience timezone):
- **7:30 AM** — catch early scrollers
- **4:30 PM** — afternoon break
- **9:00 PM** — evening wind-down

3x/day minimum. Consistency beats sporadic viral hits. 100 posts beats 1 viral.

## Cross-Posting

Postiz supports cross-posting the same content to multiple platforms simultaneously. Recommend:
- **Instagram Reels** — especially strong for beauty/lifestyle/home
- **YouTube Shorts** — long-tail discovery
- **Threads** — lightweight engagement driver

Same slides, different algorithms, more surface area. Each platform's algo evaluates content independently.

## App Category Templates

See [references/app-categories.md](references/app-categories.md) for category-specific slide prompts and hook formulas.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| 1536x1024 (landscape) | Use 1024x1536 (portrait) |
| Font at 5% | Use 6.5% of width |
| Text at bottom | Position at 30% from top |
| Different rooms per slide | Lock architecture in EVERY prompt |
| Labels not reactions | "Wait this is nice??" not "Modern style" |
| Only tracking views | Track conversions — views without revenue = vanity |
| Same hooks forever | Iterate based on data, test new formats weekly |
| No cross-posting | Use Postiz to post everywhere simultaneously |
| Connecting release ID too soon | Wait 2+ hours — TikTok API indexing delay |
| Wrong video connected | Can't overwrite — always verify before connecting |
| `spawnSync ETIMEDOUT` | Exec timeout too short — image gen takes 3-9 min for 6 slides. Use a 10-minute timeout or generate slides one at a time |
