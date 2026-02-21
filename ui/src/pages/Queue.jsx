import { useEffect, useState } from 'react'
import { Calendar, Clock, Plus, Pencil, Trash2, X, Check } from 'lucide-react'

const DAYS = ['mon','tue','wed','thu','fri','sat','sun']
const DAY_LABELS = { mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday', sun:'Sunday' }

const TABS = ['Scheduled', 'Drafts', 'Posted', 'Failed']

function getUpcomingDays(n = 7) {
  const days = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const dow = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase() // mon, tue …
    const label = i === 0 ? 'Today'
      : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-US', { weekday: 'long' })
    days.push({ date: d, dow, label })
  }
  return days
}

function fmt12(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}

// Modal to edit default queue times per day
function EditQueueModal({ times, onSave, onClose }) {
  const [local, setLocal] = useState(() => {
    const copy = {}
    DAYS.forEach(d => { copy[d] = [...(times[d] || [])] })
    return copy
  })
  const [newTime, setNewTime] = useState({})
  const [saving, setSaving] = useState(false)

  const addTime = (day) => {
    const t = newTime[day]
    if (!t) return
    setLocal(prev => ({ ...prev, [day]: [...(prev[day] || []), t].sort() }))
    setNewTime(prev => ({ ...prev, [day]: '' }))
  }

  const removeTime = (day, idx) => {
    setLocal(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== idx) }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueTimes: local })
      })
      onSave(local)
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto" style={{ background: 'var(--color-surface)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <h2 className="font-semibold text-[15px]">Edit Queue Times</h2>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {DAYS.map(day => (
            <div key={day}>
              <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{DAY_LABELS[day]}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(local[day] || []).map((t, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: 'oklch(0.65 0.19 250 / 0.1)', color: 'var(--color-primary)' }}>
                    {fmt12(t)}
                    <button onClick={() => removeTime(day, i)} className="hover:opacity-70">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={newTime[day] || ''}
                  onChange={e => setNewTime(prev => ({ ...prev, [day]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addTime(day)}
                  className="px-2.5 py-1.5 rounded-lg text-[12px] border"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
                />
                <button onClick={() => addTime(day)} disabled={!newTime[day]}
                  className="px-3 py-1.5 text-[11px] rounded-lg disabled:opacity-40 font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
                  style={{ background: 'oklch(0.65 0.19 250 / 0.1)', color: 'var(--color-primary)' }}>
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <button onClick={onClose} className="px-4 py-2 text-[13px] rounded-lg font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 text-[13px] rounded-lg font-medium bg-gradient-to-r from-primary to-accent text-white disabled:opacity-50 flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            {saving ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" /> : <Check className="w-3.5 h-3.5" />}
            Save Times
          </button>
        </div>
      </div>
    </div>
  )
}

const POSTIZ_SIGNUP_URL = 'https://postiz.pro/oliverhenry'

export default function Queue() {
  const [tab, setTab] = useState('Scheduled')
  const [showEdit, setShowEdit] = useState(false)
  const [queueTimes, setQueueTimes] = useState({})
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [postizConfigured, setPostizConfigured] = useState(null) // null = unknown

  const upcomingDays = getUpcomingDays(7)

  const handleScheduleClick = () => {
    if (postizConfigured === false) {
      window.open(POSTIZ_SIGNUP_URL, '_blank')
    }
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/config').then(r => r.json()).catch(() => ({})),
      fetch('/api/queue').then(r => r.json()).catch(() => ({ posts: [] })),
    ]).then(([cfg, q]) => {
      setQueueTimes(cfg.queueTimes || {})
      setUser(cfg.user || null)
      setScheduledPosts(q.posts || [])
      // postizKey is masked if set — check if it exists
      setPostizConfigured(!!cfg.postizKey)
      setLoading(false)
    })
  }, [])

  const slotsForDay = (dow) => queueTimes[dow] || []

  const postAtSlot = (date, time) => {
    return scheduledPosts.find(p => {
      const pd = new Date(p.scheduledAt)
      return pd.toDateString() === date.toDateString() &&
        `${String(pd.getHours()).padStart(2,'0')}:${String(pd.getMinutes()).padStart(2,'0')}` === time
    })
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Queue</h1>
          {user && (
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>@{user.username}</p>
          )}
        </div>
        <button onClick={() => setShowEdit(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border hover:opacity-80 transition-opacity"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <Clock className="w-3.5 h-3.5" />
          Edit Queue
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-full w-fit" style={{ background: 'var(--color-bg-secondary)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 ${
              tab === t ? 'text-white bg-gradient-to-r from-primary to-accent shadow-sm' : 'hover:opacity-80'
            }`}
            style={{ color: tab === t ? undefined : 'var(--color-text-secondary)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Postiz banner if not configured */}
      {postizConfigured === false && (
        <div className="card p-4 flex items-center justify-between gap-4"
          style={{ background: 'oklch(0.65 0.19 250 / 0.08)', border: '1px solid oklch(0.65 0.19 250 / 0.3)' }}>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-primary)' }}>Connect Postiz to schedule tweets</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Postiz lets you schedule, queue and auto-post to X and other platforms.
            </p>
          </div>
          <a href={POSTIZ_SIGNUP_URL} target="_blank" rel="noopener"
            className="shrink-0 px-4 py-2 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'var(--color-primary)' }}>
            Set up Postiz →
          </a>
        </div>
      )}

      {/* Content */}
      {tab === 'Scheduled' ? (
        <div className="space-y-5">
          {upcomingDays.map(({ date, dow, label }) => {
            const slots = slotsForDay(dow)
            if (slots.length === 0) return null
            return (
              <div key={dow}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <h2 className="text-[13px] font-semibold">{label}</h2>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="space-y-2 pl-5">
                  {slots.map((time) => {
                    const post = postAtSlot(date, time)
                    return (
                      <div key={time} className="card p-4 flex items-start gap-4">
                        <div className="shrink-0 mt-0.5">
                          <span className="text-[12px] font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>
                            {fmt12(time)}
                          </span>
                        </div>
                        {post ? (
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] line-clamp-3">{post.text}</p>
                            <div className="flex gap-2 mt-2">
                              <button className="text-[11px] hover:opacity-80 transition-opacity flex items-center gap-1"
                                style={{ color: 'var(--color-text-muted)' }}>
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                              <button className="text-[11px] hover:opacity-80 transition-opacity flex items-center gap-1 text-danger">
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[12px] italic flex-1" style={{ color: 'var(--color-text-muted)' }}>
                            Press 'Add to Queue' to schedule your post
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {upcomingDays.every(({ dow }) => slotsForDay(dow).length === 0) && (
            <div className="card p-8 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-[14px] font-medium">No queue times set</p>
              <p className="text-[12px] mt-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Click "Edit Queue" to set your default posting schedule
              </p>
              <button onClick={() => setShowEdit(true)}
                className="px-4 py-2 text-[13px] font-medium rounded-lg bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity">
                Set Up Schedule
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-[14px] font-medium">{tab}</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            No {tab.toLowerCase()} posts yet
          </p>
        </div>
      )}

      {showEdit && (
        <EditQueueModal
          times={queueTimes}
          onSave={(t) => { setQueueTimes(t); setShowEdit(false) }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
