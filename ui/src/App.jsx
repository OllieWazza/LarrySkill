import { useEffect, useState, useRef } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import {
  BarChart3, PenTool, Settings, LayoutDashboard, Zap, CreditCard,
  Calendar, UserCog, Sparkles, Flame, TrendingUp, Eye, Lightbulb,
  Share2, ExternalLink, ChevronUp, Users, RotateCcw, Crown
} from 'lucide-react'

const navSections = [
  {
    label: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/queue',     icon: Calendar,         label: 'Queue' },
      { to: '/analytics', icon: BarChart3,         label: 'Analytics' },
      { to: '/context',   icon: UserCog,           label: 'Context' },
    ],
  },
  {
    label: 'Create',
    items: [
      { to: '/inspiration', icon: Lightbulb, label: 'Inspiration' },
      { to: '/daily-mix',   icon: Sparkles,  label: 'Daily Mix' },
      { to: '/writer',      icon: PenTool,   label: 'AI Writer' },
      { to: '/viral',       icon: Flame,     label: 'Viral Library' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { to: '/trends',   icon: TrendingUp, label: 'Trends' },
      { to: '/monitored',icon: Eye,        label: 'Monitored' },
    ],
  },
]

export default function App() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(null)
  const [xUsage, setXUsage] = useState(null)
  const [user, setUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (!data.configured) navigate('/onboarding', { replace: true })
        setCredits(data.credits)
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => { navigate('/onboarding', { replace: true }); setLoading(false) })
    // Fetch real X API usage
    fetch('/api/usage')
      .then(r => r.json())
      .then(data => { if (data.estimate) setXUsage(data.estimate) })
      .catch(() => {})
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleShare = () => {
    const tweet = encodeURIComponent('Just found Xcellent — a free X growth tool that actually works. Analytics, tweet writer, posting streaks, all running locally. No subscriptions, no data harvesting.\n\nhttps://larrybrain.com')
    window.open(`https://x.com/intent/tweet?text=${tweet}`, '_blank')
  }

  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true)
      setTimeout(() => setResetConfirm(false), 4000)
      return
    }
    try {
      await fetch('/api/config/reset', { method: 'POST' })
    } catch {}
    navigate('/onboarding', { replace: true })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
        <Zap className="w-5 h-5 text-white" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      <aside className="w-60 border-r flex flex-col fixed h-full" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg)' }}>

        {/* Logo */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Zap className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[15px] tracking-tight">Xcellent</h1>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Free X Growth Tool</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-4">

          {/* Create a post CTA */}
          <button
            onClick={() => navigate('/writer')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
          >
            <PenTool className="w-4 h-4" />
            Create a post
          </button>

          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider"
                   style={{ color: 'var(--color-text-muted)' }}>
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                        isActive ? 'nav-active' : ''
                      }`
                    }
                    style={({ isActive }) => ({ color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)' })}
                  >
                    <Icon className="w-[17px] h-[17px] shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Unlock More */}
          <div className="space-y-0.5">
            <NavLink to="/upgrade"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                  isActive ? 'nav-active' : ''
                }`
              }
              style={({ isActive }) => ({ color: isActive ? 'var(--color-primary)' : 'var(--color-primary)', opacity: isActive ? 1 : 0.75 })}
            >
              <Crown className="w-[17px] h-[17px] shrink-0" />
              Unlock More
            </NavLink>
          </div>

          {/* Settings nav item */}
          <div className="space-y-0.5">
            <NavLink to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                  isActive ? 'nav-active' : ''
                }`
              }
              style={({ isActive }) => ({ color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)' })}
            >
              <Settings className="w-[17px] h-[17px] shrink-0" />
              Settings
            </NavLink>
          </div>
        </nav>

        {/* Bottom area */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--color-border-subtle)' }}>

          {/* API Credits */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                <CreditCard className="w-3 h-3" /> X API Usage
              </span>
              <span className="text-[11px] font-mono font-semibold text-primary">
                {xUsage ? `~$${xUsage.estimatedCost.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
              <div className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, xUsage ? (xUsage.usage / xUsage.cap) * 100 : 1)}%` }} />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {xUsage ? `${xUsage.usage.toLocaleString()} / ${xUsage.cap.toLocaleString()} reads` : 'Loading...'} · resets day {xUsage?.resetDay || '—'}
            </p>
            <a href="https://docs.x.com/x-api/getting-started/pricing" target="_blank" rel="noopener noreferrer"
              className="text-[10px] mt-1 block hover:underline" style={{ color: 'var(--color-primary)' }}>
              Charged by X, not Xcellent · View pricing →
            </a>
          </div>

          {/* Tell others */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors duration-150 hover:bg-white/5 relative"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            Tell others about Xcellent
            {shareToast && (
              <span className="absolute right-3 text-[11px] font-semibold" style={{ color: 'var(--color-success)' }}>
                Copied!
              </span>
            )}
          </button>

          {/* User profile section */}
          {user && (
            <div ref={profileRef} className="relative">
              {/* Profile dropdown */}
              {profileOpen && (
                <div
                  className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden shadow-xl z-50"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <a
                    href="https://x.com/oliverhenry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    Follow the creator
                  </a>
                  <a
                    href="https://discord.com/invite/clawd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    Join the community
                  </a>
                  <button
                    onClick={() => { navigate('/settings'); setProfileOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] hover:bg-white/5 transition-colors text-left"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    Account Settings
                  </button>
                  <div className="border-t my-1" style={{ borderColor: 'var(--color-border-subtle)' }} />
                  <button
                    onClick={() => { handleReset(); setProfileOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] hover:bg-white/5 transition-colors text-left"
                    style={{ color: resetConfirm ? 'var(--color-danger)' : 'var(--color-text-muted)' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    {resetConfirm ? 'Click again to confirm reset' : 'Reset'}
                  </button>
                </div>
              )}

              {/* Profile button */}
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors duration-150"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(user.name || user.username || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-medium truncate">{user.name || user.username}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>@{user.username}</p>
                </div>
                <ChevronUp
                  className="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                  style={{
                    color: 'var(--color-text-muted)',
                    transform: profileOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  }}
                />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 ml-60 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
