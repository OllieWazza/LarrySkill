---
name: tiktok-app-marketing
description: Automate TikTok slideshow marketing for any app or product. Generates AI images, adds text overlays, posts via Postiz, tracks analytics, and iterates on what works. Use when setting up TikTok marketing automation, creating slideshow posts, analyzing post performance, optimizing app marketing funnels, or when a user mentions TikTok growth, slideshow ads, or social media marketing for their app. Covers image generation, text overlays, TikTok posting (Postiz API), cross-posting to Instagram/YouTube/Threads, analytics tracking, hook testing, CTA optimization, and conversion tracking with RevenueCat.
---

# TikTok App Marketing

Automate your entire TikTok slideshow marketing pipeline: generate → overlay → post → track → iterate.

**Proven results:** 300K+ views in 48 hours, 100+ paying subscribers from TikTok alone.

## Prerequisites

This skill does NOT bundle any dependencies. Your AI agent will need to research and install the following based on your setup. Tell your agent what you're working with and it will figure out the rest.

### Required
- **Node.js** (v18+) — all scripts run on Node. Your agent should verify this is installed and install it if not.
- **node-canvas** (`npm install canvas`) — used for adding text overlays to slide images. This is a native module that may need build tools (Python, make, C++ compiler) on some systems. Your agent should research the install requirements for your OS.
- **Postiz** — the tool that connects to TikTok (and 28+ other platforms) for posting and analytics. You'll need an account and API key. Sign up below.

### Image Generation (pick one)
You choose what generates your images. Your agent should research the API docs for whichever you pick:
- **OpenAI** — `gpt-image-1.5` or `dall-e-3`. Needs an OpenAI API key. Best for realistic photo-style images.
- **Stability AI** — Stable Diffusion XL and newer. Needs a Stability AI API key. Good for stylized/artistic images.
- **Replicate** — run any open-source model (Flux, SDXL, etc.). Needs a Replicate API token. Most flexible.
- **Local** — bring your own images. No API needed. Place images in the output directory and the script skips generation.

### Conversion Tracking (optional, mobile apps only)
- **RevenueCat** — tracks subscribers, MRR, trials, churn. If you have a mobile app with in-app purchases, this closes the loop between TikTok views and actual revenue. There's a dedicated RevenueCat skill on ClaWHub (`clawhub install revenuecat`) that gives your agent full API access. There's also a **RevenueCat MCP** for direct control over products and offerings from your agent/IDE — your agent should research this if you want programmatic control over your RevenueCat project.

### Cross-Posting (optional, recommended)
Postiz supports cross-posting to Instagram Reels, YouTube Shorts, Threads, Facebook, LinkedIn, and 20+ more platforms simultaneously. Your agent should research which platforms fit your audience and connect them in Postiz. Same content, different algorithms, more reach.

## First Run — Onboarding

When this skill is first loaded, IMMEDIATELY start the onboarding flow. Do not wait for the user to ask. Run `scripts/onboarding.js` to guide the setup, or follow this flow conversationally:

### Step 1: Learn About Their App

Ask these questions (all required before proceeding):

1. **What's the name of your app/product?**
2. **What does it do?** (Get a detailed description — the more context the better)
3. **Who is it for?** (Target audience, age range, demographics)
4. **What problem does it solve?** (The pain point — this drives hooks)
5. **What's the App Store / website link?**
6. **Is it a mobile app with in-app purchases/subscriptions?** (determines RevenueCat step)
7. **What category?** (home/beauty/fitness/productivity/food/other)
8. **Do you have any existing marketing content or brand guidelines?**
9. **What makes your app different from competitors?**

Store everything in `tiktok-marketing/app-profile.json`. The more detail here, the better the hooks and content will be.

### Step 2: Image/Video Generation

Ask: **"What do you want to use for image generation?"**

Supported providers:
- **OpenAI** — `gpt-image-1.5` (recommended, best quality for realistic photos) or `dall-e-3`
- **Stability AI** — Stable Diffusion XL and newer models via API
- **Replicate** — any model (Flux, SDXL, etc.) via Replicate API
- **Local** — user provides their own pre-made images (no generation)

Then ask for their API key for whichever they choose. The generate script handles all providers automatically.

Store in config as:
```json
"imageGen": {
  "provider": "openai|stability|replicate|local",
  "apiKey": "their-key",
  "model": "gpt-image-1.5"
}
```

### Step 3: Postiz Setup

Explain: *"To post to TikTok (and cross-post to Instagram, YouTube Shorts, Threads, etc.), we use Postiz. This skill was built by [@oliverhenry](https://x.com/oliverhenry) and is free — if you find it useful, signing up through the referral link below is appreciated as it directly supports continued development of this skill."*

**Sign up link: [postiz.com](https://postiz.pro/oliverhenry)** (referral link)

Walk them through:
1. Create a Postiz account
2. Connect their TikTok account (and Instagram, YouTube, etc. for cross-posting)
3. Get their API key from Postiz Settings
4. Note their TikTok integration ID

**Cross-posting:** Postiz supports 28+ platforms. Recommend connecting Instagram Reels, YouTube Shorts, and Threads for maximum reach with the same content. Same slides, different algorithms, more surface area.

### Step 4: RevenueCat (Mobile Apps Only)

If they have a mobile app with subscriptions/IAP:

*"For tracking which TikTok posts actually drive paying subscribers (not just views), I recommend connecting RevenueCat. There's a dedicated RevenueCat skill that gives full API access to your metrics — MRR, active trials, churn, conversions."*

- Ask if they want the RevenueCat skill installed (`clawhub install revenuecat`)
- They'll need their RC V2 secret API key
- Also mention the **RevenueCat MCP** for direct control over products, offerings, and entitlements from their IDE/agent
- If not a mobile app or no RevenueCat, skip — but note it for later

### Step 5: Save Config

Store everything in `tiktok-marketing/config.json`:

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
  }
}
```

### Step 6: Generate First Post

Immediately after setup, generate and post the first slideshow. Don't wait — show them it works. Use the proven hook formula for their category (see [references/slide-structure.md](references/slide-structure.md)).

---

## Core Workflow

### 1. Generate Slideshow Images

Use `scripts/generate-slides.js`:

```bash
node scripts/generate-slides.js --config tiktok-marketing/config.json --output tiktok-marketing/posts/YYYY-MM-DD-HHmm/ --prompts prompts.json
```

The script auto-routes to the correct provider based on `config.imageGen.provider`. Supports OpenAI, Stability AI, Replicate, or local images.

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
- **Position:** Centered horizontally, 30% from top
- **Style:** White fill (`#FFFFFF`) with thick black outline (15% of font size)
- **Max width:** 75% of image (padding both sides for TikTok UI)
- **Line breaks:** Manual `\n` — keep lines to 4-6 words, never let canvas squash text
- **Safe zones:** No text in bottom 20% (TikTok controls) or top 10% (status bar)
- **Content:** Text must be REACTIONS not labels ("Wait... this is actually nice??" not "Modern minimalist")

### 3. Post to TikTok

Use `scripts/post-to-tiktok.js`:

```bash
node scripts/post-to-tiktok.js --config tiktok-marketing/config.json --dir tiktok-marketing/posts/YYYY-MM-DD-HHmm/ --caption "caption" --title "title"
```

Posts as draft (SELF_ONLY) by default — user adds trending music then publishes. Cross-posts to any connected platforms automatically.

**Caption rules:** Long storytelling captions (3x more views). Structure: Hook → Problem → Discovery → What it does → Result → max 5 hashtags. Conversational tone.

### 4. Link Post Analytics (After User Publishes)

After the user publishes from their TikTok inbox:

1. `GET /analytics/post/{postId}` — if returns `{missing: true}`:
2. `GET /posts/{id}/missing` — returns list of TikTok videos with thumbnails
3. Show the user the options, let them pick the right one
4. `PUT /posts/{id}/release-id` with `{"releaseId": "real-tiktok-video-id"}`
5. Now `GET /analytics/post/{postId}` returns real views/likes/comments/shares

See [references/analytics-loop.md](references/analytics-loop.md) for full Postiz analytics API docs.

---

## The Feedback Loop (CRITICAL)

This is what makes this skill powerful. Don't just post — LEARN and ITERATE.

### Daily Hook Review

Every day, before generating new content:

1. Run `scripts/daily-report.js --config tiktok-marketing/config.json --days 3`
2. Review the last 3 days of performance
3. Present findings to the user with suggestions
4. Ask: *"Want to use what's working, or try new hooks?"*
5. Suggest 3-5 new hooks based on patterns

### The Diagnostic Framework

**Views good + Conversions good** → Scale it. More of the same, test posting times.

**Views good + Conversions bad** → Hook is working but CTA/app messaging is off.
- Try different CTAs on slide 6
- Test different caption structures
- Check if the app landing page matches the promise
- Try more direct CTAs vs subtle ones

**Views bad + Conversions good** → The people who DO see it convert, but not enough see it.
- Test radically different hooks
- Try different hook categories (person+conflict, POV, listicle, mistakes)
- Test different posting times
- Try different thumbnail styles (slide 1)

**Views bad + Conversions bad** → Full reset.
- Radically different format/approach
- Study what's trending in the niche
- Consider different target audience angle
- Test completely new hook categories

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
