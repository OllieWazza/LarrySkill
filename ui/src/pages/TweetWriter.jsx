import { useState } from 'react'
import { PenTool, Sparkles, Send, Copy, Check, RefreshCw, Sliders } from 'lucide-react'

export default function TweetWriter() {
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('engaging')
  const [drafts, setDrafts] = useState([])
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(null)
  const [scheduling, setScheduling] = useState(null)

  const styles = [
    { value: 'engaging', label: '🔥 Engaging', desc: 'Hooks + value' },
    { value: 'thread', label: '🧵 Thread Opener', desc: 'Start a thread' },
    { value: 'hot-take', label: '🌶️ Hot Take', desc: 'Spicy opinion' },
    { value: 'educational', label: '📚 Educational', desc: 'Teach something' },
    { value: 'personal', label: '💭 Personal', desc: 'Story or reflection' },
    { value: 'promotional', label: '📣 Promotional', desc: 'Soft sell' },
  ]

  const generate = async () => {
    if (!topic.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/writer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style })
      })
      const data = await res.json()
      setDrafts(data.drafts || [])
    } catch {}
    setGenerating(false)
  }

  const copyText = (text, i) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  const scheduleTweet = async (text, i) => {
    setScheduling(i)
    try {
      await fetch('/api/writer/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
    } catch {}
    setScheduling(null)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Tweet Writer</h1>
        <p className="text-sm text-gray-500">Advanced drafting — styles, threads, and scheduling</p>
      </div>

      {/* Input */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Topic or brief — e.g. 'Why AI tools are overrated', 'Tips for getting your first 1000 followers', 'Building in public lessons'"
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Style</label>
          <div className="grid grid-cols-3 gap-2">
            {styles.map(s => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`p-3 rounded-lg text-left transition-all ${
                  style === s.value 
                    ? 'bg-primary/10 border border-primary/30 text-white' 
                    : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={generating || !topic.trim()}
          className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {generating ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate 3 Drafts</>
          )}
        </button>
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Generated Drafts</h3>
          {drafts.map((draft, i) => (
            <div key={i} className="glass-card rounded-xl p-5">
              <p className="text-sm text-gray-200 whitespace-pre-wrap mb-4">{draft.text}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{draft.text.length}/280</span>
                  <div className={`w-12 h-1 rounded-full ${draft.text.length > 280 ? 'bg-danger' : draft.text.length > 250 ? 'bg-warning' : 'bg-success'}`}>
                    <div className="h-full rounded-full bg-current" style={{ width: `${Math.min(100, (draft.text.length / 280) * 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText(draft.text, i)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                  >
                    {copied === i ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    {copied === i ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => scheduleTweet(draft.text, i)}
                    disabled={scheduling === i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                  >
                    <Send className="w-3 h-3" />
                    {scheduling === i ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={generate}
            className="w-full py-2.5 border border-gray-700 hover:border-gray-500 rounded-xl text-sm text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        </div>
      )}
    </div>
  )
}
