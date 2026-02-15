# Analytics & Feedback Loop

## Performance Tracking

### Postiz Analytics API

**Platform analytics** (followers, views, likes, comments, shares over time):
```
GET https://api.postiz.com/public/v1/analytics/{integrationId}
Authorization: {apiKey}
```

Response:
```json
[
  { "label": "Followers", "percentageChange": 2.4, "data": [{ "total": "1250", "date": "2025-01-01" }] },
  { "label": "Views", "percentageChange": 4, "data": [{ "total": "5000", "date": "2025-01-01" }] },
  { "label": "Total Likes", "data": [{ "total": "6709", "date": "2026-02-15" }] },
  { "label": "Recent Likes", "data": [{ "total": "6354", "date": "2026-02-15" }] },
  { "label": "Recent Comments", "data": [{ "total": "148", "date": "2026-02-15" }] },
  { "label": "Recent Shares", "data": [{ "total": "119", "date": "2026-02-15" }] },
  { "label": "Videos", "data": [{ "total": "43", "date": "2026-02-15" }] }
]
```

**Per-post analytics** (likes, comments per post):
```
GET https://api.postiz.com/public/v1/analytics/post/{postId}
Authorization: {apiKey}
```

Response:
```json
[
  { "label": "Likes", "percentageChange": 16.7, "data": [{ "total": "150", "date": "2025-01-01" }, { "total": "175", "date": "2025-01-02" }] },
  { "label": "Comments", "percentageChange": 20, "data": [{ "total": "25", "date": "2025-01-01" }, { "total": "30", "date": "2025-01-02" }] }
]
```

Note: Per-post analytics availability depends on the platform. TikTok may return empty arrays for some posts — in this case, fall back to the **delta method**: track platform-level view totals before and after each post to estimate per-post views.

**List posts** (to get post IDs for analytics):
```
GET https://api.postiz.com/public/v1/posts?startDate={ISO}&endDate={ISO}
Authorization: {apiKey}
```

### RevenueCat Integration (Optional)

If the user has RevenueCat, track conversions from TikTok:
- Downloads → Trial starts → Paid conversions
- UTM parameters in App Store link
- Compare conversion spikes with post timing

## The Feedback Loop

### After Every Post (24h)
Record in `hook-performance.json`:
```json
{
  "posts": [
    {
      "date": "2026-02-15",
      "hook": "boyfriend said flat looks like catalogue",
      "hookCategory": "person-conflict-ai",
      "views": 15000,
      "likes": 450,
      "comments": 23,
      "saves": 89,
      "postId": "postiz-id",
      "appCategory": "home"
    }
  ]
}
```

### Weekly Review
1. Sort posts by views
2. Identify top 3 hooks → create variations
3. Identify bottom 3 hooks → drop or radically change
4. Check if any hook CATEGORY consistently wins
5. Update prompt templates with learnings

### Decision Rules

| Views | Action |
|-------|--------|
| 50K+ | DOUBLE DOWN — make 3 variations immediately |
| 10K-50K | Good — keep in rotation, test tweaks |
| 1K-10K | Okay — try 1 more variation before dropping |
| <1K (twice) | DROP — radically different approach needed |

### What to Vary When Iterating
- **Same hook, different person:** "landlord" → "mum" → "boyfriend"
- **Same structure, different room/feature:** bedroom → kitchen → bathroom
- **Same images, different text:** proven images can be reused with new hooks
- **Same hook, different time:** morning vs evening posting

## Conversion Tracking

### Funnel
```
Views → Profile Visits → Link Clicks → App Store → Download → Trial → Paid
```

### Benchmarks
- 1% conversion (views → download) = average
- 1.5-3% = good
- 3%+ = great

### Attribution Tips
- Track download spikes within 24h of viral post
- Use unique UTM links per campaign if possible
- RevenueCat `$attribution` for source tracking
- Compare weekly MRR growth with weekly view totals
