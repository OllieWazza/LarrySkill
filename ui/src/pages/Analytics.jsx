import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

const formatDateAxis = (dateStr) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const parts = dateStr.split('-')
  const month = parseInt(parts.length === 3 ? parts[1] : parts[0], 10)
  const day = parseInt(parts.length === 3 ? parts[2] : parts[1], 10)
  return `${months[month - 1]} ${day}`
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return Number(n).toLocaleString()
}

function Delta({ value }) {
  if (value == null) return null
  const pos = value >= 0
  return (
    <span style={{ color: pos ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
      {pos ? '↑' : '↓'} {fmt(Math.abs(value))}
    </span>
  )
}

function PctDelta({ value }) {
  if (value == null) return null
  const pos = value >= 0
  return (
    <span style={{ color: pos ? '#22c55e' : '#ef4444', fontSize: 11, fontWeight: 600 }}>
      {pos ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  )
}

// ── Sparkline (tiny, no axes) ─────────────────────────────────────────────────
function Sparkline({ data, gradId, color = 'var(--color-primary)' }) {
  if (!data?.length) return <div style={{ height: 40 }} />
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.45} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Area
          type="monotone" dataKey="v"
          stroke={color} strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false} isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Big Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, change, pctChange, sparkData, gradId, loading, na }) {
  return (
    <div className="card" style={{ padding: '20px 20px 14px' }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10
      }}>
        {label}
      </p>
      {loading ? (
        <>
          <div className="animate-pulse" style={{ height: 34, width: 110, borderRadius: 4, background: 'var(--color-border)', marginBottom: 8 }} />
          <div className="animate-pulse" style={{ height: 14, width: 70, borderRadius: 4, background: 'var(--color-border)', marginBottom: 12 }} />
          <div className="animate-pulse" style={{ height: 40, borderRadius: 4, background: 'var(--color-border)' }} />
        </>
      ) : na ? (
        <>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: 5 }}>N/A</p>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 12 }}>Not available via X API</p>
          <div style={{ height: 40 }} />
        </>
      ) : (
        <>
          <p style={{
            fontSize: 30, fontWeight: 800, lineHeight: 1,
            letterSpacing: '-0.025em', color: 'var(--color-text)', marginBottom: 5
          }}>
            {fmt(value)}
          </p>
          <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Delta value={change} />
            {pctChange != null && <PctDelta value={pctChange} />}
          </div>
          <Sparkline data={sparkData} gradId={gradId} />
        </>
      )}
    </div>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
function heatColor(count) {
  if (!count) return 'var(--color-bg-secondary, #1e2130)'
  if (count === 1) return '#7b3617'
  if (count === 2) return '#c24e0e'
  if (count === 3) return '#e85d04'
  return '#dc2626'
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const CELL = 16 // px

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

function StreakHeatmap({ streak, loading }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="animate-pulse" style={{ height: 160, borderRadius: 8, background: 'var(--color-border)' }} />
      </div>
    )
  }

  const weeks  = buildWeeks(streak?.calendar || {}, 52)
  const current = streak?.current ?? 0

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>
        <span style={{ color: 'var(--color-primary)' }}>{current}-day</span> posting streak 🔥
      </h3>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
          {/* Day labels column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: CELL + 4, marginRight: 2, flexShrink: 0 }}>
            {DAY_LETTERS.map((d, i) => (
              <div key={i} style={{
                height: CELL, width: CELL, fontSize: 10,
                color: 'var(--color-text-muted)', lineHeight: `${CELL}px`, textAlign: 'center'
              }}>
                {i % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => {
              const showMonth = wi === 0
                || week[0].date.slice(5, 7) !== weeks[wi - 1][0].date.slice(5, 7)
              return (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Month label */}
                  <div style={{
                    height: CELL, fontSize: 10, color: 'var(--color-text-muted)',
                    lineHeight: `${CELL}px`, whiteSpace: 'nowrap', textAlign: 'center'
                  }}>
                    {showMonth
                      ? new Date(week[0].date + 'T12:00:00').toLocaleDateString('en', { month: 'short' })
                      : ''}
                  </div>
                  {/* Day cells */}
                  {week.map((cell, di) => (
                    <div
                      key={di}
                      title={`${cell.date}: ${cell.count} post${cell.count !== 1 ? 's' : ''}`}
                      style={{
                        width: CELL, height: CELL, borderRadius: 3,
                        background: cell.future ? 'transparent' : heatColor(cell.count),
                        opacity: cell.future ? 0 : 1,
                        cursor: cell.count ? 'pointer' : 'default',
                      }}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginRight: 2 }}>Less</span>
        {[0, 1, 2, 3, 4].map(c => (
          <div key={c} style={{ width: CELL, height: CELL, borderRadius: 3, background: heatColor(c) }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 2 }}>More</span>
      </div>
    </div>
  )
}

// ── Engagement Card (inside breakdown) ───────────────────────────────────────
function EngCard({ label, data, sparkData, gradId, loading }) {
  return (
    <div className="card" style={{ flex: 1, padding: '16px 16px 12px' }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8
      }}>
        {label}
      </p>
      {loading ? (
        <div className="animate-pulse" style={{ height: 72, borderRadius: 4, background: 'var(--color-border)' }} />
      ) : (
        <>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3 }}>
            {fmt(data?.total)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <Delta value={data?.change} />
            {data?.pct != null && (
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{data.pct}%</span>
            )}
          </div>
          <Sparkline data={sparkData} gradId={gradId} color="#f97316" />
        </>
      )}
    </div>
  )
}

// ── Best Tweets Table ─────────────────────────────────────────────────────────
const SORT_OPTS = [
  { value: 'impressions',   label: 'Views' },
  { value: 'likes',         label: 'Likes' },
  { value: 'retweets',      label: 'RTs'   },
  { value: 'replies',       label: 'Replies'},
  { value: 'engagementRate',label: 'Eng%'  },
]

function sortArr(list, by) {
  return [...list].sort((a, b) => (b[by] || 0) - (a[by] || 0))
}

function BestTweetsTable({ tweets, loading }) {
  const [sortBy, setSortBy] = useState('impressions')
  const sorted = sortArr(tweets, sortBy)

  return (
    <div className="card">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--color-border-subtle)'
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 700 }}>Best Tweets</h3>
        <div style={{ display: 'flex', gap: 2 }}>
          {SORT_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => setSortBy(o.value)}
              style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.1s',
                background: sortBy === o.value ? 'oklch(0.65 0.19 250 / 0.15)' : 'transparent',
                color:      sortBy === o.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 80px 65px 55px 65px 60px',
        padding: '6px 20px',
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--color-text-muted)',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}>
        <div>Tweet</div>
        <div style={{ textAlign: 'right' }}>Views</div>
        <div style={{ textAlign: 'right' }}>Likes</div>
        <div style={{ textAlign: 'right' }}>RTs</div>
        <div style={{ textAlign: 'right' }}>Replies</div>
        <div style={{ textAlign: 'right' }}>Eng%</div>
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div className="animate-spin" style={{
              width: 24, height: 24, border: '2px solid var(--color-primary)',
              borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block'
            }} />
          </div>
        ) : sorted.length > 0 ? sorted.map((t, i) => (
          <div
            key={t.id || i}
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 80px 65px 55px 65px 60px',
              padding: '10px 20px',
              borderBottom: '1px solid var(--color-border-subtle)',
              transition: 'background 0.1s', cursor: 'default'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div>
              <p style={{
                fontSize: 12, color: 'var(--color-text)',
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {t.text}
              </p>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{t.date}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
              {fmt(t.impressions)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
              {fmt(t.likes)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
              {fmt(t.retweets)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
              {fmt(t.replies)}
            </div>
            <div style={{ textAlign: 'right', alignSelf: 'center' }}>
              <span style={{
                fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
                color: t.engagementRate > 3 ? '#22c55e'
                     : t.engagementRate > 1.5 ? 'var(--color-primary)'
                     : 'var(--color-text-muted)'
              }}>
                {t.engagementRate?.toFixed(1)}%
              </span>
            </div>
          </div>
        )) : (
          <p style={{ padding: 32, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
            No tweets found for this period
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('7d')
  const [engTab, setEngTab]   = useState('engagements')
  const [followerView, setFollowerView] = useState('bar')
  const [snapshotData, setSnapshotData] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  useEffect(() => {
    fetch(`/api/snapshots/daily?period=${period}`)
      .then(r => r.json())
      .then(d => setSnapshotData(d))
      .catch(() => {})
  }, [period])

  const stats          = data?.stats              ?? {}
  const streak         = data?.streak             ?? { current: 0, calendar: {} }
  const eng            = data?.engagementBreakdown ?? {}
  const followerHistory = data?.followerHistory    ?? []
  const dailyViews     = data?.dailyViews         ?? []
  const tweets         = data?.tweets             ?? []

  // Sparkline data slices
  const sparkFollowers  = followerHistory.map(d => ({ v: d.followers }))
  const sparkPosts      = dailyViews.map(d => ({ v: d.posts       || 0 }))
  const sparkViews      = dailyViews.map(d => ({ v: d.views       || 0 }))
  const sparkEngTotal   = dailyViews.map(d => ({ v: d.engagements || 0 }))
  const sparkLikes      = dailyViews.map(d => ({ v: d.likes       || 0 }))
  const sparkRetweets   = dailyViews.map(d => ({ v: d.retweets    || 0 }))
  const sparkReplies    = dailyViews.map(d => ({ v: d.replies     || 0 }))
  const sparkBookmarks  = dailyViews.map(d => ({ v: d.bookmarks   || 0 }))

  // Snapshot-based data for Follows over time
  const snapDays      = snapshotData?.days || []
  const hasSnapData   = snapshotData?.hasData === true
  const followDeltas  = snapDays.map(d => ({ date: d.date, delta: d.newFollowers || 0 }))

  // Snapshot aggregate totals for quick stat comparison
  const snapImpressions = snapDays.reduce((s, d) => s + (d.impressions || 0), 0)
  const snapLikes       = snapDays.reduce((s, d) => s + (d.likes || 0), 0)
  const snapRetweets    = snapDays.reduce((s, d) => s + (d.retweets || 0), 0)
  const snapReplies     = snapDays.reduce((s, d) => s + (d.replies || 0), 0)
  const snapBookmarks   = snapDays.reduce((s, d) => s + (d.bookmarks || 0), 0)

  // Half-period % change for snapshot metrics
  const halfIdx = Math.floor(snapDays.length / 2)
  const firstHalf  = snapDays.slice(0, halfIdx)
  const secondHalf = snapDays.slice(halfIdx)
  function halfPct(key) {
    const prev = firstHalf.reduce((s, d) => s + (d[key] || 0), 0)
    const cur  = secondHalf.reduce((s, d) => s + (d[key] || 0), 0)
    if (!prev) return null
    return Math.round(((cur - prev) / Math.abs(prev)) * 100)
  }

  const engRate = stats.impressions > 0
    ? parseFloat(((stats.engagements / stats.impressions) * 100).toFixed(2))
    : null

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Analytics</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            See what's working and what's not
            <span style={{ margin: '0 6px', color: 'var(--color-border)' }}>·</span>
            <a href="https://superx.so/?via=oliver" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 11 }}>
              Want auto retweet, auto plug, and scheduling? Try SuperX →
            </a>
          </p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 8, padding: '7px 12px', fontSize: 13, color: 'var(--color-text)',
            cursor: 'pointer', outline: 'none'
          }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* ── Streak Heatmap (MOVED UP, BIGGER) ──────────────────────── */}
      <StreakHeatmap streak={streak} loading={loading} />

      {/* ── Row 1 of stat cards (4 cards) ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Followers"        value={stats.followers}        change={stats.followersChange}   sparkData={sparkFollowers} gradId="spk-flw"  loading={loading} />
        <StatCard label="Impressions"      value={hasSnapData ? snapImpressions : stats.impressions} change={stats.impressionsChange} pctChange={hasSnapData ? halfPct('impressions') : null} sparkData={sparkViews}     gradId="spk-imp"  loading={loading} />
        <StatCard label="Engagements"      value={stats.engagements}      change={stats.engagementsChange} sparkData={sparkEngTotal}  gradId="spk-engt" loading={loading} />
        <StatCard label="Posts"            value={stats.posts}            change={stats.postsChange}       sparkData={sparkPosts}     gradId="spk-pst"  loading={loading} />
      </div>

      {/* ── Row 2 of stat cards (4 cards) ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Likes"     value={hasSnapData ? snapLikes     : eng.likes?.total}     change={eng.likes?.change}     pctChange={hasSnapData ? halfPct('likes')     : null} sparkData={sparkLikes}     gradId="spk-lk2"  loading={loading} />
        <StatCard label="Reposts"   value={hasSnapData ? snapRetweets  : eng.retweets?.total}  change={eng.retweets?.change}  pctChange={hasSnapData ? halfPct('retweets')  : null} sparkData={sparkRetweets}  gradId="spk-rt2"  loading={loading} />
        <StatCard label="Replies"   value={hasSnapData ? snapReplies   : eng.replies?.total}   change={eng.replies?.change}   pctChange={hasSnapData ? halfPct('replies')   : null} sparkData={sparkReplies}   gradId="spk-rp2"  loading={loading} />
        <StatCard label="Bookmarks" value={hasSnapData ? snapBookmarks : eng.bookmarks?.total} change={eng.bookmarks?.change} pctChange={hasSnapData ? halfPct('bookmarks') : null} sparkData={sparkBookmarks} gradId="spk-bk2"  loading={loading} />
      </div>

      {/* ── Follows Over Time ───────────────────────────────────────── */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Follows Over Time</h3>
        <div style={{ height: 180 }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="animate-spin" style={{
                width: 24, height: 24, border: '2px solid var(--color-primary)',
                borderTopColor: 'transparent', borderRadius: '50%'
              }} />
            </div>
          ) : !hasSnapData ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              <div>
                <p>Snapshot data is being collected.</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Daily follower deltas will appear here after the first poll.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={followDeltas} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="followDeltaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={formatDateAxis} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                  formatter={v => [v >= 0 ? `+${v}` : v, 'New Followers']}
                />
                <Area type="monotone" dataKey="delta" stroke="#3b82f6" strokeWidth={2} fill="url(#followDeltaGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Follower Gain Chart (cumulative) ───────────────────────── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>Follower Gain (cumulative)</h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { v: 'line', icon: '〜' },
              { v: 'bar',  icon: '▊' },
            ].map(btn => (
              <button
                key={btn.v}
                onClick={() => setFollowerView(btn.v)}
                title={btn.v === 'line' ? 'Line chart' : 'Bar chart'}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 13, transition: 'all 0.1s',
                  background: followerView === btn.v ? 'oklch(0.65 0.19 250 / 0.15)' : 'transparent',
                  color:      followerView === btn.v ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 200 }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="animate-spin" style={{
                width: 24, height: 24, border: '2px solid var(--color-primary)',
                borderTopColor: 'transparent', borderRadius: '50%'
              }} />
            </div>
          ) : followerHistory.length > 1 ? (
            <>
              <div style={{ height: '100%', display: followerView === 'line' ? 'block' : 'none' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={followerHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={formatDateAxis} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={48} tickFormatter={fmt} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                      formatter={v => [fmt(v), 'Followers']}
                    />
                    <Area type="monotone" dataKey="followers" stroke="var(--color-primary)" strokeWidth={2} fill="url(#followerGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: '100%', display: followerView === 'bar' ? 'block' : 'none' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={followerHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <XAxis dataKey="date" tickFormatter={formatDateAxis} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={48} tickFormatter={fmt} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                      formatter={v => [fmt(v), 'Followers']}
                    />
                    <Bar dataKey="followers" fill="var(--color-primary)" radius={[3, 3, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
              No follower history yet — data builds up over time
            </div>
          )}
        </div>
      </div>

      {/* ── Engagement Breakdown ────────────────────────────────────── */}
      <div className="card" style={{ padding: '0 0 20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', padding: '0 20px' }}>
          {[
            { key: 'engagements', label: 'Engagements' },
            { key: 'activity',    label: 'Activity time / impression' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setEngTab(tab.key)}
              style={{
                padding: '12px 16px', fontSize: 13, fontWeight: 600,
                border: 'none', background: 'transparent', cursor: 'pointer',
                borderBottom: engTab === tab.key
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
                color: engTab === tab.key ? 'var(--color-text)' : 'var(--color-text-muted)',
                marginBottom: -1, transition: 'color 0.1s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {engTab === 'engagements' ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <EngCard label="Likes"     data={eng.likes}     sparkData={sparkLikes}     gradId="spk-lk"  loading={loading} />
              <EngCard label="Retweets"  data={eng.retweets}  sparkData={sparkRetweets}  gradId="spk-rt"  loading={loading} />
              <EngCard label="Replies"   data={eng.replies}   sparkData={sparkReplies}   gradId="spk-rp"  loading={loading} />
              <EngCard label="Bookmarks" data={eng.bookmarks} sparkData={sparkBookmarks} gradId="spk-bk"  loading={loading} />
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: 48 }}>
              Activity time breakdown — coming soon
            </p>
          )}
        </div>
      </div>

      {/* ── Best Tweets ─────────────────────────────────────────────── */}
      <BestTweetsTable tweets={tweets} loading={loading} />

    </div>
  )
}
