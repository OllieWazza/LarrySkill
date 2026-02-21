import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, Heart, Eye, MessageCircle, Sparkles, Plus, X, RefreshCw, Hash, Repeat2, MessageSquare, Bookmark, Info } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const formatDateAxis = (dateStr) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const parts = dateStr.split('-')
  const month = parseInt(parts.length === 3 ? parts[1] : parts[0], 10)
  const day = parseInt(parts.length === 3 ? parts[2] : parts[1], 10)
  return `${months[month - 1]} ${day}`
}

function StatCard({ icon: Icon, label, value, change, large, subValue, tooltip }) {
  const positive = change == null || change >= 0
  return (
    <div className={`card p-4 ${large ? 'ring-1 ring-primary/30' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4" style={{ color: large ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
          {tooltip && (
            <span title={tooltip} style={{ cursor: 'help', color: 'var(--color-text-muted)' }}>
              <Info className="w-3 h-3" />
            </span>
          )}
        </div>
        {change !== undefined && change !== null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${positive ? 'text-success' : 'text-danger'}`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {positive ? '+' : ''}{change.toLocaleString()}
          </span>
        )}
      </div>
      <p className={`font-bold ${large ? 'text-3xl' : 'text-xl'}`} style={large ? { color: 'var(--color-primary)' } : {}}>{value}</p>
      {subValue && <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>{subValue}</p>}
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  )
}

function fmtNum(v) {
  if (v == null) return '—'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(v >= 10_000 ? 0 : 1) + 'K'
  return v.toLocaleString()
}

function pctChange(cur, prev) {
  if (!prev || !cur) return null
  return Math.round(((cur - prev) / Math.abs(prev)) * 100)
}

const PERIODS = ['7d', '30d', '90d']

// Mini stat pill for quick metrics row
function MetricPill({ icon: Icon, label, value, change, iconColor }) {
  const pos = change == null || change >= 0
  return (
    <div className="flex-1 rounded-xl p-3 flex flex-col gap-1"
      style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)', minWidth: 0 }}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: iconColor || 'var(--color-text-muted)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      </div>
      <p className="text-[16px] font-bold">{fmtNum(value)}</p>
      {change != null && (
        <span className={`text-[10px] font-medium ${pos ? 'text-success' : 'text-danger'}`}>
          {pos ? '▲' : '▼'} {Math.abs(change)}%
        </span>
      )}
    </div>
  )
}

// Full year heatmap (matches analytics page)
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const CELL = 16

function buildWeeks(calendar, weekCount = 52) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() - (weekCount - 1) * 7)
  const weeks = []
  for (let w = 0; w < weekCount; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const ds = date.toISOString().slice(0, 10)
      week.push({ date: ds, count: calendar[ds] || 0, future: date > today })
    }
    weeks.push(week)
  }
  return weeks
}

function heatColor(c) {
  if (!c) return 'var(--color-bg-secondary, #1e2130)'
  if (c === 1) return '#7b3617'
  if (c === 2) return '#c24e0e'
  if (c === 3) return '#e85d04'
  return '#dc2626'
}

function StreakHeatmap({ calendar, streak }) {
  const weeks = buildWeeks(calendar || {}, 52)
  const months = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const d = new Date(week[0].date)
    if (d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth()
      months.push({ label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][lastMonth], col: wi + 2 })
    }
  })

  return (
    <div className="card" style={{ padding: 20, width: '100%' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>
        <span style={{ color: 'var(--color-primary)' }}>{streak ?? 0}-day</span> posting streak 🔥
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '20px ' + 'repeat(52, 1fr)',
        gridTemplateRows: 'auto repeat(7, 1fr)',
        gap: 2,
        width: '100%'
      }}>
        {/* Month labels row */}
        <div />
        {weeks.map((week, wi) => {
          const m = months.find(m => m.col === wi + 2)
          return <div key={wi} style={{ fontSize: 9, color: 'var(--color-text-muted)', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'visible' }}>
            {m ? m.label : ''}
          </div>
        })}
        {/* Day rows */}
        {[0,1,2,3,4,5,6].map(di => (<>
          <div key={'label-'+di} style={{ fontSize: 9, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {di % 2 === 1 ? DAY_LETTERS[di] : ''}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi+'-'+di}
              title={`${week[di].date}: ${week[di].count} post${week[di].count !== 1 ? 's' : ''}`}
              style={{
                aspectRatio: '1',
                borderRadius: 3,
                background: heatColor(week[di].count),
                opacity: week[di].future ? 0 : 1,
                cursor: week[di].count ? 'pointer' : 'default',
                width: '100%',
                maxHeight: 20,
              }}
            />
          ))}
        </>))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }}>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Less</span>
        {[0, 1, 2, 3, 4].map(c => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 3, background: heatColor(c) }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>More</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [trends, setTrends] = useState([])
  const [nicheTrends, setNicheTrends] = useState([])
  const [monitored, setMonitored] = useState([])
  const [newHandle, setNewHandle] = useState('')
  const [addingHandle, setAddingHandle] = useState(false)
  const [refreshingMonitored, setRefreshingMonitored] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [regenIdx, setRegenIdx] = useState(null)
  const [snapshotData, setSnapshotData] = useState(null)
  const [streakData, setStreakData] = useState(null)
  const [prevSnapshotData, setPrevSnapshotData] = useState(null)
  const [dailyMix, setDailyMix] = useState([])
  const [generatingMix, setGeneratingMix] = useState(false)
  const [postingIdx, setPostingIdx] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/dashboard?period=${period}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/analytics?period=${period}`).then(r => r.json()).catch(() => ({}))
    ]).then(([d, a]) => {
      setData(d)
      setStreakData(a?.streak || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [period])

  // Fetch snapshot data for current + previous period
  useEffect(() => {
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7
    // Current period
    fetch(`/api/snapshots/daily?period=${period}`)
      .then(r => r.json())
      .then(d => setSnapshotData(d))
      .catch(() => {})

    // Previous period for % change calcs — store all snapshot data
    setPrevSnapshotData(null)
  }, [period])

  // Load daily mix on mount
  useEffect(() => {
    fetch('/api/daily-mix')
      .then(r => r.json())
      .then(d => setDailyMix(d.posts || []))
      .catch(() => {})
  }, [])

  const generateDailyMix = async () => {
    setGeneratingMix(true)
    try {
      const res = await fetch('/api/daily-mix/generate', { method: 'POST' })
      const d = await res.json()
      setDailyMix(d.posts || [])
    } catch {}
    setGeneratingMix(false)
  }

  const postTweet = async (text, idx) => {
    setPostingIdx(idx)
    try {
      await fetch('/api/writer/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
    } catch {}
    setPostingIdx(null)
  }

  useEffect(() => {
    fetch('/api/trends')
      .then(r => r.json())
      .then(d => setTrends(d.trends || []))
      .catch(() => {})
    fetch('/api/trends/niche')
      .then(r => r.json())
      .then(d => setNicheTrends(d.nicheTrends || []))
      .catch(() => {})
    fetch('/api/monitored')
      .then(r => r.json())
      .then(d => setMonitored(d.accounts || []))
      .catch(() => {})
    fetch('/api/recommendations')
      .then(r => r.json())
      .then(d => setRecommendations(d.recommendations || []))
      .catch(() => {})
  }, [])

  const addMonitored = async () => {
    if (!newHandle.trim()) return
    setAddingHandle(true)
    try {
      const res = await fetch('/api/monitored', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: newHandle.replace('@', '').trim(), action: 'add' })
      })
      const d = await res.json()
      setMonitored(d.accounts || [])
      setNewHandle('')
    } catch {}
    setAddingHandle(false)
  }

  const removeMonitored = async (handle) => {
    try {
      const res = await fetch('/api/monitored', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, action: 'remove' })
      })
      const d = await res.json()
      setMonitored(d.accounts || [])
    } catch {}
  }

  const refreshMonitored = async () => {
    setRefreshingMonitored(true)
    try {
      const res = await fetch('/api/monitored/refresh')
      const d = await res.json()
      setMonitored(d.accounts || [])
    } catch {}
    setRefreshingMonitored(false)
  }

  const regenRecommendation = async (idx) => {
    const rec = recommendations[idx]
    if (!rec) return
    setRegenIdx(idx)
    try {
      const res = await fetch('/api/writer/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: rec.trend, style: 'engaging' })
      })
      const d = await res.json()
      const newSuggestion = d.drafts?.[0]?.text
      if (newSuggestion) {
        setRecommendations(prev => prev.map((r, i) => i === idx ? { ...r, suggestion: newSuggestion } : r))
      }
    } catch {}
    setRegenIdx(null)
  }

  const useRecommendation = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )

  // Compute snapshot aggregates
  const snapDays = snapshotData?.days || []
  const hasSnapshotData = snapshotData?.hasData === true
  const daysWithData = snapshotData?.daysWithData || 0
  const cumulativeTotals = snapshotData?.cumulativeTotals || null
  const snapTotalImpressions = snapDays.reduce((s, d) => s + (d.impressions || 0), 0)
  const snapTotalLikes       = snapDays.reduce((s, d) => s + (d.likes || 0), 0)
  const snapTotalRetweets    = snapDays.reduce((s, d) => s + (d.retweets || 0), 0)
  const snapTotalReplies     = snapDays.reduce((s, d) => s + (d.replies || 0), 0)
  const snapTotalBookmarks   = snapDays.reduce((s, d) => s + (d.bookmarks || 0), 0)

  // Use cumulative totals as fallback when snapshot data is incomplete
  const expectedDays = period === '90d' ? 90 : period === '30d' ? 30 : 7
  const hasFullData = daysWithData >= Math.floor(expectedDays * 0.7) // 70% coverage
  const displayImpressions = hasFullData ? snapTotalImpressions
    : (cumulativeTotals?.impressions || data?.stats?.totalViews || snapTotalImpressions)

  // Today's snapshot entry
  const todayStr = new Date().toISOString().slice(0, 10)
  const todaySnap = snapDays.find(d => d.fullDate === todayStr)
  const todayNewFollowers = todaySnap?.newFollowers ?? null

  // Current followers — try dashboard data first, fall back to latest snapshot
  const latestFollowerSnap = [...snapDays].reverse().find(d => d.followers != null && d.followers > 0)
  const currentFollowers = data?.stats?.followers ?? latestFollowerSnap?.followers ?? null
  const dailyFollowerChange = todaySnap?.newFollowers ?? null

  // Half-period comparison for % change (use first half vs second half of snapDays)
  const halfIdx = Math.floor(snapDays.length / 2)
  const firstHalf = snapDays.slice(0, halfIdx)
  const secondHalf = snapDays.slice(halfIdx)
  const prevLikes     = firstHalf.reduce((s, d) => s + (d.likes || 0), 0)
  const prevRetweets  = firstHalf.reduce((s, d) => s + (d.retweets || 0), 0)
  const prevReplies   = firstHalf.reduce((s, d) => s + (d.replies || 0), 0)
  const prevBookmarks = firstHalf.reduce((s, d) => s + (d.bookmarks || 0), 0)
  const curLikes      = secondHalf.reduce((s, d) => s + (d.likes || 0), 0)
  const curRetweets   = secondHalf.reduce((s, d) => s + (d.retweets || 0), 0)
  const curReplies    = secondHalf.reduce((s, d) => s + (d.replies || 0), 0)
  const curBookmarks  = secondHalf.reduce((s, d) => s + (d.bookmarks || 0), 0)

  // Follow chart data — show total follower count over time
  const followChartData = snapDays.filter(d => d.followers != null && d.followers > 0).map(d => ({ date: d.date, followers: d.followers }))

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>Overview of your X account</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'oklch(0.55 0.15 145 / 0.1)', color: 'var(--color-success)' }}>
              🔒 All data stays on your machine
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1 rounded-md text-[12px] font-medium transition-all"
              style={period === p
                ? { background: 'var(--color-primary)', color: '#fff' }
                : { color: 'var(--color-text-muted)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* AI Ready-to-Post Tweets */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-[13px] font-semibold">Ready to Post</span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              AI-generated tweets in your voice — post with one click
            </p>
          </div>
          <button onClick={generateDailyMix} disabled={generatingMix}
            className="px-3 py-1.5 text-[11px] rounded-lg font-medium flex items-center gap-1.5 transition-all hover:opacity-80"
            style={{ background: 'oklch(0.65 0.19 250 / 0.1)', color: 'var(--color-primary)' }}>
            {generatingMix
              ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
              : <RefreshCw className="w-3 h-3" />}
            {generatingMix ? 'Generating…' : 'Refresh'}
          </button>
        </div>
        {dailyMix.length > 0 ? (
          <div className="space-y-2">
            {dailyMix.slice(0, 5).map((post, i) => (
              <div key={i} className="p-3 rounded-lg flex items-start justify-between gap-3"
                style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{post.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {post.category && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ background: 'oklch(0.65 0.19 250 / 0.08)', color: 'var(--color-primary)' }}>
                        {post.category}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{post.text.length}/280</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => postTweet(post.text, i)}
                    disabled={postingIdx === i}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'var(--color-primary)' }}>
                    {postingIdx === i ? '…' : 'Post'}
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(post.text)}
                    className="text-[10px] font-medium hover:opacity-80 text-center"
                    style={{ color: 'var(--color-text-muted)' }}>Copy</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-[12px]">No tweets generated yet</p>
            <button onClick={generateDailyMix}
              className="mt-2 px-4 py-2 rounded-lg text-[12px] font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}>
              Generate Tweets
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Eye}
          label={`Impressions (${period})`}
          value={fmtNum(displayImpressions)}
          tooltip={!hasFullData && cumulativeTotals ? 'Showing cumulative totals — daily tracking still building up' : null}
          large
        />
        <StatCard
          icon={Users}
          label="Followers"
          value={currentFollowers != null ? currentFollowers.toLocaleString() : '—'}
          change={dailyFollowerChange}
          subValue={dailyFollowerChange != null ? `${dailyFollowerChange >= 0 ? '+' : ''}${dailyFollowerChange} today` : null}
        />
        <StatCard
          icon={Heart}
          label="Likes Today"
          value={fmtNum(todaySnap?.likes ?? 0)}
          subValue={todaySnap?.likes != null ? `${todaySnap.likes} received today` : null}
        />
      </div>

      {/* Daily Impressions chart */}
      <div className="card p-4">
        <h3 className="text-[13px] font-semibold mb-3">Daily Impressions</h3>
        <div className="h-52">
          {!hasSnapshotData ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-[13px] font-medium">Metrics are being collected.</p>
              <p className="text-[11px]">Check back in a few hours for accurate daily data.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapDays} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={formatDateAxis} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false} width={44}
                  tickFormatter={fmtNum}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(v) => [fmtNum(v), 'Impressions']}
                />
                <Area type="monotone" dataKey="impressions" stroke="#00e5ff" strokeWidth={2} fill="url(#impressionsGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Follows over time mini chart */}
      <div className="card p-4">
        <h3 className="text-[13px] font-semibold mb-3">Follows Over Time</h3>
        <div className="h-32">
          {followChartData.length === 0 || !hasSnapshotData ? (
            <div className="h-full flex items-center justify-center text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Collecting data…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={followChartData} margin={{ top: 4, right: 16, bottom: 0, left: 16 }}>
                <defs>
                  <linearGradient id="followsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={formatDateAxis} tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={40} tickFormatter={fmtNum} domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(v) => [v.toLocaleString(), 'Followers']}
                />
                <Area type="monotone" dataKey="followers" stroke="#3b82f6" strokeWidth={2} fill="url(#followsGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Want automation? upsell card */}
      <div className="card p-4 flex items-start gap-3" style={{ background: 'oklch(0.65 0.19 250 / 0.04)', border: '1px solid var(--color-border-subtle)' }}>
        <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
        <div className="space-y-1">
          <p className="text-[13px] font-semibold">Want to automate your growth?</p>
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Auto retweet, auto plug, auto delete, auto DM, scheduled posts, and cross-posting to Bluesky.
          </p>
          <a
            href="https://superx.so/?via=oliver"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Unlock automation with SuperX ($39/mo) →
          </a>
        </div>
      </div>

      {/* Posting streak heatmap row */}
      {streakData && (
        <StreakHeatmap calendar={streakData.calendar} streak={streakData.current} />
      )}

      {/* Quick metrics overview pills */}
      <div>
        <h3 className="text-[12px] font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
          {period} engagement overview
        </h3>
        <div className="flex gap-3">
          <MetricPill icon={Heart}      label="Likes"    value={snapTotalLikes}     change={hasSnapshotData ? pctChange(curLikes, prevLikes)         : null} iconColor="#ef4444" />
          <MetricPill icon={Repeat2}    label="Reposts"  value={snapTotalRetweets}  change={hasSnapshotData ? pctChange(curRetweets, prevRetweets)   : null} iconColor="#22c55e" />
          <MetricPill icon={MessageSquare} label="Replies"  value={snapTotalReplies}   change={hasSnapshotData ? pctChange(curReplies, prevReplies)     : null} iconColor="#a855f7" />
          <MetricPill icon={Bookmark}   label="Bookmarks" value={snapTotalBookmarks} change={hasSnapshotData ? pctChange(curBookmarks, prevBookmarks) : null} iconColor="#f59e0b" />
        </div>
      </div>

      {/* Recommended for you */}
      {recommendations.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <h3 className="text-[13px] font-semibold">Recommended for you</h3>
          </div>
          <p className="text-[11px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Tweet ideas based on what's trending in your network
          </p>
          <div className="grid grid-cols-3 gap-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="rounded-xl p-3 flex flex-col gap-2"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-primary)' }}>{rec.trend}</span>
                </div>
                <p className="text-[12px] flex-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {rec.suggestion}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{rec.reason}</p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => useRecommendation(rec.suggestion)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-primary)' }}>
                    Use this
                  </button>
                  <button
                    onClick={() => regenRecommendation(i)}
                    disabled={regenIdx === i}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: 'oklch(0.65 0.19 250 / 0.1)', color: 'var(--color-primary)' }}>
                    {regenIdx === i
                      ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                      : <RefreshCw className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 1: Trending Globally | In Your Niche */}
      <div className="grid grid-cols-2 gap-4">

        {/* Trending Globally */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
              <h3 className="text-[13px] font-semibold">Trending Globally</h3>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>UK · Change WOEID in Settings</span>
          </div>
          {trends.length > 0 ? (
            <div className="space-y-1">
              {trends.slice(0, 12).map((t, i) => (
                <a key={i}
                  href={`https://x.com/search?q=${encodeURIComponent(t.name)}`}
                  target="_blank" rel="noopener"
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono w-4 text-right" style={{ color: 'var(--color-text-muted)' }}>{i + 1}</span>
                    <span className="text-[12px] font-medium truncate">{t.name}</span>
                  </div>
                  {t.tweet_count && (
                    <span className="text-[10px] font-mono shrink-0 ml-2" style={{ color: 'var(--color-text-muted)' }}>
                      {t.tweet_count >= 1000 ? (t.tweet_count / 1000).toFixed(1) + 'K' : t.tweet_count}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-[12px] py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <p>Trends unavailable</p>
              <p className="text-[10px] mt-1 opacity-70">Requires Twitter v1.1 API credentials</p>
            </div>
          )}
        </div>

        {/* In Your Niche */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <h3 className="text-[13px] font-semibold">In Your Niche</h3>
          </div>
          {nicheTrends.length > 0 ? (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {nicheTrends.map((niche, ni) => (
                <div key={ni}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'oklch(0.65 0.18 300 / 0.12)', color: 'var(--color-accent)' }}>
                      {niche.topic}
                    </span>
                    {niche.relatedHashtags.slice(0, 2).map((tag, ti) => (
                      <a key={ti}
                        href={`https://x.com/search?q=${encodeURIComponent(tag)}`}
                        target="_blank" rel="noopener"
                        className="text-[10px] hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--color-primary)' }}>
                        {tag}
                      </a>
                    ))}
                  </div>
                  {niche.tweets.slice(0, 2).map((t, ti) => (
                    <div key={ti} className="p-2 rounded-lg mb-1 text-[11px]"
                      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                      <p className="line-clamp-2">{t.text}</p>
                      <div className="flex gap-3 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        <span>@{t.author.username}</span>
                        <span>❤️ {t.likes?.toLocaleString()}</span>
                        {t.impressions > 0 && <span>👁 {t.impressions?.toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <p>No niche trends yet</p>
              <p className="text-[10px] mt-1 opacity-70">Add interests in Context to see niche trends</p>
            </div>
          )}
        </div>
      </div>

      {/* Monitored Accounts */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold">Monitored Accounts</h3>
          <button onClick={refreshMonitored} disabled={refreshingMonitored}
            className="text-[10px] flex items-center gap-1 hover:opacity-80 disabled:opacity-40"
            style={{ color: 'var(--color-primary)' }}>
            <RefreshCw className={`w-3 h-3 ${refreshingMonitored ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="flex gap-2 mb-3 max-w-sm">
          <input
            value={newHandle}
            onChange={e => setNewHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMonitored()}
            placeholder="@handle to track"
            className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] border"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
          />
          <button onClick={addMonitored} disabled={addingHandle || !newHandle.trim()}
            className="px-3 py-1.5 text-[11px] rounded-lg disabled:opacity-40 font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ background: 'oklch(0.65 0.19 250 / 0.1)', color: 'var(--color-primary)' }}>
            {addingHandle
              ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
              : <Plus className="w-3 h-3" />}
            Add
          </button>
        </div>
        {monitored.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {monitored.map((acc, ai) => (
              <div key={ai} className="rounded-xl p-3" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between mb-2">
                  <a href={`https://x.com/${acc.handle}`} target="_blank" rel="noopener"
                    className="text-[12px] font-semibold hover:opacity-80"
                    style={{ color: 'var(--color-primary)' }}>@{acc.handle}</a>
                  <button onClick={() => removeMonitored(acc.handle)}
                    className="hover:opacity-80 text-danger">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {acc.tweets?.length > 0 ? acc.tweets.slice(0, 2).map((t, ti) => (
                  <div key={ti} className="p-2 rounded-lg mb-1 text-[11px]"
                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
                    <p className="line-clamp-2">{t.text}</p>
                    <div className="flex gap-3 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      <span>❤️ {t.likes?.toLocaleString()}</span>
                      <span>🔁 {t.retweets?.toLocaleString()}</span>
                      <span>👁 {t.impressions?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>No tweets cached — hit Refresh</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            Add @handles to track what's working in your niche
          </p>
        )}
      </div>

      {/* Recent Tweets */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <h3 className="text-[13px] font-semibold">Recent Tweets</h3>
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Sorted by views</span>
        </div>
        <div>
          {data?.recentTweets?.length > 0 ? data.recentTweets.map((t, i) => (
            <div key={i} className="flex gap-4 p-4 border-b transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] line-clamp-2">{t.text}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                    <Eye className="w-3 h-3" /> {t.impressions?.toLocaleString() || 0}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    <Heart className="w-3 h-3" /> {t.likes}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    <MessageCircle className="w-3 h-3" /> {t.replies}
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-muted)' }}>{t.timeAgo}</span>
                </div>
              </div>
            </div>
          )) : (
            <p className="p-4 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>No tweets found</p>
          )}
        </div>
      </div>
    </div>
  )
}
