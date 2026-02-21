import { Crown, ExternalLink, Check, Lock } from 'lucide-react'

const SUPERX_LINK = 'https://superx.so/?via=oliver'

const freeFeatures = [
  'Full analytics with complete tweet history',
  'AI tweet writer in your voice',
  'Posting streak tracking (full history)',
  'Niche discovery & trend monitoring',
  'Schedule posts (via Postiz)',
  'Runs locally, your data stays yours',
  'No subscription needed',
]

const proFeatures = [
  { name: '10M+ Tweet Library', desc: 'Browse and search millions of viral tweets for inspiration' },
  { name: 'Powerful Engage Tool', desc: 'Reply to mentions, trends, and lists to grow your audience' },
  { name: 'Auto Retweet', desc: 'Automatically retweet your best content on a schedule' },
  { name: 'Auto Plug', desc: 'Auto-reply to your viral tweets with your link or CTA' },
  { name: 'Auto Delete', desc: 'Remove underperforming posts automatically' },
  { name: 'Auto DM', desc: 'Send automated DMs to new followers or engagers' },
  { name: 'AI Thread Writer', desc: 'Generate full threads with AI, not just single tweets' },
  { name: 'Cross-post to Bluesky', desc: 'Publish to X and Bluesky simultaneously' },
  { name: 'Access from any device', desc: 'Cloud-based dashboard, works from phone or any browser' },
]

export default function Upgrade() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2 pt-4">
        <Crown className="w-10 h-10 mx-auto" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-bold">Xcellent is free forever. Want automation?</h1>
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          Xcellent covers analytics, writing, and discovery. SuperX adds the automation layer.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Free column */}
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="text-[15px] font-bold flex items-center gap-2">
              Xcellent
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'oklch(0.72 0.19 155 / 0.15)', color: 'var(--color-success)' }}>
                FREE
              </span>
            </h2>
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>Everything you need to grow</p>
          </div>
          <div className="space-y-2.5">
            {freeFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pro column */}
        <div className="card p-5 space-y-4" style={{ border: '1px solid var(--color-primary)', background: 'oklch(0.65 0.19 250 / 0.03)' }}>
          <div>
            <h2 className="text-[15px] font-bold flex items-center gap-2">
              SuperX
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'oklch(0.65 0.19 250 / 0.15)', color: 'var(--color-primary)' }}>
                $39/mo
              </span>
            </h2>
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>Add automation on top</p>
          </div>
          <div className="space-y-3">
            {proFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <span className="text-[13px] font-medium text-white">{f.name}</span>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            href={SUPERX_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
          >
            Try SuperX — $39/mo
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <p className="text-[11px] text-center px-8" style={{ color: 'var(--color-text-muted)' }}>
        Xcellent will always be free. SuperX is a separate product for creators who want full automation.
        We earn a small commission if you sign up through our link.
      </p>
    </div>
  )
}
