import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCog, X, Plus, ChevronRight, Dna, ExternalLink, Save, Sparkles, RefreshCw, Bot } from 'lucide-react'

const INTEREST_CATEGORIES = [
  {
    label: 'Business',
    tags: ['Startups','Investing','Marketing','Sales','Leadership','Entrepreneurship'],
  },
  {
    label: 'Technology',
    tags: ['AI/ML','Web3','SaaS','Cybersecurity','DevOps','Mobile'],
  },
  {
    label: 'Creativity',
    tags: ['Design','Writing','Photography','Music','Film','Art'],
  },
  {
    label: 'Lifestyle',
    tags: ['Fitness','Travel','Food','Fashion','Wellness','Mindfulness'],
  },
  {
    label: 'Science',
    tags: ['Physics','Biology','Space','Climate','Medicine','Psychology'],
  },
  {
    label: 'Finance',
    tags: ['Crypto','Stocks','Real Estate','Personal Finance','Economics','Trading'],
  },
]

function SectionCard({ title, children }) {
  return (
    <div className="card p-5">
      <h2 className="text-[14px] font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}

function SaveIndicator({ status }) {
  if (!status) return null
  return (
    <span className="text-[11px] flex items-center gap-1 transition-opacity"
      style={{ color: status === 'saved' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
      {status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Saved' : null}
    </span>
  )
}

export default function Context() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [aboutYou, setAboutYou] = useState('')
  const [interests, setInterests] = useState([])
  const [creators, setCreators] = useState([])
  const [products, setProducts] = useState([])
  const [dna, setDna] = useState([])
  const [saving, setSaving] = useState({})
  const [newCreator, setNewCreator] = useState('')
  const [newProduct, setNewProduct] = useState({ name: '', url: '', description: '' })
  const [showAddProduct, setShowAddProduct] = useState(false)
  const saveTimers = useRef({})

  // Auto-detect state
  const [autoDetect, setAutoDetect] = useState(null)
  const [autoDetecting, setAutoDetecting] = useState(false)
  const [autoDetectError, setAutoDetectError] = useState(null)

  useEffect(() => {
    // Load context from /api/context (not /api/config which only has auth status)
    fetch('/api/context')
      .then(r => r.json())
      .then(d => {
        setConfig(d)
        setAboutYou(d.aboutYou || '')
        setInterests(d.interests || [])
        setCreators(d.favouriteCreators || [])
        setProducts(d.products || [])
        setDna(d.writingDNA?.liked?.map(i => ({ liked: true, text: i.text || i })) || [])
      })
      .catch(() => {})

    // Try to load cached auto-detect (silent, no loading spinner)
    fetch('/api/context/auto-detect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then(r => r.json())
      .then(d => { if (!d.error) setAutoDetect(d) })
      .catch(() => {})
  }, [])

  const runAutoDetect = async (force = false) => {
    setAutoDetecting(true)
    setAutoDetectError(null)
    try {
      const res = await fetch('/api/context/auto-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      })
      const d = await res.json()
      if (d.error) {
        setAutoDetectError(d.error)
      } else {
        setAutoDetect(d)
        // Pre-fill if empty
        if (!aboutYou && d.bio) {
          setAboutYou(d.bio)
          patchConfig('aboutYou', d.bio)
        }
      }
    } catch (e) {
      setAutoDetectError('Failed to connect')
    }
    setAutoDetecting(false)
  }

  const applyDetectedInterest = (tag) => {
    if (interests.includes(tag)) return
    const next = [...interests, tag]
    setInterests(next)
    patchConfig('interests', next)
  }

  const patchConfig = (key, value) => {
    clearTimeout(saveTimers.current[key])
    setSaving(prev => ({ ...prev, [key]: 'saving' }))
    saveTimers.current[key] = setTimeout(async () => {
      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value })
        })
        setSaving(prev => ({ ...prev, [key]: 'saved' }))
        setTimeout(() => setSaving(prev => ({ ...prev, [key]: null })), 2000)
      } catch {
        setSaving(prev => ({ ...prev, [key]: null }))
      }
    }, 800)
  }

  const toggleInterest = (tag) => {
    const next = interests.includes(tag)
      ? interests.filter(i => i !== tag)
      : [...interests, tag]
    setInterests(next)
    patchConfig('interests', next)
  }

  const addCreator = () => {
    const h = newCreator.replace('@', '').trim()
    if (!h || creators.length >= 3 || creators.includes(h)) return
    const next = [...creators, h]
    setCreators(next)
    setNewCreator('')
    patchConfig('favouriteCreators', next)
  }

  const removeCreator = (h) => {
    const next = creators.filter(c => c !== h)
    setCreators(next)
    patchConfig('favouriteCreators', next)
  }

  const addProduct = () => {
    if (!newProduct.name.trim()) return
    const next = [...products, { ...newProduct, id: Date.now() }]
    setProducts(next)
    setNewProduct({ name: '', url: '', description: '' })
    setShowAddProduct(false)
    patchConfig('products', next)
  }

  const removeProduct = (id) => {
    const next = products.filter(p => p.id !== id)
    setProducts(next)
    patchConfig('products', next)
  }

  if (!config) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  )

  // Which interest tags were detected but not yet selected
  const suggestedInterests = (autoDetect?.detectedInterests || [])
    .filter(tag => !interests.includes(tag))
    .slice(0, 8)

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UserCog className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            Context
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Personalize the AI to write in your voice and about your interests
          </p>
        </div>
      </div>

      {/* Auto-detect banner */}
      <div className="rounded-xl p-4 flex items-start justify-between gap-4"
        style={{ background: 'oklch(0.65 0.19 250 / 0.06)', border: '1px solid oklch(0.65 0.19 250 / 0.2)' }}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
              Auto-detected from your X account ✨
            </p>
            {autoDetect ? (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Analysed {autoDetect.tweetsAnalyzed} tweets · {autoDetect.detectedInterests?.length || 0} interests detected · Tap tags below to apply suggestions
              </p>
            ) : autoDetectError ? (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-danger)' }}>{autoDetectError}</p>
            ) : (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Click Refresh to scan your X account and auto-populate this page
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => runAutoDetect(true)}
          disabled={autoDetecting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
          style={{ background: 'oklch(0.65 0.19 250 / 0.12)', color: 'var(--color-primary)' }}>
          <RefreshCw className={`w-3.5 h-3.5 ${autoDetecting ? 'animate-spin' : ''}`} />
          {autoDetecting ? 'Scanning…' : 'Refresh'}
        </button>
      </div>

      {/* Suggested interests (auto-detected, not yet selected) */}
      {suggestedInterests.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
            Suggested from your tweets — tap to add
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedInterests.map(tag => (
              <button key={tag} onClick={() => applyDetectedInterest(tag)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all hover:scale-105"
                style={{ background: 'oklch(0.65 0.19 250 / 0.08)', borderColor: 'oklch(0.65 0.19 250 / 0.3)', color: 'var(--color-primary)' }}>
                ✨ {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* OpenClaw Agent section */}
      {autoDetect?.agentContext && autoDetect.agentContext.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            <p className="text-[13px] font-semibold">From your OpenClaw agent</p>
          </div>
          {autoDetect.agentContext.map((part, i) => (
            <div key={i} className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>
                {part.source}
              </p>
              <p className="text-[11px] leading-relaxed whitespace-pre-wrap line-clamp-4"
                style={{ color: 'var(--color-text-secondary)' }}>
                {part.content}
              </p>
            </div>
          ))}
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Context from agent workspace files — read-only, for reference
          </p>
        </div>
      )}

      {/* 1. About You */}
      <SectionCard title="About You">
        <div className="relative">
          {autoDetect?.bio && !aboutYou && (
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Detected from your X bio — click to apply
              </p>
              <button
                onClick={() => { setAboutYou(autoDetect.bio); patchConfig('aboutYou', autoDetect.bio) }}
                className="text-[11px] font-medium px-2 py-0.5 rounded"
                style={{ color: 'var(--color-primary)', background: 'oklch(0.65 0.19 250 / 0.08)' }}>
                Use bio ✨
              </button>
            </div>
          )}
          <textarea
            value={aboutYou}
            onChange={e => {
              const v = e.target.value.slice(0, 500)
              setAboutYou(v)
              patchConfig('aboutYou', v)
            }}
            rows={4}
            placeholder={autoDetect?.bio ? autoDetect.bio : "Describe yourself — who you are, what you do, your goals, your audience. The AI uses this to write in your voice."}
            className="w-full px-3 py-2.5 rounded-lg text-[13px] border resize-none"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
          />
          <div className="flex items-center justify-between mt-1.5">
            <SaveIndicator status={saving.aboutYou} />
            <span className="text-[11px] ml-auto" style={{ color: 'var(--color-text-muted)' }}>
              {aboutYou.length}/500
            </span>
          </div>
        </div>
      </SectionCard>

      {/* 2. Your Interests */}
      <SectionCard title="Your Interests">
        <p className="text-[12px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Toggle topics to get relevant content suggestions and viral tweet recommendations
        </p>
        <div className="space-y-4">
          {INTEREST_CATEGORIES.map(({ label, tags }) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--color-text-muted)' }}>{label}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const on = interests.includes(tag)
                  const detected = autoDetect?.detectedInterests?.includes(tag)
                  return (
                    <button key={tag} onClick={() => toggleInterest(tag)}
                      className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 border"
                      style={{
                        background: on ? 'oklch(0.65 0.19 250 / 0.12)' : 'transparent',
                        borderColor: on ? 'var(--color-primary)' : 'var(--color-border-subtle)',
                        color: on ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      }}>
                      {detected && !on ? '✨ ' : ''}{tag}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {interests.length} selected
          </span>
          <SaveIndicator status={saving.interests} />
        </div>
      </SectionCard>

      {/* 3. Favourite Creators */}
      <SectionCard title="Favourite Creators">
        <p className="text-[12px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Up to 3 accounts whose writing style you admire — the AI will learn from them
        </p>
        <div className="space-y-2 mb-3">
          {creators.map(h => (
            <div key={h} className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: 'var(--color-bg-secondary)' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-[10px] font-semibold text-primary">
                  {h[0].toUpperCase()}
                </div>
                <span className="text-[13px] font-medium">@{h}</span>
              </div>
              <button onClick={() => removeCreator(h)} className="hover:opacity-70 transition-opacity">
                <X className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>
          ))}
        </div>
        {creators.length < 3 && (
          <div className="flex gap-2">
            <input
              value={newCreator}
              onChange={e => setNewCreator(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCreator()}
              placeholder="@handle"
              className="flex-1 px-2.5 py-2 rounded-lg text-[12px] border"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
            />
            <button onClick={addCreator} disabled={!newCreator.trim()}
              className="px-3 py-2 text-[12px] rounded-lg disabled:opacity-40 font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ background: 'oklch(0.65 0.19 250 / 0.1)', color: 'var(--color-primary)' }}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        )}
        {creators.length >= 3 && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--color-text-muted)' }}>Maximum 3 creators reached</p>
        )}
        <div className="mt-2"><SaveIndicator status={saving.favouriteCreators} /></div>
      </SectionCard>

      {/* 4. Your Products */}
      <SectionCard title="Your Products">
        <p className="text-[12px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Add your apps, services, or projects so the AI can naturally weave them into posts
        </p>
        <div className="space-y-2 mb-3">
          {products.map(p => (
            <div key={p.id} className="flex items-start justify-between p-3 rounded-lg"
              style={{ background: 'var(--color-bg-secondary)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold">{p.name}</p>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener" className="hover:opacity-70 transition-opacity">
                      <ExternalLink className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                    </a>
                  )}
                </div>
                {p.description && (
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{p.description}</p>
                )}
              </div>
              <button onClick={() => removeProduct(p.id)} className="ml-3 hover:opacity-70 transition-opacity shrink-0">
                <X className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>
          ))}
        </div>

        {showAddProduct ? (
          <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg)' }}>
            <input
              value={newProduct.name}
              onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
              placeholder="Product / App name *"
              className="w-full px-2.5 py-2 rounded-lg text-[12px] border"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
            />
            <input
              value={newProduct.url}
              onChange={e => setNewProduct(p => ({ ...p, url: e.target.value }))}
              placeholder="URL (optional)"
              className="w-full px-2.5 py-2 rounded-lg text-[12px] border"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
            />
            <textarea
              value={newProduct.description}
              onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
              placeholder="Short description (optional)"
              rows={2}
              className="w-full px-2.5 py-2 rounded-lg text-[12px] border resize-none"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddProduct(false)} className="px-3 py-1.5 text-[12px] hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
              <button onClick={addProduct} disabled={!newProduct.name.trim()}
                className="px-3 py-1.5 text-[12px] rounded-lg font-medium bg-gradient-to-r from-primary to-accent text-white disabled:opacity-40 hover:opacity-90 transition-opacity">
                Add Product
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg border border-dashed hover:opacity-80 transition-opacity w-full justify-center"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        )}
        <div className="mt-2"><SaveIndicator status={saving.products} /></div>
      </SectionCard>

      {/* 5. Writing DNA */}
      <SectionCard title="Writing DNA">
        <p className="text-[12px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
          The tweets you liked/passed during onboarding teach the AI your writing style
        </p>
        {dna.length > 0 ? (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {dna.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg"
                style={{ background: 'var(--color-bg-secondary)' }}>
                <span className={`text-[11px] font-semibold shrink-0 mt-0.5 ${item.liked ? 'text-success' : 'text-danger'}`}>
                  {item.liked ? '✓ Like' : '✗ Pass'}
                </span>
                <p className="text-[12px] line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{item.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 mb-3">
            <Dna className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>No Writing DNA captured yet</p>
          </div>
        )}
        <button onClick={() => navigate('/onboarding?step=2')}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg border hover:opacity-80 transition-opacity"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <Dna className="w-3.5 h-3.5" />
          Redo Writing DNA
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </button>
      </SectionCard>
    </div>
  )
}
