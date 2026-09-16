import { useState, useEffect } from 'react'
import { BarChart3, Search, MousePointerClick, TrendingUp, AlertCircle, Eye, History } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Spinner, Card, CardContent, Badge, PageWrapper, PageHeader, Tabs } from '../../../shared/ui'

/**
 * SearchAnalytics — Admin dashboard showing search performance metrics.
 */
export default function SearchAnalytics() {
  const [tab, setTab] = useState('top')
  const [days, setDays] = useState(30)
  const [data, setData] = useState([])
  const [volume, setVolume] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [tab, days])

  const loadData = async () => {
    setLoading(true)

    if (tab === 'volume') {
      const { data: vol } = await supabase.rpc('get_search_analytics_volume', { p_days: days })
      setVolume(vol || [])
    } else if (tab === 'top') {
      const { data: res } = await supabase.rpc('get_search_analytics_top_queries', { p_days: days, p_limit: 50 })
      setData(res || [])
    } else if (tab === 'zero') {
      const { data: res } = await supabase.rpc('get_search_analytics_zero_results', { p_days: days, p_limit: 50 })
      setData(res || [])
    } else if (tab === 'ctr') {
      const { data: res } = await supabase.rpc('get_search_analytics_ctr', { p_days: days, p_limit: 50 })
      setData(res || [])
    } else if (tab === 'most') {
      const { data: res } = await supabase.rpc('get_search_analytics_most_viewed', { p_limit: 50 })
      setData(res || [])
    } else if (tab === 'history') {
      const { data: res } = await supabase.rpc('get_search_analytics_history', { p_days: days, p_limit: 100 })
      setData(res || [])
    }

    setLoading(false)
  }

  const totalSearches = volume.reduce((sum, d) => sum + (d.total_searches || 0), 0)
  const avgDaily = volume.length > 0 ? Math.round(totalSearches / volume.length) : 0

  return (
    <PageWrapper>
      <PageHeader
        title="Search Analytics"
        description="Understand how users search and what content gaps exist."
        icon={<BarChart3 className="text-primary" />}
      />

      {/* Time range selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {tab === 'most' ? 'Most viewed is all-time:' : 'Time range:'}
        </span>
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            disabled={tab === 'most'}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              days === d ? 'bg-primary-500 text-white shadow-xs' : 'bg-neutral-100 dark:bg-[#14221b] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200/60 dark:border-[#1a2e23]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-neutral-200/80 dark:border-[#1a2e23] mb-6 overflow-x-auto custom-scrollbar">
        {[
          { key: 'top', label: 'Top Queries', icon: TrendingUp },
          { key: 'history', label: 'Search Log', icon: History },
          { key: 'zero', label: 'Zero Results', icon: AlertCircle },
          { key: 'ctr', label: 'Click-Through', icon: MousePointerClick },
          { key: 'most', label: 'Most Viewed', icon: Eye },
          { key: 'volume', label: 'Volume', icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              tab === key
                ? 'border-primary-500 dark:border-emerald-400 text-primary-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tab === 'volume' ? (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-2xl sm:text-3xl font-display font-bold text-primary-600 dark:text-emerald-400">{totalSearches.toLocaleString()}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Total Searches</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-2xl sm:text-3xl font-display font-bold text-primary-600 dark:text-emerald-400">{avgDaily.toLocaleString()}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Avg Daily Searches</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-2xl sm:text-3xl font-display font-bold text-primary-600 dark:text-emerald-400">{volume.length}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Active Days</p>
              </CardContent>
            </Card>
          </div>

          {/* Simple bar visualization */}
          <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] p-5 shadow-xs">
            <h4 className="text-sm font-display font-bold text-neutral-800 dark:text-neutral-200 mb-4">Daily Search Volume</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {volume.slice(0, 30).map((d) => {
                const max = Math.max(...volume.map(v => v.total_searches || 1))
                const pct = ((d.total_searches || 0) / max) * 100
                return (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 w-20 flex-shrink-0 font-mono">
                      {new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-5 bg-neutral-100 dark:bg-[#14221b] rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary-500/40 dark:bg-emerald-500/40 rounded-lg"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 w-12 text-right font-mono">{d.total_searches}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0f1a14] rounded-2xl border border-neutral-200/80 dark:border-[#1a2e23] overflow-hidden shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50/80 dark:bg-[#14221b]/80 border-b border-neutral-200/80 dark:border-[#1a2e23]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Query</th>
                {tab === 'top' && (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Searches</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Avg Results</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Avg Latency</th>
                  </>
                )}
                {tab === 'history' && (
                  <>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Results Shown</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Latency</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Cache Hit</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Time</th>
                  </>
                )}
                {tab === 'zero' && (
                  <>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Last Searched</th>
                  </>
                )}
                {tab === 'ctr' && (
                  <>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Searches</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                  </>
                )}
                {tab === 'most' && (
                  <>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-[#1a2e23]">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50/80 dark:hover:bg-[#14221b]/60 transition-colors">
                  <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500 text-xs font-mono">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 max-w-xs truncate" dir="auto">
                    {tab === 'most' ? row.title : row.query}
                  </td>
                  {tab === 'top' && (
                    <>
                      <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300 font-mono">{row.search_count}</td>
                      <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300 font-mono">{row.avg_results}</td>
                      <td className="px-4 py-3 text-right text-neutral-500 dark:text-neutral-400 font-mono">{row.avg_latency}ms</td>
                    </>
                  )}
                  {tab === 'history' && (
                    <>
                      <td className="px-4 py-3 text-left">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          row.username === 'Guest' ? 'bg-neutral-100 dark:bg-[#14221b] text-neutral-600 dark:text-neutral-400' : 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-emerald-300'
                        }`}>
                          {row.username}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300 font-mono">
                        {row.results_count === 0 ? (
                          <Badge variant="error" className="text-xs">0</Badge>
                        ) : (
                          row.results_count
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 dark:text-neutral-400 font-mono">
                        {row.latency_ms ? `${row.latency_ms}ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.cache_hit ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">Hit</span>
                        ) : (
                          <span className="text-neutral-400 text-xs font-medium bg-neutral-100 dark:bg-[#14221b] px-2 py-0.5 rounded-full border border-neutral-200/60 dark:border-[#1a2e23]">Miss</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500 text-xs">
                        {row.created_at ? new Date(row.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }) : '—'}
                      </td>
                    </>
                  )}
                  {tab === 'zero' && (
                    <>
                      <td className="px-4 py-2 text-right">
                        <Badge variant="destructive" className="text-xs">{row.search_count}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500 text-xs">
                        {row.last_searched && new Date(row.last_searched).toLocaleDateString()}
                      </td>
                    </>
                  )}
                  {tab === 'ctr' && (
                    <>
                      <td className="px-4 py-2 text-right text-gray-600">{row.searches}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{row.clicks}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-xs font-medium ${
                          Number(row.ctr) > 50 ? 'text-green-600' : Number(row.ctr) > 20 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {row.ctr}%
                        </span>
                      </td>
                    </>
                  )}
                  {tab === 'most' && (
                    <>
                      <td className="px-4 py-2 text-gray-500 text-xs">{row.dar_ul_ifta || '—'}</td>
                      <td className="px-4 py-2 text-right font-semibold text-primary">{Number(row.view_count || 0).toLocaleString()}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No data for this period.
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
