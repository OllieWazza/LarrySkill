import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, ArrowRight, ArrowLeft, CheckCircle2, ExternalLink, X, Heart,
  Search, Plus, Trash2, Sparkles
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
// Step order: Connect X → Writing DNA → About You → Interests → Creators → Products → Postiz → Launch
const STEPS = [
  'Connect X', 'Writing DNA', 'About You',
  'Interests', 'Creators', 'Products', 'Postiz', 'Launch'
]

const TWEETS = [
  {
    style: 'Hot take',
    author: 'Tech Observer',
    handle: 'techobserver',
    text: 'How in the frick does @HuggingFace make money? They host literally everyone\'s AI models. They don\'t ask for an API key when using their API for free. They don\'t charge me when I run a model either. ????????',
  },
  {
    style: 'Story format',
    author: 'Founder Stories',
    handle: 'founderstories',
    text: '> be Judy Faulkner\n> self taught Fortran in college\n> age 35\n> start Human Services Computing in \'79\n> $70k from friends n family\n> refuse VC, private for 4+ decades\n> rebrand to Epic, grow into #1 EHR\n> now 81, still CEO, net worth ~$7.8B\n> third-richest self-made woman',
  },
  {
    style: 'Short observation',
    author: 'Casual Thoughts',
    handle: 'casualthoughts',
    text: 'one thing about the japanese, they will develop a special interest in something and then do it better than you',
  },
  {
    style: 'Prediction',
    author: 'Culture Watcher',
    handle: 'culturewatcher',
    text: 'Calling it now: The swing away from optimization culture is going to be one of the bigger trends of the next decade',
  },
  {
    style: 'Thread opener',
    author: 'Growth Analyst',
    handle: 'growthanalyst',
    text: 'I spent 6 months studying viral tweets. Here\'s what actually works (not what gurus tell you):',
  },
  {
    style: 'Personal story',
    author: 'Solo Builder',
    handle: 'solobuilder',
    text: 'Quit my job 2 years ago to build in public. Best decision I ever made. Here\'s what nobody tells you about going solo:',
  },
  {
    style: 'Contrarian',
    author: 'Hot Takes Only',
    handle: 'hottakesonly',
    text: 'Unpopular opinion: Most productivity advice makes you less productive. Your brain isn\'t a machine to optimize.',
  },
  {
    style: 'Educational',
    author: 'SaaS Lessons',
    handle: 'saaslessons',
    text: 'The difference between $0 and $10K MRR isn\'t your product. It\'s distribution. Here\'s how to think about it:',
  },
  {
    style: 'Relatable',
    author: 'Night Owl Dev',
    handle: 'nightowldev',
    text: 'Me: I should go to bed early tonight\nAlso me at 2am: *researching how submarines work*',
  },
  {
    style: 'Bold claim',
    author: 'Builder Mindset',
    handle: 'buildermindset',
    text: 'Building a $1M business in 2026 is easier than ever. The hard part isn\'t the building. It\'s choosing what to build.',
  },
  {
    style: 'Question hook',
    author: 'Reflections',
    handle: 'reflections',
    text: 'What\'s one piece of advice you\'d give your 20-year-old self? I\'ll go first:',
  },
  {
    style: 'Data-driven',
    author: 'Tweet Science',
    handle: 'tweetscience',
    text: 'I analyzed 10,000 viral tweets. The #1 pattern? They all start with a pattern interrupt in the first 5 words.',
  },
]

const ENCOURAGEMENTS = [
  'Let\'s find your tweet style! 🎯',
  'Keep going, you\'re doing great!',
  'Great choices so far! 🔥',
  'Nice taste — we\'re learning a lot!',
  'Almost halfway there!',
  'You have excellent taste.',
  'Nearly done — almost there! 🚀',
  'Last few — make them count!',
]

const INTEREST_CATEGORIES = [
  { label: 'Business', tags: ['Startups', 'Investing', 'Marketing', 'Sales', 'Leadership', 'Entrepreneurship'] },
  { label: 'Technology', tags: ['AI/ML', 'Web3', 'SaaS', 'Cybersecurity', 'DevOps', 'Mobile'] },
  { label: 'Creativity', tags: ['Design', 'Writing', 'Photography', 'Music', 'Film', 'Art'] },
  { label: 'Lifestyle', tags: ['Fitness', 'Travel', 'Food', 'Fashion', 'Wellness', 'Mindfulness'] },
  { label: 'Science', tags: ['Physics', 'Biology', 'Space', 'Climate', 'Medicine', 'Psychology'] },
  { label: 'Finance', tags: ['Crypto', 'Stocks', 'Real Estate', 'Personal Finance', 'Economics', 'Trading'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  // All onboarding state
  const [dnaLiked, setDnaLiked] = useState([])
  const [dnaPassed, setDnaPassed] = useState([])
  const [aboutYou, setAboutYou] = useState('')
  const [interests, setInterests] = useState([])
  const [creators, setCreators] = useState([])
  const [products, setProducts] = useState([{ name: '', url: '', description: '' }])
  const [config, setConfig] = useState({
    bearerToken: '', apiKey: '', apiSecret: '',
    accessToken: '', accessSecret: '', username: '', postizKey: ''
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  // Auto-detect state (populated after step 0 Connect X succeeds)
  const [autoDetect, setAutoDetect] = useState(null)
  const [autoDetecting, setAutoDetecting] = useState(false)

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()
      setTestResult(data)
      if (data.success) {
        // Trigger auto-detect after successful connection
        setTimeout(() => runAutoDetect(), 800)
        setTimeout(next, 1200)
      }
    } catch {
      setTestResult({ success: false, error: 'Could not connect to server' })
    }
    setTesting(false)
  }

  const runAutoDetect = async () => {
    setAutoDetecting(true)
    try {
      const res = await fetch('/api/context/auto-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      })
      const data = await res.json()
      if (!data.error) {
        setAutoDetect(data)
        // Pre-populate About You from X bio
        if (data.bio && !aboutYou) setAboutYou(data.bio)
        // Pre-select detected interests
        if (data.detectedInterests?.length > 0) {
          setInterests(prev => {
            const merged = [...new Set([...prev, ...data.detectedInterests])]
            return merged
          })
        }
      }
    } catch {}
    setAutoDetecting(false)
  }

  const saveAndLaunch = async () => {
    setSaving(true)
    const fullConfig = {
      ...config,
      writingDNA: { liked: dnaLiked, passed: dnaPassed },
      aboutYou,
      interests,
      favouriteCreators: creators.map(c => c.handle),
      monitoredAccounts: creators.map(c => c.handle),
      products: products.filter(p => p.name.trim()),
    }
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig)
      })
    } catch (e) {
      console.error('Failed to save config', e)
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Progress bar */}
      <div className="w-full h-0.5" style={{ background: 'var(--color-border-subtle)' }}>
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5 pt-4 relative z-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step ? 'bg-primary w-6' : i < step ? 'w-1.5' : 'w-1.5'
            }`}
            style={{
              background: i === step
                ? 'var(--color-primary)'
                : i < step
                  ? 'oklch(0.65 0.19 250 / 0.4)'
                  : 'var(--color-border)'
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-xl">

          {/* Step 0: Connect X (FIRST — needed for auto-detect) */}
          {step === 0 && (
            <StepCredentials
              config={config} setConfig={setConfig}
              testing={testing} testResult={testResult}
              autoDetecting={autoDetecting}
              onTest={testConnection} onNext={next} onBack={back}
            />
          )}
          {/* Step 1: Writing DNA */}
          {step === 1 && (
            <StepWritingDNA
              liked={dnaLiked}
              passed={dnaPassed}
              onLike={(i) => setDnaLiked(p => [...p, i])}
              onPass={(i) => setDnaPassed(p => [...p, i])}
              onNext={next}
              onBack={back}
            />
          )}
          {/* Step 2: About You (pre-filled from X bio) */}
          {step === 2 && (
            <StepAboutYou
              value={aboutYou}
              onChange={setAboutYou}
              autoDetected={!!autoDetect?.bio && aboutYou === autoDetect?.bio}
              onNext={next}
              onBack={back}
            />
          )}
          {/* Step 3: Interests (pre-selected from tweet analysis) */}
          {step === 3 && (
            <StepInterests
              selected={interests}
              detectedInterests={autoDetect?.detectedInterests || []}
              onToggle={(tag) => {
                setInterests(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])
              }}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 4 && (
            <StepCreators creators={creators} setCreators={setCreators} onNext={next} onBack={back} />
          )}
          {step === 5 && (
            <StepProducts products={products} setProducts={setProducts} onNext={next} onBack={back} />
          )}
          {step === 6 && (
            <StepPostiz
              config={config} setConfig={setConfig}
              onNext={next} onBack={back}
            />
          )}
          {step === 7 && (
            <StepLaunch username={config.username} saving={saving} onLaunch={saveAndLaunch} />
          )}

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 0: Connect X (moved first so auto-detect can run)
// ─────────────────────────────────────────────────────────────────────────────
function StepCredentials({ config, setConfig, testing, testResult, autoDetecting, onTest, onNext, onBack }) {
  const set = (k) => (v) => setConfig(c => ({ ...c, [k]: v }))
  const canTest = config.bearerToken || (config.apiKey && config.apiSecret)

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">Connect to X</h2>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-[14px]">
          Enter your X API credentials — stored locally, never uploaded
        </p>
      </div>

      {/* Dev portal link */}
      <a
        href="https://developer.x.com/en/portal/dashboard"
        target="_blank"
        rel="noopener"
        className="card p-3.5 flex items-center gap-3 transition-colors hover:border-primary/40"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'oklch(0.65 0.19 250 / 0.1)' }}
        >
          <ExternalLink className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold">X Developer Portal</p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>developer.x.com → Your App → Keys & Tokens</p>
        </div>
        <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
      </a>

      {/* Pricing info */}
      <div className="card p-3.5 space-y-2" style={{ borderColor: 'oklch(0.65 0.19 250 / 0.15)' }}>
        <p className="text-[13px] font-semibold">💰 X API is pay-per-usage</p>
        <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          X charges you directly based on API calls (not Xcellent). Typical usage costs $1-5/month.
          Reads are deduped per 24h — requesting the same post twice in a day only counts once.
          Set a spending limit in your developer console to stay in control.
        </p>
        <div className="flex gap-3">
          <a href="https://docs.x.com/x-api/getting-started/pricing" target="_blank" rel="noopener"
            className="text-[11px] font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
            How pricing works →
          </a>
          <a href="https://developer.x.com/#pricing" target="_blank" rel="noopener"
            className="text-[11px] font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
            See exact rates →
          </a>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <TextField label="Your X Username" value={config.username} onChange={set('username')} placeholder="oliverhenry (without the @)" type="text" />
        <TextField label="Bearer Token" value={config.bearerToken} onChange={set('bearerToken')} placeholder="Your Bearer Token" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="API Key" value={config.apiKey} onChange={set('apiKey')} placeholder="API Key" />
          <TextField label="API Secret" value={config.apiSecret} onChange={set('apiSecret')} placeholder="API Secret" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Access Token" value={config.accessToken} onChange={set('accessToken')} placeholder="Access Token" />
          <TextField label="Access Secret" value={config.accessSecret} onChange={set('accessSecret')} placeholder="Access Secret" />
        </div>
      </div>

      {testResult && (
        <div
          className="card p-4"
          style={{ borderColor: testResult.success ? 'oklch(0.72 0.19 155 / 0.35)' : 'oklch(0.65 0.2 25 / 0.35)' }}
        >
          {testResult.success ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div>
                  <p className="text-[14px] font-semibold text-success">Connected as @{testResult.username}</p>
                  <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {testResult.followers?.toLocaleString()} followers · {testResult.tweets?.toLocaleString()} tweets
                  </p>
                </div>
              </div>
              {autoDetecting && (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                  Scanning your tweets to pre-fill the next steps…
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px]" style={{ color: 'var(--color-danger)' }}>{testResult.error}</p>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <BackButton onClick={onBack} />
        <div className="flex gap-2">
          <button
            onClick={onTest}
            disabled={testing || !canTest}
            className="px-5 py-2.5 border font-semibold rounded-xl text-[13px] transition-all duration-150 hover:bg-surface disabled:opacity-30 flex items-center gap-2"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            {testing ? <><Spinner /> Testing...</> : 'Test Connection'}
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-[13px] transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
          >
            {canTest ? 'Next' : 'Skip'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Writing DNA
// ─────────────────────────────────────────────────────────────────────────────
function StepWritingDNA({ liked, passed, onLike, onPass, onNext, onBack }) {
  const total = liked.length + passed.length
  const [anim, setAnim] = useState(null) // 'left' | 'right'
  const [entering, setEntering] = useState(false)

  const currentIndex = total < TWEETS.length ? total : null
  const encouragement = ENCOURAGEMENTS[Math.min(Math.floor(total / 1.7), ENCOURAGEMENTS.length - 1)]

  const swipe = (direction, action) => {
    if (currentIndex === null) return
    setAnim(direction)
    setTimeout(() => {
      action(currentIndex)
      setAnim(null)
      setEntering(true)
      setTimeout(() => setEntering(false), 50)
    }, 320)
  }

  const handlePass = () => swipe('left', onPass)
  const handleLike = () => swipe('right', onLike)
  const isDone = total >= TWEETS.length

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">Let's learn your writing style</h2>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-[14px]">
          Like the tweets you wish you wrote
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
          <span>{encouragement}</span>
          <span>{Math.min(total + 1, 12)} of 12</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--color-border-subtle)' }}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${(total / TWEETS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative" style={{ minHeight: 260 }}>
        {isDone ? (
          <div className="card p-8 text-center space-y-3 flex flex-col items-center justify-center" style={{ minHeight: 260 }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.72 0.19 155 / 0.12)' }}>
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <p className="text-[16px] font-semibold">Writing DNA captured! 🎉</p>
            <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
              You liked {liked.length} tweet{liked.length !== 1 ? 's' : ''} — we'll use these to learn your voice.
            </p>
          </div>
        ) : currentIndex !== null && (
          <TweetCard tweet={TWEETS[currentIndex]} animDir={anim} entering={entering} />
        )}
      </div>

      {!isDone && (
        <div className="flex items-center justify-center gap-10">
          <button
            onClick={handlePass}
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-150 hover:scale-110 active:scale-95"
            style={{ borderColor: 'var(--color-danger)', background: 'oklch(0.65 0.2 25 / 0.08)', color: 'var(--color-danger)' }}
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={handleLike}
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-150 hover:scale-110 active:scale-95"
            style={{ borderColor: 'var(--color-success)', background: 'oklch(0.72 0.19 155 / 0.08)', color: 'var(--color-success)' }}
          >
            <Heart className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <BackButton onClick={onBack} />
        <button
          onClick={onNext}
          disabled={!isDone && total === 0}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-[13px] transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2 disabled:opacity-30"
        >
          {isDone ? 'Continue' : 'Skip'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function TweetCard({ tweet, animDir, entering }) {
  const style = {
    transition: 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.32s ease',
    transform: animDir === 'left'
      ? 'translateX(-120%) rotate(-12deg)'
      : animDir === 'right'
        ? 'translateX(120%) rotate(12deg)'
        : entering
          ? 'translateX(0) scale(0.95)'
          : 'translateX(0) scale(1)',
    opacity: animDir ? 0 : 1,
  }

  return (
    <div className="card p-5 space-y-3" style={style}>
      <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
        style={{ background: 'oklch(0.65 0.19 250 / 0.12)', color: 'var(--color-primary)' }}>
        {tweet.style}
      </span>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
          {tweet.author[0]}
        </div>
        <div>
          <p className="text-[14px] font-semibold">{tweet.author}</p>
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>@{tweet.handle}</p>
        </div>
      </div>
      <p className="text-[14px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
        {tweet.text}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: About You (pre-filled from X bio)
// ─────────────────────────────────────────────────────────────────────────────
function StepAboutYou({ value, onChange, autoDetected, onNext, onBack }) {
  const max = 500
  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">About You</h2>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-[14px]">
          Tell us a bit about you to personalize content suggestions
        </p>
      </div>

      {autoDetected && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'oklch(0.65 0.19 250 / 0.06)', border: '1px solid oklch(0.65 0.19 250 / 0.2)' }}>
          <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <p className="text-[12px]" style={{ color: 'var(--color-primary)' }}>
            Auto-detected from your X account ✨ — edit freely
          </p>
        </div>
      )}

      <div className="card p-5 space-y-2">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value.slice(0, max))}
          placeholder="I'm a founder building in the AI space. I write about startups, technology, and personal growth..."
          rows={5}
          className="w-full text-[14px] rounded-lg px-3.5 py-3 border resize-none transition-all duration-150"
          style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
        />
        <div className="flex justify-end">
          <span className="text-[11px]" style={{ color: value.length > max * 0.9 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
            {value.length}/{max}
          </span>
        </div>
      </div>

      <div className="rounded-xl p-4 flex gap-3"
        style={{ background: 'oklch(0.65 0.19 250 / 0.06)', border: '1px solid oklch(0.65 0.19 250 / 0.15)' }}>
        <span className="text-lg shrink-0">💡</span>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Tip:</span> Include your interests, expertise, and what you typically post about. The more specific, the better our recommendations will be.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <BackButton onClick={onBack} />
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-[13px] transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
        >
          Continue <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Interests (pre-selected from tweet analysis)
// ─────────────────────────────────────────────────────────────────────────────
function StepInterests({ selected, detectedInterests, onToggle, onNext, onBack }) {
  const hasAutoDetected = detectedInterests.length > 0 && selected.some(t => detectedInterests.includes(t))

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">Your Interests</h2>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-[14px]">
          Select topics to personalize your content
        </p>
      </div>

      {hasAutoDetected && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'oklch(0.65 0.19 250 / 0.06)', border: '1px solid oklch(0.65 0.19 250 / 0.2)' }}>
          <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <p className="text-[12px]" style={{ color: 'var(--color-primary)' }}>
            Auto-detected from your X account ✨ — adjust as needed
          </p>
        </div>
      )}

      <div className="space-y-4">
        {INTEREST_CATEGORIES.map(({ label, tags }) => (
          <div key={label}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
              {label}
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const active = selected.includes(tag)
                const detected = detectedInterests.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => onToggle(tag)}
                    className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 border"
                    style={{
                      background: active ? 'oklch(0.65 0.19 250 / 0.15)' : 'var(--color-surface)',
                      borderColor: active ? 'var(--color-primary)' : 'var(--color-border-subtle)',
                      color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {detected && !active ? '✨ ' : ''}{tag}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="text-[12px] text-center" style={{ color: 'var(--color-text-muted)' }}>
          {selected.length} topic{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}

      <div className="flex justify-between items-center">
        <BackButton onClick={onBack} />
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-[13px] transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
        >
          {selected.length === 0 ? 'Skip' : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Favourite Creators
// ─────────────────────────────────────────────────────────────────────────────
function StepCreators({ creators, setCreators, onNext, onBack }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    setError('')
    setResults([])
    try {
      const res = await fetch(`/api/discover/search?q=${encodeURIComponent(query)}&type=users`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      const users = data.users || data.results || data || []
      setResults(Array.isArray(users) ? users.slice(0, 5) : [])
    } catch {
      setError('Search unavailable — enter a handle manually')
    }
    setSearching(false)
  }

  const addManual = () => {
    if (!query.trim() || creators.length >= 3) return
    const handle = query.replace(/^@/, '').trim()
    if (!creators.find(c => c.handle === handle)) {
      setCreators(p => [...p, { handle, name: handle, avatar: null }])
    }
    setQuery('')
    setResults([])
  }

  const addCreator = (user) => {
    if (creators.length >= 3) return
    const handle = user.username || user.handle || user.screen_name || user.name
    if (!creators.find(c => c.handle === handle)) {
      setCreators(p => [...p, { handle, name: user.name || handle, avatar: user.profile_image_url || null }])
    }
    setResults([])
    setQuery('')
  }

  const remove = (handle) => setCreators(p => p.filter(c => c.handle !== handle))

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">Your Favourite Creators</h2>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-[14px]">
          Choose up to 3 Twitter/X accounts whose style you admire
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="@handle or name..."
            className="flex-1 px-3.5 py-2.5 rounded-lg text-[13px] border transition-all duration-150"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
          />
          <button
            onClick={search}
            disabled={searching || creators.length >= 3}
            className="px-4 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg text-[13px] transition-all duration-150 hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
          >
            {searching ? <Spinner /> : <Search className="w-3.5 h-3.5" />}
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between">
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
            <button
              onClick={addManual}
              disabled={creators.length >= 3}
              className="text-[12px] font-medium px-3 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--color-primary)', background: 'oklch(0.65 0.19 250 / 0.08)' }}
            >
              Add @{query.replace(/^@/, '')}
            </button>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1 pt-1">
            {results.map((u, i) => {
              const handle = u.username || u.handle || u.screen_name
              const name = u.name || handle
              return (
                <button
                  key={i}
                  onClick={() => addCreator(u)}
                  disabled={creators.length >= 3 || creators.find(c => c.handle === handle)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-surface-hover disabled:opacity-40"
                  style={{ background: 'var(--color-bg-secondary)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">{name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>@{handle}</p>
                  </div>
                  <Plus className="w-4 h-4 ml-auto" style={{ color: 'var(--color-text-muted)' }} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[12px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          Selected Voices ({creators.length}/3)
        </p>
        {[0, 1, 2].map(i => {
          const c = creators[i]
          return (
            <div key={i} className="card p-3.5 flex items-center gap-3"
              style={{ borderStyle: c ? 'solid' : 'dashed', opacity: c ? 1 : 0.5 }}>
              {c ? (
                <>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                    {c.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold">{c.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>@{c.handle}</p>
                  </div>
                  <button onClick={() => remove(c.handle)} className="p-1.5 rounded-lg transition-colors hover:bg-danger/10">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                  </button>
                </>
              ) : (
                <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Search to add</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl p-4 flex gap-3"
        style={{ background: 'oklch(0.65 0.19 250 / 0.06)', border: '1px solid oklch(0.65 0.19 250 / 0.15)' }}>
        <span className="text-lg shrink-0">🎯</span>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Why this matters:</span> We'll analyze the writing style of these accounts to help generate content that matches voices you admire.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <BackButton onClick={onBack} />
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-[13px] transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
        >
          {creators.length === 0 ? 'Skip' : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Products
// ─────────────────────────────────────────────────────────────────────────────
function StepProducts({ products, setProducts, onNext, onBack }) {
  const update = (i, field, val) =>
    setProducts(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const addProduct = () => {
    if (products.length < 3) setProducts(p => [...p, { name: '', url: '', description: '' }])
  }

  const removeProduct = (i) => setProducts(p => p.filter((_, idx) => idx !== i))
  const hasAny = products.some(p => p.name.trim())

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">What are you building?</h2>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-[14px]">
          Tell us about your products so we can help promote them naturally
        </p>
      </div>

      <div className="space-y-3">
        {products.map((p, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>Product {i + 1}</p>
              {i > 0 && (
                <button onClick={() => removeProduct(i)} className="p-1 rounded-lg hover:bg-danger/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                </button>
              )}
            </div>
            <TextField label="Product Name" value={p.name} onChange={v => update(i, 'name', v)} placeholder="e.g. Xcellent" />
            <TextField label="URL" value={p.url} onChange={v => update(i, 'url', v)} placeholder="e.g. https://xcellent.app" />
            <TextField label="One-line description" value={p.description} onChange={v => update(i, 'description', v)} placeholder="e.g. Free X growth tool" />
          </div>
        ))}

        {products.length < 3 && (
          <button onClick={addProduct}
            className="w-full card p-3.5 flex items-center justify-center gap-2 text-[13px] font-medium transition-all hover:border-primary/40"
            style={{ color: 'var(--color-text-secondary)', borderStyle: 'dashed' }}>
            <Plus className="w-4 h-4" /> Add another product
          </button>
        )}
      </div>

      <div className="rounded-xl p-4 flex gap-3"
        style={{ background: 'oklch(0.65 0.19 250 / 0.06)', border: '1px solid oklch(0.65 0.19 250 / 0.15)' }}>
        <span className="text-lg shrink-0">✨</span>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          The AI writer will occasionally weave in natural mentions of your products.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <BackButton onClick={onBack} />
        <button onClick={onNext}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-[13px] transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2">
          {hasAny ? 'Continue' : 'Skip'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 6: Postiz
// ─────────────────────────────────────────────────────────────────────────────
function StepPostiz({ config, setConfig, onNext, onBack }) {
  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">Scheduling with Postiz</h2>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-[14px]">
          Optional: Connect Postiz to schedule tweets
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <TextField
          label="Postiz API Key"
          value={config.postizKey}
          onChange={v => setConfig(c => ({ ...c, postizKey: v }))}
          placeholder="Your Postiz public key (optional)"
        />
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Find your key: Postiz Dashboard → Settings → Public API
        </p>
      </div>

      <div className="card p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">📅</span>
        <div>
          <p className="text-[13px] font-semibold">Don't have Postiz?</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Schedule posts and cross-post to 25+ platforms.{' '}
            <a href="https://postiz.pro/oliverhenry" target="_blank" rel="noopener"
              className="font-medium hover:opacity-80 inline-flex items-center gap-1"
              style={{ color: 'var(--color-primary)' }}>
              Sign up here <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <BackButton onClick={onBack} />
        <div className="flex gap-2">
          <button onClick={onNext}
            className="px-5 py-2.5 border font-semibold rounded-xl text-[13px] transition-all duration-150 hover:bg-surface"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            Skip
          </button>
          {config.postizKey && (
            <button onClick={onNext}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl text-[13px] transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2">
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 7: Launch
// ─────────────────────────────────────────────────────────────────────────────
function StepLaunch({ username, saving, onLaunch }) {
  const initial = (username || 'X')[0].toUpperCase()

  return (
    <div className="text-center space-y-8 animate-in">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto text-4xl font-extrabold text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
        {initial}
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-extrabold tracking-tight">
          Hey {username ? <span className="gradient-text">@{username}</span> : 'there'}! 👋
        </h2>
        <p className="text-[15px] leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
          You're all set and ready to grow. This is just the beginning of your journey to building an audience that matters.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
        {['✅ X connected', '✅ Writing DNA captured', '✅ Interests set'].map(line => (
          <span key={line} className="px-3 py-1.5 rounded-full text-[12px] font-medium"
            style={{ background: 'oklch(0.72 0.19 155 / 0.1)', color: 'var(--color-success)' }}>
            {line}
          </span>
        ))}
      </div>

      <button
        onClick={onLaunch}
        disabled={saving}
        className="px-12 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-2xl text-[16px] transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center gap-3 mx-auto"
      >
        {saving ? <><Spinner /> Launching...</> : <>Start Growing on X <Zap className="w-5 h-5" /></>}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────
function TextField({ label, value, onChange, placeholder, type }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <input
        type={type || 'password'}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || label}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        className="w-full px-3.5 py-2.5 rounded-lg text-[13px] border transition-all duration-150"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
      />
    </div>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[13px] px-4 py-2 rounded-lg transition-colors hover:bg-surface"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Back
    </button>
  )
}

function Spinner() {
  return <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
}
