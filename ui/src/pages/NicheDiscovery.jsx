import { useEffect, useState } from 'react'
import { Search, Users, TrendingUp, ExternalLink, Sparkles, UserPlus } from 'lucide-react'

export default function NicheDiscovery() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [suggested, setSuggested] = useState([])
  const [topAccounts, setTopAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/discover/suggested')
      .then(r => r.json())
      .then(d => {
        setSuggested(d.niches || [])
        setTopAccounts(d.topAccounts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/discover/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
    } catch {}
    setSearching(false)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Niche Discovery</h1>
        <p className="text-sm text-gray-500">Find accounts and content in your niche to learn from</p>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Search for a niche, topic, or account (e.g. 'indie hackers', 'AI tools', '@username')"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={search}
            disabled={searching || !query.trim()}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-semibold rounded-lg transition-all text-sm"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {suggested.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-500">Try:</span>
            {suggested.map(n => (
              <button
                key={n}
                onClick={() => { setQuery(n); }}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search results */}
      {results && (
        <div className="space-y-4">
          {/* Accounts */}
          {results.accounts?.length > 0 && (
            <div className="glass-card rounded-xl">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Accounts in this niche
                </h3>
              </div>
              <div className="divide-y divide-gray-800/50">
                {results.accounts.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-800/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                      {a.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-gray-500">@{a.username}</p>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">{a.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono">{a.followers?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">followers</p>
                    </div>
                    <a href={`https://x.com/${a.username}`} target="_blank" rel="noopener" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending tweets */}
          {results.tweets?.length > 0 && (
            <div className="glass-card rounded-xl">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" /> Top tweets for "{query}"
                </h3>
              </div>
              <div className="divide-y divide-gray-800/50">
                {results.tweets.map((t, i) => (
                  <div key={i} className="p-4 hover:bg-gray-800/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-300">@{t.author}</span>
                      <span className="text-xs text-gray-600">· {t.date}</span>
                    </div>
                    <p className="text-sm text-gray-200 mb-2">{t.text}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{t.impressions?.toLocaleString()} views</span>
                      <span>{t.likes} likes</span>
                      <span>{t.retweets} RTs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.accounts?.length === 0 && results.tweets?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No results found. Try a different search term.</p>
            </div>
          )}
        </div>
      )}

      {/* Pre-loaded top accounts (before search) */}
      {!results && topAccounts.length > 0 && (
        <div className="glass-card rounded-xl">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warning" /> Recommended accounts to watch
            </h3>
            <p className="text-xs text-gray-500 mt-1">Based on accounts similar to yours</p>
          </div>
          <div className="divide-y divide-gray-800/50">
            {topAccounts.map((a, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-800/20 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                  {a.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{a.name}</p>
                    <p className="text-xs text-gray-500">@{a.username}</p>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1">{a.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono">{a.followers?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">followers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
